import type { Metadata } from 'next'
import { HowItWorksFAQ } from '@/components/marketing/HowItWorksFAQ'

export const metadata: Metadata = {
  title: 'How it Works — Boatcheckin',
  description:
    'How a complete compliance record gets built for every charter trip. Setup, per-trip flow, guest experience, captain snapshot, and the sealed record — in plain language.',
  openGraph: {
    title: 'How it Works — Boatcheckin',
    description:
      'Five steps. Two are yours. Here is how the compliance record gets built for every trip you run.',
    type: 'website',
    url: 'https://boatcheckin.com/how-it-works',
  },
}

function CheckSVG() {
  return (
    <svg viewBox="0 0 12 12" fill="none" style={{ width: 11, height: 11 }}>
      <path d="M2 6l3 3 5-6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function HowItWorksPage() {
  return (
    <>
      {/* ═══ HERO ═══ */}
      <section className="hero">
        <div className="w">
          <div className="hero-grid">
            <div>
              <div className="lbl lbl-inv" style={{ marginBottom: 14 }}>How the record gets built</div>
              <h1>Five steps. Two of them are yours.</h1>
              <p className="hero-sub">Here is exactly what happens from the moment you create a trip to the moment the captain slides to start. The compliance record builds itself along the way.</p>
              <p className="hero-note">Setup takes about 15 minutes, once. Every trip after that is under a minute of your time.</p>
              <div className="hero-btns">
                <a href="/signup" className="btn btn-gold btn-lg">Start Free</a>
                <a href="#glance" className="btn btn-ghost btn-lg">See the steps</a>
              </div>
            </div>

            {/* Time panel */}
            <div className="time-panel">
              <div className="tp-head"><div className="tp-label">Time breakdown per trip</div></div>
              <div className="tp-rows">
                {[
                  ['Operator', 'Create trip, send link, review manifest', '< 60 sec'],
                  ['Each guest', 'Register, sign waiver, acknowledge safety cards', '~3 min'],
                  ['Captain', 'Review manifest, confirm departure', '< 60 sec'],
                  ['Setup', 'Boat, waiver, safety briefing · once only', '~15 min'],
                ].map(([role, action, time]) => (
                  <div className="tp-row" key={role}>
                    <div className="tp-role">{role}</div>
                    <div className="tp-action">{action}</div>
                    <div className="tp-time">{time}</div>
                  </div>
                ))}
              </div>
              <div className="tp-foot">Operator does nothing between guest link and captain snapshot</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ AT A GLANCE ═══ */}
      <section className="sec" id="glance">
        <div className="w">
          <div className="lbl">The whole flow</div>
          <h2>Five steps, in order.</h2>
          <p className="sec-sub">Each step produces a component of the compliance record. By the time the captain confirms departure, the record is complete.</p>
          <div className="step-strip">
            {[
              ['Step 01', 'Operator · once only', 'Configure', 'Vessel, waiver text, safety briefing. Configured once. Every future trip pulls from these defaults.', '~15 min total'],
              ['Step 02', 'Operator · every trip', 'Create trip, send link', 'Pick the boat, set the date. One link is generated and sent to the booker. Nothing else required.', '< 60 seconds'],
              ['Step 03', 'Each guest', 'Register on their phone', 'No app. They tap the link, enter details, sign the waiver, and acknowledge safety cards. QR boarding pass issued on completion.', '~3 min per guest'],
              ['Step 04', 'Captain · at the dock', 'Review manifest, depart', 'One link on their phone. No login. Manifest, waiver status, safety acknowledgments. Slide to start. Record sealed.', '< 60 seconds'],
              ['Step 05', 'Automatic', 'Record sealed', 'Hash-verified, audit trail locked, retained for five years. Exportable on demand. No filing required.', 'Automatic'],
            ].map(([num, role, title, body, time]) => (
              <div className="ss-cell" key={num}>
                <div className="ss-num">{num}</div>
                <div className="ss-role">{role}</div>
                <div className="ss-title">{title}</div>
                <div className="ss-body">{body}</div>
                <div className="ss-time">{time}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PART 01: SETUP ONCE ═══ */}
      <section className="sec sec-dark" id="setup">
        <div className="w">
          <div className="lbl lbl-inv">Part 01</div>
          <h2>Setup once. Use for every trip.</h2>
          <p className="sec-sub">Configuration is front-loaded deliberately. You spend 15 minutes now, and every trip after this is automatic.</p>
          <div className="setup-grid">
            <div className="setup-card">
              <div className="sc-time">Boat Wizard &nbsp;&middot;&nbsp; ~4 min</div>
              <h3>Add your vessel</h3>
              <p>Vessel name and registration, hailing port, documented length, passenger capacity, propulsion, and operating area. Multi-vessel fleets add each boat once; trips reference them by name.</p>
            </div>
            <div className="setup-card">
              <div className="sc-time">Waiver text &nbsp;&middot;&nbsp; ~4 min</div>
              <h3>Paste in your waiver</h3>
              <p>The waiver your insurer reviewed and your attorney approved. Paste it in. We capture it exactly. We do not rewrite it, interpret it, or attest to its enforceability. A starter template is available if you do not yet have one.</p>
            </div>
            <div className="setup-card">
              <div className="sc-time">Safety briefing &nbsp;&middot;&nbsp; ~4 min</div>
              <h3>One card per safety item</h3>
              <p>PFD location, fire extinguisher, man-overboard procedure, emergency contacts — entered as individual cards. Guests acknowledge each one separately with its own timestamp. This is the structural alignment with 46 CFR §185.506.</p>
            </div>
            <div className="setup-card">
              <div className="sc-time">Compliance settings &nbsp;&middot;&nbsp; ~3 min</div>
              <h3>Jurisdiction and retention</h3>
              <p>Operating jurisdiction, retention window (default: five-year minimum), and electronic-signature consent language. The defaults are conservative. Most operators never change these after initial setup.</p>
            </div>
          </div>
          <div className="outcome-bar">
            <span className="ob-text">Account ready. Next trip goes live in under a minute.</span>
            <span className="ob-meta">Setup complete &nbsp;&middot;&nbsp; ~15 min</span>
          </div>
        </div>
      </section>

      {/* ═══ PART 02: PER TRIP ═══ */}
      <section className="sec" id="per-trip">
        <div className="w">
          <div className="lbl">Part 02</div>
          <h2>Your role per trip: three actions.</h2>
          <p className="sec-sub">The operator is mostly a reviewer, not a doer. Everything between sending the link and reviewing the manifest runs without you.</p>
          <div className="how-strip">
            <div className="how-cell">
              <div className="hc-n">Action 01 &nbsp;&middot;&nbsp; ~20 seconds</div>
              <h3>Create the trip</h3>
              <p>Date, vessel, expected guest count, captain. Optional: booker contact, departure slip, trip notes. A cryptographically signed URL is generated immediately — scoped to this trip only.</p>
              <div className="hc-time">~20 seconds</div>
            </div>
            <div className="how-cell">
              <div className="hc-n">Action 02 &nbsp;&middot;&nbsp; ~10 seconds</div>
              <h3>Send the link</h3>
              <p>One message to the booker. They share it with their party the same way they would share a restaurant reservation. You do not collect guest phone numbers. You do not chase anyone.</p>
              <div className="hc-time">~10 seconds</div>
            </div>
            <div className="how-cell">
              <div className="hc-n">Action 03 &nbsp;&middot;&nbsp; optional</div>
              <h3>Watch the manifest fill</h3>
              <p>Guests register in real time. Your dashboard shows who is signed, who is outstanding, and the trip status. If everyone completes early, you know before you arrive at the dock.</p>
              <div className="hc-time">Optional monitoring</div>
            </div>
          </div>
          <div className="outcome-bar-light">
            <span className="ob-text-light">Your 10am charter is ready before 8am. You did nothing.</span>
            <span className="ob-meta-light">Operator time &nbsp;&middot;&nbsp; &lt; 60 seconds</span>
          </div>
        </div>
      </section>

      {/* ═══ PART 03: GUEST EXPERIENCE ═══ */}
      <section className="sec sec-dark" id="guest">
        <div className="w">
          <div className="lbl lbl-inv">Part 03</div>
          <h2>What your guest sees when they tap the link.</h2>
          <p className="sec-sub">No app to download. No account to create. No password to remember. The guest opens a browser link and completes everything in about three minutes.</p>
          <div className="guest-grid">
            {[
              ['01', 'Open the link', 'Works in any browser on any phone. English, Spanish, Portuguese, French, German, Italian, or Arabic. Auto-detected from device settings.', 'No app download'],
              ['02', 'Identity and verification', 'Name, email, phone, date of birth where required. A one-time code confirms the identity. The signature is linked to a verified person, not an anonymous browser.', 'OTP verified'],
              ['03', 'Read and sign the waiver', 'The full waiver text, in the guest\'s language. Drawn or typed signature. Timestamp, IP, user agent, and SHA-256 hash captured together. This is the ESIGN and UETA compliant record.', 'SHA-256 hashed'],
              ['04', 'Safety card acknowledgment', 'One card per safety item. PFD location, fire extinguisher, man-overboard, and any items you configured. Each acknowledged individually with its own timestamp and attribution.', 'Per-card record'],
              ['05', 'QR boarding pass issued', 'Confirmation sent with trip details and a copy of what the guest signed. The operator manifest updates instantly. The captain snapshot updates instantly.', 'Record updated'],
            ].map(([num, title, desc, tag]) => (
              <div className="g-step" key={num}>
                <div className="g-num">{num}</div>
                <div>
                  <h4>{title}</h4>
                  <p>{desc}</p>
                  <span className="g-tag">{tag}</span>
                </div>
              </div>
            ))}
            <div className="g-step" style={{ alignItems: 'center' }}>
              <div className="g-num" style={{ color: 'rgba(201,162,39,0.4)', fontSize: 28 }}>~3</div>
              <div>
                <h4 style={{ color: 'rgba(232,232,224,0.5)' }}>Total time per guest</h4>
                <p>Three minutes of their time. They can complete it from home, from the car on the way to the marina, or at the dock. Most complete it the evening before the trip.</p>
              </div>
            </div>
          </div>
          <div className="outcome-bar">
            <span className="ob-text">Every guest verified, signed, and briefed before they arrive.</span>
            <span className="ob-meta">Guest time &nbsp;&middot;&nbsp; ~3 min</span>
          </div>
        </div>
      </section>

      {/* ═══ PART 04: CAPTAIN AT THE DOCK ═══ */}
      <section className="sec" id="captain">
        <div className="w">
          <div className="lbl">Part 04</div>
          <h2>What the captain sees on their phone.</h2>
          <p className="sec-sub">One link. No login. The captain arrives at the slip, opens the snapshot, reviews the manifest, and confirms departure. Under a minute.</p>
          <div className="cap-layout">
            <div>
              <div className="cap-features">
                {[
                  ['Manifest', 'Every guest registered for this trip. Who has signed, who is outstanding, who registered at 2am — visible at a glance. One tap to see any guest\'s full record.'],
                  ['Waivers', 'Green if signed and hash-verified. Red if missing. One tap opens the signed document with the full text the guest saw, the signature, and the SHA-256 hash.'],
                  ['Safety cards', 'Per-guest acknowledgment status. A missing card is visible immediately. The captain can see exactly which guest has not acknowledged which item.'],
                  ['Emergency', 'Every guest\'s emergency contact. One tap to dial. USCG VHF Ch. 16 and FWC hotline always present on the screen.'],
                  ['Start control', ''],
                ].map(([label, body], i) => (
                  <div className="cap-feat" key={label} style={i === 4 ? { borderBottom: 'none' } : {}}>
                    <div className="cf-label">{label}</div>
                    <div className="cf-body">
                      {label === 'Start control'
                        ? <><strong>The software does not auto-start. The captain directs. Boatcheckin records.</strong> The slide-to-start is intentional, timestamped, and seals the departure as the trip&rsquo;s attested starting state.</>
                        : body
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Captain manifest card */}
            <div className="manifest-card">
              <div className="mc-head">
                <div className="mc-label">Captain snapshot</div>
                <div className="mc-vessel">Wild Child</div>
                <div className="mc-meta">Tue Jul 7 &nbsp;&middot;&nbsp; 08:00 &nbsp;&middot;&nbsp; Slip B-14</div>
              </div>
              <div className="mc-status-strip">
                <div className="mc-stat"><div className="mc-stat-n">4</div><div className="mc-stat-l">Registered</div></div>
                <div className="mc-stat"><div className="mc-stat-n">4</div><div className="mc-stat-l">Waivers</div></div>
                <div className="mc-stat"><div className="mc-stat-n">4</div><div className="mc-stat-l">Safety</div></div>
              </div>
              <div className="mc-list">
                {[
                  ['Karen Martinez', 'Signed 07:12 · Verified', 'Booker'],
                  ['James Chen', 'Signed 07:48 · Verified', ''],
                  ['María Alonso', 'Signed 08:05 · Verified', ''],
                  ['Tomás Alonso', 'Signed 08:05 · Guardian', 'Minor'],
                ].map(([name, sub, badge], i) => (
                  <div className="mc-row" key={name} style={i === 3 ? { borderBottom: 'none' } : {}}>
                    <div className="mc-ok">✓</div>
                    <div><div className="mc-name">{name}</div><div className="mc-sub">{sub}</div></div>
                    <div className="mc-badge">{badge}</div>
                  </div>
                ))}
              </div>
              <div className="mc-start">Slide to start trip</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PART 05: THE SEALED RECORD ═══ */}
      <section className="sec sec-dark" id="record">
        <div className="w">
          <div className="lbl lbl-inv">Part 05</div>
          <h2>The record that results from every trip.</h2>
          <p className="sec-sub">Every step above produces a component of this record. When the captain slides to start, the components are combined, sealed, and retained. This is what you have when someone asks.</p>
          <div className="rec-layout">
            <div className="compliance-doc">
              <div className="cd-head">
                <div>
                  <div className="cd-lbl">Compliance Record</div>
                  <div className="cd-vessel">M/V Dockside</div>
                  <div className="cd-trip">Trip #4417 &middot; July 7, 2026</div>
                </div>
                <span className="cd-seal">Sealed</span>
              </div>
              <div className="cd-rows">
                {[
                  ['6 of 6 guest waivers signed and hashed', 'Verified'],
                  ['Safety briefing acknowledged per card', 'Verified'],
                  ['Head count confirmed: 6 / 6 aboard', 'Verified'],
                  ['USCG manifest PDF generated and filed', 'Filed'],
                  ['Captain departure attested', 'Attested'],
                  ['Audit trail sealed at trip completion', 'Sealed'],
                ].map(([text, status]) => (
                  <div className="cd-row" key={text}>
                    <div className="cd-check">✓</div>
                    <span>{text}</span>
                    <span className="cd-status">{status}</span>
                  </div>
                ))}
              </div>
              <div className="cd-foot">
                <div className="cd-hash"><strong>SHA-256</strong>&nbsp; a3f2c8e1...d91e7b04</div>
                <div>
                  <span className="cd-cleared">Cleared to Depart</span>
                  <span className="cd-time">0814 EDT</span>
                </div>
              </div>
            </div>
            <div>
              <div className="rec-components">
                {[
                  ['Signed waivers', 'SHA-256 hashed at signing. Exact text, signature, timestamp, and IP bound together. Modification is detectable.'],
                  ['Safety briefing', 'Per-card acknowledgment. Each item separately timestamped and attributed to the individual guest.'],
                  ['Passenger manifest', 'USCG-format PDF. Names, count, emergency contacts. Downloadable before and after the trip.'],
                  ['Audit trail', 'Every state change logged: creation, signing, departure, completion. Append-only. Sealed at trip end.'],
                  ['Captain attestation', 'Departure confirmed and timestamped. The captain\'s name and credential are part of the sealed record.'],
                  ['Five-year retention', 'Default minimum retention. Operator-configurable. Exportable as a complete PDF at any time.'],
                ].map(([title, desc]) => (
                  <div className="rc-item" key={title}>
                    <h4>{title}</h4>
                    <p>{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="outcome-bar" style={{ marginTop: 32 }}>
            <span className="ob-text">Two years later, when someone asks, the record is complete and retrievable in seconds.</span>
            <span className="ob-meta">Automatic &nbsp;&middot;&nbsp; Every trip</span>
          </div>
        </div>
      </section>

      {/* ═══ TIME COMPARISON ═══ */}
      <section className="sec sec-alt" id="time">
        <div className="w">
          <div className="lbl">What changes</div>
          <h2>The same trip. Far less of your morning.</h2>
          <p className="sec-sub">Time estimates from conversations with working charter captains. Six-guest half-day trip, before and after Boatcheckin.</p>
          <div style={{ overflowX: 'auto' }}>
            <table className="time-table">
              <thead>
                <tr>
                  <th style={{ width: '32%' }}>Task</th>
                  <th style={{ width: '34%' }}>Before Boatcheckin</th>
                  <th>With Boatcheckin</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Chasing waivers</td>
                  <td><span className="tag-before">15–30 min</span><br/>Texts, emails, clipboard morning-of.</td>
                  <td><span className="tag-after">0</span><br/>Booker shares link. Guests self-register.</td>
                </tr>
                <tr>
                  <td>Safety briefing at dock</td>
                  <td><span className="tag-before">10–15 min</span><br/>Repeated verbally for every group.</td>
                  <td><span className="tag-after">2 min</span><br/>Guests pre-briefed. Captain reinforces key points only.</td>
                </tr>
                <tr>
                  <td>Building the manifest</td>
                  <td><span className="tag-before">5–10 min</span><br/>Paper list. Asking names at the slip.</td>
                  <td><span className="tag-after">0</span><br/>Auto-populated as guests register.</td>
                </tr>
                <tr>
                  <td>Filing after the trip</td>
                  <td><span className="tag-before">10 min</span><br/>Scanning, labeling, physical storage.</td>
                  <td><span className="tag-after">0</span><br/>Sealed and stored automatically.</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td>Per trip</td>
                  <td style={{ color: '#b91c1c' }}>40–65 min of operator and captain time</td>
                  <td style={{ color: 'var(--verified)' }}>Under 2 min of oversight</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="sec sec-mid" id="faq">
        <div className="w">
          <div className="lbl">Questions about the flow</div>
          <h2>What operators ask before signing up.</h2>
          <br />
          <HowItWorksFAQ />
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="cta">
        <div className="w">
          <div className="lbl lbl-inv" style={{ display: 'block', textAlign: 'center', marginBottom: 12 }}>Ready to start</div>
          <h2>Set up in 15 minutes. Ready for your next booking.</h2>
          <p>Free for solo captains and charter operators with up to three boats.</p>
          <div className="cta-btns">
            <a href="/signup" className="btn btn-gold btn-lg">Start Free</a>
            <a href="/contact" className="btn btn-ghost btn-lg">Contact us</a>
          </div>
        </div>
      </section>
    </>
  )
}
