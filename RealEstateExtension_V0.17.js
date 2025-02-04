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
  
      // Remove message box background
      let parentMessage = element.closest(
        '.vfrc-message.vfrc-message--extension-RealEstate'
      );
      if (parentMessage) {
        parentMessage.style.background = 'transparent';
        parentMessage.style.boxShadow = 'none';
      }
  
      const container = document.createElement('div');
      container.style.display = 'grid';
      container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(250px, 1fr))';
      container.style.gap = '15px';
      container.style.justifyContent = 'center';
      container.style.alignItems = 'center';
  
      // Render the grid of property cards
      function renderGrid() {
        container.innerHTML = '';
  
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
  
      // Show detailed view for a property
      function showPropertyDetail(property) {
        container.innerHTML = '';
  
        const mainImage = document.createElement('img');
        mainImage.src = property.fields?.Image?.[0]?.url || '';
        mainImage.style.width = '100%';
        mainImage.style.borderRadius = '10px';
  
        const thumbnailContainer = document.createElement('div');
        thumbnailContainer.style.display = 'grid';
        thumbnailContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(60px, 1fr))';
        thumbnailContainer.style.gap = '10px';
  
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
            smallImg.addEventListener('click', () => updateImages(index + 1));
            thumbnailContainer.appendChild(smallImg);
          });
        }
        updateImages(0);
  
        const details = document.createElement('div');
        details.style.textAlign = 'left';
        details.style.fontSize = '14px';
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
        // Updated: Trigger the modern appointment selector when clicked.
        bookViewingButton.addEventListener('click', () => startBookingProcess());
  
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
  
      // A modern, multi–step appointment selector for booking a viewing
      function startBookingProcess() {
        // Variables to hold the booking data
        let bookingDate = '';
        let bookingTime = '';
  
        // Step 1: Date selection
        function renderDateStep() {
          container.innerHTML = `
            <div style="max-width: 500px; margin: 20px auto; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); background-color: #fff;">
              <h2 style="text-align: center; margin-bottom: 20px;">Book a Viewing</h2>
              <div style="display: flex; flex-direction: column; gap: 15px;">
                <label for="date-picker" style="font-weight: bold;">Select a Date</label>
                <input type="date" id="date-picker" style="padding: 10px; border: 1px solid #ccc; border-radius: 5px;">
                <button id="to-time" style="padding: 10px; border: none; border-radius: 5px; background-color: #007bff; color: white; cursor: pointer;">
                  Next
                </button>
              </div>
            </div>
          `;
  
          document.getElementById('to-time').addEventListener('click', () => {
            bookingDate = document.getElementById('date-picker').value;
            if (!bookingDate) {
              alert('Please select a date.');
              return;
            }
            renderTimeStep();
          });
        }
  
        // Step 2: Time slot selection
        function renderTimeStep() {
          container.innerHTML = `
            <div style="max-width: 500px; margin: 20px auto; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); background-color: #fff;">
              <h2 style="text-align: center; margin-bottom: 20px;">Select a Time Slot</h2>
              <div id="time-slots" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                <button class="time-slot" data-time="09:00" style="padding: 10px; border: none; border-radius: 5px; background-color: #f0f0f0; cursor: pointer;">09:00</button>
                <button class="time-slot" data-time="10:00" style="padding: 10px; border: none; border-radius: 5px; background-color: #f0f0f0; cursor: pointer;">10:00</button>
                <button class="time-slot" data-time="11:00" style="padding: 10px; border: none; border-radius: 5px; background-color: #f0f0f0; cursor: pointer;">11:00</button>
                <button class="time-slot" data-time="12:00" style="padding: 10px; border: none; border-radius: 5px; background-color: #f0f0f0; cursor: pointer;">12:00</button>
                <button class="time-slot" data-time="13:00" style="padding: 10px; border: none; border-radius: 5px; background-color: #f0f0f0; cursor: pointer;">13:00</button>
                <button class="time-slot" data-time="14:00" style="padding: 10px; border: none; border-radius: 5px; background-color: #f0f0f0; cursor: pointer;">14:00</button>
              </div>
              <div style="margin-top: 20px; display: flex; justify-content: space-between;">
                <button id="back-to-date" style="padding: 10px; border: none; border-radius: 5px; background-color: #6c757d; color: white; cursor: pointer;">Back</button>
                <button id="to-contact" style="padding: 10px; border: none; border-radius: 5px; background-color: #007bff; color: white; cursor: pointer;">Next</button>
              </div>
            </div>
          `;
  
          // Handle time slot selection
          const timeSlotButtons = document.querySelectorAll('.time-slot');
          timeSlotButtons.forEach((button) => {
            button.addEventListener('click', () => {
              // Deselect all slots first
              timeSlotButtons.forEach((btn) => {
                btn.style.backgroundColor = '#f0f0f0';
                btn.style.color = 'black';
                btn.removeAttribute('data-selected');
              });
              // Mark this slot as selected
              button.style.backgroundColor = '#007bff';
              button.style.color = 'white';
              button.setAttribute('data-selected', 'true');
              bookingTime = button.getAttribute('data-time');
            });
          });
  
          document.getElementById('back-to-date').addEventListener('click', renderDateStep);
          document.getElementById('to-contact').addEventListener('click', () => {
            if (!bookingTime) {
              alert('Please select a time slot.');
              return;
            }
            renderContactStep();
          });
        }
  
        // Step 3: Contact details and confirmation
        function renderContactStep() {
          container.innerHTML = `
            <div style="max-width: 500px; margin: 20px auto; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); background-color: #fff;">
              <h2 style="text-align: center; margin-bottom: 20px;">Contact Details</h2>
              <input type="text" id="contact-name" placeholder="Your Name" style="width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 5px;">
              <input type="email" id="contact-email" placeholder="Your Email" style="width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 5px;">
              <div style="display: flex; justify-content: space-between;">
                <button id="back-to-time" style="padding: 10px; border: none; border-radius: 5px; background-color: #6c757d; color: white; cursor: pointer;">Back</button>
                <button id="confirm-booking" style="padding: 10px; border: none; border-radius: 5px; background-color: #28a745; color: white; cursor: pointer;">Confirm Booking</button>
              </div>
            </div>
          `;
  
          document.getElementById('back-to-time').addEventListener('click', renderTimeStep);
          document.getElementById('confirm-booking').addEventListener('click', () => {
            const name = document.getElementById('contact-name').value;
            const email = document.getElementById('contact-email').value;
            if (!name || !email) {
              alert('Please fill in your contact details.');
              return;
            }
            renderConfirmation(name, email);
          });
        }
  
        // Final confirmation step
        function renderConfirmation(name, email) {
          container.innerHTML = `
            <div style="max-width: 500px; margin: 20px auto; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); background-color: #fff; text-align: center;">
              <h2>Booking Confirmed!</h2>
              <p>Thank you, ${name}. Your viewing is scheduled for ${bookingDate} at ${bookingTime}.</p>
              <p>A confirmation email will be sent to ${email}.</p>
              <button id="back-to-listings" style="margin-top: 20px; padding: 10px; border: none; border-radius: 5px; background-color: #007bff; color: white; cursor: pointer;">
                Back to Listings
              </button>
            </div>
          `;
  
          document.getElementById('back-to-listings').addEventListener('click', renderGrid);
        }
  
        // Start the booking process with the date selection
        renderDateStep();
      }
  
      renderGrid();
      element.appendChild(container);
    },
  };  