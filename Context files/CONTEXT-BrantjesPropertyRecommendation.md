# Property Recommendations Carousel Extension

## 1. Overview

A rotating carousel of recommended properties that:
- Highlights the center card at a larger scale
- Allows infinite looping: as one card leaves on the left, the next hidden card enters on the right
- Opens two types of pop-ups:
  - Detail Pop-up on card click
  - Book Viewing form on button click

### Screenshots for Reference
1. Carousel with center card larger than its neighbors
2. Detail Pop-up layout
3. Book Viewing form fields

---

## 2. Carousel Behavior & States

### 2.1 Layout & Sizing
- **Center (active) card**: Scale ≈ 1.0 (100%)
- **Side cards**: Scale ≈ 0.85 (85%)
- **Hidden cards**: Positioned just outside viewport on left/right

### 2.2 Navigation & Looping
- **Auto-rotate**: Optional, user-configurable delay (e.g. 5s)
- **Manual**: Swipe on touch, arrow buttons (‹ ›) or drag on desktop
- **Infinite loop**: After rightmost enters, next from left re-enters seamlessly

### 2.3 Transitions
- **Easing**: `cubic-bezier(0.22, 1, 0.36, 1)` (springy but smooth)
- **Duration**: 400ms per shift
- **Scale/translate**: Simultaneous scale up/down + horizontal translate

---

## 3. Card Interactions

### 3.1 Hover (Desktop)
**On hover of active (center) card:**
- Fade in a semi-transparent overlay on the footer area
- Slide up the "Bezichtigen" (Book Viewing) button:
  - From bottom: `translateY(100%) → 0` over 200ms with ease-out

**On hover out:**
- Reverse slide and fade out

### 3.2 Click Actions
- **Card body click** (anywhere except the button): Open Detail Pop-up (see §4)
- **Booking button click**: Open Book Viewing form (see §5), instead of Detail

---

## 4. Detail Pop-up

### 4.1 Structure
- **Backdrop**: Fullscreen overlay, semi-dark `rgba(0,0,0,0.4)`, blurred
- **Container**: Centered panel, white background, rounded corners, shadow
- **Close**: Top-right X icon closes pop-up

### 4.2 Content Layout
- **Left**: Large main image (landscape) with rounded corners
- **Right**: Grid of 2×2 thumbnail placeholders for additional images
- **Below images**:
  - Property title (e.g. J M van der Meystraat 79)
  - Address, agent name & phone, energy label icon, price

---

## 5. Book Viewing Form Pop-up

### 5.1 Structure & Backdrop
- Same backdrop style as Detail Pop-up
- Panel overlays on top of carousel

### 5.2 Fields & Layout

#### Property Information
1. **Property** (readonly): Prefilled address (e.g. Hendrik Mandeweg 13B)
2. **Voorkeursdag** (Preferred day): Dropdown, default "Geen voorkeur"
3. **Dagdeel** (Time of day): Dropdown, default "Geen voorkeur"
4. **Jouw bericht** (Message): Textarea

#### Contact Information
5. **Voornaam***, **Achternaam***: Text inputs
6. **E-mail***, **Telefoon***: Text inputs
7. **Brantjes Hypotheken mag mij benaderen…**: Two radio/check options
8. **Nieuwsbrief**: Checkbox "Houd mij periodiek op de hoogte…"
9. **Privacy**: Checkbox with agreement text (required)

- **Submit button** ("Verzend") pinned at bottom

---

## 6. Styling Guide

### 6.1 Typography
- **Headings**: Bold, 1.25rem (20px), color `#1E7FCB` (blue)
- **Body**: Regular, 1rem (16px), color `#333333`
- **Labels & placeholders**: 0.875rem (14px), color `#666666`

### 6.2 Colors
- **Primary blue**: `#1E7FCB` (buttons, headings)
- **Button hover**: `#166BB5`
- **Card background**: White `#FFFFFF`
- **Carousel backdrop**: `rgba(0,0,0,0.05)` under cards; full-popups use `rgba(0,0,0,0.4)`
- **Form fields border**: `#CCCCCC`, focus `#1E7FCB` outline

### 6.3 Buttons
- **Bezichtigen**:
  - Background: `#1E7FCB`, white text, rounded 0.25rem (4px)
  - Padding: 0.5rem 1rem
  - Slide-in footer on hover (§3.1)
- **Submit**:
  - Same as above, full-width in form footer

### 6.4 Shadows & Corners
- **Cards & pop-ups**: `box-shadow: 0 4px 12px rgba(0,0,0,0.1)`
- **Border-radius**: 0.5rem (8px) for cards; 0.25rem (4px) for buttons

---

## 7. Implementation Notes

- Use a JS carousel library (e.g. Swiper.js) or custom with CSS transitions
- Manage z-index so active card always is on top
- Ensure accessibility: focus states, keyboard navigation, ARIA labels
- Responsive: adapt to mobile (single card center, side previews) and tablet

---

## 8. Voiceflow Extension Implementation Structure

### 8.1 Extension Framework
```javascript
export const RealEstateExtension = {
  name: 'RealEstate',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_real_estate' ||
    (trace.payload && trace.payload.name === 'ext_real_estate'),
  render: ({ trace, element }) => {
    // Implementation here
  }
}
```

### 8.2 Data Flow
1. **Voiceflow Payload**: Properties data from chatbot
2. **Parsing**: Extract and validate property objects
3. **Carousel State**: Manage current index, transitions, animations
4. **User Interactions**: Handle clicks, hovers, navigation
5. **Pop-ups**: Detail view and booking form modals

### 8.3 Component Architecture
- **Carousel Container**: Main wrapper with overflow hidden
- **Carousel Track**: Horizontal container for all cards
- **Property Cards**: Individual cards with hover states
- **Navigation Controls**: Arrow buttons and indicators
- **Modal System**: Backdrop and pop-up containers
- **Form Components**: Booking form with validation

### 8.4 State Management
- `currentIndex`: Active card position
- `isTransitioning`: Animation state
- `autoPlayActive`: Auto-rotation status
- `modalOpen`: Current pop-up state
- `selectedProperty`: Property data for forms

### 8.5 Event Handling
- **Touch Events**: Swipe gestures for mobile
- **Mouse Events**: Hover, click, drag for desktop
- **Keyboard Events**: Arrow keys, escape for accessibility
- **Form Events**: Validation, submission, reset