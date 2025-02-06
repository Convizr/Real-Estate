export const RealEstateExtension = {
    name: 'RealEstate',
    type: 'response',
    match: ({ trace }) =>
      trace.type === 'ext_real_estate' ||
      (trace.payload && trace.payload.name === 'ext_real_estate'),
    render: ({ trace, element }) => {
      console.log('Rendering RealEstateExtension');
      console.log('Raw trace.payload:', trace.payload);
  
      let payloadObj;
      if (typeof trace.payload === 'string') {
        try {
          payloadObj = JSON.parse(trace.payload);
        } catch (e) {
          console.error('Error parsing trace.payload:', e);
          return;
        }
      } else {
        payloadObj = trace.payload || {};
      }
      console.log('Parsed Payload:', payloadObj);
  
      let properties = payloadObj.properties;
      if (typeof properties === 'string') {
        try {
          properties = JSON.parse(properties);
        } catch (e) {
          console.error('Error parsing "properties" field:', e);
          properties = [];
        }
      }
      console.log('Extracted Properties:', properties);
  
      if (!Array.isArray(properties) || properties.length === 0) {
        element.innerHTML = `<p>No properties available.</p>`;
        return;
      }
  
      // Global variables to store data across views.
      let selectedPropertyName = "";
      let repName = "";
      let repNumber = "";
      let repEmail = "";
      let repImage = "";
      let currentProperty = null; // to store the currently selected property object
      let appointmentDate = "";
      let appointmentTime = "";
      let personalName = "";
      let personalEmail = "";
      let personalPhone = "";
      let selectedDateStr = ""; // for appointment view
  
      // Remove parent's background.
      let parentMessage = element.closest('.vfrc-message.vfrc-message--extension-RealEstate');
      if (parentMessage) {
        parentMessage.style.background = 'transparent';
        parentMessage.style.boxShadow = 'none';
      }
  
      // Main container for all views.
      const container = document.createElement('div');
      container.style.display = 'grid';
      container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(250px, 1fr))';
      container.style.gap = '15px';
      container.style.padding = '10px';
      container.style.width = '100%';
      container.style.fontFamily = 'soleto, sans-serif';
  
      // Utility: simple hover effect.
      function addHoverEffect(btn, normalBg, hoverBg) {
        btn.addEventListener('mouseover', () => { btn.style.backgroundColor = hoverBg; });
        btn.addEventListener('mouseout', () => { btn.style.backgroundColor = normalBg; });
      }
  
      // --------------------------
      // Render the Properties Grid
      // --------------------------
      function renderGrid() {
        container.innerHTML = '';
        container.style.display = 'grid';
        container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(250px, 1fr))';
        container.style.justifyContent = 'center';
        container.style.alignItems = 'center';
  
        properties.forEach((property) => {
          const propertyCard = document.createElement('div');
          propertyCard.style.cursor = 'pointer';
          propertyCard.style.textAlign = 'center';
          propertyCard.style.transition = 'transform 0.3s ease';
          propertyCard.addEventListener('mouseover', () => { propertyCard.style.transform = 'scale(1.05)'; });
          propertyCard.addEventListener('mouseout', () => { propertyCard.style.transform = 'scale(1)'; });
  
          const img = document.createElement('img');
          img.src = property.fields?.Image?.[0]?.url || '';
          img.style.width = '100%';
          img.style.borderRadius = '5px';
  
          const title = document.createElement('p');
          title.textContent = property.fields?.['Property Name'] || 'Unknown Property';
          title.style.fontWeight = 'bold';
  
          propertyCard.appendChild(img);
          propertyCard.appendChild(title);
          propertyCard.addEventListener('click', () => {
            selectedPropertyName = property.fields?.['Property Name'] || 'Unknown Property';
            repName = property.fields?.['Sales Rep'] || "";
            repNumber = property.fields?.['Reps Number'] || "";
            repEmail = property.fields?.['Reps Email'] || "";
            repImage = (property.fields?.['Reps Image'] && property.fields?.['Reps Image'][0]?.url) || "";
            currentProperty = property;
            showPropertyDetail(property);
          });
          container.appendChild(propertyCard);
        });
      }
  
      // --------------------------
      // Show Property Detail View
      // --------------------------
      function showPropertyDetail(property) {
        container.innerHTML = '';
        container.style.display = 'block';
  
        // Copy images for rotation.
        let images = property.fields?.Image || [];
        let currentImageOrder = images.slice();
  
        // --- Image Row: height set to 300px (same as main image container) ---
        const imageRow = document.createElement('div');
        imageRow.style.display = 'flex';
        imageRow.style.gap = '15px';
        imageRow.style.alignItems = 'stretch';
        imageRow.style.marginBottom = '15px';
        imageRow.style.height = '300px';
  
        // Left: Main image (smaller)
        const mainImageContainer = document.createElement('div');
        mainImageContainer.style.flex = '2';
        mainImageContainer.style.maxWidth = '60%';
        mainImageContainer.style.height = '100%';
        const mainImage = document.createElement('img');
        mainImage.src = currentImageOrder[0].url;
        mainImage.style.width = '100%';
        mainImage.style.height = '100%';
        mainImage.style.borderRadius = '8px';
        mainImage.style.objectFit = 'cover';
        mainImageContainer.appendChild(mainImage);
  
        // Right: Thumbnails – top and bottom aligned.
        const thumbContainer = document.createElement('div');
        thumbContainer.style.flex = '1';
        thumbContainer.style.display = 'flex';
        thumbContainer.style.flexDirection = 'column';
        thumbContainer.style.gap = '10px';
        thumbContainer.style.height = '100%';
        thumbContainer.style.overflowY = 'auto';
        thumbContainer.style.justifyContent = 'space-between';
  
        function renderImageRow() {
          mainImage.src = currentImageOrder[0].url;
          thumbContainer.innerHTML = '';
          currentImageOrder.slice(1).forEach((imgData, index) => {
            const thumb = document.createElement('img');
            thumb.src = imgData.url;
            thumb.style.width = '100%';
            thumb.style.height = '80px';
            thumb.style.cursor = 'pointer';
            thumb.style.borderRadius = '8px';
            thumb.style.objectFit = 'cover';
            thumb.addEventListener('click', () => {
              const clickedIndex = index + 1;
              currentImageOrder = [
                ...currentImageOrder.slice(clickedIndex),
                ...currentImageOrder.slice(0, clickedIndex)
              ];
              renderImageRow();
            });
            thumbContainer.appendChild(thumb);
          });
        }
        renderImageRow();
  
        imageRow.appendChild(mainImageContainer);
        imageRow.appendChild(thumbContainer);
  
        // Details: all property info in two columns.
        const details = document.createElement('div');
        details.style.display = 'grid';
        details.style.gridTemplateColumns = '1fr 1fr';
        details.style.gap = '10px';
        details.style.fontSize = '14px';
        details.style.marginBottom = '15px';
        details.innerHTML = `
          <p><strong>Property:</strong> ${selectedPropertyName}</p>
          <p><strong>City:</strong> ${property.fields?.City || 'N/A'}</p>
          <p><strong>Type:</strong> ${property.fields?.['Property Type'] || 'N/A'}</p>
          <p><strong>Bedrooms:</strong> ${property.fields?.Bedrooms || 'N/A'}</p>
          <p><strong>Year:</strong> ${property.fields?.Year || 'N/A'}</p>
          <p><strong>Price:</strong> $${property.fields?.Price?.toLocaleString() || 'N/A'}</p>
          <p><strong>Plot:</strong> ${property.fields?.Plot || 'N/A'}</p>
          <p><strong>Status:</strong> ${property.fields?.Status || 'N/A'}</p>
        `;
  
        // Buttons container.
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.display = 'flex';
        buttonsContainer.style.flexDirection = 'row';
        buttonsContainer.style.gap = '10px';
  
        // --- "Book a Viewing" Button (Solid → outline on hover) ---
        const bookViewingLink = document.createElement('a');
        bookViewingLink.href = "javascript:void(0)";
        bookViewingLink.textContent = "Book a Viewing";
        bookViewingLink.style.cssText = `
          display: block;
          width: 200px;
          height: 50px;
          line-height: 50px;
          text-align: center;
          border-radius: 8px;
          background-color: #007BFF;
          color: white;
          border: 2px solid transparent;
          text-decoration: none;
          font-family: soleto, sans-serif;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s ease;
        `;
        bookViewingLink.addEventListener('mouseover', () => {
          bookViewingLink.style.backgroundColor = 'transparent';
          bookViewingLink.style.border = '2px solid #007BFF';
          bookViewingLink.style.color = '#007BFF';
        });
        bookViewingLink.addEventListener('mouseout', () => {
          bookViewingLink.style.backgroundColor = '#007BFF';
          bookViewingLink.style.border = '2px solid transparent';
          bookViewingLink.style.color = 'white';
        });
        bookViewingLink.addEventListener('click', startBookingProcess);
  
        // --- "Contact" Button (Outline → solid on hover, no icon) ---
        const contactButton = document.createElement('button');
        contactButton.textContent = "Contact";
        contactButton.style.cssText = `
          height: 50px;
          border-radius: 8px;
          background-color: transparent;
          border: 2px solid #007BFF;
          color: #007BFF;
          font-family: soleto, sans-serif;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s ease;
          cursor: pointer;
        `;
        contactButton.addEventListener('mouseover', () => {
          contactButton.style.backgroundColor = '#007BFF';
          contactButton.style.color = 'white';
        });
        contactButton.addEventListener('mouseout', () => {
          contactButton.style.backgroundColor = 'transparent';
          contactButton.style.color = '#007BFF';
        });
        contactButton.addEventListener('click', renderContactView);
  
        // --- "Back to Listings" Button (Bold label) ---
        const backButton = document.createElement('button');
        backButton.textContent = '← Back to Listings';
        backButton.style.cssText = `
          height: 50px;
          border-radius: 8px;
          background-color: transparent;
          border: none;
          color: black;
          font-family: soleto, sans-serif;
          font-weight: bold;
          font-size: 16px;
          transition: all 0.3s ease;
          cursor: pointer;
        `;
        backButton.addEventListener('mouseover', () => { backButton.style.color = '#007BFF'; });
        backButton.addEventListener('mouseout', () => { backButton.style.color = 'black'; });
        // In property view, back goes to the grid.
        backButton.addEventListener('click', renderGrid);
  
        buttonsContainer.appendChild(bookViewingLink);
        buttonsContainer.appendChild(contactButton);
        buttonsContainer.appendChild(backButton);
  
        container.appendChild(imageRow);
        container.appendChild(details);
        container.appendChild(buttonsContainer);
      }
  
      // --------------------------
      // Appointment Scheduler View
      // --------------------------
      function startBookingProcess() {
        container.innerHTML = '';
        container.style.display = 'block';
        // Appointment view integrated style.
        container.innerHTML = `
          <div style="background: white; padding: 20px; text-align: center; max-width: 450px; margin: 20px auto;">
            <h2 style="margin-bottom: 10px; font-size: 20px;">Appointment Date and Time</h2>
            <!-- Month navigation header -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <button id="prevWeek" style="border: none; background: transparent; font-size: 18px; cursor: pointer;">&#9664;</button>
              <span id="monthLabel" style="font-weight: bold; font-size: 16px;">Month</span>
              <button id="nextWeek" style="border: none; background: transparent; font-size: 18px; cursor: pointer;">&#9654;</button>
            </div>
            <div id="dateSelector" style="display: flex; justify-content: space-around; margin-bottom: 15px;"></div>
            <div id="timeSlots" style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-bottom: 15px;"></div>
            <div style="display: flex; justify-content: space-between;">
              <button id="backButton" style="height: 50px; border-radius: 8px; background-color: transparent; border: none; color: black; font-weight: bold; font-size: 16px; cursor: pointer; transition: color 0.3s;">Back</button>
              <button id="nextButton" style="height: 50px; width: 250px; font-size: 14px; border-radius: 8px; background-color: #007BFF; color: white; padding: 10px; border: none; cursor: pointer; transition: background 0.2s;">Next</button>
            </div>
          </div>
        `;
        // Month and week navigation.
        const monthLabel = container.querySelector('#monthLabel');
        const prevWeek = container.querySelector('#prevWeek');
        const nextWeek = container.querySelector('#nextWeek');
        const dateSelector = container.querySelector('#dateSelector');
        const timeSlotsContainer = container.querySelector('#timeSlots');
        const backButton = container.querySelector('#backButton');
        const nextButton = container.querySelector('#nextButton');
        // Back button hover: change text color to blue.
        backButton.addEventListener('mouseover', () => { backButton.style.color = '#007BFF'; });
        backButton.addEventListener('mouseout', () => { backButton.style.color = 'black'; });
        addHoverEffect(nextButton, '#007BFF', '#0056b3');
  
        // Generate upcoming 10 days.
        const upcomingDates = [];
        const today = new Date();
        for (let i = 0; i < 10; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          upcomingDates.push(d);
        }
        const defaultTimeSlots = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];
  
        // For week navigation, use currentWeekStart based on the first upcoming date.
        let currentWeekStart = new Date(upcomingDates[0]);
        function updateMonthLabel() {
          const options = { month: 'long', year: 'numeric' };
          monthLabel.textContent = currentWeekStart.toLocaleDateString('en-US', options);
        }
        updateMonthLabel();
  
        function renderDateButtons() {
          dateSelector.innerHTML = "";
          // Show dates for the current week (7 days) from currentWeekStart.
          const weekDates = upcomingDates.filter(d => d >= currentWeekStart && d < new Date(currentWeekStart.getTime() + 7 * 86400000));
          weekDates.forEach(d => {
            const dayButton = document.createElement('button');
            dayButton.textContent = `${d.toLocaleDateString('en-US', { weekday: 'short' })}\n${d.getDate()}`;
            dayButton.style.padding = "10px";
            dayButton.style.backgroundColor = "white";
            dayButton.style.color = "black";
            dayButton.style.border = "1px solid #ddd";
            dayButton.style.borderRadius = "8px";
            dayButton.style.cursor = "pointer";
            dayButton.style.fontSize = "14px";
            dayButton.style.textAlign = "center";
            dayButton.style.transition = "background 0.2s";
            dayButton.style.whiteSpace = "pre-line";
            dayButton.style.fontWeight = "bold";
            dayButton.addEventListener('click', () => {
              Array.from(dateSelector.children).forEach(btn => {
                btn.style.backgroundColor = "white";
                btn.style.color = "black";
              });
              dayButton.style.backgroundColor = "#007BFF";
              dayButton.style.color = "white";
              selectedDateStr = d.toISOString().slice(0, 10);
              updateTimeSlots(selectedDateStr);
            });
            dateSelector.appendChild(dayButton);
          });
        }
        renderDateButtons();
  
        // Week navigation buttons.
        prevWeek.addEventListener('click', () => {
          const newWeekStart = new Date(currentWeekStart);
          newWeekStart.setDate(newWeekStart.getDate() - 7);
          if (newWeekStart < today) return;
          currentWeekStart = newWeekStart;
          updateMonthLabel();
          renderDateButtons();
        });
        nextWeek.addEventListener('click', () => {
          currentWeekStart.setDate(currentWeekStart.getDate() + 7);
          updateMonthLabel();
          renderDateButtons();
        });
  
        // Generate time slots.
        let selectedTimeSlot = "";
        function updateTimeSlots(dateStr) {
          timeSlotsContainer.innerHTML = "";
          defaultTimeSlots.forEach(time => {
            const timeButton = document.createElement("button");
            timeButton.textContent = time;
            timeButton.style.padding = "12px";
            timeButton.style.backgroundColor = "white";
            timeButton.style.color = "black";
            timeButton.style.border = "1px solid #ddd";
            timeButton.style.borderRadius = "8px";
            timeButton.style.cursor = "pointer";
            timeButton.style.fontSize = "14px";
            timeButton.style.transition = "background 0.2s";
            timeButton.addEventListener("mouseover", () => { timeButton.style.backgroundColor = "#f0f0f0"; });
            timeButton.addEventListener("mouseout", () => { timeButton.style.backgroundColor = "white"; });
            timeButton.addEventListener("click", () => {
              Array.from(timeSlotsContainer.children).forEach(btn => {
                btn.style.backgroundColor = "white";
                btn.style.color = "black";
              });
              timeButton.style.backgroundColor = "#007BFF";
              timeButton.style.color = "white";
              selectedTimeSlot = time;
            });
            timeSlotsContainer.appendChild(timeButton);
          });
        }
  
        backButton.addEventListener("click", () => {
          // In appointment view, back goes to the property view.
          showPropertyDetail(currentProperty);
        });
  
        nextButton.addEventListener("click", () => {
          if (selectedTimeSlot) {
            appointmentDate = selectedDateStr; // Use the selected date string.
            appointmentTime = selectedTimeSlot;
            renderPersonalInfoStep();
          } else {
            const errMsg = document.createElement('p');
            errMsg.textContent = "Please select a time slot before proceeding.";
            errMsg.style.color = "red";
            errMsg.style.fontSize = "12px";
            if (!timeSlotsContainer.querySelector('p.error')) {
              errMsg.className = "error";
              timeSlotsContainer.appendChild(errMsg);
            }
          }
        });
      }
  
      // --------------------------
      // Personal Information Step
      // --------------------------
      function renderPersonalInfoStep() {
        container.innerHTML = '';
        container.style.display = 'block';
        container.innerHTML = `
          <div style="background: white; padding: 20px; text-align: center; max-width: 450px; margin: 20px auto;">
            <h2 style="margin-bottom: 10px; font-size: 20px;">Personal Information</h2>
            <div id="personalInfoFields" style="text-align: left; margin-bottom: 10px;">
              <label style="display: block; margin-bottom: 5px; font-weight:600;">Name</label>
              <input id="personalName" type="text" placeholder="Your Name" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ccc; border-radius:5px;">
              <label style="display: block; margin-bottom: 5px; font-weight:600;">Email</label>
              <input id="personalEmail" type="email" placeholder="Your Email" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ccc; border-radius:5px;">
              <label style="display: block; margin-bottom: 5px; font-weight:600;">Phone</label>
              <input id="personalPhone" type="tel" placeholder="Your Phone Number" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ccc; border-radius:5px;">
            </div>
            <div id="personalError" style="color:red; margin-bottom: 10px; font-size: 12px;"></div>
            <div style="display: flex; justify-content: space-between;">
              <button id="personalBack" style="height: 50px; border-radius: 8px; background-color: transparent; border: none; color: black; font-weight: bold; font-size: 16px; cursor: pointer; transition: color 0.3s;">Back</button>
              <button id="personalNext" style="height: 50px; border-radius: 8px; background-color: #007BFF; color: white; padding: 10px; border: none; font-size: 16px; cursor: pointer; transition: background 0.2s;">Next</button>
            </div>
          </div>
        `;
        const personalBack = container.querySelector('#personalBack');
        const personalNext = container.querySelector('#personalNext');
        const personalError = container.querySelector('#personalError');
        addHoverEffect(personalBack, 'transparent', '#007BFF');
        addHoverEffect(personalNext, '#007BFF', '#0056b3');
  
        personalBack.addEventListener('click', () => { startBookingProcess(); });
  
        personalNext.addEventListener('click', () => {
          const name = container.querySelector('#personalName').value.trim();
          const email = container.querySelector('#personalEmail').value.trim();
          const phone = container.querySelector('#personalPhone').value.trim();
          if (!name || !email || !phone) {
            personalError.textContent = "Please fill in all personal information fields.";
            return;
          }
          personalError.textContent = "";
          personalName = name;
          personalEmail = email;
          personalPhone = phone;
          renderConfirmationView();
        });
      }
  
      // --------------------------
      // Confirmation View
      // --------------------------
      function renderConfirmationView() {
        container.innerHTML = '';
        container.style.display = 'block';
        container.innerHTML = `
          <div style="background: white; padding: 20px; text-align: center; max-width: 450px; margin: 20px auto;">
            <h2 style="margin-bottom: 10px; font-size: 20px;">Confirm Your Viewing</h2>
            <div style="text-align: left; margin-bottom: 20px;">
              <p><strong>Property:</strong> ${selectedPropertyName}</p>
              <p><strong>Appointment Date:</strong> ${appointmentDate}</p>
              <p><strong>Appointment Time:</strong> ${appointmentTime}</p>
              <p><strong>Name:</strong> ${personalName}</p>
              <p><strong>Email:</strong> ${personalEmail}</p>
              <p><strong>Phone:</strong> ${personalPhone}</p>
            </div>
            <div id="confirmError" style="margin-bottom: 10px; text-align: left; color: red; font-size: 12px;"></div>
            <div style="margin-bottom: 20px; text-align: left;">
              <input id="agreeCheckbox" type="checkbox" style="margin-right: 8px;">
              <label for="agreeCheckbox" style="font-weight:600;">Hereby I agree to be present at the viewing</label>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <button id="confirmBack" style="height: 50px; border-radius: 8px; background-color: transparent; border: none; color: black; font-weight: bold; font-size: 16px; cursor: pointer; transition: color 0.3s;">Back</button>
              <button id="confirmBtn" style="height: 50px; border-radius: 8px; background-color: #007BFF; color: white; padding: 10px; border: none; font-size: 16px; cursor: pointer; transition: background 0.2s;">Confirm Viewing</button>
            </div>
          </div>
        `;
        const confirmBack = container.querySelector('#confirmBack');
        const confirmBtn = container.querySelector('#confirmBtn');
        const agreeCheckbox = container.querySelector('#agreeCheckbox');
        const confirmError = container.querySelector('#confirmError');
        addHoverEffect(confirmBack, 'transparent', '#007BFF');
        addHoverEffect(confirmBtn, '#007BFF', '#0056b3');
  
        confirmBack.addEventListener('mouseover', () => { confirmBack.style.color = '#007BFF'; });
        confirmBack.addEventListener('mouseout', () => { confirmBack.style.color = 'black'; });
        confirmBack.addEventListener('click', () => { renderPersonalInfoStep(); });
  
        confirmBtn.addEventListener('click', () => {
          if (!agreeCheckbox.checked) {
            confirmError.textContent = "Please agree to be present at the viewing before confirming.";
            return;
          }
          confirmError.textContent = "";
          container.innerHTML = `
            <div style="background: #d4edda; padding: 20px; text-align: center; max-width: 450px; margin: 20px auto; color: #155724;">
              <h2>Viewing Confirmed!</h2>
              <p><strong>Property:</strong> ${selectedPropertyName}</p>
              <p><strong>Date:</strong> ${appointmentDate}</p>
              <p><strong>Time:</strong> ${appointmentTime}</p>
              <p><strong>Name:</strong> ${personalName}</p>
              <p><strong>Email:</strong> ${personalEmail}</p>
              <p><strong>Phone:</strong> ${personalPhone}</p>
            </div>
          `;
        });
      }
  
      // --------------------------
      // Contact View
      // --------------------------
      function renderContactView() {
        container.innerHTML = '';
        container.style.display = 'block';
        container.innerHTML = `
          <div style="background: white; padding: 20px; text-align: center; max-width: 450px; margin: 20px auto;">
            <h2 style="margin-bottom: 10px; font-size: 20px;">Contact Sales Rep</h2>
            <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 20px;">
              <img src="${repImage}" alt="Sales Rep Profile" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; margin-bottom: 10px;">
              <p style="font-weight: bold; margin: 5px 0;">${repName}</p>
              <p style="margin: 5px 0;">Email: ${repEmail}</p>
              <p style="margin: 5px 0;">Phone: ${repNumber}</p>
            </div>
            <a id="whatsappLink" href="" target="_blank" style="text-decoration: none;">
              <div style="display: inline-flex; align-items: center; justify-content: space-between; background-color: #51bce6; color: white; padding: 10px 20px; border-radius: 5px; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold;">
                <span>WhatsApp</span>
                <span style="font-size: 18px; font-weight: bold;">&#8594;</span>
              </div>
            </a>
            <div style="margin-top: 20px;">
              <button id="contactBack" style="height: 50px; border-radius: 8px; background-color: transparent; border: none; color: black; font-weight: bold; font-size: 16px; cursor: pointer; transition: color 0.3s;">Back</button>
            </div>
          </div>
        `;
        const sanitizedNumber = repNumber.replace(/\D/g, '');
        const whatsappLink = container.querySelector('#whatsappLink');
        whatsappLink.href = `https://api.whatsapp.com/send?phone=${sanitizedNumber}`;
        const contactBack = container.querySelector('#contactBack');
        contactBack.addEventListener('mouseover', () => { contactBack.style.color = '#007BFF'; });
        contactBack.addEventListener('mouseout', () => { contactBack.style.color = 'black'; });
        contactBack.addEventListener('click', () => { showPropertyDetail(currentProperty); });
      }
  
      // Start by rendering the grid view.
      renderGrid();
      element.appendChild(container);
    },
  };  