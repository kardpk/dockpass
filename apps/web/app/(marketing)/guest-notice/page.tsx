import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Guest Notice — Boatcheckin',
  description: 'For Guests clicking a trip link. What Boatcheckin is, what happens with your information, your rights, and the essentials — in plain language.',
}

export default function GuestNoticePage() {
  return (
    <>
      <div className="dateline"><div className="container"><div className="dateline-inner"><div><span className="dl-dot">●</span> GUEST NOTICE</div><div>FOR PASSENGERS &amp; PARTICIPANTS</div><div id="todayDate">CAPTAIN'S LOG — TODAY</div></div></div></div>

<section className="doc-hero">
  <div className="container-doc">
    <span className="eyebrow">For Guests</span>
    <h1>What's happening when you <em>click a trip link.</em></h1>
    <p style={{ fontSize: '18px', lineHeight: '1.6', color: 'var(--ink-soft)', maxWidth: '680px' }}>If an operator sent you a link to sign a waiver, acknowledge a safety briefing, or register as a passenger for a charter trip — this page is for you. It's written in plain language. Your operator is still your operator; Boatcheckin is the software handling the paperwork.</p>
    <div className="doc-meta">
      <div className="doc-meta-item"><span className="dm-label">Version</span><span className="dm-value">1.0</span></div>
      <div className="doc-meta-item"><span className="dm-label">Effective date</span><span className="dm-value">April 20, 2026</span></div>
      <div className="doc-meta-item"><span className="dm-label">Your questions</span><span className="dm-value">privacy@boatcheckin.com</span></div>
    </div>
  </div>
</section>

<section className="container-doc">
  <div className="doc-body">

    <aside className="toc-nav">
      <div className="toc-heading">Contents</div>
      <ul>
        <li><a href="#s1">1 · Who we are</a></li>
        <li><a href="#s2">2 · Your operator</a></li>
        <li><a href="#s3">3 · What you're signing</a></li>
        <li><a href="#s4">4 · Electronic records</a></li>
        <li><a href="#s5">5 · What we collect</a></li>
        <li><a href="#s6">6 · Where it goes</a></li>
        <li><a href="#s7">7 · Your choice</a></li>
        <li><a href="#s8">8 · Your rights</a></li>
        <li><a href="#s9">9 · Minors</a></li>
        <li><a href="#s10">10 · Security</a></li>
        <li><a href="#s11">11 · Emergencies</a></li>
        <li><a href="#s12">12 · Contact</a></li>
      </ul>
    </aside>

    <div className="doc-content">

      <h2 id="s1"><span className="sec">§ 1</span>Who Boatcheckin is</h2>
      <p>Boatcheckin is the software your charter operator uses to handle the paperwork that comes with a trip — waivers, safety acknowledgments, passenger lists. The website is operated by <strong>Oakmont Logic LLC</strong>, a company based in the United States, doing business as Boatcheckin.</p>
      <p>You did not sign up for Boatcheckin. Your operator did. We don't market to you, we don't advertise to you, and we don't sell a thing based on the information you provide here. Our job is to make sure the record your operator needs gets captured correctly, once, and that your information is handled carefully along the way.</p>

      <h2 id="s2"><span className="sec">§ 2</span>Your relationship is with your operator</h2>
      <p>The charter company, captain, or rental operator that sent you the trip link — we call them the "<strong>Operator</strong>" — is the one you're doing business with. They chose the waiver text. They run the trip. They decide what safety items to brief you on. They are responsible for the service you're paying for (or, in the case of a complimentary invite, the service you're receiving).</p>
      <p>If something about the trip itself goes wrong — a refund question, a change to the schedule, a complaint about the experience — that's between you and the Operator. Boatcheckin can help you contact them, but we are not a party to your trip.</p>

      <h2 id="s3"><span className="sec">§ 3</span>What you're actually signing</h2>
      <p>When a trip link asks for your signature, what you are signing is the <strong>Operator's</strong> waiver and acknowledgments — text that the Operator chose, in the language the Operator is responsible for. Boatcheckin captures your signature, the exact text you saw when you signed it, and a set of technical details (timestamp, IP address, device type) that prove the signature happened the way it happened.</p>
      <p>We do not author waiver language. We do not attest that any particular waiver is enforceable in any particular court. We record what you signed, precisely, and preserve it against tampering.</p>

      <div className="callout info">
        <div className="callout-tag info">A practical note</div>
        <p>If a waiver says something that surprises you or that you don't understand — ask your Operator before signing. They can explain it, rewrite it, or remove you from the trip. Don't sign something you haven't read.</p>
      </div>

      <h2 id="s4"><span className="sec">§ 4</span>Consent to electronic records and signatures</h2>
      <p>By using the trip link and completing your registration, you agree that:</p>
      <ul>
        <li><strong>Electronic signatures are valid.</strong> Your signature drawn on the screen, or typed where we accept a typed signature, has the same legal effect as a signature on paper under US federal law (the Electronic Signatures in Global and National Commerce Act, 15 U.S.C. §7001 et seq.) and equivalent state laws including the Uniform Electronic Transactions Act as enacted in Florida (F.S. §668.50).</li>
        <li><strong>Electronic records are valid.</strong> The signed waiver, acknowledgments, and related records will be delivered, stored, and made available to you and the Operator electronically. You can save or print a copy from the trip link, and the Operator can also provide one on request.</li>
        <li><strong>You have the technical means.</strong> You are confirming that your device can display, download, and save PDF and web content — which is how the signed record is made available.</li>
      </ul>
      <p>If you would prefer to sign on paper, you can withdraw from the electronic process at any time and ask the Operator for a paper alternative. The Operator may or may not be able to accommodate that request before departure; that is the Operator's decision, not ours.</p>

      <h2 id="s5"><span className="sec">§ 5</span>What we collect about you</h2>
      <p>Only what's needed to complete the trip record your Operator is running:</p>
      <div style={{ margin: '24px 0' }}>
        <div className="plain-row"><div className="plain-lbl">Identity</div><div className="plain-body">Your name, email, phone number, and — where the law or the trip requires it — date of birth and emergency contact.</div></div>
        <div className="plain-row"><div className="plain-lbl">Trip-specific</div><div className="plain-body">Your answers to safety questions the Operator configured, any Boating Safety Identification Card details, and similar trip-relevant items.</div></div>
        <div className="plain-row"><div className="plain-lbl">Signature &amp; attestations</div><div className="plain-body">Your drawn or typed signature, per-card acknowledgments, and the timestamp, IP address, user agent, and cryptographic hash that go with each.</div></div>
        <div className="plain-row"><div className="plain-lbl">Technical</div><div className="plain-body">Browser type, device type, timezone, and connection information — the minimum needed to deliver the page to you and log that the interaction happened.</div></div>
      </div>
      <p>We do not collect information that is not part of completing your trip registration. We do not ask you for social security numbers, payment details (payment, if any, is handled directly by your Operator or their processor), employment history, or other information unrelated to the trip.</p>

      <h2 id="s6"><span className="sec">§ 6</span>Where your information goes</h2>
      <p>Your information goes to <strong>your Operator</strong>. That is the point of the trip link — the Operator needs the waiver you signed, the acknowledgments you made, and a way to identify who was on the vessel.</p>
      <p>Your information does <strong>not</strong> go to:</p>
      <ul>
        <li>Advertisers, data brokers, or marketing networks.</li>
        <li>A different charter operator.</li>
        <li>Lookalike-audience products or behavioral ad systems.</li>
        <li>Machine learning training datasets outside of the Services.</li>
      </ul>
      <p>We may share your information in narrow cases described in our <a className="inline" href="/privacy">Privacy Policy</a> — principally, with the service providers who help us run Boatcheckin (hosting, email and SMS delivery, error monitoring), in response to legal process, or to protect the safety of users. Those are the only cases.</p>

      <h2 id="s7"><span className="sec">§ 7</span>Your choice — and its consequence</h2>
      <p>Signing a waiver and completing the trip registration is <strong>voluntary</strong>. No one at Boatcheckin, and no one who works for your Operator, can force you to sign anything.</p>
      <p>But your trip may be <strong>conditioned</strong> on signing. Operators commonly require that every passenger on a chartered or rented vessel complete the paperwork before the vessel departs. That is a decision the Operator is entitled to make under the law that applies to their operation. If you decline to sign, you may not be permitted to board.</p>
      <p>If you don't want to sign, the right conversation is with your Operator, before departure. They may be able to offer a paper alternative, a different trip, or a refund — or they may not. Those are their decisions, not Boatcheckin's.</p>

      <h2 id="s8"><span className="sec">§ 8</span>Your rights over your information</h2>
      <p>You have rights over the information about you that we and your Operator hold. The rights available depend on where you live.</p>

      <h3><span className="sec">8.1</span>Rights we extend to everyone</h3>
      <ul>
        <li><strong>Access.</strong> A copy of the information we or your Operator hold about you, related to the trip.</li>
        <li><strong>Correction.</strong> Ask us or your Operator to correct information that is wrong.</li>
        <li><strong>Deletion.</strong> Ask for your information to be deleted — subject to a legal requirement your Operator may have to keep the trip record (see §8.4 below).</li>
      </ul>

      <h3><span className="sec">8.2</span>Rights for California, other US states, and international</h3>
      <p>If you live in California, Colorado, Connecticut, Virginia, Utah, Texas, Oregon, Montana, or another US state with a comprehensive privacy law — or in the European Economic Area, the United Kingdom, or Switzerland — you have additional rights under those laws (opt-out of sale/sharing, objection, data portability, withdrawal of consent, and the right to lodge a complaint with a supervisory authority). We honor these rights in accordance with applicable law; see our <a className="inline" href="/privacy">Privacy Policy</a> for the detail.</p>

      <h3><span className="sec">8.3</span>How to make a request</h3>
      <p>The fastest path is usually to ask your Operator directly, since they control the trip record. You can also email us at <a className="inline" href="mailto:privacy@boatcheckin.com">privacy@boatcheckin.com</a> and we will either respond directly or pass the request to the relevant Operator, as required by law.</p>

      <h3><span className="sec">8.4</span>Why the record may still exist after you ask for deletion</h3>
      <p>Charter operators have legal reasons to keep trip records — federal maritime rules, state charter rules, insurance requirements, and potential litigation — for years after the trip, sometimes for five years or longer. Your Operator may lawfully retain your signed waiver and related records for those purposes even after you ask for deletion of other information. The specific period depends on your Operator's jurisdiction and obligations. This is a feature of the law, not a preference of ours.</p>

      <h2 id="s9"><span className="sec">§ 9</span>Minors</h2>
      <p>Boatcheckin's tools are designed for adults. Where a trip involves a minor Guest — for example, a family charter with children aboard — the information about the minor should be entered and attested by an adult with legal authority over the minor (typically a parent or guardian). The adult is responsible for providing any parental consent that applicable law requires before entering a minor's information.</p>
      <p>If you are under 18 and have provided information through Boatcheckin without a parent or guardian's involvement, ask the adult who is organizing your trip to contact the Operator, or email us at <a className="inline" href="mailto:privacy@boatcheckin.com">privacy@boatcheckin.com</a> and we will address it.</p>

      <h2 id="s10"><span className="sec">§ 10</span>How your information is protected</h2>
      <p>Your signed waiver, acknowledgments, and identity details are protected by the same measures we apply to every record on Boatcheckin — described in detail on our <a className="inline" href="/security">Security page</a>. The essentials: encrypted in transit (TLS 1.3), encrypted at rest, isolated at the database level from other Operators and other trips, and cryptographically hashed so that tampering with a signed record is detectable.</p>
      <p>If a security incident affects your information in a way that the law requires notification, you will be notified in accordance with that law.</p>

      <h2 id="s11"><span className="sec">§ 11</span>Emergencies on the water</h2>

      <div className="emerg-block">
        <h3>Do not use Boatcheckin in an emergency.</h3>
        <p>Boatcheckin is a recordkeeping tool. It is <strong>not</strong> a distress channel, a rescue dispatcher, or a safety monitoring service. If you are on the water and you need help — or if you witness someone else who needs help — contact the responders who can actually come get you.</p>
        <ul className="emerg-list">
          <li><strong>Marine emergency</strong> US Coast Guard · VHF Channel 16 · Digital Selective Calling (DSC) on your radio · 911</li>
          <li><strong>Florida wildlife &amp; waterway</strong> FWC hotline · dial *FWC (*392) from a cell phone</li>
          <li><strong>Medical emergency</strong> 911</li>
          <li><strong>Non-emergency tow</strong> Commercial towing service of your choice (BoatUS, Sea Tow, TowBoatU.S., etc.)</li>
        </ul>
      </div>

      <h2 id="s12"><span className="sec">§ 12</span>How to contact us</h2>
      <p>Questions about this notice, your information, or a request to exercise a right — contact us directly.</p>

      <div className="contact-block">
        <h3>Boatcheckin · Guests</h3>
        <p><strong>Privacy questions</strong><br/><a href="mailto:privacy@boatcheckin.com">privacy@boatcheckin.com</a></p>
        <p style={{ marginTop: '14px' }}><strong>General questions</strong><br/><a href="mailto:hello@boatcheckin.com">hello@boatcheckin.com</a></p>
        <p style={{ marginTop: '14px' }}><strong>Mail</strong><br/>Boatcheckin<br/>7901 4th St N, #8722<br/>St. Petersburg, FL 33702 · United States</p>
        <p style={{ marginTop: '14px' }}><strong>Your Operator</strong><br/>For questions about the trip itself, check the Operator's contact details on your trip link.</p>
      </div>

    </div>
  </div>
</section>
    </>
  )
}
