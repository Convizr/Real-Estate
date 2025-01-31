export const RealEstateExtension = {
    name: 'RealEstate',
    type: 'response',
    match: ({ trace }) =>
        trace.type === 'ext_real_estate' || (trace.payload && trace.payload.name === 'ext_real_estate'),
    render: ({ trace, element }) => {
        console.log('Rendering RealEstateExtension');
        console.log('Raw trace.payload:', trace.payload);

        let payloadObj = typeof trace.payload === 'string' ? JSON.parse(trace.payload) : trace.payload || {};
        let properties = typeof payloadObj.properties === 'string' ? JSON.parse(payloadObj.properties) : payloadObj.properties;

        if (!Array.isArray(properties) || properties.length === 0) {
            element.innerHTML = `<p style="text-align:center; font-size:16px;">No properties available.</p>`;
            return;
        }

        // Create container for the grid
        const container = document.createElement('div');
        container.style.display = 'grid';
        container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(150px, 1fr))';
        container.style.gap = '15px';
        container.style.width = '100%';
        container.style.padding = '10px';
        container.style.boxSizing = 'border-box';

        function renderGrid() {
            container.innerHTML = '';

            properties.forEach((property) => {
                const propertyCard = document.createElement('div');
                propertyCard.style.background = 'white';
                propertyCard.style.borderRadius = '8px';
                propertyCard.style.boxShadow = '0px 2px 10px rgba(0, 0, 0, 0.1)';
                propertyCard.style.textAlign = 'center';
                propertyCard.style.padding = '10px';
                propertyCard.style.cursor = 'pointer';
                propertyCard.style.transition = 'transform 0.2s ease-in-out';
                propertyCard.style.overflow = 'hidden';

                propertyCard.addEventListener('mouseover', () => propertyCard.style.transform = 'scale(1.05)');
                propertyCard.addEventListener('mouseout', () => propertyCard.style.transform = 'scale(1)');

                const img = document.createElement('img');
                img.src = property.fields?.Image?.[0]?.url || '';
                img.alt = property.fields?.['Property Name'] || 'Property Image';
                img.style.width = '100%';
                img.style.height = '120px';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '5px';

                const title = document.createElement('p');
                title.textContent = property.fields?.['Property Name'] || 'Unknown Property';
                title.style.fontWeight = 'bold';
                title.style.marginTop = '8px';

                propertyCard.appendChild(img);
                propertyCard.appendChild(title);
                propertyCard.addEventListener('click', () => showPropertyDetail(property));
                container.appendChild(propertyCard);
            });
        }

        function showPropertyDetail(property) {
            container.innerHTML = '';

            const detailContainer = document.createElement('div');
            detailContainer.style.display = 'flex';
            detailContainer.style.flexDirection = 'column';
            detailContainer.style.alignItems = 'center';
            detailContainer.style.width = '100%';
            detailContainer.style.padding = '10px';
            detailContainer.style.boxSizing = 'border-box';

            const mainImage = document.createElement('img');
            mainImage.src = property.fields?.Image?.[0]?.url || '';
            mainImage.alt = property.fields?.['Property Name'] || 'Property Image';
            mainImage.style.width = '100%';
            mainImage.style.maxWidth = '300px';
            mainImage.style.borderRadius = '8px';
            mainImage.style.marginBottom = '10px';

            const thumbnailContainer = document.createElement('div');
            thumbnailContainer.style.display = 'flex';
            thumbnailContainer.style.flexWrap = 'wrap';
            thumbnailContainer.style.gap = '8px';
            thumbnailContainer.style.justifyContent = 'center';

            property.fields?.Image?.slice(1).forEach(imgData => {
                const smallImg = document.createElement('img');
                smallImg.src = imgData.url;
                smallImg.alt = 'Thumbnail';
                smallImg.style.width = '60px';
                smallImg.style.height = '60px';
                smallImg.style.borderRadius = '5px';
                smallImg.style.cursor = 'pointer';
                smallImg.style.objectFit = 'cover';

                smallImg.addEventListener('click', () => (mainImage.src = imgData.url));
                thumbnailContainer.appendChild(smallImg);
            });

            const details = document.createElement('div');
            details.style.textAlign = 'center';
            details.style.marginTop = '10px';
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

            const backButton = document.createElement('button');
            backButton.textContent = '← Back to Listings';
            backButton.style.marginTop = '10px';
            backButton.style.padding = '8px';
            backButton.style.border = 'none';
            backButton.style.backgroundColor = '#007bff';
            backButton.style.color = 'white';
            backButton.style.cursor = 'pointer';
            backButton.style.width = '100%';
            backButton.style.borderRadius = '5px';

            backButton.addEventListener('click', renderGrid);

            detailContainer.appendChild(mainImage);
            detailContainer.appendChild(thumbnailContainer);
            detailContainer.appendChild(details);
            detailContainer.appendChild(backButton);

            container.appendChild(detailContainer);
        }

        renderGrid();
        element.appendChild(container);
    }
};