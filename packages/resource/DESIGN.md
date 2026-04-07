# DockPass — Design System Agent
# @DESIGN

## Role
You are the design system enforcer for DockPass.
Every UI decision must follow this document.
Reference before writing any component styles.
No deviations without explicit approval.

---

## Colour Palette (Flat — No Gradients Ever)

```css
/* Primary */
--navy:        #0C447C;  /* primary, headers, CTAs, active */
--mid-blue:    #1A6FB5;  /* secondary buttons, icons */
--light-blue:  #E8F2FB;  /* card bg, icon chips, highlights */

/* Neutrals */
--white:       #FFFFFF;  /* page bg, cards, modals */
--off-white:   #F5F8FC;  /* section backgrounds */
--dark-text:   #0D1B2A;  /* headings, body */
--grey-text:   #6B7C93;  /* labels, captions, hints */
--border:      #D0E2F3;  /* card borders, dividers */
--border-dark: #A8C4E0;  /* focused borders */

/* Status (flat backgrounds) */
--success-bg:  #E8F9F4;
--success-text:#1D9E75;
--warning-bg:  #FEF3DC;
--warning-text:#E5910A;
--error-bg:    #FDEAEA;
--error-text:  #D63B3B;
--info-bg:     #E8F2FB;
--info-text:   #0C447C;
```

---

## Typography

```css
/* Import */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

/* Scale */
.text-display { font-size: 28px; font-weight: 700; line-height: 1.2; letter-spacing: -0.02em; }
.text-h1      { font-size: 22px; font-weight: 600; line-height: 1.25; letter-spacing: -0.01em; }
.text-h2      { font-size: 18px; font-weight: 600; line-height: 1.3; }
.text-h3      { font-size: 16px; font-weight: 500; line-height: 1.4; }
.text-body    { font-size: 15px; font-weight: 400; line-height: 1.6; }
.text-label   { font-size: 13px; font-weight: 500; line-height: 1.4; }
.text-caption { font-size: 12px; font-weight: 400; line-height: 1.5; }
.text-micro   { font-size: 11px; font-weight: 500; line-height: 1.4; }

/* Waiver signature field */
.text-signature {
  font-family: 'Satisfy', cursive; /* Google Font */
  font-size: 24px;
  color: #0C447C;
  border: none;
  border-bottom: 2px solid #0C447C;
}
```

---

## Spacing (4px base unit)

```
4px   — micro: between inline elements
8px   — tight: related items
12px  — standard: padding, small gaps
16px  — page: horizontal page padding
20px  — card: internal card padding
24px  — section: between sections
32px  — large: major section breaks
48px  — hero: hero section padding
```

---

## Border Radius

```
cards:          16px
buttons:        12px
pills/badges:   20px (full round)
input fields:   10px
icon chips:     10px
modals:         20px (bottom sheet: 20px top only)
```

---

## Shadows (minimal, very subtle)

```css
/* Cards only */
.shadow-card {
  box-shadow: 0 1px 4px rgba(12, 68, 124, 0.08);
}

/* No other shadows — flat design */
/* No drop-shadow on buttons */
/* No elevation system */
```

---

## Components Reference

### Primary Button
```tsx
<button className="
  w-full h-[52px] bg-[#0C447C] text-white
  font-medium text-[15px] rounded-xl
  active:scale-[0.97] transition-transform duration-100
  disabled:opacity-40 disabled:cursor-not-allowed
">
  {loading ? <AnchorLoader size="sm" color="white" /> : label}
</button>
```

### Secondary Button
```tsx
<button className="
  w-full h-[52px] bg-white text-[#0C447C]
  border-2 border-[#0C447C] font-medium text-[15px]
  rounded-xl active:bg-[#E8F2FB]
  transition-colors duration-150
">
  {label}
</button>
```

### Ghost Button (Skip, Cancel, Back)
```tsx
<button className="
  text-[#0C447C] underline text-[15px]
  font-normal py-2 px-4
  min-h-[44px] flex items-center
">
  {label}
</button>
```

### Info Card
```tsx
<div className="
  bg-white rounded-2xl border border-[#D0E2F3]
  p-5 shadow-[0_1px_4px_rgba(12,68,124,0.08)]
">
  <div className="flex items-center gap-3 mb-4">
    <div className="w-10 h-10 rounded-[10px] bg-[#E8F2FB]
                    flex items-center justify-center flex-shrink-0">
      <Icon size={20} className="text-[#0C447C]" />
    </div>
    <h2 className="text-[18px] font-semibold text-[#0D1B2A]">
      {title}
    </h2>
  </div>
  {children}
</div>
```

### Status Badge
```tsx
const variants = {
  signed:    'bg-[#E8F9F4] text-[#1D9E75]',
  pending:   'bg-[#FEF3DC] text-[#E5910A]',
  cancelled: 'bg-[#FDEAEA] text-[#D63B3B]',
  upcoming:  'bg-[#E8F2FB] text-[#0C447C]',
}

<span className={`
  inline-flex items-center px-2.5 py-1
  rounded-full text-[11px] font-medium
  ${variants[variant]}
`}>
  {label}
</span>
```

### Checklist Item
```tsx
<div className="flex items-center gap-3 py-3
                border-b border-[#D0E2F3] last:border-0
                min-h-[48px]">
  <input type="checkbox"
    className="w-[22px] h-[22px] rounded-[6px]
               border-2 border-[#D0E2F3]
               checked:bg-[#0C447C] checked:border-[#0C447C]
               cursor-pointer accent-[#0C447C]"
  />
  <span className={`text-[15px] ${checked
    ? 'text-[#6B7C93] line-through'
    : 'text-[#0D1B2A]'
  }`}>
    {label}
  </span>
</div>
```

