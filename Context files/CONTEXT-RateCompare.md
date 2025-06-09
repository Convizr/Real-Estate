# Dynamic Interest Rate Comparison Widget

## 1. Overview

**Name:**  Dynamic Interest Rate Comparison Widget
**Context:** A Voiceflow JavaScript response extension that renders an interactive mortgage-rate table/grid. All rate data is provided by Voiceflow (via trace.payload), so there is no direct API or periodic fetch.

**Primary Goal:**
- Show a demo widget where Voiceflow passes in a JSON payload containing rates for various countries/terms/types
- Allow end users to filter ("Lowest rate," "Shortest term," "NHG only") and click a rate
- Emit a RATE_SELECTED event back to Voiceflow, with the chosen rate details

## 2. Functional Requirements

### 2.1 Rendering
- Display a table (or radio-button list) of mortgage-rate entries
- Each row must include at least:
  - Country (NL, BE, etc.)
  - Bank (if available)
  - Term (e.g., 10, 15, 20 years)
  - Type (e.g., "Annuity," "Linear," "With NHG")
  - Rate (percentage)

### 2.2 Data Source
- Voiceflow will send a single JSON payload when invoking this response extension
- That payload will define a top-level array of "rates" (or an averageRates block, see Section 11)
- No in-extension fetch logic—everything must come from trace.payload

### 2.3 User Interaction
- A user clicks (or taps) any rate row → the extension emits RATE_SELECTED with a payload like:

```json
{
  "country": "NL",
  "bank": "Bank A",
  "term": 10,
  "type": "Annuity",
  "nhg": true,
  "rate": 3.45
}
```

- Voiceflow then captures that event into a variable (e.g., userChosenRate)

### 2.4 Filtering and Sorting
- Provide filter controls to let the user sort or narrow down:
  - "Lowest rate" (ascending by rate)
  - "Shortest term" (ascending by term)
  - "NHG only" (show only rows where nhg === true)
- Toggling any filter will re-render the table

### 2.5 Error Handling
- If the incoming payload is invalid (e.g., missing or not an array), show a friendly error row:
  "Geen rentes beschikbaar. Probeer het later opnieuw."
- Log errors to console.error for debugging

### 2.6 Integration with Voiceflow
- This is purely a Response Extension—you embed a `<script>` block (or upload a .js file) into Voiceflow's "Custom Extension" area
- Voiceflow must send a custom trace (e.g., type = "Custom_RenteVergelijker") with payload = JSON.stringify({ rates: [ … ] })
- After rendering, the extension waits for user clicks, then emits RATE_SELECTED, which Voiceflow captures into a variable

## 3. Payload Structure

### 3.1 Expected "rates" Array

The Voiceflow payload should look like:

```json
{
  "rates": [
    {
      "country": "NL",
      "bank": "Bank A",
      "term": 10,
      "type": "Annuity",
      "nhg": true,
      "rate": 3.15
    },
    {
      "country": "NL",
      "bank": "Bank B",
      "term": 15,
      "type": "Linear",
      "nhg": false,
      "rate": 2.95
    },
    {
      "country": "BE",
      "bank": "Bank C",
      "term": 20,
      "type": "Annuity",
      "nhg": false,
      "rate": 3.29
    }
  ]
}
```

- **country:** two-letter code (e.g., "NL", "DE", "BE")
- **bank:** string (lender name; optional if not provided)
- **term:** number (years)
- **type:** string (e.g., "Annuity", "Linear", "With NHG")
- **nhg:** boolean (true if NHG applies)
- **rate:** number (percent, e.g., 3.15)

### 3.2 Sample "Average Rates" Payload (Optional)

If you want to start by showing a summary of average rates (early 2025), Voiceflow can send an alternate payload in the same trace:

