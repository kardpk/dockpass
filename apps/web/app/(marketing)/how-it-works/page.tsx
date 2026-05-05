import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'How it Works — Boatcheckin',
  description: 'From booking confirmation to cleared to board. How Boatcheckin fits into a charter day — setup, per-trip flow, guest experience, captain snapshot, and the sealed record.',
}

export default function HowItWorksPage() {
  return (
    <>
      {/* ═══ DATELINE ═══ */}
      <div className="dateline">
        <div className="container">
          <div className="dateline-inner">
            <div><span className="dl-dot">●</span> HOW IT WORKS — BOATCHECKIN</div>
            <div>SETUP · PER TRIP · GUEST · CAPTAIN · SEAL</div>
            <div id="todayDate">CAPTAIN&apos;S LOG — TODAY</div>
          </div>
        </div>
      </div>

      {/* ═══ HERO ═══ */}
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">How it works</span>
          <h1>Between booking<br />and boarding,<br /><em>one link does the work.</em></h1>
          <p className="lede">
            Boatcheckin fills the gap between a booking confirmation and the moment a captain is ready to slip lines.
            {' '}<strong>Setup takes about fifteen minutes. Per-trip operator time is under a minute.</strong>
          </p>
        </div>
      </section>

      {/* ═══ THE GAP ═══ */}
      <section className="not-block" style={{ padding: '72px 0' }}>
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">The space we sit in</span>
            <h2 className="section-title">The booking platform hands off.<br />The captain picks up at the dock.<br /><em>Everything in between was chaos.</em></h2>
            <p className="section-sub">Before Boatcheckin, those hours lived in text messages, scribbled paper waivers, and the captain asking &quot;which one of you is Karen?&quot; at the slip. We built Boatcheckin for that exact gap.</p>
          </div>

          {/* Before / After viz */}
          <div className="compare-cols">
            <div className="compare-before">
              <div className="cb-label">Before</div>
              <div className="cb-title">Booking confirmed <span style={{ color: 'var(--rust)' }}>→ chaos →</span> at the dock</div>
              <p className="cb-body">Texts, paper waivers on a clipboard, chasing signatures morning-of, and a captain reading names off a list at the slip.</p>
            </div>
            <div className="compare-after">
              <div className="cb-label">With Boatcheckin</div>
              <div className="cb-title">Booking confirmed <span style={{ color: 'var(--status-ok)' }}>→ one link →</span> every guest cleared</div>
              <p className="cb-body">One link, sent by the booker, every guest signs before they arrive. Captain sees green checks. Trip starts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ AT-A-GLANCE — 5 STEPS ═══ */}
      <section className="timeline-section">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow brass">The whole flow in 30 seconds</span>
            <h2 className="section-title">Five steps. <em>Most of them run on their own.</em></h2>
            <p className="section-sub">The rest of this page is a closer look at each step. If you only read the strip below, you understand most of the product.</p>
          </div>

          <div className="tl-grid">
            <div className="tl-item">
              <div className="tl-label">Step 01 · One-time</div>
              <div className="tl-target" style={{ fontSize: 22 }}>Set up</div>
              <div className="tl-desc">Boat Wizard, your waiver, your safety briefing — configured once, used forever.</div>
            </div>
            <div className="tl-item">
              <div className="tl-label">Step 02 · Per trip</div>
              <div className="tl-target" style={{ fontSize: 22 }}>Create</div>
              <div className="tl-desc">A few fields: date, vessel, guests. One link is generated in seconds.</div>
            </div>
            <div className="tl-item">
              <div className="tl-label">Step 03 · Per guest</div>
              <div className="tl-target" style={{ fontSize: 22 }}>Register</div>
              <div className="tl-desc">No app, no account. Guests tap the link, fill in, sign, acknowledge safety.</div>
            </div>
            <div className="tl-item">
              <div className="tl-label">Step 04 · At the dock</div>
              <div className="tl-target" style={{ fontSize: 22 }}>Review</div>
              <div className="tl-desc">Captain sees one snapshot. Green checkmarks. Slide to start the trip.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PHASE 1 — SETUP ═══ */}
      <section className="practice-light">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">Part 01 — Setup</span>
            <h2 className="section-title">Fifteen minutes, <em>and you never do it again.</em></h2>
            <p className="section-sub">Setup is front-loaded on purpose. Configure Boatcheckin once — your vessel details, the waiver your operation uses, the safety briefing you already give — and every future trip pulls from those defaults.</p>
          </div>

          <div className="practice-stack">
            <div className="practice-row">
              <div className="pr-meta">Takes ~4 min</div>
              <div>
                <div className="pr-h">Boat Wizard — <em>add your vessel.</em></div>
                <div className="pr-p">A short guided flow captures vessel name and registration, hailing port, documented length, passenger capacity, propulsion, and operating area. For multi-vessel fleets, you add each boat once; trips reference them by name.</div>
                <div className="pr-p">If you have your vessel documents handy, you can upload them for your own records. They live in your account, not on anyone else&apos;s server.</div>
              </div>
            </div>

            <div className="practice-row">
              <div className="pr-meta">Takes ~4 min</div>
              <div>
                <div className="pr-h">Waiver — <em>yours, word for word.</em></div>
                <div className="pr-p">Paste in the waiver text your operation already uses — the one your insurer reviewed, the one your attorney blessed. That is the waiver every guest will sign. <strong>We do not rewrite it. We do not interpret it. We capture it precisely.</strong></div>
                <div className="pr-p">A starter template is available as scaffolding, clearly marked as a starting point — not legal advice and not a substitute for your own review.</div>
              </div>
            </div>

            <div className="practice-row">
              <div className="pr-meta">Takes ~4 min</div>
              <div>
                <div className="pr-h">Safety briefing — <em>one card per item.</em></div>
                <div className="pr-p">Your pre-departure safety briefing — PFD location, fire extinguisher, man-overboard procedure, emergency contacts — goes in as a series of short cards. Guests see each card individually and acknowledge it with a tap.</div>
                <div className="pr-p">This is the structural alignment with <strong>46 CFR §185.506</strong> and equivalent state rules: each guest sees each item, and each acknowledgment is recorded with timestamp and attribution.</div>
              </div>
            </div>

            <div className="practice-row">
              <div className="pr-meta">Takes ~3 min</div>
              <div>
                <div className="pr-h">Compliance settings — <em>set once, forget it.</em></div>
                <div className="pr-p">Set your operating jurisdiction, your retention window (compliance records default to a five-year minimum), and electronic-signature consent language.</div>
                <div className="pr-p">The defaults are conservative. Most operators never touch these settings again.</div>
              </div>
            </div>
          </div>

          <div className="outcome-bar">
            <span className="ob-tag">Outcome</span>
            <span className="ob-msg">Your account is ready. <em>The next trip you create is live in thirty seconds.</em></span>
            <span className="ob-meta">Setup Complete · ~15 min</span>
          </div>
        </div>
      </section>

      {/* ═══ PHASE 2 — PER TRIP ═══ */}
      <section className="not-block" style={{ padding: '96px 0' }}>
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">Part 02 — Every trip</span>
            <h2 className="section-title">Create the trip. Send the link. <em>That&apos;s it.</em></h2>
            <p className="section-sub">Every trip starts the same way — a few fields, one generated link, one message sent to the booker. The rest happens on its own.</p>
          </div>

          <div className="practice-stack">
            <div className="practice-row" style={{ borderColor: 'var(--line-soft)' }}>
              <div className="pr-meta" style={{ color: 'var(--rust)' }}>~20 seconds</div>
              <div>
                <div className="pr-h" style={{ color: 'var(--ink)' }}>Create — <em style={{ color: 'var(--rust)' }}>or auto-create.</em></div>
                <div className="pr-p" style={{ color: 'var(--ink-soft)' }}>Enter the trip date, select the vessel, set the expected guest count, and pick the captain. Optional fields for the booker contact, departure point, and any trip-specific notes.</div>
              </div>
            </div>
            <div className="practice-row" style={{ borderColor: 'var(--line-soft)' }}>
              <div className="pr-meta" style={{ color: 'var(--rust)' }}>Instant</div>
              <div>
                <div className="pr-h" style={{ color: 'var(--ink)' }}>The trip link is <em style={{ color: 'var(--rust)' }}>generated.</em></div>
                <div className="pr-p" style={{ color: 'var(--ink-soft)' }}>One cryptographically signed URL — unique to this trip, scoped to this trip, configured for the number of guests expected. The link carries the waiver, the safety cards, and the questions your compliance settings require.</div>
              </div>
            </div>
            <div className="practice-row" style={{ borderColor: 'var(--line-soft)' }}>
              <div className="pr-meta" style={{ color: 'var(--rust)' }}>~10 seconds</div>
              <div>
                <div className="pr-h" style={{ color: 'var(--ink)' }}>Send to the booker.</div>
                <div className="pr-p" style={{ color: 'var(--ink-soft)' }}>One message, one link. The booker shares it with their party the same way they would share a restaurant reservation. <strong>You do not collect guest phone numbers. You do not chase.</strong></div>
              </div>
            </div>
            <div className="practice-row" style={{ borderColor: 'var(--line-soft)' }}>
              <div className="pr-meta" style={{ color: 'var(--rust)' }}>Automatic</div>
              <div>
                <div className="pr-h" style={{ color: 'var(--ink)' }}>Watch the manifest fill.</div>
                <div className="pr-p" style={{ color: 'var(--ink-soft)' }}>As guests tap the link and complete registration, the manifest in your dashboard populates in real time. You see who is signed, who is outstanding, and how close you are to ready-to-board.</div>
              </div>
            </div>
          </div>

          <div className="outcome-bar">
            <span className="ob-tag">Outcome</span>
            <span className="ob-msg">Your 10am charter is <em>already live before 8am.</em></span>
            <span className="ob-meta">Operator Time · &lt; 60 sec</span>
          </div>
        </div>
      </section>

      {/* ═══ PHASE 3 — GUEST FLOW (DARK) ═══ */}
      <section className="principles">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow light">The guest</span>
            <h2 className="section-title">No app. No account. <em>No captain chasing signatures.</em></h2>
            <p className="section-sub">The guest experience was the feature we fought hardest to keep simple. A paying guest on a Saturday morning should not be installing an app to sign a waiver.</p>
          </div>

          <div className="principle-stack">
            <div className="principle-item">
              <div className="p-num" style={{ fontSize: 34 }}>01</div>
              <div>
                <div className="p-title">Tap the link.</div>
                <div className="p-body">The trip link opens in any browser on any phone. No download. No sign-up. No password. The page is localized automatically — the guest sees it in their phone language, not the operator language.</div>
              </div>
            </div>
            <div className="principle-item">
              <div className="p-num" style={{ fontSize: 34 }}>02</div>
              <div>
                <div className="p-title">Identify and verify.</div>
                <div className="p-body">Name, email, phone, date of birth where the law requires it. A one-time code sent to the phone confirms identity — so the signature on the waiver actually belongs to the guest. <strong style={{ color: 'var(--bone)' }}>The data goes to the operator, not to advertisers.</strong></div>
              </div>
            </div>
            <div className="principle-item">
              <div className="p-num" style={{ fontSize: 34 }}>03</div>
              <div>
                <div className="p-title">Read and sign the waiver.</div>
                <div className="p-body">The guest sees the waiver you wrote, in full. They draw or type their signature. The exact text they saw, their signature, the timestamp, their IP, and a cryptographic hash are captured together — the combination that makes an electronic signature hold up under ESIGN and UETA.</div>
              </div>
            </div>
            <div className="principle-item">
              <div className="p-num" style={{ fontSize: 34 }}>04</div>
              <div>
                <div className="p-title">Acknowledge each safety card.</div>
                <div className="p-body">One card at a time. PFD location, fire extinguisher, man-overboard procedure — each with its own tap-to-acknowledge. Each tap is attributed. No blanket &quot;I&apos;ve read the terms&quot; box pretending to be a briefing.</div>
              </div>
            </div>
            <div className="principle-item">
              <div className="p-num" style={{ fontSize: 34 }}>05</div>
              <div>
                <div className="p-title">Done — <em>confirmation sent.</em></div>
                <div className="p-body">The guest gets a clean confirmation with their trip details and a copy of what they signed. The operator manifest updates. The captain snapshot updates. Nobody had to type anything twice.</div>
              </div>
            </div>
          </div>

          <div className="outcome-bar outcome-bar-dark">
            <span className="ob-tag">Outcome</span>
            <span className="ob-msg">Every guest is <em>verified, signed, and briefed</em> — before they arrive.</span>
            <span className="ob-meta">Guest Time · ~3 min</span>
          </div>
        </div>
      </section>

      {/* ═══ PHASE 4 — CAPTAIN SNAPSHOT ═══ */}
      <section className="practice-section">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow light">The captain</span>
            <h2 className="section-title">The cleanest pre-departure view <em>of your life.</em></h2>
            <p className="section-sub">The captain arrives at the slip. Opens one link on a phone — no login, because captains should not be typing passwords on a pier with salt spray on the screen. What they see is the cleanest go/no-go sheet they have ever had.</p>
          </div>

          <div className="practice-stack">
            <div className="practice-row">
              <div className="pr-meta">Manifest</div>
              <div>
                <div className="pr-h">Every guest registered for this trip, with status flags at a glance.</div>
                <div className="pr-p">Who is signed. Who is outstanding. Who registered at 2am, whose signature came in during the drive over. Every acknowledgment is a tap away from its full record.</div>
              </div>
            </div>
            <div className="practice-row">
              <div className="pr-meta">Waivers</div>
              <div>
                <div className="pr-h">Green if signed and verified. Red if missing.</div>
                <div className="pr-p">One tap opens the signed document. The captain can see the full text the guest saw, the signature, and the hash — right on the phone at the dock.</div>
              </div>
            </div>
            <div className="practice-row">
              <div className="pr-meta">Safety cards</div>
              <div>
                <div className="pr-h">Per-guest acknowledgment status — visible at a glance.</div>
                <div className="pr-p">A missing card is visible immediately. The captain sees which guest has not acknowledged which item, with a one-tap path to that guest record.</div>
              </div>
            </div>
            <div className="practice-row">
              <div className="pr-meta">Start control</div>
              <div>
                <div className="pr-h">A slide-to-start gate. Intentional, attestable, hard to trigger by accident.</div>
                <div className="pr-p"><strong>The software does not auto-start. The software does not clear a missing waiver. The captain directs. Boatcheckin records.</strong> That single action is the attested departure — timestamped, cryptographically recorded, and sealed as the trip starting state.</div>
              </div>
            </div>
          </div>

          <div className="outcome-bar outcome-bar-dark">
            <span className="ob-tag">Outcome</span>
            <span className="ob-msg">The captain&apos;s go/no-go is based on <em>what is actually true</em> at this moment.</span>
            <span className="ob-meta">Captain Time · &lt; 60 sec</span>
          </div>
        </div>
      </section>

      {/* ═══ THE SEALED RECORD ═══ */}
      <section className="not-block" style={{ padding: '96px 0' }}>
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">What you walk away with</span>
            <h2 className="section-title">A sealed record —<br /><em>intact, attributable, available.</em></h2>
            <p className="section-sub">The point of the whole flow is the record the flow produces. Two years from now, when an insurer asks, when a regulator audits, when a lawyer writes a letter — this is what is there to answer.</p>
          </div>

          <div className="flow-grid">
            <div className="flow-cell">
              <span className="fc-num" style={{ fontSize: 36 }}>01</span>
              <span className="fc-label">Hashed at signing</span>
              <div className="fc-title">SHA-256 — any modification is detectable.</div>
              <div className="fc-body">At the moment of signing, the waiver text, signature, timestamp, IP, and user agent are combined and hashed. Any subsequent modification produces a different digest.</div>
            </div>
            <div className="flow-cell">
              <span className="fc-num" style={{ fontSize: 36 }}>02</span>
              <span className="fc-label">Attributable</span>
              <div className="fc-title">Every action has an actor.</div>
              <div className="fc-body">Creation, signing, acknowledgment, captain start, trip completion — each produces an audit entry with who, when, and how. Not a log file. A record.</div>
            </div>
            <div className="flow-cell">
              <span className="fc-num" style={{ fontSize: 36 }}>03</span>
              <span className="fc-label">Sealed at completion</span>
              <div className="fc-title">Trip is locked after the fact.</div>
              <div className="fc-body">When the captain marks the trip complete, the audit trail is sealed. No row can be silently altered. Corrections require a new, attributed entry.</div>
            </div>
            <div className="flow-cell">
              <span className="fc-num" style={{ fontSize: 36 }}>04</span>
              <span className="fc-label">Retained</span>
              <div className="fc-title">5 years minimum. Exportable always.</div>
              <div className="fc-body">Default retention is five years. Every trip record exports as a complete PDF — waivers, acknowledgments, manifest, audit trail. One attachment for your insurer or attorney.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TIME MATH ═══ */}
      <section className="timeline-section">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow brass">The time you get back</span>
            <h2 className="section-title">Same trip. <em>A lot less of your Saturday.</em></h2>
            <p className="section-sub">We ran the numbers with working charter captains — not on a spreadsheet, at actual docks. Here is what a typical six-guest half-day trip looks like before and after Boatcheckin.</p>
          </div>

          <div className="tl-grid">
            <div className="tl-item">
              <div className="tl-label">Chasing waivers by text</div>
              <div className="tl-target">15–30 <span className="unit">min before</span></div>
              <div className="tl-desc">Now: 0. Booker shares the link once.</div>
            </div>
            <div className="tl-item">
              <div className="tl-label">Safety briefing at dock</div>
              <div className="tl-target">10–15 <span className="unit">min before</span></div>
              <div className="tl-desc">Now: 2 min reinforcement. Guests pre-briefed.</div>
            </div>
            <div className="tl-item">
              <div className="tl-label">Assembling the manifest</div>
              <div className="tl-target">5–10 <span className="unit">min before</span></div>
              <div className="tl-desc">Now: 0. Auto-populated as guests register.</div>
            </div>
            <div className="tl-item">
              <div className="tl-label">Filing after the trip</div>
              <div className="tl-target">10 <span className="unit">min before</span></div>
              <div className="tl-desc">Now: 0. Already sealed and stored automatically.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ WHO SEES WHAT ═══ */}
      <section className="not-block" style={{ padding: '96px 0' }}>
        <div className="container">
          <div className="section-header">
            <span className="eyebrow brass">Three perspectives, one record</span>
            <h2 className="section-title">Who sees what — <em>at a glance.</em></h2>
            <p className="section-sub">The operator, the captain, and the guest each see the slice of Boatcheckin that matches their role. Access is enforced at the database tier, not just the UI.</p>
          </div>

          <div className="not-grid">
            <div className="not-list">
              <div className="not-row">
                <div className="not-x" style={{ color: 'var(--status-ok)' }}>✓</div>
                <div>
                  <div className="not-title">Operator</div>
                  <div className="not-body">Full dashboard — fleet, trips, exports, settings. Creates trips, generates links, configures waivers and safety briefings. Exports any trip record as PDF.</div>
                </div>
              </div>
              <div className="not-row">
                <div className="not-x" style={{ color: 'var(--sea)' }}>✓</div>
                <div>
                  <div className="not-title">Captain</div>
                  <div className="not-body">Trip snapshot only — current trip, manifest, waiver status, safety card acknowledgments, emergency contacts, and the slide-to-start control. No password needed at the dock.</div>
                </div>
              </div>
            </div>
            <div className="not-list">
              <div className="not-row">
                <div className="not-x" style={{ color: 'var(--brass-deep)' }}>~</div>
                <div>
                  <div className="not-title">Guest</div>
                  <div className="not-body">Their own registration only — their identity, their waiver, their safety acknowledgments. They get a confirmation copy. They cannot see other guests records or the operator dashboard.</div>
                </div>
              </div>
              <div className="not-row">
                <div className="not-x">✕</div>
                <div>
                  <div className="not-title">No app required — for anyone.</div>
                  <div className="not-body">All three roles work entirely in the browser. No download, no account required for guests or captains. Operators sign in once; after that the dashboard is always ready.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="final-cta">
        <div className="container">
          <div className="fca-grid">
            <div>
              <h2 className="fca-h">Set up takes <em>fifteen minutes.</em><br />Your next trip is <em>live tomorrow.</em></h2>
              <p className="fca-sub">Free tier for solo captains. Get started, configure your boat, run a test trip. If it does not earn its place by the end of the week, close the account — nothing is billed on the free tier.</p>
            </div>
            <div className="fca-stack">
              <Link href="/signup" className="btn">Start Free · 10-min Setup →</Link>
              <Link href="/contact" className="btn btn-outline">Talk to Us First</Link>
              <Link href="/about" className="btn btn-outline">About Boatcheckin</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
