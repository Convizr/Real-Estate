export const BrantjesExtension = {
  name: 'Brantjes',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_brantjes_recommendation' ||
    (trace.payload && trace.payload.name === 'ext_brantjes_recommendation'),
  render: ({ trace, element }) => {
    console.log('Rendering BrantjesExtension');

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
    // If properties is an object with a 'resultaten' array, use that
    if (properties && Array.isArray(properties.resultaten)) {
      properties = properties.resultaten;
    }
    if (!Array.isArray(properties) || properties.length === 0) {
      element.innerHTML = `<p>No properties available.</p>`;
      return;
    }

    // Correctly declare currentPropertyIndex at the top of the render function
    let currentPropertyIndex = 0; // Initialize here

    // Create stylesheet
    const style = document.createElement('style');
    style.innerHTML = `
      .brantjes-carousel-container {
        position: relative;
        width: 650px; /* Max width */
        height: 420px; /* Fixed height for carousel area */
        margin: auto;
        overflow: hidden;
        padding: 0;
        background: transparent;
        display: flex; /* Use flexbox to center content */
        align-items: center; /* Center vertically */
        justify-content: center; /* Center horizontally */
      }
      .brantjes-property-card {
        flex: 0 0 auto; /* Allow content to dictate size, but prevent shrinking */
        width: 201px;
        height: 335px;
        box-sizing: border-box;
        transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s, width 0.4s, height 0.4s, margin 0.4s;
        transform: scale(0.92);
        opacity: 0.7;
        position: relative;
        z-index: 1;
        border-radius: 8px;
        background: #fff;
        border: 5px solid #fff;
        box-shadow: 0px 0px 4px 0px rgba(0,0,0,0.15);
        overflow: visible;
        display: flex;
        align-items: flex-end;
      }
      .brantjes-property-card.active { /* This class is deprecated in the new carousel logic */
        width: 219px;
        height: 365px;
        transform: scale(1);
        opacity: 1;
        z-index: 10;
      }
      .brantjes-property-card-inner {
        position: relative;
        overflow: hidden;
        border-radius: 8px;
        width: 100%;
        height: 100%;
        color: white;
        background: #fff;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
      }
      .brantjes-property-card-inner img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .brantjes-card-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 15px;
        padding-bottom: 27px;
        background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%);
      }
      .brantjes-card-info p {
        margin: 0 0 5px;
        font-size: 16px;
      }
      .brantjes-card-info p:first-child {
        font-weight: bold;
        font-size: 18px;
      }
      .brantjes-viewing-button {
        position: absolute;
        bottom: 7px;
        left: 15px;
        transform: none;
        background: transparent;
        color: white;
        border: none;
        width: 112px;
        height: 20px;
        border-radius: 5px;
        cursor: pointer;
        overflow: hidden;
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: 5;
        pointer-events: none;
      }
      .brantjes-viewing-button .cta-box {
        position: absolute;
        top: 0;
        left: -10px;
        width: calc(100% + 20px);
        height: 100%;
        background-color: #1E7FCB;
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 0.3s ease;
      }
      .brantjes-viewing-button .cta-text {
        position: relative;
        z-index: 2;
        display: inline-block;
        transform: translateX(-5px);
        opacity: 0.7;
        transition: transform 0.3s ease, opacity 0.3s ease;
        font-size: 12px;
        font-weight: 500;
        text-align: center;
        width: 100%;
      }
      .brantjes-property-card.act:hover .brantjes-viewing-button {
        opacity: 1;
        pointer-events: auto;
      }
      .brantjes-property-card.act:hover .brantjes-viewing-button .cta-box {
        transform: scaleX(1);
      }
      .brantjes-property-card.act:hover .brantjes-viewing-button .cta-text {
        transform: translateX(0);
        opacity: 1;
        transition-delay: 0.2s;
      }
      .brantjes-property-card img {
        width: 100%;
        border-radius: 0;
        box-shadow: none;
      }
      .brantjes-card-content {
        display: none; /* Replaced by overlay */
      }
      .brantjes-nav-button {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        background-color: rgba(255, 255, 255, 0.8);
        border: 1px solid #ccc;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        cursor: pointer;
        z-index: 20;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        line-height: 1;
        box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        transition: background-color 0.2s;
      }
      .brantjes-nav-button:hover {
        background-color: white;
      }
      .brantjes-nav-prev {
        left: 20px;
      }
      .brantjes-nav-next {
        right: 20px;
      }
      .brantjes-dots-container {
        text-align: center;
        padding-top: 20px;
      }
      .brantjes-dot {
        display: inline-block;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background-color: #ccc;
        margin: 0 5px;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      .brantjes-dot.active {
        background-color: #1E7FCB;
      }

      /* Modal Styles */
      .brantjes-modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.6);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(5px);
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      .brantjes-modal-backdrop.visible {
        opacity: 1;
      }
      .brantjes-modal-container {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        width: 90%;
        max-width: 900px;
        transform: scale(0.9);
        transition: transform 0.3s ease;
      }
      .brantjes-modal-backdrop.visible .brantjes-modal-container {
        transform: scale(1);
      }
      .brantjes-modal-close {
        position: absolute;
        top: 15px;
        right: 15px;
        width: 30px;
        height: 30px;
        background: rgba(0,0,0,0.5);
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        font-size: 20px;
        line-height: 30px;
        text-align: center;
      }

      /* Detail Pop-up Layout */
      .detail-popup-content {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 20px;
      }
      .detail-popup-main-image img {
        width: 100%;
        border-radius: 8px;
      }
      .detail-popup-thumbnails {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .detail-popup-thumbnail {
        background-color: #f0f0f0;
        border-radius: 8px;
        width: 100%;
        padding-bottom: 75%; /* 4:3 aspect ratio */
      }
      .detail-popup-info {
        grid-column: 1 / -1;
        padding-top: 20px;
      }
      .detail-popup-info h2 {
        color: #1E7FCB;
        margin: 0 0 10px;
      }

      /* Booking Form Layout */
      .booking-form-content h2 {
        color: #1E7FCB;
        text-align: center;
        margin-bottom: 1.5rem;
      }
      .booking-form {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }
      .booking-form .form-group {
        display: flex;
        flex-direction: column;
      }
      .booking-form .full-width {
        grid-column: 1 / -1;
      }
      .booking-form label {
        margin-bottom: 0.5rem;
        font-size: 14px;
        color: #666;
      }
      .booking-form input, .booking-form select, .booking-form textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 1rem;
      }
      .booking-form input:focus, .booking-form select:focus, .booking-form textarea:focus {
        outline: 2px solid #1E7FCB;
        border-color: #1E7FCB;
      }
      .booking-form .submit-btn {
        background: #1E7FCB;
        color: white;
        border: none;
        padding: 1rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1.1rem;
        font-weight: bold;
        transition: background-color 0.2s;
        margin-top: 1rem;
      }
      .booking-form .submit-btn:hover {
        background: #166BB5;
      }

      /* Responsive Styles */
      @media (max-width: 900px) {
        .brantjes-carousel-container {
          width: 98vw;
          height: 60vw;
          min-width: 0;
          min-height: 0;
        }
        .brantjes-property-card { /* Active class removed from this block */
          width: 40vw;
          min-width: 120px;
          height: 60vw;
          min-height: 180px;
        }
      }
      @media (max-width: 600px) {
        .brantjes-carousel-container {
          width: 100vw;
          height: 70vw;
        }
        .brantjes-property-card { /* Active class removed from this block */
          width: 80vw;
          min-width: 100px;
          height: 60vw;
          min-height: 120px;
        }
      }

      /* Modern Class-Based Absolute Carousel (from ExampleInfinityCarousel.md) */
      .brantjes-carousel-list {
        position: relative; /* Changed to relative inside a flex container */
        width: 100%;
        height: 100%;
        margin: 0; /* Reset margin */
        padding: 0; /* Reset padding */
        display: flex; /* Use flexbox for the list items */
        align-items: center; /* Vertically center cards within the list */
        justify-content: center; /* Horizontally center cards within the list */
      }
      .brantjes-carousel-list .brantjes-property-card {
        list-style-type: none;
        position: absolute; /* Keep absolute for layering and transformations */
        /* Remove margin-left and margin-top for centring with transform */
        border-radius: 8px;
        background: #fff;
        box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        transition: transform 1s, opacity 1s, width 1s, height 1s; /* Adjusted transitions */
        z-index: 1;
        width: 201px; /* Original size */
        height: 335px; /* Original size */
        opacity: .25; /* Default opacity */
        top: 50%; /* Center vertically with transform */
        left: 50%; /* Center horizontally with transform */
        transform: translate(-50%, -50%) scale(0.85); /* Default scale for prev/next/hide/new-next */
      }
      .brantjes-carousel-list .act {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1); /* Active element is centered and full size */
        z-index: 3;
        width: 219px; /* Active size */
        height: 365px; /* Active size */
      }
      .brantjes-carousel-list .prev,
      .brantjes-carousel-list .next {
        cursor: pointer;
        z-index: 2; /* Prev/Next are above hide/new-next */
      }
      .brantjes-carousel-list .prev {
        transform: translate(calc(-50% - 220px), -50%) scale(.85); /* Adjusted for centering */
        opacity: .25;
      }
      .brantjes-carousel-list .next {
        transform: translate(calc(-50% + 220px), -50%) scale(.85); /* Adjusted for centering */
        opacity: .25;
      }
      .brantjes-carousel-list .hide {
        transform: translate(calc(-50% - 420px), -50%) scale(.85); /* Adjusted for centering */
        opacity: 0;
        transition: opacity .5s, transform .5s; /* Faster transition for hiding */
        z-index: 0;
      }
      .brantjes-carousel-list .new-next {
        transform: translate(calc(-50% + 420px), -50%) scale(.85); /* Adjusted for centering */
        opacity: 0;
        transition: opacity .5s, transform .5s; /* Faster transition for new elements */
        z-index: 0;
      }


      /* Energy label styles */
      .energy-label {
        position: absolute;
        top: 15px;
        left: 15px;
        min-width: 36px;
        height: 32px;
        background: #1EC773;
        color: #fff;
        font-weight: bold;
        font-size: 20px;
        line-height: 32px;
        text-align: center;
        border-radius: 6px 0 0 6px;
        z-index: 10;
        box-shadow: 0 2px 6px rgba(0,0,0,0.10);
        padding: 0 14px 0 10px;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        overflow: visible;
      }
      .energy-label::after {
        content: '';
        position: absolute;
        right: -12px;
        top: 0;
        width: 0;
        height: 0;
        border-top: 16px solid transparent;
        border-bottom: 16px solid transparent;
        border-left: 12px solid #1EC773;
      }
      .energy-label-A { background: #1EC773; }
      .energy-label-B { background: #8DD800; }
      .energy-label-C { background: #F7D900; color: #333; }
      .energy-label-D { background: #F7A600; }
      .energy-label-E { background: #F76B1C; }
      .energy-label-F { background: #E2001A; }
      .energy-label-G { background: #A50021; }
      .energy-label-A::after { border-left-color: #1EC773; }
      .energy-label-B::after { border-left-color: #8DD800; }
      .energy-label-C::after { border-left-color: #F7D900; }
      .energy-label-D::after { border-left-color: #F7A600; }
      .energy-label-E::after { border-left-color: #F76B1C; }
      .energy-label-F::after { border-left-color: #E2001A; }
      .energy-label-G::after { border-left-color: #A50021; }
    `;
    element.appendChild(style);

    // --- MODAL FUNCTIONS ---
    function openModal(contentElement) {
      const backdrop = document.createElement('div');
      backdrop.className = 'brantjes-modal-backdrop';
      backdrop.setAttribute('role', 'dialog');
      backdrop.setAttribute('aria-modal', 'true');

      const modalContainer = document.createElement('div');
      modalContainer.className = 'brantjes-modal-container';

      const closeButton = document.createElement('button');
      closeButton.className = 'brantjes-modal-close';
      closeButton.innerHTML = '&times;';
      closeButton.setAttribute('aria-label', 'Close pop-up');

      function closeModal() {
        backdrop.classList.remove('visible');
        backdrop.addEventListener('transitionend', () => {
          backdrop.remove();
        }, { once: true });
      }

      closeButton.addEventListener('click', closeModal);
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          closeModal();
        }
      });

      modalContainer.appendChild(closeButton);
      modalContainer.appendChild(contentElement);
      backdrop.appendChild(modalContainer);
      element.appendChild(backdrop);

      // Trigger the transition
      setTimeout(() => backdrop.classList.add('visible'), 10);
    }

    function showDetailModal(property) {
      const content = document.createElement('div');
      content.className = 'detail-popup-content';
      content.innerHTML = `
        <div class="detail-popup-main-image">
          <img src="${property.fields?.Image?.[0]?.url || ''}" alt="${property.fields['Property Name']}">
        </div>
        <div class="detail-popup-thumbnails">
          <div class="detail-popup-thumbnail"></div>
          <div class="detail-popup-thumbnail"></div>
          <div class="detail-popup-thumbnail"></div>
          <div class="detail-popup-thumbnail"></div>
        </div>
        <div class="detail-popup-info">
          <h2>${property.fields['Property Name']}</h2>
          <p>${property.fields.Address || 'Address not available'}</p>
          <p><strong>Makelaar:</strong> ${property.fields['Sales Rep'] || 'N/A'} &nbsp;&bull;&nbsp; <strong>Tel:</strong> ${property.fields['Reps Number'] || 'N/A'}</p>
          <p><strong>Prijs:</strong> € ${property.fields.Price?.toLocaleString('nl-NL') || '0'} k.k.</p>
        </div>
      `;
      openModal(content);
    }

    function showBookingModal(property) {
      const content = document.createElement('div');
      content.className = 'booking-form-content';
      content.innerHTML = `
        <h2>Bezichtigen Aanvragen</h2>
        <form class="booking-form" aria-labelledby="booking-form-title">
          <h2 id="booking-form-title" class="vf-assistant-hidden">Viewing Request Form</h2>
          <div class="form-group full-width">
            <label for="property">Woning</label>
            <input type="text" id="property" name="property" value="${property.fields['Property Name'] || property.adres?.straat + ' ' + property.adres?.huisnummer?.hoofdnummer + ', ' + property.adres?.plaats}" readonly>
          </div>
          <div class="form-group">
            <label for="preferred_day">Voorkeursdag</label>
            <select id="preferred_day" name="preferred_day">
              <option>Geen voorkeur</option>
              <option>Maandag</option>
              <option>Dinsdag</option>
              <option>Woensdag</option>
              <option>Donderdag</option>
              <option>Vrijdag</option>
            </select>
          </div>
          <div class="form-group">
            <label for="time_of_day">Dagdeel</label>
            <select id="time_of_day" name="time_of_day">
              <option>Geen voorkeur</option>
              <option>Ochtend</option>
              <option>Middag</option>
            </select>
          </div>
          <div class="form-group full-width">
            <label for="message">Jouw bericht</label>
            <textarea id="message" name="message" rows="4"></textarea>
          </div>
          <div class="form-group">
            <label for="first_name">Voornaam*</label>
            <input type="text" id="first_name" name="first_name" required>
          </div>
          <div class="form-group">
            <label for="last_name">Achternaam*</label>
            <input type="text" id="last_name" name="last_name" required>
          </div>
          <div class="form-group">
            <label for="email">E-mail*</label>
            <input type="email" id="email" name="email" required>
          </div>
          <div class="form-group">
            <label for="phone">Telefoon*</label>
            <input type="tel" id="phone" name="phone" required>
          </div>
          <div class="form-group full-width">
            <button type="submit" class="submit-btn">Verzend</button>
          </div>
        </form>
      `;
      const form = content.querySelector('form');
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const bookingDetails = Object.fromEntries(formData.entries());

        // Use vfrc.send to send data back to Voiceflow
        if (window.vfrc) {
          window.vfrc.send({
            type: 'request',
            payload: {
              type: 'extension',
              name: 'brantjes_booking_request',
              path: 'success',
              payload: bookingDetails,
            },
          });
        }

        console.log('Form submitted with details:', bookingDetails);

        // Visually confirm and close modal
        const submitButton = form.querySelector('.submit-btn');
        submitButton.textContent = 'Verzonden!';
        submitButton.style.backgroundColor = '#28a745';
        setTimeout(() => {
          document.querySelector('.brantjes-modal-backdrop .brantjes-modal-close').click();
        }, 1500);
      });
      openModal(content);
    }

    // --- INFINITE CAROUSEL SETUP (Adapted to ExampleInfinityCarousel.md logic) ---
    const realSlidesData = properties;
    const totalSlides = realSlidesData.length;

    // Helper to create a card element
    function createCardElement(propertyData) {
      const li = document.createElement('li'); // Changed to li as in example
      li.className = 'brantjes-property-card'; // This class is already styled in your CSS
      li.style.listStyleType = 'none'; // Ensure no bullet points

      const cardInner = document.createElement('div');
      cardInner.className = 'brantjes-property-card-inner';

      let imgUrl = '';
      if (Array.isArray(propertyData.media)) {
        let imgObj = propertyData.media.find(m => m.vrijgave && m.mimetype && m.mimetype.startsWith('image/') && m.soort === 'HOOFDFOTO');
        if (!imgObj) {
          imgObj = propertyData.media.find(m => m.vrijgave && m.mimetype && m.mimetype.startsWith('image/'));
        }
        if (imgObj) {
          imgUrl = imgObj.link;
          if (imgUrl) {
            imgUrl += imgUrl.includes('?') ? '&resize=4' : '?resize=4';
          }
        }
      }
      const img = document.createElement('img');
      img.src = imgUrl || 'https://via.placeholder.com/200x200?text=No+Image'; // Fallback image
      img.alt = 'Woning foto';
      cardInner.appendChild(img);

      const overlay = document.createElement('div');
      overlay.className = 'brantjes-card-overlay';
      const info = document.createElement('div');
      info.className = 'brantjes-card-info';

      const straat = propertyData.adres?.straat || '';
      const huisnummer = propertyData.adres?.huisnummer?.hoofdnummer || '';
      const plaats = propertyData.adres?.plaats || '';
      const address = [straat, huisnummer, plaats].filter(Boolean).join(' ');
      const price = propertyData.financieel?.overdracht?.koopprijs || 0;
      const energy = propertyData.algemeen?.energieklasse || '';
      const area = propertyData.algemeen?.woonoppervlakte || '';
      const rooms = propertyData.algemeen?.aantalKamers || '';

      const title = document.createElement('p');
      title.textContent = address || 'Onbekend adres';
      const priceP = document.createElement('p');
      priceP.textContent = `€ ${price.toLocaleString('nl-NL')} k.k.`;
      const extra = document.createElement('p');
      extra.style.fontSize = '14px';
      extra.innerHTML =
        (energy ? `<span title=\"Energielabel\">${energy}</span> &nbsp;` : '') +
        (area ? `<span title=\"Woonoppervlakte\">${area} m²</span> &nbsp;` : '') +
        (rooms ? `<span title=\"Kamers\">${rooms} kamers</span>` : '');
      info.appendChild(title);
      info.appendChild(priceP);
      info.appendChild(extra);
      overlay.appendChild(info);
      cardInner.appendChild(overlay);

      const viewingButton = document.createElement('button');
      viewingButton.className = 'brantjes-viewing-button';
      viewingButton.innerHTML = `
        <div class="cta-box"></div>
        <span class="cta-text">Bezichtigen</span>
      `;
      viewingButton.addEventListener('click', (e) => {
        e.stopPropagation();
        showBookingModal(propertyData);
      });
      li.appendChild(viewingButton);
      li.appendChild(cardInner);

      li.addEventListener('click', () => {
        // Only open detail modal if it's the active slide
        if (li.classList.contains('act')) {
          showDetailModal(propertyData);
        }
      });

      if (energy) {
        const labelDiv = document.createElement('div');
        labelDiv.className = `energy-label energy-label-${energy}`;
        labelDiv.textContent = energy;
        li.appendChild(labelDiv);
      }

      // Store the property data on the element for easy access
      li.propertyData = propertyData;

      return li;
    }

    // Main carousel container
    const carouselContainer = document.createElement('div');
    carouselContainer.className = 'brantjes-carousel-container';

    // The list (ul or div) that holds the carousel items
    const list = document.createElement('ul'); // Changed to ul as in example
    list.className = 'brantjes-carousel-list';
    carouselContainer.appendChild(list);

    // Initial population of carousel items
    let initialProperties = [];

    // Logic to handle fewer than 5 properties by duplicating
    if (totalSlides === 1) {
        initialProperties = [
            realSlidesData[0], // hide
            realSlidesData[0], // prev
            realSlidesData[0], // act
            realSlidesData[0], // next
            realSlidesData[0]  // new-next
        ];
        currentPropertyIndex = 0; // The 'act' element is the first property
    } else if (totalSlides === 2) {
        initialProperties = [
            realSlidesData[1], // hide (last property)
            realSlidesData[0], // prev (first property)
            realSlidesData[1], // act (second property)
            realSlidesData[0], // next (first property)
            realSlidesData[1]  // new-next (second property)
        ];
        currentPropertyIndex = 1; // The 'act' element is the second property (index 1)
    } else if (totalSlides === 3) {
        initialProperties = [
            realSlidesData[2], // hide (last property)
            realSlidesData[0], // prev (first property)
            realSlidesData[1], // act (second property)
            realSlidesData[2], // next (last property)
            realSlidesData[0]  // new-next (first property)
        ];
        currentPropertyIndex = 1; // The 'act' element is the second property (index 1)
    } else if (totalSlides === 4) {
        initialProperties = [
            realSlidesData[3], // hide (last property)
            realSlidesData[0], // prev (first property)
            realSlidesData[1], // act (second property)
            realSlidesData[2], // next (third property)
            realSlidesData[3]  // new-next (last property)
        ];
        currentPropertyIndex = 1; // The 'act' element is the second property (index 1)
    }
     else { // 5 or more properties
        initialProperties = [
            realSlidesData[totalSlides - 2], // For hide
            realSlidesData[totalSlides - 1], // For prev
            realSlidesData[0], // For act
            realSlidesData[1], // For next
            realSlidesData[2]  // For new-next
        ];
        currentPropertyIndex = 0; // The 'act' element is the first property (index 0)
    }
    
    // Append initial cards with their respective classes
    initialProperties.forEach((prop, index) => {
        const card = createCardElement(prop);
        if (index === 0) card.classList.add('hide');
        else if (index === 1) card.classList.add('prev');
        else if (index === 2) card.classList.add('act');
        else if (index === 3) card.classList.add('next');
        else if (index === 4) card.classList.add('new-next');
        list.appendChild(card);
    });

    // AANPASSING: De $ helper wordt aangepast om alleen binnen de 'list' te zoeken.
    // Dit is cruciaal om te voorkomen dat het document globaal wordt doorzocht
    // en conflicten/null errors veroorzaakt.
    const $ = selector => list.querySelector(selector);

    function getNextPropertyData() {
        const actEl = $(".brantjes-carousel-list .act");
        if (!actEl || actEl.propertyData === undefined) {
             console.error("Could not find 'act' element or its propertyData.");
             return realSlidesData[0]; // Fallback to first property
        }
        const currentIndex = realSlidesData.indexOf(actEl.propertyData);
        currentPropertyIndex = (currentIndex + 1) % totalSlides;
        return realSlidesData[currentPropertyIndex];
    }

    function getPrevPropertyData() {
        const actEl = $(".brantjes-carousel-list .act");
        if (!actEl || actEl.propertyData === undefined) {
            console.error("Could not find 'act' element or its propertyData.");
            return realSlidesData[0]; // Fallback to first property
        }
        const currentIndex = realSlidesData.indexOf(actEl.propertyData);
        currentPropertyIndex = (currentIndex - 1 + totalSlides) % totalSlides;
        return realSlidesData[currentPropertyIndex];
    }

    function next() {
        // Find elements using the list-specific $ helper
        const hideEl = $(".brantjes-carousel-list .hide");
        const prevEl = $(".brantjes-carousel-list .prev");
        const actEl = $(".brantjes-carousel-list .act");
        const nextEl = $(".brantjes-carousel-list .next");
        const newNextEl = $(".brantjes-carousel-list .new-next"); // This might be null if totalSlides < 5 initially

        // 1. Remove the 'hide' element
        if (hideEl) {
            hideEl.remove();
        }

        // 2. Shift classes
        if (prevEl) {
            prevEl.classList.add("hide");
            prevEl.classList.remove("prev");
        }
        if (actEl) {
            actEl.classList.add("prev");
            actEl.classList.remove("act");
        }
        if (nextEl) {
            nextEl.classList.add("act");
            nextEl.classList.remove("next");
        }
        if (newNextEl) { // Only remove if it exists
            newNextEl.classList.remove("new-next");
        }


        // 3. Add a new 'new-next' element at the end
        const addedEl = createCardElement(getNextPropertyData());
        list.appendChild(addedEl);
        addedEl.classList.add("next", "new-next"); // The new element starts as next and new-next

        updateZIndexes();
    }

    function prev() {
        // Find elements using the list-specific $ helper
        const hideEl = $(".brantjes-carousel-list .hide");
        const prevEl = $(".brantjes-carousel-list .prev");
        const actEl = $(".brantjes-carousel-list .act");
        const nextEl = $(".brantjes-carousel-list .next");
        const newNextEl = $(".brantjes-carousel-list .new-next");

        // 1. Remove the 'new-next' element
        if (newNextEl) {
            newNextEl.remove();
        }

        // 2. Shift classes
        if (nextEl) {
            nextEl.classList.add("new-next"); // Old 'next' becomes 'new-next'
        }
        if (actEl) {
            actEl.classList.add("next");
            actEl.classList.remove("act");
        }
        if (prevEl) {
            prevEl.classList.add("act");
            prevEl.classList.remove("prev");
        }
        if (hideEl) { // Only add if it exists
            hideEl.classList.add("prev");
            hideEl.classList.remove("hide");
        }

        // 3. Add a new 'hide' element at the beginning
        const addedEl = createCardElement(getPrevPropertyData());
        list.insertBefore(addedEl, list.firstChild);
        addedEl.classList.add("hide"); // The new element starts as hide

        updateZIndexes();
    }


    function updateZIndexes() {
        list.querySelectorAll('.brantjes-property-card').forEach(card => {
            if (card.classList.contains('act')) {
                card.style.zIndex = '3';
            } else if (card.classList.contains('prev') || card.classList.contains('next')) {
                card.style.zIndex = '2';
            } else {
                card.style.zIndex = '1'; // Hide/new-next or other default
            }
        });
    }

    // Call updateZIndexes initially
    updateZIndexes();

    const slide = element => {
        // Ensure element is a valid card
        if (!element || !element.classList || !element.classList.contains('brantjes-property-card')) {
            return;
        }

        /* Next slide */
        if (element.classList.contains('next')) {
            next();
        /* Previous slide */
        } else if (element.classList.contains('prev')) {
            prev();
        }
    }

    const slider = list; 

    slider.onclick = event => {
        slide(event.target.closest('.brantjes-property-card')); // Ensure we click the card element itself
    }

    // Build navigation buttons
    const nextButton = document.createElement('button');
    nextButton.className = 'brantjes-nav-button brantjes-nav-next';
    nextButton.innerHTML = '&rsaquo;';
    nextButton.setAttribute('aria-label', 'Next Property');
    const prevButton = document.createElement('button');
    prevButton.className = 'brantjes-nav-button brantjes-nav-prev';
    prevButton.innerHTML = '&lsaquo;';
    prevButton.setAttribute('aria-label', 'Previous Property');

    carouselContainer.appendChild(prevButton);
    carouselContainer.appendChild(nextButton);

    nextButton.addEventListener('click', next);
    prevButton.addEventListener('click', prev);

    element.appendChild(carouselContainer);
  },
};
