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
    function transformAirtableData(airtableData) {
      return airtableData.records.map(record => ({
        country:  record.fields.Country,
        bank:     record.fields.Bank,
        term:     record.fields.TermInYears,
        type:     record.fields.MortgageType,
        nhg:      record.fields.NHG === "✓",
        rate:     record.fields.Rate * 100,
        source:   record.fields.Source,
        dataDate: record.fields.DataDate
      }));
    }

    // --- PARSE PAYLOAD ---
    let payloadObj;
    if (typeof trace.payload === "string") {
      try { payloadObj = JSON.parse(trace.payload); }
      catch (e) { console.error("Error parsing payload:", e); payloadObj = {}; }
    } else {
      payloadObj = trace.payload || {};
    }
    console.log("✅ Parsed payloadObj:", payloadObj);

    // ratesApiResponse is the field your payload uses
    let ratesArray = payloadObj.ratesApiResponse || [];
    if (typeof ratesArray === "string") {
      try { ratesArray = JSON.parse(ratesArray); }
      catch (e) { console.error("Error parsing ratesApiResponse:", e); ratesArray = []; }
    }
    console.log("📊 Extracted ratesArray:", ratesArray);

    if (Array.isArray(ratesArray) && ratesArray[0]?.fields) {
      currentRates = transformAirtableData({ records: ratesArray });
    } else if (Array.isArray(ratesArray)) {
      currentRates = ratesArray;
    } else {
      currentRates = [];
    }

    // --- CONTAINER (fixed 300px) ---
    element.innerHTML = "";
    const widgetContainer = document.createElement("div");
    widgetContainer.style.cssText = `
      font-family:Inter,Arial,sans-serif;
      width:300px!important; max-width:300px!important;
      margin:0 auto; background:#fff;
      border-radius:16px; box-shadow:0 2px 16px #0001;
      padding:24px; box-sizing:border-box;
    `;
    element.appendChild(widgetContainer);

    // --- FILTER PANEL ---
    const inputPanel = document.createElement("div");
    inputPanel.id = "user-inputs";
    inputPanel.innerHTML = `
      <div style="position:relative; gap:12px; display:flex; flex-wrap:wrap;">
        <div style="flex:1; min-width:0;">
          <label>Purchase Price
            <span title="Total property price" style="cursor:help;color:#888">?</span><br>
            <input id="input-price" type="text" placeholder="€ e.g. 300000">
          </label>
        </div>
        <div style="flex:1; min-width:0;">
          <label>Down Payment
            <span title="Amount upfront" style="cursor:help;color:#888">?</span><br>
            <input id="input-down" type="text" placeholder="€ e.g. 60000">
            <span id="down-badge">0%</span>
          </label>
        </div>
        <button id="sort-icon" title="Sort" style="
          background:none;border:none;cursor:pointer;
          color:#2d5fff;font-size:1.2em;width:28px;height:28px;
          position:absolute;right:0;top:0;">⇅</button>
      </div>
      <div style="margin-top:12px; display:flex; gap:12px; flex-wrap:wrap; align-items:flex-end;">
        <div style="flex:1; min-width:0;">
          <label>Loan Term</label><br>
          <select id="input-term">
            <option value="">Any</option><option value="10">10 yrs</option>
            <option value="15">15 yrs</option><option value="20">20 yrs</option>
            <option value="30">30 yrs</option>
          </select>
        </div>
        <div style="flex:1; min-width:0;">
          <label>Country</label><br>
          <select id="input-country"><option value="">Any</option></select>
        </div>
      </div>
      <button id="btn-apply">Get Rates</button>
    `;
    widgetContainer.appendChild(inputPanel);

    // --- INLINE STYLES FOR COMPACT 300px ---
    [ "#input-price", "#input-down" ].forEach(sel => {
      const el = inputPanel.querySelector(sel);
      Object.assign(el.style, {
        width:"100%", boxSizing:"border-box",
        height:"28px", padding:"6px 10px",
        fontSize:"0.85em",
        background:"#eaf0ff", border:"none",
        boxShadow:"0 1px 1px #0001",
        borderRadius:"6px", outline:"none"
      });
      el.addEventListener("focus", ()=> el.style.boxShadow = "0 0 0 2px #2d5fff33");
      el.addEventListener("blur",  ()=> el.style.boxShadow = "0 1px 1px #0001");
    });
    [ "#input-term", "#input-country" ].forEach(sel => {
      const el = inputPanel.querySelector(sel),
            wrapper = document.createElement("div");
      wrapper.style.cssText = "position:relative;width:100%;box-sizing:border-box";
      el.parentNode.replaceChild(wrapper, el);
      wrapper.appendChild(el);
      Object.assign(el.style, {
        width:"100%", boxSizing:"border-box",
        height:"28px", padding:"6px 24px 6px 10px",
        fontSize:"0.85em",
        background:"#eaf0ff", border:"none",
        boxShadow:"0 1px 1px #0001",
        borderRadius:"6px", outline:"none",
        appearance:"none", color:"#2d5fff", fontWeight:"700"
      });
      const arrow = document.createElement("span");
      arrow.textContent="▼";
      Object.assign(arrow.style,{
        position:"absolute", right:"8px",
        top:"50%", transform:"translateY(-50%)",
        pointerEvents:"none", color:"#2d5fff",
        fontSize:"0.75em"
      });
      wrapper.appendChild(arrow);
    });
    inputPanel.querySelectorAll("label").forEach(lbl => {
      Object.assign(lbl.style, {
        fontSize:"0.9em", fontWeight:"600",
        display:"block", marginBottom:"3px"
      });
    });
    Object.assign(inputPanel.querySelector("#down-badge").style, {
      marginLeft:"6px",
      background:"#2d5fff", color:"#fff",
      fontSize:"0.75em", fontWeight:"700",
      borderRadius:"4px", padding:"2px 4px",
      display:"inline-block", verticalAlign:"middle"
    });
    Object.assign(inputPanel.querySelector("#btn-apply").style, {
      width:"100%", padding:"6px 0",
      background:"#2d5fff", color:"#fff",
      border:"none", borderRadius:"6px",
      fontSize:"0.9em", fontWeight:"700",
      boxShadow:"0 2px 8px #2d5fff22",
      cursor:"pointer", margin:"12px 0"
    });

    // --- RESULTS AREA ---
    const resultsArea = document.createElement("div");
    resultsArea.id = "results-area";
    resultsArea.style.minHeight = "120px";
    widgetContainer.appendChild(resultsArea);

    function showLoading() {
      resultsArea.innerHTML = `
        <div style="
          text-align:center;color:#aaa;
          padding:24px 0;font-size:0.85em">
          Loading rates…
        </div>`;
    }
    function showNoResults() {
      resultsArea.innerHTML = `
        <div style="
          text-align:center;color:#888;
          padding:24px;border-radius:6px;
          background:#f8f9fb;font-size:0.85em">
          No loans match your criteria.
        </div>`;
    }

    // --- CARD RENDERER ---
    function renderCards(rates) {
      if (!rates.length) return showNoResults();
      resultsArea.innerHTML = "";
      const grid = document.createElement("div");
      grid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;";
      // … compute scores & build each card using cardsToShow …
      rates.slice(0, cardsToShow).forEach((r,i) => {
        // card creation here…
      });
      resultsArea.appendChild(grid);
      if (rates.length > cardsToShow) {
        const more = document.createElement("button");
        more.textContent = "More";
        more.style.cssText = `
          display:block;margin:12px auto 0;
          background:#f3f6ff;color:#2d5fff;
          border:none;border-radius:6px;
          padding:6px 12px;font-size:0.85em;
          font-weight:600;cursor:pointer;
        `;
        more.onclick = () => { cardsToShow += 3; renderCards(rates); };
        resultsArea.appendChild(more);
      }
    }

    // --- FILTER & SORT LOGIC ---
    function applyFiltersAndRender() {
      showLoading();
      setTimeout(() => {
        filteredRates = currentRates
          .filter(r => userInput.country ? r.country === userInput.country : true)
          .filter(r => userInput.term    ? String(r.term) === userInput.term : true);
        // sorting…
        renderCards(filteredRates);
      }, 300);
    }

    // --- WIRE EVENTS & INIT ---
    const ip = widgetContainer.querySelector("#input-price"),
          id = widgetContainer.querySelector("#input-down"),
          bd = widgetContainer.querySelector("#down-badge");

    function updateDownBadge() {
      const p = parseFloat(ip.value)||0, d = parseFloat(id.value)||0;
      bd.textContent = p>0? Math.round((d/p)*100)+"%":"0%";
    }
    [ip,id].forEach(inp => inp.addEventListener("input", ()=>{
      inp.value = inp.value.replace(/\D/g,"");
      updateDownBadge();
    }));
    updateDownBadge();

    widgetContainer.querySelector("#btn-apply").onclick = () => {
      userInput.price   = ip.value;
      userInput.down    = id.value;
      userInput.term    = widgetContainer.querySelector("#input-term").value;
      userInput.country = widgetContainer.querySelector("#input-country").value;
      applyFiltersAndRender();
    };

    // --- INITIAL RENDER ---
    applyFiltersAndRender();
  }
};
