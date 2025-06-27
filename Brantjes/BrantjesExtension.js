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
        padding: 15px 15px 22px 15px;
        background: linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.08) 100%);
        z-index: 2;
      }
      .brantjes-card-info p {
        margin: 0 0 5px;
        font-size: 12px;
      }
      .brantjes-card-info p:first-child {
        font-weight: bold;
        font-size: 12px;
        color: white;
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

      /* Larger font sizes for hero (active) card */
      .brantjes-property-card.act .brantjes-card-info p:first-child {
        font-size: 20px;
      }
      .brantjes-property-card.act .brantjes-card-info p {
        font-size: 17px;
      }
      
      /* Special hover effect for active (center) card ONLY */
      .brantjes-property-card.act:hover {
        transform: scale(1.05);
        box-shadow: 0px 12px 35px 0px rgba(30, 127, 203, 0.3);
        filter: brightness(1.08);
      }
      
      /* Add subtle blue overlay on hover - ONLY for active card */
      .brantjes-property-card.act::before {
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
      
      .brantjes-property-card.act:hover::before {
        opacity: 1;
      }

      /* Card Title (Street + Number) */
      .brantjes-card-title {
        font-weight: bold;
        font-size: 22px;
        color: #fff;
        margin-bottom: 2px;
        line-height: 1.1;
      }
      /* City + Postal */
      .brantjes-card-city {
        font-size: 15px;
        color: #fff;
        font-weight: 400;
        margin-bottom: 8px;
        margin-top: 0;
        opacity: 0.85;
      }
      /* Price */
      .brantjes-card-price {
        font-size: 15px;
        color: #fff;
        margin-bottom: 8px;
        margin-top: 0;
      }
      .brantjes-card-price-numbers {
        font-weight: bold;
        font-size: 15px;
        color: #fff;
      }
      .brantjes-card-price-kk {
        font-weight: 400;
        font-size: 15px;
        color: #fff;
        opacity: 0.85;
      }
      /* Details pill */
      .brantjes-card-details-pill {
        margin: 0 0 10px 0;
        background: rgba(0,0,0,0.25);
        border-radius: 3px;
        box-shadow: none;
        padding: 3px 12px;
        font-size: 12px;
        color: #fff;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        z-index: 4;
        border: none;
        position: static;
      }
      .brantjes-card-details-pill svg {
        display: inline-block;
        vertical-align: middle;
        font-weight: normal !important;
        transition: none !important;
      }
      .brantjes-card-details-pill span {
        font-weight: 400 !important;
      }
      /* Overlay content area moves up to make room for pill and button */
      .brantjes-card-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 15px 15px 50px 15px;
        background: linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.08) 100%);
        z-index: 2;
      }
      /* Ensure viewing button is below the content */
      .brantjes-viewing-button {
        position: absolute;
        bottom: 7px;
        left: 15px;
        /* ...existing styles... */
      }
      /* All text in overlay white */
      .brantjes-card-overlay, .brantjes-card-overlay * {
        color: #fff !important;
      }

      /* Image hover overlay */
      .brantjes-img-hover-overlay {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.18);
        opacity: 0;
        pointer-events: none;
        border-radius: 8px;
        z-index: 3;
        transition: opacity 0.3s;
      }
      .brantjes-property-card.act:hover .brantjes-img-hover-overlay {
        opacity: 1;
      }
      /* Adjust overlay stacking */
      .brantjes-property-card-inner {
        position: relative;
        z-index: 1;
      }
      /* Responsive adjustments for pill */
      @media (max-width: 900px) {
        .brantjes-card-details-pill {
          bottom: 6px;
          right: 6px;
          padding: 2px 8px;
          font-size: 11px;
        }
      }
      @media (max-width: 600px) {
        .brantjes-card-details-pill {
          font-size: 10px;
        }
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
        // --- IMAGE DATA ---
        const media = Array.isArray(property.media) ? property.media : [];
        const mainImgObj = media.find(m => m.vrijgave && m.soort === 'HOOFDFOTO' && m.mimetype && m.mimetype.startsWith('image/'))
            || media.find(m => m.vrijgave && m.mimetype && m.mimetype.startsWith('image/'));
        const mainImgSrc = mainImgObj ? mainImgObj.link : '';
        const fotoImgs = media.filter(m => m.vrijgave && m.soort === 'FOTO' && m.mimetype && m.mimetype.startsWith('image/'));
        const allSlideshowImgs = fotoImgs.map(f => f.link);
        const thumbnails = fotoImgs.slice(0, 4);

        // --- MODAL CONTENT ---
        const detailContent = document.createElement('div');
        detailContent.className = 'detail-popup-content';

        // --- LEFT: Main image + thumbnails ---
        const leftCol = document.createElement('div');
        leftCol.style.display = 'flex';
        leftCol.style.flexDirection = 'column';
        leftCol.style.gap = '16px';
        leftCol.style.alignItems = 'center';
        leftCol.style.justifyContent = 'flex-start';
        leftCol.style.minWidth = '320px';
        leftCol.style.maxWidth = '420px';

        // Main image
        const mainImg = document.createElement('img');
        mainImg.src = mainImgSrc || 'https://via.placeholder.com/600x400?text=No+Image';
        mainImg.alt = 'Hoofdfoto';
        mainImg.style.width = '100%';
        mainImg.style.maxWidth = '380px';
        mainImg.style.borderRadius = '8px';
        mainImg.style.cursor = 'pointer';
        mainImg.onclick = () => openSlideshow(0);
        leftCol.appendChild(mainImg);

        // Thumbnails
        const thumbsRow = document.createElement('div');
        thumbsRow.style.display = 'grid';
        thumbsRow.style.gridTemplateColumns = 'repeat(2, 1fr)';
        thumbsRow.style.gap = '10px';
        thumbsRow.style.width = '100%';
        thumbnails.forEach((thumb, idx) => {
            const thumbDiv = document.createElement('div');
            thumbDiv.className = 'detail-popup-thumbnail';
            thumbDiv.style.backgroundImage = `url('${thumb.link}')`;
            thumbDiv.style.backgroundSize = 'cover';
            thumbDiv.style.backgroundPosition = 'center';
            thumbDiv.style.borderRadius = '8px';
            thumbDiv.style.cursor = 'pointer';
            thumbDiv.onclick = () => openSlideshow(idx);
            thumbDiv.style.aspectRatio = '4/3';
            thumbsRow.appendChild(thumbDiv);
        });
        leftCol.appendChild(thumbsRow);
        detailContent.appendChild(leftCol);

        // --- RIGHT: Info ---
        const rightCol = document.createElement('div');
        rightCol.className = 'detail-popup-info';
        rightCol.style.display = 'flex';
        rightCol.style.flexDirection = 'column';
        rightCol.style.gap = '10px';
        rightCol.style.justifyContent = 'flex-start';
        rightCol.style.width = '100%';

        // Title (street + number)
        const straat = property.adres?.straat || '';
        const huisnummer = property.adres?.huisnummer?.hoofdnummer || '';
        const streetAddress = [straat, huisnummer].filter(Boolean).join(' ');
        const title = document.createElement('h2');
        title.textContent = streetAddress || 'Onbekend adres';
        title.style.color = '#1E7FCB';
        title.style.margin = '0 0 4px 0';
        rightCol.appendChild(title);

        // Address (postal code + city)
        const plaats = property.adres?.plaats || '';
        const postcode = property.adres?.postcode || '';
        const cityPostal = [postcode, plaats].filter(Boolean).join(' ');
        const addrP = document.createElement('div');
        addrP.textContent = cityPostal;
        addrP.style.fontSize = '16px';
        addrP.style.color = '#333';
        rightCol.appendChild(addrP);

        // Broker info (dummy for now, can be improved with lookup)
        const makelaarId = property.algemeen?.gekoppeldeMakelaar;
        const makelaarDiv = document.createElement('div');
        makelaarDiv.innerHTML = `<span style="font-weight:600">Makelaar:</span> ${makelaarId || 'Onbekend'}`;
        makelaarDiv.style.fontSize = '15px';
        rightCol.appendChild(makelaarDiv);

        // Energy label and price row
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.justifyContent = 'space-between';
        row.style.gap = '10px';
        // Energy label
        const energy = property.algemeen?.energieklasse || '';
        const energyDiv = document.createElement('div');
        energyDiv.className = `energy-label energy-label-${energy}`;
        energyDiv.textContent = energy;
        row.appendChild(energyDiv);
        // Price
        const price = property.financieel?.overdracht?.koopprijs || 0;
        const priceDiv = document.createElement('div');
        priceDiv.innerHTML = `<span style="font-weight:bold;font-size:20px;">€ ${price.toLocaleString('nl-NL')}</span> <span style="font-size:16px;">k.k.</span>`;
        priceDiv.style.textAlign = 'right';
        row.appendChild(priceDiv);
        rightCol.appendChild(row);

        // --- Description with 'toon meer' ---
        const desc = property.teksten?.aanbiedingstekst || '';
        const descDiv = document.createElement('div');
        descDiv.style.margin = '16px 0 0 0';
        descDiv.style.fontSize = '15px';
        descDiv.style.color = '#333';
        let truncated = false;
        let expanded = false;
        let shortDesc = desc;
        if (desc.length > 400) {
            shortDesc = desc.slice(0, 400).split('\n').slice(0, 3).join('\n') + '...';
            truncated = true;
        }
        descDiv.textContent = truncated ? shortDesc : desc;
        if (truncated) {
            const moreBtn = document.createElement('button');
            moreBtn.textContent = 'Toon meer';
            moreBtn.style.background = 'none';
            moreBtn.style.color = '#1E7FCB';
            moreBtn.style.border = 'none';
            moreBtn.style.cursor = 'pointer';
            moreBtn.style.fontWeight = 'bold';
            moreBtn.onclick = () => {
                if (!expanded) {
                    descDiv.textContent = desc;
                    moreBtn.textContent = 'Toon minder';
                    expanded = true;
                } else {
                    descDiv.textContent = shortDesc;
                    moreBtn.textContent = 'Toon meer';
                    expanded = false;
                }
                descDiv.appendChild(moreBtn);
            };
            descDiv.appendChild(moreBtn);
        }
        rightCol.appendChild(descDiv);

        // --- Property Specifications List ---
        const specsTable = document.createElement('table');
        specsTable.style.width = '100%';
        specsTable.style.marginTop = '18px';
        specsTable.style.fontSize = '14px';
        specsTable.style.borderCollapse = 'collapse';
        // Helper to add a row
        function addSpecRow(label, value) {
            const tr = document.createElement('tr');
            const td1 = document.createElement('td');
            td1.textContent = label;
            td1.style.fontWeight = 'bold';
            td1.style.padding = '4px 8px 4px 0';
            td1.style.color = '#333';
            const td2 = document.createElement('td');
            td2.textContent = value;
            td2.style.padding = '4px 0 4px 8px';
            td2.style.color = '#444';
            tr.appendChild(td1);
            tr.appendChild(td2);
            specsTable.appendChild(tr);
        }
        // Overdracht
        addSpecRow('Prijs', `€ ${(property.financieel?.overdracht?.koopprijs || 0).toLocaleString('nl-NL')} k.k.`);
        addSpecRow('Status', property.financieel?.overdracht?.status || '');
        addSpecRow('Aanvaarding', property.financieel?.overdracht?.aanvaarding || '');
        // Bouw
        addSpecRow('Type object', property.object?.type?.objecttype || '');
        addSpecRow('Soort', property.algemeen?.woonhuissoort || '');
        addSpecRow('Type', property.algemeen?.woonhuistype || '');
        addSpecRow('Bouwjaar', property.algemeen?.bouwjaar || '');
        addSpecRow('Dak type', (property.detail?.buitenruimte?.daktype || ''));
        addSpecRow('Isolatievormen', (property.algemeen?.isolatievormen || []).join(', '));
        // Oppervlaktes en inhoud
        addSpecRow('Perceel', (property.detail?.kadaster?.[0]?.kadastergegevens?.oppervlakte || '') + ' m2');
        addSpecRow('Woonoppervlakte', (property.algemeen?.woonoppervlakte || '') + ' m2');
        addSpecRow('Inhoud', (property.algemeen?.inhoud || '') + ' m3');
        addSpecRow('Buitenruimtes gebouwgebonden of vrijstaand', (property.detail?.buitenruimte?.oppervlakteGebouwgebondenBuitenruimte || '') + ' m2');
        // Indeling
        addSpecRow('Aantal kamers', property.algemeen?.aantalKamers || '');
        addSpecRow('Aantal slaapkamers', property.detail?.etages?.reduce((acc, e) => acc + (e.aantalSlaapkamers || 0), 0) || '');
        // Locatie
        addSpecRow('Ligging', (property.algemeen?.liggingen || []).join(', '));
        // Tuin
        addSpecRow('Type', (property.detail?.buitenruimte?.tuintypes || []).join(', '));
        addSpecRow('Staat', property.detail?.buitenruimte?.tuinkwaliteit || '');
        addSpecRow('Ligging', property.detail?.buitenruimte?.hoofdtuinlocatie || '');
        addSpecRow('Achterom', property.detail?.buitenruimte?.hoofdtuinAchterom ? 'Ja' : 'Nee');
        // Uitrusting
        addSpecRow('Soorten warm water', (property.algemeen?.warmwatersoorten || []).join(', '));
        addSpecRow('Parkeer faciliteiten', (property.detail?.buitenruimte?.parkeerfaciliteiten || []).join(', '));
        rightCol.appendChild(specsTable);

        detailContent.appendChild(rightCol);

        // --- SLIDESHOW/LIGHTBOX ---
        function openSlideshow(startIdx) {
            if (!allSlideshowImgs.length) return;
            let idx = startIdx;
            const lightbox = document.createElement('div');
            lightbox.style.position = 'fixed';
            lightbox.style.top = '0';
            lightbox.style.left = '0';
            lightbox.style.width = '100vw';
            lightbox.style.height = '100vh';
            lightbox.style.background = 'rgba(0,0,0,0.85)';
            lightbox.style.display = 'flex';
            lightbox.style.alignItems = 'center';
            lightbox.style.justifyContent = 'center';
            lightbox.style.zIndex = '2000';

            const img = document.createElement('img');
            img.src = allSlideshowImgs[idx];
            img.style.maxWidth = '90vw';
            img.style.maxHeight = '80vh';
            img.style.borderRadius = '8px';
            img.style.boxShadow = '0 4px 24px rgba(0,0,0,0.5)';
            lightbox.appendChild(img);

            // Navigation
            const prevBtn = document.createElement('button');
            prevBtn.textContent = '<';
            prevBtn.style.position = 'absolute';
            prevBtn.style.left = '40px';
            prevBtn.style.top = '50%';
            prevBtn.style.transform = 'translateY(-50%)';
            prevBtn.style.fontSize = '2rem';
            prevBtn.style.background = 'rgba(0,0,0,0.3)';
            prevBtn.style.color = '#fff';
            prevBtn.style.border = 'none';
            prevBtn.style.borderRadius = '50%';
            prevBtn.style.width = '48px';
            prevBtn.style.height = '48px';
            prevBtn.style.cursor = 'pointer';
            prevBtn.onclick = (e) => {
                e.stopPropagation();
                idx = (idx - 1 + allSlideshowImgs.length) % allSlideshowImgs.length;
                img.src = allSlideshowImgs[idx];
            };
            lightbox.appendChild(prevBtn);
            const nextBtn = document.createElement('button');
            nextBtn.textContent = '>';
            nextBtn.style.position = 'absolute';
            nextBtn.style.right = '40px';
            nextBtn.style.top = '50%';
            nextBtn.style.transform = 'translateY(-50%)';
            nextBtn.style.fontSize = '2rem';
            nextBtn.style.background = 'rgba(0,0,0,0.3)';
            nextBtn.style.color = '#fff';
            nextBtn.style.border = 'none';
            nextBtn.style.borderRadius = '50%';
            nextBtn.style.width = '48px';
            nextBtn.style.height = '48px';
            nextBtn.style.cursor = 'pointer';
            nextBtn.onclick = (e) => {
                e.stopPropagation();
                idx = (idx + 1) % allSlideshowImgs.length;
                img.src = allSlideshowImgs[idx];
            };
            lightbox.appendChild(nextBtn);
            // Close on click outside
            lightbox.onclick = () => {
                lightbox.remove();
            };
            document.body.appendChild(lightbox);
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
      const postcode = propertyData.adres?.postcode || '';
      const streetAddress = [straat, huisnummer].filter(Boolean).join(' ');
      const cityPostal = [postcode, plaats].filter(Boolean).join(' ');
      const price = propertyData.financieel?.overdracht?.koopprijs || 0;
      const area = propertyData.algemeen?.woonoppervlakte || '';
      const rooms = propertyData.algemeen?.aantalKamers || '';
      const energy = propertyData.algemeen?.energieklasse || '';

      // Card Title (Street + Number)
      const title = document.createElement('p');
      title.textContent = streetAddress || 'Onbekend adres';
      title.className = 'brantjes-card-title';
      // City + Postal code
      const city = document.createElement('p');
      city.textContent = cityPostal;
      city.className = 'brantjes-card-city';
      // Price
      const priceP = document.createElement('p');
      priceP.innerHTML = `<span class="brantjes-card-price-numbers">€ ${price.toLocaleString('nl-NL')}</span> <span class="brantjes-card-price-kk">k.k.</span>`;
      priceP.className = 'brantjes-card-price';
      // Details pill (area, rooms)
      const detailsPill = document.createElement('div');
      detailsPill.className = 'brantjes-card-details-pill';
      detailsPill.innerHTML =
        (area ? `<span title=\"Woonoppervlakte\"><svg style='vertical-align:middle' width='18' height='18' viewBox='0 0 576 512'><path fill='white' d='M64 112a16 16 0 1 0 0-32 16 16 0 1 0 0 32zm24 43.3V356.7c16 6.5 28.9 19.3 35.3 35.3H324.7c6.5-16 19.3-28.9 35.3-35.3V155.3c-16-6.5-28.9-19.3-35.3-35.3H123.3c-6.5 16-19.3 28.9-35.3 35.3zM123.3 440c-9.5 23.5-32.5 40-59.3 40c-35.3 0-64-28.7-64-64c0-26.9 16.5-49.9 40-59.3V155.3C16.5 145.9 0 122.9 0 96C0 60.7 28.7 32 64 32c26.9 0 49.9 16.5 59.3 40H324.7c9.5-23.5 32.5-40 59.3-40c35.3 0 64 28.7 64 64c0 26.9-16.5 49.9-40 59.3V356.7c23.5 9.5 40 32.5 40 59.3c0 35.3-28.7 64-64 64c-26.9 0-49.9-16.5-59.3-40H123.3zM80 416a16 16 0 1 0 -32 0 16 16 0 1 0 32 0zm320 0a16 16 0 1 0 -32 0 16 16 0 1 0 32 0zm0-320a16 16 0 1 0 -32 0 16 16 0 1 0 32 0z'></path></svg> ${area} m²</span>` : '') +
        (rooms ? ` <span title=\"Kamers\"><svg style='vertical-align:middle' width='18' height='18' viewBox='0 0 640 512'><path fill='white' d='M32 80V205.8c14.5-7.7 30.8-12.4 48-13.6l0-.3V160c0-17.7 14.3-32 32-32h96c17.7 0 32 14.3 32 32v32h32V160c0-17.7 14.3-32 32-32h96c17.7 0 32 14.3 32 32v32l0 .3c17.2 1.1 33.5 5.9 48 13.6V80c0-26.5-21.5-48-48-48H80C53.5 32 32 53.5 32 80zM88 224c-48.6 0-88 39.4-88 88v80 64c0 13.3 10.7 24 24 24s24-10.7 24-24V416H464v40c0 13.3 10.7 24 24 24s24-10.7 24-24V392 312c0-48.6-39.4-88-88-88H88zM464 368H48V312c0-22.1 17.9-40 40-40H424c22.1 0 40 17.9 40 40v56z'></path></svg> ${rooms}</span>` : '');

      // Clear info and append in new order
      info.innerHTML = '';
      info.appendChild(title);
      info.appendChild(city);
      info.appendChild(priceP);
      info.appendChild(detailsPill);
      overlay.appendChild(info);
      cardInner.appendChild(overlay);

      // Add image overlay for hover effect
      const imgOverlay = document.createElement('div');
      imgOverlay.className = 'brantjes-img-hover-overlay';
      cardInner.appendChild(imgOverlay);

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
