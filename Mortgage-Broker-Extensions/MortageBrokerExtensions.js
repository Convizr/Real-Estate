// RenteVergelijker Extension
export const RenteVergelijkerExtension = {
  name: "RenteVergelijker",
  type: "response",
  match: ({ trace }) => trace.type === "Custom_RenteVergelijker",
  render: ({ trace, element }) => {
    // --- Helper functions (unchanged) ---
    function calculatePMT(ratePerMonth, nper, pv) {
      if (ratePerMonth === 0) return pv / nper;
      return (pv * ratePerMonth) / (1 - Math.pow(1 + ratePerMonth, -nper));
    }
    function estimateFees(principal) {
      return Math.round(principal * 0.01 + 500);
    }
    function transformAirtableData(airtableData) {
      return airtableData.records.map(r => ({
        country: r.fields.Country,
        bank: r.fields.Bank,
        term: r.fields.TermInYears,
        type: r.fields.MortgageType,
        nhg: r.fields.NHG === "✓",
        rate: r.fields.Rate * 100,
        source: r.fields.Source,
        dataDate: r.fields.DataDate
      }));
    }

    // --- Inject Combined Stylesheet ---
    const style = document.createElement('style');
    style.textContent = `
      /* ------------ Responsive Layout ------------ */
      @media (max-width: 600px) {
        .vf-mortgage-row { flex-direction: row; gap: 8px; }
        .vf-mortgage-col { flex:1; min-width:0 }
        .vf-mortgage-more { display:block; margin:12px 0; width:100% }
        .vf-mortgage-filters { display:none }
        .vf-mortgage-filters.vf-open { display:flex; flex-direction:column; gap:12px; margin-top:12px }
      }
      @media (min-width: 601px) {
        .vf-mortgage-row { flex-direction:row; gap:16px }
        .vf-mortgage-col { flex:1; min-width:0 }
        .vf-mortgage-more { display:none }
        .vf-mortgage-filters { display:flex !important; flex-direction:row; gap:16px }
      }

      /* ------------ Base Typography ------------ */
      .vf-mortgage-col label {
        display:block;
        font-size:1em !important;
        font-weight:600 !important;
        margin-bottom:4px;
      }
      #btn-apply {
        font-size:1em !important;
        font-weight:700 !important;
      }
      .sort-option {
        font-size:1em !important;
      }

      /* ------------ Inputs & Selects ------------ */
      .vf-loan-input-euro,
      .vf-modern-select {
        background:#f8faff !important;
        border:1px solid #d0e0ff !important;
        box-shadow:0 1px 3px #0002 !important;
        border-radius:12px !important;
        font-size:1em !important;
        padding:10px 14px !important;
        outline:none !important;
        transition: border-color 0.15s, box-shadow 0.15s !important;
      }
      .vf-loan-input-euro { padding-left:36px !important; }
      .vf-loan-input-euro:focus,
      .vf-modern-select:focus {
        border-color:#2d5fff !important;
        box-shadow:0 0 0 3px #2d5fff33 !important;
      }

      /* ------------ Buttons & Badges ------------ */
      .vf-mortgage-more,
      #btn-apply,
      .btn-select,
      .vf-loan-badge,
      .vf-loan-badge-euro {
        font-size:1em;
        font-weight:600;
      }
      #btn-apply {
        background:#2d5fff !important;
        color:#fff !important;
        border:none !important;
        border-radius:14px !important;
        padding:10px 0 !important;
        width:100% !important;
        box-shadow:0 2px 8px #2d5fff22 !important;
        cursor:pointer !important;
        margin-bottom:24px; /* 24px gap beneath filters */
      }

      /* ------------ Layout Gaps ------------ */
      #user-inputs { margin-bottom:24px; }
      #results-area { min-height:180px; }

      /* ------------ Card Grid ------------ */
      .vf-card-grid {
        display:grid;
        grid-template-columns:repeat(auto-fit,minmax(270px,1fr));
        gap:16px;
      }
    `;
    ;(element.shadowRoot || element.ownerDocument.head || element).appendChild(style);

    // --- Root Container ---
    element.innerHTML = '';
    const widgetContainer = document.createElement('div');
    widgetContainer.style.cssText = `
      font-family:Inter,Arial,sans-serif;
      max-width:600px;
      margin:0 auto;
      background:#fff;
      border-radius:16px;
      box-shadow:0 2px 16px #0001;
      padding:24px;
    `;

    // --- Filter Panel ---
    const inputPanel = document.createElement('div');
    inputPanel.id = 'user-inputs';
    inputPanel.innerHTML = `
      <div class="vf-mortgage-row" style="position:relative;">
        <div class="vf-mortgage-col">
          <label>Purchase Price
            <span title="Total price of the property." style="cursor:help;color:#888">?</span><br>
            <span class="vf-loan-input-currency-euro">
              <span>€</span>
              <input id="input-price" class="vf-loan-input-euro" type="text" placeholder="e.g. 300000" autocomplete="off" inputmode="numeric"/>
            </span>
          </label>
        </div>
        <div class="vf-mortgage-col">
          <label>Down Payment
            <span title="Amount you pay upfront." style="cursor:help;color:#888">?</span><br>
            <span class="vf-loan-input-currency-euro">
              <span>€</span>
              <input id="input-down" class="vf-loan-input-euro" type="text" placeholder="e.g. 60000" autocomplete="off" inputmode="numeric"/>
            </span>
            <span id="down-badge" class="vf-loan-badge-euro">0%</span>
          </label>
        </div>
        <button id="sort-icon" style="
            background:none;border:none;cursor:pointer;
            color:#2d5fff;font-size:1.2em;width:36px;height:36px;
            position:absolute;right:0;top:0;"
          title="Sort options">⇅</button>
      </div>

      <div class="vf-mortgage-row" style="margin-top:16px;align-items:flex-end;">
        <div class="vf-mortgage-col">
          <label>Loan Term</label>
          <select id="input-term" class="vf-modern-select">
            <option value="">Any</option>
            <option value="10">10 yrs</option>
            <option value="15">15 yrs</option>
            <option value="20">20 yrs</option>
            <option value="30">30 yrs</option>
          </select>
        </div>
        <div class="vf-mortgage-col">
          <label>Country</label>
          <select id="input-country" class="vf-modern-select"></select>
        </div>
      </div>

      <button id="btn-apply">Get Rates</button>
    `;
    widgetContainer.appendChild(inputPanel);

    // --- Results Area ---
    const resultsArea = document.createElement('div');
    resultsArea.id = 'results-area';
    widgetContainer.appendChild(resultsArea);

    // --- Loading & No-Results States ---
    function showLoading() {
      resultsArea.innerHTML = `<div style="text-align:center;color:#aaa;padding:48px 0;font-size:1.1em">Loading rates…</div>`;
    }
    function showNoResults() {
      resultsArea.innerHTML = `<div style="text-align:center;color:#888;padding:48px;border-radius:12px;background:#f8f9fb;font-size:1.1em">
        No loans found matching your criteria.
      </div>`;
    }

    // --- Card Renderer ---
    function renderCards(rates) {
      if (!rates.length) return showNoResults();
      resultsArea.innerHTML = '';
      const grid = document.createElement('div');
      grid.className = 'vf-card-grid';

      // Compute monthly, fees, score…
      const computed = rates.slice(0, cardsToShow).map(r => {
        const principal = Number(userInput.price) - Number(userInput.down) || 250000;
        const nper = (r.term||20)*12;
        const rateM = (r.rate||3)/100/12;
        const monthly = calculatePMT(rateM,nper,principal);
        const fees = r.fees||estimateFees(principal);
        return { rateObj: r, monthly, fees };
      });
      // … normalize and score…
      const mins = {
        pay: Math.min(...computed.map(c=>c.monthly)),
        fees: Math.min(...computed.map(c=>c.fees)),
        rate: Math.min(...computed.map(c=>c.rateObj.rate)),
      };
      const maxs = {
        pay: Math.max(...computed.map(c=>c.monthly)),
        fees: Math.max(...computed.map(c=>c.fees)),
        rate: Math.max(...computed.map(c=>c.rateObj.rate)),
        term: Math.max(...computed.map(c=>c.rateObj.term||0)),
      };
      computed.forEach(c => {
        const np = maxs.pay!==mins.pay ? (c.monthly-mins.pay)/(maxs.pay-mins.pay):0;
        const nf = maxs.fees!==mins.fees ? (c.fees-mins.fees)/(maxs.fees-mins.fees):0;
        const nr = maxs.rate!==mins.rate ? (c.rateObj.rate-mins.rate)/(maxs.rate-mins.rate):0;
        const nt = maxs.term?((c.rateObj.term||0)/maxs.term):0;
        c.score = 0.4*np + 0.2*nf + 0.2*nr - 0.2*nt;
      });
      let bestIdx=0, bestScore=computed[0].score;
      computed.forEach((c,i)=>{ if(c.score<bestScore){bestScore=c.score; bestIdx=i;} });

      // Build cards…
      computed.forEach((c,i)=>{
        const { rateObj, monthly, fees } = c;
        const rec = i===bestIdx;
        const card = document.createElement('div');
        card.style.cssText = `
          background:#fff; border-radius:14px;
          box-shadow:0 2px 8px #0001;
          padding:20px; display:flex;
          flex-direction:column; position:relative;
          border:2px solid ${rec ? '#2d5fff' : '#f0f0f0'};
        `;
        card.innerHTML = `
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
            <div style="width:36px;height:36px;
                        background:#f3f6ff;border-radius:8px;
                        display:flex;align-items:center;
                        justify-content:center;font-size:1.2em;
                        color:#2d5fff">🏦</div>
            <div>
              <div style="font-weight:600">${rateObj.bank||'–'}</div>
              <div style="color:#888;font-size:0.9em">${rateObj.country||''}</div>
            </div>
            ${rec?`<span style="
              background:#2d5fff;color:#fff;
              font-size:0.8em;border-radius:6px;
              padding:2px 8px;margin-left:auto">
              Recommended
            </span>`:``}
          </div>
          <div style="margin-bottom:8px">
            <span style="font-weight:700;font-size:1.2em;color:#2d5fff">
              ${rateObj.rate.toFixed(2)}%
            </span>
            <span style="margin-left:6px;color:#888">
              ${rateObj.term||'–'} yrs
            </span>
          </div>
          <div style="margin-bottom:4px">Type: <b>${rateObj.type||'–'}</b></div>
          <div style="margin-bottom:4px">NHG: <b>${rateObj.nhg?'Yes':'No'}</b></div>
          <div style="margin-bottom:4px">Monthly: <b>€${monthly.toFixed(0)}</b></div>
          <div style="margin-bottom:12px">Fees: <b>€${fees}</b></div>
          <button class="btn-select" style="
            background:#2d5fff;color:#fff;border:none;
            border-radius:8px;padding:8px;
            font-size:1em;font-weight:600;
            cursor:pointer">Choose This</button>
        `;
        card.querySelector('.btn-select').onclick = () => {
          window.VF?.events?.emit("RATE_SELECTED", {
            ...rateObj,
            monthlyPayment: monthly,
            fees
          });
        };
        grid.appendChild(card);
      });

      resultsArea.appendChild(grid);

      // Show more?
      if (rates.length > cardsToShow) {
        const more = document.createElement('button');
        more.textContent = 'Show more';
        more.style.cssText = `
          display:block;margin:24px auto 0;
          background:#f3f6ff;color:#2d5fff;
          border:none;border-radius:8px;
          padding:8px 16px;font-weight:600;
          cursor:pointer
        `;
        more.onclick = () => {
          cardsToShow += 3;
          renderCards(rates);
        };
        resultsArea.appendChild(more);
      }
    }

    // --- Filter & Sort Logic ---
    let currentRates = [], filteredRates = [];
    let activeSort = 'apr';
    let userInput = { price:'', down:'', term:'', country:'' };
    let cardsToShow = 3;

    function applyFiltersAndRender() {
      showLoading();
      setTimeout(() => {
        filteredRates = [...currentRates]
          .filter(r => userInput.country? r.country===userInput.country: true)
          .filter(r => userInput.term? String(r.term)===userInput.term: true);

        if (activeSort==='apr') filteredRates.sort((a,b)=>a.rate-b.rate);
        else if (activeSort==='payment') {
          filteredRates.sort((a,b)=>{
            const p = Number(userInput.price)-Number(userInput.down)||250000;
            return calculatePMT((a.rate/100/12),(a.term||20)*12,p) -
                   calculatePMT((b.rate/100/12),(b.term||20)*12,p);
          });
        } else if (activeSort==='fees') {
          filteredRates.sort((a,b)=> (a.fees||0)-(b.fees||0));
        }

        renderCards(filteredRates);
      }, 300);
    }

    // --- Event Listeners ---
    const ip = widgetContainer.querySelector('#input-price');
    const id = widgetContainer.querySelector('#input-down');
    const bd = widgetContainer.querySelector('#down-badge');

    function updateDownBadge() {
      const p= parseFloat(ip.value)||0, d= parseFloat(id.value)||0;
      const pct = p>0? Math.round((d/p)*100):0;
      bd.textContent = pct+'%';
    }
    ip.addEventListener('input', () => { ip.value=ip.value.replace(/\D/g,''); updateDownBadge(); });
    id.addEventListener('input', () => { id.value=id.value.replace(/\D/g,''); updateDownBadge(); });
    updateDownBadge();

    widgetContainer.querySelector('#btn-apply').onclick = () => {
      userInput.price = ip.value;
      userInput.down  = id.value;
      userInput.term  = widgetContainer.querySelector('#input-term').value;
      userInput.country = widgetContainer.querySelector('#input-country').value;
      cardsToShow = 3;
      applyFiltersAndRender();
    };

    // --- Parse Payload & Initialize ---
    try {
      const pl = typeof trace.payload==='string'? JSON.parse(trace.payload): trace.payload||{};
      if (pl.ratesApiResponse) {
        let arr = Array.isArray(pl.ratesApiResponse)? pl.ratesApiResponse: pl.ratesApiResponse.records;
        currentRates = Array.isArray(arr) && arr[0].fields
          ? transformAirtableData({ records: arr })
          : pl.ratesApiResponse;
      } else if (pl.records) {
        currentRates = transformAirtableData(pl);
      } else if (Array.isArray(pl.rates)) {
        currentRates = pl.rates;
      } else throw 0;

      // Populate countries
      const set = [...new Set(currentRates.map(r=>r.country).filter(Boolean))];
      widgetContainer.querySelector('#input-country').innerHTML = 
        '<option value="">Any</option>' + set.map(c=>`<option>${c}</option>`).join('');
      applyFiltersAndRender();
    }
    catch {
      resultsArea.innerHTML = `<div style="color:red;padding:32px;text-align:center">
        Geen rentes beschikbaar. Probeer het later opnieuw.
      </div>`;
    }

    element.appendChild(widgetContainer);
  }
};
