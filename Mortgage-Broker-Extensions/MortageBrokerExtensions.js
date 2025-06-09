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

    // --- Responsive Styles ---
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 600px) {
        .vf-mortgage-row { flex-direction: row; gap: 8px; }
        .vf-mortgage-col { flex: 1 1 0; min-width: 0; }
        .vf-mortgage-more { display: block; margin: 12px 0 0 0; width: 100%; }
        .vf-mortgage-filters { display: none; flex-direction: column; gap: 12px; margin-top: 12px; }
        .vf-mortgage-filters.vf-open { display: flex; }
      }
      @media (min-width: 601px) {
        .vf-mortgage-row { flex-direction: row; gap: 16px; }
        .vf-mortgage-col { flex: 1 1 0; min-width: 0; }
        .vf-mortgage-more { display: none; }
        .vf-mortgage-filters { display: flex !important; flex-direction: row; gap: 16px; margin-top: 0; }
      }
      .vf-mortgage-row { display: flex; flex-wrap: wrap; align-items: flex-end; }
      .vf-mortgage-col label { display: block; font-size: 0.98em; margin-bottom: 2px; }
      .vf-mortgage-col input, .vf-mortgage-col select { width: 100%; box-sizing: border-box; }
      .vf-mortgage-more { background: #f3f6ff; color: #2d5fff; border: none; border-radius: 8px; padding: 8px 0; font-weight: 600; font-size: 1em; cursor: pointer; }
      .vf-mortgage-filters { transition: max-height 0.3s; overflow: hidden; }
      .vf-sort-menu { display:none; position:absolute; left:0; top:32px; background:#fff; border:1px solid #eee; border-radius:8px; box-shadow:0 2px 8px #0002; z-index:9999; min-width:170px; padding: 4px 0; }
      .vf-sort-menu.vf-open { display:block; }
      .vf-sort-menu .sort-option { padding:8px 16px; cursor:pointer; font-size:1em; color:#222; transition:background 0.15s; }
      .vf-sort-menu .sort-option:hover { background:#f3f6ff; color:#2d5fff; }
      .vf-modern-select {
        appearance: none !important;
        -webkit-appearance: none !important;
        -moz-appearance: none !important;
        background: #eaf0ff !important;
        color: #2d5fff !important;
        font-weight: 700 !important;
        font-size: 1.08em !important;
        border: none !important;
        border-radius: 18px !important;
        padding: 10px 36px 10px 18px !important;
        margin-top: 4px !important;
        margin-bottom: 4px !important;
        box-shadow: 0 1px 4px #0001 !important;
        outline: none !important;
        transition: box-shadow 0.15s !important;
        cursor: pointer !important;
        min-width: 140px !important;
        position: relative !important;
      }
      .vf-modern-select:focus {
        box-shadow: 0 0 0 2px #2d5fff33 !important;
      }
      .vf-modern-select::-ms-expand { display: none !important; }
      .vf-modern-select option { color: #222 !important; font-weight: 400 !important; background: #fff !important; }
      .vf-modern-select:after {
        content: '▼';
        position: absolute;
        right: 16px;
        top: 50%;
        transform: translateY(-50%);
        color: #2d5fff;
        pointer-events: none;
      }
      .vf-sort-menu .sort-option:hover {
        background: #eaf0ff !important;
        color: #2d5fff !important;
      }
      .vf-loan-input-wrap {
        display: flex; align-items: center; gap: 8px;
      }
      .vf-loan-input {
        background: #eaf0ff;
        color: #222;
        font-weight: 700;
        font-size: 1.25em;
        border: none;
        border-radius: 12px;
        padding: 14px 18px 10px 36px;
        margin: 0;
        outline: none;
        box-shadow: none;
        border-bottom: 3px solid #2d5fff;
        width: 140px;
        transition: border-color 0.15s;
        text-align: left;
      }
      .vf-loan-input:focus {
        border-bottom: 3px solid #1a3fd1;
      }
      .vf-loan-input-currency {
        position: relative;
        display: flex;
        align-items: center;
      }
      .vf-loan-input-currency span {
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        color: #2d5fff;
        font-size: 1.1em;
        font-weight: 700;
        pointer-events: none;
      }
      .vf-loan-badge {
        background: #eaf0ff;
        color: #2d5fff;
        font-weight: 700;
        font-size: 1.08em;
        border-radius: 12px;
        padding: 8px 18px;
        margin-left: 6px;
        margin-top: 18px;
        display: inline-block;
        min-width: 54px;
        text-align: center;
      }
      .vf-loan-input-currency-euro {
        position: relative;
        display: flex;
        align-items: center;
        background: none;
      }
      .vf-loan-input-currency-euro span:first-child {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: #2d5fff;
        font-size: 1.15em;
        font-weight: 700;
        pointer-events: none;
      }
      .vf-loan-input-euro {
        background: #fff !important;
        color: #222 !important;
        font-weight: 700 !important;
        font-size: 1.25em !important;
        border: 1.5px solid #dbe6ff !important;
        border-radius: 8px !important;
        padding: 12px 12px 10px 38px !important;
        margin: 0 !important;
        outline: none !important;
        box-shadow: none !important;
        border-bottom: 3px solid #2d5fff !important;
        width: 160px !important;
        transition: border-color 0.15s !important;
        text-align: left !important;
      }
      .vf-loan-input-euro:focus {
        border-color: #2d5fff !important;
        border-bottom: 3px solid #1a3fd1 !important;
      }
      .vf-loan-badge-euro {
        background: #2d5fff;
        color: #fff;
        font-weight: 700;
        font-size: 1.08em;
        border-radius: 12px;
        padding: 8px 18px;
        margin-left: 12px;
        margin-top: 18px;
        display: inline-block;
        min-width: 54px;
        text-align: center;
        box-shadow: 0 2px 8px #0001;
      }
    `;
    if (element.shadowRoot) {
      element.shadowRoot.appendChild(style);
    } else if (element.ownerDocument && element.ownerDocument.head) {
      element.ownerDocument.head.appendChild(style);
    } else {
      element.appendChild(style);
    }

    // --- UI Root ---
    element.innerHTML = '';
    const widgetContainer = document.createElement('div');
    widgetContainer.style.cssText = 'font-family: Inter, Arial, sans-serif; max-width:600px; width:100%; margin:0 auto; background:#fff; border-radius:16px; box-shadow:0 2px 16px #0001; padding:24px;';

    // --- Input/Filter Panel ---
    const inputPanel = document.createElement('div');
    inputPanel.id = 'user-inputs';
    // Responsive row for price/down, expandable filters for mobile
    inputPanel.innerHTML = `
      <div class="vf-mortgage-row">
        <div class="vf-mortgage-col">
          <label>Purchase Price <span title="The total price of the property you want to buy." style="cursor:help; color:#888;">?</span><br>
          <span class="vf-loan-input-currency-euro">
            <span>€</span>
            <input id="input-price" type="text" placeholder="e.g. 300000" class="vf-loan-input-euro" autocomplete="off" inputmode="numeric" pattern="[0-9]*" />
          </span>
          </label>
        </div>
        <div class="vf-mortgage-col">
          <label>Down Payment <span title="The amount you pay upfront. The loan amount is purchase price minus down payment." style="cursor:help; color:#888;">?</span><br>
          <span class="vf-loan-input-currency-euro">
            <span>€</span>
            <input id="input-down" type="text" placeholder="e.g. 60000" class="vf-loan-input-euro" autocomplete="off" inputmode="numeric" pattern="[0-9]*" />
          </span>
          <span id="down-badge" class="vf-loan-badge-euro">0%</span>
          </label>
        </div>
      </div>
      <button class="vf-mortgage-more" id="vf-more-btn">More Filters ▼</button>
      <div class="vf-mortgage-filters" id="vf-filters">
        <div class="vf-mortgage-col"><label>Loan Term<br><select id="input-term" style="background:#eaf0ff;color:#2d5fff;font-weight:700;font-size:1.08em;border:none;border-radius:18px;padding:10px 36px 10px 18px;margin-top:4px;margin-bottom:4px;box-shadow:0 1px 4px #0001;outline:none;transition:box-shadow 0.15s;cursor:pointer;min-width:140px;position:relative;">
          <option value="">Any</option><option value="10">10 yrs</option><option value="15">15 yrs</option><option value="20">20 yrs</option><option value="30">30 yrs</option>
        </select></label></div>
        <div class="vf-mortgage-col"><label>Country<br><select id="input-country" style="background:#eaf0ff;color:#2d5fff;font-weight:700;font-size:1.08em;border:none;border-radius:18px;padding:10px 36px 10px 18px;margin-top:4px;margin-bottom:4px;box-shadow:0 1px 4px #0001;outline:none;transition:box-shadow 0.15s;cursor:pointer;min-width:140px;position:relative;"></select></label></div>
        <div class="vf-mortgage-col" style="position:relative; min-width: 48px;">
          <label style="opacity:0;">Sort</label>
          <button id="sort-icon" style="background:none; border:none; cursor:pointer; font-size:1.3em; color:#2d5fff; padding:0 8px; width:40px; height:40px; vertical-align:middle;" title="Sort options">
            ⇅
          </button>
          <div id="sort-menu" style="display:none; position:absolute; left:0; top:32px; background:#fff; border:1px solid #eee; border-radius:8px; box-shadow:0 2px 8px #0002; z-index:9999; min-width:170px; padding: 4px 0;">
            <div class="sort-option" data-sort="apr" style="padding:8px 16px; cursor:pointer; font-size:1em; color:#222; transition:background 0.15s;">Sort by APR</div>
            <div class="sort-option" data-sort="payment" style="padding:8px 16px; cursor:pointer; font-size:1em; color:#222; transition:background 0.15s;">Sort by Monthly Payment</div>
            <div class="sort-option" data-sort="fees" style="padding:8px 16px; cursor:pointer; font-size:1em; color:#222; transition:background 0.15s;">Sort by Fees</div>
          </div>
        </div>
        <div class="vf-mortgage-col"><button id="btn-apply" style="height:38px; background:#2d5fff; color:#fff; border:none; border-radius:8px; padding:0 18px; font-weight:600; cursor:pointer; width:100%;">Get Rates</button></div>
      </div>
    `;
    widgetContainer.appendChild(inputPanel);

    // --- Results Area ---
    const resultsArea = document.createElement('div');
    resultsArea.id = 'results-area';
    resultsArea.style.cssText = 'min-height:180px;';
    widgetContainer.appendChild(resultsArea);

    // --- Responsive filter logic ---
    const moreBtn = inputPanel.querySelector('#vf-more-btn');
    const filtersDiv = inputPanel.querySelector('#vf-filters');
    let filtersOpen = false;
    function updateFiltersDisplay() {
      if (window.innerWidth <= 600) {
        filtersDiv.classList.toggle('vf-open', filtersOpen);
        moreBtn.textContent = filtersOpen ? 'Hide Filters ▲' : 'More Filters ▼';
      } else {
        filtersDiv.classList.add('vf-open');
        moreBtn.style.display = 'none';
      }
    }
    moreBtn.addEventListener('click', () => {
      filtersOpen = !filtersOpen;
      updateFiltersDisplay();
    });
    window.addEventListener('resize', updateFiltersDisplay);
    setTimeout(updateFiltersDisplay, 10);

    // --- Sort menu logic ---
    const sortIcon = inputPanel.querySelector('#sort-icon');
    const sortMenu = inputPanel.querySelector('#sort-menu');
    console.log('Sort icon:', sortIcon, 'Sort menu:', sortMenu); // Debug log
    // Ensure menu is hidden by default
    sortMenu.style.display = 'none';
    sortIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log('Sort icon clicked'); // Debug log
      if (sortMenu.style.display === 'block') {
        sortMenu.style.display = 'none';
      } else {
        sortMenu.style.display = 'block';
      }
    });
    sortMenu.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent document click from closing immediately
    });
    sortMenu.querySelectorAll('.sort-option').forEach(opt => {
      opt.addEventListener('click', e => {
        activeSort = e.target.getAttribute('data-sort');
        sortMenu.style.display = 'none';
        applyFiltersAndRender();
      });
    });
    document.addEventListener('click', (e) => {
      if (!sortMenu.contains(e.target) && !sortIcon.contains(e.target)) {
        sortMenu.style.display = 'none';
      }
    });

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
