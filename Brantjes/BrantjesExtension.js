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
    // Card sizes
    const CARD_WIDTH = 201;
    const CARD_GAP = 8;
    const CONTAINER_WIDTH = 650;

    style.innerHTML = `
      .brantjes-carousel-container {
        position: relative;
        width: 650px;
        height: 420px;
        margin: auto;
        overflow: hidden;
        padding: 0;
        background: transparent;
      }
      .brantjes-carousel-track {
        display: flex;
        align-items: center;
        height: 100%;
        transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        gap: ${CARD_GAP}px;
        will-change: transform;
      }
      .brantjes-property-card {
        width: ${CARD_WIDTH}px;
        height: 335px;
        margin: 0;
        box-sizing: border-box;
        transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s;
        border-radius: 8px;
        background: #fff;
        border: 5px solid #fff;
        box-shadow: 0px 0px 4px 0px rgba(0,0,0,0.15);
        overflow: visible;
        display: flex;
        align-items: flex-end;
        opacity: 0.7;
        z-index: 1;
      }
      .brantjes-property-card.active {
        transform: scale(1.05);
        opacity: 1;
        z-index: 10;
      }
      .brantjes-property-card:not(.active) {
        transform: scale(0.92);
        opacity: 0.7;
        z-index: 1;
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
        background: #1E7FCB;
        color: white;
        border: none;
        width: 112px;
        height: 15px;
        display: block;
        margin: 10px auto 0 auto;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.2s, transform 0.3s ease-out;
        transform: translateY(150%);
        position: absolute;
        left: 50%;
        bottom: 15px;
        box-sizing: border-box;
        padding: 0;
        transform: translate(-50%, 150%);
      }
      .brantjes-property-card.active:hover .brantjes-viewing-button {
        transform: translate(-50%, 0);
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
        .brantjes-property-card, .brantjes-property-card.active {
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
        .brantjes-property-card, .brantjes-property-card.active {
          width: 80vw;
          min-width: 100px;
          height: 60vw;
          min-height: 120px;
        }
      }
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
            <input type="text" id="property" name="property" value="${property.fields['Property Name']}" readonly>
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
    
    // Create carousel structure
    const carouselContainer = document.createElement('div');
    carouselContainer.className = 'brantjes-carousel-container';
    carouselContainer.setAttribute('tabindex', '0'); // For keyboard navigation
    carouselContainer.setAttribute('aria-label', 'Property Recommendations Carousel');

    const carouselTrack = document.createElement('div');
    carouselTrack.className = 'brantjes-carousel-track';

    // --- MODERN FLEX SLIDER LOGIC ---
    let currentIndex = 0;
    let isTransitioning = false;

    function mod(n, m) {
      return ((n % m) + m) % m;
    }

    function renderCarouselCards() {
      while (carouselTrack.firstChild) {
        carouselTrack.removeChild(carouselTrack.firstChild);
      }
      const N = properties.length;
      for (let idx = 0; idx < N; idx++) {
        const property = properties[idx];
        const card = document.createElement('div');
        card.className = 'brantjes-property-card';
        if (idx === currentIndex) card.classList.add('active');
        card.dataset.index = idx;
        // Card inner
        const cardInner = document.createElement('div');
        cardInner.className = 'brantjes-property-card-inner';
        // Get first available image, prioritizing HOOFDFOTO
        let imgUrl = '';
        if (Array.isArray(property.media)) {
          let imgObj = property.media.find(m => m.vrijgave && m.mimetype && m.mimetype.startsWith('image/') && m.soort === 'HOOFDFOTO');
          if (!imgObj) {
            imgObj = property.media.find(m => m.vrijgave && m.mimetype && m.mimetype.startsWith('image/'));
          }
          if (imgObj) {
            imgUrl = imgObj.link;
            if (imgUrl) {
              imgUrl += imgUrl.includes('?') ? '&resize=4' : '?resize=4';
            }
          }
        }
        const img = document.createElement('img');
        img.src = imgUrl;
        img.alt = 'Woning foto';
        cardInner.appendChild(img);
        // Overlay
        const overlay = document.createElement('div');
        overlay.className = 'brantjes-card-overlay';
        const info = document.createElement('div');
        info.className = 'brantjes-card-info';
        const straat = property.adres?.straat || '';
        const huisnummer = property.adres?.huisnummer?.hoofdnummer || '';
        const plaats = property.adres?.plaats || '';
        const address = [straat, huisnummer, plaats].filter(Boolean).join(' ');
        const price = property.financieel?.overdracht?.koopprijs || 0;
        const energy = property.algemeen?.energieklasse || '';
        const area = property.algemeen?.woonoppervlakte || '';
        const rooms = property.algemeen?.aantalKamers || '';
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
        // Viewing button
        const viewingButton = document.createElement('button');
        viewingButton.className = 'brantjes-viewing-button';
        viewingButton.textContent = 'Bezichtigen';
        viewingButton.style.display = (idx === currentIndex) ? '' : 'none';
        viewingButton.addEventListener('click', (e) => {
          e.stopPropagation();
          showBookingModal(property);
        });
        cardInner.appendChild(viewingButton);
        card.appendChild(cardInner);
        card.addEventListener('click', () => {
          showDetailModal(property);
        });
        carouselTrack.appendChild(card);
      }
      updateCarouselTrackPosition();
    }

    function updateCarouselTrackPosition() {
      // Center the current card in the container
      const N = properties.length;
      const centerOffset = (CONTAINER_WIDTH - CARD_WIDTH) / 2;
      const translateX = centerOffset - (currentIndex * (CARD_WIDTH + CARD_GAP));
      carouselTrack.style.transform = `translateX(${translateX}px)`;
    }

    function slideToNext() {
      if (isTransitioning) return;
      isTransitioning = true;
      currentIndex = mod(currentIndex + 1, properties.length);
      renderCarouselCards();
      setTimeout(() => { isTransitioning = false; }, 400);
    }

    function slideToPrev() {
      if (isTransitioning) return;
      isTransitioning = true;
      currentIndex = mod(currentIndex - 1, properties.length);
      renderCarouselCards();
      setTimeout(() => { isTransitioning = false; }, 400);
    }

    const prevButton = document.createElement('button');
    prevButton.className = 'brantjes-nav-button brantjes-nav-prev';
    prevButton.innerHTML = '&lsaquo;';
    prevButton.setAttribute('aria-label', 'Previous Property');

    const nextButton = document.createElement('button');
    nextButton.className = 'brantjes-nav-button brantjes-nav-next';
    nextButton.innerHTML = '&rsaquo;';
    nextButton.setAttribute('aria-label', 'Next Property');

    carouselContainer.appendChild(carouselTrack);
    carouselContainer.appendChild(prevButton);
    carouselContainer.appendChild(nextButton);
    element.appendChild(carouselContainer);

    prevButton.addEventListener('click', slideToPrev);
    nextButton.addEventListener('click', slideToNext);

    // Initial render
    renderCarouselCards();
    window.addEventListener('resize', updateCarouselTrackPosition);
  },
};
