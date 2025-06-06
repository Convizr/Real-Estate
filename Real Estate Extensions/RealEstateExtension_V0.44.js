export const RealEstateExtension = {
    name: 'RealEstate',
    type: 'response',
    match: ({ trace }) =>
      trace.type === 'ext_real_estate' ||
      (trace.payload && trace.payload.name === 'ext_real_estate'),
    render: ({ trace, element }) => {
      console.log('Rendering RealEstateExtension');
      console.log('Raw trace.payload:', trace.payload);
  
      // Parse payload
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
      let properties = payloadObj.properties;
      if (typeof properties === 'string') {
        try {
          properties = JSON.parse(properties);
        } catch (e) {
          console.error('Error parsing "properties" field:', e);
          properties = [];
        }
      }
      if (!Array.isArray(properties) || properties.length === 0) {
        element.innerHTML = `<p>No properties available.</p>`;
        return;
      }
  
      // Global variables for flow
      let selectedPropertyName = "";
      let repName = "";
      let repNumber = "";
      let repEmail = "";
      let repImage = "";
      let currentProperty = null; // currently selected property
      let appointmentDate = "";
      let appointmentTime = "";
      let personalName = "";
      let personalEmail = "";
      let personalPhone = "";
      let selectedDateStr = ""; // for appointment view
  
      // Helper: Format date from YYYY-MM-DD to DD-MM-YYYY.
      function formatDate(isoDate) {
        const parts = isoDate.split('-');
        if (parts.length !== 3) return isoDate;
        return [parts[2], parts[1], parts[0]].join('-');
      }
  
      // Helper: Dispatch outgoing payload.
      function sendOutgoingPayload() {
        const formattedDate = formatDate(appointmentDate);
        const outgoingPayload = {
          property: selectedPropertyName,
          appointmentDate: formattedDate,
          appointmentTime: appointmentTime,
          personalName: personalName,
          personalEmail: personalEmail,
          personalPhone: personalPhone,
          repName: repName,
          repNumber: repNumber,
          repEmail: repEmail
        };
        console.log("Outgoing Payload:", outgoingPayload);
        element.dispatchEvent(new CustomEvent('outgoingPayload', { detail: outgoingPayload }));
      }
  
      // Remove parent's background if present.
      let parentMessage = element.closest('.vfrc-message.vfrc-message--extension-RealEstate');
      if (parentMessage) {
        parentMessage.style.background = 'transparent';
        parentMessage.style.boxShadow = 'none';
      }
  
      // --- Wrapper (600px wide, centered) ---
      const wrapper = document.createElement('div');
      wrapper.style.maxWidth = '600px';
      wrapper.style.margin = '20px auto';
      wrapper.style.fontFamily = 'soleto, sans-serif';
  
      // Main container.
      const container = document.createElement('div');
      container.style.width = '600px';
      container.style.boxSizing = 'border-box';
      // (Do not set a background color here so that no extra white block appears.)
      wrapper.appendChild(container);
      element.appendChild(wrapper);
  
      // Utility: simple hover effect (for buttons that change background).
      function addHoverEffect(btn, normalBg, hoverBg) {
        btn.addEventListener('mouseover', () => { btn.style.backgroundColor = hoverBg; });
        btn.addEventListener('mouseout', () => { btn.style.backgroundColor = normalBg; });
      }
  
      // --------------------------
      // GRID VIEW: Properties (3 columns)
      // --------------------------
      function renderGrid() {
        container.innerHTML = '';
        container.style.display = 'grid';
        container.style.gridTemplateColumns = 'repeat(3, 1fr)';
        container.style.gap = '15px';
        container.style.justifyContent = 'center';
        container.style.alignItems = 'center';
  
        properties.forEach((property) => {
          const propertyCard = document.createElement('div');
          propertyCard.style.cursor = 'pointer';
          propertyCard.style.textAlign = 'center';
          propertyCard.style.transition = 'transform 0.3s ease';
          propertyCard.style.margin = '10px';
          propertyCard.addEventListener('mouseover', () => { propertyCard.style.transform = 'scale(1.05)'; });
          propertyCard.addEventListener('mouseout', () => { propertyCard.style.transform = 'scale(1)'; });
  
          const img = document.createElement('img');
          img.src = property.fields?.Image?.[0]?.url || '';
          img.style.width = '100%';
          img.style.borderRadius = '5px';
  
          const title = document.createElement('p');
          title.textContent = property.fields?.['Property Name'] || 'Unknown Property';
          title.style.fontWeight = 'bold';
          title.style.fontSize = '13px'; // smaller font for titles
  
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
      // PROPERTY DETAIL VIEW
      // --------------------------
      function showPropertyDetail(property) {
        container.innerHTML = '';
        container.style.display = 'block';
  
        // --- Image Row ---
        let images = property.fields?.Image || [];
        let currentImageOrder = images.slice();
        const imageRow = document.createElement('div');
        imageRow.style.display = 'flex';
        imageRow.style.gap = '15px';
        imageRow.style.alignItems = 'stretch';
        imageRow.style.marginBottom = '15px';
        imageRow.style.height = '300px';
  
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
  
        // --- Details Section (Two Columns) ---
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
  
        // --- Buttons Section ---
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.display = 'flex';
        buttonsContainer.style.gap = '10px';
    
        const bookViewingLink = document.createElement('a');
        bookViewingLink.href = "javascript:void(0)";
        bookViewingLink.textContent = "Book a Viewing";
        bookViewingLink.style.cssText = `
          display: block;
          width: 150px;
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
        bookViewingLink.addEventListener('click', () => {
          // Reset booking flow globals.
          bookingCurrentStep = 1;
          visitedSteps = [true, false, false, false];
          startAppointmentView();
        });
    
        const contactButton = document.createElement('button');
        contactButton.textContent = "Contact";
        contactButton.style.cssText = `
          width: 100px;
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
    
        const backButton = document.createElement('button');
        backButton.textContent = '← Back to Listings';
        backButton.style.cssText = `
          height: 50px;
          border-radius: 8px;
          background: transparent;
          border: none;
          color: black;
          font-family: soleto, sans-serif;
          font-weight: bold;
          font-size: 16px;
          transition: color 0.3s;
          cursor: pointer;
        `;
        backButton.addEventListener('mouseover', () => { backButton.style.color = '#007BFF'; });
        backButton.addEventListener('mouseout', () => { backButton.style.color = 'black'; });
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
      function startAppointmentView() {
        container.innerHTML = '';
        container.style.display = 'block';
        // No extra white block: use container directly.
        container.innerHTML = `
          <h2 style="margin-bottom: 10px; font-size: 20px; text-align: center;">Appointment Date and Time</h2>
          <div id="dateSelector" style="display: flex; gap: 5px; justify-content: center; margin-bottom: 15px;"></div>
          <div id="timeSlots" style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-bottom: 15px;"></div>
          <div style="display: flex; justify-content: space-between;">
            <button id="backButton" style="height: 50px; border-radius: 8px; background: transparent; border: none; color: black; font-weight: bold; font-size: 16px; cursor: pointer; transition: color 0.3s;">Back</button>
            <button id="nextButton" style="height: 40px; width: 80px; font-size: 14px; border-radius: 8px; background-color: #007BFF; color: white; border: none; cursor: pointer; transition: background 0.2s;">Next</button>
          </div>
        `;
        const dateSelector = container.querySelector('#dateSelector');
        const timeSlotsContainer = container.querySelector('#timeSlots');
        const backButton = container.querySelector('#backButton');
        const nextButton = container.querySelector('#nextButton');
    
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
    
        upcomingDates.forEach(d => {
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
          dayButton.style.margin = "0 5px";
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
    
        function updateTimeSlots(dateStr) {
          timeSlotsContainer.innerHTML = "";
          if (!dateStr) return;
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
            timeButton.addEventListener("mouseover", () => {
              if (timeButton.textContent !== selectedTimeSlot) {
                timeButton.style.backgroundColor = "#f0f0f0";
              }
            });
            timeButton.addEventListener("mouseout", () => {
              if (timeButton.textContent !== selectedTimeSlot) {
                timeButton.style.backgroundColor = "white";
              }
            });
            timeButton.addEventListener("click", () => {
              Array.from(timeSlotsContainer.children).forEach(btn => {
                btn.style.backgroundColor = "white";
                btn.style.color = "black";
              });
              timeButton.style.backgroundColor = "#007BFF";
              timeButton.style.color = "white";
              selectedTimeSlot = timeButton.textContent;
            });
            timeSlotsContainer.appendChild(timeButton);
          });
        }
    
        backButton.addEventListener("click", () => { showPropertyDetail(currentProperty); });
        nextButton.addEventListener("click", () => {
          if (selectedTimeSlot) {
            appointmentDate = selectedDateStr;
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
      // Personal Information View
      // --------------------------
      function renderPersonalInfoStep() {
        container.innerHTML = '';
        container.style.display = 'block';
        container.innerHTML = `
          <div style="text-align: center; max-width: 600px; margin: 20px auto;">
            <h2 style="margin-bottom: 10px; font-size: 20px;">Personal Information</h2>
            <div id="personalInfoFields" style="text-align: center; margin-bottom: 10px;">
              <label style="display: block; margin-bottom: 3px; font-weight:600; font-size: 12px;">Name</label>
              <input id="personalName" type="text" placeholder="Your Name" style="width:60%; padding:8px; margin-bottom:8px; border:1px solid #ccc; border-radius:5px; font-size: 14px;">
              <label style="display: block; margin-bottom: 3px; font-weight:600; font-size: 12px;">Email</label>
              <input id="personalEmail" type="email" placeholder="Your Email" style="width:60%; padding:8px; margin-bottom:8px; border:1px solid #ccc; border-radius:5px; font-size: 14px;">
              <label style="display: block; margin-bottom: 3px; font-weight:600; font-size: 12px;">Phone</label>
              <input id="personalPhone" type="tel" placeholder="Your Phone Number" style="width:60%; padding:8px; margin-bottom:8px; border:1px solid #ccc; border-radius:5px; font-size: 14px;">
            </div>
            <div id="personalError" style="color:red; margin-bottom: 10px; font-size: 12px;"></div>
            <div style="display: flex; justify-content: space-between;">
              <button id="personalBack" style="height: 50px; border-radius: 8px; background: transparent; border: none; color: black; font-weight: bold; font-size: 16px; cursor: pointer; transition: color 0.3s;">Back</button>
              <button id="personalNext" style="height: 40px; width: 80px; border-radius: 8px; background: #007BFF; color: white; padding: 10px; border: none; font-size: 14px; cursor: pointer; transition: background 0.2s;">Next</button>
            </div>
          </div>
        `;
        const personalBack = container.querySelector('#personalBack');
        const personalNext = container.querySelector('#personalNext');
        const personalError = container.querySelector('#personalError');
        personalBack.addEventListener('mouseover', () => { personalBack.style.color = '#007BFF'; });
        personalBack.addEventListener('mouseout', () => { personalBack.style.color = 'black'; });
        addHoverEffect(personalNext, '#007BFF', '#0056b3');
    
        personalBack.addEventListener('click', () => { startAppointmentView(); });
        personalNext.addEventListener('click', () => {
          const name = container.querySelector('#personalName').value.trim();
          const email = container.querySelector('#personalEmail').value.trim();
          const phone = container.querySelector('#personalPhone').value.trim();
          const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
          const phoneValid = /^\+?\d{7,15}$/.test(phone);
          if (!name || !email || !phone) {
            personalError.textContent = "Please fill in all personal information fields.";
            return;
          }
          if (!emailValid) {
            personalError.textContent = "Please enter a valid email address.";
            return;
          }
          if (!phoneValid) {
            personalError.textContent = "Please enter a valid phone number (digits only, at least 7 digits).";
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
          <div style="text-align: center; max-width: 600px; margin: 20px auto; font-size: 14px;">
            <h2 style="margin-bottom: 10px; font-size: 18px;">Confirm Your Viewing</h2>
            <div style="text-align: left; margin-bottom: 20px;">
              <p><strong>Property:</strong> ${selectedPropertyName}</p>
              <p><strong>Appointment Date:</strong> ${formatDate(appointmentDate)}</p>
              <p><strong>Appointment Time:</strong> ${appointmentTime}</p>
              <p><strong>Name:</strong> ${personalName}</p>
              <p><strong>Email:</strong> ${personalEmail}</p>
              <p><strong>Phone:</strong> ${personalPhone}</p>
            </div>
            <div id="confirmError" style="margin-bottom: 10px; text-align: left; color: red; font-size: 12px;"></div>
            <div style="margin-bottom: 20px; text-align: left; font-size: 12px;">
              <input id="agreeCheckbox" type="checkbox" style="margin-right: 8px;">
              <label for="agreeCheckbox" style="font-weight:600;">Hereby I agree to be present at the viewing</label>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <button id="confirmBack" style="height: 50px; border-radius: 8px; background: transparent; border: none; color: black; font-weight: bold; font-size: 16px; cursor: pointer; transition: color 0.3s;">Back</button>
              <button id="confirmBtn" style="height: 40px; width: 100px; border-radius: 8px; background: #007BFF; color: white; padding: 10px; border: none; font-size: 16px; cursor: pointer; transition: background 0.2s;">Confirm</button>
            </div>
          </div>
        `;
        const confirmBack = container.querySelector('#confirmBack');
        const confirmBtn = container.querySelector('#confirmBtn');
        const agreeCheckbox = container.querySelector('#agreeCheckbox');
        const confirmError = container.querySelector('#confirmError');
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
          sendOutgoingPayload();
          container.innerHTML = `
            <div style="text-align: center; max-width: 600px; margin: 20px auto; color: #155724; font-size: 14px;">
              <h2>Viewing Confirmed!</h2>
              <p><strong>Property:</strong> ${selectedPropertyName}</p>
              <p><strong>Date:</strong> ${formatDate(appointmentDate)}</p>
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
          <div style="text-align: center; max-width: 600px; margin: 20px auto; font-size: 14px;">
            <h2 style="margin-bottom: 10px; font-size: 18px;">Contact Sales Rep</h2>
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
              <button id="contactBack" style="height: 50px; border-radius: 8px; background: transparent; border: none; color: black; font-weight: bold; font-size: 16px; cursor: pointer; transition: color 0.3s;">Back</button>
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
    
      // Start with the grid view.
      renderGrid();
    },
  };