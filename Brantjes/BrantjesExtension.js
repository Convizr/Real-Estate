export const BrantjesExtension = {
  name: 'Brantjes',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_brantjes_recommendation' ||
    (trace.payload && trace.payload.name === 'ext_brantjes_recommendation'),
  render: ({ trace, element }) => {
    console.log('Rendering BrantjesExtension');

    // Helper function to format city names to proper case
    function formatCityName(cityName) {
      if (!cityName) return '';
      return cityName.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    }

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
    // --- FIX: If properties is a single object, wrap it in an array ---
    if (properties && !Array.isArray(properties)) {
      properties = [properties];
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
        width: 95vw;
        max-width: 615px;
        min-width: 300px;
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
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        height: 90vh;
        z-index: 1000;
        display: flex;
        flex-direction: row;
        align-items: center; /* Center vertically */
        justify-content: center; /* Center horizontally */
        opacity: 0;
        transition: opacity 0.3s ease;
        overflow-y: auto;
        overflow-x: hidden;
      }
      .brantjes-modal-backdrop.visible {
        opacity: 1;
      }
      .brantjes-modal-container {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        width: 98%;
        max-width: 98vw;
        height: auto;
        max-height: 80vh;
        overflow-y: auto;
        margin: 0; /* Remove any margin that could affect centering */
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
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
        display: flex;
        flex-direction: column;
        gap: 24px;
      }
      .detail-popup-header {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .detail-popup-header-row {
        display: flex;
        flex-direction: row;
        align-items: center;
        flex-wrap: nowrap;
        gap: 1.2rem;
        margin-top: 0.2rem;
        width: 100%;
      }
      .detail-popup-header-details {
        /*font-size: 1.08rem;*/
        color: #222;
        font-weight: 700;
        margin-right: 1.2rem;
        white-space: nowrap;
      }
      .detail-popup-header-price {
        /*font-size: 1.08rem;*/
        font-weight: 700;
        color: #222;
        margin: 0;
        line-height: 1.1;
        margin-right: 1.2rem;
        white-space: nowrap;
      }
      .detail-popup-header-energy {
        margin-top: 0;
        margin-left: 0.5rem;
        display: inline-flex;
        align-items: center;
        vertical-align: middle;
      }
      .detail-popup-dot {
        display: inline-block;
        margin: 0 0.5rem;
        color: #bdbdbd;
        font-size: 1.2em;
        vertical-align: middle;
        font-weight: bold;
      }
      .detail-popup-header-viewing-btn {
        background: #51b2df;
        color: #fff;
        border: none;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 600;
        padding: 0.5em 1.5em;
        margin-left: 0;
        cursor: pointer;
        transition: background 0.2s;
        box-shadow: 0 2px 8px rgba(30,127,203,0.08);
        display: flex;
        align-items: center;
        height: 2.2em;
      }
      .detail-popup-header-viewing-btn:hover {
        background: #166BB5;
      }
      .detail-popup-images-row {
        display: flex;
        flex-direction: row;
        gap: 10px;
        align-items: flex-end;
        margin-bottom: 0;
      }
      .detail-popup-main-image {
        width: 320px;
        height: 240px;
        min-width: 320px;
        max-width: 320px;
        max-height: 240px;
        border-radius: 10px;
        overflow: hidden;
        display: flex;
        /* align-items: flex-start; */
        align-items: stretch;
        justify-content: center;
        position: relative;
        align-self: flex-end;
      }
      .detail-popup-main-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 10px;
      }
      .detail-popup-main-image-counter {
        position: absolute;
        bottom: 8px;
        right: 12px;
        background: rgba(0,0,0,0.55);
        color: #fff;
        font-size: 0.8rem;
        padding: 2px 10px;
        border-radius: 12px;
        font-weight: 500;
        z-index: 2;
      }
      .detail-popup-thumbnails {
        display: grid;
        grid-template-columns: 150px 150px;
        grid-template-rows: 115px 115px;
        gap: 10px;
        align-items: end;
        height: 240px;
        justify-content: flex-start;
        position: relative;
      }
      .detail-popup-thumbnail {
        width: 150px;
        height: 115px;
        background-size: cover;
        background-position: center;
        border-radius: 8px;
        cursor: pointer;
        box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        opacity: 0;
        transition: opacity 0.35s cubic-bezier(0.22, 1, 0.36, 1);
        position: absolute;
        pointer-events: none;
      }
      .detail-popup-thumbnail.fade-in {
        opacity: 1;
        position: static;
        pointer-events: auto;
      }
      .detail-popup-info-row {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 6px;
        flex-wrap: wrap;
      }
      .detail-popup-title {
        font-size: 1.1rem;
        font-weight: 700;
        color: #51b2df;
        margin: 0 0 2px 0;
        line-height: 1.1;
        flex: 2 1 0;
        min-width: 120px;
      }
      .detail-popup-address {
        font-size: 0.95rem;
        color: #222;
        margin-right: 8px;
        flex: 1 1 0;
        min-width: 80px;
      }
      .detail-popup-broker {
        font-size: 0.95rem;
        color: #222;
        margin-right: 8px;
        flex: 1 1 0;
        min-width: 80px;
      }
      .detail-popup-energy {
        margin-right: 8px;
        flex: 0 0 auto;
      }
      .detail-popup-price {
        font-size: 1.05rem;
        font-weight: 700;
        color: #222;
        text-align: right;
        flex: 0 0 auto;
        min-width: 80px;
      }
      .detail-popup-info {
        width: 100%;
        min-width: 0;
        overflow: hidden;
        padding-top: 0;
        display: flex;
        flex-direction: column;
        gap: 0;
      }
      .detail-popup-info h2 {
        display: none;
      }

      /* Booking Form Layout */
      .booking-form-content h2 {
        color: #51b2df;
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
        outline: 2px solid #51b2df;
        border-color: #51b2df;
      }
      .booking-form .submit-btn {
        background: #51b2df;
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
      @media (max-width: 600px) {
        .brantjes-carousel-container {
          width: 70vw;
          height: 115vw;
        }
        .brantjes-property-card {
          width: 60vw;
          max-width: 380px;
          height: 430px;
        }
        .brantjes-property-card.active {
          width: 60vw;
          max-width: 380px;
          height: 430px;
        }
        /* Show navigation buttons for hero card view */
        .brantjes-nav-button {
          display: flex;
          width: 45px;
          height: 45px;
          font-size: 20px;
        }
      }
      
      @media (max-width: 400px) {
        .brantjes-carousel-container {
          width: 70vw;
          height: 115vw;
        }
        .brantjes-property-card {
          width: 60vw;
          max-width: 380px;
          height: 430px;
        }
        .brantjes-property-card.active {
          width: 60vw;
          max-width: 380px;
          height: 430px;
        }
        /* Show navigation buttons */
        .brantjes-nav-button {
          display: flex;
          width: 50px;
          height: 50px;
          font-size: 22px;
        }
      }
      
      @media (max-width: 350px) {
        .brantjes-carousel-container {
          width: 70vw;
          height: 115vw;
        }
        .brantjes-property-card {
          width: 60vw;
          max-width: 360px;
          height: 430px;
        }
        .brantjes-property-card.active {
          width: 60vw;
          max-width: 360px;
          height: 430px;
        }
        /* Show navigation buttons */
        .brantjes-nav-button {
          display: flex;
          width: 55px;
          height: 55px;
          font-size: 24px;
        }
      }
      
      /* Responsive positioning for carousel cards */
      @media (max-width: 500px) {
        .brantjes-carousel-list .prev,
        .brantjes-carousel-list .next {
          opacity: 0;
          visibility: hidden;
        }
      }
      
      /* Landscape orientation adjustments */
      @media (max-width: 600px) and (orientation: landscape) {
        .brantjes-carousel-container {
          width: 95vw;
          max-width: 95vw;
          height: 360px;
        }
        .brantjes-property-card {
          width: 240px;
          height: 280px;
        }
        .brantjes-property-card.active {
          width: 240px;
          height: 280px;
        }
        /* Show navigation buttons */
        .brantjes-nav-button {
          display: flex;
          width: 40px;
          height: 40px;
          font-size: 20px;
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

      /* Card energy label styles (restore original) */
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

      /* Detail page header energy label (independent) */
      .energy-label-detail {
        display: inline-flex;
        align-items: center;
        height: 26px;
        padding: 0 12px 0 10px;
        font-size: 1rem;
        font-weight: bold;
        color: #fff;
        border-radius: 6px 0 0 6px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.10);
        margin-left: 0.5rem;
        line-height: 1.1;
        position: relative;
        background: #1EC773;
        overflow: visible;
      }
      .energy-label-detail::after {
        content: '';
        position: absolute;
        right: -14px;
        top: 0;
        width: 0;
        height: 0;
        border-top: 13px solid transparent;
        border-bottom: 13px solid transparent;
        border-left: 14px solid #1EC773;
        border-radius: 0;
        margin-left: 0;
        z-index: 2;
      }
      .energy-label-detail-A { background: #1EC773; }
      .energy-label-detail-A::after { border-left-color: #1EC773; }
      .energy-label-detail-B { background: #8DD800; }
      .energy-label-detail-B::after { border-left-color: #8DD800; }
      .energy-label-detail-C { background: #F7D900; color: #333; }
      .energy-label-detail-C::after { border-left-color: #F7D900; }
      .energy-label-detail-D { background: #F7A600; }
      .energy-label-detail-D::after { border-left-color: #F7A600; }
      .energy-label-detail-E { background: #F76B1C; }
      .energy-label-detail-E::after { border-left-color: #F76B1C; }
      .energy-label-detail-F { background: #E2001A; }
      .energy-label-detail-F::after { border-left-color: #E2001A; }
      .energy-label-detail-G { background: #A50021; }
      .energy-label-detail-G::after { border-left-color: #A50021; }

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
        padding: 15px 15px 22px 15px;
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

      .brantjes-modal-container,
      .brantjes-modal-container * {
        font-family: 'Soleto Trial', 'Soleto', 'Montserrat', 'Roboto', sans-serif !important;
      }

      .detail-popup-title-main {
        font-size: 1.8rem;
        font-weight: 700;
        color: #1E7FCB !important;
        margin: 0 0 0.2em 0;
        display: block;
      }

      .detail-popup-specs-row {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8rem;
        margin: 0;
        flex-wrap: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        width: 100%;
      }

      .brantjes-booking-form {
        background: #eaf6fa;
        border-radius: 10px;
        padding: 24px 18px 18px 18px;
        font-size: 15px;
        color: #222;
        margin: 0;
        width: 100%;
        box-sizing: border-box;
      }
      .brantjes-booking-form label {
        font-weight: 600;
        margin-bottom: 4px;
        display: block;
      }
      .brantjes-booking-form input,
      .brantjes-booking-form select,
      .brantjes-booking-form textarea {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #c7e0ed;
        border-radius: 7px;
        background: #fff;
        font-size: 15px;
        margin-bottom: 12px;
        box-sizing: border-box;
        font-family: inherit;
        transition: border 0.2s;
      }
      .brantjes-booking-form input:focus,
      .brantjes-booking-form select:focus,
      .brantjes-booking-form textarea:focus {
        border: 1.5px solid #1E7FCB;
        outline: none;
      }
      .brantjes-booking-form .form-row {
        display: flex;
        gap: 12px;
      }
      .brantjes-booking-form .form-row > div {
        flex: 1 1 0;
      }
      .brantjes-booking-form .form-group {
        margin-bottom: 10px;
      }
      .brantjes-booking-form .form-group.checkbox {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin-bottom: 8px;
      }
      .brantjes-booking-form .form-group.checkbox label {
        font-weight: 400;
        margin-bottom: 0;
        flex: 1;
        text-align: left;
      }
      .brantjes-booking-form .submit-btn {
        background: #1E7FCB;
        color: #fff;
        border: none;
        border-radius: 7px;
        font-size: 15px;
        font-weight: 600;
        padding: 10px 28px;
        cursor: pointer;
        margin-top: 10px;
        transition: background 0.2s;
      }
      .brantjes-booking-form .submit-btn:hover {
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

      /* Card energy label styles (restore original) */
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

      /* Detail page header energy label (independent) */
      .energy-label-detail {
        display: inline-flex;
        align-items: center;
        height: 26px;
        padding: 0 12px 0 10px;
        font-size: 1rem;
        font-weight: bold;
        color: #fff;
        border-radius: 6px 0 0 6px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.10);
        margin-left: 0.5rem;
        line-height: 1.1;
        position: relative;
        background: #1EC773;
        overflow: visible;
      }
      .energy-label-detail::after {
        content: '';
        position: absolute;
        right: -14px;
        top: 0;
        width: 0;
        height: 0;
        border-top: 13px solid transparent;
        border-bottom: 13px solid transparent;
        border-left: 14px solid #1EC773;
        border-radius: 0;
        margin-left: 0;
        z-index: 2;
      }
      .energy-label-detail-A { background: #1EC773; }
      .energy-label-detail-A::after { border-left-color: #1EC773; }
      .energy-label-detail-B { background: #8DD800; }
      .energy-label-detail-B::after { border-left-color: #8DD800; }
      .energy-label-detail-C { background: #F7D900; color: #333; }
      .energy-label-detail-C::after { border-left-color: #F7D900; }
      .energy-label-detail-D { background: #F7A600; }
      .energy-label-detail-D::after { border-left-color: #F7A600; }
      .energy-label-detail-E { background: #F76B1C; }
      .energy-label-detail-E::after { border-left-color: #F76B1C; }
      .energy-label-detail-F { background: #E2001A; }
      .energy-label-detail-F::after { border-left-color: #E2001A; }
      .energy-label-detail-G { background: #A50021; }
      .energy-label-detail-G::after { border-left-color: #A50021; }

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
        padding: 15px 15px 22px 15px;
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

      .brantjes-modal-container,
      .brantjes-modal-container * {
        font-family: 'Soleto Trial', 'Soleto', 'Montserrat', 'Roboto', sans-serif !important;
      }

      .detail-popup-title-main {
        font-size: 1.8rem;
        font-weight: 700;
        color: #1E7FCB !important;
        margin: 0 0 0.2em 0;
        display: block;
      }

      .detail-popup-specs-row {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8rem;
        margin: 0;
        flex-wrap: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        width: 100%;
      }

      .brantjes-booking-form {
        background: #eaf6fa;
        border-radius: 10px;
        padding: 24px 18px 18px 18px;
        font-size: 15px;
        color: #222;
        margin: 0;
        width: 100%;
        box-sizing: border-box;
      }
      .brantjes-booking-form label {
        font-weight: 600;
        margin-bottom: 4px;
        display: block;
      }
      .brantjes-booking-form input,
      .brantjes-booking-form select,
      .brantjes-booking-form textarea {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #c7e0ed;
        border-radius: 7px;
        background: #fff;
        font-size: 15px;
        margin-bottom: 12px;
        box-sizing: border-box;
        font-family: inherit;
        transition: border 0.2s;
      }
      .brantjes-booking-form input:focus,
      .brantjes-booking-form select:focus,
      .brantjes-booking-form textarea:focus {
        border: 1.5px solid #1E7FCB;
        outline: none;
      }
      .brantjes-booking-form .form-row {
        display: flex;
        gap: 12px;
      }
      .brantjes-booking-form .form-row > div {
        flex: 1 1 0;
      }
      .brantjes-booking-form .form-group {
        margin-bottom: 10px;
      }
      .brantjes-booking-form .form-group.checkbox {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin-bottom: 8px;
      }
      .brantjes-booking-form .form-group.checkbox label {
        font-weight: 400;
        margin-bottom: 0;
        flex: 1;
        text-align: left;
      }
      .brantjes-booking-form .submit-btn {
        background: #1E7FCB;
        color: #fff;
        border: none;
        border-radius: 7px;
        font-size: 15px;
        font-weight: 600;
        padding: 10px 28px;
        cursor: pointer;
        margin-top: 10px;
        transition: background 0.2s;
      }
      .brantjes-booking-form .submit-btn:hover {
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

      /* Card energy label styles (restore original) */
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

      /* Detail page header energy label (independent) */
      .energy-label-detail {
        display: inline-flex;
        align-items: center;
        height: 26px;
        padding: 0 12px 0 10px;
        font-size: 1rem;
        font-weight: bold;
        color: #fff;
        border-radius: 6px 0 0 6px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.10);
        margin-left: 0.5rem;
        line-height: 1.1;
        position: relative;
        background: #1EC773;
        overflow: visible;
      }
      .energy-label-detail::after {
        content: '';
        position: absolute;
        right: -14px;
        top: 0;
        width: 0;
        height: 0;
        border-top: 13px solid transparent;
        border-bottom: 13px solid transparent;
        border-left: 14px solid #1EC773;
        border-radius: 0;
        margin-left: 0;
        z-index: 2;
      }
      .energy-label-detail-A { background: #1EC773; }
      .energy-label-detail-A::after { border-left-color: #1EC773; }
      .energy-label-detail-B { background: #8DD800; }
      .energy-label-detail-B::after { border-left-color: #8DD800; }
      .energy-label-detail-C { background: #F7D900; color: #333; }
      .energy-label-detail-C::after { border-left-color: #F7D900; }
      .energy-label-detail-D { background: #F7A600; }
      .energy-label-detail-D::after { border-left-color: #F7A600; }
      .energy-label-detail-E { background: #F76B1C; }
      .energy-label-detail-E::after { border-left-color: #F76B1C; }
      .energy-label-detail-F { background: #E2001A; }
      .energy-label-detail-F::after { border-left-color: #E2001A; }
      .energy-label-detail-G { background: #A50021; }
      .energy-label-detail-G::after { border-left-color: #A50021; }

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
        padding: 15px 15px 22px 15px;
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

      .brantjes-modal-container,
      .brantjes-modal-container * {
        font-family: 'Soleto Trial', 'Soleto', 'Montserrat', 'Roboto', sans-serif !important;
      }

      .detail-popup-title-main {
        font-size: 1.8rem;
        font-weight: 700;
        color: #1E7FCB !important;
        margin: 0 0 0.2em 0;
        display: block;
      }

      .detail-popup-specs-row {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8rem;
        margin: 0;
        flex-wrap: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        width: 100%;
      }

      .brantjes-booking-form {
        background: #eaf6fa;
        border-radius: 10px;
        padding: 24px 18px 18px 18px;
        font-size: 15px;
        color: #222;
        margin: 0;
        width: 100%;
        box-sizing: border-box;
      }
      .brantjes-booking-form label {
        font-weight: 600;
        margin-bottom: 4px;
        display: block;
      }
      .brantjes-booking-form input,
      .brantjes-booking-form select,
      .brantjes-booking-form textarea {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #c7e0ed;
        border-radius: 7px;
        background: #fff;
        font-size: 15px;
        margin-bottom: 12px;
        box-sizing: border-box;
        font-family: inherit;
        transition: border 0.2s;
      }
      .brantjes-booking-form input:focus,
      .brantjes-booking-form select:focus,
      .brantjes-booking-form textarea:focus {
        border: 1.5px solid #1E7FCB;
        outline: none;
      }
      .brantjes-booking-form .form-row {
        display: flex;
        gap: 12px;
      }
      .brantjes-booking-form .form-row > div {
        flex: 1 1 0;
      }
      .brantjes-booking-form .form-group {
        margin-bottom: 10px;
      }
      .brantjes-booking-form .form-group.checkbox {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin-bottom: 8px;
      }
      .brantjes-booking-form .form-group.checkbox label {
        font-weight: 400;
        margin-bottom: 0;
        flex: 1;
        text-align: left;
      }
      .brantjes-booking-form .submit-btn {
        background: #1E7FCB;
        color: #fff;
        border: none;
        border-radius: 7px;
        font-size: 15px;
        font-weight: 600;
        padding: 10px 28px;
        cursor: pointer;
        margin-top: 10px;
        transition: background 0.2s;
      }
      .brantjes-booking-form .submit-btn:hover {
        background: #166BB5;
      }
      .brantjes-booking-form .section-title {
        color: #1E7FCB;
        font-size: 1.3em;
        font-weight: 700;
        margin: 18px 0 10px 0;
        display: block;
      }
      .brantjes-booking-form .required {
        color: #E2001A;
        margin-left: 2px;
        font-weight: 700;
      }
      .brantjes-modal-container,
      .brantjes-modal-container * {
        box-sizing: border-box;
      }
      .brantjes-modal-container {
        max-width: 98vw;
        overflow-x: hidden;
      }
      .brantjes-modal-container img {
        max-width: 100%;
        height: auto;
        display: block;
      }
      .brantjes-modal-container table {
        width: 100%;
        table-layout: fixed;
        overflow-x: auto;
        display: block;
      }
      .brantjes-booking-form .form-group.full-width,
      .brantjes-booking-form .form-group.checkbox {
        grid-column: 1 / -1;
      }

      .checkbox-row {
        display: flex;
        align-items: flex-start;
        width: 100%;
        gap: 10px;
        margin-bottom: 14px;
      }
      .checkbox-row:last-child {
        margin-bottom: 0;
      }
      .checkbox-col {
        flex: 0 0 24px;
        display: flex;
        align-items: flex-start;
        justify-content: flex-start;
        padding-top: 3px;
      }
      .checkbox-col input[type="checkbox"] {
        width: 18px;
        height: 18px;
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        vertical-align: top;
        appearance: auto;
      }
      .label-col {
        flex: 1 1 0%;
        min-width: 0;
      }
      .checkbox-label {
        display: block;
        font-weight: 400;
        text-align: left;
        word-break: break-word;
        font-size: 15px;
        margin-bottom: 0;
        white-space: normal;
        overflow-wrap: break-word;
      }

      .brantjes-booking-form,
      .brantjes-booking-form * {
        writing-mode: horizontal-tb !important;
        text-orientation: mixed !important;
        transform: none !important;
        rotate: none !important;
        direction: ltr !important;
      }

      /* Search Nearby Button - Bigger and centered version of viewing button */
      .search-nearby-btn {
        background: #51b2df;
        color: #fff;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        padding: 12px 32px;
        cursor: pointer;
        transition: background 0.2s;
        box-shadow: 0 2px 8px rgba(30,127,203,0.08);
        display: inline-block;
        margin: 0 auto;
        min-width: 200px;
      }
      .search-nearby-btn:hover {
        background: #166BB5;
      }
      
      /* MOBILE RESPONSIVE OVERRIDES - HIGHEST PRIORITY */
      @media (max-width: 600px) {
        .brantjes-carousel-list .brantjes-property-card {
          width: 60vw !important;
          max-width: 380px !important;
          height: 430px !important;
        }
        .brantjes-carousel-list .act {
          width: 60vw !important;
          max-width: 380px !important;
          height: 430px !important;
        }
        .brantjes-carousel-list .prev,
        .brantjes-carousel-list .next {
          opacity: 0 !important;
          visibility: hidden !important;
        }
      }
      
      @media (max-width: 400px) {
        .brantjes-carousel-list .brantjes-property-card {
          width: 60vw !important;
          max-width: 380px !important;
          height: 430px !important;
        }
        .brantjes-carousel-list .act {
          width: 60vw !important;
          max-width: 380px !important;
          height: 430px !important;
        }
        .brantjes-carousel-list .prev,
        .brantjes-carousel-list .next {
          opacity: 0 !important;
          visibility: hidden !important;
        }
      }
      
      @media (max-width: 350px) {
        .brantjes-carousel-list .brantjes-property-card {
          width: 60vw !important;
          max-width: 360px !important;
          height: 430px !important;
        }
        .brantjes-carousel-list .act {
          width: 60vw !important;
          max-width: 360px !important;
          height: 430px !important;
        }
        .brantjes-carousel-list .prev,
        .brantjes-carousel-list .next {
          opacity: 0 !important;
          visibility: hidden !important;
        }
      }
      
      /* FORCE OVERRIDE FOR CONFLICTING CSS */
      @media (max-width: 600px) {
        .brantjes-carousel-container {
          width: 70vw !important;
          height: 115vw !important;
        }
        /* Faster transitions for mobile */
        .brantjes-carousel-list .brantjes-property-card {
          transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s, width 0.3s, height 0.3s !important;
        }
        .brantjes-carousel-list .hide,
        .brantjes-carousel-list .new-next {
          transition: opacity 0.2s, transform 0.2s !important;
        }
      }

      /* MOBILE RESPONSIVE MODAL STYLES - HIGHEST PRIORITY */
      @media (max-width: 768px), (max-device-width: 768px), (max-width: 480px) {
        .brantjes-modal-container .detail-popup-main-image {
          width: 100% !important;
          max-width: 100% !important;
          min-width: auto !important;
          height: auto !important;
          max-height: none !important;
          margin-bottom: 16px !important;
          display: block !important;
          position: relative !important;
          align-self: stretch !important;
        }
        
        .brantjes-modal-container .detail-popup-main-image img {
          width: 100% !important;
          height: auto !important;
          max-height: 300px !important;
          object-fit: cover !important;
          display: block !important;
        }
        
        .brantjes-modal-container .detail-popup-thumbnails {
          width: 100% !important;
          max-width: 100% !important;
          display: grid !important;
          grid-template-columns: repeat(4, 1fr) !important;
          grid-template-rows: repeat(2, 1fr) !important;
          gap: 8px !important;
          height: 120px !important;
          margin-top: 0 !important;
          position: static !important;
          align-items: stretch !important;
          justify-content: stretch !important;
        }
        
        .brantjes-modal-container .detail-popup-thumbnail {
          width: 100% !important;
          height: 100% !important;
          position: static !important;
          opacity: 1 !important;
          pointer-events: auto !important;
          background-size: cover !important;
          background-position: center !important;
          background-repeat: no-repeat !important;
          border-radius: 6px !important;
          cursor: pointer !important;
        }
        
        .brantjes-modal-container .detail-popup-images-row {
          flex-direction: column !important;
          align-items: center !important;
          gap: 16px !important;
          margin-top: 24px !important;
        }
        
        .brantjes-modal-container .detail-popup-header-row {
          flex-direction: column !important;
          gap: 12px !important;
        }
        
        /* Mobile-specific header styling */
        .brantjes-modal-container .detail-popup-header-details {
          font-size: 1rem !important;
          white-space: normal !important;
          flex: 1 !important;
          min-width: 0 !important;
          max-width: 100% !important;
          overflow-wrap: break-word !important;
          word-wrap: break-word !important;
        }
        
        .brantjes-modal-container .detail-popup-header-price {
          font-size: 1rem !important;
          white-space: normal !important;
          flex-shrink: 0 !important;
          max-width: 100% !important;
          overflow-wrap: break-word !important;
          word-wrap: break-word !important;
        }
        
        .brantjes-modal-container .detail-popup-header-viewing-btn {
          font-size: 18px !important;
          padding: 0.4em 1.2em !important;
          height: 2em !important;
          flex-shrink: 0 !important;
          white-space: nowrap !important;
          width: 80% !important;
        }
        
        /* Mobile-specific specs row styling */
        .brantjes-modal-container .detail-popup-specs-row {
          justify-content: center !important;
          gap: 16px !important;
          flex-wrap: wrap !important;
        }
        
        .brantjes-modal-container .detail-popup-specs-row span {
          font-size: 14px !important;
          white-space: nowrap !important;
        }
        
        /* Mobile-specific title styling */
        .brantjes-modal-container .detail-popup-title-main {
          font-size: 1.4rem !important;
          line-height: 1.2 !important;
          word-break: break-word !important;
        }
        
        /* Mobile-specific modal container adjustments */
        .brantjes-modal-container {
          padding: 1rem !important;
          max-width: 95vw !important;
          max-height: 90vh !important;
        }
        
        /* Mobile-specific content spacing */
        .brantjes-modal-container .detail-popup-content {
          gap: 16px !important;
        }
        
        /* Mobile-specific description styling */
        .brantjes-modal-container .detail-popup-content > div:not(.detail-popup-header):not(.detail-popup-images-row):not(.detail-popup-specs-row) {
          font-size: 14px !important;
          line-height: 1.5 !important;
        }
        
        /* Mobile-specific table styling */
        .brantjes-modal-container table {
          font-size: 0.8rem !important;
        }
        
        .brantjes-modal-container table td {
          padding: 2px 4px !important;
        }
        
        /* Mobile-specific button styling */
        .brantjes-modal-container .search-nearby-btn {
          font-size: 14px !important;
          padding: 10px 24px !important;
          min-width: 180px !important;
        }
        
        /* Mobile-specific booking modal styling */
        .brantjes-modal-container .booking-modal h2 {
          font-size: 1.2rem !important;
          line-height: 1.3 !important;
        }
        
        .brantjes-modal-container .booking-modal h3 {
          font-size: 1rem !important;
          line-height: 1.3 !important;
        }
        
        .brantjes-modal-container .booking-modal input,
        .brantjes-modal-container .booking-modal select,
        .brantjes-modal-container .booking-modal textarea {
          font-size: 14px !important;
          padding: 8px 12px !important;
        }
        
        .brantjes-modal-container .booking-modal label {
          font-size: 14px !important;
          margin-bottom: 4px !important;
        }
        
        .brantjes-modal-container .booking-modal .checkbox-label {
          font-size: 12px !important;
          line-height: 1.4 !important;
        }
      }

      /* DESKTOP MODAL STYLES - RESTORE ORIGINAL LAYOUT */
      @media (min-width: 769px), (min-device-width: 769px) {
        .brantjes-modal-container .detail-popup-main-image {
          width: 350px !important;
          height: 240px !important;
          min-width: 320px !important;
          max-width: 350px !important;
          max-height: 240px !important;
          margin-bottom: 0 !important;
          display: flex !important;
          position: relative !important;
          align-self: flex-end !important;
        }
        
        .brantjes-modal-container .detail-popup-main-image img {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          display: block !important;
        }
        
        .brantjes-modal-container .detail-popup-thumbnails {
          display: grid !important;
          grid-template-columns: 150px 150px !important;
          grid-template-rows: 115px 115px !important;
          gap: 10px !important;
          align-items: end !important;
          height: 240px !important;
          justify-content: flex-start !important;
          position: relative !important;
        }
        
        .brantjes-modal-container .detail-popup-thumbnail {
          width: 150px !important;
          height: 115px !important;
          position: absolute !important;
          opacity: 0 !important;
          pointer-events: none !important;
          background-size: cover !important;
          background-position: center !important;
          border-radius: 8px !important;
          cursor: pointer !important;
          transition: opacity 0.35s cubic-bezier(0.22, 1, 0.36, 1) !important;
        }
        
        .brantjes-modal-container .detail-popup-thumbnail.fade-in {
          opacity: 1 !important;
          position: static !important;
          pointer-events: auto !important;
        }
        
        .brantjes-modal-container .detail-popup-images-row {
          flex-direction: row !important;
          align-items: flex-end !important;
          gap: 10px !important;
          margin-top: 16px !important;
        }
        
        .brantjes-modal-container .detail-popup-header-row {
          flex-direction: row !important;
          align-items: center !important;
          justify-content: space-between !important;
          gap: 0.3rem !important;
          display: flex !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }
        
        /* Fix images row width for desktop */
        .brantjes-modal-container .detail-popup-images-row {
          max-width: 100% !important;
          width: 100% !important;
          box-sizing: border-box !important;
          overflow: visible !important;
        }
        
        /* Adjust image sizes to fit container */
        .brantjes-modal-container .detail-popup-main-image {
          width: 3500px !important;
          min-width: 280px !important;
          max-width: 350px !important;
        }
        
        .brantjes-modal-container .detail-popup-thumbnails {
          grid-template-columns: 130px 130px !important;
          grid-template-rows: 115px 115px !important;
          gap: 8px !important;
          height: 240px !important;
        }
        
        .brantjes-modal-container .detail-popup-thumbnail {
          width: 130px !important;
          height: 115px !important;
        }
        
        /* Restore original desktop font sizes */
        .brantjes-modal-container .detail-popup-title-main {
          font-size: 1.2rem !important;
          line-height: 1.1 !important;
        }
        
        .brantjes-modal-container .detail-popup-header-details {
          font-size: 0.8rem !important;
          white-space: nowrap !important;
          font-weight: normal !important;
          line-height: 1.2 !important;
        }
        
        .brantjes-modal-container .detail-popup-header-price {
          font-size: 0.9rem !important;
          white-space: nowrap !important;
          font-weight: normal !important;
          line-height: 1.2 !important;
        }
        
        /* Override any conflicting general styles */
        .brantjes-modal-container .detail-popup-header-price,
        .brantjes-modal-container .detail-popup-header-details {
          font-size: 0.8rem !important;
          font-weight: normal !important;
          line-height: 1.2 !important;
          margin: 0 !important;
          color: inherit !important;
        }
        
        /* Force override with maximum specificity */
        .brantjes-modal-container .detail-popup-header .detail-popup-header-price,
        .brantjes-modal-container .detail-popup-header .detail-popup-header-details {
          font-size: 0.9rem !important;
          font-weight: normal !important;
          line-height: 1.2 !important;
          margin: 0 !important;
          color: inherit !important;
        }
        
        /* Shadow DOM penetration - use :host and ::part if available */
        :host .brantjes-modal-container .detail-popup-header-price,
        :host .brantjes-modal-container .detail-popup-header-details {
          font-size: 0.8rem !important;
          font-weight: normal !important;
          line-height: 1.2 !important;
          margin: 0 !important;
          color: inherit !important;
        }
        
        /* Universal override for shadow DOM */
        * .detail-popup-header-price,
        * .detail-popup-header-details {
          font-size: 0.9rem !important;
          font-weight: normal !important;
          line-height: 1.2 !important;
          margin: 0 !important;
          color: inherit !important;
        }
        
        /* Target specific elements with maximum specificity */
        .detail-popup-header-row .detail-popup-header-price,
        .detail-popup-header-row .detail-popup-header-details {
          font-size: 0.9rem !important;
          font-weight: normal !important;
          line-height: 1.2 !important;
          margin: 0 !important;
          color: inherit !important;
        }
        
        .detail-popup-header-viewing-btn {
          font-size: 13px !important;
          padding: 0.4em 1.2em !important;
          height: 2em !important;
        }
        
        .detail-popup-specs-row span {
          font-size: 0.8rem !important;
          white-space: nowrap !important;
        }
        
        .brantjes-modal-container .energy-label-detail {
          font-size: 0.8rem !important;
          height: 22px !important;
          padding: 0 10px 0 8px !important;
        }
        
        .brantjes-modal-container .energy-label-detail::after {
          border-top: 11px solid transparent !important;
          border-bottom: 11px solid transparent !important;
          border-left: 12px solid #FFD700 !important;
          right: -12px !important;
          content: "" !important;
        }
        
        .brantjes-modal-container .energy-label-detail-C::after {
          border-left-color: #FFD700 !important;
          border-left-style: solid !important;
        }
        
        /* Force energy label colors for all browsers */
        .brantjes-modal-container .energy-label-detail::after {
          border-left-color: #FFD700 !important;
          border-left-style: solid !important;
        }
        
        /* Specific energy label colors for Chromium */
        .brantjes-modal-container .energy-label-detail-A::after {
          border-left-color: #1EC773 !important;
          border-left-style: solid !important;
        }
        
        .brantjes-modal-container .energy-label-detail-B::after {
          border-left-color: #8DD800 !important;
          border-left-style: solid !important;
        }
        
        .brantjes-modal-container .energy-label-detail-C::after {
          border-left-color: #F7D900 !important;
          border-left-style: solid !important;
        }
        
        .brantjes-modal-container .energy-label-detail-D::after {
          border-left-color: #F7A600 !important;
          border-left-style: solid !important;
        }
        
        .brantjes-modal-container .energy-label-detail-E::after {
          border-left-color: #F76B1C !important;
          border-left-style: solid !important;
        }
        
        .brantjes-modal-container .energy-label-detail-F::after {
          border-left-color: #E2001A !important;
          border-left-style: solid !important;
        }
        
        .brantjes-modal-container .energy-label-detail-G::after {
          border-left-color: #A50021 !important;
          border-left-style: solid !important;
        }
        
        .brantjes-modal-container .detail-popup-header-viewing-btn {
          font-size: 13px !important;
          padding: 0.4em 1.2em !important;
          height: 2em !important;
        }
        
        .brantjes-modal-container .detail-popup-specs-row {
          justify-content: flex-start !important;
          flex-wrap: nowrap !important;
        }
        
        .brantjes-modal-container .detail-popup-specs-row span {
          font-size: 0.7em !important;
          white-space: nowrap !important;
        }
        
        .brantjes-modal-container .detail-popup-content {
          gap: 24px !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: flex-start !important;
        }
        
        .brantjes-modal-container .detail-popup-content > div:not(.detail-popup-images-row):not(.detail-popup-specs-row) {
          text-align: left !important;
          width: 100% !important;
          max-width: 100% !important;
        }
        
        .brantjes-modal-container table {
          text-align: left !important;
          width: 100% !important;
          max-width: 100% !important;
        }
        
        .brantjes-modal-container table td {
          text-align: left !important;
        }
        
        .brantjes-modal-container .detail-popup-content > div:not(.detail-popup-header):not(.detail-popup-images-row):not(.detail-popup-specs-row) {
          font-size: 15px !important;
          line-height: 1.6 !important;
        }
        
        .brantjes-modal-container table {
          font-size: 0.6rem !important;
        }
        
        .brantjes-modal-container table td {
          padding: 3px 8px !important;
        }
        
        .brantjes-modal-container .search-nearby-btn {
          font-size: 16px !important;
          padding: 12px 32px !important;
          min-width: 200px !important;
          display: block !important;
          margin: 0 auto !important;
        }
      }
    `;
    element.appendChild(style);
    
    // Inject CSS into shadow DOM if it exists
    function injectCSSIntoShadowDOM() {
      const shadowRoots = document.querySelectorAll('*');
      shadowRoots.forEach(el => {
        if (el.shadowRoot) {
          const shadowStyle = document.createElement('style');
          shadowStyle.textContent = `
            @media (min-width: 769px), (min-device-width: 769px) {
              .detail-popup-header-price,
              .detail-popup-header-details {
                font-size: 0.9rem !important;
                font-weight: normal !important;
                line-height: 1.2 !important;
                margin: 0 !important;
                color: inherit !important;
              }
              
              .detail-popup-header-row .detail-popup-header-price,
              .detail-popup-header-row .detail-popup-header-details {
                font-size: 0.9rem !important;
                font-weight: normal !important;
                line-height: 1.2 !important;
                margin: 0 !important;
                color: inherit !important;
              }
              
              .detail-popup-header-viewing-btn {
                font-size: 13px !important;
                padding: 0.4em 1.2em !important;
                height: 2em !important;
              }
              
              .detail-popup-specs-row span {
                font-size: 0.7em !important;
                white-space: nowrap !important;
              }
              
              /* Energy label arrow colors for all grades */
              .energy-label-detail-A::after {
                border-left-color: #1EC773 !important;
                border-left-style: solid !important;
              }
              
              .energy-label-detail-B::after {
                border-left-color: #8DD800 !important;
                border-left-style: solid !important;
              }
              
              .energy-label-detail-C::after {
                border-left-color: #F7D900 !important;
                border-left-style: solid !important;
              }
              
              .energy-label-detail-D::after {
                border-left-color: #F7A600 !important;
                border-left-style: solid !important;
              }
              
              .energy-label-detail-E::after {
                border-left-color: #F76B1C !important;
                border-left-style: solid !important;
              }
              
              .energy-label-detail-F::after {
                border-left-color: #E2001A !important;
                border-left-style: solid !important;
              }
              
              .energy-label-detail-G::after {
                border-left-color: #A50021 !important;
                border-left-style: solid !important;
              }
            }
          `;
          el.shadowRoot.appendChild(shadowStyle);
        }
      });
    }
    
    // Run immediately and also on DOM changes
    injectCSSIntoShadowDOM();
    
    // Watch for new shadow DOM elements
    const observer = new MutationObserver(() => {
      injectCSSIntoShadowDOM();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // --- MODAL FUNCTIONS (UNCHANGED) ---
    function openModal(contentElement) {
        let modalBackdrop = element.querySelector('.brantjes-modal-backdrop');
        if (!modalBackdrop) {
            modalBackdrop = document.createElement('div');
            modalBackdrop.className = 'brantjes-modal-backdrop';
            element.appendChild(modalBackdrop);
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
        // Track original indices for counter
        const allImgs = [];
        const mainImgObj = media.find(m => m.vrijgave && m.soort === 'HOOFDFOTO' && m.mimetype && m.mimetype.startsWith('image/'))
            || media.find(m => m.vrijgave && m.mimetype && m.mimetype.startsWith('image/'));
        if (mainImgObj) allImgs.push({ url: mainImgObj.link, originalIndex: allImgs.length });
        media.filter(m => m.vrijgave && m.soort === 'FOTO' && m.mimetype && m.mimetype.startsWith('image/'))
            .forEach(f => {
                if (!allImgs.some(img => img.url === f.link)) allImgs.push({ url: f.link, originalIndex: allImgs.length });
            });
        let imageList = [...allImgs];

        // --- MODAL CONTENT ---
        const detailContent = document.createElement('div');
        detailContent.className = 'detail-popup-content';

        // --- HEADER SECTION (Brantjes style) ---
        const header = document.createElement('div');
        header.className = 'detail-popup-header';
        // Title (street + number)
        const straat = property.adres?.straat || '';
        const huisnummer = property.adres?.huisnummer?.hoofdnummer || '';
        const streetAddress = [straat, huisnummer].filter(Boolean).join(' ');
        const titleMain = document.createElement('h1');
        titleMain.className = 'detail-popup-title-main';
        titleMain.textContent = streetAddress || 'Onbekend adres';
        header.appendChild(titleMain);

        // Row: address, energy label, price, viewing button
        const headerRow = document.createElement('div');
        headerRow.className = 'detail-popup-header-row';

        // Address (postal code + city)
        const plaats = property.adres?.plaats || '';
        const postcode = property.adres?.postcode || '';
        let hasAddress = Boolean(postcode || plaats);
        let hasEnergy = Boolean(property.algemeen?.energieklasse);
        if (hasAddress) {
          const addrSpan = document.createElement('span');
          addrSpan.className = 'detail-popup-header-details';
          addrSpan.textContent = `${postcode} ${formatCityName(plaats)}`.trim();
          addrSpan.style.fontWeight = 'bold';
          headerRow.appendChild(addrSpan);
        }
        // Dot separator only if both address and energy label
        if (hasAddress && hasEnergy) {
          const dot = document.createElement('span');
          dot.className = 'detail-popup-dot';
          dot.textContent = '•';
          headerRow.appendChild(dot);
        }
        // Energy label
        if (hasEnergy) {
          const energyDiv = document.createElement('div');
          energyDiv.className = `energy-label-detail energy-label-detail-${property.algemeen.energieklasse} detail-popup-header-energy`;
          energyDiv.textContent = property.algemeen.energieklasse;
          headerRow.appendChild(energyDiv);
          // Dot after energy label
          const dot2 = document.createElement('span');
          dot2.className = 'detail-popup-dot';
          dot2.textContent = '•';
          headerRow.appendChild(dot2);
        }
        // Price
        const price = property.financieel?.overdracht?.koopprijs || 0;
        const priceDiv = document.createElement('div');
        priceDiv.className = 'detail-popup-header-price';
        priceDiv.innerHTML = `€ ${price.toLocaleString('nl-NL')} <span style=\"font-size:0.8rem;font-weight:400;\">k.k.</span>`;
        headerRow.appendChild(priceDiv);
        // Viewing button
        const viewingBtn = document.createElement('button');
        viewingBtn.className = 'detail-popup-header-viewing-btn';
        viewingBtn.textContent = 'Bezichtiging';
        viewingBtn.onclick = () => showBookingModal(property);
        headerRow.appendChild(viewingBtn);
        header.appendChild(headerRow);
        detailContent.appendChild(header);

        // --- IMAGES ROW ---
        const imagesRow = document.createElement('div');
        imagesRow.className = 'detail-popup-images-row';
        // Main image
        const mainImgCol = document.createElement('div');
        mainImgCol.className = 'detail-popup-main-image';
        const mainImg = document.createElement('img');
        mainImg.src = (imageList[0] ? (imageList[0].url + (imageList[0].url.includes('?') ? '&resize=4' : '?resize=4')) : 'https://via.placeholder.com/600x400?text=No+Image');
        mainImg.alt = 'Hoofdfoto';
        mainImgCol.appendChild(mainImg);
        // Image counter
        let counter;
        if (imageList.length > 1) {
            counter = document.createElement('div');
            counter.className = 'detail-popup-main-image-counter';
            counter.textContent = `${imageList[0].originalIndex + 1}/${allImgs.length}`;
            mainImgCol.appendChild(counter);
        }
        imagesRow.appendChild(mainImgCol);
        // Thumbnails
        const thumbsCol = document.createElement('div');
        thumbsCol.className = 'detail-popup-thumbnails';
        function renderThumbnails() {
            thumbsCol.innerHTML = '';
            // Always render 8 thumbnails (4 visible, 4 preloaded invisible)
            const totalThumbs = Math.min(8, imageList.length);
            // Determine the start index for visible thumbs (1-4 in imageList)
            let start = 1;
            // If user has clicked a thumbnail, imageList is rotated so [0] is main, [1-4] are visible
            for (let i = 1; i < totalThumbs; i++) {
                const thumbDiv = document.createElement('div');
                thumbDiv.className = 'detail-popup-thumbnail';
                let thumbUrl = imageList[i].url;
                if (thumbUrl) {
                    thumbUrl += thumbUrl.includes('?') ? '&resize=4' : '?resize=4';
                }
                thumbDiv.style.backgroundImage = `url('${thumbUrl}')`;
                // Position in grid
                let gridPos = i;
                if (gridPos <= 4) {
                  // Visible thumbs
                  thumbDiv.classList.add('fade-in');
                  thumbDiv.style.gridRow = ((gridPos - 1) % 2) + 1;
                  thumbDiv.style.gridColumn = Math.floor((gridPos - 1) / 2) + 1;
                } else {
                  // Preloaded invisible thumbs
                  thumbDiv.style.gridRow = ((gridPos - 1) % 2) + 1;
                  thumbDiv.style.gridColumn = Math.floor((gridPos - 1) / 2) + 1;
                }
                thumbDiv.onclick = () => {
                    // Move all images before this one (including main) to end
                    imageList = imageList.slice(i).concat(imageList.slice(0, i));
                    // Re-render main image and thumbnails
                    mainImg.src = (imageList[0] ? (imageList[0].url + (imageList[0].url.includes('?') ? '&resize=4' : '?resize=4')) : 'https://via.placeholder.com/600x400?text=No+Image');
                    if (counter) {
                        counter.textContent = `${imageList[0].originalIndex + 1}/${allImgs.length}`;
                    }
                    renderThumbnails();
                };
                thumbsCol.appendChild(thumbDiv);
            }
        }
        renderThumbnails();
        imagesRow.appendChild(thumbsCol);
        detailContent.appendChild(imagesRow);

        // --- SPECIFICATIONS ROW (Brantjes style) ---
        const specsRow = document.createElement('div');
        specsRow.className = 'detail-popup-specs-row';

        // Woonoppervlakte
        const woonopp = property.algemeen?.woonoppervlakte;
        if (woonopp) {
          const woonoppSpan = document.createElement('span');
          woonoppSpan.innerHTML = `<strong>${woonopp} m²</strong> woonoppervlakte`;
          specsRow.appendChild(woonoppSpan);
        }
        // Dot
        const dot1 = document.createElement('span');
        dot1.className = 'detail-popup-dot';
        dot1.textContent = '•';
        specsRow.appendChild(dot1);
        // Slaapkamers
        const slaapkamers = property.detail?.etages?.reduce((acc, e) => acc + (e.aantalSlaapkamers || 0), 0) || property.algemeen?.aantalSlaapkamers;
        if (slaapkamers) {
          const slaapSpan = document.createElement('span');
          slaapSpan.innerHTML = `<strong>${slaapkamers}</strong> slaapkamers`;
          specsRow.appendChild(slaapSpan);
        }
        // Dot
        const dot2 = document.createElement('span');
        dot2.className = 'detail-popup-dot';
        dot2.textContent = '•';
        specsRow.appendChild(dot2);
        // Bouwjaar
        const bouwjaar = property.algemeen?.bouwjaar;
        if (bouwjaar) {
          const bouwjaarSpan = document.createElement('span');
          bouwjaarSpan.innerHTML = `Bouwjaar <strong>${bouwjaar}</strong>`;
          specsRow.appendChild(bouwjaarSpan);
        }
        // Dot
        const dot3 = document.createElement('span');
        dot3.className = 'detail-popup-dot';
        dot3.textContent = '•';
        specsRow.appendChild(dot3);
        // Perceel
        const perceel = property.detail?.kadaster?.[0]?.kadastergegevens?.oppervlakte;
        if (perceel) {
          const perceelSpan = document.createElement('span');
          perceelSpan.innerHTML = `<strong>${perceel} m²</strong> perceel`;
          specsRow.appendChild(perceelSpan);
        }

        detailContent.appendChild(specsRow);

        // --- RIGHT: Info ---
        const infoCol = document.createElement('div');
        infoCol.className = 'detail-popup-info';

        // --- Description with 'toon meer' ---
        const desc = property.teksten?.aanbiedingstekst || '';
        const descDiv = document.createElement('div');
        descDiv.style.margin = '16px 0 0 0';
        descDiv.style.fontSize = '15px';
        descDiv.style.color = '#333';
        descDiv.style.lineHeight = '1.6';
        descDiv.style.wordBreak = 'break-word';
        let moreBtn = null;
        let truncated = false;
        let descExpanded = false;
        let shortDesc = desc;
        if (desc.length > 400) {
            shortDesc = desc.slice(0, 400).split('\n').slice(0, 3).join('\n') + '...';
            truncated = true;
        }

        // Helper to render markdown using marked
        function renderMarkdown(md) {
          if (window.marked) {
            descDiv.innerHTML = window.marked.parse(md);
          } else {
            descDiv.textContent = md;
          }
          if (truncated && moreBtn) {
            descDiv.appendChild(moreBtn);
          }
        }

        // Inject marked if not present
        if (!window.marked) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
          script.onload = () => {
            renderMarkdown(truncated ? shortDesc : desc);
          };
          document.head.appendChild(script);
        }

        // Initial render
        renderMarkdown(truncated ? shortDesc : desc);

        if (truncated) {
            moreBtn = document.createElement('button');
            moreBtn.textContent = 'Toon meer';
            moreBtn.style.background = 'none';
            moreBtn.style.color = '#1E7FCB';
            moreBtn.style.border = 'none';
            moreBtn.style.cursor = 'pointer';
            moreBtn.style.fontWeight = 'bold';
            moreBtn.onclick = () => {
                if (!descExpanded) {
                    renderMarkdown(desc);
                    moreBtn.textContent = 'Toon minder';
                    descExpanded = true;
                } else {
                    renderMarkdown(shortDesc);
                    moreBtn.textContent = 'Toon meer';
                    descExpanded = false;
                }
            };
            descDiv.appendChild(moreBtn);
        }
        // Place description after specs row
        detailContent.appendChild(descDiv);

        // --- Compact, expandable specifications table ---
        const specsSections = [
          {
            title: 'Overdracht',
            rows: [
              ['Prijs', `€ ${(property.financieel?.overdracht?.koopprijs || 0).toLocaleString('nl-NL')} k.k.`],
              ['Status', property.financieel?.overdracht?.status || ''],
              ['Aanvaarding', property.financieel?.overdracht?.aanvaarding || ''],
              ['Aangeboden sinds', property.financieel?.overdracht?.aangebodenSinds || ''],
            ]
          },
          {
            title: 'Bouw',
            rows: [
              ['Type object', property.object?.type?.objecttype || ''],
              ['Soort', property.algemeen?.woonhuissoort || ''],
              ['Type', property.algemeen?.woonhuistype || ''],
              ['Bouwjaar', property.algemeen?.bouwjaar || ''],
              ['Dak type', property.detail?.buitenruimte?.daktype || ''],
              ['Isolatievormen', (property.algemeen?.isolatievormen || []).join(', ')],
            ]
          },
          {
            title: 'Oppervlaktes en inhoud',
            rows: [
              ['Perceel', (property.detail?.kadaster?.[0]?.kadastergegevens?.oppervlakte || '') + ' m²'],
              ['Woonoppervlakte', (property.algemeen?.woonoppervlakte || '') + ' m²'],
              ['Inhoud', (property.algemeen?.inhoud || '') + ' m³'],
              ['Buitenruimtes gebouwgebonden of vrijstaand', (property.detail?.buitenruimte?.oppervlakteGebouwgebondenBuitenruimte || '') + ' m²'],
            ]
          },
          {
            title: 'Indeling',
            rows: [
              ['Aantal kamers', property.algemeen?.aantalKamers || ''],
              ['Aantal slaapkamers', property.detail?.etages?.reduce((acc, e) => acc + (e.aantalSlaapkamers || 0), 0) || ''],
            ]
          },
          {
            title: 'Locatie',
            rows: [
              ['Ligging', (property.algemeen?.liggingen || []).join(', ')],
            ]
          },
          {
            title: 'Tuin',
            rows: [
              ['Type', (property.detail?.buitenruimte?.tuintypes || []).join(', ')],
              ['Staat', property.detail?.buitenruimte?.tuinkwaliteit || ''],
              ['Ligging', property.detail?.buitenruimte?.hoofdtuinlocatie || ''],
              ['Achterom', property.detail?.buitenruimte?.hoofdtuinAchterom ? 'Ja' : 'Nee'],
            ]
          },
          {
            title: 'Uitrusting',
            rows: [
              ['Soorten warm water', (property.algemeen?.warmwatersoorten || []).join(', ')],
              ['Parkeer faciliteiten', (property.detail?.buitenruimte?.parkeerfaciliteiten || []).join(', ')],
            ]
          },
        ];

        const specsTable = document.createElement('table');
        specsTable.style.width = '100%';
        specsTable.style.marginTop = '10px';
        specsTable.style.fontSize = '0.85rem';
        specsTable.style.borderCollapse = 'collapse';
        specsTable.style.background = 'white';
        specsTable.style.lineHeight = '1.4';
        specsTable.style.tableLayout = 'fixed';
        specsTable.style.minWidth = '100%';

        // Add compact CSS for the table
        specsTable.innerHTML = '';
        let rowCount = 0;
        let specsExpanded = false;
        const maxRows = 6;
        let totalRows = 0;
        specsSections.forEach(section => totalRows += section.rows.length + 1);

        function renderSpecsTable(expand) {
          specsTable.innerHTML = '';
          let shownRows = 0;
          for (const section of specsSections) {
            // Section header
            const th = document.createElement('tr');
            const thCell = document.createElement('td');
            thCell.colSpan = 2;
            thCell.textContent = section.title;
            thCell.style.fontWeight = 'bold';
            thCell.style.fontSize = '1.1em';
            thCell.style.color = '#1E7FCB';
            thCell.style.padding = '10px 0 4px 0';
            thCell.style.background = 'white';
            th.appendChild(thCell);
            specsTable.appendChild(th);
            for (const [label, value] of section.rows) {
              if (!expand && shownRows >= maxRows) return;
              const tr = document.createElement('tr');
              const td1 = document.createElement('td');
              td1.textContent = label;
              td1.style.fontWeight = 'bold';
              td1.style.padding = '3px 8px 3px 0';
              td1.style.color = '#222';
              td1.style.borderBottom = '1px solid #eee';
              td1.style.background = 'white';
              td1.style.width = '50%';
              const td2 = document.createElement('td');
              td2.textContent = value;
              td2.style.padding = '3px 0 3px 8px';
              td2.style.color = '#444';
              td2.style.borderBottom = '1px solid #eee';
              td2.style.background = 'white';
              td2.style.width = '50%';
              tr.appendChild(td1);
              tr.appendChild(td2);
              specsTable.appendChild(tr);
              shownRows++;
            }
          }
        }

        renderSpecsTable(false);

        // Toon alles button
        let specsBtn = null;
        if (totalRows > maxRows) {
          specsBtn = document.createElement('button');
          specsBtn.textContent = 'Toon alles';
          specsBtn.style.background = 'none';
          specsBtn.style.color = '#1E7FCB';
          specsBtn.style.border = 'none';
          specsBtn.style.cursor = 'pointer';
          specsBtn.style.fontWeight = 'bold';
          specsBtn.style.margin = '8px 0 0 0';
          specsBtn.onclick = () => {
            specsExpanded = !specsExpanded;
            renderSpecsTable(specsExpanded);
            specsBtn.textContent = specsExpanded ? 'Toon minder' : 'Toon alles';
            if (specsBtn.parentNode !== specsTable.parentNode) {
              specsTable.parentNode.appendChild(specsBtn);
            }
          };
        }

        // Place table below description
        detailContent.appendChild(specsTable);
        if (specsBtn) detailContent.appendChild(specsBtn);

        // --- "Zoek in de buurt" button ---
        const searchNearbyDiv = document.createElement('div');
        searchNearbyDiv.style.margin = '20px 0 0 0';
        searchNearbyDiv.style.textAlign = 'center';
        
        const searchNearbyBtn = document.createElement('button');
        searchNearbyBtn.textContent = 'Zoek in de buurt';
        searchNearbyBtn.className = 'search-nearby-btn';
        searchNearbyBtn.onclick = () => {
            // Extract street, house number, and city from property
            const straat = property.adres?.straat || '';
            // hoofdnummer is a string in the API, so use it as-is if present, else empty string
            const huisnummer = (property.adres && property.adres.huisnummer && typeof property.adres.huisnummer.hoofdnummer !== 'undefined' && property.adres.huisnummer.hoofdnummer !== null)
                ? String(property.adres.huisnummer.hoofdnummer) : '';
            const plaats = property.adres?.plaats || '';
            
            // Check if Voiceflow API is available
            if (window.voiceflow && window.voiceflow.chat && window.voiceflow.chat.interact) {
                window.voiceflow.chat.interact({
                    type: 'searchNearby',
                    payload: { 
                        straat: straat,
                        huisnummer: huisnummer,
                        plaats: plaats
                    },
                });
            } else {
                console.warn('Voiceflow API not available');
            }
            
            // Close the detail modal
            const modalBackdrop = element.querySelector('.brantjes-modal-backdrop');
            if (modalBackdrop) {
                modalBackdrop.classList.remove('visible');
                setTimeout(() => {
                    modalBackdrop.remove();
                }, 300); // Allow transition to finish
            }
        };
        
        searchNearbyDiv.appendChild(searchNearbyBtn);
        detailContent.appendChild(searchNearbyDiv);

        detailContent.appendChild(infoCol);

        openModal(detailContent);
    }

    function showBookingModal(property) {
        const bookingContent = document.createElement('div');
        bookingContent.className = 'booking-form-content';
        const address = [property.adres?.straat, property.adres?.huisnummer?.hoofdnummer].filter(Boolean).join(' ');

        // Add Brantjes-style form CSS
        const style = document.createElement('style');
        style.innerHTML = `
          .brantjes-booking-form,
          .brantjes-booking-form * {
            font-family: 'Soleto Trial', 'Soleto', 'Montserrat', 'Roboto', sans-serif !important;
          }
          .brantjes-booking-form {
            background: #eaf6fa;
            border-radius: 10px;
            padding: 24px 18px 18px 18px;
            font-size: 15px;
            color: #222;
            margin: 0;
            width: 100%;
            box-sizing: border-box;
          }
          .brantjes-booking-form label {
            font-weight: 600;
            margin-bottom: 4px;
            display: block;
          }
          .brantjes-booking-form input,
          .brantjes-booking-form select,
          .brantjes-booking-form textarea {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #c7e0ed;
            border-radius: 7px;
            background: #fff;
            font-size: 15px;
            margin-bottom: 12px;
            box-sizing: border-box;
            font-family: inherit;
            transition: border 0.2s;
          }
          .brantjes-booking-form input:focus,
          .brantjes-booking-form select:focus,
          .brantjes-booking-form textarea:focus {
            border: 1.5px solid #1E7FCB;
            outline: none;
          }
          .brantjes-booking-form .form-row {
            display: flex;
            gap: 12px;
          }
          .brantjes-booking-form .form-row > div {
            flex: 1 1 0;
          }
          .brantjes-booking-form .form-group {
            margin-bottom: 10px;
          }
          .brantjes-booking-form .form-group.checkbox {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            margin-bottom: 8px;
          }
          .brantjes-booking-form .form-group.checkbox label {
            font-weight: 400;
            margin-bottom: 0;
            flex: 1;
            text-align: left;
          }
          .brantjes-booking-form .submit-btn {
            background: #1E7FCB;
            color: #fff;
            border: none;
            border-radius: 7px;
            font-size: 15px;
            font-weight: 600;
            padding: 10px 28px;
            cursor: pointer;
            margin-top: 10px;
            transition: background 0.2s;
          }
          .brantjes-booking-form .submit-btn:hover {
            background: #166BB5;
          }
          .brantjes-booking-form .section-title {
            color: #1E7FCB;
            font-size: 1.3em;
            font-weight: 700;
            margin: 18px 0 10px 0;
            display: block;
          }
          .brantjes-booking-form .required {
            color: #E2001A;
            margin-left: 2px;
            font-weight: 700;
          }
        `;
        bookingContent.appendChild(style);

        bookingContent.innerHTML += `
          <form class="brantjes-booking-form">
            <div class="form-group">
              <label for="property-address">Je plant een bezichtiging voor:</label>
              <input type="text" id="property-address" name="property-address" value="${address || ''}" readonly>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="day">Voorkeursdag <span class="required">*</span></label>
                <select id="day" name="day" required>
                  <option value="">Maak een keuze</option>
                  <option value="geen">Geen voorkeur</option>
                  <option value="maandag">Maandag</option>
                  <option value="dinsdag">Dinsdag</option>
                  <option value="woensdag">Woensdag</option>
                  <option value="donderdag">Donderdag</option>
                  <option value="vrijdag">Vrijdag</option>
                </select>
              </div>
              <div class="form-group">
                <label for="partofday">Dagdeel <span class="required">*</span></label>
                <select id="partofday" name="partofday" required>
                  <option value="">Maak een keuze</option>
                  <option value="geen">Geen voorkeur</option>
                  <option value="ochtend">Ochtend</option>
                  <option value="middag">Middag</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label for="message">Jouw bericht</label>
              <textarea id="message" name="message" rows="3" placeholder="Typ hier je bericht..."></textarea>
            </div>
            <span class="section-title">Contactgegevens</span>
            <div class="form-row">
              <div class="form-group">
                <label for="first-name">Voornaam <span class="required">*</span></label>
                <input type="text" id="first-name" name="first-name" placeholder="Typ je voornaam in" required>
              </div>
              <div class="form-group">
                <label for="last-name">Achternaam <span class="required">*</span></label>
                <input type="text" id="last-name" name="last-name" placeholder="Typ je achternaam in" required>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="email">E-mail <span class="required">*</span></label>
                <input type="email" id="email" name="email" placeholder="Typ je e-mailadres in" required>
              </div>
              <div class="form-group">
                <label for="phone">Telefoon <span class="required">*</span></label>
                <input type="tel" id="phone" name="phone" placeholder="Typ je telefoonnummer in" required>
              </div>
            </div>
            <div class="checkbox-row">
              <div class="checkbox-col">
                <input type="checkbox" id="advies-ja" name="advies" value="ja">
              </div>
              <div class="label-col">
                <label for="advies-ja" class="checkbox-label">Brantjes Hypotheken mag mij benaderen voor financieel advies</label>
              </div>
            </div>
            <div class="checkbox-row">
              <div class="checkbox-col">
                <input type="checkbox" id="nieuwsbrief" name="nieuwsbrief">
              </div>
              <div class="label-col">
                <label for="nieuwsbrief" class="checkbox-label">Houd mij periodiek op de hoogte van actualiteiten en nieuws van Brantjes Makelaars in de vorm van een nieuwsbrief of mailing.</label>
              </div>
            </div>
            <div class="checkbox-row">
              <div class="checkbox-col">
                <input type="checkbox" id="privacy" name="privacy" required>
              </div>
              <div class="label-col">
                <label for="privacy" class="checkbox-label"><span style="color: #E2001A; font-weight: bold; margin-right: 4px;">*</span>Bij het gebruiken van dit formulier ga ik akkoord met het opslaan en verwerken van de door mij opgegeven gegevens zoals beschreven in het privacybeleid.</label>
              </div>
            </div>
            <button type="submit" class="submit-btn">Verzend</button>
          </form>
        `;
        // Add robust, modern CSS for the new booking form layout and checkbox alignment
        style.innerHTML += `
          .brantjes-booking-form {
            display: flex;
            flex-direction: column;
            gap: 1.2rem;
            width: 100%;
          }
          .form-row {
            display: flex;
            gap: 1.2rem;
            flex-wrap: wrap;
          }
          .form-group {
            flex: 1 1 200px;
            display: flex;
            flex-direction: column;
          }
          .checkbox-row {
            display: flex;
            align-items: flex-start;
            width: 100%;
            gap: 10px;
          }
          .checkbox-col {
            flex: 0 0 24px;
            display: flex;
            align-items: flex-start;
            justify-content: flex-start;
            padding-top: 3px;
          }
          .checkbox-col input[type="checkbox"] {
            width: 18px;
            height: 18px;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            vertical-align: top;
            appearance: auto;
          }
          .label-col {
            flex: 1 1 0%;
            min-width: 0;
          }
          .checkbox-label {
            display: block;
            font-weight: 400;
            text-align: left;
            word-break: break-word;
            font-size: 15px;
            margin-bottom: 0;
            white-space: normal;
            overflow-wrap: break-word;
          }
        `;

        const bookingForm = bookingContent.querySelector('.brantjes-booking-form');
        if (bookingForm) {
            bookingForm.addEventListener('submit', (e) => {
                e.preventDefault();
                // Collect form values
                const payload = {
                  propertyAddress: bookingForm['property-address']?.value,
                  day: bookingForm['day']?.value,
                  partOfDay: bookingForm['partofday']?.value,
                  message: bookingForm['message']?.value,
                  firstName: bookingForm['first-name']?.value,
                  lastName: bookingForm['last-name']?.value,
                  email: bookingForm['email']?.value,
                  phone: bookingForm['phone']?.value,
                  advies: bookingForm['advies-ja']?.checked,
                  nieuwsbrief: bookingForm['nieuwsbrief']?.checked,
                  privacy: bookingForm['privacy']?.checked
                };
                // Send to VoiceFlow
                if (window.voiceflow && window.voiceflow.chat && window.voiceflow.chat.interact) {
                  window.voiceflow.chat.interact({
                    type: 'complete',
                    payload: payload,
                  });
                }
                // Show green confirmation below the button
                let confirmMsg = bookingForm.querySelector('.booking-confirm-msg');
                if (!confirmMsg) {
                  confirmMsg = document.createElement('div');
                  confirmMsg.className = 'booking-confirm-msg';
                  confirmMsg.style.color = '#1EC773';
                  confirmMsg.style.fontWeight = 'bold';
                  confirmMsg.style.marginTop = '16px';
                  confirmMsg.style.textAlign = 'center';
                  bookingForm.appendChild(confirmMsg);
                }
                confirmMsg.textContent = 'Je bezichtigingsverzoek is verzonden!';
                // Close modal after 5 seconds with fade-out
                setTimeout(() => {
                  const modal = bookingForm.closest('.brantjes-modal-backdrop');
                  if (modal) {
                    modal.classList.add('invisible');
                    setTimeout(() => {
                      modal.remove();
                    }, 350); // match CSS transition duration
                  }
                }, 3000);
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
      const cityPostal = [postcode, formatCityName(plaats)].filter(Boolean).join(' ');
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

      // Make the single card clickable to show details
      card.addEventListener('click', () => {
        showDetailModal(realSlidesData[0]);
      });

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

export const NearbyMap = {
  name: 'NearbyMap',
  type: 'response',

  match: ({ trace }) => trace.type === 'nearby_map',

  render: ({ trace, element }) => {
    // 1) Parse payload with better error handling
    let payload;
    try {
      if (typeof trace.payload === 'string') {
        // Handle escaped newlines and other characters
        let cleanedPayload = trace.payload;
        cleanedPayload = cleanedPayload.replace(/\\n/g, '').replace(/\\r/g, '');
        cleanedPayload = cleanedPayload.replace(/\\"/g, '"');
        // Fix the specific malformed JSON pattern in the last place object
        cleanedPayload = cleanedPayload.replace(/"lng":([0-9.-]+)"(?=,"place_id")/g, '"lng":$1,"');
        // Remove any trailing commas before closing braces/brackets
        cleanedPayload = cleanedPayload.replace(/,(\s*[}\]])/g, '$1');
        // Remove extra comma before place_id in places array
        cleanedPayload = cleanedPayload.replace(/,\s*",\s*"place_id"/g, ',"place_id"');
        console.log('Cleaned payload:', cleanedPayload);
        payload = JSON.parse(cleanedPayload);
      } else {
        payload = trace.payload || {};
      }
    } catch (error) {
      console.error('Error parsing NearbyMap payload:', error);
      console.log('Raw payload:', trace.payload);
      // Try a more aggressive repair approach
      try {
        let repairedPayload = trace.payload;
        repairedPayload = repairedPayload.replace(/\\n/g, '').replace(/\\r/g, '');
        repairedPayload = repairedPayload.replace(/\\"/g, '"');
        // Find and fix the specific malformed pattern
        const lastPlaceMatch = repairedPayload.match(/"lng":([0-9.-]+)"(?=,"place_id")/);
        if (lastPlaceMatch) {
          repairedPayload = repairedPayload.replace(/"lng":([0-9.-]+)"(?=,"place_id")/, '"lng":$1,"');
        }
        // Remove extra comma before place_id in places array
        repairedPayload = repairedPayload.replace(/,\s*",\s*"place_id"/g, ',"place_id"');
        payload = JSON.parse(repairedPayload);
        console.log('Successfully repaired JSON');
      } catch (repairError) {
        console.error('Failed to repair JSON:', repairError);
        element.innerHTML = '<p>Error loading map data. Please try again.</p>';
        return;
      }
    }

    // --- Option 1: Parse places if it's a string ---
    let places = payload.places;
    if (typeof places === 'string') {
      try {
        places = JSON.parse(places);
      } catch (e) {
        console.error('Failed to parse places as JSON:', e);
        places = [];
      }
    }

    // Convert coords from strings → numbers
    const latitude  = parseFloat(payload.latitude);
    const longitude = parseFloat(payload.longitude);
    places = (places || []).map(p => ({
      ...p,
      lat: parseFloat(p.lat),
      lng: parseFloat(p.lng),
    }));
    const apiKey = payload.apiKey;
    // Validate required data
    if (!apiKey) {
      element.innerHTML = '<p>Error: Google Maps API key is missing.</p>';
      return;
    }
    if (isNaN(latitude) || isNaN(longitude)) {
      element.innerHTML = '<p>Error: Invalid coordinates provided.</p>';
      return;
    }

    // 2) Create container
    const mapEl = document.createElement('div');
    mapEl.style.width = '300px';
    mapEl.style.height = '400px';
    element.appendChild(mapEl);

    // 3) Load Google Maps JS
    function loadScript(src) {
      // Prevent loading the script multiple times
      if (window.google && window.google.maps) return Promise.resolve();
      return new Promise(res => {
        const s = document.createElement('script');
        s.src = src + '&libraries=marker'; // include the marker library
        s.async = true; // Load script asynchronously for best practice
        document.head.appendChild(s);
        s.onload = res;
      });
    }

    (async () => {
      try {
        await loadScript(
          `https://maps.googleapis.com/maps/api/js?key=${apiKey}`
        );

        // 4) Init map with static Map ID for Advanced Markers
        const mapOptions = {
          center: { lat: latitude, lng: longitude },
          zoom: 13,
          mapId: '6b7c48eff51d2bc68fb2a1ea'
        };
        const map = new google.maps.Map(mapEl, mapOptions);

        // 5) Home marker (AdvancedMarkerElement) with custom color and provided home SVG icon (centered and visible)
        const homeIcon = document.createElement('div');
        homeIcon.style.position = 'relative';
        homeIcon.style.width = '36px';
        homeIcon.style.height = '36px';
        homeIcon.innerHTML = `
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style="position:absolute;left:0;top:0;"><circle cx="18" cy="18" r="18" fill="#51b2df"/></svg>
          <svg width="24" height="24" viewBox="0 0 495.398 495.398" fill="none" xmlns="http://www.w3.org/2000/svg" style="position:absolute;left:6px;top:6px;">
            <g>
              <g>
                <g>
                  <path d="M487.083,225.514l-75.08-75.08V63.704c0-15.682-12.708-28.391-28.413-28.391c-15.669,0-28.377,12.709-28.377,28.391 v29.941L299.31,37.74c-27.639-27.624-75.694-27.575-103.27,0.05L8.312,225.514c-11.082,11.104-11.082,29.071,0,40.158 c11.087,11.101,29.089,11.101,40.172,0l187.71-187.729c6.115-6.083,16.893-6.083,22.976-0.018l187.742,187.747 c5.567,5.551,12.825,8.312,20.081,8.312c7.271,0,14.541-2.764,20.091-8.312C498.17,254.586,498.17,236.619,487.083,225.514z" fill="#fff"></path>
                  <path d="M257.561,131.836c-5.454-5.451-14.285-5.451-19.723,0L72.712,296.913c-2.607,2.606-4.085,6.164-4.085,9.877v120.401 c0,28.253,22.908,51.16,51.16,51.16h81.754v-126.61h92.299v126.61h81.755c28.251,0,51.159-22.907,51.159-51.159V306.79 c0-3.713-1.465-7.271-4.085-9.877L257.561,131.836z" fill="#fff"></path>
                </g>
              </g>
            </g>
          </svg>
        `;
        new google.maps.marker.AdvancedMarkerElement({
          map,
          position: { lat: latitude, lng: longitude },
          title: 'Your Home',
          content: homeIcon
        });

        // 6) Nearby markers (AdvancedMarkerElement) with info window on click (default red pins)
        const infoWindow = new google.maps.InfoWindow();
        places.forEach(p => {
          if (!isNaN(p.lat) && !isNaN(p.lng)) {
            const marker = new google.maps.marker.AdvancedMarkerElement({
              map,
              position: { lat: p.lat, lng: p.lng },
              title: p.name
            });
            marker.addListener('click', () => {
              infoWindow.setContent(`
                <div style="width:150px;overflow:visible;">
                  <strong>${p.name}</strong><br/>
                  ${p.address ? p.address : ''}
                </div>
                <style>
                  div[style*='width:150px'] {
                    max-width: 150px !important;
                    width: 150px !important;
                  }
                </style>
              `);
              infoWindow.open(map, marker);
            });
          }
        });
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        element.innerHTML = '<p>Error loading Google Maps.</p>';
      }
    })();
  }
};

export const ViewingBookingExtension = {
  name: 'ViewingBooking',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_viewing_booking' ||
    (trace.payload && trace.payload.name === 'ext_viewing_booking'),
  render: ({ trace, element }) => {
    console.log('Rendering ViewingBookingExtension');

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

    // Extract pre-filled contact information from payload
    const preFilledData = {
      firstName: payloadObj.viewingPropertyFirstName || '',
      lastName: payloadObj.viewingPropertyLastName || '',
      email: payloadObj.viewingPropertyEmail || '',
      phone: payloadObj.viewingPropertyPhone || '',
      address: payloadObj.viewingPropertyAddress || ''
    };

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
        font-size: normal;
        font-style: normal;
        font-display: swap;
      }

      /* Apply font family to all elements */
      .viewing-booking-container,
      .viewing-booking-container * {
        font-family: 'Soleto Trial', 'Soleto', 'Montserrat', 'Roboto', sans-serif;
      }

      .viewing-booking-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      }

      .viewing-booking-header {
        text-align: center;
        margin-bottom: 2rem;
      }

      .viewing-booking-header h1 {
        color: #1E7FCB;
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
      }

      .viewing-booking-header p {
        color: #666;
        font-size: 1.1rem;
        margin: 0;
      }

      .viewing-booking-form {
        background: #eaf6fa;
        border-radius: 10px;
        padding: 2rem;
        font-size: 15px;
        color: #222;
        width: 100%;
        box-sizing: border-box;
      }

      .viewing-booking-form label {
        font-weight: 600;
        margin-bottom: 4px;
        display: block;
      }

      .viewing-booking-form input,
      .viewing-booking-form select,
      .viewing-booking-form textarea {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #c7e0ed;
        border-radius: 7px;
        background: #fff;
        font-size: 15px;
        margin-bottom: 12px;
        box-sizing: border-box;
        font-family: inherit;
        transition: border 0.2s;
      }

      .viewing-booking-form input:focus,
      .viewing-booking-form select:focus,
      .viewing-booking-form textarea:focus {
        border: 1.5px solid #1E7FCB;
        outline: none;
      }

      .viewing-booking-form .form-row {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }

      .viewing-booking-form .form-row > div {
        flex: 1 1 200px;
      }

      .viewing-booking-form .form-group {
        margin-bottom: 10px;
      }

      .viewing-booking-form .form-group.checkbox {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin-bottom: 8px;
      }

      .viewing-booking-form .form-group.checkbox label {
        font-weight: 400;
        margin-bottom: 0;
        flex: 1;
        text-align: left;
      }

      .viewing-booking-form .submit-btn {
        background: #1E7FCB;
        color: #fff;
        border: none;
        border-radius: 7px;
        font-size: 15px;
        font-weight: 600;
        padding: 10px 28px;
        cursor: pointer;
        margin-top: 10px;
        transition: background 0.2s;
      }

      .viewing-booking-form .submit-btn:hover {
        background: #166BB5;
      }

      .viewing-booking-form .section-title {
        color: #1E7FCB;
        font-size: 1.3em;
        font-weight: 700;
        margin: 18px 0 10px 0;
        display: block;
      }

      .viewing-booking-form .required {
        color: #E2001A;
        margin-left: 2px;
        font-weight: 700;
      }

      .checkbox-row {
        display: flex;
        align-items: flex-start;
        width: 100%;
        gap: 10px;
        margin-bottom: 14px;
      }

      .checkbox-row:last-child {
        margin-bottom: 0;
      }

      .checkbox-col {
        flex: 0 0 24px;
        display: flex;
        align-items: flex-start;
        justify-content: flex-start;
        padding-top: 3px;
      }

      .checkbox-col input[type="checkbox"] {
        width: 18px;
        height: 18px;
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        vertical-align: top;
        appearance: auto;
      }

      .label-col {
        flex: 1 1 0%;
        min-width: 0;
      }

      .checkbox-label {
        display: block;
        font-weight: 400;
        text-align: left;
        word-break: break-word;
        font-size: 15px;
        margin-bottom: 0;
        white-space: normal;
        overflow-wrap: break-word;
      }

      .booking-confirm-msg {
        color: #1EC773;
        font-weight: bold;
        margin-top: 16px;
        text-align: center;
        padding: 10px;
        background: #f0f9f0;
        border-radius: 5px;
        border: 1px solid #1EC773;
      }

      /* Responsive adjustments */
      @media (max-width: 768px), (max-device-width: 768px), (max-width: 480px) {
        .viewing-booking-container {
          padding: 1rem;
          margin: 0;
          border-radius: 0;
        }
        
        .viewing-booking-form {
          padding: 1.5rem;
        }
        
        .viewing-booking-form .form-row {
          flex-direction: column;
        }
        
        .viewing-booking-form .form-row > div {
          flex: 1 1 auto;
        }
      }
    `;
    element.appendChild(style);

    // Create the booking form container
    const bookingContainer = document.createElement('div');
    bookingContainer.className = 'viewing-booking-container';

    // Header
    const header = document.createElement('div');
    header.className = 'viewing-booking-header';
    header.innerHTML = `
      <h1>Bezichtiging Boeken</h1>
      <p>Vul het onderstaande formulier in om een bezichtiging aan te vragen</p>
    `;
    bookingContainer.appendChild(header);

    // Form
    const form = document.createElement('form');
    form.className = 'viewing-booking-form';

    form.innerHTML = `
      <div class="form-group">
        <label for="property-address">Je plant een bezichtiging voor:</label>
        <input type="text" id="property-address" name="property-address" value="${preFilledData.address}" readonly>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="day">Voorkeursdag <span class="required">*</span></label>
          <select id="day" name="day" required>
            <option value="">Maak een keuze</option>
            <option value="geen">Geen voorkeur</option>
            <option value="maandag">Maandag</option>
            <option value="dinsdag">Dinsdag</option>
            <option value="woensdag">Woensdag</option>
            <option value="donderdag">Donderdag</option>
            <option value="vrijdag">Vrijdag</option>
          </select>
        </div>
        <div class="form-group">
          <label for="partofday">Dagdeel <span class="required">*</span></label>
          <select id="partofday" name="partofday" required>
            <option value="">Maak een keuze</option>
            <option value="geen">Geen voorkeur</option>
            <option value="ochtend">Ochtend</option>
            <option value="middag">Middag</option>
          </select>
        </div>
      </div>
      
      <div class="form-group">
        <label for="message">Jouw bericht</label>
        <textarea id="message" name="message" rows="3" placeholder="Typ hier je bericht..."></textarea>
      </div>
      
      <span class="section-title">Contactgegevens</span>
      
      <div class="form-row">
        <div class="form-group">
          <label for="first-name">Voornaam <span class="required">*</span></label>
          <input type="text" id="first-name" name="first-name" placeholder="Typ je voornaam in" value="${preFilledData.firstName}" required>
        </div>
        <div class="form-group">
          <label for="last-name">Achternaam <span class="required">*</span></label>
          <input type="text" id="last-name" name="last-name" placeholder="Typ je achternaam in" value="${preFilledData.lastName}" required>
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="email">E-mail <span class="required">*</span></label>
          <input type="email" id="email" name="email" placeholder="Typ je e-mailadres in" value="${preFilledData.email}" required>
        </div>
        <div class="form-group">
          <label for="phone">Telefoon <span class="required">*</span></label>
          <input type="tel" id="phone" name="phone" placeholder="Typ je telefoonnummer in" value="${preFilledData.phone}" required>
        </div>
      </div>
      
      <div class="checkbox-row">
        <div class="checkbox-col">
          <input type="checkbox" id="advies-ja" name="advies" value="ja">
        </div>
        <div class="label-col">
          <label for="advies-ja" class="checkbox-label">Brantjes Hypotheken mag mij benaderen voor financieel advies</label>
        </div>
      </div>
      
      <div class="checkbox-row">
        <div class="checkbox-col">
          <input type="checkbox" id="nieuwsbrief" name="nieuwsbrief">
        </div>
        <div class="label-col">
          <label for="nieuwsbrief" class="checkbox-label">Houd mij periodiek op de hoogte van actualiteiten en nieuws van Brantjes Makelaars in de vorm van een nieuwsbrief of mailing.</label>
        </div>
      </div>
      
      <div class="checkbox-row">
        <div class="checkbox-col">
          <input type="checkbox" id="privacy" name="privacy" required>
        </div>
        <div class="label-col">
          <label for="privacy" class="checkbox-label"><span style="color: #E2001A; font-weight: bold; margin-right: 4px;">*</span>Bij het gebruiken van dit formulier ga ik akkoord met het opslaan en verwerken van de door mij opgegeven gegevens zoals beschreven in het privacybeleid.</label>
        </div>
      </div>
      
      <button type="submit" class="submit-btn">Verzend</button>
    `;

    // Form submission handler
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Collect form values
      const payload = {
        propertyAddress: form['property-address']?.value,
        day: form['day']?.value,
        partOfDay: form['partofday']?.value,
        message: form['message']?.value,
        firstName: form['first-name']?.value,
        lastName: form['last-name']?.value,
        email: form['email']?.value,
        phone: form['phone']?.value,
        advies: form['advies-ja']?.checked,
        nieuwsbrief: form['nieuwsbrief']?.checked,
        privacy: form['privacy']?.checked
      };
      
      // Send to VoiceFlow
      if (window.voiceflow && window.voiceflow.chat && window.voiceflow.chat.interact) {
        window.voiceflow.chat.interact({
          type: 'complete',
          payload: payload,
        });
      }
      
      // Show green confirmation below the button
      let confirmMsg = form.querySelector('.booking-confirm-msg');
      if (!confirmMsg) {
        confirmMsg = document.createElement('div');
        confirmMsg.className = 'booking-confirm-msg';
        form.appendChild(confirmMsg);
      }
      confirmMsg.textContent = 'Je bezichtigingsverzoek is verzonden!';
      
      // Disable submit button to prevent double submission
      const submitBtn = form.querySelector('.submit-btn');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Verzonden';
    });

    bookingContainer.appendChild(form);
    element.appendChild(bookingContainer);
  },
};

export const ContactFormExtension = {
  name: 'ContactForm',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_contact_form' ||
    (trace.payload && trace.payload.name === 'ext_contact_form'),
  render: ({ trace, element }) => {
    console.log('Rendering ContactFormExtension');

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

    // Extract pre-filled contact information from payload
    const preFilledData = {
      firstName: payloadObj.viewingPropertyFirstName || '',
      lastName: payloadObj.viewingPropertyLastName || '',
      email: payloadObj.viewingPropertyEmail || '',
      phone: payloadObj.viewingPropertyPhone || '',
      office: payloadObj.office && payloadObj.office !== '0' ? payloadObj.office : '',
      subject: payloadObj.contactSubject && payloadObj.contactSubject !== '0' ? payloadObj.contactSubject : '',
      message: payloadObj.contactMessage || ''
    };

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

      /* Apply font family to all elements */
      .contact-form-container,
      .contact-form-container * {
        font-family: 'Soleto Trial', 'Soleto', 'Montserrat', 'Roboto', sans-serif;
      }

      .contact-form-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      }

      .contact-form-header {
        text-align: center;
        margin-bottom: 2rem;
      }

      .contact-form-header h1 {
        color: #1E7FCB;
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
      }

      .contact-form-header p {
        color: #666;
        font-size: 0.8rem;
        margin: 0;
      }

      .contact-form {
        background: #eaf6fa;
        border-radius: 10px;
        padding: 2rem;
        font-size: 15px;
        color: #222;
        width: 100%;
        box-sizing: border-box;
      }

      .contact-form label {
        font-weight: 600;
        margin-bottom: 4px;
        display: block;
      }

      .contact-form input,
      .contact-form select,
      .contact-form textarea {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #c7e0ed;
        border-radius: 7px;
        background: #fff;
        font-size: 15px;
        margin-bottom: 12px;
        box-sizing: border-box;
        font-family: inherit;
        transition: border 0.2s;
      }

      .contact-form input:focus,
      .contact-form select:focus,
      .contact-form textarea:focus {
        border: 1.5px solid #1E7FCB;
        outline: none;
      }

      .contact-form .form-row {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }

      .contact-form .form-row > div {
        flex: 1 1 200px;
      }

      .contact-form .form-group {
        margin-bottom: 10px;
      }

      .contact-form .form-group.checkbox {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin-bottom: 8px;
      }

      .contact-form .form-group.checkbox label {
        font-weight: 400;
        margin-bottom: 0;
        flex: 1;
        text-align: left;
      }

      .contact-form .submit-btn {
        background: #1E7FCB;
        color: #fff;
        border: none;
        border-radius: 7px;
        font-size: 15px;
        font-weight: 600;
        padding: 10px 28px;
        cursor: pointer;
        margin-top: 10px;
        transition: background 0.2s;
      }

      .contact-form .submit-btn:hover {
        background: #166BB5;
      }

      .contact-form .required {
        color: #E2001A;
        margin-left: 2px;
        font-weight: 700;
      }

      .checkbox-row {
        display: flex;
        align-items: flex-start;
        width: 100%;
        gap: 10px;
        margin-bottom: 14px;
      }

      .checkbox-row:last-child {
        margin-bottom: 0;
      }

      .checkbox-col {
        flex: 0 0 24px;
        display: flex;
        align-items: flex-start;
        justify-content: flex-start;
        padding-top: 3px;
      }

      .checkbox-col input[type="checkbox"] {
        width: 18px;
        height: 18px;
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        vertical-align: top;
        appearance: auto;
      }

      .label-col {
        flex: 1 1 0%;
        min-width: 0;
      }

      .checkbox-label {
        display: block;
        font-weight: 400;
        text-align: left;
        word-break: break-word;
        font-size: 15px;
        margin-bottom: 0;
        white-space: normal;
        overflow-wrap: break-word;
      }

      .contact-confirm-msg {
        color: #1EC773;
        font-weight: bold;
        margin-top: 16px;
        text-align: center;
        padding: 10px;
        background: #f0f9f0;
        border-radius: 5px;
        border: 1px solid #1EC773;
      }

      /* Responsive adjustments */
      @media (max-width: 768px), (max-device-width: 768px), (max-width: 480px) {
        .contact-form-container {
          padding: 1rem;
          margin: 0;
          border-radius: 0;
        }
        
        .contact-form {
          padding: 1.5rem;
        }
        
        .contact-form .form-row {
          flex-direction: column;
        }
        
        .contact-form .form-row > div {
          flex: 1 1 auto;
        }
      }
    `;
    element.appendChild(style);

    // Create the contact form container
    const contactContainer = document.createElement('div');
    contactContainer.className = 'contact-form-container';

    // Header
    const header = document.createElement('div');
    header.className = 'contact-form-header';
    header.innerHTML = `
      <h1>Neem contact op met Brantjes</h1>
      <p>Heb je een vraag over onze diensten? Gebruik onderstaand formulier en wij zullen je zo snel mogelijk antwoorden.</p>
    `;
    contactContainer.appendChild(header);

    // Form
    const form = document.createElement('form');
    form.className = 'contact-form';

    form.innerHTML = `
      <div class="form-row">
        <div class="form-group">
          <label for="first-name">Voornaam <span class="required">*</span></label>
          <input type="text" id="first-name" name="first-name" placeholder="Voornaam" value="${preFilledData.firstName}" required>
        </div>
        <div class="form-group">
          <label for="last-name">Achternaam <span class="required">*</span></label>
          <input type="text" id="last-name" name="last-name" placeholder="Achternaam" value="${preFilledData.lastName}" required>
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="email">E-mail <span class="required">*</span></label>
          <input type="email" id="email" name="email" placeholder="E-mailadres" value="${preFilledData.email}" required>
        </div>
        <div class="form-group">
          <label for="phone">Telefoon <span class="required">*</span></label>
          <input type="tel" id="phone" name="phone" placeholder="Telefoonnummer" value="${preFilledData.phone}" required>
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="office">Selecteer jouw vestiging <span class="required">*</span></label>
          <select id="office" name="office" required>
            <option value="">Maak een keuze</option>
            ${preFilledData.office ? `<option value="${preFilledData.office}" selected>${preFilledData.office}</option>` : ''}
            <option value="Assendelft">Assendelft</option>
            <option value="Beverwijk">Beverwijk</option>
            <option value="Heemskerk">Heemskerk</option>
            <option value="Velsen">Velsen</option>
            <option value="Wormerland">Wormerland</option>
            <option value="Zaandam">Zaandam</option>
          </select>
        </div>
        <div class="form-group">
          <label for="subject">Waar gaat je vraag over? <span class="required">*</span></label>
          <select id="subject" name="subject" required>
            <option value="">Maak een keuze</option>
            ${preFilledData.subject ? `<option value="${preFilledData.subject}" selected>${preFilledData.subject}</option>` : ''}
            <option value="Verkoop">Verkoop</option>
            <option value="Aankoop">Aankoop</option>
            <option value="Verhuur">Verhuur</option>
            <option value="Hypotheek">Hypotheek</option>
            <option value="Taxatie">Taxatie</option>
            <option value="Algemeen">Algemeen</option>
          </select>
        </div>
      </div>
      
      <div class="form-group">
        <label for="message">Jouw bericht</label>
        <textarea id="message" name="message" rows="4" placeholder="Jouw bericht">${preFilledData.message}</textarea>
      </div>
      
      <div class="checkbox-row">
        <div class="checkbox-col">
          <input type="checkbox" id="newsletter" name="newsletter">
        </div>
        <div class="label-col">
          <label for="newsletter" class="checkbox-label">Inschrijven nieuwsbrief</label>
        </div>
      </div>
      
      <div class="checkbox-row">
        <div class="checkbox-col">
          <input type="checkbox" id="privacy" name="privacy" required>
        </div>
        <div class="label-col">
          <label for="privacy" class="checkbox-label"><span style="color: #E2001A; font-weight: bold; margin-right: 4px;">*</span>Bij het gebruiken van dit formulier ga ik akkoord met het opslaan en verwerken van de door mij opgegeven gegevens zoals beschreven in het privacybeleid.</label>
        </div>
      </div>
      
      <button type="submit" class="submit-btn">Verzend</button>
    `;

    // Form submission handler
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Collect form values
      const payload = {
        firstName: form['first-name']?.value,
        lastName: form['last-name']?.value,
        email: form['email']?.value,
        phone: form['phone']?.value,
        office: form['office']?.value,
        subject: form['subject']?.value,
        message: form['message']?.value,
        newsletter: form['newsletter']?.checked,
        privacy: form['privacy']?.checked
      };
      
      // Send to VoiceFlow
      if (window.voiceflow && window.voiceflow.chat && window.voiceflow.chat.interact) {
        window.voiceflow.chat.interact({
          type: 'complete',
          payload: payload,
        });
      }
      
      // Show green confirmation below the button
      let confirmMsg = form.querySelector('.contact-confirm-msg');
      if (!confirmMsg) {
        confirmMsg = document.createElement('div');
        confirmMsg.className = 'contact-confirm-msg';
        form.appendChild(confirmMsg);
      }
      confirmMsg.textContent = 'Je bericht is verzonden!';
      
      // Disable submit button to prevent double submission
      const submitBtn = form.querySelector('.submit-btn');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Verzonden';
    });

    contactContainer.appendChild(form);
    element.appendChild(contactContainer);
  },
};

export const PropertyDetailsExtension = {
  name: 'PropertyDetails',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_property_details' ||
    (trace.payload && trace.payload.name === 'ext_property_details'),
  render: ({ trace, element }) => {
    console.log('Rendering PropertyDetailsExtension');

    // Helper function to format city names to proper case
    function formatCityName(cityName) {
      if (!cityName) return '';
      return cityName.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    }

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
    // --- FIX: If properties is a single object, wrap it in an array ---
    if (properties && !Array.isArray(properties)) {
      properties = [properties];
    }
    if (!Array.isArray(properties) || properties.length === 0) {
      element.innerHTML = `<p>No property details available.</p>`;
      return;
    }

    // Use the first property for details
    const property = properties[0];

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

      /* Apply font family to all elements */
      .property-details-container,
      .property-details-container *,
      .detail-popup-content,
      .detail-popup-content *,
      .detail-popup-header,
      .detail-popup-header *,
      .detail-popup-images-row,
      .detail-popup-images-row *,
      .detail-popup-specs-row,
      .detail-popup-specs-row *,
      .search-nearby-btn,
      .brantjes-modal-container,
      .brantjes-modal-container * {
        font-family: 'Soleto Trial', 'Soleto', 'Montserrat', 'Roboto', sans-serif !important;
      }

      /* Checkbox alignment for PropertyDetailsExtension booking form */
      .brantjes-booking-form .checkbox-row {
        display: flex !important;
        align-items: flex-start !important;
        width: 100% !important;
        gap: 10px !important;
        margin-bottom: 14px !important;
      }
      .brantjes-booking-form .checkbox-row:last-child {
        margin-bottom: 0 !important;
      }
      .brantjes-booking-form .checkbox-col {
        flex: 0 0 24px !important;
        display: flex !important;
        align-items: flex-start !important;
        justify-content: flex-start !important;
        padding-top: 3px !important;
      }
      .brantjes-booking-form .checkbox-col input[type="checkbox"] {
        width: 18px !important;
        height: 18px !important;
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
        vertical-align: top !important;
        appearance: auto !important;
      }
      .brantjes-booking-form .label-col {
        flex: 1 1 0% !important;
        min-width: 0 !important;
      }
      .brantjes-booking-form .checkbox-label {
        display: block !important;
        font-weight: 400 !important;
        text-align: left !important;
        word-break: break-word !important;
        font-size: 15px !important;
        margin-bottom: 0 !important;
        white-space: normal !important;
        overflow-wrap: break-word !important;
      }

      .property-details-container {
        max-width: 900px;
        margin: 0 auto;
        padding: 2rem;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      }

      /* Detail page header energy label (independent) */
      .energy-label-detail {
        display: inline-flex;
        align-items: center;
        height: 26px;
        padding: 0 12px 0 10px;
        font-size: 1rem;
        font-weight: bold;
        color: #fff;
        border-radius: 6px 0 0 6px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.10);
        margin-left: 0.5rem;
        line-height: 1.1;
        position: relative;
        background: #1EC773;
        overflow: visible;
      }
      .energy-label-detail::after {
        content: '';
        position: absolute;
        right: -14px;
        top: 0;
        width: 0;
        height: 0;
        border-top: 13px solid transparent;
        border-bottom: 13px solid transparent;
        border-left: 14px solid #1EC773;
        border-radius: 0;
        margin-left: 0;
        z-index: 2;
      }
      .energy-label-detail-A { background: #1EC773; }
      .energy-label-detail-A::after { border-left-color: #1EC773; }
      .energy-label-detail-B { background: #8DD800; }
      .energy-label-detail-B::after { border-left-color: #8DD800; }
      .energy-label-detail-C { background: #F7D900; color: #333; }
      .energy-label-detail-C::after { border-left-color: #F7D900; }
      .energy-label-detail-D { background: #F7A600; }
      .energy-label-detail-D::after { border-left-color: #F7A600; }
      .energy-label-detail-E { background: #F76B1C; }
      .energy-label-detail-E::after { border-left-color: #F76B1C; }
      .energy-label-detail-F { background: #E2001A; }
      .energy-label-detail-F::after { border-left-color: #E2001A; }
      .energy-label-detail-G { background: #A50021; }
      .energy-label-detail-G::after { border-left-color: #A50021; }

      /* Detail Pop-up Layout */
      .detail-popup-content {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }
      .detail-popup-header {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .detail-popup-header-row {
        display: flex;
        flex-direction: row;
        align-items: center;
        flex-wrap: nowrap;
        gap: 1.2rem;
        margin-top: 0.2rem;
        width: 100%;
      }
      .detail-popup-header-details {
        color: #222;
        font-weight: 700;
        margin-right: 1.2rem;
        white-space: nowrap;
      }
      .detail-popup-header-price {
        font-weight: 700;
        color: #222;
        margin: 0;
        line-height: 1.1;
        margin-right: 1.2rem;
        white-space: nowrap;
      }
      .detail-popup-header-energy {
        margin-top: 0;
        margin-left: 0.5rem;
        display: inline-flex;
        align-items: center;
        vertical-align: middle;
      }
      .detail-popup-dot {
        display: inline-block;
        margin: 0 0.5rem;
        color: #bdbdbd;
        font-size: 1.2em;
        vertical-align: middle;
        font-weight: bold;
      }
      .detail-popup-header-viewing-btn {
        background: #51b2df;
        color: #fff;
        border: none;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 600;
        padding: 0.5em 1.5em;
        margin-left: 0;
        cursor: pointer;
        transition: background 0.2s;
        box-shadow: 0 2px 8px rgba(30,127,203,0.08);
        display: flex;
        align-items: center;
        height: 2.2em;
      }
      .detail-popup-header-viewing-btn:hover {
        background: #166BB5;
      }
      .detail-popup-images-row {
        display: flex;
        flex-direction: row;
        gap: 10px;
        align-items: flex-end;
        margin-bottom: 0;
      }
      .detail-popup-main-image {
        width: 320px;
        height: 240px;
        min-width: 320px;
        max-width: 320px;
        max-height: 240px;
        border-radius: 10px;
        overflow: hidden;
        display: flex;
        align-items: stretch;
        justify-content: center;
        position: relative;
        align-self: flex-end;
      }
      .detail-popup-main-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 10px;
      }
      .detail-popup-main-image-counter {
        position: absolute;
        bottom: 8px;
        right: 12px;
        background: rgba(0,0,0,0.55);
        color: #fff;
        font-size: 0.8rem;
        padding: 2px 10px;
        border-radius: 12px;
        font-weight: 500;
        z-index: 2;
      }
      .detail-popup-thumbnails {
        display: grid;
        grid-template-columns: 150px 150px;
        grid-template-rows: 115px 115px;
        gap: 10px;
        align-items: end;
        height: 240px;
        justify-content: flex-start;
        position: relative;
      }
      .detail-popup-thumbnail {
        width: 150px;
        height: 115px;
        background-size: cover;
        background-position: center;
        border-radius: 8px;
        cursor: pointer;
        box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        opacity: 0;
        transition: opacity 0.35s cubic-bezier(0.22, 1, 0.36, 1);
        position: absolute;
        pointer-events: none;
      }
      .detail-popup-thumbnail.fade-in {
        opacity: 1;
        position: static;
        pointer-events: auto;
      }
      .detail-popup-specs-row {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8rem;
        margin: 0;
        flex-wrap: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        width: 100%;
      }

      .detail-popup-title-main {
        font-size: 1.8rem;
        font-weight: 700;
        color: #1E7FCB !important;
        margin: 0 0 0.2em 0;
        display: block;
      }

      /* Search Nearby Button */
      .search-nearby-btn {
        background: #51b2df;
        color: #fff;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        padding: 12px 32px;
        cursor: pointer;
        transition: background 0.2s;
        box-shadow: 0 2px 8px rgba(30,127,203,0.08);
        display: inline-block;
        margin: 0 auto;
        min-width: 200px;
      }
      .search-nearby-btn:hover {
        background: #166BB5;
      }

      /* Modal Styles */
      .brantjes-modal-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        height: 90vh;
        z-index: 1000;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
        overflow-y: auto;
        overflow-x: hidden;
      }
      .brantjes-modal-backdrop.visible {
        opacity: 1;
      }
      .brantjes-modal-container {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        width: 98%;
        max-width: 98vw;
        height: auto;
        max-height: 80vh;
        overflow-y: auto;
        margin: 0;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
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

      /* MOBILE RESPONSIVE STYLES - PROPERTY DETAILS EXTENSION */
      @media (max-width: 768px), (max-device-width: 768px), (max-width: 480px) {
        .property-details-container {
          padding: 1rem !important;
          margin: 0 !important;
          border-radius: 0 !important;
          max-width: 100% !important;
        }
        
        .property-details-container .detail-popup-main-image {
          width: 100% !important;
          max-width: 100% !important;
          min-width: auto !important;
          height: auto !important;
          max-height: none !important;
          margin-bottom: 16px !important;
          display: block !important;
          position: relative !important;
          align-self: stretch !important;
        }
        
        .property-details-container .detail-popup-main-image img {
          width: 100% !important;
          height: auto !important;
          max-height: 300px !important;
          object-fit: cover !important;
          display: block !important;
        }
        
        .property-details-container .detail-popup-thumbnails {
          width: 100% !important;
          max-width: 100% !important;
          display: grid !important;
          grid-template-columns: repeat(4, 1fr) !important;
          grid-template-rows: repeat(2, 1fr) !important;
          gap: 8px !important;
          height: 120px !important;
          margin-top: 0 !important;
          position: static !important;
          align-items: stretch !important;
          justify-content: stretch !important;
        }
        
        .property-details-container .detail-popup-thumbnail {
          width: 100% !important;
          height: 100% !important;
          position: static !important;
          opacity: 1 !important;
          pointer-events: auto !important;
          background-size: cover !important;
          background-position: center !important;
          background-repeat: no-repeat !important;
          border-radius: 6px !important;
          cursor: pointer !important;
        }
        
        .property-details-container .detail-popup-images-row {
          flex-direction: column !important;
          align-items: center !important;
          gap: 16px !important;
          margin-top: 24px !important;
        }
        
        .property-details-container .detail-popup-header-row {
          flex-direction: column !important;
          gap: 12px !important;
        }
        
        /* Mobile-specific header styling for PropertyDetailsExtension */
        .property-details-container .detail-popup-header-details {
          font-size: 0.9rem !important;
          white-space: normal !important;
          flex: 1 !important;
          min-width: 0 !important;
          max-width: 100% !important;
          overflow-wrap: break-word !important;
          word-wrap: break-word !important;
        }
        
        .property-details-container .detail-popup-header-price {
          font-size: 1rem !important;
          white-space: normal !important;
          flex-shrink: 0 !important;
          max-width: 100% !important;
          overflow-wrap: break-word !important;
          word-wrap: break-word !important;
        }
        
        .property-details-container .detail-popup-header-viewing-btn {
          font-size: 18px !important;
          padding: 0.4em 1.2em !important;
          height: 2em !important;
          flex-shrink: 0 !important;
          white-space: nowrap !important;
          width: 80% !important;
        }
        
        /* Mobile-specific specs row styling for PropertyDetailsExtension */
        .property-details-container .detail-popup-specs-row {
          justify-content: center !important;
          gap: 16px !important;
          flex-wrap: wrap !important;
        }
        
        .property-details-container .detail-popup-specs-row span {
          font-size: 14px !important;
          white-space: nowrap !important;
        }
        
        /* Mobile-specific title styling for PropertyDetailsExtension */
        .property-details-container .detail-popup-title-main {
          font-size: 1.4rem !important;
          line-height: 1.2 !important;
          word-break: break-word !important;
        }
        
        /* Mobile-specific content spacing for PropertyDetailsExtension */
        .property-details-container .detail-popup-content {
          gap: 16px !important;
        }
        
        /* Mobile-specific description styling for PropertyDetailsExtension */
        .property-details-container .detail-popup-content > div:not(.detail-popup-header):not(.detail-popup-images-row):not(.detail-popup-specs-row) {
          font-size: 14px !important;
          line-height: 1.5 !important;
        }
        
        /* Mobile-specific table styling for PropertyDetailsExtension */
        .property-details-container table {
          font-size: 0.8rem !important;
        }
        
        .property-details-container table td {
          padding: 2px 4px !important;
        }
        
        /* Mobile-specific button styling for PropertyDetailsExtension */
        .property-details-container .search-nearby-btn {
          font-size: 14px !important;
          padding: 10px 24px !important;
          min-width: 180px !important;
        }
        
        /* Mobile-specific booking modal styling for PropertyDetailsExtension */
        .property-details-container .booking-modal h2 {
          font-size: 1.2rem !important;
          line-height: 1.3 !important;
        }
        
        .property-details-container .booking-modal h3 {
          font-size: 1rem !important;
          line-height: 1.3 !important;
        }
        
        .property-details-container .booking-modal input,
        .property-details-container .booking-modal select,
        .property-details-container .booking-modal textarea {
          font-size: 14px !important;
          padding: 8px 12px !important;
        }
        
        .property-details-container .booking-modal label {
          font-size: 14px !important;
          margin-bottom: 4px !important;
        }
        
        .property-details-container .booking-modal .checkbox-label {
          font-size: 12px !important;
          line-height: 1.4 !important;
        }
      }

      /* DESKTOP STYLES - PROPERTY DETAILS EXTENSION */
      @media (min-width: 769px), (min-device-width: 769px) {
        .property-details-container .detail-popup-main-image {
          width: 320px !important;
          height: 240px !important;
          min-width: 320px !important;
          max-width: 320px !important;
          max-height: 240px !important;
          margin-bottom: 0 !important;
          display: flex !important;
          position: relative !important;
          align-self: flex-end !important;
        }
        
        .property-details-container .detail-popup-main-image img {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          display: block !important;
        }
        
        .property-details-container .detail-popup-thumbnails {
          display: grid !important;
          grid-template-columns: 150px 150px !important;
          grid-template-rows: 115px 115px !important;
          gap: 10px !important;
          align-items: end !important;
          height: 240px !important;
          justify-content: flex-start !important;
          position: relative !important;
        }
        
        .property-details-container .detail-popup-thumbnail {
          width: 150px !important;
          height: 115px !important;
          position: absolute !important;
          opacity: 0 !important;
          pointer-events: none !important;
          background-size: cover !important;
          background-position: center !important;
          border-radius: 8px !important;
          cursor: pointer !important;
          transition: opacity 0.35s cubic-bezier(0.22, 1, 0.36, 1) !important;
        }
        
        .property-details-container .detail-popup-thumbnail.fade-in {
          opacity: 1 !important;
          position: static !important;
          pointer-events: auto !important;
        }
        
        .property-details-container .detail-popup-images-row {
          flex-direction: row !important;
          align-items: flex-end !important;
          gap: 10px !important;
          margin-top: 16px !important;
        }
        
        .property-details-container .detail-popup-header-row {
          flex-direction: row !important;
          align-items: center !important;
          justify-content: space-between !important;
          gap: 0.3rem !important;
          display: flex !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }
        
        /* Fix images row width for PropertyDetailsExtension desktop */
        .property-details-container .detail-popup-images-row {
          max-width: 100% !important;
          width: 100% !important;
          box-sizing: border-box !important;
          overflow: visible !important;
        }
        
        /* Adjust image sizes to fit container for PropertyDetailsExtension */
        .property-details-container .detail-popup-main-image {
          width: 280px !important;
          min-width: 280px !important;
          max-width: 280px !important;
        }
        
        .property-details-container .detail-popup-thumbnails {
          grid-template-columns: 130px 130px !important;
          grid-template-rows: 115px 115px !important;
          gap: 8px !important;
          height: 240px !important;
        }
        
        .property-details-container .detail-popup-thumbnail {
          width: 130px !important;
          height: 115px !important;
        }
        
        /* Restore original desktop font sizes for PropertyDetailsExtension */
        .property-details-container .detail-popup-title-main {
          font-size: 1.2rem !important;
          line-height: 1.1 !important;
        }
        
        .property-details-container .detail-popup-header-details {
          font-size: 0.9rem !important;
          white-space: nowrap !important;
          font-weight: normal !important;
          line-height: 1.2 !important;
        }
        
        .property-details-container .detail-popup-header-price {
          font-size: 0.9rem !important;
          white-space: nowrap !important;
          font-weight: normal !important;
          line-height: 1.2 !important;
        }
        
        /* Override any conflicting general styles */
        .property-details-container .detail-popup-header-price,
        .property-details-container .detail-popup-header-details {
          font-size: 0.9rem !important;
          font-weight: normal !important;
          line-height: 1.2 !important;
          margin: 0 !important;
          color: inherit !important;
        }
        
        /* Force override with maximum specificity */
        .property-details-container .detail-popup-header .detail-popup-header-price,
        .property-details-container .detail-popup-header .detail-popup-header-details {
          font-size: 0.9rem !important;
          font-weight: normal !important;
          line-height: 1.2 !important;
          margin: 0 !important;
          color: inherit !important;
        }
        
        /* Shadow DOM penetration - use :host and ::part if available */
        :host .property-details-container .detail-popup-header-price,
        :host .property-details-container .detail-popup-header-details {
          font-size: 0.9rem !important;
          font-weight: normal !important;
          line-height: 1.2 !important;
          margin: 0 !important;
          color: inherit !important;
        }
        
        /* Universal override for shadow DOM */
        * .detail-popup-header-price,
        * .detail-popup-header-details {
          font-size: 0.9rem !important;
          font-weight: normal !important;
          line-height: 1.2 !important;
          margin: 0 !important;
          color: inherit !important;
        }
        
        /* Target specific elements with maximum specificity */
        .detail-popup-header-row .detail-popup-header-price,
        .detail-popup-header-row .detail-popup-header-details {
          font-size: 0.9rem !important;
          font-weight: normal !important;
          line-height: 1.2 !important;
          margin: 0 !important;
          color: inherit !important;
        }
        
        .detail-popup-header-viewing-btn {
          font-size: 13px !important;
          padding: 0.4em 1.2em !important;
          height: 2em !important;
        }
        
        .detail-popup-specs-row span {
          font-size: 0.8rem !important;
          white-space: nowrap !important;
        }
        
        .property-details-container .energy-label-detail {
          font-size: 1rem !important;
          height: 22px !important;
          padding: 0 10px 0 8px !important;
        }
        
        .property-details-container .energy-label-detail::after {
          border-top: 11px solid transparent !important;
          border-bottom: 11px solid transparent !important;
          border-left: 12px solid #FFD700 !important;
          right: -12px !important;
          content: "" !important;
        }
        
        .property-details-container .energy-label-detail-C::after {
          border-left-color: #FFD700 !important;
          border-left-style: solid !important;
        }
        
        /* Force energy label colors for all browsers */
        .property-details-container .energy-label-detail::after {
          border-left-color: #FFD700 !important;
          border-left-style: solid !important;
        }
        
        /* Specific energy label colors for Chromium */
        .property-details-container .energy-label-detail-A::after {
          border-left-color: #1EC773 !important;
          border-left-style: solid !important;
        }
        
        .property-details-container .energy-label-detail-B::after {
          border-left-color: #8DD800 !important;
          border-left-style: solid !important;
        }
        
        .property-details-container .energy-label-detail-C::after {
          border-left-color: #F7D900 !important;
          border-left-style: solid !important;
        }
        
        .property-details-container .energy-label-detail-D::after {
          border-left-color: #F7A600 !important;
          border-left-style: solid !important;
        }
        
        .property-details-container .energy-label-detail-E::after {
          border-left-color: #F76B1C !important;
          border-left-style: solid !important;
        }
        
        .property-details-container .energy-label-detail-F::after {
          border-left-color: #E2001A !important;
          border-left-style: solid !important;
        }
        
        .property-details-container .energy-label-detail-G::after {
          border-left-color: #A50021 !important;
          border-left-style: solid !important;
        }
        
        .property-details-container .detail-popup-header-viewing-btn {
          font-size: 13px !important;
          padding: 0.4em 1.2em !important;
          height: 2em !important;
        }
        
        .property-details-container .detail-popup-specs-row {
          justify-content: flex-start !important;
          gap: 0.5rem !important;
          flex-wrap: nowrap !important;
        }
        
        .property-details-container .detail-popup-specs-row span {
          font-size: 0.7em !important;
          white-space: nowrap !important;
        }
        
        .property-details-container .detail-popup-content {
          gap: 24px !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: flex-start !important;
        }
        
        .property-details-container .detail-popup-content > div:not(.detail-popup-images-row):not(.detail-popup-specs-row) {
          text-align: left !important;
          width: 100% !important;
          max-width: 100% !important;
        }
        
        .property-details-container table {
          text-align: left !important;
          width: 100% !important;
          max-width: 100% !important;
        }
        
        .property-details-container table td {
          text-align: left !important;
        }
        
        .property-details-container .detail-popup-content > div:not(.detail-popup-header):not(.detail-popup-images-row):not(.detail-popup-specs-row) {
          font-size: 15px !important;
          line-height: 1.6 !important;
        }
        
        .property-details-container table {
          font-size: 0.85rem !important;
        }
        
        .property-details-container table td {
          padding: 3px 8px !important;
        }
        
        .property-details-container .search-nearby-btn {
          font-size: 16px !important;
          padding: 12px 32px !important;
          min-width: 200px !important;
          display: block !important;
          margin: 0 auto !important;
        }
      }
    `;
    element.appendChild(style);

    // --- MODAL FUNCTIONS (reused from main extension) ---
    function openModal(contentElement) {
        let modalBackdrop = element.querySelector('.brantjes-modal-backdrop');
        if (!modalBackdrop) {
            modalBackdrop = document.createElement('div');
            modalBackdrop.className = 'brantjes-modal-backdrop';
            element.appendChild(modalBackdrop);
        }

        const modalContainer = document.createElement('div');
        modalContainer.className = 'brantjes-modal-container';
        modalContainer.style.position = 'relative';

        const closeButton = document.createElement('button');
        closeButton.className = 'brantjes-modal-close';
        closeButton.innerHTML = '&times;';
        closeButton.onclick = () => {
            modalBackdrop.classList.remove('visible');
            modalContainer.classList.remove('visible');
            setTimeout(() => {
                modalBackdrop.remove();
            }, 300);
        };
        modalContainer.appendChild(closeButton);
        modalContainer.appendChild(contentElement);
        modalBackdrop.innerHTML = '';
        modalBackdrop.appendChild(modalContainer);

        void modalBackdrop.offsetWidth;
        modalBackdrop.classList.add('visible');
    }

    function showBookingModal(property) {
        const bookingContent = document.createElement('div');
        bookingContent.className = 'booking-form-content';
        const address = [property.adres?.straat, property.adres?.huisnummer?.hoofdnummer].filter(Boolean).join(' ');

        // Add Brantjes-style form CSS
        const style = document.createElement('style');
        style.innerHTML = `
          .brantjes-booking-form,
          .brantjes-booking-form * {
            font-family: 'Soleto Trial', 'Soleto', 'Montserrat', 'Roboto', sans-serif !important;
          }
          .brantjes-booking-form {
            background: #eaf6fa;
            border-radius: 10px;
            padding: 24px 18px 18px 18px;
            font-size: 15px;
            color: #222;
            margin: 0;
            width: 100%;
            box-sizing: border-box;
          }
          .brantjes-booking-form label {
            font-weight: 600;
            margin-bottom: 4px;
            display: block;
          }
          .brantjes-booking-form input,
          .brantjes-booking-form select,
          .brantjes-booking-form textarea {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #c7e0ed;
            border-radius: 7px;
            background: #fff;
            font-size: 15px;
            margin-bottom: 12px;
            box-sizing: border-box;
            font-family: inherit;
            transition: border 0.2s;
          }
          .brantjes-booking-form input:focus,
          .brantjes-booking-form select:focus,
          .brantjes-booking-form textarea:focus {
            border: 1.5px solid #1E7FCB;
            outline: none;
          }
          .brantjes-booking-form .form-row {
            display: flex;
            gap: 12px;
          }
          .brantjes-booking-form .form-row > div {
            flex: 1 1 0;
          }
          .brantjes-booking-form .form-group {
            margin-bottom: 10px;
          }
          .brantjes-booking-form .form-group.checkbox {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            margin-bottom: 8px;
          }
          .brantjes-booking-form .form-group.checkbox label {
            font-weight: 400;
            margin-bottom: 0;
            flex: 1;
            text-align: left;
          }
          .brantjes-booking-form .submit-btn {
            background: #1E7FCB;
            color: #fff;
            border: none;
            border-radius: 7px;
            font-size: 15px;
            font-weight: 600;
            padding: 10px 28px;
            cursor: pointer;
            margin-top: 10px;
            transition: background 0.2s;
          }
          .brantjes-booking-form .submit-btn:hover {
            background: #166BB5;
          }
          .brantjes-booking-form .section-title {
            color: #1E7FCB;
            font-size: 1.3em;
            font-weight: 700;
            margin: 18px 0 10px 0;
            display: block;
          }
          .brantjes-booking-form .required {
            color: #E2001A;
            margin-left: 2px;
            font-weight: 700;
          }
        `;
        bookingContent.appendChild(style);

        bookingContent.innerHTML += `
          <form class="brantjes-booking-form">
            <div class="form-group">
              <label for="property-address">Je plant een bezichtiging voor:</label>
              <input type="text" id="property-address" name="property-address" value="${address || ''}" readonly>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="day">Voorkeursdag <span class="required">*</span></label>
                <select id="day" name="day" required>
                  <option value="">Maak een keuze</option>
                  <option value="geen">Geen voorkeur</option>
                  <option value="maandag">Maandag</option>
                  <option value="dinsdag">Dinsdag</option>
                  <option value="woensdag">Woensdag</option>
                  <option value="donderdag">Donderdag</option>
                  <option value="vrijdag">Vrijdag</option>
                </select>
              </div>
              <div class="form-group">
                <label for="partofday">Dagdeel <span class="required">*</span></label>
                <select id="partofday" name="partofday" required>
                  <option value="">Maak een keuze</option>
                  <option value="geen">Geen voorkeur</option>
                  <option value="ochtend">Ochtend</option>
                  <option value="middag">Middag</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label for="message">Jouw bericht</label>
              <textarea id="message" name="message" rows="3" placeholder="Typ hier je bericht..."></textarea>
            </div>
            <span class="section-title">Contactgegevens</span>
            <div class="form-row">
              <div class="form-group">
                <label for="first-name">Voornaam <span class="required">*</span></label>
                <input type="text" id="first-name" name="first-name" placeholder="Typ je voornaam in" required>
              </div>
              <div class="form-group">
                <label for="last-name">Achternaam <span class="required">*</span></label>
                <input type="text" id="last-name" name="last-name" placeholder="Typ je achternaam in" required>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="email">E-mail <span class="required">*</span></label>
                <input type="email" id="email" name="email" placeholder="Typ je e-mailadres in" required>
              </div>
              <div class="form-group">
                <label for="phone">Telefoon <span class="required">*</span></label>
                <input type="tel" id="phone" name="phone" placeholder="Typ je telefoonnummer in" required>
              </div>
            </div>
            <div class="checkbox-row">
              <div class="checkbox-col">
                <input type="checkbox" id="advies-ja" name="advies" value="ja">
              </div>
              <div class="label-col">
                <label for="advies-ja" class="checkbox-label">Brantjes Hypotheken mag mij benaderen voor financieel advies</label>
              </div>
            </div>
            <div class="checkbox-row">
              <div class="checkbox-col">
                <input type="checkbox" id="nieuwsbrief" name="nieuwsbrief">
              </div>
              <div class="label-col">
                <label for="nieuwsbrief" class="checkbox-label">Houd mij periodiek op de hoogte van actualiteiten en nieuws van Brantjes Makelaars in de vorm van een nieuwsbrief of mailing.</label>
              </div>
            </div>
            <div class="checkbox-row">
              <div class="checkbox-col">
                <input type="checkbox" id="privacy" name="privacy" required>
              </div>
              <div class="label-col">
                <label for="privacy" class="checkbox-label"><span style="color: #E2001A; font-weight: bold; margin-right: 4px;">*</span>Bij het gebruiken van dit formulier ga ik akkoord met het opslaan en verwerken van de door mij opgegeven gegevens zoals beschreven in het privacybeleid.</label>
              </div>
            </div>
            <button type="submit" class="submit-btn">Verzend</button>
          </form>
        `;

        const bookingForm = bookingContent.querySelector('.brantjes-booking-form');
        if (bookingForm) {
            bookingForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const payload = {
                  propertyAddress: bookingForm['property-address']?.value,
                  day: bookingForm['day']?.value,
                  partOfDay: bookingForm['partofday']?.value,
                  message: bookingForm['message']?.value,
                  firstName: bookingForm['first-name']?.value,
                  lastName: bookingForm['last-name']?.value,
                  email: bookingForm['email']?.value,
                  phone: bookingForm['phone']?.value,
                  advies: bookingForm['advies-ja']?.checked,
                  nieuwsbrief: bookingForm['nieuwsbrief']?.checked,
                  privacy: bookingForm['privacy']?.checked
                };
                if (window.voiceflow && window.voiceflow.chat && window.voiceflow.chat.interact) {
                  window.voiceflow.chat.interact({
                    type: 'complete',
                    payload: payload,
                  });
                }
                let confirmMsg = bookingForm.querySelector('.booking-confirm-msg');
                if (!confirmMsg) {
                  confirmMsg = document.createElement('div');
                  confirmMsg.className = 'booking-confirm-msg';
                  confirmMsg.style.color = '#1EC773';
                  confirmMsg.style.fontWeight = 'bold';
                  confirmMsg.style.marginTop = '16px';
                  confirmMsg.style.textAlign = 'center';
                  bookingForm.appendChild(confirmMsg);
                }
                confirmMsg.textContent = 'Je bezichtigingsverzoek is verzonden!';
                setTimeout(() => {
                  const modal = bookingForm.closest('.brantjes-modal-backdrop');
                  if (modal) {
                    modal.classList.add('invisible');
                    setTimeout(() => {
                      modal.remove();
                    }, 350);
                  }
                }, 3000);
            });
        }
        openModal(bookingContent);
    }

    // --- SHARED PROPERTY DETAILS RENDER FUNCTION ---
    function renderPropertyDetails({ property, element, showBookingModal, showSearchNearby, isModal }) {
      // Container for details
      const detailContent = document.createElement('div');
      detailContent.className = 'detail-popup-content';

      // --- HEADER SECTION ---
      const header = document.createElement('div');
      header.className = 'detail-popup-header';
      const straat = property.adres?.straat || '';
      const huisnummer = property.adres?.huisnummer?.hoofdnummer || '';
      const streetAddress = [straat, huisnummer].filter(Boolean).join(' ');
      const titleMain = document.createElement('h1');
      titleMain.className = 'detail-popup-title-main';
      titleMain.textContent = streetAddress || 'Onbekend adres';
      header.appendChild(titleMain);

      const headerRow = document.createElement('div');
      headerRow.className = 'detail-popup-header-row';
      const plaats = property.adres?.plaats || '';
      const postcode = property.adres?.postcode || '';
      let hasAddress = Boolean(postcode || plaats);
      let hasEnergy = Boolean(property.algemeen?.energieklasse);
      if (hasAddress) {
        const addrSpan = document.createElement('span');
        addrSpan.className = 'detail-popup-header-details';
        addrSpan.textContent = `${postcode} ${formatCityName(plaats)}`.trim();
        addrSpan.style.fontWeight = 'bold';
        headerRow.appendChild(addrSpan);
      }
      if (hasAddress && hasEnergy) {
        const dot = document.createElement('span');
        dot.className = 'detail-popup-dot';
        dot.textContent = '•';
        headerRow.appendChild(dot);
      }
      if (hasEnergy) {
        const energyDiv = document.createElement('div');
        energyDiv.className = `energy-label-detail energy-label-detail-${property.algemeen.energieklasse} detail-popup-header-energy`;
        energyDiv.textContent = property.algemeen.energieklasse;
        headerRow.appendChild(energyDiv);
        const dot2 = document.createElement('span');
        dot2.className = 'detail-popup-dot';
        dot2.textContent = '•';
        headerRow.appendChild(dot2);
      }
      const price = property.financieel?.overdracht?.koopprijs || 0;
      const priceDiv = document.createElement('div');
      priceDiv.className = 'detail-popup-header-price';
      priceDiv.innerHTML = `€ ${price.toLocaleString('nl-NL')} <span style="font-size:1.08rem;font-weight:400;">k.k.</span>`;
      headerRow.appendChild(priceDiv);
      const viewingBtn = document.createElement('button');
      viewingBtn.className = 'detail-popup-header-viewing-btn';
      viewingBtn.textContent = 'Bezichtiging';
      viewingBtn.onclick = () => showBookingModal(property);
      headerRow.appendChild(viewingBtn);
      header.appendChild(headerRow);
      detailContent.appendChild(header);

      // --- IMAGES ROW ---
      const media = Array.isArray(property.media) ? property.media : [];
      const allImgs = [];
      const mainImgObj = media.find(m => m.vrijgave && m.soort === 'HOOFDFOTO' && m.mimetype && m.mimetype.startsWith('image/'))
          || media.find(m => m.vrijgave && m.mimetype && m.mimetype.startsWith('image/'));
      if (mainImgObj) allImgs.push({ url: mainImgObj.link, originalIndex: allImgs.length });
      media.filter(m => m.vrijgave && m.soort === 'FOTO' && m.mimetype && m.mimetype.startsWith('image/'))
          .forEach(f => {
              if (!allImgs.some(img => img.url === f.link)) allImgs.push({ url: f.link, originalIndex: allImgs.length });
          });
      let imageList = [...allImgs];
      const imagesRow = document.createElement('div');
      imagesRow.className = 'detail-popup-images-row';
      const mainImgCol = document.createElement('div');
      mainImgCol.className = 'detail-popup-main-image';
      const mainImg = document.createElement('img');
      mainImg.src = (imageList[0] ? (imageList[0].url + (imageList[0].url.includes('?') ? '&resize=4' : '?resize=4')) : 'https://via.placeholder.com/600x400?text=No+Image');
      mainImg.alt = 'Hoofdfoto';
      mainImgCol.appendChild(mainImg);
      let counter;
      if (imageList.length > 1) {
          counter = document.createElement('div');
          counter.className = 'detail-popup-main-image-counter';
          counter.textContent = `${imageList[0].originalIndex + 1}/${allImgs.length}`;
          mainImgCol.appendChild(counter);
      }
      imagesRow.appendChild(mainImgCol);
      const thumbsCol = document.createElement('div');
      thumbsCol.className = 'detail-popup-thumbnails';
      function renderThumbnails() {
          thumbsCol.innerHTML = '';
          const totalThumbs = Math.min(8, imageList.length);
          for (let i = 1; i < totalThumbs; i++) {
              const thumbDiv = document.createElement('div');
              thumbDiv.className = 'detail-popup-thumbnail';
              let thumbUrl = imageList[i].url;
              if (thumbUrl) {
                  thumbUrl += thumbUrl.includes('?') ? '&resize=4' : '?resize=4';
              }
              thumbDiv.style.backgroundImage = `url('${thumbUrl}')`;
              let gridPos = i;
              if (gridPos <= 4) {
                thumbDiv.classList.add('fade-in');
                thumbDiv.style.gridRow = ((gridPos - 1) % 2) + 1;
                thumbDiv.style.gridColumn = Math.floor((gridPos - 1) / 2) + 1;
              } else {
                thumbDiv.style.gridRow = ((gridPos - 1) % 2) + 1;
                thumbDiv.style.gridColumn = Math.floor((gridPos - 1) / 2) + 1;
              }
              thumbDiv.onclick = () => {
                  imageList = imageList.slice(i).concat(imageList.slice(0, i));
                  mainImg.src = (imageList[0] ? (imageList[0].url + (imageList[0].url.includes('?') ? '&resize=4' : '?resize=4')) : 'https://via.placeholder.com/600x400?text=No+Image');
                  if (counter) {
                      counter.textContent = `${imageList[0].originalIndex + 1}/${allImgs.length}`;
                  }
                  renderThumbnails();
              };
              thumbsCol.appendChild(thumbDiv);
          }
      }
      renderThumbnails();
      imagesRow.appendChild(thumbsCol);
      detailContent.appendChild(imagesRow);

      // --- SPECIFICATIONS ROW (Brantjes style) ---
      const specsRow = document.createElement('div');
      specsRow.className = 'detail-popup-specs-row';
      const woonopp = property.algemeen?.woonoppervlakte;
      if (woonopp) {
        const woonoppSpan = document.createElement('span');
        woonoppSpan.innerHTML = `<strong>${woonopp} m²</strong> woonoppervlakte`;
        specsRow.appendChild(woonoppSpan);
      }
      const dot1 = document.createElement('span');
      dot1.className = 'detail-popup-dot';
      dot1.textContent = '•';
      specsRow.appendChild(dot1);
      const slaapkamers = property.detail?.etages?.reduce((acc, e) => acc + (e.aantalSlaapkamers || 0), 0) || property.algemeen?.aantalSlaapkamers;
      if (slaapkamers) {
        const slaapSpan = document.createElement('span');
        slaapSpan.innerHTML = `<strong>${slaapkamers}</strong> slaapkamers`;
        specsRow.appendChild(slaapSpan);
      }
      const dot2 = document.createElement('span');
      dot2.className = 'detail-popup-dot';
      dot2.textContent = '•';
      specsRow.appendChild(dot2);
      const bouwjaar = property.algemeen?.bouwjaar;
      if (bouwjaar) {
        const bouwjaarSpan = document.createElement('span');
        bouwjaarSpan.innerHTML = `Bouwjaar <strong>${bouwjaar}</strong>`;
        specsRow.appendChild(bouwjaarSpan);
      }
      const dot3 = document.createElement('span');
      dot3.className = 'detail-popup-dot';
      dot3.textContent = '•';
      specsRow.appendChild(dot3);
      const perceel = property.detail?.kadaster?.[0]?.kadastergegevens?.oppervlakte;
      if (perceel) {
        const perceelSpan = document.createElement('span');
        perceelSpan.innerHTML = `<strong>${perceel} m²</strong> perceel`;
        specsRow.appendChild(perceelSpan);
      }
      detailContent.appendChild(specsRow);

      // --- DESCRIPTION with markdown and 'toon meer' ---
      const desc = property.teksten?.aanbiedingstekst || '';
      const descDiv = document.createElement('div');
      descDiv.style.margin = '16px 0 0 0';
      descDiv.style.fontSize = '15px';
      descDiv.style.color = '#333';
      descDiv.style.lineHeight = '1.6';
      descDiv.style.wordBreak = 'break-word';
      let moreBtn = null;
      let truncated = false;
      let descExpanded = false;
      let shortDesc = desc;
      if (desc.length > 400) {
          shortDesc = desc.slice(0, 400).split('\n').slice(0, 3).join('\n') + '...';
          truncated = true;
      }
      function renderMarkdown(md) {
        if (window.marked) {
          descDiv.innerHTML = window.marked.parse(md);
        } else {
          descDiv.textContent = md;
        }
        if (truncated && moreBtn) {
          descDiv.appendChild(moreBtn);
        }
      }
      if (!window.marked) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
        script.onload = () => {
          renderMarkdown(truncated ? shortDesc : desc);
        };
        document.head.appendChild(script);
      }
      renderMarkdown(truncated ? shortDesc : desc);
      if (truncated) {
          moreBtn = document.createElement('button');
          moreBtn.textContent = 'Toon meer';
          moreBtn.style.background = 'none';
          moreBtn.style.color = '#1E7FCB';
          moreBtn.style.border = 'none';
          moreBtn.style.cursor = 'pointer';
          moreBtn.style.fontWeight = 'bold';
          moreBtn.style.display = 'block';
          moreBtn.style.margin = '8px 0 0 0';
          moreBtn.style.textAlign = 'left';
          moreBtn.onclick = () => {
              if (!descExpanded) {
                  renderMarkdown(desc);
                  moreBtn.textContent = 'Toon minder';
                  descExpanded = true;
              } else {
                  renderMarkdown(shortDesc);
                  moreBtn.textContent = 'Toon meer';
                  descExpanded = false;
              }
          };
          descDiv.appendChild(moreBtn);
      }
      detailContent.appendChild(descDiv);

      // --- Compact, expandable specifications table ---
      const specsSections = [
        {
          title: 'Overdracht',
          rows: [
            ['Prijs', `€ ${(property.financieel?.overdracht?.koopprijs || 0).toLocaleString('nl-NL')} k.k.`],
            ['Status', property.financieel?.overdracht?.status || ''],
            ['Aanvaarding', property.financieel?.overdracht?.aanvaarding || ''],
            ['Aangeboden sinds', property.financieel?.overdracht?.aangebodenSinds || ''],
          ]
        },
        {
          title: 'Bouw',
          rows: [
            ['Type object', property.object?.type?.objecttype || ''],
            ['Soort', property.algemeen?.woonhuissoort || ''],
            ['Type', property.algemeen?.woonhuistype || ''],
            ['Bouwjaar', property.algemeen?.bouwjaar || ''],
            ['Dak type', property.detail?.buitenruimte?.daktype || ''],
            ['Isolatievormen', (property.algemeen?.isolatievormen || []).join(', ')],
          ]
        },
        {
          title: 'Oppervlaktes en inhoud',
          rows: [
            ['Perceel', (property.detail?.kadaster?.[0]?.kadastergegevens?.oppervlakte || '') + ' m²'],
            ['Woonoppervlakte', (property.algemeen?.woonoppervlakte || '') + ' m²'],
            ['Inhoud', (property.algemeen?.inhoud || '') + ' m³'],
            ['Buitenruimtes gebouwgebonden of vrijstaand', (property.detail?.buitenruimte?.oppervlakteGebouwgebondenBuitenruimte || '') + ' m²'],
          ]
        },
        {
          title: 'Indeling',
          rows: [
            ['Aantal kamers', property.algemeen?.aantalKamers || ''],
            ['Aantal slaapkamers', property.detail?.etages?.reduce((acc, e) => acc + (e.aantalSlaapkamers || 0), 0) || ''],
          ]
        },
        {
          title: 'Locatie',
          rows: [
            ['Ligging', (property.algemeen?.liggingen || []).join(', ')],
          ]
        },
        {
          title: 'Tuin',
          rows: [
            ['Type', (property.detail?.buitenruimte?.tuintypes || []).join(', ')],
            ['Staat', property.detail?.buitenruimte?.tuinkwaliteit || ''],
            ['Ligging', property.detail?.buitenruimte?.hoofdtuinlocatie || ''],
            ['Achterom', property.detail?.buitenruimte?.hoofdtuinAchterom ? 'Ja' : 'Nee'],
          ]
        },
        {
          title: 'Uitrusting',
          rows: [
            ['Soorten warm water', (property.algemeen?.warmwatersoorten || []).join(', ')],
            ['Parkeer faciliteiten', (property.detail?.buitenruimte?.parkeerfaciliteiten || []).join(', ')],
          ]
        },
      ];
      const specsTable = document.createElement('table');
      specsTable.style.width = '100%';
      specsTable.style.marginTop = '10px';
      specsTable.style.fontSize = '0.85rem';
      specsTable.style.borderCollapse = 'collapse';
      specsTable.style.background = 'transparent';
      specsTable.style.lineHeight = '1.4';
      specsTable.style.tableLayout = 'fixed';
      specsTable.style.minWidth = '100%';
      specsTable.innerHTML = '';
      let specsExpanded = false;
      const maxRows = 6;
      let totalRows = 0;
      specsSections.forEach(section => totalRows += section.rows.length + 1);
      function renderSpecsTable(expand) {
        specsTable.innerHTML = '';
        let shownRows = 0;
        for (const section of specsSections) {
          const th = document.createElement('tr');
          const thCell = document.createElement('td');
          thCell.colSpan = 2;
          thCell.textContent = section.title;
          thCell.style.fontWeight = 'bold';
          thCell.style.fontSize = '1.1em';
          thCell.style.color = '#1E7FCB';
          thCell.style.padding = '10px 0 4px 0';
          thCell.style.background = 'transparent';
          th.appendChild(thCell);
          specsTable.appendChild(th);
          for (const [label, value] of section.rows) {
            if (!expand && shownRows >= maxRows) return;
            const tr = document.createElement('tr');
            const td1 = document.createElement('td');
            td1.textContent = label;
            td1.style.fontWeight = 'bold';
            td1.style.padding = '3px 8px 3px 0';
            td1.style.color = '#222';
            td1.style.borderBottom = '1px solid #eee';
            td1.style.background = 'transparent';
            td1.style.width = '50%';
            const td2 = document.createElement('td');
            td2.textContent = value;
            td2.style.padding = '3px 0 3px 8px';
            td2.style.color = '#444';
            td2.style.borderBottom = '1px solid #eee';
            td2.style.background = 'transparent';
            td2.style.width = '50%';
            tr.appendChild(td1);
            tr.appendChild(td2);
            specsTable.appendChild(tr);
            shownRows++;
          }
        }
      }
      renderSpecsTable(false);
      let specsBtn = null;
      if (totalRows > maxRows) {
        specsBtn = document.createElement('button');
        specsBtn.textContent = 'Toon alles';
        specsBtn.style.background = 'none';
        specsBtn.style.color = '#1E7FCB';
        specsBtn.style.border = 'none';
        specsBtn.style.cursor = 'pointer';
        specsBtn.style.fontWeight = 'bold';
        specsBtn.style.margin = '8px 0 0 0';
        specsBtn.style.display = 'block';
        specsBtn.style.textAlign = 'left';
        specsBtn.onclick = () => {
          specsExpanded = !specsExpanded;
          renderSpecsTable(specsExpanded);
          specsBtn.textContent = specsExpanded ? 'Toon minder' : 'Toon alles';
          if (specsBtn.parentNode !== specsTable.parentNode) {
            specsTable.parentNode.appendChild(specsBtn);
          }
        };
      }
      detailContent.appendChild(specsTable);
      if (specsBtn) detailContent.appendChild(specsBtn);

      // --- "Zoek in de buurt" button ---
      if (showSearchNearby) {
        const searchNearbyDiv = document.createElement('div');
        searchNearbyDiv.style.margin = '20px 0 0 0';
        searchNearbyDiv.style.textAlign = 'center';
        const searchNearbyBtn = document.createElement('button');
        searchNearbyBtn.textContent = 'Zoek in de buurt';
        searchNearbyBtn.className = 'search-nearby-btn';
        searchNearbyBtn.onclick = () => {
            const straat = property.adres?.straat || '';
            const huisnummer = (property.adres && property.adres.huisnummer && typeof property.adres.huisnummer.hoofdnummer !== 'undefined' && property.adres.huisnummer.hoofdnummer !== null)
                ? String(property.adres.huisnummer.hoofdnummer) : '';
            const plaats = property.adres?.plaats || '';
            if (window.voiceflow && window.voiceflow.chat && window.voiceflow.chat.interact) {
                window.voiceflow.chat.interact({
                    type: 'searchNearby',
                    payload: { 
                        straat: straat,
                        huisnummer: huisnummer,
                        plaats: plaats
                    },
                });
            } else {
                console.warn('Voiceflow API not available');
            }
        };
        searchNearbyBtn.style.background = '#51b2df';
        searchNearbyBtn.style.color = '#fff';
        searchNearbyBtn.style.border = 'none';
        searchNearbyBtn.style.borderRadius = '8px';
        searchNearbyBtn.style.fontSize = '16px';
        searchNearbyBtn.style.fontWeight = '600';
        searchNearbyBtn.style.padding = '12px 32px';
        searchNearbyBtn.style.cursor = 'pointer';
        searchNearbyBtn.style.transition = 'background 0.2s';
        searchNearbyBtn.style.boxShadow = '0 2px 8px rgba(30,127,203,0.08)';
        searchNearbyBtn.style.display = 'inline-block';
        searchNearbyBtn.style.margin = '0 auto';
        searchNearbyBtn.style.minWidth = '200px';
        searchNearbyBtn.onmouseover = () => searchNearbyBtn.style.background = '#166BB5';
        searchNearbyBtn.onmouseout = () => searchNearbyBtn.style.background = '#51b2df';
        searchNearbyDiv.appendChild(searchNearbyBtn);
        detailContent.appendChild(searchNearbyDiv);
      }

      element.appendChild(detailContent);
    }

    // --- PROPERTY DETAILS RENDERING ---
    const detailsContainer = document.createElement('div');
    detailsContainer.className = 'property-details-container';

    // Use the shared render function
    renderPropertyDetails({
      property,
      element,
      showBookingModal, // Pass the actual function, not a placeholder
      showSearchNearby: true,
      isModal: false
    });

    detailsContainer.appendChild(detailsContainer);
    element.appendChild(detailsContainer);
  },
};
