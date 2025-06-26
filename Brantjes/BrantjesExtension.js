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

    // Create stylesheet
    const style = document.createElement('style');
    style.innerHTML = `
      /* Font-face declarations for Soleto fonts */
      @font-face {
        font-family: 'Soleto Trial';
        src: url('pad/naar/SoletoTrial-Regular.woff2') format('woff2'),
             url('pad/naar/SoletoTrial-Regular.woff') format('woff');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
      
      @font-face {
        font-family: 'Soleto';
        src: url('pad/naar/Soleto-Regular.woff2') format('woff2'),
             url('pad/naar/Soleto-Regular.woff') format('woff');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }

      /* Apply font family to all elements in the carousel */
      .brantjes-carousel-container,
      .brantjes-carousel-container * {
        font-family: 'Soleto Trial', 'Soleto', 'Montserrat', 'Roboto', sans-serif;
      }

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
        transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s, width 0.6s, height 0.6s, box-shadow 0.3s ease, filter 0.3s ease; /* Added box-shadow and filter transitions */
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
        cursor: pointer; /* Indicate clickability */
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
        color: #51b2df;
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
        background-color: #51b2df;
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 0.3s ease, background-color 0.3s ease;
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
      /* Modified CSS for button visibility on hover with !important */
      .brantjes-property-card.act:hover .brantjes-viewing-button {
        opacity: 1 !important;
        pointer-events: auto !important;
      }
      .brantjes-property-card.act:hover .brantjes-viewing-button .cta-box {
        transform: scaleX(1);
      }
      .brantjes-property-card.act:hover .brantjes-viewing-button .cta-text {
        transform: translateX(0);
        opacity: 1;
        transition-delay: 0.2s;
      }
      
      /* Hover effect for the viewing button itself */
      .brantjes-property-card.act:hover .brantjes-viewing-button:hover .cta-box {
        background-color: #3a9bc7;
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
        .brantjes-property-card {
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
        .brantjes-property-card {
          width: 80vw;
          min-width: 100px;
          height: 60vw;
          min-height: 120px;
        }
      }

      /* Modern Class-Based Absolute Carousel */
      .brantjes-carousel-list {
        position: relative; /* Changed to relative, flexbox for internal centering */
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
        /* Removed margin-left and margin-top for centring with transform */
        border-radius: 8px;
        background: #fff;
        box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s, width 0.6s, height 0.6s; /* Smoother transitions */
        z-index: 1;
        width: 201px; /* Original size */
        height: 335px; /* Original size */
        opacity: 0; /* Default opacity for cards not explicitly positioned/shown by JS */
        top: 50%; /* Center vertically with transform */
        left: 50%; /* Center horizontally with transform */
        transform: translate(-50%, -50%) scale(0.85); /* Default scale for off-screen */
      }
      .brantjes-carousel-list .act {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1); /* Active element is centered and full size */
        z-index: 3;
        width: 219px; /* Active size */
        height: 365px; /* Active size */
      }
      .brantjes-carousel-list .prev {
        opacity: .25;
        z-index: 2; /* Prev/Next are above hide/new-next */
        transform: translate(calc(-50% - 220px), -50%) scale(.85); /* Adjusted for centering */
      }
      .brantjes-carousel-list .next {
        opacity: .25;
        z-index: 2; /* Prev/Next are above hide/new-next */
        transform: translate(calc(-50% + 220px), -50%) scale(.85); /* Adjusted for centering */
      }
      .brantjes-carousel-list .hide,
      .brantjes-carousel-list .new-next {
        opacity: 0;
        transition: opacity .5s, transform .5s; /* Faster transition for hiding */
        z-index: 0;
        visibility: hidden; /* Added to ensure full invisibility */
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

      /* Styling for single card container */
      .brantjes-single-card-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 420px; /* Match carousel container height */
        width: 100%;
      }

      /* Hover effect for clickable cards */
      .brantjes-property-card:hover {
        transform: scale(1.02);
        box-shadow: 0px 8px 25px 0px rgba(0,0,0,0.25);
        filter: brightness(1.05);
      }
      
      /* Special hover effect for active (center) card */
      .brantjes-property-card.act:hover {
        transform: scale(1.05);
        box-shadow: 0px 12px 35px 0px rgba(30, 127, 203, 0.3);
        filter: brightness(1.08);
      }
      
      /* Add subtle blue overlay on hover */
      .brantjes-property-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(30, 127, 203, 0.08);
        border-radius: 8px;
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
        z-index: 2;
      }
      
      .brantjes-property-card:hover::before {
        opacity: 1;
      }
    `;
    element.appendChild(style);

    // --- MODAL FUNCTIONS (UNCHANGED) ---
    function openModal(contentElement) {
        let modalBackdrop = document.querySelector('.brantjes-modal-backdrop');
        if (!modalBackdrop) {
            modalBackdrop = document.createElement('div');
            modalBackdrop.className = 'brantjes-modal-backdrop';
            document.body.appendChild(modalBackdrop);
        }

        const modalContainer = document.createElement('div');
        modalContainer.className = 'brantjes-modal-container';
        modalContainer.style.position = 'relative'; // For absolute positioning of close button

        const closeButton = document.createElement('button');
        closeButton.className = 'brantjes-modal-close';
        closeButton.innerHTML = '&times;';
        closeButton.onclick = () => {
            modalBackdrop.classList.remove('visible');
            modalContainer.classList.remove('visible');
            setTimeout(() => {
                modalBackdrop.remove();
            }, 300); // Allow transition to finish
        };
        modalContainer.appendChild(closeButton);
        modalContainer.appendChild(contentElement);
        modalBackdrop.innerHTML = ''; // Clear previous content
        modalBackdrop.appendChild(modalContainer);

        // Force reflow to ensure transition
        void modalBackdrop.offsetWidth;
        modalBackdrop.classList.add('visible');
    }

    function showDetailModal(property) {
        const detailContent = document.createElement('div');
        detailContent.className = 'detail-popup-content';

        const mainImageContainer = document.createElement('div');
        mainImageContainer.className = 'detail-popup-main-image';
        let mainImgSrc = '';
        if (Array.isArray(property.media)) {
            let imgObj = property.media.find(m => m.vrijgave && m.mimetype && m.mimetype.startsWith('image/') && m.soort === 'HOOFDFOTO');
            if (!imgObj) {
                imgObj = property.media.find(m => m.vrijgave && m.mimetype && m.mimetype.startsWith('image/'));
            }
            if (imgObj) {
                mainImgSrc = imgObj.link;
                if (mainImgSrc) {
                    mainImgSrc += mainImgSrc.includes('?') ? '&resize=8' : '?resize=8'; // Higher resolution for detail
                }
            }
        }
        mainImageContainer.innerHTML = `<img src="${mainImgSrc || 'https://via.placeholder.com/600x400?text=No+Image'}" alt="Property Main Image">`;
        detailContent.appendChild(mainImageContainer);

        // Add dummy thumbnails for now
        const thumbnailsContainer = document.createElement('div');
        thumbnailsContainer.className = 'detail-popup-thumbnails';
        for (let i = 0; i < 4; i++) {
            thumbnailsContainer.innerHTML += `<div class="detail-popup-thumbnail" style="background-image: url('https://via.placeholder.com/150x112?text=Thumb'); background-size: cover;"></div>`;
        }
        detailContent.appendChild(thumbnailsContainer);

        const infoSection = document.createElement('div');
        infoSection.className = 'detail-popup-info';
        const address = [property.adres?.straat, property.adres?.huisnummer?.hoofdnummer, property.adres?.plaats].filter(Boolean).join(' ');
        infoSection.innerHTML = `
            <h2>${address || 'Onbekend adres'}</h2>
            <p><strong>Kooprijs:</strong> € ${property.financieel?.overdracht?.koopprijs?.toLocaleString('nl-NL') || 'N/A'}</p>
            <p><strong>Woonoppervlakte:</strong> ${property.algemeen?.woonoppervlakte || 'N/A'} m²</p>
            <p><strong>Aantal kamers:</strong> ${property.algemeen?.aantalKamers || 'N/A'}</p>
            <p><strong>Energielabel:</strong> ${property.algemeen?.energieklasse || 'N/A'}</p>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
            <button class="submit-btn" style="width: auto; padding: 10px 20px;">Plan bezichtiging</button>
        `;
        detailContent.appendChild(infoSection);

        // Add event listener to the "Plan bezichtiging" button within the detail modal
        const planViewingButton = infoSection.querySelector('.submit-btn');
        if (planViewingButton) {
            planViewingButton.addEventListener('click', () => {
                // Close detail modal first, then open booking modal
                document.querySelector('.brantjes-modal-backdrop')?.remove();
                showBookingModal(property);
            });
        }

        openModal(detailContent);
    }

    function showBookingModal(property) {
        const bookingContent = document.createElement('div');
        bookingContent.className = 'booking-form-content';
        const address = [property.adres?.straat, property.adres?.huisnummer?.hoofdnummer, property.adres?.plaats].filter(Boolean).join(' ');

        bookingContent.innerHTML = `
            <h2>Bezichtiging plannen voor ${address || 'deze woning'}</h2>
            <form class="booking-form">
                <div class="form-group">
                    <label for="name">Naam:</label>
                    <input type="text" id="name" name="name" required>
                </div>
                <div class="form-group">
                    <label for="email">E-mail:</label>
                    <input type="email" id="email" name="email" required>
                </div>
                <div class="form-group full-width">
                    <label for="phone">Telefoonnummer:</label>
                    <input type="tel" id="phone" name="phone">
                </div>
                <div class="form-group full-width">
                    <label for="date">Voorkeursdatum:</label>
                    <input type="date" id="date" name="date" required>
                </div>
                <div class="form-group full-width">
                    <label for="time">Voorkeurstijd:</label>
                    <input type="time" id="time" name="time">
                </div>
                <div class="form-group full-width">
                    <label for="message">Opmerkingen:</label>
                    <textarea id="message" name="message" rows="4"></textarea>
                </div>
                <button type="submit" class="submit-btn full-width">Verzoek indienen</button>
            </form>
        `;

        const bookingForm = bookingContent.querySelector('.booking-form');
        if (bookingForm) {
            bookingForm.addEventListener('submit', (e) => {
                e.preventDefault();
                alert('Bezichtigingsverzoek ingediend!');
                document.querySelector('.brantjes-modal-backdrop')?.remove(); // Close modal on submit
            });
        }
        openModal(bookingContent);
    }

    // --- INFINITE CAROUSEL SETUP (ADAPTED) ---
    const realSlidesData = properties;
    const totalSlides = realSlidesData.length;

    // Helper to create a card element (unchanged)
    function createCardElement(propertyData) {
      const li = document.createElement('li');
      li.className = 'brantjes-property-card';
      li.style.listStyleType = 'none';

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

      // Store the property data on the element for easy access
      li.propertyData = propertyData;

      if (energy) {
        const labelDiv = document.createElement('div');
        labelDiv.className = `energy-label energy-label-${energy}`;
        labelDiv.textContent = energy;
        li.appendChild(labelDiv);
      }
      return li;
    }

    if (totalSlides === 0) {
      element.innerHTML = `<p>No properties available.</p>`;
      return;
    }

    if (totalSlides === 1) {
      // Render single card, no carousel
      const singleCardContainer = document.createElement('div');
      singleCardContainer.className = 'brantjes-single-card-container';

      const card = createCardElement(realSlidesData[0]);
      card.classList.add('act'); // Visually make it active
      card.style.position = 'relative'; // Override absolute for single card
      card.style.transform = 'none'; // Clear any transforms
      card.style.opacity = '1';
      card.style.zIndex = '3';
      card.style.width = '219px'; // Active width
      card.style.height = '365px'; // Active height

      singleCardContainer.appendChild(card);
      element.appendChild(singleCardContainer);
      return; // Exit render function
    }

    // --- CAROUSEL RENDERING FOR totalSlides > 1 ---
    const carouselContainer = document.createElement('div');
    carouselContainer.className = 'brantjes-carousel-container';

    const list = document.createElement('ul');
    list.className = 'brantjes-carousel-list';
    carouselContainer.appendChild(list);

    // Populate all unique property cards in the list initially
    realSlidesData.forEach(prop => {
        const card = createCardElement(prop);
        list.appendChild(card);
    });

    let currentPropertyIndex = 0; // Tracks the index of the active card in realSlidesData

    function updateCardClassesAndTransforms() {
        const cards = Array.from(list.children); // Get all card elements in the DOM
        const nextIndex = (currentPropertyIndex + 1) % totalSlides;
        const prevIndex = (currentPropertyIndex - 1 + totalSlides) % totalSlides;


        cards.forEach((card, index) => {
            // Reset all potential carousel classes and default styles
            card.classList.remove('prev', 'act', 'next');
            card.style.opacity = '0'; // Default to hidden
            card.style.zIndex = '1'; // Default z-index
            card.style.transform = `translate(-50%, -50%) scale(0.85)`; // Default scale and centering adjustment
            card.style.width = '201px'; // Default width
            card.style.height = '335px'; // Default height

            if (index === currentPropertyIndex) { // Active card
                card.classList.add('act');
                card.style.opacity = '1';
                card.style.zIndex = '3';
                card.style.transform = `translate(-50%, -50%) scale(1)`;
                card.style.width = '219px'; // Active width
                card.style.height = '365px'; // Active height
            } else if (index === nextIndex) { // Next card
                card.classList.add('next');
                card.style.opacity = '0.25';
                card.style.zIndex = '2';
                card.style.transform = `translate(calc(-50% + 220px), -50%) scale(0.85)`;
            } else if (index === prevIndex) { // Previous card
                card.classList.add('prev');
                card.style.opacity = '0.25';
                card.style.zIndex = '2';
                card.style.transform = `translate(calc(-50% - 220px), -50%) scale(0.85)`;
            }
            // All other cards will retain the default hidden/scaled state
        });
    }

    function next() {
        currentPropertyIndex = (currentPropertyIndex + 1) % totalSlides;
        updateCardClassesAndTransforms();
    }

    function prev() {
        currentPropertyIndex = (currentPropertyIndex - 1 + totalSlides) % totalSlides;
        updateCardClassesAndTransforms();
    }

    // Call initial update
    updateCardClassesAndTransforms();

    // Click handler for cards
    list.addEventListener('click', event => {
        const clickedCard = event.target.closest('.brantjes-property-card');
        if (clickedCard) {
            if (clickedCard.classList.contains('next')) {
                next();
            } else if (clickedCard.classList.contains('prev')) {
                prev();
            } else if (clickedCard.classList.contains('act')) {
                showDetailModal(clickedCard.propertyData);
            }
        }
    });

    // Navigation buttons
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
