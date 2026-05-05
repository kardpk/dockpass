'use client'

import { useState, useEffect } from 'react'
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

function SmallCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
      <path d="M2.5 7.5l3 3 6-7" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Arrow SVG ────────────────────────────────────────────────────────────────
function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  )
}

// ─── Main Body ────────────────────────────────────────────────────────────────
export default function HomepageBody() {
  const [todayDate, setTodayDate] = useState("CAPTAIN'S LOG — TODAY")

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
      '.compare-row, .flow-cell, .statute-item, .op-card, .plan-row'
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
              <span className="eyebrow">The ship&apos;s papers · In order · On file</span>
              <h1>
                The record<br />
                of every trip.<br />
                <em>Before anyone asks.</em>
              </h1>
              <p className="hero-lede">
                Charter operators run on trust — from guests, insurers, and regulators.
                Boatcheckin makes that trust provable: waivers, safety briefings, headcount,
                weather, and the captain&apos;s attestation{' '}
                <strong>on file for every trip, automatically.</strong>
              </p>
              <div className="hero-cta-row" style={{ marginTop: 32 }}>
                <Link href="/signup" className="btn btn-primary btn-lg">
                  Start Free · No card <ArrowIcon />
                </Link>
                <a href="#how" className="btn btn-lg">See how it works</a>
              </div>
              <div className="hero-footnote">Free forever for solo captains · 10-minute setup · No app for guests</div>
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
                <div className="dossier-row"><CheckIcon /><span>FWC Boater Safety ID verified <span className="d-mono">2 bareboat renters</span></span></div>
                <div className="dossier-row"><CheckIcon /><span>Safety briefing acknowledged · captain attestation logged</span></div>
                <div className="dossier-row"><CheckIcon /><span>Head count confirmed <span className="d-mono">6 / 6 aboard</span></span></div>
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

      {/* ═══ PROOF STRIP ═══ */}
      <div className="proof-strip">
        <div className="hp-container">
          <div className="ps-grid">
            <div className="ps-col">
              <div className="ps-value">SHA-256</div>
              <div className="ps-label">Every signature</div>
              <div className="ps-desc">Cryptographically hashed at signing — tamper-evident on re-verification</div>
            </div>
            <div className="ps-divider" />
            <div className="ps-col">
              <div className="ps-value">Waiver · Manifest · Attestation</div>
              <div className="ps-label">Filed per trip, automatically</div>
              <div className="ps-desc">Everything a regulator, insurer, or attorney asks for — already on file</div>
            </div>
            <div className="ps-divider" />
            <div className="ps-col">
              <div className="ps-value">$0 forever</div>
              <div className="ps-label">Solo &amp; Charter tiers</div>
              <div className="ps-desc">No credit card. No trial clock. No feature gating. No catch.</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="block" id="how" style={{ background: 'var(--bone)', borderTop: '1.5px solid var(--line)', borderBottom: '1.5px solid var(--line)' }}>
        <div className="hp-container">
          <div className="section-header">
            <span className="eyebrow">The flow · Guest to departure</span>
            <h2 className="section-title">Four minutes from link sent<br />to <em>cleared to depart.</em></h2>
            <p className="section-sub">One link goes to your guests. They do the work on their own phone. Your captain reviews the snapshot. The record is sealed — no clipboard, no app download, no chasing.</p>
          </div>
          <div className="flow-grid">
            {[
              ['01', 'You · 60 seconds', 'Send the link', 'Create a trip, pick your vessel, set capacity. Get back a shareable link and a 4-character code for walk-up bookings.'],
              ['02', 'Guest · 3 minutes', 'They do the work', 'Guest enters details on their own phone — no app, no account. Emergency contact, FWC ID if bareboat, 12 safety cards swiped, waiver signed, QR boarding pass issued.'],
              ['03', 'Captain · 30 seconds', 'Review &amp; attest', 'HMAC-signed snapshot link — no login required. Live manifest, non-swimmer alerts, dietary flags, weather. Captain attests briefing and confirms head count.'],
              ['04', 'System · Instant', 'Record sealed', 'USCG-format manifest PDF generated. Signed waivers archived and hashed. Audit log locked. Weather snapshot stored. Defensible on file.'],
            ].map(([num, label, title, body]) => (
              <div className="flow-cell" key={num}>
                <span className="fc-num">{num}</span>
                <span className="fc-label">{label}</span>
                <h3 className="fc-title">{title}</h3>
                <p className="fc-body" dangerouslySetInnerHTML={{ __html: body }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ OLD / NEW ═══ */}
      <section className="block">
        <div className="hp-container">
          <div className="section-header">
            <span className="eyebrow">The old way · The Boatcheckin way</span>
            <h2 className="section-title">Five problems that show up<br /><em>every morning at the dock.</em></h2>
            <p className="section-sub">Each one is a gap in the trip record. Gaps are where problems hide when something goes wrong later.</p>
          </div>
          <div className="compare-list">
            {[
              ['01', 'Paper waivers lost in a wet binder', 'Waiver text the operator chose, signed by the guest, SHA-256 hashed with timestamp, IP, and user agent. Stored indefinitely. Exportable on demand.'],
              ['02', 'Verbal safety briefings with no proof', 'Captain attestation under 46 CFR §185.506 — per-card acknowledgment, delivery method, timestamp, digital signature. Per guest. Per trip. Logged forever.'],
              ['03', 'SMS chaos chasing guest details', 'One trip link. Guest enters details on their own phone, swipes safety cards, signs waiver, gets QR boarding pass. No app download. Under 3 minutes.'],
              ['04', 'English-only forms for international guests', 'Guest flow in English, Spanish, Portuguese, French, German, Italian, and Arabic — with audio safety briefings for non-readers.'],
              ['05', 'Manual headcount at the dock', 'Captain snapshot: live manifest, non-swimmer alerts, children under 6, dietary flags, weather — on the captain\'s phone with no login and no account.'],
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

      {/* ═══ THREE OPERATORS ═══ */}
      <section className="block" id="operators" style={{ background: 'var(--paper-warm)', borderTop: '1.5px solid var(--line-soft)' }}>
        <div className="hp-container">
          <div className="section-header">
            <span className="eyebrow brass">Built for every level of the dock</span>
            <h2 className="section-title">Find your operation<br /><em>in one of these three.</em></h2>
          </div>
          <div className="op-cards">

            {/* Solo Captain */}
            <div className="op-card op-card-solo">
              <div className="op-tier">Solo · 1 boat</div>
              <div className="op-free-badge">Free forever</div>
              <h3 className="op-heading">One boat.<br /><em>Zero paper. $0, no expiry.</em></h3>
              <p className="op-body">Solo captains carry every obligation personally — the waiver, the briefing attestation, the manifest. Boatcheckin gives you the same recordkeeping backbone the big fleets use, at no cost, with no time limit.</p>
              <ul className="op-list">
                {['Unlimited trips', 'Guest flow, waivers, QR boarding pass', 'Captain snapshot — no login required', 'USCG-format manifest PDF per trip'].map(li => (
                  <li key={li}><SmallCheck />{li}</li>
                ))}
              </ul>
              <div className="op-foot">
                <div className="op-stats">
                  <div className="op-stat"><span className="os-val">$0</span><span className="os-lbl">forever</span></div>
                  <div className="op-stat"><span className="os-val">10 min</span><span className="os-lbl">to first trip link</span></div>
                </div>
                <Link href="/signup" className="btn btn-primary">Start Free · No card <ArrowIcon /></Link>
              </div>
            </div>

            {/* Charter Captain */}
            <div className="op-card op-card-charter">
              <div className="op-tier">Charter · 2–3 boats</div>
              <div className="op-free-badge">Also free</div>
              <h3 className="op-heading">Two boats.<br /><em>One consistent record.</em></h3>
              <p className="op-body">You run more than one vessel but you&apos;re not a marina yet. The documentation has to be consistent across every captain on your schedule — regardless of which one is on deck that morning.</p>
              <ul className="op-list">
                {['Up to 3 boats, unlimited trips', 'Full boat wizard · 14 vessel types', 'Multi-boat dashboard view', 'Captain roster per vessel'].map(li => (
                  <li key={li}><SmallCheck />{li}</li>
                ))}
              </ul>
              <div className="op-foot">
                <div className="op-stats">
                  <div className="op-stat"><span className="os-val">$0</span><span className="os-lbl">forever</span></div>
                  <div className="op-stat"><span className="os-val">3 boats</span><span className="os-lbl">max on this tier</span></div>
                </div>
                <Link href="/signup" className="btn btn-primary">Start Free <ArrowIcon /></Link>
              </div>
            </div>

            {/* Marina Manager */}
            <div className="op-card op-card-marina">
              <div className="op-tier">Marina · 4–50+ boats</div>
              <div className="op-paid-badge">Fleet &amp; Harbormaster</div>
              <h3 className="op-heading">Your fleet, unified.<br /><em>Every captain, current.</em></h3>
              <p className="op-body">Managing multiple vessels means documentation gaps multiply with every captain you add. Boatcheckin gives you a single dashboard across your entire operation — crew roster, license expiry alerts, and a clean record on every hull.</p>
              <ul className="op-list">
                {['Unified dashboard across all vessels', 'Captain roster with license-expiry monitoring', 'Role-based assignments: captain, mate, crew', 'White-label guest pages · dedicated support'].map(li => (
                  <li key={li}><SmallCheck />{li}</li>
                ))}
              </ul>
              <div className="op-foot">
                <div className="op-stats">
                  <div className="op-stat"><span className="os-val">$99</span><span className="os-lbl">Fleet / month</span></div>
                  <div className="op-stat"><span className="os-val">$299</span><span className="os-lbl">Harbormaster / mo</span></div>
                </div>
                <Link href="/signup?tier=harbormaster" className="btn">See Fleet Plans <ArrowIcon /></Link>
              </div>
            </div>

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
              ['Florida Statute · 2022', 'SB 606\n/ §327.54', 'The Boating Safety Act requires Florida livery operators to hold a no-cost FWC permit, carry insurance of at least $500,000 per person and $1M per event, and deliver pre-rental instruction to every renter. Boatcheckin captures the renter-acknowledgment side — the documentation your operation keeps on file.', 'Bareboat · Mandatory since 2023'],
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
          {/* Advisory embedded in compliance section */}
          <div className="compliance-advisory">
            <strong>Boatcheckin is a recordkeeping platform, not a law firm or insurance broker.</strong>
            {' '}Every operator remains responsible for their own compliance with applicable law. Consult a licensed attorney for advice specific to your operation.
            <span className="advisory-links">
              <Link href="/guest-notice">Guest Notice →</Link>
              <Link href="/standards">Our Standards →</Link>
            </span>
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

          <div className="pricing-split">

            {/* Free side */}
            <div className="pricing-free-col">
              <div className="pfc-header">
                <span className="pfc-tag">Free for most operators</span>
                <div className="pfc-price">$0<span className="pfc-period"> forever</span></div>
                <p className="pfc-note">No credit card. No trial clock. No feature gating. Boatcheckin earns fixed referral fees from licensed partners when guests opt into optional services — your bill stays $0.</p>
              </div>
              <div className="pfc-tiers">
                <div className="pfc-tier">
                  <div className="pfc-tier-name">Solo</div>
                  <div className="pfc-tier-cap">1 boat · unlimited trips</div>
                  <ul className="plan-features">
                    {['Full boat wizard · 14 vessel types', 'Guest flow, waivers, QR boarding pass', 'Captain snapshot · no login', 'USCG-format manifest PDF'].map(f => <li key={f}><span className="pf-check">✓</span>{f}</li>)}
                  </ul>
                  <Link href="/signup" className="btn">Start Free →</Link>
                </div>
                <div className="pfc-divider" />
                <div className="pfc-tier">
                  <div className="pfc-tier-name">Charter</div>
                  <div className="pfc-tier-cap">Up to 3 boats · unlimited trips</div>
                  <ul className="plan-features">
                    {['Everything in Solo', 'Multi-boat dashboard view', 'Captain roster per vessel', 'Guest CRM (coming Q3 2026)'].map(f => <li key={f}><span className="pf-check">✓</span>{f}</li>)}
                  </ul>
                  <Link href="/signup" className="btn">Start Free →</Link>
                </div>
              </div>
            </div>

            {/* Paid side */}
            <div className="pricing-paid-col">
              <span className="ppc-tag">Built for fleets</span>

              <div className="plan-row">
                <div className="pr-left">
                  <span className="plan-tag">Mid-fleet</span>
                  <h3 className="plan-name">Fleet</h3>
                  <div className="plan-price rust"><span className="curr">$</span>99<span className="per">/ month</span></div>
                  <p className="plan-desc">Up to 10 boats. Unified dashboard, captain roster, cross-boat assignments, consolidated reporting.</p>
                </div>
                <div className="pr-right">
                  <ul className="plan-features">
                    {['Up to 10 boats', 'Unified multi-boat dashboard', 'Captain roster & assignments', 'Cross-boat captain assignment', 'Priority support'].map(f => <li key={f}><span className="pf-check">✓</span>{f}</li>)}
                  </ul>
                  <Link href="/signup?plan=fleet" className="btn btn-primary">Upgrade to Fleet →</Link>
                </div>
              </div>

              <div className="plan-row plan-row-featured">
                <div className="pr-left">
                  <span className="plan-tag">Enterprise</span>
                  <h3 className="plan-name">Harbormaster</h3>
                  <div className="plan-price brass"><span className="curr">$</span>299<span className="per">/ month</span></div>
                  <p className="plan-desc">Unlimited boats, white-label guest pages, API access, dedicated account manager and custom SLA.</p>
                </div>
                <div className="pr-right">
                  <ul className="plan-features">
                    {['Unlimited boats', 'Everything in Fleet', 'White-label guest-facing pages', 'API access & custom integrations', 'Dedicated account manager'].map(f => <li key={f}><span className="pf-check">✓</span>{f}</li>)}
                  </ul>
                  <a href="/contact?plan=harbormaster" className="btn">Talk to Sales →</a>
                </div>
              </div>

              <p className="ppc-note" style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--ink-muted)', letterSpacing: '0.06em', marginTop: '20px' }}>
                Works alongside FareHarbor, WaveRez, Boatsetter, and others. API integrations coming Q4 2026.
              </p>
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
              <h2 className="section-title" style={{ fontSize: 'clamp(28px,3.6vw,44px)' }}>Questions<br /><span className="sea">from the dock.</span></h2>
              <p className="section-sub" style={{ fontSize: 16 }}>The ones we actually hear. Others: write to us at the address in the footer.</p>
            </div>
            <div className="faq-list">
              {[
                ['Is Boatcheckin really free for Solo and Charter?', 'Yes. Forever. No credit card, no trial clock, no feature gating. Boatcheckin earns fixed referral fees from licensed partners when guests opt into optional insurance or add-on services — those fees are paid regardless of whether a guest purchases anything. Your bill stays $0.'],
                ['Are the digital waivers legally enforceable?', 'Boatcheckin is designed around the requirements of the federal ESIGN Act and Florida\'s UETA: intent to sign, consent to an electronic process, association of the signature with the record, and long-term record retention. Each signature is captured with a SHA-256 hash linking it to the exact waiver text the guest saw.'],
                ['Can my guests use this without installing an app?', 'Yes — that\'s the whole point. Boatcheckin runs in the guest\'s mobile browser. They tap the link you send, fill out their details, sign the waiver, and get their QR boarding pass. No download, no account, no friction.'],
                ['How does this relate to Florida SB 606?', 'SB 606 requires livery operators to document pre-rental instruction, hold FWC permitting, and carry minimum insurance. Boatcheckin captures the documentation side — the renter\'s acknowledgment, FWC Boater Safety ID, captain\'s attestation, and signed record. Always consult your attorney for application to your specific operation.'],
                ['What happens to guest data after the trip?', 'Marketing-related data is cleared on a rolling 90-day cycle unless the guest has opted in. Compliance-critical records — signed waivers, safety-briefing attestations, manifests — are retained for the period your operation and its statutes require, and are always exportable before any retention window closes.'],
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
              <p className="fca-sub">Set up your first boat in under 10 minutes. Send your first guest link tonight. Start your operation&apos;s record on a clean page.</p>
            </div>
            <div className="fca-stack">
              <Link href="/signup" className="btn">Start Free · 10-min Setup →</Link>
              <a href="/contact" className="btn btn-outline">Book an Operator Call</a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <MarketingFooter />
    </div>
  )
}
