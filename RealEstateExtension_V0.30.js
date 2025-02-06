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
      let appointmentDate = "";
      let appointmentTime = "";
      let personalName = "";
      let personalEmail = "";
      let personalPhone = "";
  
      // Remove message box background if present.
      let parentMessage = element.closest('.vfrc-message.vfrc-message--extension-RealEstate');
      if (parentMessage) {
        parentMessage.style.background = 'transparent';
        parentMessage.style.boxShadow = 'none';
      }
  
      // Main container reused for all views.
      const container = document.createElement('div');
      container.style.display = 'grid';
      container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(250px, 1fr))';
      container.style.gap = '15px';
      container.style.padding = '10px';
      container.style.width = '100%';
      container.style.fontFamily = 'soleto, sans-serif';
  
      // Utility function to add hover effects.
      function addHoverEffect(btn, normalBg, hoverBg) {
        btn.addEventListener('mouseover', () => {
          btn.style.backgroundColor = hoverBg;
        });
        btn.addEventListener('mouseout', () => {
          btn.style.backgroundColor = normalBg;
        });
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
          propertyCard.addEventListener('mouseover', () => {
            propertyCard.style.transform = 'scale(1.05)';
          });
          propertyCard.addEventListener('mouseout', () => {
            propertyCard.style.transform = 'scale(1)';
          });
  
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
  
        // Create a copy of images for rotation.
        let images = property.fields?.Image || [];
        let currentImageOrder = images.slice();
  
        // --- Updated Image Row Styling ---
        // The overall image row now is the same height as the main image.
        const imageRow = document.createElement('div');
        imageRow.style.display = 'flex';
        imageRow.style.gap = '15px';
        imageRow.style.alignItems = 'stretch';
        imageRow.style.marginBottom = '15px';
        // Set the row height to match the main image container (300px)
        imageRow.style.height = '300px';
  
        // Left column: Main image (smaller)
        const mainImageContainer = document.createElement('div');
        mainImageContainer.style.flex = '2';
        mainImageContainer.style.maxWidth = '60%';
        mainImageContainer.style.height = '100%';
        const mainImage = document.createElement('img');
        mainImage.src = currentImageOrder[0].url;
        mainImage.style.width = '100%';
        mainImage.style.height = '100%';
        mainImage.style.borderRadius = '10px';
        mainImage.style.objectFit = 'cover';
        mainImageContainer.appendChild(mainImage);
  
        // Right column: Thumbnails
        const thumbContainer = document.createElement('div');
        thumbContainer.style.flex = '1';
        thumbContainer.style.display = 'flex';
        thumbContainer.style.flexDirection = 'column';
        thumbContainer.style.gap = '10px';
        thumbContainer.style.height = '100%';
        thumbContainer.style.overflowY = 'auto';
        // Align thumbnails so that the first and last align with the top and bottom.
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
            thumb.style.borderRadius = '5px';
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
  
        // Details section
        const details = document.createElement('div');
        details.style.textAlign = 'left';
        details.style.fontSize = '14px';
        details.style.marginBottom = '15px';
        details.innerHTML = `
          <p><strong>City:</strong> ${property.fields?.City || 'N/A'}</p>
          <p><strong>Type:</strong> ${property.fields?.['Property Type'] || 'N/A'}</p>
          <p><strong>Bedrooms:</strong> ${property.fields?.Bedrooms || 'N/A'}</p>
          <p><strong>Year:</strong> ${property.fields?.Year || 'N/A'}</p>
          <p><strong>Price:</strong> $${property.fields?.Price?.toLocaleString() || 'N/A'}</p>
        `;
  
        // Buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.display = 'flex';
        buttonsContainer.style.flexDirection = 'row';
        buttonsContainer.style.gap = '10px';
  
        // --- "Book a Viewing" Button as an Anchor ---
        const bookViewingLink = document.createElement('a');
        bookViewingLink.href = "javascript:void(0)";
        bookViewingLink.textContent = "Book a Viewing";
        // Set the button style based on your snippet but using blue colors.
        bookViewingLink.style.cssText = `
          display: block;
          width: 200px;
          height: 50px;
          line-height: 50px;
          font-family: soleto, sans-serif;
          font-weight: 600;
          font-size: 16px;
          text-decoration: none;
          background: #007BFF;
          text-align: center;
          color: #fff;
          border: 3px solid #007BFF;
          transition: all 0.35s;
          position: relative;
        `;
        // Create an icon span that simulates the ::before pseudo-element.
        const iconSpan = document.createElement('span');
        iconSpan.className = 'icon';
        iconSpan.style.cssText = `
          width: 50px;
          height: 50px;
          border: 3px solid transparent;
          position: absolute;
          transform: rotate(45deg);
          right: 0;
          top: 0;
          z-index: -1;
          transition: all 0.35s;
        `;
        // Create an inline SVG inside the icon span.
        const svgNS = "http://www.w3.org/2000/svg";
        const svgElem = document.createElementNS(svgNS, 'svg');
        svgElem.setAttribute('width', '30');
        svgElem.setAttribute('height', '30');
        svgElem.style.cssText = `
          position: absolute;
          top: calc(50% - 15px);
          left: calc(50% - 15px);
          transform: rotate(-45deg);
          fill: #fff;
          transition: all 0.35s;
        `;
        const svgPath = document.createElementNS(svgNS, 'path');
        svgPath.setAttribute('d', 'M5 12h14M13 5l7 7-7 7');
        svgElem.appendChild(svgPath);
        iconSpan.appendChild(svgElem);
        bookViewingLink.appendChild(iconSpan);
        // Hover effects for the Book a Viewing button.
        bookViewingLink.addEventListener('mouseover', () => {
          bookViewingLink.style.width = '180px';
          bookViewingLink.style.border = '3px solid #0056b3';
          bookViewingLink.style.background = 'transparent';
          bookViewingLink.style.color = '#0056b3';
          iconSpan.style.border = '3px solid #0056b3';
          iconSpan.style.right = '-20%';
        });
        bookViewingLink.addEventListener('mouseout', () => {
          bookViewingLink.style.width = '200px';
          bookViewingLink.style.border = '3px solid #007BFF';
          bookViewingLink.style.background = '#007BFF';
          bookViewingLink.style.color = '#fff';
          iconSpan.style.border = '3px solid transparent';
          iconSpan.style.right = '0';
        });
        bookViewingLink.addEventListener('click', startBookingProcess);
  
        // --- Contact Button with Blue Outline ---
        const contactButton = document.createElement('button');
        contactButton.textContent = '📞 Contact';
        contactButton.style.cssText = `
          align-items: center;
          background-color: #FFFFFF;
          border: 1px solid #007bff;
          border-radius: .25rem;
          box-shadow: rgba(0, 0, 0, 0.02) 0 1px 3px 0;
          color: rgba(0, 0, 0, 0.85);
          cursor: pointer;
          display: inline-flex;
          font-family: system-ui, -apple-system, system-ui, "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-size: 16px;
          font-weight: 600;
          justify-content: center;
          line-height: 1.25;
          margin: 0;
          min-height: 50px;
          padding: calc(.875rem - 1px) calc(1.5rem - 1px);
          position: relative;
          text-decoration: none;
          transition: all 250ms;
          width: auto;
        `;
        contactButton.addEventListener('mouseover', () => {
          contactButton.style.borderColor = 'rgba(0, 0, 0, 0.15)';
          contactButton.style.boxShadow = 'rgba(0, 0, 0, 0.1) 0 4px 12px';
          contactButton.style.transform = 'translateY(-1px)';
        });
        contactButton.addEventListener('mouseout', () => {
          contactButton.style.borderColor = '#007bff';
          contactButton.style.boxShadow = 'rgba(0, 0, 0, 0.02) 0 1px 3px 0';
          contactButton.style.transform = 'translateY(0)';
        });
        contactButton.addEventListener('click', renderContactView);
  
        // --- Back to Listings Button (Fixed Height) ---
        const backButton = document.createElement('button');
        backButton.textContent = '← Back to Listings';
        backButton.style.cssText = `
          font-family: soleto, sans-serif;
          background-color: #007bff;
          color: white;
          padding: 8px 16px;
          height: 50px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 14px;
        `;
        addHoverEffect(backButton, '#007bff', '#0056b3');
        backButton.addEventListener('click', renderGrid);
  
        buttonsContainer.appendChild(bookViewingLink);
        buttonsContainer.appendChild(contactButton);
        buttonsContainer.appendChild(backButton);
  
        container.appendChild(imageRow);
        container.appendChild(details);
        container.appendChild(buttonsContainer);
      }
  
      // -----------------------------------------------
      // Appointment Scheduler with Personal Info and Confirmation
      // -----------------------------------------------
      function startBookingProcess() {
        container.innerHTML = '';
        container.style.display = 'block';
        container.innerHTML = `
          <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.15); text-align: center; max-width: 450px; margin: 20px auto;">
            <h2 style="margin-bottom: 10px;">Appointment Date and Time</h2>
            <p style="margin-bottom: 15px; font-size: 14px; color: #555;">First available: Thursday, January 23rd 2025 9:30</p>
            <div id="dateSelector" style="display: flex; justify-content: space-around; margin-bottom: 15px;"></div>
            <div id="timeSlots" style="min-height: 40px; margin-bottom: 15px;"></div>
            <div style="display: flex; justify-content: space-between;">
              <button id="backButton" style="padding: 10px; border: none; border-radius: 8px; background-color: #007BFF; color: white; font-size: 16px; cursor: pointer; transition: background 0.2s; height: 50px;">Back</button>
              <button id="nextButton" style="padding: 10px; border: none; border-radius: 8px; background-color: #007BFF; color: white; font-size: 16px; cursor: pointer; transition: background 0.2s; height: 50px;">Next</button>
            </div>
          </div>
        `;
        const dateSelector = container.querySelector('#dateSelector');
        const timeSlotsContainer = container.querySelector('#timeSlots');
        const backButton = container.querySelector('#backButton');
        const nextButton = container.querySelector('#nextButton');
        addHoverEffect(backButton, '#007BFF', '#0056b3');
        addHoverEffect(nextButton, '#007BFF', '#0056b3');
  
        const availableDates = [
          "2025-01-30",
          "2025-01-31",
          "2025-02-01",
          "2025-02-02",
          "2025-02-03",
          "2025-02-04",
          "2025-02-05"
        ];
        const availableTimeSlots = {
          "2025-01-30": ["09:30", "10:00", "11:00", "13:00", "14:00", "15:30"],
          "2025-01-31": ["10:00", "14:00", "16:00"],
          "2025-02-01": ["11:00", "14:30", "15:00"]
        };
  
        let selDate = "";
        let selTime = "";
        availableDates.forEach(date => {
          const day = new Date(date);
          const button = document.createElement("button");
          button.textContent = `${day.toLocaleDateString('en-US', { weekday: 'short' })}\n${day.getDate()}`;
          button.style.padding = "10px";
          button.style.backgroundColor = "white";
          button.style.color = "black";
          button.style.border = "1px solid #ddd";
          button.style.borderRadius = "8px";
          button.style.cursor = "pointer";
          button.style.fontSize = "14px";
          button.style.textAlign = "center";
          button.style.transition = "background 0.2s";
          button.style.whiteSpace = "pre-line";
          button.addEventListener("click", function () {
            Array.from(dateSelector.children).forEach(btn => {
              btn.style.backgroundColor = "white";
              btn.style.color = "black";
            });
            button.style.backgroundColor = "#007BFF";
            button.style.color = "white";
            selDate = date;
            updateTimeSlots(date);
          });
          dateSelector.appendChild(button);
        });
  
        function updateTimeSlots(selectedDate) {
          timeSlotsContainer.innerHTML = "";
          if (availableTimeSlots[selectedDate]) {
            availableTimeSlots[selectedDate].forEach(time => {
              const timeButton = document.createElement("button");
              timeButton.textContent = time;
              timeButton.style.padding = "10px";
              timeButton.style.backgroundColor = "white";
              timeButton.style.color = "black";
              timeButton.style.border = "1px solid #ddd";
              timeButton.style.borderRadius = "8px";
              timeButton.style.cursor = "pointer";
              timeButton.style.fontSize = "14px";
              timeButton.style.transition = "background 0.2s";
              timeButton.addEventListener("click", () => {
                Array.from(timeSlotsContainer.children).forEach(btn => {
                  btn.style.backgroundColor = "white";
                  btn.style.color = "black";
                });
                timeButton.style.backgroundColor = "#007BFF";
                timeButton.style.color = "white";
                selTime = time;
              });
              timeSlotsContainer.appendChild(timeButton);
            });
          } else {
            timeSlotsContainer.innerHTML = "<p>No available time slots.</p>";
          }
        }
  
        backButton.addEventListener("click", () => {
          renderGrid();
        });
  
        nextButton.addEventListener("click", () => {
          if (selDate && selTime) {
            appointmentDate = selDate;
            appointmentTime = selTime;
            renderPersonalInfoStep();
          } else {
            const errMsg = document.createElement('p');
            errMsg.textContent = "Please select a date and time before proceeding.";
            errMsg.style.color = "red";
            if (!timeSlotsContainer.querySelector('p.error')) {
              errMsg.className = "error";
              timeSlotsContainer.appendChild(errMsg);
            }
          }
        });
      }
  
      // -----------------------------------------------
      // Personal Information Step with Inline Validation
      // -----------------------------------------------
      function renderPersonalInfoStep() {
        container.innerHTML = '';
        container.style.display = 'block';
        container.innerHTML = `
          <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.15); text-align: center; max-width: 450px; margin: 20px auto;">
            <h2 style="margin-bottom: 10px;">Personal Information</h2>
            <div style="text-align: left; margin-bottom: 10px;" id="personalInfoFields">
              <label style="display:block; margin-bottom: 5px; font-weight:600;">Name</label>
              <input id="personalName" type="text" placeholder="Your Name" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ccc; border-radius:5px;">
              <label style="display:block; margin-bottom: 5px; font-weight:600;">Email</label>
              <input id="personalEmail" type="email" placeholder="Your Email" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ccc; border-radius:5px;">
              <label style="display:block; margin-bottom: 5px; font-weight:600;">Phone</label>
              <input id="personalPhone" type="tel" placeholder="Your Phone Number" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ccc; border-radius:5px;">
            </div>
            <div id="personalError" style="color:red; margin-bottom: 10px;"></div>
            <div style="display: flex; justify-content: space-between;">
              <button id="personalBack" style="padding: 10px; border: none; border-radius: 8px; background-color: #007BFF; color: white; font-size: 16px; cursor: pointer; transition: background 0.2s; height: 50px;">Back</button>
              <button id="personalNext" style="padding: 10px; border: none; border-radius: 8px; background-color: #007BFF; color: white; font-size: 16px; cursor: pointer; transition: background 0.2s; height: 50px;">Next</button>
            </div>
          </div>
        `;
        const personalBack = container.querySelector('#personalBack');
        const personalNext = container.querySelector('#personalNext');
        const personalError = container.querySelector('#personalError');
        addHoverEffect(personalBack, '#007BFF', '#0056b3');
        addHoverEffect(personalNext, '#007BFF', '#0056b3');
  
        personalBack.addEventListener('click', () => {
          startBookingProcess();
        });
  
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
  
      // -----------------------------------------------
      // Confirmation View with Inline Checkbox Validation
      // -----------------------------------------------
      function renderConfirmationView() {
        container.innerHTML = '';
        container.style.display = 'block';
        container.innerHTML = `
          <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.15); text-align: center; max-width: 450px; margin: 20px auto;">
            <h2 style="margin-bottom: 10px;">Confirm Your Viewing</h2>
            <div style="text-align: left; margin-bottom: 20px;">
              <p><strong>Property:</strong> ${selectedPropertyName}</p>
              <p><strong>Appointment Date:</strong> ${appointmentDate}</p>
              <p><strong>Appointment Time:</strong> ${appointmentTime}</p>
              <p><strong>Name:</strong> ${personalName}</p>
              <p><strong>Email:</strong> ${personalEmail}</p>
              <p><strong>Phone:</strong> ${personalPhone}</p>
            </div>
            <div style="margin-bottom: 10px; text-align: left;" id="confirmError"></div>
            <div style="margin-bottom: 20px; text-align: left;">
              <input id="agreeCheckbox" type="checkbox" style="margin-right: 8px;">
              <label for="agreeCheckbox" style="font-weight:600;">Hereby I agree to be present at the viewing</label>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <button id="confirmBack" style="padding: 10px; border: none; border-radius: 8px; background-color: #007BFF; color: white; font-size: 16px; cursor: pointer; transition: background 0.2s; height: 50px;">Back</button>
              <button id="confirmBtn" style="padding: 10px; border: none; border-radius: 8px; background-color: #007BFF; color: white; font-size: 16px; cursor: pointer; transition: background 0.2s; height: 50px;">Confirm Viewing</button>
            </div>
          </div>
        `;
        const confirmBack = container.querySelector('#confirmBack');
        const confirmBtn = container.querySelector('#confirmBtn');
        const agreeCheckbox = container.querySelector('#agreeCheckbox');
        const confirmError = container.querySelector('#confirmError');
        addHoverEffect(confirmBack, '#007BFF', '#0056b3');
        addHoverEffect(confirmBtn, '#007BFF', '#0056b3');
  
        confirmBack.addEventListener('click', () => {
          renderPersonalInfoStep();
        });
  
        confirmBtn.addEventListener('click', () => {
          if (!agreeCheckbox.checked) {
            confirmError.textContent = "Please agree to be present at the viewing before confirming.";
            return;
          }
          confirmError.textContent = "";
          container.innerHTML = `
            <div style="background: #d4edda; padding: 20px; border-radius: 12px; text-align: center; max-width: 450px; margin: 20px auto; color: #155724;">
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
  
      // -----------------------------------------------
      // Contact View for Sales Rep Details and WhatsApp
      // -----------------------------------------------
      function renderContactView() {
        container.innerHTML = '';
        container.style.display = 'block';
        container.innerHTML = `
          <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.15); text-align: center; max-width: 450px; margin: 20px auto;">
            <h2 style="margin-bottom: 10px;">Contact Sales Rep</h2>
            <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 20px;">
              <img src="${repImage}" alt="Sales Rep Profile" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; margin-bottom: 10px;">
              <p style="font-weight: bold; margin: 5px 0;">${repName}</p>
              <p style="margin: 5px 0;">Email: ${repEmail}</p>
              <p style="margin: 5px 0;">Phone: ${repNumber}</p>
            </div>
            <a id="whatsappLink" href="" target="_blank" style="text-decoration: none;">
              <div style="display: inline-flex; align-items: center; justify-content: space-between; background-color: #51bce6; color: white; padding: 10px 20px; border-radius: 5px; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold;">
                <span>WhatsApp</span>
                <span style="font-size: 18px;">&#8594;</span>
              </div>
            </a>
            <div style="margin-top: 20px;">
              <button id="contactBack" style="padding: 10px; border: none; border-radius: 8px; background-color: #007BFF; color: white; font-size: 16px; cursor: pointer; transition: background 0.2s; height: 50px;">Back</button>
            </div>
          </div>
        `;
        const sanitizedNumber = repNumber.replace(/\D/g, '');
        const whatsappLink = container.querySelector('#whatsappLink');
        whatsappLink.href = `https://api.whatsapp.com/send?phone=${sanitizedNumber}`;
        const contactBack = container.querySelector('#contactBack');
        addHoverEffect(contactBack, '#007BFF', '#0056b3');
        contactBack.addEventListener('click', () => {
          showPropertyDetail(properties.find(p => p.fields["Property Name"] === selectedPropertyName));
        });
      }
  
      // Start by rendering the grid view.
      renderGrid();
      element.appendChild(container);
    },
  };  