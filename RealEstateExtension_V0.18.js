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
  
      // Remove message box background (if any)
      let parentMessage = element.closest(
        '.vfrc-message.vfrc-message--extension-RealEstate'
      );
      if (parentMessage) {
        parentMessage.style.background = 'transparent';
        parentMessage.style.boxShadow = 'none';
      }
  
      // Main container that will hold all the views (grid, property detail, booking)
      const container = document.createElement('div');
      container.style.width = '100%';
      container.style.display = 'grid';
      container.style.justifyContent = 'center';
      container.style.alignItems = 'center';
  
      // --------------------------
      // RENDER THE PROPERTIES GRID
      // --------------------------
      function renderGrid() {
        container.innerHTML = '';
        container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(250px, 1fr))';
        container.style.gap = '15px';
        container.style.padding = '10px';
  
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
          propertyCard.addEventListener('click', () => showPropertyDetail(property));
          container.appendChild(propertyCard);
        });
      }
  
      // --------------------------
      // SHOW PROPERTY DETAILS VIEW
      // --------------------------
      function showPropertyDetail(property) {
        container.innerHTML = '';
        container.style.gridTemplateColumns = '1fr'; // single column view
  
        const mainImage = document.createElement('img');
        mainImage.src = property.fields?.Image?.[0]?.url || '';
        mainImage.style.width = '100%';
        mainImage.style.borderRadius = '10px';
  
        const thumbnailContainer = document.createElement('div');
        thumbnailContainer.style.display = 'grid';
        thumbnailContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(60px, 1fr))';
        thumbnailContainer.style.gap = '10px';
        thumbnailContainer.style.margin = '10px 0';
  
        let images = property.fields?.Image || [];
        function updateImages(selectedIndex) {
          images = [...images.slice(selectedIndex), ...images.slice(0, selectedIndex)];
          mainImage.src = images[0].url;
          thumbnailContainer.innerHTML = '';
          images.slice(1).forEach((imgData, index) => {
            const smallImg = document.createElement('img');
            smallImg.src = imgData.url;
            smallImg.style.width = '60px';
            smallImg.style.cursor = 'pointer';
            smallImg.style.borderRadius = '5px';
            smallImg.addEventListener('click', () => updateImages(index + 1));
            thumbnailContainer.appendChild(smallImg);
          });
        }
        updateImages(0);
  
        const details = document.createElement('div');
        details.style.textAlign = 'left';
        details.style.fontSize = '14px';
        details.style.marginTop = '10px';
        details.innerHTML = `
          <p><strong>City:</strong> ${property.fields?.City || 'N/A'}</p>
          <p><strong>Type:</strong> ${property.fields?.['Property Type'] || 'N/A'}</p>
          <p><strong>Bedrooms:</strong> ${property.fields?.Bedrooms || 'N/A'}</p>
          <p><strong>Year:</strong> ${property.fields?.Year || 'N/A'}</p>
          <p><strong>Price:</strong> $${property.fields?.Price?.toLocaleString() || 'N/A'}</p>
        `;
  
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.display = 'flex';
        buttonsContainer.style.flexDirection = 'column';
        buttonsContainer.style.gap = '10px';
        buttonsContainer.style.marginTop = '15px';
  
        const bookViewingButton = document.createElement('button');
        bookViewingButton.textContent = '📅 Book a Viewing';
        bookViewingButton.style.backgroundColor = '#008000';
        bookViewingButton.style.color = 'white';
        bookViewingButton.style.padding = '10px';
        bookViewingButton.style.border = 'none';
        bookViewingButton.style.borderRadius = '5px';
        bookViewingButton.style.cursor = 'pointer';
        // When clicked, open the new appointment selector:
        bookViewingButton.addEventListener('click', startBookingProcess);
  
        const contactButton = document.createElement('button');
        contactButton.textContent = '📞 Contact';
        contactButton.style.backgroundColor = '#D32F2F';
        contactButton.style.color = 'white';
        contactButton.style.padding = '10px';
        contactButton.style.border = 'none';
        contactButton.style.borderRadius = '5px';
        contactButton.style.cursor = 'pointer';
  
        const backButton = document.createElement('button');
        backButton.textContent = '← Back to Listings';
        backButton.style.backgroundColor = '#007bff';
        backButton.style.color = 'white';
        backButton.style.padding = '10px';
        backButton.style.border = 'none';
        backButton.style.borderRadius = '5px';
        backButton.style.cursor = 'pointer';
        backButton.addEventListener('click', renderGrid);
  
        buttonsContainer.appendChild(bookViewingButton);
        buttonsContainer.appendChild(contactButton);
        buttonsContainer.appendChild(backButton);
  
        container.appendChild(mainImage);
        container.appendChild(thumbnailContainer);
        container.appendChild(details);
        container.appendChild(buttonsContainer);
      }
  
      // -----------------------------------------------
      // MODERN APPOINTMENT SELECTOR (Calendar–Style UI)
      // -----------------------------------------------
      function startBookingProcess() {
        // Clear the container and remove any grid styling
        container.innerHTML = '';
        container.style.padding = '10px';
        container.style.display = 'block'; // switch to block layout for this view
  
        // Insert the calendar container HTML (using inline styles similar to your sample)
        container.innerHTML = `
          <div class="calendar-container" style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.15); text-align: center; max-width: 450px; margin: 20px auto;">
            <h2 style="margin-bottom: 10px;">Appointment Date and Time</h2>
            <p class="subtitle" style="margin-bottom: 15px; font-size: 14px; color: #555;">
              First available: Thursday, January 23rd 2025 9:30
            </p>
            <div class="date-selector" id="dateSelector" style="display: flex; justify-content: space-around; margin-bottom: 15px;"></div>
            <div id="timeSlots" class="time-slot-container" style="min-height: 40px; margin-bottom: 15px;"></div>
            <div class="nav-buttons" style="display: flex; justify-content: space-between;">
              <button id="backButton" style="padding: 10px; border: none; border-radius: 8px; background-color: #007BFF; color: white; cursor: pointer; font-size: 16px; transition: background 0.2s;">Back</button>
              <button id="nextButton" style="padding: 10px; border: none; border-radius: 8px; background-color: #007BFF; color: white; cursor: pointer; font-size: 16px; transition: background 0.2s;">Next</button>
            </div>
          </div>
        `;
  
        // Use container.querySelector to get elements from our new view
        const dateSelector = container.querySelector('#dateSelector');
        const timeSlotsContainer = container.querySelector('#timeSlots');
        const backButton = container.querySelector('#backButton');
        const nextButton = container.querySelector('#nextButton');
  
        // Define available dates and time slots (you can fetch these from your backend)
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
          // Other dates can have no available slots or be added as needed.
        };
  
        let selectedDate = null;
        let selectedTime = null;
  
        // Create a date button for each available date
        availableDates.forEach(date => {
          const day = new Date(date);
          const button = document.createElement("button");
          // Display abbreviated weekday and the day of the month.
          // Using "\n" and white-space pre-line to allow a line break.
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
          button.classList.add("date-button");
          button.addEventListener("click", function () {
            // Deselect all other date buttons
            dateSelector.querySelectorAll(".date-button").forEach(btn => {
              btn.classList.remove("selected");
              btn.style.backgroundColor = "white";
              btn.style.color = "black";
            });
            // Mark this button as selected
            button.classList.add("selected");
            button.style.backgroundColor = "#007BFF";
            button.style.color = "white";
            selectedDate = date;
            updateTimeSlots(date);
          });
          dateSelector.appendChild(button);
        });
  
        // Function to update the time slots view when a date is selected
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
              timeButton.classList.add("time-slot");
              timeButton.addEventListener("click", () => {
                // Deselect any previously selected time slot
                timeSlotsContainer.querySelectorAll(".time-slot").forEach(btn => {
                  btn.classList.remove("selected");
                  btn.style.backgroundColor = "white";
                  btn.style.color = "black";
                });
                timeButton.classList.add("selected");
                timeButton.style.backgroundColor = "#007BFF";
                timeButton.style.color = "white";
                selectedTime = time;
              });
              timeSlotsContainer.appendChild(timeButton);
            });
          } else {
            timeSlotsContainer.innerHTML = "<p>No available time slots.</p>";
          }
        }
  
        // "Back" returns to the property detail view.
        backButton.addEventListener("click", () => {
          // Optionally, you can return to the previous property detail view.
          // For demonstration, we call renderGrid() to return to the listings.
          renderGrid();
        });
  
        // "Next" confirms the appointment selection.
        nextButton.addEventListener("click", () => {
          if (selectedDate && selectedTime) {
            alert(`You selected: ${selectedDate} at ${selectedTime}`);
            // Here you might continue to a contact details step or finalize the booking.
          } else {
            alert("Please select a date and time before proceeding.");
          }
        });
      }
  
      // Start by rendering the properties grid.
      renderGrid();
      element.appendChild(container);
    },
  };  