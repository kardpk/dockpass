import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'How it Works — Boatcheckin',
  description: 'From booking confirmation to cleared to board. Walk through exactly how Boatcheckin fits into a charter operator\'s day — setup, per-trip flow, guest experience, captain snapshot, and the sealed record at the end.',
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
          <div className="hero-inner">
            <div>
              <span className="eyebrow">How it works</span>
              <h1>Between booking<br />and boarding,<br /><em>one link does the work.</em></h1>
              <p className="lede">
                Boatcheckin fills the hours nobody owns the gap between a booking confirmation and the moment a captain is ready to slip lines. This page walks you through the whole flow. <strong>Setup takes about fifteen minutes. Per-trip operator time is under a minute.</strong>
              </p>
            </div>
            <div className="hero-meta">
              <div><strong>Reading time</strong> · ~6 minutes</div>
              <div><strong>Setup time</strong> · ~15 minutes</div>
              <div><strong>Per trip</strong> · &lt; 60 seconds of oversight</div>
              <div><strong>Guest download</strong> · none required</div>
              <div><strong>Works on</strong> · any phone, any language</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ THE GAP ═══ */}
      <section className="block-tight" style={{ paddingTop: 24 }}>
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">The space we sit in</span>
            <h2 className="section-title">The booking platform hands off.<br />The captain picks up at the dock.<br /><em>Everything in between was chaos.</em></h2>
           <p className="section-sub">Before Boatcheckin, those hours lived in text messages, scribbled lists, paper waivers in a clipboard, and the captain asking &quot;which one of you is Karen?&quot; at the slip. We built Boatcheckin for that exact gap and nothing else.</p>
          </div>

          <div className="gap-viz">
            <div className="gap-row">
              <span className="label before">Before</span>
              <div className="gap-track">
                <div className="gap-anchor">Booking confirmed</div>
                <div className="gap-middle chaos">Texts · paper waivers · scrambling</div>
                <div className="gap-anchor">At the dock</div>
              </div>
            </div>
            <div className="gap-row">
              <span className="label after">With us</span>
              <div className="gap-track">
                <div className="gap-anchor">Booking confirmed</div>
                <div className="gap-middle filled">One link → every guest cleared</div>
                <div className="gap-anchor">At the dock</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ AT-A-GLANCE TIMELINE ═══ */}
      <section className="block-tight">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow brass">The whole flow in 30 seconds</span>
            <h2 className="section-title">Five steps. <em>Most of them run on their own.</em></h2>
            <p className="section-sub">The rest of this page is just a closer look at each step. If you only read the strip below, you understand most of the product.</p>
          </div>

          <div className="timeline-strip">
            <div className="ts-step">
              <div className="ts-num">Step 01</div>
              <div className="ts-meta">One-time · ~15 min</div>
              <div className="ts-lbl">Set up your <em>boat</em></div>
             <div className="ts-desc">Boat Wizard, your waiver, your safety briefing configured once.</div>
            </div>
            <div className="ts-step">
              <div className="ts-num">Step 02</div>
              <div className="ts-meta">Per trip · ~30 sec</div>
              <div className="ts-lbl">Create the <em>trip</em></div>
              <div className="ts-desc">A few fields: date, vessel, expected guests. One link is generated.</div>
            </div>
            <div className="ts-step">
              <div className="ts-num">Step 03</div>
              <div className="ts-meta">Per guest · ~2 min</div>
              <div className="ts-lbl">Guests <em>self-register</em></div>
              <div className="ts-desc">No app, no account. Tap the link, fill in, sign, acknowledge safety.</div>
            </div>
            <div className="ts-step">
              <div className="ts-num">Step 04</div>
              <div className="ts-meta">At the dock · &lt; 1 min</div>
              <div className="ts-lbl">Captain <em>reviews</em></div>
              <div className="ts-desc">One snapshot view. Green checkmarks. Slide to start.</div>
            </div>
            <div className="ts-step">
              <div className="ts-num">Step 05</div>
              <div className="ts-meta">Automatic · forever</div>
              <div className="ts-lbl">Record is <em>sealed</em></div>
              <div className="ts-desc">Cryptographically hashed. Retained. Available when asked.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PHASE 1 — SETUP ═══ */}
      <section className="block">
        <div className="container">
          <div className="phase-header">
            <div className="phase-tag">Part 01 <span>Setup</span></div>
            <div>
              <h2 className="phase-title">Fifteen minutes, <em>and you never do it again.</em></h2>
             <p className="phase-sub">Setup is front-loaded on purpose. You configure Boatcheckin once your vessel details, the waiver language your operation uses, the safety briefing you already give and every future trip just pulls from those defaults. No reconfiguration per booking. No rebuilding the checklist every season.</p>
            </div>
          </div>

          <div className="v-timeline">
            <div className="v-step active">
              <div className="v-step-num">01</div>
              <div className="v-step-meta">Takes ~4 minutes</div>
             <div className="v-step-title">Boat Wizard <em>add your vessel.</em></div>
              <div className="v-step-body">A short guided flow captures what regulators and insurers will eventually want to see: vessel name and registration, hailing port, documented length, passenger capacity, propulsion, and operating area. For multi-vessel fleets, you add each boat once; trips reference them by name.</div>
              <div className="v-step-body">If you already have your vessel documents handy, you can upload them for your own records. They live in your account, not on anyone else&apos;s server.</div>
            </div>

            <div className="v-step active">
              <div className="v-step-num">02</div>
              <div className="v-step-meta">Takes ~4 minutes</div>
             <div className="v-step-title">Waiver <em>yours, word for word.</em></div>
             <div className="v-step-body">Paste in the waiver text your operation already uses the one your insurer reviewed, the one your attorney blessed. That&apos;s the waiver every guest will sign. <strong>We don&apos;t rewrite it. We don&apos;t interpret it. We capture it precisely.</strong></div>
             <div className="v-step-body">Don&apos;t have one yet? A starter template is available as scaffolding, clearly marked as a starting point not legal advice and not a substitute for your own review.</div>
            </div>

            <div className="v-step active">
              <div className="v-step-num">03</div>
              <div className="v-step-meta">Takes ~4 minutes</div>
             <div className="v-step-title">Safety briefing <em>one card per item.</em></div>
             <div className="v-step-body">Your pre-departure safety briefing PFD location, fire extinguisher, man-overboard procedure, emergency contacts, whatever you cover goes in as a series of short cards. Guests see each card individually and acknowledge it with a tap.</div>
              <div className="v-step-body">This isn&apos;t theater. It&apos;s the structural alignment with <strong>46 CFR §185.506</strong> and equivalent state rules: each guest sees each item, and each acknowledgment is recorded with timestamp and attribution.</div>
            </div>

            <div className="v-step active">
              <div className="v-step-num">04</div>
              <div className="v-step-meta">Takes ~3 minutes</div>
             <div className="v-step-title">Compliance &amp; retention <em>set once, forget it.</em></div>
              <div className="v-step-body">Set your operating jurisdiction, your retention window (compliance records default to a five-year minimum), electronic-signature consent language, and whether to route after-trip exports somewhere automatically.</div>
              <div className="v-step-body">The defaults are conservative. Most operators never touch these settings again.</div>
            </div>
          </div>

          <div className="outcome-bar">
            <div className="outcome-tag">Outcome</div>
            <div className="outcome-text">Your account is ready. <em>The next trip you create is live in thirty seconds.</em></div>
            <div className="outcome-meta">SETUP COMPLETE · ~15 MIN</div>
          </div>
        </div>
      </section>

      {/* ═══ PHASE 2 — PER TRIP ═══ */}
      <section className="block" style={{ background: 'var(--bone-warm)', borderTop: '1.5px solid var(--ink)', borderBottom: '1.5px solid var(--ink)' }}>
        <div className="container">
          <div className="phase-header">
            <div className="phase-tag">Part 02 <span>Every trip</span></div>
            <div>
              <h2 className="phase-title">Create the trip. <em>Send the link. That&apos;s it.</em></h2>
             <p className="phase-sub">Every trip starts the same way a few fields, one generated link, one message sent to the booker. The rest happens on its own while you do something else.</p>
            </div>
          </div>

          <div className="v-timeline">
            <div className="v-step active">
              <div className="v-step-num">01</div>
              <div className="v-step-meta">~20 seconds</div>
             <div className="v-step-title">Create <em>or auto-create.</em></div>
              <div className="v-step-body">Enter the trip date, select the vessel, set the expected guest count, and pick the captain. Optional fields for the booker&apos;s contact, departure point, and any trip-specific notes.</div>
             <div className="v-step-body">If your booking platform sends a confirmation email to a shared inbox, Boatcheckin can watch that inbox and create the trip for you so the link is waiting before you even read the confirmation.</div>
            </div>

            <div className="v-step active">
              <div className="v-step-num">02</div>
              <div className="v-step-meta">Instant</div>
              <div className="v-step-title">The trip link is <em>generated.</em></div>
             <div className="v-step-body">One cryptographically signed URL unique to this trip, scoped to this trip, and configured for the number of guests expected. The link carries the waiver, the safety cards, and the questions your compliance settings require.</div>
            </div>

            <div className="v-step active">
              <div className="v-step-num">03</div>
              <div className="v-step-meta">~10 seconds</div>
              <div className="v-step-title">Send to the booker.</div>
             <div className="v-step-body">One message, one link. The booker shares it with the rest of the party themselves the way they&apos;d share a restaurant reservation link. <strong>You do not collect guest phone numbers. You do not chase.</strong></div>
            </div>

            <div className="v-step active">
              <div className="v-step-num">04</div>
              <div className="v-step-meta">Happens on its own</div>
              <div className="v-step-title">Watch the manifest fill.</div>
              <div className="v-step-body">As guests tap the link and complete registration, the manifest in your dashboard populates in real time. You see who&apos;s signed, who&apos;s outstanding, and how close you are to ready-to-board. If the count is short at an hour before departure, we flag it. If everyone&apos;s cleared early, we say so.</div>
            </div>
          </div>

          <div className="outcome-bar">
            <div className="outcome-tag">Outcome</div>
            <div className="outcome-text">Your 10am charter is <em>already live before 8am.</em></div>
            <div className="outcome-meta">OPERATOR TIME · &lt; 60 SEC</div>
          </div>
        </div>
      </section>

      {/* ═══ PHASE 3 — GUEST FLOW (DARK) ═══ */}
      <section className="block dark">
        <div className="container">
          <div className="phase-header" style={{ borderBottomColor: 'rgba(244,239,230,0.25)' }}>
            <div className="phase-tag" style={{ color: 'var(--brass)' }}><span style={{ color: 'var(--bone)' }}>The guest</span>Part 03</div>
            <div>
              <h2 className="phase-title" style={{ color: 'var(--bone)' }}>No app. No account. <em>No captain chasing signatures.</em></h2>
             <p className="phase-sub" style={{ color: 'rgba(244,239,230,0.78)', maxWidth: 680 }}>The guest experience was the feature we fought hardest to keep simple. Every instinct in SaaS is to ask the user to sign up, download something, or remember a password. We did none of that because a paying guest on a Saturday morning should not be installing an app to sign a waiver.</p>
            </div>
          </div>

          <div className="v-timeline">
            <div className="v-step active">
              <div className="v-step-num">01</div>
              <div className="v-step-meta">Any phone · any language</div>
              <div className="v-step-title">Tap the link.</div>
             <div className="v-step-body">The trip link opens in any browser on any phone. No download. No sign-up. No password. The page is localized automatically the guest sees it in the language their phone is set to, not the language the operator speaks.</div>
            </div>

            <div className="v-step active">
              <div className="v-step-num">02</div>
              <div className="v-step-meta">~60 seconds</div>
              <div className="v-step-title">Identify &amp; verify.</div>
             <div className="v-step-body">Name, email, phone, date of birth where the law requires it. A one-time code is sent to the phone or email to confirm identity so the signature on the waiver actually belongs to the guest. <strong>The data goes to the operator, not to advertisers.</strong></div>
            </div>

            <div className="v-step active">
              <div className="v-step-num">03</div>
              <div className="v-step-meta">~60 seconds</div>
              <div className="v-step-title">Read &amp; sign the waiver.</div>
             <div className="v-step-body">The guest sees the waiver you wrote, in full, without dark patterns. They draw or type their signature. The exact text they saw, their signature, the timestamp, their IP, and a cryptographic hash are captured together the combination that makes an electronic signature hold up under ESIGN and UETA.</div>
            </div>

            <div className="v-step active">
              <div className="v-step-num">04</div>
              <div className="v-step-meta">~30 seconds</div>
              <div className="v-step-title">Acknowledge each safety card.</div>
             <div className="v-step-body">One card at a time. The guest sees your PFD location card, your fire-extinguisher card, your man-overboard procedure card, and whatever else you configured each with its own tap-to-acknowledge. Each tap is attributed. No &quot;I&apos;ve read the terms&quot; blanket box pretending to be a briefing.</div>
            </div>

            <div className="v-step active">
              <div className="v-step-num">05</div>
              <div className="v-step-meta">Instant</div>
             <div className="v-step-title">Done <em>confirmation sent.</em></div>
              <div className="v-step-body">The guest gets a clean confirmation with their trip details and a copy of what they signed. The operator&apos;s manifest updates. The captain&apos;s snapshot updates. Nobody had to type anything twice.</div>
            </div>
          </div>

          <div className="outcome-bar">
            <div className="outcome-tag">Outcome</div>
           <div className="outcome-text">Every guest is <em>verified, signed, and briefed</em> before they arrive.</div>
            <div className="outcome-meta">GUEST TIME · ~3 MIN TOTAL</div>
          </div>
        </div>
      </section>

      {/* ═══ PHASE 4 — CAPTAIN SNAPSHOT (DARK) ═══ */}
      <section className="block dark" style={{ background: 'var(--sea-deep)' }}>
        <div className="container">
          <div className="phase-header" style={{ borderBottomColor: 'rgba(244,239,230,0.25)' }}>
            <div className="phase-tag" style={{ color: 'var(--brass)' }}><span style={{ color: 'var(--bone)' }}>The captain</span>Part 04</div>
            <div>
              <h2 className="phase-title" style={{ color: 'var(--bone)' }}>The cleanest pre-departure view <em>of your life.</em></h2>
             <p className="phase-sub" style={{ color: 'rgba(244,239,230,0.78)', maxWidth: 680 }}>This is the moment everything else was for. The captain arrives at the slip. Opens one link on a phone no login, because captains shouldn&apos;t be typing passwords on a pier with salt spray on the screen. What they see is the cleanest go/no-go sheet they&apos;ve ever had.</p>
            </div>
          </div>

          <div className="captain-grid">
            <div className="captain-copy">
              <p><strong>One URL, one glance, one decision.</strong> The captain snapshot is not a login, not an app, not a dashboard. It&apos;s a purpose-built view designed for a captain holding a phone at the dock with marginal signal and twelve other things to think about.</p>
             <p>The snapshot shows the manifest as it stands right now who&apos;s signed, who hasn&apos;t, who registered at 2am, whose signature came in during the drive over. Every acknowledgment is a tap away from its full record. Every guest&apos;s emergency contact is one tap from being called.</p>
             <p><strong>When the record is clean, the captain slides to start.</strong> That single action is the attested departure timestamped, cryptographically recorded, and sealed as the trip&apos;s starting state. The software doesn&apos;t auto-start. The software doesn&apos;t clear a missing waiver. <strong>The captain directs. Boatcheckin records.</strong></p>

              <ul className="captain-features">
                <li><strong>Manifest</strong><span>Every guest registered for this trip, with status flags at a glance.</span></li>
                <li><strong>Waivers</strong><span>Green if signed and verified. Red if missing. One tap opens the signed document.</span></li>
                <li><strong>Safety cards</strong><span>Per-guest acknowledgment status. A missing card is visible immediately.</span></li>
                <li><strong>Emergency</strong><span>Every guest&apos;s emergency contact, one tap to dial. Plus USCG Ch. 16 and FWC hotline, always present.</span></li>
               <li><strong>Start control</strong><span>A slide-to-start gate intentional, attestable, hard to trigger by accident.</span></li>
              </ul>
            </div>

            <div>
              <div className="phone-frame">
                <div className="phone-notch" />
                <div className="phone-screen">
                  <div className="phone-header">
                    <div className="ph-eyebrow">Captain&apos;s snapshot</div>
                    <div className="ph-title">Saturday · Hot Flash</div>
                    <div className="ph-meta">08:42 · Dep 09:30 · Slip B-14</div>
                  </div>
                  <div className="ph-status-strip">
                    <div className="ph-status ok"><div className="ph-status-num">6</div><div className="ph-status-lbl">Registered</div></div>
                    <div className="ph-status ok"><div className="ph-status-num">6</div><div className="ph-status-lbl">Waivers</div></div>
                    <div className="ph-status ok"><div className="ph-status-num">6</div><div className="ph-status-lbl">Safety</div></div>
                  </div>
                  <div className="ph-list">
                    <div className="ph-item"><div className="ph-check ok">✓</div><div><div className="ph-name">Karen Doe</div><div className="ph-sub">Signed 07:12 · Verified</div></div><div className="ph-badge">Booker</div></div>
                    <div className="ph-item"><div className="ph-check ok">✓</div><div><div className="ph-name">James Smith</div><div className="ph-sub">Signed 07:31 · Verified</div></div><div /></div>
                    <div className="ph-item"><div className="ph-check ok">✓</div><div><div className="ph-name">María Alonso</div><div className="ph-sub">Signed 08:09 · Verified</div></div><div /></div>
                    <div className="ph-item"><div className="ph-check ok">✓</div><div><div className="ph-name">Tomás Alonso</div><div className="ph-sub">Signed 08:09 · Guardian signed</div></div><div className="ph-badge">Minor</div></div>
                    <div className="ph-item"><div className="ph-check ok">✓</div><div><div className="ph-name">Ben Chen</div><div className="ph-sub">Signed 08:22 · Verified</div></div><div /></div>
                    <div className="ph-item"><div className="ph-check ok">✓</div><div><div className="ph-name">Priya Rao</div><div className="ph-sub">Signed 08:34 · Verified</div></div><div /></div>
                  </div>
                  <div className="ph-cta">Slide to start trip</div>
                </div>
              </div>
            </div>
          </div>

          <div className="outcome-bar" style={{ marginTop: 64 }}>
            <div className="outcome-tag">Outcome</div>
            <div className="outcome-text">The captain&apos;s go/no-go decision is based on <em>what&apos;s actually true</em> at this moment.</div>
            <div className="outcome-meta">CAPTAIN TIME · &lt; 60 SEC</div>
          </div>
        </div>
      </section>

      {/* ═══ THE SEALED RECORD ═══ */}
      <section className="block">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">What you walk away with</span>
           <h2 className="section-title">A sealed record<br /><em>intact, attributable, available.</em></h2>
           <p className="section-sub">The point of the whole flow isn&apos;t the flow. It&apos;s the record the flow produces. Two years from now, when an insurer asks, when a regulator audits, when a passenger&apos;s lawyer writes a letter this is what&apos;s there to answer.</p>
          </div>

          <div className="seal-grid">
            <div className="seal-cell">
              <span className="seal-num">01 · Signed at signing</span>
              <div className="seal-title">Hashed with <span style={{ fontFamily: 'var(--mono)', fontSize: 15, color: 'var(--rust)' }}>SHA-256</span></div>
              <div className="seal-body">At the moment of signing, the waiver text, signature, timestamp, IP, and user agent are combined and hashed. <strong>Any subsequent modification is detectable.</strong></div>
            </div>
            <div className="seal-cell">
              <span className="seal-num">02 · Attributable</span>
              <div className="seal-title">Every action has an actor.</div>
             <div className="seal-body">Creation, signing, acknowledgment, captain start, trip completion each produces an audit entry with who, when, and how. Not a log file. A record.</div>
            </div>
            <div className="seal-cell">
              <span className="seal-num">03 · Sealed at completion</span>
              <div className="seal-title">Trip is locked.</div>
              <div className="seal-body">When the captain marks the trip complete, the audit trail is sealed. No row can be silently altered after the fact. Corrections require a new, attributed entry.</div>
            </div>
            <div className="seal-cell">
              <span className="seal-num">04 · Retained</span>
              <div className="seal-title">5 years minimum.</div>
             <div className="seal-body">Default retention is five years longer where your jurisdiction or your settings require. You control extension; we never shorten below your minimum.</div>
            </div>
            <div className="seal-cell">
              <span className="seal-num">05 · Exportable</span>
              <div className="seal-title">Yours, any time.</div>
             <div className="seal-body">Every trip record can be exported as a complete PDF package waivers, acknowledgments, manifest, audit trail. Send it to your insurer, your lawyer, or a regulator in one attachment.</div>
            </div>
            <div className="seal-cell">
              <span className="seal-num">06 · Searchable</span>
              <div className="seal-title">Find a trip in seconds.</div>
             <div className="seal-body">By date, vessel, captain, guest name, or booking reference. The record you need is never &quot;somewhere in the filing cabinet&quot; it&apos;s one field away.</div>
            </div>
            <div className="seal-cell">
              <span className="seal-num">07 · Encrypted</span>
              <div className="seal-title">At rest and in transit.</div>
              <div className="seal-body">TLS 1.3 over the wire, AES-256-class encryption at rest, row-level isolation at the database tier. Described in full on our <Link href="/security" style={{ color: 'var(--rust)', borderBottom: '1px dashed var(--rust)' }}>Security page</Link>.</div>
            </div>
            <div className="seal-cell">
              <span className="seal-num">08 · Private</span>
              <div className="seal-title">Yours alone.</div>
              <div className="seal-body">Guest data is not sold, not shared with advertisers, not used to train general models. The record belongs to you and, where the law requires, to the guest who created it.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ WHO SEES WHAT ═══ */}
      <section className="block" style={{ background: 'var(--bone-warm)', borderTop: '1.5px solid var(--ink)' }}>
        <div className="container">
          <div className="section-header">
            <span className="eyebrow brass">Three perspectives, one record</span>
           <h2 className="section-title">Who sees what<br /><em>at a glance.</em></h2>
            <p className="section-sub">The operator, the captain, and the guest each see the slice of Boatcheckin that matches their role. Nothing more. Access is enforced at the database tier, not just the UI.</p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="who-table">
              <thead>
                <tr>
                  <th style={{ width: '28%' }}>&nbsp;</th>
                  <th>Operator</th>
                  <th>Captain</th>
                  <th>Guest</th>
                </tr>
              </thead>
              <tbody>
               <tr><td>Full dashboard</td><td><span className="tick">✓</span>Fleet, trips, exports, settings</td><td><span className="tick no"> </span><em>Not applicable</em></td><td><span className="tick no"> </span><em>Not applicable</em></td></tr>
               <tr><td>Trip creation</td><td><span className="tick">✓</span>Creates trip, generates link</td><td><span className="tick no"> </span><em>Captain is assigned</em></td><td><span className="tick no"> </span><em>Guest joins by link</em></td></tr>
                <tr><td>Trip snapshot</td><td><span className="tick">✓</span>Full read/write</td><td><span className="tick">✓</span>Read + start/complete</td><td><span className="tick dim">~</span>Own registration only</td></tr>
                <tr><td>Waivers</td><td><span className="tick">✓</span>All signed waivers archived</td><td><span className="tick">✓</span>Current trip only</td><td><span className="tick dim">~</span>Only their own</td></tr>
                <tr><td>Safety briefing</td><td><span className="tick">✓</span>Configures cards</td><td><span className="tick">✓</span>Sees acknowledgment status</td><td><span className="tick dim">~</span>Sees &amp; acknowledges</td></tr>
                <tr><td>Guest PII</td><td><span className="tick">✓</span>For their own trips</td><td><span className="tick dim">~</span>Current trip · limited</td><td><span className="tick dim">~</span>Only their own</td></tr>
                <tr><td>Emergency contacts</td><td><span className="tick">✓</span>All, for their trips</td><td><span className="tick">✓</span>Current trip, one-tap dial</td><td><span className="tick dim">~</span>Adds their own</td></tr>
               <tr><td>Record export</td><td><span className="tick">✓</span>Any trip, any format</td><td><span className="tick no"> </span><em>Read-only at sea</em></td><td><span className="tick dim">~</span>Own record on request</td></tr>
               <tr><td>Audit trail</td><td><span className="tick">✓</span>Full visibility</td><td><span className="tick dim">~</span>Current trip</td><td><span className="tick no"> </span><em>Internal only</em></td></tr>
               <tr><td>Needs to install app</td><td><span className="tick no"> </span><em>Web only</em></td><td><span className="tick no"> </span><em>Web only</em></td><td><span className="tick no"> </span><em>Web only</em></td></tr>
              </tbody>
            </table>
          </div>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginTop: 16, textAlign: 'right' }}>
            ✓ full · ~ scoped · not applicable
          </p>
        </div>
      </section>

      {/* ═══ TIME MATH ═══ */}
      <section className="block dark">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow light">The time you get back</span>
            <h2 className="section-title">Same trip. <em>A lot less of your Saturday.</em></h2>
           <p className="section-sub">We ran the math with working charter captains not on a spreadsheet, at actual docks. Here&apos;s what a typical six-guest half-day trip looks like, before and after Boatcheckin.</p>
          </div>

          <div className="time-wrap">
            <table className="time-table">
              <thead>
                <tr>
                  <th style={{ width: '38%' }}>Task</th>
                  <th style={{ width: '31%' }}>Before</th>
                  <th style={{ width: '31%' }}>With Boatcheckin</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Chasing waivers by text/email</td><td><span className="before-tag">15–30 min</span>Per trip, often morning-of</td><td><span className="after-tag">0 min</span>Booker shares link once</td></tr>
                <tr><td>Collecting safety-card info</td><td><span className="before-tag">10 min</span>Asking each guest at dock</td><td><span className="after-tag">0 min</span>Done before arrival</td></tr>
                <tr><td>Assembling the manifest</td><td><span className="before-tag">5–10 min</span>Paper list, crossing names out</td><td><span className="after-tag">0 min</span>Auto-populated</td></tr>
                <tr><td>Safety briefing at dock</td><td><span className="before-tag">10–15 min</span>Repeated every trip</td><td><span className="after-tag">2 min</span>Reinforce key items only</td></tr>
                <tr><td>Signature verification</td><td><span className="before-tag">~5 min</span>Manual scan for initials</td><td><span className="after-tag">Instant</span>Green = verified</td></tr>
                <tr><td>Filing after the trip</td><td><span className="before-tag">10 min</span>Scanning + labeling</td><td><span className="after-tag">0 min</span>Already sealed &amp; stored</td></tr>
                <tr className="total"><td>Total per trip</td><td><span className="before-tag">55–80 min</span>Of captain / operator time</td><td><span className="after-tag">~2 min</span>Of pre-departure oversight</td></tr>
              </tbody>
            </table>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginTop: 48 }}>
            <div style={{ padding: '28px 0', borderTop: '2px solid var(--brass)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--brass)', marginBottom: 10, fontWeight: 600 }}>Per week</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 38, fontWeight: 600, color: 'var(--bone)', lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 6 }}>~6 hours</div>
              <div style={{ fontSize: 13, color: 'rgba(244,239,230,0.65)', lineHeight: 1.5 }}>Assumed: six trips per week. Time back to the operator.</div>
            </div>
            <div style={{ padding: '28px 0', borderTop: '2px solid var(--brass)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--brass)', marginBottom: 10, fontWeight: 600 }}>Per season</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 38, fontWeight: 600, color: 'var(--bone)', lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 6 }}>~150 hours</div>
              <div style={{ fontSize: 13, color: 'rgba(244,239,230,0.65)', lineHeight: 1.5 }}>Assumed: 25-week operating season. That&apos;s nearly a full work month.</div>
            </div>
            <div style={{ padding: '28px 0', borderTop: '2px solid var(--brass)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--brass)', marginBottom: 10, fontWeight: 600 }}>The other outcome</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 38, fontWeight: 600, color: 'var(--bone)', lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 6 }}>Peace of mind</div>
              <div style={{ fontSize: 13, color: 'rgba(244,239,230,0.65)', lineHeight: 1.5 }}>The record is the record. Two years from now, it&apos;s still complete.</div>
            </div>
          </div>

          <p style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(244,239,230,0.45)', marginTop: 32, maxWidth: 680, lineHeight: 1.7 }}>
            Estimates based on structured conversations with working charter captains. Your numbers will vary with trip size, fleet complexity, and how tight your current system already is. Most operators see the biggest gains on &quot;chasing waivers&quot; and &quot;filing after the trip.&quot;
          </p>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="final-cta-bone">
        <div className="container">
          <div className="fca-inner">
            <div>
              <span className="eyebrow">Ready when you are</span>
              <h2 className="fca-h">Set up takes <em>fifteen minutes.</em> Your next trip is <em>live tomorrow.</em></h2>
             <p className="fca-sub">Free tier available for solo captains. Get started, configure your boat, run a test trip on yourself. If it doesn&apos;t earn its place by the end of the week, close the account nothing is billed on the free tier.</p>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 16 }}>
                <Link href="/signup" className="btn btn-primary">
                  Start free
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
                </Link>
                <Link href="/contact" className="btn">Talk to us</Link>
              </div>
            </div>
            <div className="fca-stack">
              <Link href="/signup" className="fca-item"><div className="fca-item-num">01</div><div className="fca-item-body"><div className="fca-item-title">Boat Wizard</div><div className="fca-item-sub">Add your vessel · 4 min</div></div></Link>
              <Link href="/signup" className="fca-item"><div className="fca-item-num">02</div><div className="fca-item-body"><div className="fca-item-title">Waiver &amp; safety</div><div className="fca-item-sub">Paste yours in · 8 min</div></div></Link>
              <Link href="/signup" className="fca-item"><div className="fca-item-num">03</div><div className="fca-item-body"><div className="fca-item-title">Run a test trip</div><div className="fca-item-sub">Text yourself the link · 3 min</div></div></Link>
              <Link href="/signup" className="fca-item"><div className="fca-item-num">04</div><div className="fca-item-body"><div className="fca-item-title">Go live</div><div className="fca-item-sub">Tomorrow&apos;s charter · &lt; 60 sec</div></div></Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
