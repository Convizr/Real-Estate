// RenteVergelijker Extension
export const RenteVergelijkerExtension = {
  name: "RenteVergelijker",
  type: "response",
  match: ({ trace }) => trace.type === "Custom_RenteVergelijker",
  render: ({ trace, element }) => {
    // Build container HTML
    element.innerHTML = `
      <div id="rente-widget" style="font-family: Arial, sans-serif; width:100%;">
        <!-- (Optional) Average Rates Summary Table -->
        <div id="summary-container"></div>

        <!-- Filters and Country (if you want to allow "group by country") -->
        <div id="widget-header" style="margin:8px 0;">
          <button id="filter-lowest">Lowest Rate</button>
          <button id="filter-shortest">Shortest Term</button>
          <button id="filter-nhg">NHG Only</button>
        </div>

        <!-- Interactive Rates Table -->
        <div id="widget-body" style="max-height:300px; overflow-y:auto; border:1px solid #ddd;">
          <table id="rente-table" style="width:100%; border-collapse: collapse;">
            <thead style="background-color:#f0f0f0;">
              <tr>
                <th style="padding:8px; border-bottom:1px solid #ccc;">Country</th>
                <th style="padding:8px; border-bottom:1px solid #ccc;">Bank</th>
                <th style="padding:8px; border-bottom:1px solid #ccc;">Term (yrs)</th>
                <th style="padding:8px; border-bottom:1px solid #ccc;">Type</th>
                <th style="padding:8px; border-bottom:1px solid #ccc;">NHG</th>
                <th style="padding:8px; border-bottom:1px solid #ccc;">Rate (%)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colspan="6" style="padding:12px; text-align:center; color:#666;">
                  Loading rates…
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Footer/Error -->
        <div id="widget-footer" style="margin-top:8px; font-size:0.85em; color:#666;">
          <span id="error-message"></span>
        </div>
      </div>
    `;

    // In-memory state
    let currentRates = [];
    let filteredRates = [];
    let activeFilter = null;

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

    // Helper: show error
    function showError(message) {
      document.getElementById("error-message").innerText = message;
      // Also clear table
      document.querySelector("#rente-table tbody").innerHTML = `
        <tr>
          <td colspan="6" style="padding:12px; text-align:center; color:red;">
            ${message}
          </td>
        </tr>
      `;
    }

    // Helper: render average summary if provided
    function renderAverageSummary(averageRates) {
      const container = document.getElementById("summary-container");
      const rowsHtml = averageRates.map(r => `
        <tr>
          <td style="padding:6px;border-bottom:1px solid #eee;">${r.country}</td>
          <td style="padding:6px;border-bottom:1px solid #eee;">
            ${r.rate !== undefined ? r.rate.toFixed(2) + "%" : r.range}
          </td>
          <td style="padding:6px;border-bottom:1px solid #eee;">${r.source}</td>
        </tr>
      `).join("");
      container.innerHTML = `
        <h3>Gemiddelde Hypotheekrentes (begin 2025)</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
          <thead>
            <tr>
              <th style="padding:6px;border-bottom:1px solid #ccc;">Country</th>
              <th style="padding:6px;border-bottom:1px solid #ccc;">Rate</th>
              <th style="padding:6px;border-bottom:1px solid #ccc;">Source</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      `;
    }

    // Helper: apply filters & render table
    function applyFiltersAndRender() {
      filteredRates = [...currentRates];
      if (activeFilter === "lowest") {
        filteredRates.sort((a, b) => a.rate - b.rate);
      } else if (activeFilter === "shortest") {
        filteredRates.sort((a, b) => a.term - b.term);
      } else if (activeFilter === "nhg") {
        filteredRates = filteredRates.filter(r => r.nhg === true);
      }
      renderRatesTable(filteredRates);
    }

    // Helper: render the rates table
    function renderRatesTable(ratesArray) {
      const tbodyEl = document.querySelector("#rente-table tbody");
      if (!Array.isArray(ratesArray) || ratesArray.length === 0) {
        tbodyEl.innerHTML = `
          <tr>
            <td colspan="6" style="padding:12px; text-align:center; color:#666;">
              Geen rentes gevonden.
            </td>
          </tr>
        `;
        return;
      }
      tbodyEl.innerHTML = ""; // clear
      ratesArray.forEach(rateObj => {
        const tr = document.createElement("tr");
        tr.style.cursor = "pointer";
        tr.addEventListener("mouseover", () => { tr.style.backgroundColor = "#f9f9f9"; });
        tr.addEventListener("mouseout", () => { tr.style.backgroundColor = ""; });
        tr.innerHTML = `
          <td style="padding:8px;border-bottom:1px solid #eee;">${rateObj.country}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${rateObj.bank || "–"}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${rateObj.term}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${rateObj.type}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${rateObj.nhg ? "Yes" : "No"}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${rateObj.rate.toFixed(2)}</td>
        `;
        tr.addEventListener("click", () => {
          VF.events.emit("RATE_SELECTED", {
            country: rateObj.country,
            bank: rateObj.bank || null,
            term: rateObj.term,
            type: rateObj.type,
            nhg: rateObj.nhg,
            rate: rateObj.rate,
            source: rateObj.source,
            dataDate: rateObj.dataDate
          });
        });
        tbodyEl.appendChild(tr);
      });
    }

    // Attach filter button listeners
    document.getElementById("filter-lowest").addEventListener("click", () => {
      activeFilter = (activeFilter === "lowest") ? null : "lowest";
      applyFiltersAndRender();
    });
    document.getElementById("filter-shortest").addEventListener("click", () => {
      activeFilter = (activeFilter === "shortest") ? null : "shortest";
      applyFiltersAndRender();
    });
    document.getElementById("filter-nhg").addEventListener("click", () => {
      activeFilter = (activeFilter === "nhg") ? null : "nhg";
      applyFiltersAndRender();
    });

    // Parse and render payload
    try {
      const payloadObj = JSON.parse(trace.payload || "{}");
      
      // Transform Airtable data to our format
      if (payloadObj.records) {
        currentRates = transformAirtableData(payloadObj);
      } else if (Array.isArray(payloadObj.rates)) {
        currentRates = payloadObj.rates;
      } else {
        throw new Error("Invalid payload format");
      }

      // Handle average rates if provided
      if (Array.isArray(payloadObj.averageRates)) {
        renderAverageSummary(payloadObj.averageRates);
      }

      applyFiltersAndRender();
    } catch (err) {
      showError("Geen rentes beschikbaar. Probeer het later opnieuw.");
      console.error("Payload parse error:", err);
    }
  }
}; 