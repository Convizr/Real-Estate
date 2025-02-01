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

        // Set container styling
        const container = document.createElement('div');
        container.style.width = '600px';
        container.style.margin = '0 auto';
        container.style.display = 'grid';
        container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(250px, 1fr))';
        container.style.gap = '15px';
        container.style.justifyContent = 'center';
        container.style.alignItems = 'center';

        // Remove the background from the message container
        let parentMessage = element.closest('.vfrc-message.vfrc-message--extension-RealEstate');
        if (parentMessage) {
            parentMessage.style.background = 'transparent';
            parentMessage.style.boxShadow = 'none';
        }

        function renderGrid() {
            container.innerHTML = '';

            properties.forEach((property) => {
                const propertyCard = document.createElement('div');
                propertyCard.style.width = '250px';
                propertyCard.style.borderRadius = '10px';
                propertyCard.style.boxShadow = '0px 2px 10px rgba(0, 0, 0, 0.1)';
                propertyCard.style.padding = '15px';
                propertyCard.style.textAlign = 'center';
                propertyCard.style.background = 'white';
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
                title.style.margin = '10px 0 5px';
                title.style.fontWeight = 'bold';

                propertyCard.appendChild(img);
                propertyCard.appendChild(title);
                propertyCard.addEventListener('click', () => showPropertyDetail(property));
                container.appendChild(propertyCard);
            });
        }

        function showPropertyDetail(property) {
            container.innerHTML = '';

            // Main image
            const mainImage = document.createElement('img');
            mainImage.src = property.fields?.Image?.[0]?.url || '';
            mainImage.style.width = '100%';
            mainImage.style.borderRadius = '10px';
            mainImage.style.marginBottom = '10px';

            // Image thumbnails
            const thumbnailContainer = document.createElement('div');
            thumbnailContainer.style.display = 'flex';
            thumbnailContainer.style.justifyContent = 'center';
            thumbnailContainer.style.gap = '10px';

            property.fields?.Image?.slice(1).forEach(imgData => {
                const smallImg = document.createElement('img');
                smallImg.src = imgData.url;
                smallImg.style.width = '80px';
                smallImg.style.borderRadius = '5px';
                smallImg.style.cursor = 'pointer';
                smallImg.addEventListener('click', () => (mainImage.src = imgData.url));

                thumbnailContainer.appendChild(smallImg);
            });

            // Property details
            const details = document.createElement('div');
            details.style.textAlign = 'center';
            details.style.fontSize = '16px';
            details.style.marginTop = '15px';
            details.innerHTML = `
                <p><strong>City:</strong> ${property.fields?.City || 'N/A'}</p>
                <p><strong>Type:</strong> ${property.fields?.['Property Type'] || 'N/A'}</p>
                <p><strong>Bedrooms:</strong> ${property.fields?.Bedrooms || 'N/A'}</p>
                <p><strong>Year:</strong> ${property.fields?.Year || 'N/A'}</p>
                <p><strong>Price:</strong> $${property.fields?.Price ? property.fields.Price.toLocaleString() : 'N/A'}</p>
                <p><strong>Status:</strong> ${property.fields?.Status || 'N/A'}</p>
                <p><strong>Living Area:</strong> ${property.fields?.['Living Area'] || 'N/A'} m²</p>
                <p><strong>Plot:</strong> ${property.fields?.Plot ? property.fields.Plot + ' m²' : 'N/A'}</p>
                <p><strong>Energy Label:</strong> ${property.fields?.['Energy Label'] || 'N/A'}</p>
            `;

            // Back button
            const backButton = document.createElement('button');
            backButton.textContent = '← Back to Listings';
            backButton.style.marginTop = '10px';
            backButton.style.padding = '10px 15px';
            backButton.style.border = 'none';
            backButton.style.backgroundColor = '#007bff';
            backButton.style.color = 'white';
            backButton.style.borderRadius = '5px';
            backButton.style.cursor = 'pointer';
            backButton.addEventListener('click', renderGrid);

            container.appendChild(mainImage);
            container.appendChild(thumbnailContainer);
            container.appendChild(details);
            container.appendChild(backButton);
        }

        renderGrid();
        element.appendChild(container);
    },
};
