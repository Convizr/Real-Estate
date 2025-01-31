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

        // Inject proper CSS into the document head
        if (!document.getElementById('real-estate-styles')) {
            const style = document.createElement('style');
            style.id = 'real-estate-styles';
            style.innerHTML = `
                /* Remove default chat bubble background */
                .vfrc-message.vfrc-message--extension-RealEstate {
                    background: none !important;
                    padding: 0 !important;
                }

                /* Main container */
                .real-estate-container {
                    display: flex;
                    justify-content: center;
                    align-items: flex-start;
                    width: 100%;
                    gap: 20px;
                    flex-wrap: wrap;
                }

                /* Property grid */
                .property-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                    gap: 15px;
                    width: 600px;
                    max-width: 100%;
                }

                /* Property card */
                .property-card {
                    background: white;
                    padding: 10px;
                    border-radius: 10px;
                    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
                    cursor: pointer;
                    transition: transform 0.2s;
                    text-align: center;
                    max-width: 180px;
                }
                .property-card:hover {
                    transform: scale(1.05);
                }
                .property-card img {
                    width: 100%;
                    border-radius: 5px;
                }

                /* Property details */
                .property-details {
                    width: 400px;
                    padding: 10px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    background: white;
                    border-radius: 10px;
                    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
                    padding: 15px;
                }

                /* Main image */
                .property-details img {
                    width: 100%;
                    border-radius: 10px;
                }

                /* Thumbnail container */
                .property-thumbnails {
                    display: flex;
                    gap: 5px;
                    margin-top: 10px;
                }

                /* Small images for thumbnails */
                .property-thumbnails img {
                    width: 60px;
                    border-radius: 5px;
                    cursor: pointer;
                    transition: opacity 0.2s;
                }

                .property-thumbnails img:hover {
                    opacity: 0.7;
                }

                /* Back button */
                .back-button {
                    margin-top: 10px;
                    padding: 8px;
                    border: none;
                    background-color: #007bff;
                    color: white;
                    cursor: pointer;
                    border-radius: 5px;
                    width: 100%;
                    text-align: center;
                }

                .back-button:hover {
                    background-color: #0056b3;
                }
            `;
            document.head.appendChild(style);
        }

        // Create main container
        const container = document.createElement('div');
        container.className = 'real-estate-container';

        // Create property grid
        const grid = document.createElement('div');
        grid.className = 'property-grid';

        // Property details container
        const detailsContainer = document.createElement('div');
        detailsContainer.className = 'property-details';
        detailsContainer.style.display = 'none';

        function showPropertyDetail(property) {
            detailsContainer.innerHTML = '';

            // Main image
            const mainImage = document.createElement('img');
            mainImage.src = property.fields?.Image?.[0]?.url || '';
            mainImage.alt = 'Property Image';
            detailsContainer.appendChild(mainImage);

            // Thumbnail images
            const thumbnailContainer = document.createElement('div');
            thumbnailContainer.className = 'property-thumbnails';

            property.fields?.Image?.slice(1).forEach(imgData => {
                const thumbImg = document.createElement('img');
                thumbImg.src = imgData.url;
                thumbImg.addEventListener('click', () => (mainImage.src = imgData.url));
                thumbnailContainer.appendChild(thumbImg);
            });

            detailsContainer.appendChild(thumbnailContainer);

            // Property details
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
            detailsContainer.appendChild(details);

            // Back button
            const backButton = document.createElement('button');
            backButton.className = 'back-button';
            backButton.textContent = '← Back to Listings';
            backButton.addEventListener('click', renderGrid);

            detailsContainer.appendChild(backButton);

            detailsContainer.style.display = 'flex';
        }

        function renderGrid() {
            grid.innerHTML = '';
            detailsContainer.style.display = 'none';

            properties.forEach(property => {
                const card = document.createElement('div');
                card.className = 'property-card';

                const img = document.createElement('img');
                img.src = property.fields?.Image?.[0]?.url || '';
                img.alt = 'Property Thumbnail';
                card.appendChild(img);

                const title = document.createElement('p');
                title.textContent = property.fields?.['Property Name'] || 'Unknown Property';
                title.style.fontWeight = 'bold';
                card.appendChild(title);

                card.addEventListener('click', () => showPropertyDetail(property));
                grid.appendChild(card);
            });
        }

        renderGrid();
        container.appendChild(grid);
        container.appendChild(detailsContainer);
        element.appendChild(container);
    }
};