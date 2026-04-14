# BoatCheckin — Design System Agent
# @DESIGN

## Role
You are the design system enforcer for BoatCheckin.
Every UI decision must follow this document.
Reference before writing any component styles.
No deviations without explicit approval.

---

## Design Philosophy

BoatCheckin uses a **dual-surface** design system:

| Surface | Context | Identity |
|---------|---------|----------|
| **Dark Maritime** | Homepage, marketing, public landing | Deep ink backgrounds, gold accents, serif headlines, editorial luxury |
| **Light Dashboard** | Operator dashboard, guest flows, captain iPad | White surfaces, navy accents, flat cards, mobile-first |

Both surfaces share the same **typography, spacing grid, and icon system** — only the colour context changes.

---

## Colour Palette

### Dark Maritime Surface (Homepage & Marketing)

```css
:root {
  /* ── Ink Layers (backgrounds) ── */
  --ink:         #07101C;   /* primary page background */
  --ink2:        #0B1624;   /* alternate section bg (cover, pricing cards) */
  --ink3:        #0F1E30;   /* elevated sections (attorney, SB606) */

  /* ── Brand Accent ── */
  --navy:        #0B3660;   /* deep navy — nav CTA bg, stat cards */
  --gold:        #B8882A;   /* primary accent — headlines italic, CTAs, kickers, badges */
  --gold-hi:     #D4A84B;   /* hover state for gold CTAs */
  --gold-dim:    rgba(184,136,42,0.1);   /* gold tint bg (quote panels, total cards) */
  --gold-line:   rgba(184,136,42,0.28);  /* gold border/divider */

  /* ── Text Hierarchy ── */
  --white:       #FFFFFF;   /* headings, primary text on dark */
  --text:        #DCE5F0;   /* body copy on dark bg */
  --text-mid:    #9AADC4;   /* secondary text, descriptions, nav links */
  --text-dim:    #5A7090;   /* meta text, kickers, footer labels */

  /* ── Structure ── */
  --rule:        rgba(255,255,255,0.07);   /* section/cell dividers */
  --rule-gold:   rgba(184,136,42,0.2);     /* gold-tinted dividers */
}
```

### Light Dashboard Surface (App)

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
--success-bg:  #E8F9F4;   --success-text: #1D9E75;
--warning-bg:  #FEF3DC;   --warning-text: #E5910A;
--error-bg:    #FDEAEA;   --error-text:   #D63B3B;
--info-bg:     #E8F2FB;   --info-text:    #0C447C;
```

### Colour Bridge (Shared Between Surfaces)

| Token | Dark Surface | Light Surface | Usage |
|-------|-------------|---------------|-------|
| Gold accent | `#B8882A` | `#0C447C` (navy) | Primary CTA, active states |
| Body text | `#DCE5F0` | `#0D1B2A` | Paragraph copy |
| Muted text | `#9AADC4` | `#6B7C93` | Labels, captions |
| Dividers | `rgba(255,255,255,0.07)` | `#D0E2F3` | Section borders |

---

## Typography

### Font Stack

```css
/* Dual font system */
--serif: 'Cormorant Garamond', Georgia, serif;    /* Headlines, display, numbers, quotes */
--sans:  'Instrument Sans', system-ui, sans-serif; /* Body, UI, buttons, labels */

/* Google Fonts import */
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600;1,700&family=Instrument+Sans:wght@300;400;500;600&display=swap');
```

### Dark Surface Type Scale (Homepage)

