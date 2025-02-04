export const RealEstateExtension = {
    name: 'RealEstate',
    type: 'response',
    match: ({ trace }) =>
        trace.type === 'ext_real_estate' || (trace.payload && trace.payload.name === 'ext_real_estate'),
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

        const container = document.createElement('div');
        container.style.display = 'grid';
        container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(250px, 1fr))';
        container.style.gap = '15px';
        container.style.justifyContent = 'center';

        function renderGrid() {
            container.innerHTML = '';

            properties.forEach((property) => {
                const propertyCard = document.createElement('div');
                propertyCard.style.cursor = 'pointer';
                propertyCard.style.textAlign = 'center';
                propertyCard.addEventListener('mouseover', () => {
                    propertyCard.style.transform = 'scale(1.05)';
                });
                propertyCard.addEventListener('mouseout', () => {
                    propertyCard.style.transform = 'scale(1)';
                });

                const img = document.createElement('img');
                img.src = property.fields?.Image?.[0]?.url || '';
                img.style.width = '100%';

                const title = document.createElement('p');
                title.textContent = property.fields?.['Property Name'] || 'Unknown Property';
                title.style.fontWeight = 'bold';

                propertyCard.appendChild(img);
                propertyCard.appendChild(title);
                propertyCard.addEventListener('click', () => showPropertyDetail(property));
                container.appendChild(propertyCard);
            });
        }

        function showPropertyDetail(property) {
            container.innerHTML = '';

            const mainImage = document.createElement('img');
            mainImage.src = property.fields?.Image?.[0]?.url || '';
            mainImage.style.width = '100%';

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

            const bookViewingButton = document.createElement('button');
            bookViewingButton.textContent = '📅 Book a Viewing';
            bookViewingButton.style.backgroundColor = '#008000';
            bookViewingButton.style.color = 'white';
            bookViewingButton.addEventListener('click', () => startBookingProcess());

            const contactButton = document.createElement('button');
            contactButton.textContent = '📞 Contact';
            contactButton.style.backgroundColor = '#D32F2F';
            contactButton.style.color = 'white';

            const backButton = document.createElement('button');
            backButton.textContent = '← Back to Listings';
            backButton.style.backgroundColor = '#007bff';
            backButton.style.color = 'white';
            backButton.addEventListener('click', renderGrid);

            buttonsContainer.appendChild(bookViewingButton);
            buttonsContainer.appendChild(contactButton);
            buttonsContainer.appendChild(backButton);

            container.appendChild(mainImage);
            container.appendChild(thumbnailContainer);
            container.appendChild(details);
            container.appendChild(buttonsContainer);
        }

        function startBookingProcess() {
            container.innerHTML = `
                <h2>Appointment Date and Time</h2>
                <p class="subtitle">First available: Thursday, January 23rd 2025 9:30</p>
                
                <div class="date-selector" id="dateSelector"></div>
                
                <div id="timeSlots" class="time-slot-container"></div>
                
                <div class="nav-buttons">
                    <button id="backButton">Back</button>
                    <button id="nextButton">Next</button>
                </div>
            `;

            const dateSelector = document.getElementById("dateSelector");
            const timeSlotsContainer = document.getElementById("timeSlots");
            let selectedDate = null;
            let selectedTime = null;

            const availableDates = ["2025-01-30", "2025-01-31", "2025-02-01"];
            const availableTimeSlots = {
                "2025-01-30": ["09:30", "10:00", "11:00", "13:00"],
                "2025-01-31": ["10:00", "14:00", "16:00"],
                "2025-02-01": ["11:00", "14:30", "15:00"],
            };

            availableDates.forEach(date => {
                const button = document.createElement("button");
                button.textContent = new Date(date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
                button.classList.add("date-button");
                button.addEventListener("click", function () {
                    document.querySelectorAll(".date-button").forEach(btn => btn.classList.remove("selected"));
                    button.classList.add("selected");
                    selectedDate = date;
                    updateTimeSlots(date);
                });
                dateSelector.appendChild(button);
            });

            function updateTimeSlots(date) {
                timeSlotsContainer.innerHTML = "";
                if (availableTimeSlots[date]) {
                    availableTimeSlots[date].forEach(time => {
                        const timeButton = document.createElement("button");
                        timeButton.textContent = time;
                        timeButton.classList.add("time-slot");
                        timeButton.addEventListener("click", () => {
                            selectedTime = time;
                        });
                        timeSlotsContainer.appendChild(timeButton);
                    });
                }
            }
        }

        renderGrid();
        element.appendChild(container);
    },
};