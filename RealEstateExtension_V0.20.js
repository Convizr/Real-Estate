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
  
      // Remove message box background if present.
      let parentMessage = element.closest(
        '.vfrc-message.vfrc-message--extension-RealEstate'
      );
      if (parentMessage) {
        parentMessage.style.background = 'transparent';
        parentMessage.style.boxShadow = 'none';
      }
  
      // Main container: reused for all views.
      const container = document.createElement('div');
      // Start with grid view defaults.
      container.style.display = 'grid';
      container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(250px, 1fr))';
      container.style.gap = '15px';
      container.style.padding = '10px';
      container.style.width = '100%';
  
      // --------------------------
      // Render the Properties Grid
      // --------------------------
      function renderGrid() {
        container.innerHTML = '';
        // Reset grid layout.
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
          title.textContent =
            property.fields?.['Property Name'] || 'Unknown Property';
          title.style.fontWeight = 'bold';
  
          propertyCard.appendChild(img);
          propertyCard.appendChild(title);
          propertyCard.addEventListener('click', () =>
            showPropertyDetail(property)
          );
          container.appendChild(propertyCard);
        });
      }
  
      // --------------------------
      // Show Property Detail View
      // --------------------------
      function showPropertyDetail(property) {
        container.innerHTML = '';
        // Use block layout for custom detail view.
        container.style.display = 'block';
  
        // Create an ordered copy of the images.
        let images = property.fields?.Image || [];
        let currentImageOrder = images.slice();
  
        // Create a row container for images.
        const imageRow = document.createElement('div');
        imageRow.style.display = 'flex';
        imageRow.style.gap = '15px';
        imageRow.style.alignItems = 'flex-start';
        imageRow.style.marginBottom = '15px';
  
        // Left column: Main image.
        const mainImageContainer = document.createElement('div');
        mainImageContainer.style.flex = '2';
        mainImageContainer.style.maxWidth = '60%';
  
        const mainImage = document.createElement('img');
        mainImage.src = currentImageOrder[0].url;
        mainImage.style.width = '100%';
        mainImage.style.borderRadius = '10px';
        mainImage.style.maxHeight = '400px';
        mainImage.style.objectFit = 'cover';
        mainImageContainer.appendChild(mainImage);
  
        // Right column: Thumbnails.
        const thumbContainer = document.createElement('div');
        thumbContainer.style.flex = '1';
        thumbContainer.style.display = 'flex';
        thumbContainer.style.flexDirection = 'column';
        thumbContainer.style.gap = '10px';
  
        // Function to (re)render the image row.
        function renderImageRow() {
          // Set main image.
          mainImage.src = currentImageOrder[0].url;
          // Clear and render thumbnails in order.
          thumbContainer.innerHTML = '';
          currentImageOrder.slice(1).forEach((imgData, index) => {
            const thumb = document.createElement('img');
            thumb.src = imgData.url;
            thumb.style.width = '100%';
            thumb.style.cursor = 'pointer';
            thumb.style.borderRadius = '5px';
            thumb.style.maxHeight = '80px';
            thumb.style.objectFit = 'cover';
            thumb.addEventListener('click', () => {
              // Rotate the image order so that the clicked thumbnail becomes first.
              const clickedIndex = index + 1; // offset because slice(1)
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
  
        // Create details section.
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
  
        // Create buttons container.
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.display = 'flex';
        buttonsContainer.style.flexDirection = 'row';
        buttonsContainer.style.gap = '10px';
  
        // --- Book a Viewing Button (custom inline styling) ---
        const bookViewingButton = document.createElement('button');
        // Main button styles.
        bookViewingButton.style.fontSize = '16px';
        bookViewingButton.style.fontWeight = '600';
        bookViewingButton.style.backgroundColor = '#154633';
        bookViewingButton.style.padding = '24px 24px 24px 32px';
        bookViewingButton.style.display = 'flex';
        bookViewingButton.style.alignItems = 'center';
        bookViewingButton.style.borderRadius = '99px';
        bookViewingButton.style.position = 'relative';
        bookViewingButton.style.transition = 'all 0.5s cubic-bezier(.77,0,.175,1)';
        bookViewingButton.style.border = 'none';
        bookViewingButton.style.cursor = 'pointer';
        bookViewingButton.style.overflow = 'hidden'; // to contain the simulated pseudo-element
  
        // Create the text span.
        const btnText = document.createElement('span');
        btnText.textContent = 'Book a Viewing';
        btnText.style.color = '#fff';
        btnText.style.lineHeight = '1';
        btnText.style.position = 'relative';
        btnText.style.zIndex = '5';
        btnText.style.marginRight = '32px';
        bookViewingButton.appendChild(btnText);
  
        // Add an SVG icon (an arrow) as a child.
        const svgIcon = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'svg'
        );
        svgIcon.setAttribute('width', '24');
        svgIcon.setAttribute('height', '24');
        svgIcon.setAttribute('viewBox', '0 0 24 24');
        svgIcon.style.display = 'inline-block';
        svgIcon.style.position = 'relative';
        svgIcon.style.zIndex = '5';
        svgIcon.style.transform = 'rotate(0deg) translateX(0)';
        svgIcon.style.transformOrigin = 'left';
        svgIcon.style.transition =
          'all 0.5s cubic-bezier(.77,0,.175,1)';
        // Create a simple arrow path.
        const path = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'path'
        );
        path.setAttribute('d', 'M5 12h14M13 5l7 7-7 7');
        path.setAttribute('stroke', '#fff');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');
        svgIcon.appendChild(path);
        bookViewingButton.appendChild(svgIcon);
  
        // Simulate the ::before pseudo-element as an extra span.
        const circleBg = document.createElement('span');
        circleBg.style.backgroundColor = '#95C11F';
        circleBg.style.width = '32px';
        circleBg.style.height = '32px';
        circleBg.style.display = 'block';
        circleBg.style.position = 'absolute';
        circleBg.style.zIndex = '1';
        circleBg.style.borderRadius = '99px';
        circleBg.style.top = '50%';
        circleBg.style.right = '16px';
        circleBg.style.transform = 'translateY(-50%)';
        circleBg.style.transition =
          'all 0.5s cubic-bezier(.77,0,.175,1)';
        bookViewingButton.appendChild(circleBg);
  
        // On hover, you could add an event listener to adjust the svg and circleBg if desired.
        // (For example, rotate the svgIcon by 45deg and expand circleBg.)
        bookViewingButton.addEventListener('mouseover', () => {
          svgIcon.style.transform = 'rotate(45deg) translateX(-8px)';
          circleBg.style.width = '100%';
          circleBg.style.height = '100%';
          circleBg.style.right = '0';
        });
        bookViewingButton.addEventListener('mouseout', () => {
          svgIcon.style.transform = 'rotate(0deg) translateX(0)';
          circleBg.style.width = '32px';
          circleBg.style.height = '32px';
          circleBg.style.right = '16px';
        });
  
        // Trigger appointment scheduler on click.
        bookViewingButton.addEventListener('click', startBookingProcess);
  
        // --- Contact Button (blue outline, white background) ---
        const contactButton = document.createElement('button');
        contactButton.textContent = '📞 Contact';
        contactButton.style.backgroundColor = '#fff';
        contactButton.style.color = '#007bff';
        contactButton.style.border = '2px solid #007bff';
        contactButton.style.padding = '10px';
        contactButton.style.borderRadius = '5px';
        contactButton.style.cursor = 'pointer';
  
        // --- Back to Listings Button ---
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
  
        // Append the image row, details, and buttons to the container.
        container.appendChild(imageRow);
        container.appendChild(details);
        container.appendChild(buttonsContainer);
      }
  
      // -----------------------------------------------
      // Modern Appointment Selector (Calendar–Style UI)
      // -----------------------------------------------
      function startBookingProcess() {
        // Clear container and switch layout.
        container.innerHTML = '';
        container.style.display = 'block';
  
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
  
        const dateSelector = container.querySelector('#dateSelector');
        const timeSlotsContainer = container.querySelector('#timeSlots');
        const backButton = container.querySelector('#backButton');
        const nextButton = container.querySelector('#nextButton');
  
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
  
        let selectedDate = null;
        let selectedTime = null;
  
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
          button.classList.add("date-button");
          button.addEventListener("click", function () {
            dateSelector.querySelectorAll(".date-button").forEach(btn => {
              btn.classList.remove("selected");
              btn.style.backgroundColor = "white";
              btn.style.color = "black";
            });
            button.classList.add("selected");
            button.style.backgroundColor = "#007BFF";
            button.style.color = "white";
            selectedDate = date;
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
              timeButton.classList.add("time-slot");
              timeButton.addEventListener("click", () => {
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
  
        backButton.addEventListener("click", () => {
          renderGrid();
        });
  
        nextButton.addEventListener("click", () => {
          if (selectedDate && selectedTime) {
            alert(`You selected: ${selectedDate} at ${selectedTime}`);
            // Expand this step if you wish to add contact details.
          } else {
            alert("Please select a date and time before proceeding.");
          }
        });
      }
  
      // Start by rendering the grid.
      renderGrid();
      element.appendChild(container);
    },
  };