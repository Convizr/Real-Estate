// RenteVergelijker Extension
export const RenteVergelijkerExtension = {
  name: "RenteVergelijker",
  type: "response",
  match: ({ trace }) => trace.type === "Custom_RenteVergelijker",
  render: ({ trace, element }) => {
    // --- DEBUG incoming payload ---
    console.log("🔍 Raw payload:", trace.payload);

    // --- STATE (declare once) ---
    let currentRates   = [];
    let filteredRates  = [];
    let activeSort     = "apr";
    let cardsToShow    = 3;
    let userInput      = { price:"", down:"", term:"", country:"" };

    // --- HELPERS ---
    function calculatePMT(ratePerMonth, nper, pv) {
      if (!ratePerMonth) return pv / nper;
      return (pv * ratePerMonth) / (1 - Math.pow(1 + ratePerMonth, -nper));
    }
    function estimateFees(principal) {
      return Math.round(principal * 0.01 + 500);
    }
    function transformAirtableData(data) {
      return data.records.map(r => ({
        country:  r.fields.Country,
        bank:     r.fields.Bank,
        term:     r.fields.TermInYears,
        type:     r.fields.MortgageType,
        nhg:      r.fields.NHG === "✓",
        rate:     r.fields.Rate * 100,
        source:   r.fields.Source,
        dataDate: r.fields.DataDate
      }));
    }

    // --- PARSE PAYLOAD like RealEstateExtension ---
    let payloadObj;
    if (typeof trace.payload === "string") {
      try { payloadObj = JSON.parse(trace.payload); }
      catch (e) { console.error("Error parsing payload:", e); payloadObj = {}; }
    } else {
      payloadObj = trace.payload || {};
    }
    console.log("✅ Parsed payloadObj:", payloadObj);

    let ratesArray = payloadObj.ratesApiResponse 
                  || payloadObj.records 
                  || payloadObj.rates 
                  || [];
    if (typeof ratesArray === "string") {
      try { ratesArray = JSON.parse(ratesArray); }
      catch (e) { console.error("Error parsing ratesArray:", e); ratesArray = []; }
    }
    console.log("📊 Extracted ratesArray:", ratesArray);

    if (Array.isArray(ratesArray) && ratesArray[0]?.fields) {
      currentRates = transformAirtableData({ records: ratesArray });
    } else if (Array.isArray(ratesArray)) {
      currentRates = ratesArray;
    } else {
      console.warn("No valid rates found; using empty array");
      currentRates = [];
    }

    // --- CONTAINER (fixed 300px) ---
    element.innerHTML = "";
    const widgetContainer = document.createElement("div");
    widgetContainer.style.cssText = `
      font-family:Inter,Arial,sans-serif;
      width:300px!important;max-width:300px!important;
      margin:0 auto;background:#fff;
      border-radius:16px;box-shadow:0 2px 16px #0001;
      padding:24px;box-sizing:border-box;
    `;
    element.appendChild(widgetContainer);

    // --- FILTER PANEL MARKUP ---
    const inputPanel = document.createElement("div");
    inputPanel.id = "user-inputs";
    inputPanel.innerHTML = `
      <div class="vf-mortgage-row" style="position:relative; gap:12px;">
        <div class="vf-mortgage-col">
          <label>Purchase Price
            <span title="Total property price" style="cursor:help;color:#888">?</span><br>
            <span class="vf-loan-input-currency-euro"><span>€</span>
              <input id="input-price" type="text" placeholder="e.g. 300000">
            </span>
          </label>
        </div>
        <div class="vf-mortgage-col">
          <label>Down Payment
            <span title="Amount upfront" style="cursor:help;color:#888">?</span><br>
            <span class="vf-loan-input-currency-euro"><span>€</span>
              <input id="input-down" type="text" placeholder="e.g. 60000">
            </span>
            <span id="down-badge">0%</span>
          </label>
        </div>
        <button id="sort-icon" title="Sort" style="
          background:none;border:none;cursor:pointer;
          color:#2d5fff;font-size:1.2em;width:28px;height:28px;
          position:absolute;right:0;top:0;">⇅</button>
      </div>
      <div class="vf-mortgage-row" style="margin-top:12px; align-items:flex-end; gap:12px;">
        <div class="vf-mortgage-col">
          <label>Loan Term</label>
          <select id="input-term"><option value="">Any</option>
            <option value="10">10 yrs</option><option value="15">15 yrs</option>
            <option value="20">20 yrs</option><option value="30">30 yrs</option>
          </select>
        </div>
        <div class="vf-mortgage-col">
          <label>Country</label>
          <select id="input-country"><option value="">Any</option></select>
        </div>
      </div>
      <button id="btn-apply">Get Rates</button>
    `;
    widgetContainer.appendChild(inputPanel);

    // --- ULTRA-COMPACT INLINE STYLES ---
    [ "#input-price", "#input-down" ].forEach(sel => {
      const el = inputPanel.querySelector(sel);
      Object.assign(el.style, {
        background:"#eaf0ff",border:"none",
        boxShadow:"0 1px 1px #0001",borderRadius:"6px",
        fontSize:"0.85em",padding:"6px 10px",height:"28px",
        outline:"none",width:"100%",boxSizing:"border-box"
      });
      el.onfocus = () => el.style.boxShadow = "0 0 0 2px #2d5fff33";
      el.onblur  = () => el.style.boxShadow = "0 1px 1px #0001";
    });
    [ "#input-term", "#input-country" ].forEach(sel => {
      const el = inputPanel.querySelector(sel),
            wrapper = document.createElement("div");
      wrapper.style.cssText = "position:relative;width:100%;box-sizing:border-box";
      el.parentNode.replaceChild(wrapper, el);
      wrapper.appendChild(el);
      Object.assign(el.style, {
        background:"#eaf0ff",border:"none",
        boxShadow:"0 1px 1px #0001",borderRadius:"6px",
        fontSize:"0.85em",padding:"6px 24px 6px 10px",
        height:"28px",outline:"none",appearance:"none",
        width:"100%",boxSizing:"border-box",
        color:"#2d5fff",fontWeight:"700"
      });
      const arrow = document.createElement("span");
      arrow.textContent="▼";
      Object.assign(arrow.style,{
        position:"absolute",right:"8px",top:"50%",
        transform:"translateY(-50%)",pointerEvents:"none",
        color:"#2d5fff",fontSize:"0.75em"
      });
      wrapper.appendChild(arrow);
    });
    inputPanel.querySelectorAll("label").forEach(lbl=>{
      Object.assign(lbl.style,{
        fontSize:"0.9em",fontWeight:"600",
        display:"block",marginBottom:"3px"
      });
    });
    Object.assign(inputPanel.querySelector("#down-badge").style,{
      display:"inline-block",background:"#2d5fff",color:"#fff",
      fontSize:"0.75em",fontWeight:"700",borderRadius:"4px",
      padding:"2px 4px",verticalAlign:"middle",marginLeft:"6px"
    });
    Object.assign(inputPanel.querySelector("#btn-apply").style,{
      width:"100%",background:"#2d5fff",color:"#fff",
      border:"none",borderRadius:"6px",padding:"6px 0",
      fontSize:"0.9em",fontWeight:"700",
      boxShadow:"0 2px 8px #2d5fff22",cursor:"pointer",
      margin:"12px 0"
    });

    // --- RESULTS AREA & HELPERS ---
    const resultsArea = document.createElement("div");
    resultsArea.id = "results-area";
    resultsArea.style.minHeight = "120px";
    widgetContainer.appendChild(resultsArea);
    function showLoading() {
      resultsArea.innerHTML = `
        <div style="text-align:center;color:#aaa;
                    padding:24px 0;font-size:0.85em">
          Loading rates…
        </div>`;
    }
    function showNoResults() {
      resultsArea.innerHTML = `
        <div style="text-align:center;color:#888;
                    padding:24px;border-radius:6px;
                    background:#f8f9fb;font-size:0.85em">
          No loans match your criteria.
        </div>`;
    }

    // --- CARD RENDERER & FILTERING ---
    function renderCards(rates) { /* ... your card code using cardsToShow ... */ }
    function applyFiltersAndRender() { /* ... uses currentRates, filteredRates ... */ }

    // --- WIRE EVENTS & INITIALIZE ---
    // updateDownBadge(), input listeners, btn-apply onclick → applyFiltersAndRender()
    applyFiltersAndRender();
  }
};
