// RenteVergelijker Extension
export const RenteVergelijkerExtension = {
  name: "RenteVergelijker",
  type: "response",
  match: ({ trace }) => trace.type === "Custom_RenteVergelijker",
  render: ({ trace, element }) => {
    // --- Helpers (unchanged) ---
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

    // --- Container (max-width: 300px) ---
    element.innerHTML = "";
    const widgetContainer = document.createElement("div");
    widgetContainer.style.cssText = `
      font-family:Inter,Arial,sans-serif;
      max-width:300px;
      width:100%;
      margin:0 auto;
      background:#fff;
      border-radius:16px;
      box-shadow:0 2px 16px #0001;
      padding:24px;
    `;
    element.appendChild(widgetContainer);

    // --- Filter Panel Markup ---
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

    // --- Tiny Inline Styles for Inputs & Selects ---
    [ "#input-price", "#input-down" ].forEach(sel => {
      const el = inputPanel.querySelector(sel);
      Object.assign(el.style, {
        background:   "#eaf0ff",
        border:       "none",
        boxShadow:    "0 1px 2px #0001",
        borderRadius: "8px",
        fontSize:     "0.9em",
        padding:      "8px 12px",
        height:       "32px",
        outline:      "none",
      });
      el.addEventListener("focus", () => {
        el.style.boxShadow = "0 0 0 2px #2d5fff33";
      });
      el.addEventListener("blur", () => {
        el.style.boxShadow = "0 1px 2px #0001";
      });
    });

    [ "#input-term", "#input-country" ].forEach(sel => {
      const el = inputPanel.querySelector(sel);
      Object.assign(el.style, {
        background:   "#eaf0ff",
        border:       "none",
        boxShadow:    "0 1px 2px #0001",
        borderRadius: "8px",
        fontSize:     "0.9em",
        padding:      "8px 28px 8px 12px",
        height:       "32px",
        outline:      "none",
        appearance:   "none",
        position:     "relative",
        color:        "#2d5fff",
        fontWeight:   "700"
      });
      // wrap & arrow
      const wrapper = document.createElement("div");
      wrapper.style.position = "relative";
      el.parentNode.replaceChild(wrapper, el);
      wrapper.appendChild(el);
      const arrow = document.createElement("span");
      arrow.textContent = "▼";
      Object.assign(arrow.style, {
        position:      "absolute",
        right:         "8px",
        top:           "50%",
        transform:     "translateY(-50%)",
        pointerEvents: "none",
        color:         "#2d5fff",
        fontSize:      "0.8em",
      });
      wrapper.appendChild(arrow);
    });

    // Labels, badge, and button small tweaks
    inputPanel.querySelectorAll("label").forEach(lbl => {
      Object.assign(lbl.style, {
        fontSize:    "0.95em",
        fontWeight:  "600",
        display:     "block",
        marginBottom:"4px"
      });
    });
    Object.assign(inputPanel.querySelector("#down-badge").style, {
      display:      "inline-block",
      background:   "#2d5fff",
      color:        "#fff",
      fontSize:     "0.8em",
      fontWeight:   "700",
      borderRadius: "6px",
      padding:      "2px 6px",
      verticalAlign:"middle",
      marginLeft:   "6px"
    });
    Object.assign(inputPanel.querySelector("#btn-apply").style, {
      width:        "100%",
      background:   "#2d5fff",
      color:        "#fff",
      border:       "none",
      borderRadius: "8px",
      padding:      "8px 0",
      fontSize:     "0.95em",
      fontWeight:   "700",
      boxShadow:    "0 2px 8px #2d5fff22",
      cursor:       "pointer",
      margin:       "16px 0"
    });

    // --- Results Area ---
    const resultsArea = document.createElement("div");
    resultsArea.id = "results-area";
    resultsArea.style.minHeight = "140px";
    widgetContainer.appendChild(resultsArea);

    function showLoading() {
      resultsArea.innerHTML = `<div style="text-align:center;color:#aaa;padding:32px 0;font-size:0.95em">
        Loading rates…
      </div>`;
    }
    function showNoResults() {
      resultsArea.innerHTML = `<div style="text-align:center;color:#888;
        padding:32px;border-radius:8px;
        background:#f8f9fb;font-size:0.95em">
        No loans match your criteria.
      </div>`;
    }

    // --- Filter & Sort Logic ---
    let currentRates = [], filteredRates = [];
    let activeSort = "apr";
    let userInput = { price:"", down:"", term:"", country:"" };

    function applyFiltersAndRender() {
      showLoading();
      setTimeout(() => {
        filteredRates = currentRates
          .filter(r => userInput.country ? r.country === userInput.country : true)
          .filter(r => userInput.term ? String(r.term) === userInput.term : true);
        if (activeSort === "apr") filteredRates.sort((a,b)=>a.rate-b.rate);
        else if (activeSort === "payment") {
          const p = Number(userInput.price) - Number(userInput.down) || 250000;
          filteredRates.sort((a,b)=>
            calculatePMT(a.rate/100/12,(a.term||20)*12,p)
            - calculatePMT(b.rate/100/12,(b.term||20)*12,p)
          );
        } else if (activeSort === "fees") {
          filteredRates.sort((a,b)=> (a.fees||0)-(b.fees||0));
        }
        cardsToShow = 3;
        renderCards(filteredRates);
      }, 300);
    }

    // --- Wire Inputs & Button ---
    const ip = widgetContainer.querySelector("#input-price");
    const id = widgetContainer.querySelector("#input-down");
    const bd = widgetContainer.querySelector("#down-badge");

    function updateDownBadge() {
      const p = parseFloat(ip.value)||0, d = parseFloat(id.value)||0;
      bd.textContent = p>0 ? Math.round((d/p)*100)+"%" : "0%";
    }
    [ip,id].forEach(inp => {
      inp.addEventListener("input", () => {
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
      const pl = typeof trace.payload === "string"
        ? JSON.parse(trace.payload)
        : trace.payload || {};
      if (pl.ratesApiResponse) {
        let arr = Array.isArray(pl.ratesApiResponse)
          ? pl.ratesApiResponse
          : pl.ratesApiResponse.records;
        currentRates = Array.isArray(arr) && arr[0].fields
          ? transformAirtableData({ records: arr })
          : pl.ratesApiResponse;
      } else if (pl.records) {
        currentRates = transformAirtableData(pl);
      } else if (Array.isArray(pl.rates)) {
        currentRates = pl.rates;
      } else throw 0;

      // Populate country dropdown
      const opts = [...new Set(currentRates.map(r=>r.country).filter(Boolean))]
        .map(c => `<option value="${c}">${c}</option>`).join("");
      widgetContainer.querySelector("#input-country").innerHTML =
        `<option value="">Any</option>` + opts;

      applyFiltersAndRender();
    } catch {
      resultsArea.innerHTML = `<div style="color:red;padding:32px;text-align:center">
        Geen rentes beschikbaar. Probeer het later opnieuw.
      </div>`;
    }
  }
};
