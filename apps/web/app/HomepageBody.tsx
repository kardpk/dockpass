'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { MarketingNav } from '../components/marketing/MarketingNav'
import { MarketingFooter } from '../components/marketing/MarketingFooter'

// ─── Check SVG ────────────────────────────────────────────────────────────────
function CheckIcon() {
  return (
    <svg className="dossier-check" viewBox="0 0 20 20" fill="none">
      <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Arrow SVG ────────────────────────────────────────────────────────────────
function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  )
}

// ─── Main Body ────────────────────────────────────────────────────────────────
export default function HomepageBody() {
  const [activeTab, setActiveTab] = useState<'marina' | 'charter' | 'solo'>('marina')
  const [todayDate, setTodayDate] = useState("CAPTAIN'S LOG — TODAY")

  // Scroll-fade refs
  const fadeRefs = useRef<Element[]>([])

  useEffect(() => {
    // Live date
    const d = new Date()
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
    setTodayDate(`CAPTAIN'S LOG — ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`)

    // Scroll fade-in observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          ;(e.target as HTMLElement).style.opacity = '1'
          ;(e.target as HTMLElement).style.transform = 'translateY(0)'
        }
      })
    }, { threshold: 0.1 })

    const els = document.querySelectorAll(
      '.compare-row, .flow-cell, .statute-item, .coverage-card, .plan'
    )
    els.forEach(el => {
      ;(el as HTMLElement).style.opacity = '0'
      ;(el as HTMLElement).style.transform = 'translateY(16px)'
      ;(el as HTMLElement).style.transition = 'opacity 0.5s ease, transform 0.5s ease'
      observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <div className="hp">
      {/* ═══ NAV ═══ */}
      <MarketingNav />

      {/* ═══ DATELINE ═══ */}
      <div className="dateline">
        <div className="hp-container">
          <div className="dateline-inner">
            <div><span className="dl-dot">●</span> LIVE — FLORIDA GULF COAST CHARTERS</div>
            <div>BOATCHECKIN · ST. PETERSBURG · FLORIDA</div>
            <div>{todayDate}</div>
          </div>
        </div>
      </div>

      {/* ═══ HERO ═══ */}
      <section className="hero">
        <div className="hp-container">
          <div className="hero-grid">
            <div>
              <span className="eyebrow">The ship&apos;s papers, kept in order</span>
              <h1>
                The record<br />
                of every trip.<br />
                <em>Before anyone asks.</em>
              </h1>
              <p className="hero-lede">
                Boatcheckin helps Florida charter operators document the waivers, safety briefings,
                manifests, and audit trail that a regulator, an insurer, or an attorney might
                eventually ask to see.{' '}
                <strong>One link to your guests. One snapshot for your captain. One clean record on file.</strong>
              </p>
              <p className="hero-lede" style={{ marginBottom: 0, fontSize: 16 }}>
                Aligned with <strong>SB 606</strong>, <strong>46 CFR §185.506</strong>, and{' '}
                <strong>FWC Chapter 327</strong>. You direct — Boatcheckin records.{' '}
                <strong>Free for solo captains, forever.</strong>
              </p>
              <div className="hero-cta-row" style={{ marginTop: 32 }}>
                <Link href="/signup" className="btn btn-primary btn-lg">
                  Start a Free Account <ArrowIcon />
                </Link>
                <a href="#how" className="btn btn-lg">See It in Action</a>
              </div>
              <div className="hero-footnote">No credit card. No demo call. 10-minute setup.</div>
              <div className="hero-stats">
                <div className="hero-stat">
                  <span className="hs-label">Statutory References</span>
                  <span className="hs-value">USCG · FWC</span>
                </div>
                <div className="hero-stat" style={{ paddingLeft: 20 }}>
                  <span className="hs-label">Signature Integrity</span>
                  <span className="hs-value">SHA-256 Hashed</span>
                </div>
                <div className="hero-stat" style={{ paddingLeft: 20 }}>
                  <span className="hs-label">Guest Languages</span>
                  <span className="hs-value">7 Supported</span>
                </div>
              </div>
            </div>

            {/* Dossier card */}
            <div style={{ position: 'relative' }}>
              <div className="dossier">
                <span className="dossier-tag">Sample trip record</span>
                <div className="stamp">ON<br />FILE<br />04·25</div>
                <div className="dossier-header">
                  <span style={{ fontWeight: 600 }}>M/V DOCKSIDE · TRIP #4417</span>
                  <span style={{ color: 'var(--ink-muted)' }}>Ref. BCK-2026-04-25</span>
                </div>
                <div className="dossier-title">Pre-Departure Checklist</div>
                <div className="dossier-row"><CheckIcon /><span>6 of 6 guest waivers signed &amp; hashed <span className="d-mono">(SHA-256)</span></span></div>
                <div className="dossier-row"><CheckIcon /><span>FWC Boater Safety ID verified — <span className="d-mono">2 bareboat renters</span></span></div>
                <div className="dossier-row"><CheckIcon /><span>Safety briefing acknowledged — captain attestation logged</span></div>
                <div className="dossier-row"><CheckIcon /><span>Head count confirmed — <span className="d-mono">6 / 6 aboard</span></span></div>
                <div className="dossier-row"><CheckIcon /><span>Weather captured · <span className="d-mono">12kt ESE · 2ft · 82°F</span></span></div>
                <div className="dossier-row"><CheckIcon /><span>USCG-format manifest PDF filed &amp; emailed</span></div>
                <div className="dossier-footer">
                  <div className="dossier-cleared">Cleared to Depart</div>
                  <div className="dossier-time">0814 EDT</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TICKER ═══ */}
      <div className="ticker">
        <div className="ticker-track">
          {[
            'Recordkeeping-First Software',
            'SHA-256 Signature Audit Trail',
            'ESIGN & UETA Aligned',
            'No App Install for Guests',
            'Operator Directs · Boatcheckin Records',
            'Free for Solo Operators',
            'Per-Card Safety Acknowledgment',
            'Captain Snapshot — No Login Required',
            '7 Guest Languages Including Audio',
            'Recordkeeping-First Software',
            'SHA-256 Signature Audit Trail',
            'ESIGN & UETA Aligned',
            'No App Install for Guests',
            'Operator Directs · Boatcheckin Records',
            'Free for Solo Operators',
            'Per-Card Safety Acknowledgment',
            'Captain Snapshot — No Login Required',
            '7 Guest Languages Including Audio',
          ].map((item, i) => (
            <span key={i} className="ticker-item">{item}</span>
          ))}
        </div>
      </div>

      {/* ═══ OLD / NEW ═══ */}
      <section className="block">
        <div className="hp-container">
          <div className="section-header">
            <span className="eyebrow">The old way · The new way</span>
            <h2 className="section-title">The morning chaos.<br /><em>On the record instead.</em></h2>
            <p className="section-sub">Every charter morning, five failure modes show up at the dock. Each one is a gap in the trip record — and gaps are where problems hide when something goes wrong later.</p>
          </div>
          <div className="compare-list">
            {[
              ['01', 'Paper waivers lost in a wet binder', 'Waiver text the operator chose, signed by the guest, SHA-256 hashed with timestamp, IP, and user agent. Stored indefinitely. Exportable on demand.'],
              ['02', 'Verbal safety briefings with no proof', 'Captain attestation under 46 CFR §185.506 — per-card acknowledgment, delivery method, timestamp, digital signature. Per guest. Per trip. Logged forever.'],
              ['03', 'SMS chaos chasing guest details', 'One trip link. Guest enters details on their own phone, swipes 12 safety cards, signs waiver, gets QR boarding pass. No app download. Under 3 minutes.'],
              ['04', 'English-only forms for international guests', 'Guest flow in English, Spanish, Portuguese, French, German, Italian, and Arabic — with audio safety briefings for non-readers.'],
              ['05', 'Manual headcount at the dock', 'Captain snapshot — live manifest, non-swimmer alerts, children under 6, dietary flags, weather — on the captain\'s phone with no login and no account.'],
            ].map(([num, old, next]) => (
              <div className="compare-row" key={num}>
                <div className="cmp-num">{num}</div>
                <div className="cmp-old">{old}</div>
                <div className="cmp-arr">→</div>
                <div className="cmp-new">{next}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="block" id="how" style={{ background: 'var(--bone)', borderTop: '1.5px solid var(--line)', borderBottom: '1.5px solid var(--line)' }}>
        <div className="hp-container">
          <div className="section-header">
            <span className="eyebrow">The flow · Guest to departure</span>
            <h2 className="section-title">Four minutes from link sent<br />to <em>cleared to depart.</em></h2>
            <p className="section-sub">Your captain sends one link. The guest does the work on their own phone. You see it happen, live, from the operator dashboard. No app install, no account creation, no clipboard.</p>
          </div>
          <div className="flow-grid">
            {[
              ['01', 'Operator · 60 seconds', 'Create the Trip', 'Pick a boat, set the date, add guest capacity. Get back a shareable link and a 4-character trip code for over-the-phone bookings.'],
              ['02', 'Guest · 3 minutes', 'Join on Their Phone', 'Enters trip code, fills emergency contact and dietary info, uploads FWC ID if bareboat, swipes through 12 vessel-specific safety cards, signs the operator\'s chosen waiver.'],
              ['03', 'Captain · 30 seconds', 'Review the Snapshot', 'HMAC-signed link sent via SMS shows live manifest, non-swimmer alerts, dietary flags, weather, and the compliance gate. Captain attests briefing and confirms head count.'],
              ['04', 'System · Instant', 'Record Sealed', 'USCG-format manifest PDF generated and emailed. Signed waivers archived. Audit log locked. Weather snapshot stored. The trip record is on file — searchable, exportable, defensible.'],
            ].map(([num, label, title, body]) => (
              <div className="flow-cell" key={num}>
                <span className="fc-num">{num}</span>
                <span className="fc-label">{label}</span>
                <h3 className="fc-title">{title}</h3>
                <p className="fc-body">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ COMPLIANCE ═══ */}
      <section className="compliance-section" id="compliance">
        <div className="hp-container">
          <div className="section-header">
            <span className="eyebrow light">The law · Chapter &amp; verse</span>
            <h2 className="section-title">The statutes your operation<br />answers to. <em>Documented in-flow.</em></h2>
            <p className="section-sub">Florida&apos;s 2022 Boating Safety Act changed the recordkeeping expectations for livery operators. The USCG has its own long-standing rules on safety-briefing attestation. Boatcheckin is shaped around the paperwork these statutes ask for.</p>
          </div>
          <div className="statute-stack">
            {[
              ['Florida Statute · 2022', 'SB 606\n/ §327.54', 'The Boating Safety Act requires Florida livery operators to hold a no-cost FWC permit, carry insurance of at least $500,000 per person and $1M per event, and deliver pre-rental instruction to every renter. Boatcheckin captures the renter-acknowledgment side of that obligation — the documentation your operation keeps on file.', 'Bareboat · Mandatory since 2023'],
              ['Federal Regulation', '46 CFR\n§185.506', 'The USCG safety-orientation requirement. Boatcheckin records the captain\'s attestation — topics covered, delivery method, timestamp, digital signature — so when an incident is investigated, the record the statute calls for is already on file. Per card, per guest, per trip.', 'Captained & Bareboat'],
              ['Florida Statute', 'FWC\nChapter 327', 'Florida\'s bareboat livery briefing obligation. Guests upload their Boater Safety ID; the captain delivers and attests the pre-ride briefing; both parties sign. Boatcheckin handles all three steps in one flow and keeps the signed record.', 'Bareboat · Verified & Logged'],
            ].map(([badge, name, body, tag]) => (
              <div className="statute-item" key={badge}>
                <div>
                  <span className="statute-badge">{badge}</span>
                  <div className="statute-name">{name.split('\n').map((line, i) => <span key={i}>{line}{i === 0 && <br />}</span>)}</div>
                </div>
                <div>
                  <p className="statute-body">{body}</p>
                  <span className="statute-tag">{tag}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ADVISORY ═══ */}
      <div className="advisory">
        <div className="hp-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <span>
            <strong>Boatcheckin is a recordkeeping platform, not a law firm or insurance broker.</strong>&nbsp;&nbsp;
            Every operator remains responsible for their own compliance with applicable law.&nbsp;&nbsp;
            Consult a licensed attorney for advice specific to your operation.
          </span>
          <span style={{ display: 'flex', gap: '16px', flexShrink: 0, font: 'var(--mono)', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            <Link href="/guest-notice" style={{ color: 'var(--brass)', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
              Guest Notice →
            </Link>
            <Link href="/standards" style={{ color: 'var(--brass)', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
              Our Standards →
            </Link>
          </span>
        </div>
      </div>

      {/* ═══ AUDIENCES ═══ */}
      <section className="audiences" id="operators">
        <div className="hp-container">
          <div className="section-header">
            <span className="eyebrow brass">Three tiers · One system</span>
            <h2 className="section-title">Built for the people who<br /><span className="brass">actually run the dock.</span></h2>
          </div>
          <div className="tabs" role="tablist">
            {(['marina', 'charter', 'solo'] as const).map(tab => (
              <button
                key={tab}
                className={`tab${activeTab === tab ? ' active' : ''}`}
                role="tab"
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'marina' ? 'Marina Manager' : tab === 'charter' ? 'Charter Captain' : 'Solo Operator'}
              </button>
            ))}
          </div>

          {/* Marina */}
          <div className={`tab-content${activeTab === 'marina' ? ' active' : ''}`} data-panel="marina">
            <div>
              <div className="tc-scope">For fleets of 4 – 50 boats</div>
              <h3 className="tc-heading">Your fleet, unified.<br />Your captains, <em>licensed &amp; current.</em></h3>
              <p className="tc-body">Manage your crew roster, assign captains to trips by role, and receive alerts 30 days before any captain&apos;s USCG license is set to expire.</p>
              <ul className="tc-list">
                {['Unified dashboard across every boat in your fleet', 'Crew roster with license expiry monitoring and automated alerts', 'Role-based trip assignments: captain, first mate, crew, deckhand', 'White-label guest-facing pages on the Harbormaster tier', 'Dedicated onboarding & priority support line'].map(li => <li key={li}>{li}</li>)}
              </ul>
              <Link href="/signup?tier=harbormaster" className="btn btn-primary">See Harbormaster Plan →</Link>
            </div>
            <div className="stats-card">
              <div className="stats-card-head">Typical marina · per month</div>
              {[['Trips run', '180', 'trips'], ['Guests onboarded', '1,080', 'people'], ['Time saved per trip', '45', 'min'], ['Captains on roster', '8', 'active'], ['Record audit-ready', 'Always', '']].map(([lbl, val, unit]) => (
                <div className="stat-row" key={lbl}><span className="stat-lbl">{lbl}</span><span className="stat-val">{val}{unit && <span className="stat-unit">{unit}</span>}</span></div>
              ))}
              <p style={{ marginTop: 16, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-muted)', letterSpacing: '0.04em', lineHeight: 1.6 }}>Illustrative reference. Actual figures vary by operation size and trip cadence.</p>
            </div>
          </div>

          {/* Charter */}
          <div className={`tab-content${activeTab === 'charter' ? ' active' : ''}`} data-panel="charter">
            <div>
              <div className="tc-scope">For growing operations · 2 – 3 boats</div>
              <h3 className="tc-heading">Two boats.<br /><em>One consistent record.</em></h3>
              <p className="tc-body">You run more than one boat but you&apos;re not a marina yet. You want the same documentation rigor across every trip, regardless of which captain&apos;s on deck.</p>
              <ul className="tc-list">
                {['Up to 3 boats, unlimited trips', 'Full boat wizard with 14 vessel types', 'Multi-boat list view across your operation', 'Guest CRM for repeat customers (coming Q3)', 'Captain liability coverage through our licensed partner, where eligible'].map(li => <li key={li}>{li}</li>)}
              </ul>
              <Link href="/signup" className="btn btn-primary">Start Free →</Link>
            </div>
            <div className="stats-card">
              <div className="stats-card-head">What&apos;s on file · per trip</div>
              {[['Signed waivers', '6', 'hashed'], ['Safety card acknowledgments', '72', 'records'], ['Captain attestation', '1', 'signed'], ['USCG manifest', '1', 'PDF filed'], ['Weather snapshot', '1', 'logged']].map(([lbl, val, unit]) => (
                <div className="stat-row" key={lbl}><span className="stat-lbl">{lbl}</span><span className="stat-val">{val}<span className="stat-unit">{unit}</span></span></div>
              ))}
            </div>
          </div>

          {/* Solo */}
          <div className={`tab-content${activeTab === 'solo' ? ' active' : ''}`} data-panel="solo">
            <div>
              <div className="tc-scope">For captain-owners · 1 boat</div>
              <h3 className="tc-heading">One boat, one captain,<br /><em>zero paper.</em></h3>
              <p className="tc-body">If you run a single boat, you probably wear every hat on the dock. Boatcheckin gives solo operators the same record-keeping backbone the big fleets use, at no cost.</p>
              <ul className="tc-list">
                {['One boat, unlimited trips', 'Full boat wizard with 14 vessel types', 'Guest flow, waivers, QR boarding pass', 'Captain snapshot on mobile — no login required', 'USCG-format manifest PDF per trip'].map(li => <li key={li}>{li}</li>)}
              </ul>
              <Link href="/signup" className="btn btn-primary">Start Free →</Link>
            </div>
            <div className="stats-card">
              <div className="stats-card-head">Solo setup · day one</div>
              {[['Account creation', '2', 'min'], ['Boat wizard', '7', 'min'], ['First trip link sent', '<10', 'min total'], ['Credit card required', 'No', ''], ['Monthly bill', '$0', '']].map(([lbl, val, unit]) => (
                <div className="stat-row" key={lbl}><span className="stat-lbl">{lbl}</span><span className="stat-val">{val}{unit && <span className="stat-unit">{unit}</span>}</span></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PROTECTION ═══ */}
      <section className="protection">
        <div className="hp-container">
          <div className="section-header">
            <span className="eyebrow light">Protection layer</span>
            <h2 className="section-title">Coverage through licensed partners.<br /><em>Recorded on every trip.</em></h2>
            <p className="section-sub">Boatcheckin is a technology platform, not an insurance broker or carrier. We partner with licensed marine insurance providers so coverage can be offered alongside the trip record.</p>
          </div>
          <div className="coverage-grid">
            <div className="coverage-card">
              <div className="cov-label">For your guests</div>
              <h3 className="cov-title">Per-Trip Renter&apos;s Coverage</h3>
              <p className="cov-body">Optional guest coverage presented at check-in, meeting the limits referenced in Florida SB 606. Guests who opt in are quoted, bound, and serviced by our licensed insurance partner.</p>
              {[['Coverage limits referenced', '$500K / $1M'], ['Cost to operator', '$0'], ['Offered at', 'Check-in · Optional'], ['Underwritten by', 'Licensed partner']].map(([lbl, val]) => (
                <div className="cov-row" key={lbl}><span className="cov-row-lbl">{lbl}</span><span className="cov-row-val">{val}</span></div>
              ))}
            </div>
            <div className="coverage-card">
              <div className="cov-label">For your captains</div>
              <h3 className="cov-title">Annual Mariner Liability</h3>
              <p className="cov-body">Captains using Boatcheckin have direct access to professional liability coverage through our licensed insurance partner — from $26/month, covering every trip they run during the policy year.</p>
              {[['Coverage type', 'Professional Liability'], ['Starts from', '$26 / month'], ['License protection', 'Up to $2M'], ['Placed by', 'Licensed agent']].map(([lbl, val]) => (
                <div className="cov-row" key={lbl}><span className="cov-row-lbl">{lbl}</span><span className="cov-row-val">{val}</span></div>
              ))}
            </div>
          </div>
          <div className="protection-disclosure">
            <strong style={{ color: 'var(--bone)' }}>Important disclosure:</strong> Boatcheckin does not sell, solicit, negotiate, bind, or service insurance. All insurance products are offered, quoted, issued, and administered by state-licensed agents and carriers. Boatcheckin receives a fixed referral fee from its insurance partner for qualifying leads, paid regardless of whether a policy is purchased. Coverage is subject to the carrier&apos;s eligibility rules, underwriting, and state availability. This is not an offer of insurance or a solicitation in any state where Boatcheckin or its partner is not authorized to transact.
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section className="block" id="pricing">
        <div className="hp-container">
          <div className="section-header">
            <span className="eyebrow">Plans &amp; pricing</span>
            <h2 className="section-title">Two tiers free.<br />Two tiers <em>built for fleets.</em></h2>
            <p className="section-sub">Solo operators and small charters run Boatcheckin free, forever. Paid tiers unlock the unified fleet dashboard, captain roster management, white-label, and dedicated support.</p>
          </div>
          <div className="pricing-grid">
            <div className="plan">
              <span className="plan-tag">Individual</span>
              <h3 className="plan-name">Solo</h3>
              <div className="plan-price"><span className="curr">$</span>0<span className="per">/ forever</span></div>
              <p className="plan-desc">For the captain-owner running a single boat. No trial clock. No credit card. No feature gating.</p>
              <ul className="plan-features">
                {['1 boat, unlimited trips', 'Full boat wizard · 14 vessel types', 'Guest flow, waivers, QR boarding pass', 'Captain snapshot, mobile view', 'USCG-format manifest PDF'].map(f => <li key={f}><span className="pf-check">✓</span>{f}</li>)}
              </ul>
              <Link href="/signup" className="btn">Start Free →</Link>
            </div>
            <div className="plan">
              <span className="plan-tag">Small fleet</span>
              <h3 className="plan-name">Charter</h3>
              <div className="plan-price"><span className="curr">$</span>0<span className="per">/ forever</span></div>
              <p className="plan-desc">For growing operators with 2 – 3 boats. Same deal, still free.</p>
              <ul className="plan-features">
                {['Up to 3 boats', 'Everything in Solo', 'Multi-boat list view', 'Guest CRM (coming Q3 2026)', 'Partner captain coverage, where eligible'].map(f => <li key={f}><span className="pf-check">✓</span>{f}</li>)}
              </ul>
              <Link href="/signup" className="btn">Start Free →</Link>
            </div>
            <div className="plan featured">
              <span className="plan-tag">Mid-fleet</span>
              <h3 className="plan-name">Fleet</h3>
              <div className="plan-price rust"><span className="curr">$</span>99<span className="per">/ month</span></div>
              <p className="plan-desc">When you outgrow three boats and need the unified fleet dashboard.</p>
              <ul className="plan-features">
                {['Up to 10 boats', 'Unified multi-boat dashboard', 'Captain roster & assignments', 'Cross-boat captain assignment', 'Consolidated reporting & priority support'].map(f => <li key={f}><span className="pf-check">✓</span>{f}</li>)}
              </ul>
              <Link href="/signup?plan=fleet" className="btn btn-primary">Upgrade to Fleet →</Link>
            </div>
            <div className="plan">
              <span className="plan-tag">Enterprise</span>
              <h3 className="plan-name">Harbormaster</h3>
              <div className="plan-price brass"><span className="curr">$</span>299<span className="per">/ month</span></div>
              <p className="plan-desc">For marina managers running 10+ boats or multi-location operations.</p>
              <ul className="plan-features">
                {['Unlimited boats', 'Everything in Fleet', 'White-label guest-facing pages', 'API access & custom integrations', 'Dedicated account manager & custom SLA'].map(f => <li key={f}><span className="pf-check">✓</span>{f}</li>)}
              </ul>
              <a href="/contact?plan=harbormaster" className="btn">Talk to Sales →</a>
            </div>
          </div>
          <div className="pricing-note">
            <div className="pricing-note-tag">For operators</div>
            <p><strong>How two free tiers pay for themselves.</strong> Boatcheckin earns a fixed referral fee when guests opt into optional insurance or add-on services at checkout, independent of whether they purchase. Your subscription bill is $0 on Solo and Charter — and it stays that way.</p>
          </div>
        </div>
      </section>

      {/* ═══ INTEGRATIONS ═══ */}
      <section className="integrations" id="integrations">
        <div className="hp-container">
          <div className="int-grid">
            <div>
              <span className="eyebrow brass">Already using a booking platform?</span>
              <h2 className="section-title" style={{ fontSize: 'clamp(28px,3.5vw,42px)', marginBottom: 16 }}>Boatcheckin clips onto<br />your existing flow.</h2>
              <p className="section-sub" style={{ fontSize: 16, marginBottom: 28 }}>Boatcheckin doesn&apos;t replace your booking system — it&apos;s the compliance layer that activates after the booking confirms. Keep FareHarbor, WaveRez, Boatsetter, or BookingCentral for reservations.</p>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-muted)', letterSpacing: '0.08em' }}>API integrations with leading platforms coming Q4 2026.</p>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 16 }}>Pairs with</div>
              <div className="int-platform-list">
                {['FareHarbor', 'WaveRez', 'Boatsetter', 'BookingCentral', 'GetMyBoat', 'Xola', 'Checkfront', 'Indexic'].map(p => (
                  <div className="int-badge" key={p}>{p}</div>
                ))}
              </div>
              <div style={{ marginTop: 24, padding: '16px 20px', borderLeft: '3px solid var(--brass-deep)', background: 'var(--paper)', fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--ink)' }}>Not competing for your bookings.</strong><br />
                We&apos;re the compliance and documentation layer after the booking confirms.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ EARLY ADOPTER ═══ */}
      <section className="early-strip">
        <div className="hp-container">
          <div className="early-grid">
            <div>
              <div className="early-badge">⚓ <span>Founding Operators Program</span></div>
              <h2 className="early-h">First 100 operators get<br />the <em>founding package.</em></h2>
              <p className="early-body">We&apos;re in the middle of onboarding our first wave of Florida marina operators. Each one gets treated like a partner, not a user.</p>
              <ul className="early-perks">
                {['Branded waterproof captain\'s logbook + marina swag pack', 'Lifetime grandfather pricing on all future paid tiers', 'Priority support line — direct line, not a ticket queue', '"Founding Operator" badge on your profile', 'Input on the product roadmap for Q3–Q4 2026'].map(li => <li key={li}>{li}</li>)}
              </ul>
              <div style={{ marginTop: 32 }}>
                <Link href="/signup" className="btn btn-primary btn-lg">Claim a Founding Spot →</Link>
              </div>
            </div>
            <div className="early-count">
              <div className="ec-num">100</div>
              <div className="ec-label">Founding operator spots</div>
              <div className="ec-sub">Sign up by July 31, 2026</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="faq-section" id="faq" style={{ background: 'var(--bone)', borderTop: '1px solid var(--line)' }}>
        <div className="hp-container">
          <div className="faq-grid">
            <div>
              <span className="eyebrow sea">Straight answers</span>
              <h2 className="section-title" style={{ fontSize: 'clamp(32px,4vw,52px)' }}>Questions<br /><span className="sea">from the dock.</span></h2>
              <p className="section-sub" style={{ fontSize: 16 }}>The ones we actually hear. If you have others, write to us at the address in the footer.</p>
            </div>
            <div className="faq-list">
              {[
                ['Is Boatcheckin really free for Solo and Charter tiers?', 'Yes. Forever. No credit card, no trial clock, no feature gating. Boatcheckin earns fixed referral fees from licensed partners when guests opt into optional insurance or add-on services — those fees are paid regardless of whether a guest actually purchases anything.'],
                ['Are the digital waivers legally enforceable?', 'Boatcheckin is designed around the requirements of the federal ESIGN Act and Florida\'s UETA for enforceable electronic signatures: intent to sign, consent to an electronic process, association of the signature with the record, and long-term record retention. Each signature is captured with a SHA-256 hash linking it to the exact waiver text.'],
                ['How does Boatcheckin relate to Florida SB 606?', 'SB 606 places obligations on livery operators: FWC permitting, minimum insurance, and pre-rental instruction documentation. Boatcheckin captures the documentation side — the renter\'s acknowledgment, the guest\'s FWC Boater Safety ID, the captain\'s attestation, and the signed record. Always consult your attorney for application to your specific operation.'],
                ['Can my guests use this without installing an app?', 'Yes — that\'s the whole point. Boatcheckin is a web app that runs in the guest\'s mobile browser. They tap the link you send, fill out details, sign the waiver, and receive their QR boarding pass — all without downloading anything.'],
                ['What about languages? My guests aren\'t all English speakers.', 'The guest flow is available in English, Spanish, Portuguese, French, German, Italian, and Arabic. Safety cards include optional audio, so guests who don\'t read can still hear the briefing in their own language.'],
                ['Does Boatcheckin give legal or insurance advice?', 'No. Boatcheckin is a software platform. We don\'t draft waivers for your specific operation, we don\'t interpret statutes on your behalf, and we don\'t sell, solicit, or negotiate insurance.'],
                ['What happens to guest data after the trip?', 'Marketing-related information is cleaned up on a rolling 90-day schedule unless the guest has opted into operator communications. Compliance-related records — signed waivers, safety-briefing attestations, manifests — are retained for the period your operation and its statutes require.'],
                ['How is my data secured?', 'Data is encrypted in transit (TLS 1.3) and at rest. Guest PII is minimized, access-controlled, and retained in line with regulatory recordkeeping requirements. Waiver and attestation records are cryptographically hashed so any modification is detectable.'],
              ].map(([q, a]) => (
                <details className="faq-item" key={q}>
                  <summary>{q}<div className="faq-toggle" /></summary>
                  <div><p>{a}</p></div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="final-cta">
        <div className="hp-container">
          <div className="fca-grid">
            <div>
              <h2 className="fca-h">Lines off the dock<br /><em>in the morning?</em></h2>
              <p className="fca-sub">Set up your first boat in under 10 minutes. Send your first guest link by tonight. Start your operation&apos;s record on a clean page.</p>
            </div>
            <div className="fca-stack">
              <Link href="/signup" className="btn">Start Free — 10-min Setup →</Link>
              <a href="/contact" className="btn btn-outline">Book a Pilot Call</a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <MarketingFooter />
    </div>
  )
}
