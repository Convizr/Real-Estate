export const RealEstateExtension = {
    name: 'RealEstate',
    type: 'response',
    match: ({ trace }) =>
      trace.type === 'ext_real_estate' || (trace.payload && trace.payload.name === 'ext_real_estate'),
    render: ({ trace, element }) => {
      console.log('Rendering RealEstateExtension');
  
      // Parse payload dynamically
      let payloadObj;
      if (typeof trace.payload === 'string') {
          try {
              payloadObj = JSON.parse(trace.payload);
          } catch (e) {
              console.error('Error parsing payload:', e);
              payloadObj = {};
          }
      } else {
          payloadObj = trace.payload || {};
      }
  
      console.log('Parsed Payload:', payloadObj);
  
      // Extract "properties" and ensure it's a valid array
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
  
      // Create container
      const container = document.createElement('div');
      container.style.width = '100%';
      container.style.display = 'flex';
      container.style.flexWrap = 'wrap';
      container.style.gap = '10px';
  
      function renderGrid() {
          container.innerHTML = '';
  
          properties.forEach((property, index) => {
              const propertyCard = document.createElement('div');
              propertyCard.style.width = '30%';
              propertyCard.style.cursor = 'pointer';
              propertyCard.style.transition = 'transform 0.3s ease';
              propertyCard.style.overflow = 'hidden';
  
              const img = document.createElement('img');
              img.src = property.fields?.Image?.[0]?.url || '';
              img.style.width = '100%';
              img.style.borderRadius = '5px';
  
              const title = document.createElement('p');
              title.textContent = property.fields?.['Property Name'] || 'Unknown Property';
              title.style.textAlign = 'center';
              title.style.margin = '5px 0';
              title.style.fontWeight = 'bold';
  
              propertyCard.appendChild(img);
              propertyCard.appendChild(title);
              propertyCard.addEventListener('click', () => showPropertyDetail(property));
              container.appendChild(propertyCard);
          });
      }
  
      function showPropertyDetail(property) {
          container.innerHTML = '';
  
          const leftColumn = document.createElement('div');
          leftColumn.style.width = '50%';
          leftColumn.style.padding = '10px';
  
          const mainImage = document.createElement('img');
          mainImage.src = property.fields?.Image?.[0]?.url || '';
          mainImage.style.width = '100%';
          mainImage.style.borderRadius = '10px';
  
          leftColumn.appendChild(mainImage);
  
          const rightColumn = document.createElement('div');
          rightColumn.style.width = '50%';
          rightColumn.style.padding = '10px';
          rightColumn.style.display = 'flex';
          rightColumn.style.flexDirection = 'column';
          rightColumn.style.gap = '10px';
  
          property.fields?.Image?.slice(1).forEach(imgData => {
              const smallImg = document.createElement('img');
              smallImg.src = imgData.url;
              smallImg.style.width = '100px';
              smallImg.style.borderRadius = '5px';
              smallImg.style.cursor = 'pointer';
              smallImg.addEventListener('click', () => (mainImage.src = imgData.url));
  
              rightColumn.appendChild(smallImg);
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
          rightColumn.appendChild(details);
  
          const backButton = document.createElement('button');
          backButton.textContent = '← Back to Listings';
          backButton.style.marginTop = '10px';
          backButton.style.padding = '8px';
          backButton.style.border = 'none';
          backButton.style.backgroundColor = '#007bff';
          backButton.style.color = 'white';
          backButton.style.cursor = 'pointer';
          backButton.addEventListener('click', renderGrid);
  
          rightColumn.appendChild(backButton);
  
          container.appendChild(leftColumn);
          container.appendChild(rightColumn);
      }
  
      renderGrid();
      element.appendChild(container);
    },
  };