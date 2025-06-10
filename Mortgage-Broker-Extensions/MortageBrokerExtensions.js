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

    // --- Clear host & build container ---
    element.innerHTML = "";
    const widgetContainer = document.createElement("div");
    widgetContainer.style.cssText = `
      font-family:Inter,Arial,sans-serif;
      max-width:600px;
      margin:0 auto;
      background:#fff;
      border-radius:16px;
      box-shadow:0 2px 16px #0001;
      padding:24px;
    `;

    // --- Filter Panel HTML ---
    const inputPanel = document.createElement("div");
    inputPanel.id = "user-inputs";
    inputPanel.innerHTML = `
      <div class="vf-mortgage-row" style="position:relative; gap:16px;">
        <div class="vf-mortgage-col">
          <label>Purchase Price
            <span title="Total price of the property." style="cursor:help;color:#888">?</span><br>
            <span class="vf-loan-input-currency-euro"><span>€</span>
              <input id="input-price" type="text" placeholder="e.g. 300000" autocomplete="off" inputmode="numeric">
            </span>
          </label>
        </div>
        <div class="vf-mortgage-col">
          <label>Down Payment
            <span title="Amount you pay upfront." style="cursor:help;color:#888">?</span><br>
            <span class="vf-loan-input-currency-euro"><span>€</span>
              <input id="input-down" type="text" placeholder="e.g. 60000" autocomplete="off" inputmode="numeric">
            </span>
            <span id="down-badge">0%</span>
          </label>
        </div>
        <button id="sort-icon" title="Sort options" style="
          background:none;border:none;cursor:pointer;
          color:#2d5fff;font-size:1.2em;width:36px;height:36px;
          position:absolute;right:0;top:0;">⇅</button>
      </div>
      <div class="vf-mortgage-row" style="margin-top:16px; align-items:flex-end; gap:16px;">
        <div class="vf-mortgage-col">
          <label>Loan Term</label>
          <select id="input-term">
            <option value="">Any</option>
            <option value="10">10 yrs</option>
            <option value="15">15 yrs</option>
            <option value="20">20 yrs</option>
            <option value="30">30 yrs</option>
          </select>
        </div>
        <div class="vf-mortgage-col">
          <label>Country</label>
          <select id="input-country">
            <option value="">Any</option>
          </select>
        </div>
      </div>
      <button id="btn-apply">Get Rates</button>
    `;
    widgetContainer.appendChild(inputPanel);

    // --- INLINE STYLING for text inputs & selects ---
    const shared = {
      background:    "#f8faff",
      border:        "1px solid #d0e0ff",
      boxShadow:     "0 1px 3px #0002",
      borderRadius:  "12px",
      fontSize:      "1em",
      padding:       "10px 14px",
      outline:       "none",
      transition:    "border-color 0.15s, box-shadow 0.15s"
    };

    // Text boxes: white background + blue underline focus
    [ "#input-price", "#input-down" ].forEach(sel => {
      const el = inputPanel.querySelector(sel);
      Object.assign(el.style, {
        background:   "#fff",
        border:       "1.5px solid #dbe6ff",
        borderBottom: "3px solid #2d5fff",
        borderRadius: "8px",
        fontSize:     "1em",
        padding:      "12px 12px 10px 38px",
        outline:      "none",
      });
      el.addEventListener("focus", () => {
        el.style.borderColor  = "#2d5fff";
        el.style.borderBottom = "3px solid #1a3fd1";
      });
      el.addEventListener("blur", () => {
        el.style.borderColor  = "#dbe6ff";
        el.style.borderBottom = "3px solid #2d5fff";
      });
    });

    // Dropdowns: pill shape + custom arrow
    [ "#input-term", "#input-country" ].forEach(sel => {
      const el = inputPanel.querySelector(sel);
      Object.assign(el.style, shared, {
        background:   "#eaf0ff",
        border:       "none",
        boxShadow:    "0 1px 4px #0001",
        borderRadius: "14px",
        padding:      "10px 36px 10px 18px",
        appearance:   "none",
        position:     "relative",
      });

      // wrap & inject arrow
      const wrapper = document.createElement("div");
      wrapper.style.position = "relative";
      el.parentNode.replaceChild(wrapper, el);
      wrapper.appendChild(el);

      const arrow = document.createElement("span");
      arrow.textContent = "▼";
      Object.assign(arrow.style, {
        position:       "absolute",
        right:          "16px",
        top:            "50%",
        transform:      "translateY(-50%)",
        pointerEvents:  "none",
        color:          "#2d5fff",
        fontSize:       "0.9em"
      });
      wrapper.appendChild(arrow);
    });

    // Labels bold + 1em
    inputPanel.querySelectorAll("label").forEach(lbl => {
      Object.assign(lbl.style, {
        fontSize:   "1em",
        fontWeight: "600",
        display:    "block",
        marginBottom: "4px"
      });
    });

    // Badge & button styling
    Object.assign(inputPanel.querySelector("#down-badge").style, {
      background:   "#2d5fff",
      color:        "#fff",
      fontWeight:   "700",
      fontSize:     "0.9em",
      borderRadius: "8px",
      padding:      "4px 8px",
      marginLeft:   "8px",
    });
    Object.assign(inputPanel.querySelector("#btn-apply").style, {
      width:        "100%",
      background:   "#2d5fff",
      color:        "#fff",
      border:       "none",
      borderRadius: "14px",
      padding:      "10px 0",
      fontSize:     "1em",
      fontWeight:   "700",
      boxShadow:    "0 2px 8px #2d5fff22",
      cursor:       "pointer",
      margin:       "24px 0",
    });

    // --- Results Area ---
    const resultsArea = document.createElement("div");
    resultsArea.id = "results-area";
    resultsArea.style.minHeight = "180px";
    widgetContainer.appendChild(resultsArea);

    // --- Loading / No Results Helpers (unchanged) ---
    function showLoading() {
      resultsArea.innerHTML = `
        <div style="text-align:center;color:#aaa;padding:48px 0;font-size:1.1em">
          Loading rates…
        </div>`;
    }
    function showNoResults() {
      resultsArea.innerHTML = `
        <div style="text-align:center;color:#888;
                    padding:48px;border-radius:12px;
                    background:#f8f9fb;font-size:1.1em">
          No loans found matching your criteria.
        </div>`;
    }

    // --- Card Renderer, Filtering, Events, Payload Parsing ---
    // (Keep your existing renderCards, applyFiltersAndRender, listeners, and payload logic here)

    element.appendChild(widgetContainer);
  }
};
