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
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        height: 100%;
        z-index: 1000;
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
        overflow: hidden;
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
        max-width: 1200px;
        height: auto;
        max-height: 100%;
        overflow-y: auto;
        transform: scale(0.9);
        transition: transform 0.3s ease;
        margin-top: 2rem;
        display: flex;
        flex-direction: column;
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
        font-size: 1.08rem;
        color: #222;
        font-weight: 700;
        margin-right: 1.2rem;
        white-space: nowrap;
      }
      .detail-popup-header-price {
        font-size: 1.08rem;
        font-weight: 700;
        color: #222;
        margin: 0;
        line-height: 1.1;
        margin-right: 1.2rem;
        margin-left: auto;
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
        font-size: 12px;
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
        align-items: flex-start;
        justify-content: center;
        position: relative;
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
        font-size: 0.95rem;
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
        font-size: 0.95rem;
        margin: 0;
        flex-wrap: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        width: 100%;
      }
    `;
    element.appendChild(style);

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
          addrSpan.textContent = `${postcode} ${plaats}`.trim();
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
        priceDiv.innerHTML = `€ ${price.toLocaleString('nl-NL')} <span style=\"font-size:1.08rem;font-weight:400;\">k.k.</span>`;
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

        // --- DESCRIPTION SECTION (Brantjes style) ---
        const descDiv = document.createElement('div');
        descDiv.className = 'detail-popup-info';
        descDiv.innerHTML = property.omschrijving || 'Geen beschrijving beschikbaar';
        detailContent.appendChild(descDiv);

        openModal(detailContent);
    }

    // ... rest of the existing code ...
  }
};