| Class | Font | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|------|--------|-------------|----------------|-------|
| `.hero-h` | Serif | `clamp(48px, 5.8vw, 78px)` | 700 | 1.0 | -0.03em | Hero headline |
| `.sh` | Serif | `clamp(28px, 3.5vw, 46px)` | 700 | 1.08 | -0.025em | Section headline |
| `.sb-h` | Serif | `clamp(22px, 3vw, 38px)` | 600 | 1.25 | -0.02em | Statement break |
| `.fh` | Serif | `clamp(34px, 5vw, 64px)` | 700 | 1.05 | -0.03em | Final CTA |
| `.why-h` | Serif | `clamp(26px, 3.2vw, 42px)` | 700 | 1.1 | -0.025em | Feature headline |
| `.why-num` | Serif | 88px | 700 | 0.9 | -0.05em | Giant stat number |
| `.hero-body` | Sans | 16px | 400 | 1.75 | — | Hero body copy |
| `.ssub` | Sans | 15px | 400 | 1.75 | — | Section subtitle |
| `.gc-t` | Sans | 16px | 600 | 1.3 | — | Grid cell title |
| `.gc-b` | Sans | 13px | 400 | 1.65 | — | Grid cell body |
| kicker | Sans | 11px | 600 | — | 0.2em | Section kicker (uppercase) |
| badge | Sans | 10px | 600 | — | 0.1em | Compliance badge (uppercase) |
| nav link | Sans | 13px | 400 | — | 0.05em | Navigation links |
| CTA button | Sans | 14px | 600 | — | 0.04em | Action buttons |

### Italic Rules

- **Gold italic in serif headlines** — `<em>` tags inside `.hero-h`, `.sh`, `.sb-h`, `.fh` render as `font-style: italic; color: var(--gold)`
- **Company tagline** — Serif, italic, `--text-mid` colour, used for subtitles: `font-family: var(--serif); font-style: italic`
- **Blockquotes** — Serif, italic, 18px, white on gold-dim background

### Light Surface Type Scale (Dashboard)

```css
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
16px  — page: horizontal page padding (mobile)
20px  — card: internal card padding
24px  — section: between sections
32px  — large: major section breaks
44px  — page-pad: horizontal page padding (desktop homepage)
48px  — hero: hero section padding
72px  — tight-section: section vertical padding (homepage)
88px  — section-pad: section vertical padding (homepage)
```

---

## Border Radius

```
Homepage cells:     5px   (grid cells, law cards, pricing)
Homepage badges:    3px   (compliance badges, buttons, nav)
Homepage inputs:    4px   (trip code finder)
Dashboard cards:    16px
Dashboard buttons:  12px
Dashboard pills:    20px  (full round)
Dashboard inputs:   10px
Dashboard modals:   20px  (bottom sheet: 20px top only)
```

---

## Shadows

```css
/* Dashboard — cards only */
.shadow-card {
  box-shadow: 0 1px 4px rgba(12, 68, 124, 0.08);
}

/* Homepage — no box-shadows */
/* The dark surface uses borders and background tints for depth */
/* No drop-shadow on buttons */
/* No elevation system */
```

---

## Homepage — Structural Patterns

### Grid Cell Pattern (Coverage, Legal, Flow)

```css
/* Container: 1px gap grid creates visible borders between cells */
.gcells {
  display: grid;
  gap: 1px;
  background: var(--rule);     /* gap colour = subtle divider */
  border: 1px solid var(--rule);
  border-radius: 5px;
  overflow: hidden;
}

/* Cell */
.gcell {
  background: var(--ink2);     /* solid on ink layer 2 */
  padding: 32px 28px;
  transition: background 0.25s;
}
.gcell:hover {
  background: rgba(184,136,42,0.04);  /* warm gold tint on hover */
}
```

**Grid column variants:**
- `.g3` → `repeat(3, 1fr)` — 3-column (coverage, legal)
- `.g4` → `repeat(4, 1fr)` — 4-column (flow, pricing, vessels)
- `.g2` → `repeat(2, 1fr)` — 2-column (stats)

### Section Header Pattern

```css
/* Kicker line + uppercase label */
.slabel {
  font-size: 11px; font-weight: 600;
  letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--gold);
  display: flex; align-items: center; gap: 10px;
}
.slabel::before {
  content: ''; width: 18px; height: 1px;
  background: var(--gold);
}
```

### Two-Column Section Head

```css
/* Left = kicker + headline, Right = subtitle paragraph */
.shead2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  margin-bottom: 52px;
  align-items: end;
}
```

### Statement Break

```css
/* Full-width centered quote between sections */
.statement-break {
  padding: 80px 44px;
  text-align: center;
  border-bottom: 1px solid var(--rule);
  position: relative; overflow: hidden;
}
.statement-break::before {
  /* Radial navy glow behind text */
  content: '';
  position: absolute; inset: 0;
  background: radial-gradient(ellipse 70% 80% at 50% 50%, rgba(11,54,96,0.2) 0%, transparent 70%);
  pointer-events: none;
}
/* Vertical gold rule above */
.sb-rule { width: 1px; height: 44px; background: var(--gold-line); margin: 0 auto 32px; }
```

