// RenteVergelijker Extension
export const RenteVergelijkerExtension = {
  name: "RenteVergelijker",
  type: "response",
  match: ({ trace }) => trace.type === "Custom_RenteVergelijker",
  render: ({ trace, element }) => {
    console.log("🔍 Raw payload:", trace.payload);

    // --- STATE ---
    let currentRates   = [];
    let filteredRates  = [];
    let activeSort     = "apr";
    let cardsToShow    = 3;
    let userInput      = { price:"", down:"", term:"", country:"" };

    // --- HELPERS (calculatePMT, estimateFees, transformAirtableData) ---
    function calculatePMT(ratePerMonth, nper, pv) { /* ... */ }
    function estimateFees(principal) { /* ... */ }
    function transformAirtableData(data) { /* ... */ }

    // --- PARSE PAYLOAD ---
    let payloadObj = typeof trace.payload === "string"
      ? (() => { try { return JSON.parse(trace.payload) } catch { return {} } })()
      : (trace.payload || {});
    let ratesArray = payloadObj.ratesApiResponse || [];
    if (typeof ratesArray === "string") {
      try { ratesArray = JSON.parse(ratesArray) }
      catch { ratesArray = [] }
    }
    if (Array.isArray(ratesArray) && ratesArray[0]?.fields) {
      currentRates = transformAirtableData({ records: ratesArray });
    } else if (Array.isArray(ratesArray)) {
      currentRates = ratesArray;
    }

      // ——— HOST SHRINK-WRAP ———
  element.style.cssText = `
    display: inline-block !important;
    width: 300px !important;
    box-sizing: border-box !important;
  `;

    // --- CONTAINER ---
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

    // --- FILTER PANEL (with SORT DROPDOWN) ---
    const inputPanel = document.createElement("div");
    inputPanel.id = "user-inputs";
    inputPanel.innerHTML = `
      <div style="position:relative;display:flex;gap:12px;flex-wrap:wrap;">
        <div style="flex:1;min-width:0">
          <label>Purchase Price?<br><input id="input-price" type="text" placeholder="e.g. 300000"></label>
        </div>
        <div style="flex:1;min-width:0">
          <label>Down Payment?<br><input id="input-down" type="text" placeholder="e.g. 60000"></label>
          <span id="down-badge">0%</span>
        </div>
        <button id="sort-icon" title="Sort" style="
          background:none;border:none;cursor:pointer;
          color:#2d5fff;font-size:1.2em;width:28px;height:28px;
          position:absolute;right:0;top:0;">⇅</button>

        <!-- SORT MENU (initially hidden) -->
        <div id="sort-menu" style="
          display:none; position:absolute; top:32px; right:0;
          background:#fff; border:1px solid #eee; border-radius:8px;
          box-shadow:0 2px 8px #0002; z-index:999;
        ">
          <div class="sort-option" data-sort="apr"    style="padding:8px 12px;cursor:pointer">APR</div>
          <div class="sort-option" data-sort="payment"style="padding:8px 12px;cursor:pointer">Payment</div>
          <div class="sort-option" data-sort="fees"   style="padding:8px 12px;cursor:pointer">Fees</div>
        </div>
      </div>
      <div style="margin-top:12px;display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;">
        <div style="flex:1;min-width:0">
          <label>Loan Term<br><select id="input-term"><option value="">Any</option>
            <option>10 yrs</option><option>15 yrs</option>
            <option>20 yrs</option><option>30 yrs</option>
          </select></label>
        </div>
        <div style="flex:1;min-width:0">
          <label>Country<br><select id="input-country"><option>Any</option></select></label>
        </div>
      </div>
      <button id="btn-apply">Get Rates</button>
    `;
    widgetContainer.appendChild(inputPanel);

    // --- INLINE STYLES (compact) ---
    [ "#input-price", "#input-down" ].forEach(sel => {
      const el = inputPanel.querySelector(sel);
      Object.assign(el.style, {
        width:"100%",boxSizing:"border-box",
        height:"28px",padding:"6px 10px",fontSize:"0.85em",
        background:"#eaf0ff",border:"none",
        boxShadow:"0 1px 1px #0001",borderRadius:"6px",outline:"none"
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
        width:"100%",boxSizing:"border-box",
        height:"28px",padding:"6px 24px 6px 10px",
        fontSize:"0.85em",background:"#eaf0ff",
        border:"none",boxShadow:"0 1px 1px #0001",
        borderRadius:"6px",outline:"none",appearance:"none",
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
    inputPanel.querySelectorAll("label").forEach(lbl => {
      Object.assign(lbl.style,{
        display:"block",marginBottom:"3px",
        fontSize:"0.9em",fontWeight:"600"
      });
    });
    Object.assign(inputPanel.querySelector("#down-badge").style,{
      marginLeft:"6px",display:"inline-block",
      background:"#2d5fff",color:"#fff",
      fontSize:"0.75em",fontWeight:"700",
      borderRadius:"4px",padding:"2px 4px",
      verticalAlign:"middle"
    });
    Object.assign(inputPanel.querySelector("#btn-apply").style,{
      width:"100%",padding:"6px 0",
      background:"#2d5fff",color:"#fff",
      border:"none",borderRadius:"6px",
      fontSize:"0.9em",fontWeight:"700",
      boxShadow:"0 2px 8px #2d5fff22",
      cursor:"pointer",margin:"12px 0"
    });

    // --- RESULTS AREA ---
    const resultsArea = document.createElement("div");
    resultsArea.id = "results-area";
    resultsArea.style.minHeight = "120px";
    widgetContainer.appendChild(resultsArea);
    function showLoading() { /* ... */ }
    function showNoResults() { /* ... */ }

    // --- CARD RENDERER & Filtering Logic ---
    function renderCards(rates) { /* ... uses cardsToShow ... */ }
    function applyFiltersAndRender() { /* ... sets filteredRates, sorts by activeSort ... */ }

    // --- WIRE SORT MENU ---
    const sortIcon = widgetContainer.querySelector("#sort-icon");
    const sortMenu = widgetContainer.querySelector("#sort-menu");
    sortIcon.addEventListener("click", () => {
      sortMenu.style.display = sortMenu.style.display === "block" ? "none" : "block";
    });
    sortMenu.querySelectorAll(".sort-option").forEach(opt => {
      opt.addEventListener("click", e => {
        activeSort = e.currentTarget.getAttribute("data-sort");
        sortMenu.style.display = "none";
        applyFiltersAndRender();
      });
    });
    // Close menu if clicking outside:
    document.addEventListener("click", e => {
      if (!sortMenu.contains(e.target) && e.target !== sortIcon) {
        sortMenu.style.display = "none";
      }
    });

    // --- WIRE INPUTS & INITIALIZE ---
    const ip = widgetContainer.querySelector("#input-price"),
          id = widgetContainer.querySelector("#input-down"),
          bd = widgetContainer.querySelector("#down-badge");
    function updateDownBadge() {
      const p=parseFloat(ip.value)||0, d=parseFloat(id.value)||0;
      bd.textContent = p>0? Math.round((d/p)*100)+"%":"0%";
    }
    [ip,id].forEach(inp => inp.addEventListener("input", ()=>{
      inp.value=inp.value.replace(/\D/g,"");
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