```json
{
  "averageRates": [
    {
      "country": "NL",
      "range": "3.50% – 4.50%",
      "source": "Hanno, Hypotheekrente-overzicht"
    },
    {
      "country": "DE",
      "rate": 3.60,
      "source": "TheGlobalEconomy (ECB-data, Mar 2025)"
    },
    {
      "country": "BE",
      "rate": 3.29,
      "source": "TheGlobalEconomy (ECB-data, Mar 2025)"
    },
    {
      "country": "FR",
      "range": "2.77% – 2.99%",
      "average": 3.00,
      "source": "Capifrance & Cafpi"
    },
    {
      "country": "IT",
      "rate": 3.18,
      "source": "ECB data via GlobalPropertyGuide"
    },
    {
      "country": "ES",
      "rate": 2.97,
      "source": "INE (Mar 2025)"
    },
    {
      "country": "PT",
      "rate": 3.98,
      "source": "AlgarveProp / Pedro's Mortgage RateRadar"
    }
  ],
  "rates": [ 
    /* full array of individual rate objects (as above) */ 
  ]
}
```

- In that case, the extension can optionally render a small summary table of averageRates at the top, followed by the interactive "rates" table

## 4. Component Breakdown

### 4.1 Response Extension Initialization
- On load, parse trace.payload
- If payload.rates is a valid array, store it in currentRates; else show error

HTML skeleton (in Response Extension):

```html
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
        <!-- Populated dynamically -->
      </tbody>
    </table>
  </div>

  <!-- Footer/Error -->
  <div id="widget-footer" style="margin-top:8px; font-size:0.85em; color:#666;">
    <span id="error-message"></span>
  </div>
</div>
```

### 4.2 Data Model (Client-side JS)

```javascript
let currentRates = [];    // full array from payload
let filteredRates = [];   // after applying filters
let activeFilter = null;  // "lowest" | "shortest" | "nhg" | null
```

### 4.3 Parsing Voiceflow Payload

Inside your Response Extension's `<script>`:

```javascript
try {
  const payloadObj = JSON.parse(trace.payload || "{}");
  if (!Array.isArray(payloadObj.rates)) {
    throw new Error("Invalid or missing rates array");
  }
  currentRates = payloadObj.rates;
  // (Optional) If payloadObj.averageRates exists, render summary first
  if (Array.isArray(payloadObj.averageRates)) {
    renderAverageSummary(payloadObj.averageRates);
  }
  applyFiltersAndRender();
} catch (err) {
  showError("Geen rentes beschikbaar. Probeer het later opnieuw.");
  console.error("Payload parse error:", err);
}
```

### 4.4 Rendering the "Average Rates" Summary (Optional)