### Compliance Badge

```css
.cbadge {
  font-size: 10px; font-weight: 600;
  letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--gold);
  border: 1px solid var(--gold-line);
  background: var(--gold-dim);
  padding: 5px 11px; border-radius: 3px;
  white-space: nowrap;
}
```

### Navigation (Fixed, Frosted)

```css
nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 300;
  height: 62px;
  background: rgba(7,16,28,0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--rule);
  padding: 0 44px;
}
```

### Logo Mark

```css
/* Anchor icon inside a gold-bordered circle */
.lmark {
  width: 26px; height: 26px;
  border: 1.5px solid var(--gold);
  border-radius: 50%;
  display: grid; place-items: center;
}
.lmark svg { width: 13px; height: 13px; color: var(--gold); }
```

### Scroll Reveal Animations

```css
/* Three-stage staggered reveal */
.r   { opacity: 0; transform: translateY(18px); transition: opacity .7s ease, transform .7s ease; }
.rd  { opacity: 0; transform: translateY(18px); transition: opacity .7s .13s ease, transform .7s .13s ease; }
.r2  { opacity: 0; transform: translateY(18px); transition: opacity .7s .25s ease, transform .7s .25s ease; }
.r.v, .rd.v, .r2.v { opacity: 1; transform: none; }
```

**Trigger:** IntersectionObserver at 6% threshold, rootMargin `0px 0px -24px 0px`.

### Ticker Strip

```css
.ticker {
  border-top: 1px solid var(--rule);
  border-bottom: 1px solid var(--rule);
  background: rgba(184,136,42,0.04);
  overflow: hidden; padding: 13px 0; white-space: nowrap;
}
.titem {
  font-size: 10px; font-weight: 600;
  letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--text-dim); padding: 0 36px;
}
.titem::after { content: '·'; color: var(--gold); opacity: 0.6; }

@keyframes tick { from { transform: translateX(0) } to { transform: translateX(-50%) } }
.ttrack { display: inline-flex; animation: tick 32s linear infinite; }
```

### Pricing Card (Star Variant)

```css
/* Standard plan */
.plan { background: var(--ink2); padding: 30px 24px; transition: background .2s; }
.plan:hover { background: rgba(184,136,42,0.04); }

/* Featured plan (gold border + navy glow) */
.plan.star {
  background: rgba(11,54,96,0.3);
  border: 1px solid var(--gold-line);
}

/* Price display */
.pprice {
  font-family: var(--serif);
  font-size: 48px; font-weight: 700;
  color: var(--white); letter-spacing: -0.03em;
}

/* CTA — Standard */
.pg { background: transparent; color: var(--text); border: 1px solid var(--rule); }
/* CTA — Gold (featured) */
.pgold { background: var(--gold); color: var(--ink); }
.pgold:hover { background: var(--gold-hi); }
```

### Button Styles (Homepage)

```css
/* Primary gold CTA */
.bgold {
  font-family: var(--sans); font-size: 14px; font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--ink); background: var(--gold);
  padding: 14px 32px; border-radius: 3px; border: none;
  transition: background .2s, transform .15s;
}
.bgold:hover { background: var(--gold-hi); transform: translateY(-1px); }

/* Outline secondary */
.boutl {
  font-size: 14px; font-weight: 400;
  color: var(--text);
  padding: 14px 26px; border-radius: 3px;
  border: 1px solid rgba(255,255,255,0.18);
}
.boutl:hover { color: var(--white); border-color: rgba(255,255,255,0.4); }
```

---

## Homepage — Responsive Breakpoints

```css
@media (max-width: 1080px) {
  /* Nav collapses: mid links + trip finder hidden */
  /* Hero goes single-column, right panel stacks below */
  /* Grids: 3/4-col → 2-col */
  /* Two-column layouts → single-column */
  /* Padding: 44px → 20px */
}

@media (max-width: 600px) {
  /* All grids → single-column */
  /* CTAs stack vertically, full-width */
}
```

