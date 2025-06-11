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
    let page          = 'compare'; // 'compare' or 'book'
    let selectedMortgage = null;
    let bookingInfo   = { name: '', address: '', phone: '', date: '', time: '' };
    let availableTimeslots = [];

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
    // Parse available timeslots from payload
    let timeslotsArray = payloadObj.timeslotsApiResponse || [];
    if (typeof timeslotsArray === "string") {
      try { timeslotsArray = JSON.parse(timeslotsArray); } catch { timeslotsArray = []; }
    }
    if (Array.isArray(timeslotsArray)) {
      availableTimeslots = timeslotsArray;
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
      <div style="display:flex;gap:16px;flex-wrap:wrap;position:relative;align-items:flex-start;">
        <div style="flex:1 1 0;min-width:0;">
          <label style="display:flex;align-items:center;font-weight:600;font-size:0.9em;gap:4px;margin-bottom:3px;">
            Purchase Price
            <span style="display:inline-flex;align-items:center;cursor:pointer;" title="The total price you are paying for the property.">
              <svg width="11" height="11" viewBox="0 0 20 20" fill="none" style="display:inline;vertical-align:middle;">
                <circle cx="10" cy="10" r="9" stroke="#2d5fff" stroke-width="2" fill="#eaf0ff"/>
                <text x="10" y="15" text-anchor="middle" font-size="9" fill="#2d5fff" font-family="Arial" font-weight="bold">i</text>
              </svg>
            </span>
          </label>
          <input id="input-price" type="text" placeholder="e.g. 300000">
        </div>
        <div style="flex:1 1 0;min-width:0;">
          <label style="display:flex;align-items:center;font-weight:600;font-size:0.9em;gap:4px;margin-bottom:3px;margin-left:15px;">
            Down Payment
            <span style="display:inline-flex;align-items:center;cursor:pointer;" title="The amount you pay upfront. The rest will be financed by your mortgage.">
              <svg width="11" height="11" viewBox="0 0 20 20" fill="none" style="display:inline;vertical-align:middle;">
                <circle cx="10" cy="10" r="9" stroke="#2d5fff" stroke-width="2" fill="#eaf0ff"/>
                <text x="10" y="15" text-anchor="middle" font-size="9" fill="#2d5fff" font-family="Arial" font-weight="bold">i</text>
              </svg>
            </span>
          </label>
          <input id="input-down" type="text" placeholder="e.g. 60000" style="margin-left:15px;">
          <span id="down-badge" style="margin-left:15px;">0%</span>
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
        width:"100%",minWidth:"120px",boxSizing:"border-box",
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
      marginLeft:"15px",display:"inline-block",
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

    // --- RENDER BOOKING PAGE ---
    function renderBookingPage() {
      widgetContainer.innerHTML = '';
      const form = document.createElement('form');
      form.style.display = 'flex';
      form.style.flexDirection = 'column';
      form.style.gap = '12px';
      form.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;font-weight:700;font-size:1.1em;margin-bottom:4px;">
          <button type="button" id="back-to-compare" style="background:none;border:none;color:#2d5fff;font-size:1.2em;cursor:pointer;padding:0 4px 0 0;">&#8592;</button>
          <span>Book Appointment</span>
        </div>
        <div style="background:#f3f6ff;padding:10px 12px;border-radius:8px;font-size:0.95em;margin-bottom:8px;">
          <div><b>Bank:</b> ${selectedMortgage.bank || '-'} (${selectedMortgage.country || '-'})</div>
          <div><b>Rate:</b> ${selectedMortgage.rate}% for ${selectedMortgage.term} yrs</div>
          <div><b>Type:</b> ${selectedMortgage.type || '-'}</div>
        </div>
        <input type="text" id="book-country" placeholder="Country of Residence" required style="padding:8px;border-radius:6px;border:1px solid #ccc;">
        <input type="text" id="book-name" placeholder="Your Name" required style="padding:8px;border-radius:6px;border:1px solid #ccc;">
        <input type="text" id="book-address" placeholder="Address" required style="padding:8px;border-radius:6px;border:1px solid #ccc;">
        <input type="tel" id="book-phone" placeholder="Phone Number" required style="padding:8px;border-radius:6px;border:1px solid #ccc;">
        <div style="font-weight:600;margin-top:8px;">Select Date</div>
        <div id="custom-calendar"></div>
        <div id="calendar-error" style="color:#d32f2f;font-size:0.85em;display:none;margin-top:2px;"></div>
        <div id="timeslot-section" style="display:none;flex-direction:column;gap:8px;margin-top:8px;">
          <div style="font-weight:600;">Select Time Slot</div>
          <div id="time-slots" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:8px;"></div>
        </div>
        <button type="submit" style="margin-top:8px;padding:10px 0;background:#2d5fff;color:#fff;border:none;border-radius:6px;font-size:1em;font-weight:700;cursor:pointer;">Book Appointment</button>
      `;
      widgetContainer.appendChild(form);

      // --- Modern Calendar ---
      const calendarDiv = form.querySelector('#custom-calendar');
      let today = new Date();
      let selectedDate = null;
      let calendarMonth = today.getMonth();
      let calendarYear = today.getFullYear();
      renderCalendar();

      function renderCalendar() {
        calendarDiv.innerHTML = '';
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.justifyContent = 'space-between';
        header.style.marginBottom = '6px';
        header.innerHTML = `
          <span style="font-weight:600;font-size:1em;">${getMonthName(calendarMonth)} ${calendarYear}</span>
          <div>
            <button type="button" id="cal-prev" style="background:none;border:none;color:#2d5fff;font-size:1.2em;cursor:pointer;margin-right:6px;">&#8592;</button>
            <button type="button" id="cal-next" style="background:none;border:none;color:#2d5fff;font-size:1.2em;cursor:pointer;">&#8594;</button>
          </div>
        `;
        calendarDiv.appendChild(header);
        header.querySelector('#cal-prev').onclick = () => { calendarMonth--; if(calendarMonth<0){calendarMonth=11;calendarYear--;} selectedDate=null; timeslotSection.style.display='none'; renderCalendar(); };
        header.querySelector('#cal-next').onclick = () => { calendarMonth++; if(calendarMonth>11){calendarMonth=0;calendarYear++;} selectedDate=null; timeslotSection.style.display='none'; renderCalendar(); };

        const daysRow = document.createElement('div');
        daysRow.style.display = 'grid';
        daysRow.style.gridTemplateColumns = 'repeat(7,1fr)';
        daysRow.style.fontWeight = '600';
        daysRow.style.fontSize = '0.85em';
        daysRow.style.marginBottom = '2px';
        daysRow.style.color = '#888';
        daysRow.innerHTML = ['Mo','Tu','We','Th','Fr','Sa','Su'].map(d=>`<div style="text-align:center;">${d}</div>`).join('');
        calendarDiv.appendChild(daysRow);

        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(7,1fr)';
        grid.style.gap = '2px';
        grid.style.marginBottom = '4px';
        const firstDay = new Date(calendarYear, calendarMonth, 1);
        let startDay = firstDay.getDay();
        if(startDay===0) startDay=7; // Sunday fix
        let daysInMonth = new Date(calendarYear, calendarMonth+1, 0).getDate();
        for(let i=1;i<startDay;i++) grid.appendChild(document.createElement('div'));
        for(let d=1;d<=daysInMonth;d++) {
          const dateBtn = document.createElement('button');
          dateBtn.type = 'button';
          dateBtn.textContent = d;
          dateBtn.style.cssText = `
            width:32px;height:32px;border-radius:50%;border:none;
            background:${selectedDate && selectedDate.getDate()===d && selectedDate.getMonth()===calendarMonth && selectedDate.getFullYear()===calendarYear ? '#2d5fff' : 'transparent'};
            color:${selectedDate && selectedDate.getDate()===d && selectedDate.getMonth()===calendarMonth && selectedDate.getFullYear()===calendarYear ? '#fff' : '#222'};
            font-weight:600;font-size:1em;cursor:pointer;transition:background 0.2s;
          `;
          dateBtn.onmouseenter = () => { if(!isSelected(d)) dateBtn.style.background='#eaf0ff'; };
          dateBtn.onmouseleave = () => { if(!isSelected(d)) dateBtn.style.background='transparent'; };
          dateBtn.onclick = () => {
            if (selectedDate && selectedDate.getDate()===d && selectedDate.getMonth()===calendarMonth && selectedDate.getFullYear()===calendarYear) {
              selectedDate = null;
              timeslotSection.style.display = 'none';
              renderCalendar();
              return;
            }
            selectedDate = new Date(calendarYear, calendarMonth, d);
            renderCalendar();
            showTimeslots();
          };
          grid.appendChild(dateBtn);
        }
        calendarDiv.appendChild(grid);
      }
      function isSelected(day) {
        return selectedDate && selectedDate.getDate()===day && selectedDate.getMonth()===calendarMonth && selectedDate.getFullYear()===calendarYear;
      }
      function getMonthName(m) {
        return ["January","February","March","April","May","June","July","August","September","October","November","December"][m];
      }

      // --- Timeslots ---
      const timeslotSection = form.querySelector('#timeslot-section');
      const slotsDiv = form.querySelector('#time-slots');
      let selectedTime = '';
      function showTimeslots() {
        timeslotSection.style.display = 'flex';
        slotsDiv.innerHTML = '';
        selectedTime = '';
        // Get weekday name for selectedDate
        const weekday = selectedDate ? ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][selectedDate.getDay()] : null;
        let slots = [];
        if (weekday) {
          const slotObj = availableTimeslots.find(s => s.fields && s.fields.Day === weekday);
          if (slotObj && Array.isArray(slotObj.fields["Time Slots"])) {
            slots = slotObj.fields["Time Slots"];
          }
        }
        if (slots.length === 0) {
          const msg = document.createElement('div');
          msg.textContent = 'No available time slots for this day.';
          msg.style.cssText = 'color:#888;font-size:0.95em;padding:8px 0;';
          slotsDiv.appendChild(msg);
          return;
        }
        slots.forEach(slot => {
          const pill = document.createElement('button');
          pill.type = 'button';
          pill.textContent = slot;
          pill.style.cssText = `
            display:flex;align-items:center;gap:8px;padding:12px 18px;border-radius:24px;
            border:none;background:#f3f6ff;color:#2d5fff;font-weight:600;font-size:1em;cursor:pointer;
            box-shadow:0 1px 4px #0001;margin-bottom:2px;transition:background 0.2s,color 0.2s;
          `;
          pill.onclick = () => {
            selectedTime = slot;
            Array.from(slotsDiv.children).forEach(b=>{
              if(b.tagName==='BUTTON'){b.style.background='#f3f6ff';b.style.color='#2d5fff';}
            });
            pill.style.background = '#2d5fff';
            pill.style.color = '#fff';
          };
          slotsDiv.appendChild(pill);
        });
      }

      form.onsubmit = (e) => {
        e.preventDefault();
        const name = form.querySelector('#book-name').value.trim();
        const address = form.querySelector('#book-address').value.trim();
        const phone = form.querySelector('#book-phone').value.trim();
        const country = form.querySelector('#book-country').value.trim();
        if (!selectedDate) {
          form.querySelector('#calendar-error').textContent = 'Please select a date.';
          form.querySelector('#calendar-error').style.display = 'block';
          return;
        } else {
          form.querySelector('#calendar-error').style.display = 'none';
        }
        if (!selectedTime) {
          alert('Please select a time slot.');
          return;
        }
        const payload = {
          mortgage: selectedMortgage,
          personal: { name, address, phone, country, date: selectedDate.toISOString().slice(0,10), time: selectedTime }
        };
        window.VF?.events?.emit('BOOK_APPOINTMENT', payload);
        widgetContainer.innerHTML = '<div style="text-align:center;padding:32px 0;font-size:1.1em;">Thank you! Your appointment has been booked.</div>';
      };

      // Add back button logic
      form.querySelector('#back-to-compare').onclick = () => {
        page = 'compare';
        render({ trace, element });
      };
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
          selectedMortgage = rateObj;
          page = 'book';
          renderBookingPage();
        };
        grid.appendChild(card);
      });

      resultsArea.appendChild(grid);
      // Re-apply button hover effects after rendering
      addButtonHoverEffects(resultsArea);
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
        addButtonHoverEffects(resultsArea);
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

    // Add hover effects to all buttons except the sort icon
    function addButtonHoverEffects(container) {
      container.querySelectorAll('button').forEach(btn => {
        // Remove hover effect for sort icon
        if (btn.id === 'sort-icon') {
          btn.onmouseenter = null;
          btn.onmouseleave = null;
          btn.style.filter = '';
          btn.style.boxShadow = '';
          return;
        }
        // Choose and Book Appointment buttons: strong blue hover
        if (btn.classList.contains('btn-select') || btn.textContent.trim().toLowerCase().includes('book appointment')) {
          btn.onmouseenter = () => {
            btn.style.background = '#1a2e6c';
            btn.style.color = '#fff';
            btn.style.boxShadow = '0 4px 16px #2d5fff44';
            btn.style.transform = 'scale(1.04)';
          };
          btn.onmouseleave = () => {
            btn.style.background = '#2d5fff';
            btn.style.color = '#fff';
            btn.style.boxShadow = '';
            btn.style.transform = '';
          };
          return;
        }
        // Default hover for other buttons (e.g., time slot, back)
        btn.onmouseenter = () => {
          btn.style.filter = 'brightness(0.92)';
          btn.style.boxShadow = '0 2px 8px #2d5fff22';
        };
        btn.onmouseleave = () => {
          btn.style.filter = '';
          btn.style.boxShadow = '';
        };
      });
    }
    // Call after rendering main widget and booking page
    addButtonHoverEffects(widgetContainer);

    // --- INITIAL RENDER ---
    applyFiltersAndRender();
  }
};
