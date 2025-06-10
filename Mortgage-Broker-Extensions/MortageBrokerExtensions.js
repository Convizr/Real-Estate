// RenteVergelijker Extension
export const RenteVergelijkerExtension = {
  name: "RenteVergelijker",
  type: "response",
  match: ({ trace }) => trace.type === "Custom_RenteVergelijker",
  render: ({ trace, element }) => {
    // --- DEBUG: see what payload actually is ---
    console.log("🔍 Raw payload:", trace.payload);

    // --- Top‐level state ---
    let currentRates  = [];
    let filteredRates = [];
    let activeSort    = "apr";
    let cardsToShow   = 3;                     // <— defined here
    let userInput     = { price:"", down:"", term:"", country:"" };

    // --- Robust payload parsing (like RealEstateExtension) ---
    let payloadObj;
    if (typeof trace.payload === "string") {
      try {
        payloadObj = JSON.parse(trace.payload);
      } catch (e) {
        console.error("Error parsing trace.payload:", e);
        payloadObj = {};
      }
    } else {
      payloadObj = trace.payload || {};
    }
    console.log("✅ Parsed payloadObj:", payloadObj);

    // Extract array of rates from whichever field is present
    let ratesArray = payloadObj.ratesApiResponse 
                  || payloadObj.records 
                  || payloadObj.rates 
                  || [];
    if (typeof ratesArray === "string") {
      try {
        ratesArray = JSON.parse(ratesArray);
      } catch (e) {
        console.error("Error parsing ratesArray string:", e);
        ratesArray = [];
      }
    }
    console.log("📊 Extracted ratesArray:", ratesArray);

    // Normalize Airtable format or raw array
    if (Array.isArray(ratesArray) && ratesArray[0]?.fields) {
      currentRates = transformAirtableData({ records: ratesArray });
    } else if (Array.isArray(ratesArray)) {
      currentRates = ratesArray;
    } else {
      console.warn("No valid rates array found, using empty list");
      currentRates = [];
    }

    // --- Container (force 300px wide) ---
    element.innerHTML = "";
    const widgetContainer = document.createElement("div");
    widgetContainer.style.cssText = `
      font-family:Inter,Arial,sans-serif;
      width:300px!important; max-width:300px!important;
      margin:0 auto;
      background:#fff;
      border-radius:16px;
      box-shadow:0 2px 16px #0001;
      padding:24px;
      box-sizing:border-box;
    `;
    element.appendChild(widgetContainer);

    // --- Filter Panel Markup & Ultra-compact Styling ---
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

    // Ultra-compact inline styles (fields, labels, badge, button)
    [ "#input-price", "#input-down" ].forEach(sel => {
      const el = inputPanel.querySelector(sel);
      Object.assign(el.style, {
        background:"#eaf0ff", border:"none",
        boxShadow:"0 1px 1px #0001", borderRadius:"6px",
        fontSize:"0.85em", padding:"6px 10px", height:"28px",
        outline:"none", width:"100%", boxSizing:"border-box"
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
        background:"#eaf0ff", border:"none",
        boxShadow:"0 1px 1px #0001", borderRadius:"6px",
        fontSize:"0.85em", padding:"6px 24px 6px 10px", height:"28px",
        outline:"none", appearance:"none",
        width:"100%", boxSizing:"border-box",
        color:"#2d5fff", fontWeight:"700"
      });
      const arrow = document.createElement("span");
      arrow.textContent="▼";
      Object.assign(arrow.style,{
        position:"absolute", right:"8px",
        top:"50%", transform:"translateY(-50%)",
        pointerEvents:"none", color:"#2d5fff", fontSize:"0.75em"
      });
      wrapper.appendChild(arrow);
    });
    inputPanel.querySelectorAll("label").forEach(lbl=>{
      Object.assign(lbl.style, {
        fontSize:"0.9em", fontWeight:"600",
        display:"block", marginBottom:"3px"
      });
    });
    Object.assign(inputPanel.querySelector("#down-badge").style, {
      display:"inline-block", background:"#2d5fff", color:"#fff",
      fontSize:"0.75em", fontWeight:"700",
      borderRadius:"4px", padding:"2px 4px",
      verticalAlign:"middle", marginLeft:"6px"
    });
    Object.assign(inputPanel.querySelector("#btn-apply").style, {
      width:"100%", background:"#2d5fff", color:"#fff",
      border:"none", borderRadius:"6px", padding:"6px 0",
      fontSize:"0.9em", fontWeight:"700",
      boxShadow:"0 2px 8px #2d5fff22", cursor:"pointer",
      margin:"12px 0"
    });

    // --- Results Area & helpers ---
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

    // --- Card Renderer & Pagination ---
    function renderCards(rates) {
      if (!rates.length) return showNoResults();
      resultsArea.innerHTML = "";
      const grid = document.createElement("div");
      grid.className = "vf-card-grid";
      grid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;";

      // compute scores…
      const computed = rates.slice(0, cardsToShow).map(r => {
        const principal = Number(userInput.price) - Number(userInput.down) || 250000;
        const nper = (r.term||20)*12;
        const rateM = (r.rate||3)/100/12;
        return {
          rateObj: r,
          monthly: calculatePMT(rateM,nper,principal),
          fees:    r.fees || estimateFees(principal)
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
        const np = maxs.pay!==mins.pay ? (c.monthly-mins.pay)/(maxs.pay-mins.pay) : 0;
        const nf = maxs.fees!==mins.fees ? (c.fees-mins.fees)/(maxs.fees-mins.fees) : 0;
        const nr = maxs.rate!==mins.rate ? (c.rateObj.rate-mins.rate)/(maxs.rate-mins.rate) : 0;
        const nt = maxs.term ? (c.rateObj.term||0)/maxs.term : 0;
        c.score = 0.4*np + 0.2*nf + 0.2*nr - 0.2*nt;
      });
      let bestIdx=0, bestScore=computed[0].score;
      computed.forEach((c,i)=>{ if(c.score<bestScore){bestScore=c.score;bestIdx=i;} });

      computed.forEach((c,i)=>{
        const { rateObj, monthly, fees } = c;
        const rec = i===bestIdx;
        const card = document.createElement("div");
        card.style.cssText = `
          background:#fff;border-radius:8px;
          box-shadow:0 1px 4px #0001;padding:12px;
          display:flex;flex-direction:column;
          border:2px solid ${rec? '#2d5fff':'#ddd'};
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
            ${rec?`<span style="
              background:#2d5fff;color:#fff;
              font-size:0.7em;border-radius:4px;
              padding:1px 4px;margin-left:auto">
              Recommended
            </span>`:``}
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
      if (rates.length > cardsToShow) {
        const more = document.createElement("button");
        more.textContent = "More";
        more.style.cssText = `
          display:block;margin:12px auto 0;
          background:#f3f6ff;color:#2d5fff;
          border:none;border-radius:6px;
          padding:6px 12px;font-weight:600;
          font-size:0.85em;cursor:pointer;
        `;
        more.onclick = () => { cardsToShow += 3; renderCards(rates); };
        resultsArea.appendChild(more);
      }
    }

    // --- Filter & Sort Logic ---
    let currentRates = [], filteredRates = [];
    let activeSort = "apr", cardsToShow = 3;
    let userInput = { price:"", down:"", term:"", country:"" };

    function applyFiltersAndRender() {
      showLoading();
      setTimeout(() => {
        filteredRates = currentRates
          .filter(r => userInput.country ? r.country===userInput.country : true)
          .filter(r => userInput.term   ? String(r.term)===userInput.term : true);

        if (activeSort==="apr") filteredRates.sort((a,b)=>a.rate-b.rate);
        else if (activeSort==="payment") {
          const p= Number(userInput.price)-Number(userInput.down)||250000;
          filteredRates.sort((a,b)=>
            calculatePMT(a.rate/100/12,(a.term||20)*12,p)
            - calculatePMT(b.rate/100/12,(b.term||20)*12,p)
          );
        } else if (activeSort==="fees") {
          filteredRates.sort((a,b)=>(a.fees||0)-(b.fees||0));
        }

        cardsToShow = 3;
        renderCards(filteredRates);
      }, 300);
    }

    // --- Wire Up Inputs & Button ---
    const ip = widgetContainer.querySelector("#input-price"),
          id = widgetContainer.querySelector("#input-down"),
          bd = widgetContainer.querySelector("#down-badge");

    function updateDownBadge() {
      const p=parseFloat(ip.value)||0, d=parseFloat(id.value)||0;
      bd.textContent = p>0? Math.round((d/p)*100)+"%": "0%";
    }
    [ip,id].forEach(inp=>{
      inp.addEventListener("input", ()=>{
        inp.value = inp.value.replace(/\D/g,"");
        updateDownBadge();
      });
    });
    updateDownBadge();

    widgetContainer.querySelector("#btn-apply").onclick = () => {
      userInput.price   = ip.value;
      userInput.down    = id.value;
      userInput.term    = widgetContainer.querySelector("#input-term").value;
      userInput.country = widgetContainer.querySelector("#input-country").value;
      applyFiltersAndRender();
    };

    // --- Initialize from Payload ---
    try {
      const pl = typeof trace.payload==="string"
        ? JSON.parse(trace.payload)
        : trace.payload||{};

      const dataArray =
        pl.ratesApiResponse ||
        pl.records ||
        (Array.isArray(pl) ? pl : null);

      if (!dataArray) throw new Error("No rates payload");

      currentRates = Array.isArray(dataArray) && dataArray[0].fields
        ? transformAirtableData({ records: dataArray })
        : dataArray;

      // populate country dropdown
      const opts = [...new Set(currentRates.map(r=>r.country).filter(Boolean))]
        .map(c=>`<option value="${c}">${c}</option>`).join("");
      widgetContainer.querySelector("#input-country").innerHTML =
        `<option value="">Any</option>` + opts;

      applyFiltersAndRender();
    } catch (err) {
      console.error(err);
      showNoResults();
    }
  }
};
