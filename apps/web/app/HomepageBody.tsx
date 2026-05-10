'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { MarketingNav } from '../components/marketing/MarketingNav'
import { MarketingFooter } from '../components/marketing/MarketingFooter'

/* ─── Icons ────────────────────────────────────────────────────────────────── */
function CheckIcon() {
  return (
    <svg className="dossier-check" viewBox="0 0 20 20" fill="none">
      <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Tick() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 3 }}>
      <path d="M3 8.5l3.5 3.5L13 5" stroke="var(--status-ok)" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ─── Homepage ─────────────────────────────────────────────────────────────── */
export default function HomepageBody() {

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) (e.target as HTMLElement).classList.add('visible')
      })
    }, { threshold: 0.15 })

    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="hp">
      <MarketingNav />

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="v3-hero">
        <div className="v3-wrap">
          <div className="v3-hero-grid">
            <div className="v3-hero-text">
              <p className="v3-eyebrow">Charter compliance · digitized</p>
              <h1 className="v3-h1">
                The trip record<br />
                that&apos;s already<br />
                <em>on file.</em>
              </h1>
              <p className="v3-lede">
                One link to your guests. They sign the waiver, acknowledge
                the safety briefing, and get their boarding pass — on their
                own phone, in under 3 minutes. You get a clean, defensible
                record for every trip.
              </p>
              <p className="v3-free-line">Free for solo captains and small charters. Forever.</p>
              <div className="v3-hero-cta">
                <Link href="/signup" className="v3-btn-primary">
                  Start Free — 10 min setup
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
                </Link>
              </div>
            </div>

            <div className="v3-hero-visual">
              <div className="v3-dossier">
                <span className="dossier-tag">Sample trip record</span>
                <div className="v3-stamp">ON FILE</div>
                <div className="v3-dossier-head">
                  <span>M/V DOCKSIDE · TRIP #4417</span>
                </div>
                <div className="v3-dossier-title">Pre-Departure Checklist</div>
                <div className="v3-dossier-row"><CheckIcon /><span>6 of 6 guest waivers signed &amp; hashed</span></div>
                <div className="v3-dossier-row"><CheckIcon /><span>Safety briefing acknowledged</span></div>
                <div className="v3-dossier-row"><CheckIcon /><span>Head count confirmed — 6 / 6 aboard</span></div>
                <div className="v3-dossier-row"><CheckIcon /><span>USCG manifest PDF filed</span></div>
                <div className="v3-dossier-foot">
                  <span className="v3-cleared">Cleared to Depart</span>
                  <span className="v3-time">0814 EDT</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ HOW IT WORKS ═══════════════════ */}
      <section className="v3-how" id="how">
        <div className="v3-wrap">
          <h2 className="v3-section-title">How it works</h2>
          <div className="v3-steps">

            <div className="v3-step fade-up">
              <span className="v3-step-num">01</span>
              <h3 className="v3-step-title">You send a link</h3>
              <p className="v3-step-body">
                Create a trip, pick your vessel, set capacity. Get a shareable
                link and a 4-character code. Send it by text, email, or booking
                confirmation.
              </p>
              <span className="v3-step-time">60 seconds</span>
            </div>

            <div className="v3-step fade-up">
              <span className="v3-step-num">02</span>
              <h3 className="v3-step-title">Guests do the work</h3>
              <p className="v3-step-body">
                No app. No account. Guests fill their details, swipe through
                safety cards, and sign the waiver — all on their own phone.
                They get a QR boarding pass when done.
              </p>
              <span className="v3-step-time">Under 3 minutes</span>
            </div>

            <div className="v3-step fade-up">
              <span className="v3-step-num">03</span>
              <h3 className="v3-step-title">Captain reviews, record sealed</h3>
              <p className="v3-step-body">
                Live manifest on the captain&apos;s phone — no login needed.
                Non-swimmer alerts, dietary flags, weather, head count.
                Attest the briefing, confirm departure. Record sealed automatically.
              </p>
              <span className="v3-step-time">30 seconds</span>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════ PRICING ═══════════════════ */}
      <section className="v3-pricing" id="pricing">
        <div className="v3-wrap">
          <h2 className="v3-section-title">Simple pricing</h2>
          <p className="v3-section-sub">No credit card. No trial. No feature gating.</p>

          <div className="v3-price-grid">

            <div className="v3-price-card fade-up">
              <div className="v3-price-tag">Solo</div>
              <div className="v3-price-cap">1 boat</div>
              <div className="v3-price-amount">$0<span> forever</span></div>
              <ul className="v3-price-list">
                <li><Tick />Unlimited trips</li>
                <li><Tick />Guest flow, waivers, QR boarding pass</li>
                <li><Tick />Captain snapshot — no login</li>
                <li><Tick />USCG-format manifest PDF</li>
              </ul>
              <Link href="/signup" className="v3-btn-secondary">Start Free →</Link>
            </div>

            <div className="v3-price-card fade-up">
              <div className="v3-price-tag">Charter</div>
              <div className="v3-price-cap">Up to 3 boats</div>
              <div className="v3-price-amount">$0<span> forever</span></div>
              <ul className="v3-price-list">
                <li><Tick />Everything in Solo</li>
                <li><Tick />Multi-boat dashboard</li>
                <li><Tick />Captain roster per vessel</li>
                <li><Tick />7 guest languages + audio</li>
              </ul>
              <Link href="/signup" className="v3-btn-secondary">Start Free →</Link>
            </div>

            <div className="v3-price-card v3-price-card-fleet fade-up">
              <div className="v3-price-tag">Fleet</div>
              <div className="v3-price-cap">4+ boats</div>
              <div className="v3-price-amount">From $99<span> /month</span></div>
              <ul className="v3-price-list">
                <li><Tick />Everything in Charter</li>
                <li><Tick />Unified fleet dashboard</li>
                <li><Tick />Captain roster &amp; license alerts</li>
                <li><Tick />Cross-boat assignments</li>
              </ul>
              <div className="v3-hm-line">
                Harbormaster tier from $299/mo for 10+ boats.
                <a href="/contact?plan=harbormaster">Talk to sales →</a>
              </div>
              <Link href="/signup?plan=fleet" className="v3-btn-primary">Start Fleet Trial →</Link>
            </div>

          </div>

          <p className="v3-pricing-note">
            Built around <strong>SB 606</strong>, <strong>46 CFR §185.506</strong>,
            and <strong>FWC Chapter 327</strong>.{' '}
            <Link href="/standards">See our standards →</Link>
          </p>
        </div>
      </section>

      {/* ═══════════════════ FAQ ═══════════════════ */}
      <section className="v3-faq" id="faq">
        <div className="v3-wrap">
          <h2 className="v3-section-title">Quick answers</h2>
          <div className="v3-faq-list">
            {[
              ['Is it really free?', 'Yes. Solo and Charter tiers are $0 forever — no credit card, no trial clock, no feature gating. Boatcheckin earns fixed referral fees from licensed partners when guests opt into optional add-on services. Your bill stays $0.'],
              ['Are digital waivers legally enforceable?', 'Boatcheckin is built around the federal ESIGN Act and Florida\'s UETA: intent to sign, consent to electronic process, association of the signature with the record, and long-term retention. Every signature is SHA-256 hashed and linked to the exact waiver text.'],
              ['Do guests need to install an app?', 'No. Boatcheckin runs in the guest\'s mobile browser. They tap the link, fill details, sign the waiver, and get a QR boarding pass. No download, no account, no friction.'],
              ['What about non-English speakers?', 'The guest flow supports English, Spanish, Portuguese, French, German, Italian, and Arabic — with optional audio safety briefings for guests who don\'t read.'],
            ].map(([q, a]) => (
              <details className="v3-faq-item" key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ CTA ═══════════════════ */}
      <section className="v3-cta">
        <div className="v3-wrap">
          <h2 className="v3-cta-h">Ready to run your first trip?</h2>
          <p className="v3-cta-sub">Set up in 10 minutes. Send your first guest link tonight.</p>
          <div className="v3-cta-buttons">
            <Link href="/signup" className="v3-btn-primary">
              Start Free →
            </Link>
            <Link href="/contact" className="v3-btn-ghost">
              Questions? Contact us
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