### Step Indicator
```tsx
<div className="flex items-center justify-center gap-2 mb-6">
  {steps.map((_, i) => (
    <div key={i} className={`
      rounded-full transition-all duration-200
      ${i < current
        ? 'w-2 h-2 bg-[#0C447C]'           // completed
        : i === current
        ? 'w-2 h-2 bg-[#1D9E75] scale-125' // active
        : 'w-2 h-2 bg-[#D0E2F3]'           // upcoming
      }
    `} />
  ))}
</div>
```

### Bottom Sheet
```tsx
<div className="
  fixed inset-0 z-50
  bg-[rgba(12,68,124,0.15)]
  flex items-end
">
  <div className="
    w-full bg-white
    rounded-t-[20px]
    px-5 pb-8 pt-3
    max-h-[90vh] overflow-y-auto
  ">
    {/* Handle bar */}
    <div className="w-10 h-1 bg-[#D0E2F3] rounded-full mx-auto mb-4" />
    {children}
  </div>
</div>
```

---

## Hero Section (Trip Page)

```tsx
<section className="bg-[#0C447C] px-4 pt-4 pb-8">
  {/* Top row */}
  <div className="flex items-center justify-between mb-4">
    <span className="text-white font-bold text-[16px]">DockPass</span>
    <button className="text-[24px]">🇬🇧</button>
  </div>
  
  {/* Boat name */}
  <h1 className="text-white text-[28px] font-bold mb-3">
    Conrad's Yacht Miami
  </h1>
  
  {/* Trip meta chips */}
  <div className="flex items-center gap-2 flex-wrap mb-3">
    {['📅 Sat Oct 21', '⏰ 2:00 PM', '⏳ 2 hours'].map(chip => (
      <span key={chip}
        className="bg-white/20 text-white text-[13px]
                   px-3 py-1 rounded-full">
        {chip}
      </span>
    ))}
  </div>
  
  {/* Marina */}
  <p className="text-white/70 text-[13px] flex items-center gap-1">
    📍 Miami Beach Marina
  </p>
</section>
```

---

## Boarding Pass Design

```tsx
<div className="
  bg-white rounded-2xl mx-4
  shadow-[0_4px_24px_rgba(12,68,124,0.12)]
  overflow-hidden
">
  {/* Top half */}
  <div className="px-5 pt-5 pb-4">
    <p className="text-[11px] font-medium text-[#6B7C93]
                  tracking-widest uppercase mb-2">
      DOCKPASS
    </p>
    <h2 className="text-[20px] font-bold text-[#0D1B2A] mb-4">
      Conrad's Yacht Miami
    </h2>
    <div className="grid grid-cols-3 gap-2 mb-1">
      {[
        { label: 'Date', value: 'Sat Oct 21' },
        { label: 'Time', value: '2:00 PM' },
        { label: 'Duration', value: '2 hours' },
      ].map(({ label, value }) => (
        <div key={label}>
          <p className="text-[11px] text-[#6B7C93]">{label}</p>
          <p className="text-[14px] font-semibold text-[#0D1B2A]">{value}</p>
        </div>
      ))}
    </div>
  </div>
  
  {/* Dashed divider */}
  <div className="flex items-center px-4">
    <div className="flex-1 border-t-2 border-dashed border-[#D0E2F3]" />
    <span className="px-2 text-[#D0E2F3] text-lg">✂</span>
    <div className="flex-1 border-t-2 border-dashed border-[#D0E2F3]" />
  </div>
  
  {/* Bottom half — QR */}
  <div className="px-5 pt-4 pb-5 flex flex-col items-center">
    <div className="bg-[#0D1B2A] p-3 rounded-xl mb-3">
      <QRCodeSVG value={qrToken} size={160} fgColor="#FFFFFF"
                 bgColor="#0D1B2A" />
    </div>
    <p className="text-[12px] text-[#6B7C93] mb-1">
      Slip 14A · Miami Beach Marina
    </p>
    <p className="text-[16px] font-bold text-[#0D1B2A]">
      Sofia Martinez
    </p>
  </div>
</div>
```

---

## Anchor Loading — Full Page

```tsx
<div className="fixed inset-0 bg-white flex flex-col
                items-center justify-center gap-3 z-50">
  <AnchorLoader size="lg" color="navy" />
  <span className="text-[#0C447C] text-[16px] font-medium">
    DockPass
  </span>
</div>
```

---

## Offline Banner

```tsx
<div className="fixed top-0 left-0 right-0 z-50
                bg-[#E5910A] text-white text-center
                py-2 px-4 text-[13px] font-medium">
  ⚠️ You're offline — some features unavailable
</div>
```

---

## PWA Install Banner

```tsx
<div className="bg-[#0C447C] rounded-xl p-4 flex items-center gap-3">
  <div className="w-10 h-10 bg-white/20 rounded-xl
                  flex items-center justify-center text-xl flex-shrink-0">
    ⚓
  </div>
  <div className="flex-1">
    <p className="text-white font-medium text-[14px]">
      Add DockPass to your home screen
    </p>
    <p className="text-white/70 text-[12px]">
      Get weather updates and dock alerts
    </p>
  </div>
  <button onClick={onInstall}
    className="bg-white text-[#0C447C] text-[13px] font-semibold
               px-3 py-1.5 rounded-lg flex-shrink-0">
    Add
  </button>
</div>
```

---

## Do Not

```
✗ No gradients anywhere
✗ No drop shadows (except card: 0 1px 4px)
✗ No border radius > 20px
✗ No font weight > 700
✗ No font size < 11px
✗ No colours outside the palette
✗ No decorative animations (only functional)
✗ No dark backgrounds on outer containers
✗ No red for anything except genuine errors
✗ No ALL CAPS text in UI (operators' listings taught us this)
```
