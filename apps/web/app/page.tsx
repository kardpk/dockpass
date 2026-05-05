import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Boatcheckin — The record of every charter trip, kept in order',
  description:
    'Recordkeeping software for Florida charter operators. Document waivers, safety briefings, manifests, and the audit trail regulators ask for. Free for solo captains and small charters.',
  openGraph: {
    title: 'Boatcheckin — The record of every charter trip, kept in order',
    description:
      'One link. Every guest documented, every waiver hashed, every briefing recorded.',
    type: 'website',
    url: 'https://boatcheckin.com',
    siteName: 'Boatcheckin',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Boatcheckin — The record of every charter trip',
    description:
      'Documentation software for Florida charter operators. Aligned with SB 606, 46 CFR §185.506, FWC Ch. 327. Free for solo captains.',
  },
}

export default function HomePage() {
  return (
    <>
      <style>{homepageCSS}</style>
      <HomepageBody />
    </>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const homepageCSS = `
:root {
  --ink: #0B1E2D; --ink-soft: #1A2F42; --ink-muted: #3D5568;
  --bone: #F4EFE6; --bone-warm: #EDE6D8;
  --paper: #FAF7F0; --paper-warm: #F6F0E4;
  --rust: #B84A1F; --rust-deep: #8A3515;
  --brass: #C8A14A;
  --sea: #2D5D6E; --sea-deep: #1A3F4D;
  --status-ok: #1F6B52; --status-ok-soft: #D4E5DC;
  
  --line: #0B1E2D;
  --line-soft: rgba(11,30,45,0.10); --line-softer: rgba(11,30,45,0.05);
  
  --font: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --mono: 'JetBrains Mono', 'Courier New', monospace;
  
  --r-card: 8px;
  --r-btn: 6px;
  
  --ease: cubic-bezier(0.4,0,0.2,1);
}

.hp *, .hp *::before, .hp *::after { box-sizing: border-box; margin: 0; padding: 0; }
.hp { font-family: var(--font); font-size: 16px; line-height: 1.6; color: var(--ink); background: var(--paper); overflow-x: hidden; -webkit-font-smoothing: antialiased; }
.hp a { color: inherit; text-decoration: none; }
.hp-container { max-width: 1200px; margin: 0 auto; padding: 0 32px; }
@media(max-width:720px){ .hp-container { padding: 0 20px; } }

/* Eyebrows */
.eyebrow { font-size: 12px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--rust); margin-bottom: 20px; display: block; }
.eyebrow.light { color: var(--brass); }

/* Buttons */
.btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; font-family: var(--font); font-size: 15px; font-weight: 600; border: 1.5px solid var(--ink); border-radius: var(--r-btn); background: transparent; color: var(--ink); cursor: pointer; transition: all 200ms var(--ease); white-space: nowrap; }
.btn:hover { background: var(--ink); color: var(--paper); }
.btn-primary { background: var(--rust); color: #fff; border-color: var(--rust); }
.btn-primary:hover { background: var(--rust-deep); border-color: var(--rust-deep); }
.btn-lg { padding: 16px 32px; font-size: 16px; }

/* Dateline */
.dateline { border-top: 1px solid var(--line-soft); border-bottom: 1px solid var(--line-soft); padding: 16px 0; background: var(--paper); }
.dateline-inner { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; font-family: var(--mono); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-muted); }
.dateline-inner > div:nth-child(2) { text-align: center; }
.dateline-inner > div:nth-child(3) { text-align: right; }
.dl-dot { color: var(--rust); }

/* Hero */
.hero { padding: 80px 0 72px; }
.hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: start; }
@media(max-width:900px){ .hero-grid { grid-template-columns: 1fr; gap: 48px; } }
.hero h1 { font-size: clamp(42px, 6vw, 72px); font-weight: 700; line-height: 1.08; letter-spacing: -0.03em; margin-bottom: 24px; }
.hero h1 em { font-style: italic; color: var(--rust); font-weight: 700; }
.hero-lede { font-size: 19px; line-height: 1.6; color: var(--ink-soft); max-width: 560px; margin-bottom: 32px; }
.hero-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 44px; padding-top: 24px; border-top: 1px solid var(--line-soft); }
.hs-label { font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-muted); display: block; margin-bottom: 6px; }
.hs-value { font-size: 16px; font-weight: 600; color: var(--ink); }

/* Dossier */
.dossier { position: relative; background: var(--paper-warm); border: 1.5px solid var(--ink); border-radius: var(--r-card); padding: 32px; box-shadow: 0 8px 32px rgba(11,30,45,0.1); }
.dossier-tag { position: absolute; top: -10px; left: 24px; background: var(--bone); border: 1px solid var(--line-soft); padding: 3px 10px; font-family: var(--mono); font-size: 9px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: var(--ink-muted); border-radius: 4px; }
.dossier-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; border-bottom: 1px dashed var(--line-soft); margin-bottom: 20px; font-family: var(--mono); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; }
.dossier-title { font-size: 20px; font-weight: 600; margin-bottom: 16px; }
.dossier-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px dashed var(--line-softer); font-size: 13px; }
.dossier-footer { margin-top: 20px; padding-top: 18px; border-top: 1.5px solid var(--ink); display: flex; justify-content: space-between; align-items: baseline; }
.dossier-cleared { font-style: italic; font-size: 22px; font-weight: 600; color: var(--rust); letter-spacing: -0.01em; }
.stamp { position: absolute; top: 20px; right: 20px; width: 64px; height: 64px; border: 2px solid var(--rust); border-radius: 50%; color: var(--rust); display: flex; align-items: center; justify-content: center; font-family: var(--mono); font-size: 8px; font-weight: 700; transform: rotate(-12deg); opacity: 0.72; line-height: 1.1; }

/* Ticker */
.ticker { background: var(--ink); color: var(--bone); padding: 14px 0; overflow: hidden; white-space: nowrap; }
.ticker-track { display: inline-flex; gap: 48px; animation: scroll 40s linear infinite; }
.ticker-item { font-family: var(--mono); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; }
@keyframes scroll { from{transform:translateX(0)} to{transform:translateX(-50%)} }

/* Sections */
.block { padding: 96px 0; }
.section-header { max-width: 640px; margin-bottom: 64px; }
.section-title { font-size: var(--w-section); font-weight: 700; line-height: 1.1; letter-spacing: -0.025em; margin-bottom: 24px; }
.section-title em { font-style: italic; color: var(--rust); font-weight: 700; }
.section-sub { font-size: 18px; line-height: 1.6; color: var(--ink-soft); }

/* Compare */
.compare-row { display: grid; grid-template-columns: 48px 1fr 24px 1fr; gap: 24px; align-items: start; padding: 24px 0; border-top: 1px solid var(--line-soft); }
.cmp-num { font-family: var(--mono); font-size: 11px; color: var(--ink-muted); }
.cmp-old { font-size: 18px; font-weight: 600; color: var(--ink-muted); text-decoration: line-through; opacity: 0.6; }
.cmp-new { font-size: 15px; line-height: 1.6; color: var(--ink); }

/* Flow */
.flow-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.flow-cell { padding: 32px; background: var(--paper); border: 1px solid var(--line-soft); border-radius: var(--r-card); }
.fc-num { font-size: 40px; font-weight: 700; color: var(--rust); line-height: 1; margin-bottom: 16px; display: block; }
.fc-title { font-size: 20px; font-weight: 600; margin-bottom: 8px; }
.fc-body { font-size: 14px; color: var(--ink-soft); }

/* Compliance */
.compliance-section { background: var(--ink); color: var(--bone); padding: 96px 0; }
.statute-item { padding: 32px 0; border-top: 1px solid rgba(244,239,230,0.1); display: grid; grid-template-columns: 180px 1fr; gap: 48px; }
.statute-badge { background: var(--brass); color: var(--ink); padding: 4px 10px; font-family: var(--mono); font-size: 10px; font-weight: 700; border-radius: 4px; display: inline-block; margin-bottom: 12px; }
.statute-name { font-size: 24px; font-weight: 600; color: var(--bone); margin-bottom: 8px; }

/* Tabs */
.tabs { display: flex; gap: 16px; margin-bottom: 32px; border-bottom: 1.5px solid var(--line-soft); }
.tab { padding: 12px 24px; font-size: 14px; font-weight: 600; background: transparent; border: none; cursor: pointer; color: var(--ink-muted); border-bottom: 3px solid transparent; transition: all 200ms; }
.tab.active { color: var(--ink); border-bottom-color: var(--rust); }
.tab-content { display: none; grid-template-columns: 1.2fr 1fr; gap: 48px; }
.tab-content.active { display: grid; }

/* Pricing */
.pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; }
.plan { padding: 32px; border: 1px solid var(--line-soft); border-radius: var(--r-card); background: var(--paper); }
.plan-price { font-size: 44px; font-weight: 700; margin: 16px 0; line-height: 1; }
.plan-price .per { font-size: 15px; font-weight: 400; color: var(--ink-muted); }

/* Final CTA */
.final-cta { background: var(--rust); color: #fff; padding: 80px 0; text-align: center; border-top: 1.5px solid var(--ink); }
.fca-h { font-size: clamp(32px, 5vw, 56px); font-weight: 700; margin-bottom: 16px; }

@keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
`
;


// ─── Client component for interactive behaviour ───────────────────────────────
import HomepageBody from './HomepageBody'
