// RenteVergelijker Extension
export const RenteVergelijkerExtension = {
  name: "RenteVergelijker",
  type: "response",
  match: ({ trace }) => trace.type === "Custom_RenteVergelijker",
  render: ({ trace, element }) => {
    console.log("Render called with element:", element);
    console.log("Trace payload:", trace.payload);

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

    // Create the widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'rente-widget';
    widgetContainer.style.cssText = 'font-family: Arial, sans-serif; width:100%;';

    // Create summary container
    const summaryContainer = document.createElement('div');
    summaryContainer.id = 'summary-container';
    widgetContainer.appendChild(summaryContainer);

    // Create header with filters
    const headerDiv = document.createElement('div');
    headerDiv.id = 'widget-header';
    headerDiv.style.cssText = 'margin:8px 0;';

    const filterLowest = document.createElement('button');
    filterLowest.id = 'filter-lowest';
    filterLowest.textContent = 'Lowest Rate';
    headerDiv.appendChild(filterLowest);

    const filterShortest = document.createElement('button');
    filterShortest.id = 'filter-shortest';
    filterShortest.textContent = 'Shortest Term';
    headerDiv.appendChild(filterShortest);

    const filterNHG = document.createElement('button');
    filterNHG.id = 'filter-nhg';
    filterNHG.textContent = 'NHG Only';
    headerDiv.appendChild(filterNHG);

    widgetContainer.appendChild(headerDiv);

    // Create table container
    const tableContainer = document.createElement('div');
    tableContainer.id = 'widget-body';
    tableContainer.style.cssText = 'max-height:300px; overflow-y:auto; border:1px solid #ddd;';

    // Create table
    const table = document.createElement('table');
    table.id = 'rente-table';
    table.style.cssText = 'width:100%; border-collapse: collapse;';

    // Create table header
    const thead = document.createElement('thead');
    thead.style.cssText = 'background-color:#f0f0f0;';
    thead.innerHTML = `
      <tr>
        <th style="padding:8px; border-bottom:1px solid #ccc;">Country</th>
        <th style="padding:8px; border-bottom:1px solid #ccc;">Bank</th>
        <th style="padding:8px; border-bottom:1px solid #ccc;">Term (yrs)</th>
        <th style="padding:8px; border-bottom:1px solid #ccc;">Type</th>
        <th style="padding:8px; border-bottom:1px solid #ccc;">NHG</th>
        <th style="padding:8px; border-bottom:1px solid #ccc;">Rate (%)</th>
      </tr>
    `;
    table.appendChild(thead);

    // Create table body
    const tbody = document.createElement('tbody');
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="padding:12px; text-align:center; color:#666;">
          Loading rates…
        </td>
      </tr>
    `;
    table.appendChild(tbody);
    tableContainer.appendChild(table);
    widgetContainer.appendChild(tableContainer);

    // Create footer
    const footer = document.createElement('div');
    footer.id = 'widget-footer';
    footer.style.cssText = 'margin-top:8px; font-size:0.85em; color:#666;';
    
    const errorMessage = document.createElement('span');
    errorMessage.id = 'error-message';
    footer.appendChild(errorMessage);
    widgetContainer.appendChild(footer);

    // Add the widget to the element
    element.appendChild(widgetContainer);

    // Helper: show error
    function showError(message) {
      errorMessage.textContent = message;
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="padding:12px; text-align:center; color:red;">
            ${message}
          </td>
        </tr>
      `;
    }

    // Helper: render average summary if provided
    function renderAverageSummary(averageRates) {
      const rowsHtml = averageRates.map(r => `
        <tr>
          <td style="padding:6px;border-bottom:1px solid #eee;">${r.country}</td>
          <td style="padding:6px;border-bottom:1px solid #eee;">
            ${r.rate !== undefined ? r.rate.toFixed(2) + "%" : r.range}
          </td>
          <td style="padding:6px;border-bottom:1px solid #eee;">${r.source}</td>
        </tr>
      `).join("");

      summaryContainer.innerHTML = `
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
      if (!Array.isArray(ratesArray) || ratesArray.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="padding:12px; text-align:center; color:#666;">
              Geen rentes gevonden.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = ""; // clear
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
        tbody.appendChild(tr);
      });
    }

    // Attach filter button listeners
    filterLowest.addEventListener("click", () => {
      activeFilter = (activeFilter === "lowest") ? null : "lowest";
      applyFiltersAndRender();
    });

    filterShortest.addEventListener("click", () => {
      activeFilter = (activeFilter === "shortest") ? null : "shortest";
      applyFiltersAndRender();
    });

    filterNHG.addEventListener("click", () => {
      activeFilter = (activeFilter === "nhg") ? null : "nhg";
      applyFiltersAndRender();
    });

    // Parse and render payload
    try {
      const payloadObj = JSON.parse(trace.payload || "{}");
      
      // Handle the ratesApiResponse structure
      if (payloadObj.ratesApiResponse) {
        const apiResponse = JSON.parse(payloadObj.ratesApiResponse);
        if (apiResponse.records) {
          currentRates = transformAirtableData(apiResponse);
        } else if (Array.isArray(apiResponse.rates)) {
          currentRates = apiResponse.rates;
        } else {
          throw new Error("Invalid ratesApiResponse format");
        }
      } else if (payloadObj.records) {
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
      console.error("Error processing payload:", err);
      showError("Geen rentes beschikbaar. Probeer het later opnieuw.");
    }
  }
}; 