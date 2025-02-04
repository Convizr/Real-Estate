export const RealEstateExtension = {
    name: 'RealEstate',
    type: 'response',
    match: ({ trace }) =>
        trace.type === 'ext_real_estate' || (trace.payload && trace.payload.name === 'ext_real_estate'),
    render: ({ trace, element }) => {
        console.log('Rendering RealEstateExtension');
        console.log('Raw trace.payload:', trace.payload);

        let payloadObj;
        
        // First, parse the trace.payload if it's a string
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

        // Set container styling (GRID)
        const container = document.createElement('div');
        container.style.display = 'grid';
        container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(250px, 1fr))';
        container.style.gap = '15px';
        container.style.justifyContent = 'center';
        container.style.alignItems = 'center';

        // Function to render the property grid
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

        // Function to show property details
        function showPropertyDetail(property) {
            container.innerHTML = '';

            // Image rotation logic
            let images = property.fields?.Image || [];
            let mainImage = images[0];

            const mainImageEl = document.createElement('img');
            mainImageEl.src = mainImage.url;
            mainImageEl.style.width = '100%';
            mainImageEl.style.borderRadius = '10px';
            mainImageEl.style.marginBottom = '10px';

            const thumbnailContainer = document.createElement('div');
            thumbnailContainer.style.display = 'grid';
            thumbnailContainer.style.gridTemplateColumns = `repeat(auto-fit, minmax(50px, 1fr))`;
            thumbnailContainer.style.gap = '5px';
            thumbnailContainer.style.justifyContent = 'center';

            images.slice(1).forEach((imgData, index) => {
                const thumb = document.createElement('img');
                thumb.src = imgData.url;
                thumb.style.width = '60px';
                thumb.style.cursor = 'pointer';
                thumb.style.borderRadius = '5px';

                thumb.addEventListener('click', () => {
                    images = [...images.slice(index + 1), ...images.slice(0, index + 1)];
                    mainImageEl.src = images[0].url;
                    updateThumbnails();
                });

                thumbnailContainer.appendChild(thumb);
            });

            function updateThumbnails() {
                thumbnailContainer.innerHTML = '';
                images.slice(1).forEach((imgData, index) => {
                    const thumb = document.createElement('img');
                    thumb.src = imgData.url;
                    thumb.style.width = '60px';
                    thumb.style.cursor = 'pointer';
                    thumb.style.borderRadius = '5px';
                    thumb.addEventListener('click', () => {
                        images = [...images.slice(index + 1), ...images.slice(0, index + 1)];
                        mainImageEl.src = images[0].url;
                        updateThumbnails();
                    });
                    thumbnailContainer.appendChild(thumb);
                });
            }

            // Property Details
            const details = document.createElement('div');
            details.style.textAlign = 'left';
            details.innerHTML = `
                <p><strong>City:</strong> ${property.fields?.City || 'N/A'}</p>
                <p><strong>Type:</strong> ${property.fields?.['Property Type'] || 'N/A'}</p>
                <p><strong>Bedrooms:</strong> ${property.fields?.Bedrooms || 'N/A'}</p>
                <p><strong>Year:</strong> ${property.fields?.Year || 'N/A'}</p>
                <p><strong>Price:</strong> $${property.fields?.Price?.toLocaleString() || 'N/A'}</p>
            `;

            // Buttons
            const buttonContainer = document.createElement('div');
            buttonContainer.style.display = 'flex';
            buttonContainer.style.flexDirection = 'column';
            buttonContainer.style.gap = '10px';

            const bookViewing = document.createElement('button');
            bookViewing.textContent = '📅 Book a Viewing';
            bookViewing.style.backgroundColor = 'green';
            bookViewing.style.color = 'white';
            bookViewing.style.padding = '10px';
            bookViewing.style.borderRadius = '5px';
            bookViewing.style.cursor = 'pointer';
            bookViewing.onclick = () => showBookingPage(property);

            const contact = document.createElement('button');
            contact.textContent = '📞 Contact';
            contact.style.backgroundColor = 'red';
            contact.style.color = 'white';
            contact.style.padding = '10px';
            contact.style.borderRadius = '5px';
            contact.style.cursor = 'pointer';

            const backButton = document.createElement('button');
            backButton.textContent = '← Back to Listings';
            backButton.style.backgroundColor = 'blue';
            backButton.style.color = 'white';
            backButton.style.padding = '10px';
            backButton.style.borderRadius = '5px';
            backButton.style.cursor = 'pointer';
            backButton.onclick = renderGrid;

            buttonContainer.appendChild(bookViewing);
            buttonContainer.appendChild(contact);
            buttonContainer.appendChild(backButton);

            container.appendChild(mainImageEl);
            container.appendChild(thumbnailContainer);
            container.appendChild(details);
            container.appendChild(buttonContainer);
        }

        function showBookingPage(property) {
            container.innerHTML = `<h2>Booking Step 1: Select a Date</h2>`;
        }

        renderGrid();
        element.appendChild(container);
    },
};