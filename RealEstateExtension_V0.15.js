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

        // Remove message box background
        let parentMessage = element.closest('.vfrc-message.vfrc-message--extension-RealEstate');
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
                <div class="breadcrumb">
                    <span class="step active">1</span> Select Date
                    <span class="step">2</span> Select Time
                    <span class="step">3</span> Contact Details
                    <span class="step">4</span> Confirm
                </div>
                <h3>Select a Date</h3>
                <input type="date" id="date-picker" />
                <button id="next-step">Next</button>
            `;

            document.getElementById('next-step').addEventListener('click', () => {
                container.innerHTML = `
                    <h3>Select a Time Slot</h3>
                    <button class="time-slot">9:00</button>
                    <button class="time-slot">10:00</button>
                    <button class="time-slot">11:00</button>
                    <button id="next-step-2">Next</button>
                `;

                document.getElementById('next-step-2').addEventListener('click', () => {
                    container.innerHTML = `
                        <h3>Contact Details</h3>
                        <input type="text" placeholder="Name" />
                        <input type="email" placeholder="Email" />
                        <button id="confirm-booking">Confirm</button>
                    `;
                });
            });
        }

        renderGrid();
        element.appendChild(container);
    },
};