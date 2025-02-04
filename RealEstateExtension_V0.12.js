export const RealEstateExtension = {
    name: 'RealEstate',
    type: 'response',
    match: ({ trace }) =>
        trace.type === 'ext_real_estate' || (trace.payload && trace.payload.name === 'ext_real_estate'),
    render: ({ trace, element }) => {
        console.log('Rendering RealEstateExtension');
        console.log('Raw trace.payload:', trace.payload);

        let payloadObj;
        
        // Parse payload
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
        container.style.width = '100%';
        container.style.display = 'grid';
        container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(250px, 1fr))';
        container.style.gap = '15px';

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
                propertyCard.style.padding = '10px';
                propertyCard.style.cursor = 'pointer';
                propertyCard.style.transition = 'transform 0.2s ease';
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
                title.style.textAlign = 'left';

                propertyCard.appendChild(img);
                propertyCard.appendChild(title);
                propertyCard.addEventListener('click', () => showPropertyDetail(property));
                container.appendChild(propertyCard);
            });
        }

        function showPropertyDetail(property) {
            container.innerHTML = '';

            // Create main image
            let mainImage = document.createElement('img');
            mainImage.src = property.fields?.Image?.[0]?.url || '';
            mainImage.style.width = '100%';
            mainImage.style.borderRadius = '10px';
            mainImage.style.marginBottom = '10px';

            // Thumbnail container
            const thumbnailContainer = document.createElement('div');
            thumbnailContainer.style.display = 'grid';
            thumbnailContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(50px, 1fr))';
            thumbnailContainer.style.gap = '8px';
            thumbnailContainer.style.justifyContent = 'center';

            const imageList = [...property.fields?.Image];

            function updateMainImage(newImageUrl) {
                // Remove the selected image from the thumbnails
                const newThumbnails = imageList.filter(img => img.url !== newImageUrl);
                imageList.length = 0;
                imageList.push({ url: newImageUrl }, ...newThumbnails);

                // Update UI
                mainImage.src = newImageUrl;
                renderThumbnails();
            }

            function renderThumbnails() {
                thumbnailContainer.innerHTML = '';
                imageList.slice(1).forEach(imgData => {
                    const smallImg = document.createElement('img');
                    smallImg.src = imgData.url;
                    smallImg.style.width = '60px';
                    smallImg.style.borderRadius = '5px';
                    smallImg.style.cursor = 'pointer';
                    smallImg.addEventListener('click', () => updateMainImage(imgData.url));

                    thumbnailContainer.appendChild(smallImg);
                });
            }

            renderThumbnails();

            // Property details
            const details = document.createElement('div');
            details.style.textAlign = 'left';
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

            // Buttons
            const buttonContainer = document.createElement('div');
            buttonContainer.style.marginTop = '15px';
            buttonContainer.style.display = 'flex';
            buttonContainer.style.gap = '10px';

            const backButton = document.createElement('button');
            backButton.textContent = '← Back to Listings';
            backButton.style.padding = '10px 15px';
            backButton.style.border = 'none';
            backButton.style.backgroundColor = '#007bff';
            backButton.style.color = 'white';
            backButton.style.borderRadius = '5px';
            backButton.style.cursor = 'pointer';
            backButton.addEventListener('click', renderGrid);

            const bookViewingButton = document.createElement('button');
            bookViewingButton.textContent = '📅 Book a Viewing';
            bookViewingButton.style.padding = '10px 15px';
            bookViewingButton.style.border = 'none';
            bookViewingButton.style.backgroundColor = '#28a745';
            bookViewingButton.style.color = 'white';
            bookViewingButton.style.borderRadius = '5px';
            bookViewingButton.style.cursor = 'pointer';
            bookViewingButton.addEventListener('click', () => {
                alert('Booking flow will open (not yet implemented).');
            });

            const contactButton = document.createElement('button');
            contactButton.textContent = '📞 Contact';
            contactButton.style.padding = '10px 15px';
            contactButton.style.border = 'none';
            contactButton.style.backgroundColor = '#dc3545';
            contactButton.style.color = 'white';
            contactButton.style.borderRadius = '5px';
            contactButton.style.cursor = 'pointer';

            buttonContainer.appendChild(bookViewingButton);
            buttonContainer.appendChild(contactButton);
            buttonContainer.appendChild(backButton);

            container.appendChild(mainImage);
            container.appendChild(thumbnailContainer);
            container.appendChild(details);
            container.appendChild(buttonContainer);
        }

        renderGrid();
        element.appendChild(container);
    },
};