---

## Icon System — Lucide React

**Library:** [`lucide-react`](https://lucide.dev/) (MIT, tree-shakeable, 1000+ icons)

```bash
# Already installed — import individual icons:
import { Ship, Anchor, Users } from "lucide-react";
```

### Sizing Rules

```
size={14}  — micro:   inline with text-micro / text-caption
size={16}  — small:   inline with text-label / form field icons
size={18}  — card:    stat cards, info cards, action bar
size={20}  — nav:     sidebar items, bottom nav, button icons
size={28}  — hero:    page headers, detail page icons
size={32}  — feature: empty states, success screens
size={40}  — jumbo:   empty state illustrations
size={48}  — display: completion screens (StepComplete)
```

### Colour Rules

```
text-navy       — active nav, primary icons, CTAs
text-mid-blue   — secondary emphasis
text-grey-text  — inactive nav, helper icons, chevrons
text-dark-text  — inline with headings
text-white      — on navy backgrounds (hero, CTAs)
text-error-text — destructive actions (Trash2, X)
text-[#2E7D32]  — success icons (Check on green bg)
text-[#1D9E75]  — teal accents (USCG CSV, boarded status)
text-[#B8882A]  — gold accents (homepage icon chips)
```

### Icon Chip Pattern

```tsx
{/* Standard icon chip — used in info cards, stat cards */}
<div className="w-10 h-10 rounded-[10px] bg-[#E8F2FB]
                flex items-center justify-center shrink-0">
  <Ship size={20} className="text-[#0C447C]" />
</div>

{/* Circular icon chip — boat detail, avatars */}
<div className="w-14 h-14 rounded-full bg-light-blue
                flex items-center justify-center shrink-0">
  <Ship size={28} className="text-navy" />
</div>
```

### Icon Registry — By Category

#### Navigation (Sidebar + BottomNav)

| Icon | Import | Where Used |
|------|--------|------------|
| 🏠 Home | `Home` | Dashboard home |
| 🚢 Boats | `Ship` | Boats list, boat cards, boat detail |
| ⚓ Trips | `Anchor` | Trips list, trip creation, USCG CSV |
| 📈 Revenue | `TrendingUp` | Revenue dashboard |
| 👥 Guests | `Users` | Guest list, max guests field |
| ⚙️ Settings | `Settings` | Settings page |
| 🚪 Sign out | `LogOut` | Sidebar sign-out |
| 📱 Scan | `Camera` | QR boarding scanner |

#### Actions

| Icon | Import | Where Used |
|------|--------|------------|
| ➕ Add | `Plus` | Add boat CTA, add item buttons |
| ✕ Remove | `X` | Remove tag, close modal |
| ✓ Confirm | `Check` | Toggle on, copy confirmed, success |
| 📋 Copy | `Copy` | Copy trip link |
| ✏️ Edit | `Pencil` | Edit rule, edit item |
| 🗑️ Delete | `Trash2` | Delete photo, delete rule |
| ← Back | `ChevronLeft` | Wizard back, breadcrumb back |
| → Forward | `ChevronRight` | Boat card arrow, list item |
| ↓ Expand | `ChevronDown` | Collapsible sections |
| ↑ Collapse | `ChevronUp` | Collapsible sections |
| ☰ Drag | `GripVertical` | Drag handle for reorder |
| ⚓ USCG | `Anchor` | USCG CSV manifest button |
| ⌨️ Manual | `Keyboard` | QR scanner manual mode toggle |

#### Status & Feedback

| Icon | Import | Where Used |
|------|--------|------------|
| ✅ Success | `CheckCircle` | Password reset success |
| ⚠️ Alert | `AlertCircle` | Error messages |
| ⚠ Warning | `AlertTriangle` | Validation warnings |
| 🛡️ Safety | `Shield` | Safety section header |
| ℹ️ Info | `Info` | Helper tooltips, info sections |

---

## Dashboard — Component Reference

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

### Compliance Block Banner (Phase 2+)
```tsx
{/* Red pulsing compliance violation */}
<div className="bg-[#FDEAEA] border-2 border-[#D63B3B] rounded-[12px] p-4 animate-pulse">
  <p className="text-[#D63B3B] font-bold text-[14px]">⛔ COMPLIANCE BLOCK</p>
  <p className="text-[#7F1D1D] text-[13px]">{message}</p>
</div>

{/* Yellow attestation panel (Texas Party Boat) */}
<div className="bg-[#FFFBEB] border border-[#F59E0B] rounded-[12px] p-4">
  <label className="flex items-start gap-3">
    <input type="checkbox" className="mt-1 accent-[#F59E0B]" />
    <span className="text-[#92400E] text-[13px]">{attestationText}</span>
  </label>
</div>
```

### QR Scanner Overlay (Phase 3)
```tsx
{/* Full-screen dark scanner */}
<div className="fixed inset-0 z-[60] bg-black flex flex-col">
  {/* Header: white on black/80 */}
  {/* Progress bar: 1px green (#1D9E75) */}
  {/* Success toast: green bg border, 48px emoji, 22px BOARDED text */}
  {/* Error toast: red bg border */}
  {/* Already-boarded: amber bg border, ⚠️ icon */}
</div>
```

### Action Bar (4-Column Grid)
```tsx
{/* TripActionBar — fixed bottom on mobile, inline on desktop */}
<div className="grid grid-cols-4 gap-2">
  {/* Manifest PDF: bg-[#F5F8FC] border-[#D0E2F3] text-[#0C447C] */}
  {/* USCG CSV:     bg-[#E8F9F4] border-[#1D9E75]/30 text-[#1D9E75] — teal accent */}
  {/* WhatsApp:     bg-[#F5F8FC] border-[#D0E2F3] text-[#0C447C] */}
  {/* Captain link: bg-[#0C447C] text-white (or bg-[#D63B3B] for renew) */}
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

### Step Progress Bar (with Fast-Track)
```tsx
{/* Progress bar adapts: 6 steps normal, 4 steps fast-track */}
<div className="h-1 bg-[#D0E2F3] rounded-full overflow-hidden">
  <div className="h-full bg-[#0C447C] rounded-full transition-all"
       style={{ width: `${progressPercent}%` }} />
</div>
<p className="text-[11px] text-[#6B7C93] mt-1">
  Step {current} of {total}
  {isFastTrack && ' · Fast-Track'}
</p>
```

---

## Hero Section (Trip Page)

```tsx
<section className="bg-[#0C447C] px-4 pt-4 pb-8">
  {/* Top row */}
  <div className="flex items-center justify-between mb-4">
    <span className="text-white font-bold text-[16px]">BoatCheckin</span>
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
  </div>
</div>
```

---

## PDF Manifest Colours

```css
/* Used in lib/pdf/manifest.ts (pdf-lib) */
NAVY:  rgb(0.047, 0.267, 0.486)   /* #0C447C — header band */
TEAL:  rgb(0.114, 0.620, 0.459)   /* #1D9E75 — signed status */
CORAL: rgb(0.910, 0.349, 0.235)   /* #E8593C — pending, alerts */
GREY:  rgb(0.419, 0.486, 0.576)   /* #6B7C93 — labels */
DARK:  rgb(0.051, 0.106, 0.165)   /* #0D1B2A — body text */
LIGHT: rgb(0.961, 0.973, 0.988)   /* #F5F8FC — section headers */
```

---

## Do Not

```
✗ No gradients in the dashboard UI
✗ No drop shadows (except card: 0 1px 4px)
✗ No border radius > 20px (dashboard) or > 5px (homepage)
✗ No font weight > 700
✗ No font size < 10px (homepage badges) or < 11px (dashboard)
✗ No colours outside the palette
✗ No decorative animations (only functional — scroll reveals, hover transitions)
✗ No light backgrounds on homepage sections (always ink/ink2/ink3)
✗ No dark backgrounds on dashboard containers
✗ No red for anything except genuine errors or compliance blocks
✗ No ALL CAPS text in dashboard UI
✗ Uppercase text on homepage is ONLY for kickers, badges, and labels — never body copy
✗ Never mix serif and sans in the same text block
✗ No inline SVG colours — always use CSS variables or Tailwind classes
```
