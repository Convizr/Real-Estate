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

    if (!Array.isArray(properties) || properties.length === 0) {
      element.innerHTML = `<p>No properties available.</p>`;
      return;
    }

    // Create stylesheet
    const style = document.createElement('style');
    style.innerHTML = `
      .brantjes-carousel-container {
        position: relative;
        width: 100%;
        max-width: 800px;
        margin: auto;
        overflow: hidden;
        padding: 40px 0;
      }
      .brantjes-carousel-track {
        display: flex;
        transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .brantjes-property-card {
        flex: 0 0 33.33%;
        max-width: 33.33%;
        padding: 10px;
        box-sizing: border-box;
        transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s;
        transform: scale(0.85);
        opacity: 0.7;
        position: relative;
      }
      .brantjes-property-card.active {
        transform: scale(1);
        opacity: 1;
        z-index: 10;
      }
      .brantjes-property-card-inner {
        position: relative;
        overflow: hidden;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        width: 100%;
        color: white;
      }
      .brantjes-property-card-inner img {
        width: 100%;
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
      }
      .brantjes-viewing-button {
        background: #1E7FCB;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.2s, transform 0.3s ease-out;
        width: 100%;
        margin-top: 10px;
        transform: translateY(150%);
        position: absolute;
        left: 0;
        bottom: 15px;
        box-sizing: border-box;
        padding-left: 15px;
        padding-right: 15px;
      }
      .brantjes-property-card.active:hover .brantjes-viewing-button {
        transform: translateY(0);
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
      @media (max-width: 768px) {
        .brantjes-property-card {
          flex: 0 0 70%;
          max-width: 70%;
        }
        .brantjes-nav-prev { left: 5px; }
        .brantjes-nav-next { right: 5px; }
        .brantjes-modal-container {
          width: 95%;
          padding: 1.5rem;
          max-height: 90vh;
          overflow-y: auto;
        }
        .detail-popup-content {
          grid-template-columns: 1fr; /* Stack vertically */
        }
        .booking-form {
          grid-template-columns: 1fr; /* Stack vertically */
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

    properties.forEach((property, index) => {
      const card = document.createElement('div');
      card.className = 'brantjes-property-card';
      card.dataset.index = index;

      const cardInner = document.createElement('div');
      cardInner.className = 'brantjes-property-card-inner';

      const img = document.createElement('img');
      img.src = property.fields?.Image?.[0]?.url || '';

      const overlay = document.createElement('div');
      overlay.className = 'brantjes-card-overlay';

      const info = document.createElement('div');
      info.className = 'brantjes-card-info';
      
      const title = document.createElement('p');
      title.textContent = property.fields?.['Property Name'] || 'Unknown Property';

      const price = document.createElement('p');
      price.textContent = `€ ${property.fields?.Price?.toLocaleString('nl-NL') || '0'} k.k.`;

      const viewingButton = document.createElement('button');
      viewingButton.className = 'brantjes-viewing-button';
      viewingButton.textContent = 'Bezichtigen';
      viewingButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent card click from firing
        showBookingModal(property);
      });

      info.appendChild(title);
      info.appendChild(price);
      overlay.appendChild(info);
      
      cardInner.appendChild(img);
      cardInner.appendChild(overlay);
      cardInner.appendChild(viewingButton);
      card.appendChild(cardInner);
      
      card.addEventListener('click', () => {
        showDetailModal(property);
      });

      carouselTrack.appendChild(card);
    });

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

    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'brantjes-dots-container';
    properties.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.className = 'brantjes-dot';
        dot.dataset.index = index;
        dot.setAttribute('aria-label', `Go to property ${index + 1}`);
        dot.addEventListener('click', () => {
            currentIndex = index;
            updateCarousel();
            resetAutoPlay();
        });
        dotsContainer.appendChild(dot);
    });
    element.appendChild(dotsContainer);

    let currentIndex = 0;
    let autoPlayInterval = null;

    function resetAutoPlay() {
      stopAutoPlay();
      startAutoPlay();
    }

    function showNext() {
      currentIndex = (currentIndex < properties.length - 1) ? currentIndex + 1 : 0;
      updateCarousel();
      resetAutoPlay();
    }

    function showPrev() {
      currentIndex = (currentIndex > 0) ? currentIndex - 1 : properties.length - 1;
      updateCarousel();
      resetAutoPlay();
    }
    
    function startAutoPlay(delay = 5000) {
      stopAutoPlay();
      autoPlayInterval = setInterval(showNext, delay);
    }

    function stopAutoPlay() {
      clearInterval(autoPlayInterval);
    }

    prevButton.addEventListener('click', showPrev);
    nextButton.addEventListener('click', showNext);
    
    carouselContainer.addEventListener('mouseenter', stopAutoPlay);
    carouselContainer.addEventListener('mouseleave', startAutoPlay);

    function handleKeyDown(e) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        showPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        showNext();
      }
    }
    carouselContainer.addEventListener('keydown', handleKeyDown);

    function updateCarousel() {
      const cards = carouselTrack.querySelectorAll('.brantjes-property-card');
      if (cards.length === 0) return;
      
      const cardWidth = cards[0].offsetWidth;
      // Center the track by offsetting it by half the container width minus half a card width
      const offset = -currentIndex * cardWidth + (carouselContainer.offsetWidth / 2) - (cardWidth / 2);

      carouselTrack.style.transform = `translateX(${offset}px)`;

      cards.forEach((card, index) => {
        if (index === currentIndex) {
          card.classList.add('active');
        } else {
          card.classList.remove('active');
        }
      });

      const dots = dotsContainer.querySelectorAll('.brantjes-dot');
      dots.forEach((dot, index) => {
          dot.classList.toggle('active', index === currentIndex);
      });
    }

    // A short delay before the initial setup to ensure layout is calculated
    setTimeout(() => {
        updateCarousel();
        startAutoPlay();
        window.addEventListener('resize', updateCarousel);
    }, 100);

    // Cleanup when the element is removed from the DOM
    const observer = new MutationObserver((mutations, obs) => {
      if (!document.body.contains(element)) {
        stopAutoPlay();
        window.removeEventListener('resize', updateCarousel);
        carouselContainer.removeEventListener('keydown', handleKeyDown);
        obs.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  },
};
