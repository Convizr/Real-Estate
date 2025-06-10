// RenteVergelijker Extension
export const RenteVergelijkerExtension = {
  name: "RenteVergelijker",
  type: "response",
  match: ({ trace }) => trace.type === "Custom_RenteVergelijker",
  render: ({ trace, element }) => {
    // --- DEBUG payload ---
    console.log("🔍 Raw payload:", trace.payload);

    // --- STATE ---
    let currentRates  = [];
    let filteredRates = [];
    let activeSort    = "apr";
    let cardsToShow   = 3;
    let userInput     = { price: "", down: "", term: "", country: "" };

    // --- HELPERS ---
    function calculatePMT(ratePerMonth, nper, pv) {
      if (!ratePerMonth) return pv / nper;
      return (pv * ratePerMonth) / (1 - Math.pow(1 + ratePerMonth, -nper));
    }
    function estimateFees(principal) {
      return Math.round(principal * 0.01 + 500);
    }
    function transformAirtableData(airtableData) {
      return airtableData.records.map(r => ({
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

    // --- PARSE PAYLOAD ---
    let payloadObj = typeof trace.payload === "string"
      ? (() => { try { return JSON.parse(trace.payload); } catch { return {}; } })()
      : (trace.payload || {});
    let ratesArray = payloadObj.ratesApiResponse || [];
    if (typeof ratesArray === "string") {
      try { ratesArray = JSON.parse(ratesArray); } catch { ratesArray = []; }
    }
    if (Array.isArray(ratesArray) && ratesArray[0]?.fields) {
      currentRates = transformAirtableData({ records: ratesArray });
    } else if (Array.isArray(ratesArray)) {
      currentRates = ratesArray;
    }

    // --- CONTAINER (300px inline-block) ---
    element.innerHTML = "";
    const widgetContainer = document.createElement("div");
    widgetContainer.style.cssText = `
      display:inline-block!important;
      width:300px!important;
      font-family:Inter,Arial,sans-serif;
      background:#fff;border-radius:16px;
      box-shadow:0 2px 16px #0001;
      padding:24px;box-sizing:border-box;
    `;
    element.appendChild(widgetContainer);

    // --- FILTER PANEL ---
    const inputPanel = document.createElement("div");
    inputPanel.id = "user-inputs";
    inputPanel.innerHTML = `
      <div style="display:flex;gap:12px;flex-wrap:wrap;position:relative;align-items:flex-start;">
        <div style="flex:1;min-width:0">
          <label style="display:flex;align-items:center;font-weight:600;font-size:0.9em;gap:4px;margin-bottom:3px;">
            Purchase Price
            <span style="display:inline-flex;align-items:center;cursor:pointer;" title="Total price of the property">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" style="display:inline;vertical-align:middle;">
                <circle cx="10" cy="10" r="9" stroke="#2d5fff" stroke-width="2" fill="#eaf0ff"/>
                <text x="10" y="15" text-anchor="middle" font-size="12" fill="#2d5fff" font-family="Arial" font-weight="bold">i</text>
              </svg>
            </span>
          </label>
          <input id="input-price" type="text" placeholder="e.g. 300000">
        </div>
        <div style="flex:1;min-width:0">
          <label style="display:flex;align-items:center;font-weight:600;font-size:0.9em;gap:4px;margin-bottom:3px;">
            Down Payment
            <span style="display:inline-flex;align-items:center;cursor:pointer;" title="Amount you pay upfront">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" style="display:inline;vertical-align:middle;">
                <circle cx="10" cy="10" r="9" stroke="#2d5fff" stroke-width="2" fill="#eaf0ff"/>
                <text x="10" y="15" text-anchor="middle" font-size="12" fill="#2d5fff" font-family="Arial" font-weight="bold">i</text>
              </svg>
            </span>
          </label>
          <input id="input-down" type="text" placeholder="e.g. 60000">
          <span id="down-badge">0%</span>
        </div>
        <div style="display:flex;align-items:flex-start;height:100%;padding-top:2px;">
          <button id="sort-icon" title="Sort by APR" style="
            background:none;border:none;cursor:pointer;
            color:#2d5fff;font-size:1.2em;width:28px;height:28px;">
            ⇅
          </button>
        </div>
      </div>
      <div style="margin-top:12px;display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;">
        <div style="flex:1;min-width:0">
          <label>Loan Term<br><select id="input-term">
            <option value="">Any</option><option value="10">10 yrs</option>
            <option value="15">15 yrs</option><option value="20">20 yrs</option>
            <option value="30">30 yrs</option>
          </select></label>
        </div>
        <div style="flex:1;min-width:0">
          <label>Country<br><select id="input-country"><option value="">Any</option></select></label>
        </div>
      </div>
      <button id="btn-apply">Get Rates</button>
    `;
    widgetContainer.appendChild(inputPanel);

    // Populate country dropdown with unique countries
    const countrySelect = inputPanel.querySelector("#input-country");
    const uniqueCountries = [...new Set(currentRates.map(r => r.country).filter(Boolean))].sort();
    uniqueCountries.forEach(country => {
      const option = document.createElement("option");
      option.value = country;
      option.textContent = country;
      countrySelect.appendChild(option);
    });

    // ── FORCE THE HOST WRAPPER TO 300px ──
    const host = element;
    host.style.setProperty("display", "inline-block", "important");
    host.style.setProperty("width", "300px", "important");
    host.style.setProperty("box-sizing", "border-box", "important");

    // --- INLINE COMPACT STYLING ---
    [ "#input-price", "#input-down" ].forEach(sel => {
      const el = inputPanel.querySelector(sel);
      Object.assign(el.style, {
        width:"100%",boxSizing:"border-box",
        height:"28px",padding:"6px 10px",fontSize:"0.85em",
        background:"#eaf0ff",border:"none",
        boxShadow:"0 1px 1px #0001",borderRadius:"6px",outline:"none",
        marginTop: "4px"
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
        color:"#2d5fff",fontWeight:"700",
        marginTop: "4px"
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

    // --- RESULTS AREA & HELPERS ---
    const resultsArea = document.createElement("div");
    resultsArea.id = "results-area";
    resultsArea.style.minHeight = "120px";
    widgetContainer.appendChild(resultsArea);
    function showLoading() {
      resultsArea.innerHTML = `<div style="text-align:center;color:#aaa;padding:24px 0;font-size:0.85em">
        Loading rates…
      </div>`;
    }
    function showNoResults() {
      resultsArea.innerHTML = `<div style="text-align:center;color:#888;padding:24px;border-radius:6px;background:#f8f9fb;font-size:0.85em">
        No loans match your criteria.
      </div>`;
    }

    // --- CARD RENDERER ---
    function renderCards(rates) {
      if (!rates.length) return showNoResults();
      resultsArea.innerHTML = "";
      const grid = document.createElement("div");
      grid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;";
      const computed = rates.slice(0, cardsToShow).map(r => {
        const principal = Number(userInput.price)-Number(userInput.down)||250000;
        const nper = (r.term||20)*12;
        const rateM = (r.rate||3)/100/12;
        return {
          rateObj: r,
          monthly: calculatePMT(rateM,nper,principal),
          fees:    r.fees||estimateFees(principal)
        };
      });
      const mins = {
        pay:  Math.min(...computed.map(c=>c.monthly)),
        fees: Math.min(...computed.map(c=>c.fees)),
        rate: Math.min(...computed.map(c=>c.rateObj.rate))
      };
      const maxs = {
        pay:  Math.max(...computed.map(c=>c.monthly)),
        fees: Math.max(...computed.map(c=>c.fees)),
        rate: Math.max(...computed.map(c=>c.rateObj.rate)),
        term: Math.max(...computed.map(c=>c.rateObj.term||0))
      };
      computed.forEach(c => {
        const np = maxs.pay!==mins.pay ? (c.monthly-mins.pay)/(maxs.pay-mins.pay):0;
        const nf = maxs.fees!==mins.fees ? (c.fees-mins.fees)/(maxs.fees-mins.fees):0;
        const nr = maxs.rate!==mins.rate ? (c.rateObj.rate-mins.rate)/(maxs.rate-mins.rate):0;
        const nt = maxs.term ? (c.rateObj.term||0)/maxs.term:0;
        c.score = 0.4*np + 0.2*nf + 0.2*nr - 0.2*nt;
      });
      let bestIdx=0,bestScore=computed[0].score;
      computed.forEach((c,i)=>{ if(c.score<bestScore){bestScore=c.score;bestIdx=i;} });

      computed.forEach((c,i)=>{
        const { rateObj, monthly, fees } = c;
        const rec = i===bestIdx;
        const card = document.createElement("div");
        card.style.cssText = `
          background:#fff;border-radius:8px;
          box-shadow:0 1px 4px #0001;padding:12px;
          border:2px solid ${rec? '#2d5fff':'#ddd'};
          display:flex;flex-direction:column;
        `;
        card.innerHTML = `
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
            <div style="
              width:24px;height:24px;
              background:#f3f6ff;border-radius:6px;
              display:flex;align-items:center;
              justify-content:center;font-size:1em;
              color:#2d5fff">🏦</div>
            <div>
              <div style="font-weight:600;font-size:0.9em">${rateObj.bank||'–'}</div>
              <div style="color:#888;font-size:0.75em">${rateObj.country||''}</div>
            </div>
            ${rec? `<span style="
              background:#2d5fff;color:#fff;
              font-size:0.7em;border-radius:4px;
              padding:5px 4px;margin-left:auto;
              width:90px; display:inline-block;
              text-align:center; white-space:nowrap;">
              Recommended
            </span>` : ""}
          </div>
          <div style="margin-bottom:6px">
            <span style="font-weight:700;font-size:1em;color:#2d5fff">
              ${rateObj.rate.toFixed(2)}%
            </span>
            <span style="margin-left:4px;color:#888;font-size:0.85em">
              ${rateObj.term||'–'} yrs
            </span>
          </div>
          <div style="margin-bottom:4px;font-size:0.8em">Type: <b>${rateObj.type||'–'}</b></div>
          <div style="margin-bottom:4px;font-size:0.8em">NHG: <b>${rateObj.nhg?'Yes':'No'}</b></div>
          <div style="margin-bottom:4px;font-size:0.8em">Monthly: <b>€${monthly.toFixed(0)}</b></div>
          <div style="margin-bottom:8px;font-size:0.8em">Fees: <b>€${fees}</b></div>
          <button class="btn-select" style="
            background:#2d5fff;color:#fff;border:none;
            border-radius:6px;padding:6px;
            font-size:0.85em;font-weight:600;
            cursor:pointer">Choose</button>
        `;
        card.querySelector(".btn-select").onclick = () => {
          window.VF?.events?.emit("RATE_SELECTED", {
            ...rateObj,
            monthlyPayment: monthly,
            fees
          });
        };
        grid.appendChild(card);
      });

      resultsArea.appendChild(grid);
      if (filteredRates.length > cardsToShow) {
        const more = document.createElement("button");
        more.textContent="More";
        more.style.cssText=`
          display:block;margin:12px auto 0;
          background:#f3f6ff;color:#2d5fff;
          border:none;border-radius:6px;
          padding:6px 12px;font-size:0.85em;
          font-weight:600;cursor:pointer;
        `;
        more.onclick = ()=>{ cardsToShow+=3; renderCards(filteredRates); };
        resultsArea.appendChild(more);
      }
    }

    // --- SORT ICON CLICK CYCLE ---
    const sortIcon = widgetContainer.querySelector("#sort-icon");
    sortIcon.onclick = () => {
      const modes = ["apr","payment","fees"];
      const idx   = modes.indexOf(activeSort);
      activeSort  = modes[(idx+1) % modes.length];
      sortIcon.title = {
        apr:     "Sort by APR",
        payment: "Sort by Payment",
        fees:    "Sort by Fees"
      }[activeSort];
      applyFiltersAndRender();
    };

    // --- APPLY FILTERS & INITIALIZE ---
    function applyFiltersAndRender() {
      showLoading();
      setTimeout(() => {
        filteredRates = currentRates
          .filter(r=> userInput.country? r.country===userInput.country:true)
          .filter(r=> userInput.term?   String(r.term)===userInput.term:true);

        if(activeSort==="apr") filteredRates.sort((a,b)=>a.rate-b.rate);
        else if(activeSort==="payment") {
          const p=Number(userInput.price)-Number(userInput.down)||250000;
          filteredRates.sort((a,b)=>
            calculatePMT(a.rate/100/12,(a.term||20)*12,p)
            -calculatePMT(b.rate/100/12,(b.term||20)*12,p)
          );
        } else {
          filteredRates.sort((a,b)=>(a.fees||0)-(b.fees||0));
        }
        cardsToShow = 3;
        renderCards(filteredRates);
      },300);
    }

    // --- WIRE INPUTS & RUN ---
    const ip=widgetContainer.querySelector("#input-price"),
          id=widgetContainer.querySelector("#input-down"),
          bd=widgetContainer.querySelector("#down-badge");
    function updateDownBadge(){
      const p=parseFloat(ip.value)||0, d=parseFloat(id.value)||0;
      bd.textContent = p>0? Math.round((d/p)*100)+"%":"0%";
    }
    [ip,id].forEach(inp => inp.addEventListener("input",()=>{
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
