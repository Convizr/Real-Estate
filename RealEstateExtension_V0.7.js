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

        // Inject CSS using a <style> tag inside the widget
        const style = document.createElement("style");
        style.textContent = `
            .property-container {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                gap: 15px;
                width: 100%;
                padding: 10px;
                box-sizing: border-box;
            }
            .property-card {
                background: white;
                border-radius: 8px;
                box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);
                text-align: center;
                padding: 10px;
                cursor: pointer;
                transition: transform 0.2s ease-in-out;
            }
            .property-card:hover {
                transform: scale(1.05);
            }
            .property-card img {
                width: 100%;
                height: auto;
                border-radius: 5px;
                object-fit: cover;
            }
            .property-detail {
                display: flex;
                flex-direction: column;
                align-items: center;
                width: 100%;
                padding: 10px;
                box-sizing: border-box;
            }
            .property-detail img {
                width: 100%;
                max-width: 300px;
                border-radius: 8px;
                margin-bottom: 10px;
            }
            .thumbnail-container {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                justify-content: center;
            }
            .thumbnail-container img {
                width: 60px;
                height: 60px;
                border-radius: 5px;
                cursor: pointer;
                object-fit: cover;
                transition: transform 0.2s ease;
            }
            .thumbnail-container img:hover {
                transform: scale(1.1);
            }
            .back-button {
                margin-top: 10px;
                padding: 8px;
                border: none;
                background-color: #007bff;
                color: white;
                cursor: pointer;
                width: 100%;
                border-radius: 5px;
            }
        `;
        document.head.appendChild(style);

        // Create container for grid view
        const container = document.createElement('div');
        container.classList.add('property-container');

        function renderGrid() {
            container.innerHTML = '';

            properties.forEach((property) => {
                const propertyCard = document.createElement('div');
                propertyCard.classList.add('property-card');

                const img = document.createElement('img');
                img.src = property.fields?.Image?.[0]?.url || '';
                img.alt = property.fields?.['Property Name'] || 'Property Image';

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

            const detailContainer = document.createElement('div');
            detailContainer.classList.add('property-detail');

            const mainImage = document.createElement('img');
            mainImage.src = property.fields?.Image?.[0]?.url || '';
            mainImage.alt = property.fields?.['Property Name'] || 'Property Image';

            const thumbnailContainer = document.createElement('div');
            thumbnailContainer.classList.add('thumbnail-container');

            property.fields?.Image?.slice(1).forEach(imgData => {
                const smallImg = document.createElement('img');
                smallImg.src = imgData.url;
                smallImg.alt = 'Thumbnail';
                smallImg.addEventListener('click', () => (mainImage.src = imgData.url));

                thumbnailContainer.appendChild(smallImg);
            });

            const details = document.createElement('div');
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
            backButton.classList.add('back-button');
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