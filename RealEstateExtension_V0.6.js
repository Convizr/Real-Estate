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
  
      // Extract "properties" and ensure it's valid JSON
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
  
      // Inject CSS for styling
      const style = document.createElement("style");
      style.innerHTML = `
        .property-container {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            justify-content: center;
            width: 100%;
        }
        .property-card {
            width: 30%;
            cursor: pointer;
            transition: transform 0.3s ease;
            overflow: hidden;
            border-radius: 10px;
            box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);
            background: white;
            text-align: center;
            padding: 10px;
        }
        .property-card:hover {
            transform: scale(1.05);
        }
        .property-card img {
            width: 100%;
            border-radius: 5px;
        }
        .image-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            justify-content: flex-start;
        }
        .image-grid img {
            width: 100px;
            border-radius: 5px;
            cursor: pointer;
        }
        .property-details {
            text-align: left;
        }
        .back-button {
            margin-top: 10px;
            padding: 8px;
            border: none;
            background-color: #007bff;
            color: white;
            cursor: pointer;
            width: 100%;
        }
      `;
      document.head.appendChild(style);
  
      // Create container
      const container = document.createElement('div');
      container.classList.add('property-container');
  
      function renderGrid() {
          container.innerHTML = '';
  
          properties.forEach((property, index) => {
              const propertyCard = document.createElement('div');
              propertyCard.classList.add('property-card');
  
              const img = document.createElement('img');
              img.src = property.fields?.Image?.[0]?.url || '';
  
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
  
          const imageGrid = document.createElement('div');
          imageGrid.classList.add('image-grid');
  
          property.fields?.Image?.slice(1).forEach(imgData => {
              const smallImg = document.createElement('img');
              smallImg.src = imgData.url;
              smallImg.addEventListener('click', () => (mainImage.src = imgData.url));
  
              imageGrid.appendChild(smallImg);
          });
  
          const details = document.createElement('div');
          details.classList.add('property-details');
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
  
          rightColumn.appendChild(imageGrid);
          rightColumn.appendChild(details);
          rightColumn.appendChild(backButton);
  
          container.appendChild(leftColumn);
          container.appendChild(rightColumn);
      }
  
      renderGrid();
      element.appendChild(container);
    },
};