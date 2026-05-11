'use client'
import { useEffect } from 'react'
import { MarketingNav } from '../components/marketing/MarketingNav'
import { MarketingFooter } from '../components/marketing/MarketingFooter'

function CheckSVG() {
  return (
    <svg viewBox="0 0 12 12" fill="none">
      <path d="M2 6l3 3 5-6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function HomepageBody() {
  useEffect(() => {
    // FAQ accordion
    const items = document.querySelectorAll('.fq-q')
    items.forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.parentElement!
        const answer = item.querySelector('.fq-a') as HTMLElement
        const isOpen = item.classList.contains('open')
        document.querySelectorAll('.fq-item.open').forEach(el => {
          el.classList.remove('open');
          (el.querySelector('.fq-a') as HTMLElement).style.maxHeight = '0'
        })
        if (!isOpen) {
          item.classList.add('open')
          answer.style.maxHeight = answer.scrollHeight + 'px'
        }
      })
    })
  }, [])

  return (
    <>
      <MarketingNav />

      {/* ── HERO ── */}
      <section className="hero">
        <div className="w">
          <div className="hero-grid">
            <div>
              <div className="lbl lbl-inv" style={{marginBottom:14}}>Compliance recordkeeping for charter operators</div>
              <h1>The compliance record for every trip you run.</h1>
              <p className="hero-sub">Boatcheckin captures signed waivers, safety briefings, passenger manifests, and the complete audit trail for every charter trip. Hash-verified at signing. Retained for years. Exportable when someone asks.</p>
              <p className="hero-note">Free for solo captains and charters with up to 3 boats. No credit card required.</p>
              <div className="hero-btns">
                <a href="/signup" className="btn btn-gold btn-lg">Start Free</a>
                <a href="#how" className="btn btn-ghost btn-lg">See how it works</a>
              </div>
            </div>

            {/* Compliance Record card */}
            <div className="record">
              <div className="rec-head">
                <div>
                  <div className="rec-label">Compliance Record</div>
                  <div className="rec-vessel">M/V Dockside</div>
                  <div className="rec-trip">Trip #4417 &middot; April 21, 2026</div>
                </div>
                <span className="rec-seal">Sealed</span>
              </div>
              <div className="rec-rows">
                {[
                  ['6 of 6 guest waivers signed and hashed', 'Verified'],
                  ['Safety briefing acknowledged per card', 'Verified'],
                  ['Head count confirmed: 6 / 6 aboard', 'Verified'],
                  ['USCG manifest PDF generated and filed', 'Filed'],
                  ['Audit trail sealed at trip completion', 'Sealed'],
                ].map(([text, status]) => (
                  <div className="rec-row" key={text}>
                    <div className="rec-check"><CheckSVG /></div>
                    <span>{text}</span>
                    <span className="rec-status">{status}</span>
                  </div>
                ))}
              </div>
              <div className="rec-foot">
                <div className="rec-hash"><strong>SHA-256</strong>&nbsp;a3f2c8e1...d91e7b04</div>
                <div className="rec-cleared">
                  <span className="rec-cleared-text">Cleared to Depart</span>
                  <span className="rec-cleared-time">0814 EDT</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="sec" id="how">
        <div className="w">
          <div className="lbl">How it works</div>
          <h2>Three steps. Most of the work is done by your guests.</h2>
          <p className="sec-sub">You send one link. Guests build the record themselves. The captain confirms it at the dock.</p>
          <div className="how-grid">
            <div className="how-cell">
              <div className="how-n">Step 01</div>
              <h3>Create a trip, send a link</h3>
              <p>Pick your boat, set the date and capacity. You get a shareable link and a 4-character code. Text it, email it, or attach it to your booking confirmation.</p>
              <div className="how-dur">60 seconds of operator time</div>
            </div>
            <div className="how-cell">
              <div className="how-n">Step 02</div>
              <h3>Guests register on their phone</h3>
              <p>No app download. No account creation. They open the link, enter their details, swipe through safety cards, and sign the waiver. They receive a QR boarding pass when finished.</p>
              <div className="how-dur">Under 3 minutes per guest</div>
            </div>
            <div className="how-cell">
              <div className="how-n">Step 03</div>
              <h3>Captain confirms, record sealed</h3>
              <p>Live manifest on the captain&rsquo;s phone. No login needed. Waiver status, non-swimmer flags, dietary notes, weather, head count. Confirm departure. Record is hashed, sealed, and retained.</p>
              <div className="how-dur">30 seconds at the dock</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT'S AT STAKE ── */}
      <section className="sec sec-dark" id="protection">
        <div className="w">
          <div className="lbl lbl-inv">Why this matters</div>
          <h2>When a claim gets filed, the record is the case.</h2>
          <p className="sec-sub">Most operators discover they need proper documentation only after they need it. These are the three moments it matters most.</p>
          <div className="stake-grid">
            <div className="stake-card">
              <div className="stake-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              </div>
              <h4>A guest files a personal injury claim</h4>
              <p>Without a verifiable waiver record, you are arguing from memory. What did they agree to, on what date, with what language?</p>
              <div className="res">Boatcheckin produces the signed waiver, the exact text the guest saw, the timestamp, and the SHA-256 hash. The agreement is documented and unalterable.</div>
            </div>
            <div className="stake-card">
              <div className="stake-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              </div>
              <h4>A USCG inspection or audit</h4>
              <p>Federal regulations under 46 CFR §185.506 require a passenger manifest and documented safety briefing. A clipboard does not meet that standard.</p>
              <div className="res">Boatcheckin generates a USCG-format PDF manifest and per-card safety acknowledgment record. Both are exportable on demand.</div>
            </div>
            <div className="stake-card">
              <div className="stake-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <h4>An insurance inquiry from two years ago</h4>
              <p>Your insurer requests documentation for a specific trip from 14 months back. Paper records are lost, faded, or never existed.</p>
              <div className="res">Boatcheckin retains every record for a minimum of five years. The complete trip file is searchable by vessel, date, or guest name in seconds.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT THE RECORD CONTAINS ── */}
      <section className="sec sec-alt" id="record">
        <div className="w">
          <div className="lbl">What the record contains</div>
          <h2>Everything that matters when someone asks.</h2>
          <p className="sec-sub">Each trip produces a sealed compliance record. Retained for a minimum of five years. Exportable as a complete PDF package at any time.</p>
          <div className="rec-grid">
            {[
              ['Signed waivers', 'SHA-256 hashed at signing. Signature, waiver text, timestamp, IP, and device are bound together. Any modification after signing is detectable.'],
              ['Safety briefing', 'Per-card acknowledgment. Each safety item has its own screen and its own attributed timestamp. Not a single checkbox.'],
              ['Passenger manifest', 'USCG-format PDF. Names, head count, emergency contacts. Generated automatically from guest registrations.'],
              ['Audit trail', 'Every state change logged: trip creation, signing, acknowledgment, departure, completion. Append-only. Sealed at trip end.'],
              ['Captain attestation', 'Departure confirmed with a slide-to-start control. Timestamped and attributed. The captain\'s credential is part of the sealed record.'],
              ['Long-term retention', 'Five-year default minimum, operator-configurable. Complete PDF export on demand. Searchable by date, vessel, captain, or guest name.'],
            ].map(([title, desc]) => (
              <div className="rec-item" key={title}>
                <h4>{title}</h4>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOR OPERATORS ── */}
      <section className="sec sec-dark" id="operators">
        <div className="w">
          <div className="lbl lbl-inv">Built for</div>
          <h2>Solo captains. Charter companies. Rental fleets.</h2>
          <p className="sec-sub">Three tiers. Each includes everything the one before it included.</p>
          <div className="who-grid">
            <div className="who-card">
              <h3>Solo captains</h3>
              <div className="who-tier">1 boat &middot; Free forever</div>
              <p>Running your own boat. You need a waiver, a manifest, and a record that holds up if someone asks. Solo tier does exactly that, without features you do not need.</p>
            </div>
            <div className="who-card">
              <h3>Charter companies</h3>
              <div className="who-tier">2&ndash;3 boats &middot; Free forever</div>
              <p>Multiple boats, multiple captains. Each vessel documented independently, each captain credentialed, each trip record separate and searchable. Multi-boat dashboard included.</p>
            </div>
            <div className="who-card">
              <h3>Fleets and marinas</h3>
              <div className="who-tier">4+ boats &middot; From $99/month</div>
              <p>Resort properties, rental marinas, fleet operations running daily. Fleet dashboard, dock staff fulfillment views, qualification checks for self-drive renters, and pre-trip add-on ordering.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="sec" id="pricing">
        <div className="w">
          <div className="lbl">Pricing</div>
          <h2>Free for most operators.</h2>
          <p className="sec-sub">No credit card. No trial expiry. No feature gating on free tiers. Solo and Charter operators pay nothing, ever.</p>
          <div className="pr-grid">
            <div className="pr-card">
              <div className="pr-name">Solo</div>
              <div className="pr-boats">1 boat</div>
              <div className="pr-price">$0</div>
              <div className="pr-per">forever</div>
              <ul className="pr-list">
                <li>Unlimited trips</li>
                <li>Guest flow, waivers, QR boarding pass</li>
                <li>Captain snapshot, no login</li>
                <li>USCG-format manifest PDF</li>
              </ul>
              <a href="/signup" className="btn btn-navy">Start Free</a>
            </div>
            <div className="pr-card">
              <div className="pr-name">Charter</div>
              <div className="pr-boats">Up to 3 boats</div>
              <div className="pr-price">$0</div>
              <div className="pr-per">forever</div>
              <ul className="pr-list">
                <li>Everything in Solo</li>
                <li>Multi-boat dashboard</li>
                <li>Captain roster per vessel</li>
                <li>7 guest languages + audio briefings</li>
              </ul>
              <a href="/signup" className="btn btn-navy">Start Free</a>
            </div>
            <div className="pr-card feat">
              <div className="pr-name">Fleet</div>
              <div className="pr-boats">4+ boats</div>
              <div className="pr-price">$99</div>
              <div className="pr-per">/month</div>
              <ul className="pr-list">
                <li>Everything in Charter</li>
                <li>Unified fleet dashboard</li>
                <li>Captain roster and license alerts</li>
                <li>Cross-boat assignments</li>
              </ul>
              <a href="/signup?plan=fleet" className="btn btn-gold">Start Fleet Trial</a>
            </div>
          </div>
          <p className="pr-note">Harbormaster tier from $299/mo for 10+ boats. <a href="/contact?plan=harbormaster">Talk to sales</a></p>
          <div className="comp-line">Built around <strong>SB 606</strong>, <strong>46 CFR §185.506</strong>, and <strong>FWC Chapter 327</strong>. <a href="/standards">See our compliance standards</a></div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="sec sec-alt" id="faq">
        <div className="w">
          <div className="lbl">Frequently asked</div>
          <h2>Questions operators ask before signing up.</h2>
          <br/>
          <div className="faq-grid">
            <div>
              {[
                ['Is it really free for solo captains?', 'Yes. Solo and Charter tiers are $0 with no time limit, no credit card required, and no feature gating. Boatcheckin earns fixed referral fees from licensed partners when guests opt into optional services. Your bill stays at zero.'],
                ['Are digital waivers legally enforceable?', "Boatcheckin is built around the federal ESIGN Act (15 U.S.C. §7001) and Florida's UETA (F.S. §668.50). Every signature captures intent to sign, consent to electronic process, association of the signature with the record, and long-term retention. Each signed document is SHA-256 hashed and linked to the exact text the guest saw at signing."],
                ['Do guests need to install an app?', 'No. Boatcheckin runs in the guest\'s mobile browser. They tap the link, fill in their details, sign the waiver, and receive a QR boarding pass. No download, no account creation, no friction. It works on any phone in any language.'],
                ['What languages does the guest flow support?', 'English, Spanish, Portuguese, French, German, Italian, and Arabic. Optional audio safety briefings are available for guests who prefer listening. The language is detected automatically from the guest\'s device settings.'],
              ].map(([q, a]) => (
                <div className="fq-item" key={q}>
                  <button className="fq-q">{q}</button>
                  <div className="fq-a"><div className="fq-a-in">{a}</div></div>
                </div>
              ))}
            </div>
            <div>
              {[
                ['What statutes does Boatcheckin align with?', "Boatcheckin's recordkeeping practices align with SB 606, Florida Statute §327.54 (livery operations), 46 CFR §185.506 (pre-departure safety), FWC Chapter 327, the ESIGN Act, and UETA. These references are descriptive, not interpretive. Always consult a licensed attorney for application to your specific operation."],
                ['How does the captain view work?', 'The captain receives a snapshot link via SMS before the trip. Opening it on their phone shows the live manifest: who has registered, who has signed, dietary flags, non-swimmer alerts, emergency contacts, and current weather. No login. No app. The captain confirms departure with a slide-to-start control, which seals the record.'],
                ['Can Boatcheckin connect to my booking platform?', 'Yes. Boatcheckin supports webhook integrations with FareHarbor, Rezdy, and other booking platforms. When a booking is confirmed, Boatcheckin automatically creates the trip and sends the guest registration link. Fleet and Harbormaster tiers include integration setup support.'],
                ['How long are records retained?', 'The default minimum retention period is five years from trip completion. Operators can configure longer retention. Records are stored encrypted at rest, are not deleted unless explicitly requested, and are exportable as a complete PDF package at any time.'],
              ].map(([q, a]) => (
                <div className="fq-item" key={q}>
                  <button className="fq-q">{q}</button>
                  <div className="fq-a"><div className="fq-a-in">{a}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta">
        <div className="w">
          <div className="lbl lbl-inv" style={{display:'block', textAlign:'center', marginBottom:14}}>Ready to start</div>
          <h2>Set up in 10 minutes. Ready for your next booking.</h2>
          <p>Free for solo captains and charter operators with up to three boats. No credit card required.</p>
          <div className="cta-btns">
            <a href="/signup" className="btn btn-gold btn-lg">Start Free</a>
            <a href="/contact" className="btn btn-ghost btn-lg">Contact us</a>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </>
  )
}
