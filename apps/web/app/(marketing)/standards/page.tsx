import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Our Standard — Boatcheckin',
  description: 'The statutes, rules, and record requirements Boatcheckin is built to support. USCG, FWC, SB 606, 46 CFR §185.506, ESIGN, UETA — descriptive references, not legal advice.',
}

export default function StandardsPage() {
  return (
    <>
      {/*  ═══ DATELINE ═══  */}
<div className="dateline">
  <div className="container">
    <div className="dateline-inner">
      <div><span className="dl-dot">●</span> OUR STANDARD — STATUTORY ALIGNMENT</div>
      <div>BOATCHECKIN · ST. PETERSBURG · FL</div>
      <div id="todayDate">CAPTAIN'S LOG — TODAY</div>
    </div>
  </div>
</div>

{/*  ═══ HERO ═══  */}
<section className="page-hero">
  <div className="container">
    <span className="eyebrow">Our Standard</span>
    <h1>
      The record we keep,<br/>
      and the statutes<br/>
      <em>it answers to.</em>
    </h1>
    <p className="lede">
      Boatcheckin is built around the documentation small-passenger-vessel operators are expected to produce under US federal maritime rules, Florida state charter regulations, and electronic signature law. This page maps each statute we reference to the specific records the software helps you capture, hash, and retain in plain English, with citations to the original text.
    </p>
  </div>
</section>

{/*  ═══ TOC ═══  */}
<div className="toc">
  <div className="container">
    <div className="toc-inner">
      <span className="toc-label">On this page</span>
      <a href="#how-to-read">How to read it</a>
      <a href="#federal">US federal</a>
      <a href="#florida">Florida state</a>
      <a href="#esign">Electronic signature</a>
      <a href="#privacy">Privacy &amp; consent</a>
      <a href="#not-claimed">What we don't claim</a>
      <a href="#version">Review &amp; update</a>
    </div>
  </div>
</div>

{/*  ═══ HOW TO READ ═══  */}
<section className="block" id="how-to-read">
  <div className="container">
    <div className="disclaimer-panel">
      <span className="dp-tag">Read this first</span>
      <div className="dp-title">References are descriptive. Not interpretive. Not legal advice.</div>
      <div className="dp-body">
       <p>The statutes, regulations, and standards on this page are cited because they describe the records a Boatcheckin operator is typically expected to keep not because Boatcheckin attests that any individual operator is compliant with them. <strong>Compliance belongs to the operator.</strong></p>
        <p>Each section below pairs a plain-English summary of what a statute requires with a clear description of how Boatcheckin supports the corresponding recordkeeping. That mapping is not an opinion on how the statute applies to your operation. For that, consult a licensed attorney familiar with your jurisdiction, vessel class, and charter type.</p>
       <p>Statutes are subject to amendment. The original text, on the issuing body's website, is always authoritative. If we appear to describe a statute in a way that conflicts with its current text, the current text is correct please tell us by emailing <a href="mailto:hello@boatcheckin.com" style={{ color: 'var(--rust)', fontWeight: '600' }}>hello@boatcheckin.com</a> so we can correct this page.</p>
      </div>
    </div>
  </div>
</section>

{/*  ═══ FEDERAL STANDARDS (DARK) ═══  */}
<section className="statute-section" id="federal">
  <div className="container">
    <div className="section-header">
      <span className="eyebrow light">US federal maritime standards</span>
      <h2 className="section-title">United States<br/>Coast Guard &amp; <em>46 CFR.</em></h2>
     <p className="section-sub">The federal baseline for small passenger vessel operations including the safety instruction and manifest expectations that govern most inspected charters. Applies to operators under US Coast Guard jurisdiction carrying passengers for hire.</p>
    </div>

    <div className="statute-stack">

      <div className="statute-item">
        <div>
          <span className="statute-badge">Federal · 46 CFR</span>
          <div className="statute-name">Pre-Departure Safety Orientation</div>
          <div className="statute-cite">46 CFR §185.506</div>
        </div>
        <div>
          <div className="statute-body">
           <p>Small passenger vessel operators are required to provide each passenger with a safety orientation before getting underway. The orientation covers life preserver stowage and use, emergency exits, fire extinguishers, distress signals, and the location of emergency equipment along with the actions passengers are expected to take in an emergency.</p>
           <p>The master is responsible for ensuring this instruction happens on every voyage, for every passenger aboard. Historically, this has been proven by verbal briefings at the dock effective in the moment, but difficult to document after the fact.</p>
          </div>
          <div className="statute-subhead">How Boatcheckin supports the record</div>
          <div className="statute-mapping">
            Each guest acknowledges a per-topic safety card on their own device before boarding life preserver, emergency exits, fire extinguisher, distress signals, emergency actions. Each acknowledgment is timestamped with delivery method, IP, and user agent. The captain attestation at trip start seals the set into the trip record. <strong>The record shows who was told what, when, and how they confirmed.</strong>
          </div>
        </div>
      </div>

      <div className="statute-item">
        <div>
          <span className="statute-badge">Federal · USCG</span>
          <div className="statute-name">Passenger Manifest Requirements</div>
          <div className="statute-cite">46 CFR Subchapter T · USCG guidance</div>
        </div>
        <div>
          <div className="statute-body">
           <p>Small passenger vessels carrying six or more passengers are typically expected to maintain a passenger list name, date, voyage identifier for every trip. The specific requirements vary by vessel class, route, and Captain of the Port jurisdiction, but the underlying principle is consistent: <strong>the operator must be able to produce, on request, a record of who was aboard on a given voyage.</strong></p>
            <p>In practice, this obligation matters most in post-incident review: Coast Guard investigators, insurers, and emergency responders rely on accurate manifests to reconstruct a voyage.</p>
          </div>
          <div className="statute-subhead">How Boatcheckin supports the record</div>
          <div className="statute-mapping">
            Every trip generates a USCG-format manifest PDF on demand vessel, voyage ID, departure time, captain of record, and every guest who signed in through the trip link. The manifest is filed into the trip record and available for export without a support ticket, at any point in the retention window. <strong>Produce it in thirty seconds, not thirty minutes of rummaging.</strong>
          </div>
        </div>
      </div>

      <div className="statute-item">
        <div>
          <span className="statute-badge">Federal · OUPV/Master</span>
          <div className="statute-name">Master's Authority &amp; Operational Responsibility</div>
          <div className="statute-cite">46 U.S.C. §8104 · USCG licensing</div>
        </div>
        <div>
          <div className="statute-body">
           <p>The licensed captain whether an OUPV (Six-Pack) or Master holds ultimate authority and responsibility for the vessel, passengers, crew, and operation. No software, no booking platform, and no third party displaces that authority. Go/no-go calls, route decisions, and the decision to put lines off the dock remain the captain's.</p>
          </div>
          <div className="statute-subhead">How Boatcheckin supports the record</div>
          <div className="statute-mapping">
            The captain's decision to start the trip is an explicit, attested action in Boatcheckin a slide-to-start confirmation, cryptographically recorded with timestamp. The software never auto-starts a trip, never clears a checklist on the captain's behalf, and never routes around the master's authority. <strong>The captain directs. Boatcheckin records.</strong>
          </div>
        </div>
      </div>

    </div>
  </div>
</section>

{/*  ═══ FLORIDA STATE STANDARDS (LIGHT) ═══  */}
<section className="statute-light" id="florida">
  <div className="container">
    <div className="section-header">
      <span className="eyebrow sea">Florida state standards</span>
      <h2 className="section-title">Florida Statutes &amp; <em>FWC Chapter 327.</em></h2>
      <p className="section-sub">Florida applies state-specific requirements on top of federal maritime rules, administered primarily by the Florida Fish and Wildlife Conservation Commission (FWC). Charter and livery operators face additional obligations under F.S. §327.54.</p>
    </div>

    <div className="statute-stack">

      <div className="statute-item">
        <div>
          <span className="statute-badge">Florida · FWC</span>
          <div className="statute-name">Vessel Safety &amp; Boating Safety Identification</div>
          <div className="statute-cite">Florida Statutes Chapter 327</div>
        </div>
        <div>
          <div className="statute-body">
           <p>Florida Statutes Chapter 327 is the state's primary vessel safety law, administered by FWC. It covers registration, required safety equipment, operator conduct, and under §327.395 the Boating Safety Identification Card requirement for most operators of vessels of 10 horsepower or greater. Guests who take the helm of a chartered bareboat are often subject to this requirement.</p>
          </div>
          <div className="statute-subhead">How Boatcheckin supports the record</div>
          <div className="statute-mapping">
            For bareboat charters and any trip where a guest is expected to operate the vessel, the trip link prompts for Boating Safety ID details where applicable, captures a record of the check, and ties it to the guest profile and the trip manifest. The operator sees a clear pass/fail status per guest before clearance to depart. <strong>No surprises at the dock.</strong>
          </div>
        </div>
      </div>

      <div className="statute-item">
        <div>
          <span className="statute-badge">Florida · Livery</span>
          <div className="statute-name">Livery &amp; Rental Vessel Requirements</div>
          <div className="statute-cite">F.S. §327.54</div>
        </div>
        <div>
          <div className="statute-body">
           <p>Florida livery operators businesses that rent or charter vessels are required under F.S. §327.54 to provide renters with specific pre-operation instruction, including operation of the vessel, required safety equipment, local hazards, and applicable state laws. Livery operators must also satisfy recordkeeping requirements on the identity of renters, relevant certifications, and rental terms.</p>
           <p>Subsequent Florida legislation including changes discussed under SB 606 of the 2022 session and related amendments has continued to refine these requirements. Operators are expected to stay current with amendments; Boatcheckin stays aligned to the recordkeeping pattern the statute describes.</p>
          </div>
          <div className="statute-subhead">How Boatcheckin supports the record</div>
          <div className="statute-mapping">
            Livery-style operators can structure the guest flow to include renter identification, equipment-review acknowledgments, vessel-operation instructions, and local-hazard briefings each captured as discrete attested items in the trip record. Every item is timestamped and tied to the renter, the vessel, and the rental window. <strong>The paper trail the statute describes, kept without the paper.</strong>
          </div>
        </div>
      </div>

      <div className="statute-item">
        <div>
          <span className="statute-badge">Florida · Insurance Referral</span>
          <div className="statute-name">Insurance Solicitation &amp; Referral Structure</div>
          <div className="statute-cite">F.S. §626.112 et seq.</div>
        </div>
        <div>
          <div className="statute-body">
           <p>Florida, like most states, restricts who may sell, solicit, or negotiate insurance requiring appointment as a licensed agent. Referral arrangements between unlicensed parties and licensed agents are permitted only under specific conditions, including that referral compensation not be contingent on policy purchase.</p>
          </div>
          <div className="statute-subhead">How Boatcheckin structures referrals</div>
          <div className="statute-mapping">
            Boatcheckin does not sell, solicit, negotiate, bind, or service insurance. Where an insurance product is referenced on the platform, it is offered by a licensed agent and carrier; Boatcheckin receives a fixed referral fee per qualifying lead, paid regardless of whether a policy is purchased. This referral structure is designed to remain on the correct side of Florida's insurance licensing laws. <strong>The customer's relationship is with the licensed agent not with us.</strong>
          </div>
        </div>
      </div>

    </div>
  </div>
</section>

{/*  ═══ ELECTRONIC SIGNATURE (DARK) ═══  */}
<section className="statute-section" id="esign">
  <div className="container">
    <div className="section-header">
      <span className="eyebrow light">Electronic signature law</span>
     <h2 className="section-title">ESIGN &amp; UETA<br/>when a <em>digital signature</em><br/>holds up in court.</h2>
      <p className="section-sub">Electronic waivers and attestations are legally equivalent to ink-signed ones when the record establishes the signer's identity, intent, consent to use electronic form, and integrity of the document. Boatcheckin is designed to produce records that meet each of those tests.</p>
    </div>

    <div className="statute-stack">

      <div className="statute-item">
        <div>
          <span className="statute-badge">Federal · ESIGN</span>
          <div className="statute-name">Electronic Signatures in Global and National Commerce Act</div>
          <div className="statute-cite">15 U.S.C. §7001 et seq.</div>
        </div>
        <div>
          <div className="statute-body">
           <p>The ESIGN Act, signed into federal law in 2000, establishes that electronic signatures and electronic records have the same legal validity as ink signatures and paper records for most interstate commerce provided the signer consented to electronic form, the identity of the signer can be attributed, and the record of the transaction is retained in a form that accurately reflects the agreement.</p>
            <p>Waivers, release-of-liability agreements, and safety acknowledgments signed through Boatcheckin fall within ESIGN's scope for the vast majority of charter transactions.</p>
          </div>
          <div className="statute-subhead">How Boatcheckin supports the four ESIGN tests</div>
          <div className="statute-mapping">
           <strong>Intent.</strong> The signer performs an affirmative signature act a drawn or typed signature tied to the specific waiver text. <strong>Consent to electronic form.</strong> The guest is shown the electronic-records consent language at the top of the flow. <strong>Attribution.</strong> Signature is recorded with timestamp, IP, user agent, and a link to the verified guest identity. <strong>Record integrity.</strong> The completed waiver is SHA-256 hashed at signing any post-hoc modification is detectable, and the hash is retained alongside the document.
          </div>
        </div>
      </div>

      <div className="statute-item">
        <div>
          <span className="statute-badge">Florida · UETA</span>
          <div className="statute-name">Uniform Electronic Transaction Act</div>
          <div className="statute-cite">F.S. Chapter 668, Part I (§668.50)</div>
        </div>
        <div>
          <div className="statute-body">
           <p>Florida's adoption of UETA, codified at F.S. §668.50, is the state-law counterpart to federal ESIGN. It provides the same foundational rule that an electronic record or signature cannot be denied legal effect solely because it is electronic and adds Florida-specific provisions on record retention, original documents, and admissibility as evidence.</p>
            <p>UETA applies to transactions between parties who have agreed to conduct them electronically, which in charter operations is established by the guest's consent at the start of the trip flow.</p>
          </div>
          <div className="statute-subhead">How Boatcheckin supports UETA alignment</div>
          <div className="statute-mapping">
            Electronic-records consent is captured explicitly at the start of the guest flow. Retention follows the statutory window for the record type. Records are stored in a form that is retrievable and accurately reproducible throughout the retention window meeting Florida's "retention of electronic records" standard under §668.50(12). <strong>The record is admissible because the record is intact.</strong>
          </div>
        </div>
      </div>

    </div>
  </div>
</section>

{/*  ═══ PRIVACY & CONSENT (LIGHT) ═══  */}
<section className="statute-light" id="privacy">
  <div className="container">
    <div className="section-header">
      <span className="eyebrow">Privacy &amp; consent standards</span>
      <h2 className="section-title">The rules that follow<br/>the <em>guest's data</em>,<br/>not the vessel.</h2>
     <p className="section-sub">Because Boatcheckin operates guest-facing flows across jurisdictions and channels, privacy and consent law applies at the layer of each individual guest not the operator's state. We structure the platform to support obligations that apply regardless of where the boat is tied up.</p>
    </div>

    <div className="statute-stack">

      <div className="statute-item">
        <div>
          <span className="statute-badge">Federal · TCPA</span>
          <div className="statute-name">Telephone Consumer Protection Act</div>
          <div className="statute-cite">47 U.S.C. §227</div>
        </div>
        <div>
          <div className="statute-body">
            <p>The TCPA governs commercial SMS, MMS, and automated voice messages to US phone numbers. Express written consent is required for most marketing messages; transactional operational messages related to a confirmed service (such as a trip confirmation) are treated differently but still require consent in most interpretations.</p>
          </div>
          <div className="statute-subhead">How Boatcheckin supports compliance</div>
          <div className="statute-mapping">
            SMS is used for operational trip messages tied to a guest's confirmed booking trip link delivery, pre-departure reminders, captain messages. Marketing SMS requires explicit opt-in tied to the guest record. <strong>Operator messages to guests they don't have a booking with are not supported.</strong>
          </div>
        </div>
      </div>

      <div className="statute-item">
        <div>
          <span className="statute-badge">Federal · CAN-SPAM</span>
          <div className="statute-name">CAN-SPAM Act</div>
          <div className="statute-cite">15 U.S.C. §7701 et seq.</div>
        </div>
        <div>
          <div className="statute-body">
           <p>The CAN-SPAM Act sets federal standards for commercial email clear identification of the sender, accurate subject lines, a physical postal address, and a functional unsubscribe mechanism honored within ten business days.</p>
          </div>
          <div className="statute-subhead">How Boatcheckin supports compliance</div>
          <div className="statute-mapping">
            Every operator-sent email carries a clear sender identity, the operator's postal address, and an unsubscribe link. Marketing-linked guest data is cleared on a rolling 90-day cycle unless the guest has opted in to operator communications. Unsubscribe actions propagate across channels immediately.
          </div>
        </div>
      </div>

      <div className="statute-item">
        <div>
          <span className="statute-badge">State &amp; International</span>
          <div className="statute-name">CCPA, GDPR &amp; Guest Data Rights</div>
          <div className="statute-cite">Cal. Civ. Code §1798.100 et seq. · EU GDPR</div>
        </div>
        <div>
          <div className="statute-body">
           <p>Guests from California enjoy rights under the CCPA access, deletion, and opt-out from sale of personal information. Guests from the European Economic Area and the UK enjoy broader rights under the GDPR lawful basis, access, rectification, erasure, portability, and restriction.</p>
            <p>Because charter operators in Florida regularly serve guests from both regions, these rights can apply per-guest even when the vessel never leaves state waters.</p>
          </div>
          <div className="statute-subhead">How Boatcheckin supports compliance</div>
          <div className="statute-mapping">
            Guests can request access, export, or deletion of their personal data through the trip link or by contacting the operator or Boatcheckin directly. Requests are actioned within statutory windows. Compliance-relevant records signed waivers, safety attestations, manifests are retained for the statutory period your operation requires and may be exempt from deletion under legal-obligation grounds. <strong>The record of the trip stays intact; the marketing layer does not.</strong>
          </div>
        </div>
      </div>

    </div>
  </div>
</section>

{/*  ═══ WHAT WE DON'T CLAIM ═══  */}
<section className="not-claimed" id="not-claimed">
  <div className="container">
    <div className="section-header" style={{ marginBottom: '40px' }}>
      <span className="eyebrow light">Honesty about scope</span>
      <h2 className="section-title">What Boatcheckin<br/><em>does not</em> claim.</h2>
      <p className="section-sub">A standards page that doesn't include this section is a standards page that is overpromising. These are the lines we do not cross, stated out loud.</p>
    </div>

    <div className="nc-grid">
      <div className="nc-card">
       <div className="nc-label">We don't </div>
        <div className="nc-title">Certify your compliance.</div>
        <div className="nc-body">Using Boatcheckin does not make an operator compliant with any statute. We support the documentation that compliance requires; we do not attest to it on your behalf. No logo, no badge, no page on our site is a substitute for a competent review of your operation.</div>
      </div>

      <div className="nc-card">
       <div className="nc-label">We don't </div>
        <div className="nc-title">Interpret the law for your operation.</div>
        <div className="nc-body">Every statute on this page has edge cases, jurisdictional variations, vessel-class distinctions, and court-interpreted nuances that a marketing page cannot responsibly cover. Your attorney can; we cannot, and we will not pretend otherwise.</div>
      </div>

      <div className="nc-card">
       <div className="nc-label">We don't </div>
        <div className="nc-title">Draft your waivers for you.</div>
       <div className="nc-body">Waiver language is specific to the operator, the state, the vessel class, and the activity. Boatcheckin captures and hashes the text <em>you</em> provide it does not generate it, review it, or stand behind its enforceability in any particular jurisdiction.</div>
      </div>

      <div className="nc-card">
       <div className="nc-label">We don't </div>
        <div className="nc-title">Stand in for the captain's judgment.</div>
        <div className="nc-body">No record replaces the go/no-go call. No checklist certifies sea conditions. No piece of software takes responsibility for what happens on the water. Boatcheckin documents what the captain decided; the captain decided it.</div>
      </div>
    </div>
  </div>
</section>

{/*  ═══ VERSION / UPDATE CADENCE ═══  */}
<section className="version-strip" id="version">
  <div className="container">
    <div className="version-grid">
      <div className="v-item">
        <span className="v-label">Page revision</span>
        <span className="v-value">v1.0</span>
      </div>
      <div className="v-item">
        <span className="v-label">Last reviewed</span>
        <span className="v-value">April 2026</span>
      </div>
      <div className="v-item">
        <span className="v-label">Review cadence</span>
        <span className="v-value">On statute change · min. annually</span>
      </div>
    </div>
    <p>
      This page is reviewed whenever a cited statute is materially amended and at minimum annually.
      If you believe a statute has been amended in a way that changes what this page describes, email{' '}
      <a href="mailto:hello@boatcheckin.com" style={{ color: 'var(--rust)', fontWeight: '600' }}>hello@boatcheckin.com</a>
      {' '}— the original text of the statute on its issuing body&apos;s website is always authoritative, and we&apos;ll correct the page to match.
    </p>
  </div>
</section>

{/*  ═══ FINAL CTA ═══  */}
<section className="final-cta">
  <div className="container">
    <div className="fca-grid">
      <div>
        <h2 className="fca-h">Know what a clean record<br/>looks like. <em>Start keeping one.</em></h2>
        <p className="fca-sub">The statutes are the standard. The record is how you meet it. Set up Boatcheckin in under 10 minutes and start your operation's documentation on a clean page tonight.</p>
      </div>
      <div className="fca-stack">
        <a href="/signup" className="btn">Start Free →</a>
        <a href="/contact" className="btn btn-outline">Talk to Us</a>
      </div>
    </div>
  </div>
</section>

{/*  ═══ FOOTER ═══  */}
    </>
  )
}
