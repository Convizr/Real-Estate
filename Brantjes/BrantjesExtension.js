export const BrantjesExtension = {
  name: 'Brantjes',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_brantjes_recommendation' ||
    (trace.payload && trace.payload.name === 'ext_brantjes_recommendation'),
  render: ({ trace, element }) => {
    console.log('Rendering BrantjesExtension');

    // --- Parse payload ---
    let payloadObj;
    if (typeof trace.payload === 'string') {
      try { payloadObj = JSON.parse(trace.payload); }
      catch (e) { console.error('Error parsing trace.payload:', e); return; }
    } else {
      payloadObj = trace.payload || {};
    }
    let properties = payloadObj.properties;
    if (typeof properties === 'string') {
      try { properties = JSON.parse(properties); }
      catch (e) { console.error('Error parsing properties:', e); properties = []; }
    }
    if (properties?.resultaten && Array.isArray(properties.resultaten)) {
      properties = properties.resultaten;
    }
    if (!Array.isArray(properties) || properties.length === 0) {
      element.innerHTML = `<p>No properties available.</p>`;
      return;
    }

    // --- Constants for hero‑centered carousel ---
    const VISIBLE      = 3;
    const CARD_WIDTH   = 219;
    const CARD_MARGIN  = 18;
    const SLIDE_SIZE   = CARD_WIDTH + CARD_MARGIN;
    const centerOffset = (SLIDE_SIZE * VISIBLE) / 2 - (SLIDE_SIZE / 2);

    // --- Inject styles ---
    const style = document.createElement('style');
    style.innerHTML = `
      .brantjes-carousel-container {
        position: relative;
        overflow: hidden;
        width: ${SLIDE_SIZE * VISIBLE}px;
        height: 420px;
        margin: auto;
      }
      .brantjes-carousel-track {
        display: flex;
        will-change: transform;
        height: 100%;
        transition: transform 0.6s cubic-bezier(0.16,1,0.3,1);
      }
      .brantjes-property-card {
        flex: 0 0 ${CARD_WIDTH}px;
        margin: 0 ${CARD_MARGIN/2}px;
        transition: transform 0.6s cubic-bezier(0.16,1,0.3,1), opacity 0.6s cubic-bezier(0.16,1,0.3,1);
        opacity: 0.6;
        transform: scale(0.85);
        position: relative;
        border-radius: 8px;
        background: #fff;
        box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        cursor: pointer;
        overflow: hidden;
      }
      .brantjes-property-card.active {
        opacity: 1;
        transform: scale(1);
      }
      .brantjes-property-card-inner {
        position: relative;
        width: 100%;
        height: 100%;
      }
      .brantjes-property-card-inner img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .brantjes-card-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 15px;
        background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
        color: white;
      }
      .brantjes-card-info p { margin: 0 0 5px; }
      .brantjes-card-info p:first-child { font-weight: bold; }
      .brantjes-viewing-button {
        position: absolute;
        bottom: 10px;
        left: 50%;
        transform: translateX(-50%);
        background: #1E7FCB;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
      }
      .brantjes-property-card.active .brantjes-viewing-button {
        opacity: 1;
        pointer-events: auto;
      }
      .brantjes-nav-button {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(255,255,255,0.8);
        border: none;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
      }
      .brantjes-nav-prev { left: 10px; }
      .brantjes-nav-next { right: 10px; }
      /* Modal Styles */
      .brantjes-modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      .brantjes-modal-backdrop.visible { opacity: 1; }
      .brantjes-modal-container {
        background: white;
        border-radius: 8px;
        padding: 20px;
        max-width: 90%;
        max-height: 90%;
        overflow: auto;
        transform: scale(0.9);
        transition: transform 0.3s ease;
      }
      .brantjes-modal-backdrop.visible .brantjes-modal-container { transform: scale(1); }
      .brantjes-modal-close {
        position: absolute;
        top: 10px;
        right: 10px;
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: #333;
      }
    `;
    element.appendChild(style);

    // --- Modal helpers ---
    function openModal(contentEl) {
      const backdrop = document.createElement('div'); backdrop.className = 'brantjes-modal-backdrop';
      const modal = document.createElement('div'); modal.className = 'brantjes-modal-container';
      const closeBtn = document.createElement('button'); closeBtn.className = 'brantjes-modal-close'; closeBtn.innerHTML = '&times;';
      closeBtn.addEventListener('click', () => backdrop.remove());
      backdrop.addEventListener('click', e => e.target === backdrop && backdrop.remove());
      modal.appendChild(closeBtn);
      modal.appendChild(contentEl);
      backdrop.appendChild(modal);
      element.appendChild(backdrop);
      requestAnimationFrame(() => backdrop.classList.add('visible'));
    }
    function showDetailModal(prop) {
      const div = document.createElement('div');
      div.innerHTML = `
        <div class="detail-popup-content">
          <img src="${prop.fields?.Image?.[0]?.url||''}" style="width:100%; border-radius:8px;" />
          <h2>${prop.fields['Property Name']}</h2>
          <p>${prop.fields.Address||''}</p>
          <p>€ ${prop.fields.Price?.toLocaleString('nl-NL')||'0'} k.k.</p>
        </div>`;
      openModal(div);
    }
    function showBookingModal(prop) {
      const div = document.createElement('div');
      div.innerHTML = `
        <h2>Bezichtigen Aanvragen</h2>
        <form style="display:grid; gap:10px;">
          <label>Woning<input name="property" value="${prop.fields['Property Name']}" readonly /></label>
          <label>Voorkeursdag<select name="day"><option>Geen voorkeur</option><option>Maandag</option></select></label>
          <label>Dagdeel<select name="time"><option>Ochtend</option><option>Middag</option></select></label>
          <label>Bericht<textarea name="message"></textarea></label>
          <label>Voornaam<input name="first_name" required /></label>
          <label>Achternaam<input name="last_name" required /></label>
          <label>E-mail<input type="email" name="email" required /></label>
          <label>Telefoon<input type="tel" name="phone" required /></label>
          <button type="submit">Verzend</button>
        </form>`;
      const form = div.querySelector('form');
      form.addEventListener('submit', e => {
        e.preventDefault();
        if (window.vfrc) window.vfrc.send({ type:'request', payload:{ type:'extension', name:'brantjes_booking_request', path:'success', payload:Object.fromEntries(new FormData(form).entries()) } });
        openModal(document.createElement('div').append(document.createTextNode('Verzonden!')));
      });
      openModal(div);
    }

    // --- Carousel setup ---
    const realSlides = properties;
    const total      = realSlides.length;
    let currentIndex = 1;
    let isTransitioning = false;

    const containerDiv = document.createElement('div');
    containerDiv.className = 'brantjes-carousel-container';
    element.appendChild(containerDiv);
    const track = document.createElement('div'); track.className='brantjes-carousel-track'; containerDiv.appendChild(track);

    function createCard(prop) {
      const card = document.createElement('div'); card.className='brantjes-property-card';
      const inner = document.createElement('div'); inner.className='brantjes-property-card-inner';
      const img = document.createElement('img'); img.src = prop.media?.[0]?.link||''; inner.appendChild(img);
      const ov = document.createElement('div'); ov.className='brantjes-card-overlay';
      const info = document.createElement('div'); info.className='brantjes-card-info';
      info.innerHTML = `<p>${prop.adres?.straat||''}</p><p>€ ${(prop.financieel?.overdracht?.koopprijs||0).toLocaleString('nl-NL')} k.k.</p>`;
      ov.appendChild(info); inner.appendChild(ov);
      const btn = document.createElement('button'); btn.className='brantjes-viewing-button'; btn.textContent='Bezichtigen'; btn.addEventListener('click', e=>{ e.stopPropagation(); showBookingModal(prop); });
      inner.appendChild(btn);
      card.appendChild(inner);
      card.addEventListener('click', ()=> showDetailModal(prop));
      return card;
    }
    const slides = [createCard(realSlides[total-1]), ...realSlides.map(createCard), createCard(realSlides[0])];
    slides.forEach(s=>track.appendChild(s));

    function updateTrack(animate=true) {
      if (!animate) track.style.transition='none';
      const x = -currentIndex * SLIDE_SIZE + centerOffset;
      track.style.transform=`translate3d(${x}px,0,0)`;
      if (!animate) { track.offsetHeight; requestAnimationFrame(()=>track.style.transition='transform 0.6s cubic-bezier(0.16,1,0.3,1)'); }
      Array.from(track.children).forEach((c,i)=>c.classList.toggle('active', i===currentIndex));
    }
    function navigate(delta) { if(isTransitioning) return; isTransitioning=true; currentIndex+=delta; updateTrack(); }
    const prevBtn = document.createElement('button');
    prevBtn.className='brantjes-nav-button brantjes-nav-prev'; prevBtn.innerHTML='&lsaquo;'; containerDiv.appendChild(prevBtn);
    const nextBtn = document.createElement('button');
    nextBtn.className='brantjes-nav-button brantjes-nav-next'; nextBtn.innerHTML='&rsaquo;'; containerDiv.appendChild(nextBtn);
    prevBtn.addEventListener('click',()=>navigate(-1)); nextBtn.addEventListener('click',()=>navigate(1));

    track.addEventListener('transitionend',()=>{ isTransitioning=false; track.style.transition='none'; if(currentIndex===0) currentIndex=total; else if(currentIndex===total+1) currentIndex=1; updateTrack(false); });
    updateTrack(false);
  }
};