```javascript
function renderAverageSummary(averageRates) {
  // Build a simple HTML table of averageRates
  const container = document.getElementById("summary-container");
  let html = `
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
        ${averageRates.map(r => `
          <tr>
            <td style="padding:6px;border-bottom:1px solid #eee;">${r.country}</td>
            <td style="padding:6px;border-bottom:1px solid #eee;">
              ${r.rate !== undefined ? r.rate.toFixed(2) + "%" : r.range}
            </td>
            <td style="padding:6px;border-bottom:1px solid #eee;">${r.source}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
  container.innerHTML = html;
}
```

### 4.5 Filtering & Rendering Logic

```javascript
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

function renderRatesTable(ratesArray) {
  const tbodyEl = document.querySelector("#rente-table tbody");
  tbodyEl.innerHTML = ""; // clear existing rows

  if (ratesArray.length === 0) {
    tbodyEl.innerHTML = `
      <tr>
        <td colspan="6" style="padding:12px; text-align:center; color:#666;">
          Geen rentes gevonden.
        </td>
      </tr>
    `;
    return;
  }

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
        rate: rateObj.rate
      });
    });

    tbodyEl.appendChild(tr);
  });
}
```

### 5.6 Filter Button Handlers

```javascript
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
```

### 4.7 Error Display

```javascript
function showError(message) {
  const footer = document.getElementById("widget-footer");
  footer.innerHTML = `<span style="color:red;">${message}</span>`;
}
```

- If trace.payload is invalid, call showError(...)
- No retries or periodic fetches—this is a pure "payload in, UI renders, user interacts" demo

## 5. Voiceflow Flow Example (Demo)

1. Speak (or "Text" block):
   "Hier zie je de actuele hypotheekrentes. Kies een rente om verder te gaan."

2. Custom Trace (immediately after):
   - Type: Custom_RenteVergelijker
   - Payload:

```json
{
  "averageRates": [
    { "country": "NL", "range": "3.50% – 4.50%", "source": "Hanno" },
    { "country": "DE", "rate": 3.60, "source": "ECB (Mar 2025)" },
    { "country": "BE", "rate": 3.29, "source": "ECB (Mar 2025)" }
  ],
  "rates": [
    {
      "country": "NL",
      "bank": "Bank A",
      "term": 10,
      "type": "Annuity",
      "nhg": true,
      "rate": 3.15
    },
    {
      "country": "NL",
      "bank": "Bank B",
      "term": 15,
      "type": "Linear",
      "nhg": false,
      "rate": 2.95
    },
    {
      "country": "BE",
      "bank": "Bank C",
      "term": 20,
      "type": "Annuity",
      "nhg": false,
      "rate": 3.29
    }
  ]
}
```

3. Response Extension (RenteVergelijkerExtension)
   - Your code (as shown in Section 5) is pasted here
   - Voiceflow automatically calls match({ trace }), sees that trace.type === "Custom_RenteVergelijker", and invokes render({ trace, element })

4. Capture block (immediately after the Response Extension)
   - Event Name: RATE_SELECTED
   - Save as Variable: userChosenRate

5. Speak (using captured result):
   - "Je hebt gekozen: {{userChosenRate.rate}}% voor {{userChosenRate.term}} jaar."

6. …Proceed with subsequent logic (e.g., mortgage calculation)…

## 6. Why This Demo & Template Works for Others

- **Single-Payload Source:** By removing any direct API fetch, anyone can copy-paste this widget and simply send their own JSON
- **Minimal Dependencies:** All logic lives in one `<script>` block (or .js file)
- **Customizable Filters:** You can rename or extend filter buttons to other criteria (e.g., "Lowest + NHG")
- **Easy to Adapt:** If you want to show additional columns (e.g., effective APR), just add another `<th>` and adjust renderRatesTable
- **Self-Contained:** No external libraries—pure JavaScript + minimal inline CSS
- **Clear Event Flow:** When the user picks a rate, you know exactly what payload Voiceflow will receive (RATE_SELECTED)

## 7. Suggested UX & Feature Enhancements

**Goal:** Move from a bare-bones "table + three buttons" into a friendly, SaaS-style mortgage-comparison experience.

---

### 7.1 Add a Pre-Table Input Panel

Before showing any rates, let users narrow down the universe by entering their own numbers. Build a form above the table:

```html
<div id="user-inputs" style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:16px;">
  <div>
    <label>Purchase Price</label>
    <input id="input-price" type="number" placeholder="e.g. 300000" />
  </div>
  <div>
    <label>Down Payment</label>
    <input id="input-down" type="number" placeholder="e.g. 60000" />
  </div>
  <div>
    <label>Loan Term</label>
    <select id="input-term">
      <option value="10">10 yrs</option>
      <option value="15">15 yrs</option>
      <option value="20">20 yrs</option>
      <option value="30">30 yrs</option>
    </select>
  </div>
  <div>
    <label>Credit Score</label>
    <select id="input-score">
      <option value="excellent">Excellent</option>
      <option value="good">Good</option>
      <option value="fair">Fair</option>
    </select>
  </div>
  <div>
    <label>ZIP Code</label>
    <input id="input-zip" type="text" placeholder="e.g. 90210" />
  </div>
  <button id="btn-apply" style="align-self:flex-end">Get Rates</button>
</div>
```

- **Behavior:** On "Get Rates" click, filter your `currentRates` by matching term & credit score, compute monthly payment for each row, then render the table.

---

### 7.2 Calculate & Display Monthly Payment & Fees

Extend each rate entry with:

```js
monthlyPayment = calculatePMT(rate / 100 / 12, term*12, principal – downPayment);
totalFees = rateObj.fees || estimateFees(principal);
```

Add two new columns:
- **Monthly Payment** (e.g. $996)
- **Total Fees** (e.g. $675)

---

### 7.3 Rich Filter Panel

Replace three toggle buttons with a collapsible filter sidebar or top-bar with multi-select options:

- **Sort by:** APR, Monthly Payment, Total Fees, Rating
- **Filter by:**
  - Rate range slider (e.g. 2.5%–3.5%)
  - Term checkboxes (10, 15, 20, 30 yrs)
  - NHG toggle
  - Credit Score dropdown

Example:

```html
<div id="filter-controls" style="display:flex; gap:12px; margin-bottom:12px;">
  <label>Sort by
    <select id="sort-by">
      <option value="apr">APR</option>
      <option value="payment">Monthly Payment</option>
      <option value="fees">Total Fees</option>
    </select>
  </label>
  <label>Rate
    <input id="rate-min" type="number" step="0.01" placeholder="2.5"/>–
    <input id="rate-max" type="number" step="0.01" placeholder="3.5"/>
  </label>
  <!-- …other filters… -->
</div>
```

---

### 7.4 Card-Based Results View

Rather than a dense table, render each lender as a card:

```html
<div class="card">
  <img src="bank-logo.png" alt="Bank A logo" class="bank-logo"/>
  <div class="card-content">
    <h4>Bank A</h4>
    <p><strong>Rate:</strong> 3.15%</p>
    <p><strong>Term:</strong> 10 yrs</p>
    <p><strong>Monthly:</strong> $945</p>
    <p><strong>Fees:</strong> $550</p>
    <button class="btn-select">Choose This</button>
  </div>
</div>
```

- Cards can wrap responsively in a grid.
- Highlight the "best fit" (lowest payment, lowest APR) card with a "Recommended" badge.

---

### 7.5 Visual Feedback & Loading States

- Show a skeleton loader while you compute/filter.
- When no results match, display a friendly "No loans found matching your criteria" card.
- Animate filter panels opening/closing with a slide effect.

---

### 7.6 UI Polish

- Use consistent spacing (8–16 px), a coherent color palette, and a legible font stack.
- Add hover/focus states for buttons & cards.
- Keep the entire widget's width fluid (e.g. `max-width:600px; width:100%`).

---

### 7.7 Data & Payload Updates

To support these enhancements, extend your payload schema:

```json
{
  "rates": [
    {
      "country": "NL",
      "bank": "Bank A",
      "term": 10,
      "type": "Annuity",
      "nhg": true,
      "rate": 3.15,
      "fees": 550,
      "minCreditScore": "good"
    }
    // …
  ]
}
```

- **fees:** number (estimated closing costs)
- **minCreditScore:** string ("excellent", "good", "fair")

---

**Tip:**  
For even more SaaS polish, consider adding:
- Lender ratings/reviews
- "Compare" checkboxes for side-by-side comparison
- Tooltips for terms/fees
- Responsive design for mobile

## 8. Checklist Before Sharing to Others

- Confirm that Voiceflow sends the trace with type: "Custom_RenteVergelijker"
- Ensure the JSON payload shape matches exactly—rates must be an array
- If you want to demonstrate "averageRates," make sure averageRates is an array of objects with {country, rate or range, source}
- Test in Voiceflow's emulator to verify that clicking rows emits the proper event, and that "Capture" stores userChosenRate
- If you need more fields (e.g., currency symbol, fees), simply add them to each object in rates and adjust the table columns accordingly
- Localize any visible text if you need English or another language (e.g., change "Geen rentes" → "No rates available")

## 9. Checklist Before Sharing

- Make sure your Voiceflow trace uses type: "Custom_RenteVergelijker"
- Verify trace.payload is exactly JSON-stringified; i.e., JSON.stringify({ rates: […], averageRates: […] })
- Confirm that every object in rates has at least { country, term, type, nhg, rate }
- If you include bank, it's shown; otherwise it displays "–"
- Demonstrate in Voiceflow's emulator that clicking a row triggers RATE_SELECTED and the "Capture" immediately sees userChosenRate.rate, userChosenRate.term, etc.
- Encourage users to modify column order, add new columns (e.g., fees), or adjust filter logic as needed