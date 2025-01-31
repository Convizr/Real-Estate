export const RealEstateExtension = {
  name: 'RealEstate',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_real_estate' || trace.payload.name === 'ext_real_estate',
  render: ({ trace, element }) => {
    console.log('RealEstate extension loaded');
    
    // Parse payload
    let properties = [];
    if (typeof trace.payload === 'string') {
      try {
        properties = JSON.parse(trace.payload);
      } catch (e) {
        console.error('Error parsing payload:', e);
      }
    } else {
      properties = trace.payload || [];
    }

    console.log('Loaded properties:', properties);

    // Create container for the extension
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = '10px';

    // Function to render property grid
    function renderGrid() {
      container.innerHTML = '';

      properties.forEach((property, index) => {
        const propertyCard = document.createElement('div');
        propertyCard.style.width = '30%';
        propertyCard.style.cursor = 'pointer';
        propertyCard.style.transition = 'transform 0.3s ease';
        propertyCard.style.overflow = 'hidden';

        const img = document.createElement('img');
        img.src = property.fields.Image[0]?.url || '';
        img.style.width = '100%';
        img.style.borderRadius = '5px';

        const title = document.createElement('p');
        title.textContent = property.fields['Property Name'];
        title.style.textAlign = 'center';
        title.style.margin = '5px 0';
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

      const leftColumn = document.createElement('div');
      leftColumn.style.width = '50%';
      leftColumn.style.padding = '10px';

      const mainImage = document.createElement('img');
      mainImage.src = property.fields.Image[0]?.url || '';
      mainImage.style.width = '100%';
      mainImage.style.borderRadius = '10px';

      leftColumn.appendChild(mainImage);

      const rightColumn = document.createElement('div');
      rightColumn.style.width = '50%';
      rightColumn.style.padding = '10px';
      rightColumn.style.display = 'flex';
      rightColumn.style.flexDirection = 'column';
      rightColumn.style.gap = '10px';

      property.fields.Image.slice(1).forEach(imgData => {
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
        <p><strong>City:</strong> ${property.fields.City}</p>
        <p><strong>Type:</strong> ${property.fields['Property Type']}</p>
        <p><strong>Bedrooms:</strong> ${property.fields.Bedrooms}</p>
        <p><strong>Year:</strong> ${property.fields.Year}</p>
        <p><strong>Price:</strong> $${property.fields.Price.toLocaleString()}</p>
        <p><strong>Status:</strong> ${property.fields.Status}</p>
        <p><strong>Living Area:</strong> ${property.fields['Living Area']} m²</p>
        <p><strong>Plot:</strong> ${property.fields.Plot ? property.fields.Plot + ' m²' : 'N/A'}</p>
        <p><strong>Energy Label:</strong> ${property.fields['Energy Label']}</p>
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