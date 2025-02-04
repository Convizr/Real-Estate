export const RealEstateExtension = {
    name: 'RealEstate',
    type: 'response',
    match: ({ trace }) =>
        trace.type === 'ext_real_estate' || (trace.payload && trace.payload.name === 'ext_real_estate'),
    render: ({ trace, element }) => {
        console.log('Rendering RealEstateExtension');

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

        // Ensure no background color for message box
        let parentMessage = element.closest('.vfrc-message.vfrc-message--extension-RealEstate');
        if (parentMessage) {
            parentMessage.style.background = 'transparent';
            parentMessage.style.boxShadow = 'none';
        }

        const container = document.createElement('div');
        container.style.display = 'grid';
        container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(250px, 1fr))';
        container.style.gap = '15px';

        function renderGrid() {
            container.innerHTML = '';

            properties.forEach((property) => {
                const propertyCard = document.createElement('div');
                propertyCard.style.cursor = 'pointer';
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

            // Image rotation logic
            let images = property.fields?.Image || [];
            let mainImage = images[0];

            const mainImgElement = document.createElement('img');
            mainImgElement.src = mainImage.url;
            mainImgElement.style.width = '100%';
            mainImgElement.style.borderRadius = '10px';

            const thumbnailContainer = document.createElement('div');
            thumbnailContainer.style.display = 'grid';
            thumbnailContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(60px, 1fr))';
            thumbnailContainer.style.gap = '5px';

            images.forEach((imgData, index) => {
                if (index === 0) return;
                const smallImg = document.createElement('img');
                smallImg.src = imgData.url;
                smallImg.style.width = '80px';
                smallImg.style.cursor = 'pointer';
                smallImg.addEventListener('click', () => {
                    images = [...images.slice(index), ...images.slice(0, index)];
                    mainImgElement.src = images[0].url;
                    showPropertyDetail(property); // Refresh thumbnails
                });

                thumbnailContainer.appendChild(smallImg);
            });

            // Property details
            const details = document.createElement('div');
            details.style.textAlign = 'left';
            details.style.fontSize = '14px';
            details.innerHTML = `
                <p><strong>City:</strong> ${property.fields?.City || 'N/A'}</p>
                <p><strong>Type:</strong> ${property.fields?.['Property Type'] || 'N/A'}</p>
                <p><strong>Bedrooms:</strong> ${property.fields?.Bedrooms || 'N/A'}</p>
                <p><strong>Year:</strong> ${property.fields?.Year || 'N/A'}</p>
                <p><strong>Price:</strong> $${property.fields?.Price ? property.fields.Price.toLocaleString() : 'N/A'}</p>
                <p><strong>Status:</strong> ${property.fields?.Status || 'N/A'}</p>
            `;

            // Buttons
            const buttonsContainer = document.createElement('div');
            buttonsContainer.style.display = 'flex';
            buttonsContainer.style.flexDirection = 'column';
            buttonsContainer.style.gap = '10px';
            buttonsContainer.style.marginTop = '15px';

            const bookViewingButton = document.createElement('button');
            bookViewingButton.textContent = '📅 Book a Viewing';
            bookViewingButton.style.backgroundColor = 'green';
            bookViewingButton.style.color = 'white';
            bookViewingButton.addEventListener('click', () => startBookingProcess(property));

            const contactButton = document.createElement('button');
            contactButton.textContent = '📞 Contact';
            contactButton.style.backgroundColor = 'red';
            contactButton.style.color = 'white';

            const backButton = document.createElement('button');
            backButton.textContent = '← Back to Listings';
            backButton.style.backgroundColor = 'blue';
            backButton.style.color = 'white';
            backButton.addEventListener('click', renderGrid);

            buttonsContainer.appendChild(bookViewingButton);
            buttonsContainer.appendChild(contactButton);
            buttonsContainer.appendChild(backButton);

            container.appendChild(mainImgElement);
            container.appendChild(thumbnailContainer);
            container.appendChild(details);
            container.appendChild(buttonsContainer);
        }

        function startBookingProcess(property) {
            container.innerHTML = '';

            const breadcrumb = document.createElement('div');
            breadcrumb.innerHTML = `<p>Step 1: Select a Date</p>`;
            breadcrumb.style.fontWeight = 'bold';

            const dateInput = document.createElement('input');
            dateInput.type = 'date';
            dateInput.style.width = '100%';

            const nextButton = document.createElement('button');
            nextButton.textContent = 'Next';
            nextButton.style.backgroundColor = 'blue';
            nextButton.style.color = 'white';
            nextButton.addEventListener('click', () => selectTimeSlot(property, dateInput.value));

            container.appendChild(breadcrumb);
            container.appendChild(dateInput);
            container.appendChild(nextButton);
        }

        function selectTimeSlot(property, date) {
            container.innerHTML = '';

            const breadcrumb = document.createElement('div');
            breadcrumb.innerHTML = `<p>Step 2: Select a Time</p>`;
            breadcrumb.style.fontWeight = 'bold';

            const timeSelect = document.createElement('select');
            for (let i = 9; i <= 17; i++) {
                let option = document.createElement('option');
                option.value = `${i}:00`;
                option.textContent = `${i}:00`;
                timeSelect.appendChild(option);
            }

            const nextButton = document.createElement('button');
            nextButton.textContent = 'Next';
            nextButton.style.backgroundColor = 'blue';
            nextButton.style.color = 'white';
            nextButton.addEventListener('click', () => showContactForm(property, date, timeSelect.value));

            container.appendChild(breadcrumb);
            container.appendChild(timeSelect);
            container.appendChild(nextButton);
        }

        renderGrid();
        element.appendChild(container);
    },
};