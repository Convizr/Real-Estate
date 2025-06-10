// RenteVergelijker Extension
export const RenteVergelijkerExtension = {
  name: "RenteVergelijker",
  type: "response",
  match: ({ trace }) => trace.type === "Custom_RenteVergelijker",
  render: ({ trace, element }) => {
    // --- Modern Mortgage Comparison UI ---
    // State
    let currentRates = [];
    let filteredRates = [];
    let activeSort = 'apr';
    let userInput = {
      price: '',
      down: '',
      term: '',
      country: ''
    };
    let loading = false;
    let cardsToShow = 3;

    // Helper: PMT calculation
    function calculatePMT(ratePerMonth, nper, pv) {
      if (ratePerMonth === 0) return pv / nper;
      return (pv * ratePerMonth) / (1 - Math.pow(1 + ratePerMonth, -nper));
    }
    function estimateFees(principal) {
      return Math.round(principal * 0.01 + 500); // simple estimate
    }

       // --- Modern Stylesheet Overrides ---
    const style = document.createElement('style');
    style.textContent = `
      /* Base typography */
      .vf-mortgage-col label { font-size: 1em !important; font-weight: 600 !important; }
      #btn-apply { font-size: 1em !important; font-weight: 700 !important; }

      /* Inputs & selects as rounded pills */
      .vf-loan-input-euro,
      .vf-modern-select {
        background: #f8faff !important;
        border: 1px solid #d0e0ff !important;
        box-shadow: 0 1px 3px #0002 !important;
        border-radius: 12px !important;
        font-size: 1em !important;
        padding: 10px 14px !important;
        outline: none !important;
        transition: border-color 0.15s, box-shadow 0.15s !important;
      }
      .vf-loan-input-euro { padding-left: 36px !important; }
      .vf-loan-input-euro:focus,
      .vf-modern-select:focus {
        border-color: #2d5fff !important;
        box-shadow: 0 0 0 3px #2d5fff33 !important;
      }

      /* Sort icon */
      #sort-icon { font-size: 1.2em !important; }

      /* Gap between filter panel and results */
      #user-inputs { margin-bottom: 24px; }

      /* Results area spacing */
      #results-area { margin-top: 0; min-height: 180px; }

      /* Override card grid gap */
      .vf-card-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(270px,1fr)); gap: 16px; }

      /* Responsive tweaks left intact… */
      @media (max-width: 600px) { /* … */ }
      @media (min-width: 601px) { /* … */ }
      /* (keep the rest of your existing media rules) */
    `;
    (element.shadowRoot || element.ownerDocument.head || element).appendChild(style);

    // --- UI Root ---
    element.innerHTML = '';
    const widgetContainer = document.createElement('div');
    widgetContainer.style.cssText = 'font-family: Inter, Arial, sans-serif; max-width:600px; width:100%; margin:0 auto; background:#fff; border-radius:16px; box-shadow:0 2px 16px #0001; padding:24px;';

    // --- Input/Filter Panel ---
    const inputPanel = document.createElement('div');
    inputPanel.id = 'user-inputs';
    inputPanel.innerHTML = `
      <div class="vf-mortgage-row" style="position:relative; gap:16px;">
        <div class="vf-mortgage-col">
          <label>Purchase Price <span title="The total price of the property you want to buy." style="cursor:help; color:#888;">?</span><br>
            <span class="vf-loan-input-currency-euro">
              <span>€</span>
              <input id="input-price" class="vf-loan-input-euro" type="text" placeholder="e.g. 300000" />
            </span>
          </label>
        </div>
        <div class="vf-mortgage-col">
          <label>Down Payment <span title="The amount you pay upfront." style="cursor:help; color:#888;">?</span><br>
            <span class="vf-loan-input-currency-euro">
              <span>€</span>
              <input id="input-down" class="vf-loan-input-euro" type="text" placeholder="e.g. 60000" />
            </span>
            <span id="down-badge" class="vf-loan-badge-euro">0%</span>
          </label>
        </div>
        <button id="sort-icon" style="background:none; border:none; cursor:pointer; color:#2d5fff; padding:0; width:36px; height:36px; position:absolute; right:0; top:0;" title="Sort options">⇅</button>
      </div>
      <div class="vf-mortgage-row" style="margin-top:14px; align-items:flex-end; gap:16px;">
        <div class="vf-mortgage-col">
          <label>Loan Term</label>
          <select id="input-term" class="vf-modern-select">
            <option value="">Any</option><option value="10">10 yrs</option><option value="15">15 yrs</option><option value="20">20 yrs</option><option value="30">30 yrs</option>
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

    // --- Loading State ---
    function showLoading() {
      resultsArea.innerHTML = `<div style="padding:48px 0; text-align:center; color:#aaa; font-size:1.2em;">Loading rates…</div>`;
    }
    // --- No Results State ---
    function showNoResults() {
      resultsArea.innerHTML = `<div style="padding:48px 0; text-align:center; color:#888; font-size:1.1em; border-radius:12px; background:#f8f9fb;">No loans found matching your criteria.</div>`;
    }

    // --- Card Renderer with Pagination and Smart Recommendation ---
    function renderCards(rates) {
      if (!Array.isArray(rates) || rates.length === 0) {
        showNoResults();
        return;
      }
      resultsArea.innerHTML = '';
      const grid = document.createElement('div');
      grid.style.cssText = 'display:grid; grid-template-columns:repeat(auto-fit,minmax(270px,1fr)); gap:18px;';
      const visibleRates = rates.slice(0, cardsToShow);

      // --- Calculate monthly, fees, and score for each card ---
      // First, compute all values for normalization
      const computed = visibleRates.map(rateObj => {
        const principal = Number(userInput.price) - Number(userInput.down) || 250000;
        const nper = (rateObj.term || 20) * 12;
        const ratePerMonth = (rateObj.rate || 3) / 100 / 12;
        const monthly = calculatePMT(ratePerMonth, nper, principal);
        const fees = rateObj.fees || estimateFees(principal);
        return { rateObj, monthly, fees };
      });
      const minPayment = Math.min(...computed.map(c => c.monthly));
      const maxPayment = Math.max(...computed.map(c => c.monthly));
      const minFees = Math.min(...computed.map(c => c.fees));
      const maxFees = Math.max(...computed.map(c => c.fees));
      const minRate = Math.min(...computed.map(c => c.rateObj.rate));
      const maxRate = Math.max(...computed.map(c => c.rateObj.rate));
      const maxTerm = Math.max(...computed.map(c => c.rateObj.term));

      // Calculate score for each card
      computed.forEach(c => {
        // Weighted score: lower is better
        // 0.4*monthly, 0.2*fees, 0.2*rate, -0.2*term (longer term is better)
        // All normalized 0-1
        const normPayment = maxPayment !== minPayment ? (c.monthly - minPayment) / (maxPayment - minPayment) : 0;
        const normFees = maxFees !== minFees ? (c.fees - minFees) / (maxFees - minFees) : 0;
        const normRate = maxRate !== minRate ? (c.rateObj.rate - minRate) / (maxRate - minRate) : 0;
        const normTerm = maxTerm ? (c.rateObj.term || 0) / maxTerm : 0;
        c.score = 0.4 * normPayment + 0.2 * normFees + 0.2 * normRate - 0.2 * normTerm;
      });
      // Find the index of the best (lowest score)
      let bestIdx = 0;
      let bestScore = computed[0].score;
      computed.forEach((c, idx) => { if (c.score < bestScore) { bestScore = c.score; bestIdx = idx; } });

      computed.forEach((c, idx) => {
        const { rateObj, monthly, fees } = c;
        const isRecommended = idx === bestIdx;
        const card = document.createElement('div');
        card.className = 'card';
        card.style.cssText = `background:#fff; border-radius:14px; box-shadow:0 2px 8px #0001; padding:20px 18px 16px 18px; display:flex; flex-direction:column; align-items:flex-start; border:2px solid ${isRecommended ? '#2d5fff' : '#f0f0f0'}; position:relative;`;
        card.innerHTML = `
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
            <div style="width:38px; height:38px; background:#f3f6ff; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:1.3em; font-weight:700; color:#2d5fff;">
              <span>🏦</span>
            </div>
            <div>
              <div style="font-size:1.1em; font-weight:600;">${rateObj.bank || '–'}</div>
              <div style="font-size:0.95em; color:#888;">${rateObj.country || ''}</div>
            </div>
            ${isRecommended ? '<span style="background:#2d5fff; color:#fff; font-size:0.85em; border-radius:6px; padding:2px 8px; margin-left:10px;">Recommended</span>' : ''}
          </div>
          <div style="margin-bottom:8px;">
            <span style="font-size:1.2em; font-weight:700; color:#2d5fff;">${typeof rateObj.rate === 'number' ? rateObj.rate.toFixed(2) + '%' : '–'}</span>
            <span style="margin-left:10px; color:#888;">${rateObj.term || '–'} yrs</span>
          </div>
          <div style="margin-bottom:6px; color:#444;">Type: <b>${rateObj.type || '–'}</b></div>
          <div style="margin-bottom:6px; color:#444;">NHG: <b>${rateObj.nhg ? 'Yes' : 'No'}</b></div>
          <div style="margin-bottom:6px; color:#444;">Monthly: <b>$${monthly ? monthly.toFixed(0) : '–'}</b></div>
          <div style="margin-bottom:10px; color:#444;">Fees: <b>$${fees}</b></div>
          <button class="btn-select" style="margin-top:auto; background:#2d5fff; color:#fff; border:none; border-radius:8px; padding:8px 18px; font-weight:600; cursor:pointer; font-size:1em;">Choose This</button>
        `;
        card.querySelector('.btn-select').addEventListener('click', () => {
          if (window.VF && window.VF.events) {
            window.VF.events.emit("RATE_SELECTED", {
              country: rateObj.country,
              bank: rateObj.bank || null,
              term: rateObj.term,
              type: rateObj.type,
              nhg: rateObj.nhg,
              rate: rateObj.rate,
              source: rateObj.source,
              dataDate: rateObj.dataDate,
              monthlyPayment: monthly,
              fees: fees
            });
          }
        });
        grid.appendChild(card);
      });
      resultsArea.appendChild(grid);
      if (rates.length > cardsToShow) {
        const showMoreBtn = document.createElement('button');
        showMoreBtn.textContent = 'Show more';
        showMoreBtn.style.cssText = 'margin:24px auto 0 auto; display:block; background:#f3f6ff; color:#2d5fff; border:none; border-radius:8px; padding:10px 28px; font-weight:600; font-size:1em; cursor:pointer;';
        showMoreBtn.onclick = () => {
          cardsToShow += 3;
          renderCards(rates);
        };
        resultsArea.appendChild(showMoreBtn);
      }
    }

    // --- Filtering, Sorting, and Apply Logic ---
    function applyFiltersAndRender() {
      loading = true;
      showLoading();
      setTimeout(() => {
        loading = false;
        filteredRates = [...currentRates];
        // Filter by country
        if (userInput.country) filteredRates = filteredRates.filter(r => r.country === userInput.country);
        // Filter by term
        if (userInput.term) filteredRates = filteredRates.filter(r => String(r.term) === String(userInput.term));
        // Sort
        if (activeSort === 'apr') filteredRates.sort((a, b) => a.rate - b.rate);
        else if (activeSort === 'payment') {
          filteredRates.sort((a, b) => {
            const principal = Number(userInput.price) - Number(userInput.down) || 250000;
            const nper = (a.term || 20) * 12;
            const nperB = (b.term || 20) * 12;
            const rA = (a.rate || 3) / 100 / 12;
            const rB = (b.rate || 3) / 100 / 12;
            return calculatePMT(rA, nper, principal) - calculatePMT(rB, nperB, principal);
          });
        } else if (activeSort === 'fees') filteredRates.sort((a, b) => (a.fees || 0) - (b.fees || 0));
        renderCards(filteredRates);
      }, 350); // simulate loading
    }

    // --- Event Listeners ---
    inputPanel.querySelector('#btn-apply').addEventListener('click', () => {
      userInput.price = inputPanel.querySelector('#input-price').value;
      userInput.down = inputPanel.querySelector('#input-down').value;
      userInput.term = inputPanel.querySelector('#input-term').value;
      userInput.country = inputPanel.querySelector('#input-country').value;
      cardsToShow = 3;
      applyFiltersAndRender();
    });

    // --- Down payment percentage badge logic ---
    const inputPrice = inputPanel.querySelector('#input-price');
    const inputDown = inputPanel.querySelector('#input-down');
    const downBadge = inputPanel.querySelector('#down-badge');

    // Add back updateDownBadge function
    function updateDownBadge() {
      const price = parseFloat(inputPrice.value);
      const down = parseFloat(inputDown.value);
      let pct = 0;
      if (price > 0 && down > 0) {
        pct = Math.round((down / price) * 100);
      }
      downBadge.textContent = isNaN(pct) ? '0%' : pct + '%';
    }

    // Numeric validation for text inputs
    function validateNumericInput(input) {
      const val = input.value;
      if (!/^\d*$/.test(val)) {
        input.value = val.replace(/[^\d]/g, '');
      }
      if (val !== '' && isNaN(Number(val))) {
        input.style.borderColor = 'red';
        input.title = 'Please enter a valid number';
      } else {
        input.style.borderColor = '';
        input.title = '';
      }
    }
    inputPrice.addEventListener('input', function() {
      validateNumericInput(inputPrice);
      updateDownBadge();
    });
    inputDown.addEventListener('input', function() {
      validateNumericInput(inputDown);
      updateDownBadge();
    });
    updateDownBadge();

    // --- Parse and Render Payload ---
    try {
      const payloadObj = typeof trace.payload === 'object' ? trace.payload : JSON.parse(trace.payload || '{}');
      // Accepts: ratesApiResponse (array or Airtable), records, or rates
      if (payloadObj.ratesApiResponse) {
        let apiResponse = payloadObj.ratesApiResponse;
        if (typeof apiResponse === 'string') apiResponse = JSON.parse(apiResponse);
        if (Array.isArray(apiResponse)) {
          if (apiResponse.length > 0 && apiResponse[0].fields) {
            currentRates = transformAirtableData({ records: apiResponse });
          } else {
            currentRates = apiResponse;
          }
        } else if (apiResponse.records) {
          currentRates = transformAirtableData(apiResponse);
        } else {
          throw new Error('Invalid ratesApiResponse format');
        }
      } else if (payloadObj.records) {
        currentRates = transformAirtableData(payloadObj);
      } else if (Array.isArray(payloadObj.rates)) {
        currentRates = payloadObj.rates;
      } else {
        throw new Error('Invalid payload format');
      }
      // Populate country dropdown
      const countrySet = new Set(currentRates.map(r => r.country).filter(Boolean));
      const countrySelect = inputPanel.querySelector('#input-country');
      countrySelect.innerHTML = '<option value="">Any</option>' + Array.from(countrySet).map(c => `<option value="${c}">${c}</option>`).join('');
      applyFiltersAndRender();
    } catch (err) {
      resultsArea.innerHTML = `<div style="color:red; padding:32px 0; text-align:center;">Geen rentes beschikbaar. Probeer het later opnieuw.</div>`;
      console.error('Error processing payload:', err);
    }

    element.appendChild(widgetContainer);

    // Helper: transform Airtable data to our format
    function transformAirtableData(airtableData) {
      if (!airtableData || !Array.isArray(airtableData.records)) {
        throw new Error("Invalid Airtable data format");
      }

      return airtableData.records.map(record => ({
        country: record.fields.Country,
        bank: record.fields.Bank,
        term: record.fields.TermInYears,
        type: record.fields.MortgageType,
        nhg: record.fields.NHG === "✓",
        rate: record.fields.Rate * 100, // Convert decimal to percentage
        source: record.fields.Source,
        dataDate: record.fields.DataDate
      }));
    }
  }
}; 
