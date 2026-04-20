import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — Boatcheckin',
  description: 'How Boatcheckin collects, uses, retains, and protects operator and guest data. Rights, controls, and contacts.',
}

export default function PrivacyPage() {
  return (
    <>
      {/*  DATELINE  */}
<div className="dateline">
  <div className="container">
    <div className="dateline-inner">
      <div><span className="dl-dot">●</span> PRIVACY POLICY</div>
      <div>ST. PETERSBURG · FLORIDA</div>
      <div id="todayDate">CAPTAIN'S LOG — TODAY</div>
    </div>
  </div>
</div>

{/*  DOC HERO  */}
<section className="doc-hero">
  <div className="container-doc">
    <span className="eyebrow">Privacy Policy</span>
    <h1>How we handle <em>operator and guest</em> data.</h1>
    <p style={{ fontSize: '17px', lineHeight: '1.65', color: 'var(--ink-soft)', maxWidth: '680px' }}>This Privacy Policy explains what information Boatcheckin collects, how it is used and shared, how long it is retained, what rights you have over it, and how to exercise those rights. It applies to boatcheckin.com, the Boatcheckin application, and related services (together, the <strong>"Services"</strong>).</p>
    <div className="doc-meta">
      <div className="doc-meta-item"><span className="dm-label">Version</span><span className="dm-value">1.0</span></div>
      <div className="doc-meta-item"><span className="dm-label">Effective date</span><span className="dm-value">April 20, 2026</span></div>
      <div className="doc-meta-item"><span className="dm-label">Last reviewed</span><span className="dm-value">April 2026</span></div>
      <div className="doc-meta-item"><span className="dm-label">Replaces</span><span className="dm-value">All prior versions</span></div>
    </div>
  </div>
</section>

{/*  DOC BODY  */}
<section className="container-doc">
  <div className="doc-body">

    {/*  TOC  */}
    <aside className="toc-nav">
      <div className="toc-heading">Contents</div>
      <ul>
        <li><a href="#s1">1 · Scope &amp; summary</a></li>
        <li><a href="#s2">2 · Who we are</a></li>
        <li><a href="#s3">3 · Controller &amp; processor</a></li>
        <li><a href="#s4">4 · What we collect</a></li>
        <li><a href="#s5">5 · How we use it</a></li>
        <li><a href="#s6">6 · Legal bases</a></li>
        <li><a href="#s7">7 · How we share</a></li>
        <li><a href="#s8">8 · Subprocessors</a></li>
        <li><a href="#s9">9 · International transfers</a></li>
        <li><a href="#s10">10 · Retention</a></li>
        <li><a href="#s11">11 · Your rights</a></li>
        <li><a href="#s12">12 · Children</a></li>
        <li><a href="#s13">13 · Security</a></li>
        <li><a href="#s14">14 · Cookies</a></li>
        <li><a href="#s15">15 · Do Not Track</a></li>
        <li><a href="#s16">16 · Changes</a></li>
        <li><a href="#s17">17 · Contact</a></li>
      </ul>
    </aside>

    {/*  MAIN  */}
    <div className="doc-content">

      <h2 id="s1"><span className="sec">§ 1</span>Scope &amp; summary</h2>
      <p>Boatcheckin is a recordkeeping platform used by charter operators ("<strong>Operators</strong>") to document trips and by passengers and other participants ("<strong>Guests</strong>") to self-register for those trips. This Policy covers both groups, plus anyone who visits boatcheckin.com without creating an account.</p>
      <p>In plain terms:</p>
      <ul>
        <li>We collect only what we need to deliver the Services and meet the recordkeeping obligations Operators depend on.</li>
        <li>We do not sell personal information to advertisers, data brokers, or marketing networks.</li>
        <li>Compliance records — signed waivers, attestations, manifests — are retained for the period statute and the Operator's retention settings require; marketing-linked information is cleared on a rolling schedule.</li>
        <li>You have rights over your information. This Policy explains how to exercise them.</li>
      </ul>

      <div className="callout info">
        <div className="callout-tag info">Note on this Policy</div>
        <p>This Policy applies to the Boatcheckin Services. It does not apply to Operator websites, booking platforms, third-party insurance agents, payment processors, or any other service you reach through a link in our Services. Those operate under their own privacy notices.</p>
      </div>

      <h2 id="s2"><span className="sec">§ 2</span>Who we are</h2>
      <p>The Services are operated by <strong>Oakmont Logic LLC</strong>, a limited liability company organized under the laws of Wyoming, United States, doing business as <strong>Boatcheckin</strong> ("<strong>Boatcheckin</strong>," "<strong>we</strong>," "<strong>our</strong>," or "<strong>us</strong>"). Our mailing address is 7901 4th St N, #8722, St. Petersburg, Florida 33702, United States.</p>
      <p>For questions about this Policy, how your data is processed, or to exercise any right described below, contact us at <a className="inline" href="mailto:privacy@boatcheckin.com">privacy@boatcheckin.com</a>.</p>

      <h2 id="s3"><span className="sec">§ 3</span>Controller &amp; processor roles</h2>
      <p>The role we occupy depends on whose data is being processed.</p>

      <h3><span className="sec">3.1</span>Operator account data</h3>
      <p>When an Operator creates a Boatcheckin account, we act as the <strong>data controller</strong> (or "business" under US state privacy laws) for information about that Operator — the person signing up, their role, contact details, billing details, and how they use our Services.</p>

      <h3><span className="sec">3.2</span>Guest and trip data</h3>
      <p>When an Operator uses Boatcheckin to document a trip, we process Guest data and trip content <strong>on the Operator's behalf</strong> — as a <strong>data processor</strong> (or "service provider" under US state privacy laws). The Operator decides what waiver text to use, what safety briefing to deliver, what retention applies, and how long records are kept beyond the statutory minimum. Guests who want to exercise rights over their data should contact the Operator of record first; we support Operators in responding.</p>

      <h3><span className="sec">3.3</span>Visitors to our website</h3>
      <p>For visitors to boatcheckin.com who are not signed in, we act as the controller of the limited data described in <a className="inline" href="#s4">Section 4</a>.</p>

      <h2 id="s4"><span className="sec">§ 4</span>What we collect</h2>
      <p>We collect data in three broad categories.</p>

      <h3><span className="sec">4.1</span>Information Operators provide</h3>
      <ul>
        <li><strong>Account details</strong> — name, email, password (stored as a salted hash, never in clear text), phone number, operator role, and company name where provided.</li>
        <li><strong>Business and vessel details</strong> — vessel name and identifier, home port, operating area, captain credentials, and any compliance documentation the Operator uploads.</li>
        <li><strong>Trip configuration</strong> — waiver text, safety briefing content, and trip parameters the Operator chooses.</li>
        <li><strong>Billing details</strong> — for paid plans, we collect billing contact information; payment card details are handled directly by our payment processor and we do not store full card numbers on our systems.</li>
      </ul>

      <h3><span className="sec">4.2</span>Information Guests provide</h3>
      <ul>
        <li><strong>Identity and contact</strong> — name, email, phone number, date of birth where required by law, and emergency contact where the Operator collects one.</li>
        <li><strong>Trip-specific information</strong> — responses to safety questions, Boating Safety Identification Card details where applicable, and similar items collected through the trip link.</li>
        <li><strong>Signatures and attestations</strong> — waiver signature, per-card safety acknowledgments, and any additional consents the Operator configures. Each is stored alongside timestamp, IP, user agent, and a cryptographic hash of the signed content.</li>
      </ul>

      <h3><span className="sec">4.3</span>Information we collect automatically</h3>
      <ul>
        <li><strong>Device and connection</strong> — IP address, browser type and version, operating system, device type, screen size, timezone, and language preference.</li>
        <li><strong>Usage</strong> — pages viewed, features used, timestamps of actions, trip identifiers, and diagnostic information generated when errors occur.</li>
        <li><strong>Location</strong> — only at the granularity needed for the feature in use (for example, approximate location derived from IP for regional defaults, or precise location only where a Guest grants permission for a specific feature such as on-water check-in).</li>
      </ul>
      <p>We do <strong>not</strong> intentionally collect information about race, ethnicity, religion, political views, sexual orientation, union membership, or other categories treated as sensitive under GDPR Article 9 unless you specifically choose to provide it.</p>

      <h2 id="s5"><span className="sec">§ 5</span>How we use it</h2>
      <p>We use the information above for the purposes listed below, and no others.</p>
      <div className="dt-wrap">
        <table className="dt">
          <thead><tr><th style={{ width: '35%' }}>Purpose</th><th>What this looks like in practice</th></tr></thead>
          <tbody>
            <tr><td><strong>Deliver the Services</strong></td><td>Authenticate Operator accounts, generate and deliver trip links, capture Guest registrations, produce manifests and records for Operators.</td></tr>
            <tr><td><strong>Compliance recordkeeping</strong></td><td>Store signatures, attestations, and audit trails in the form Operators rely on for federal maritime rules, state charter rules, and electronic signature law.</td></tr>
            <tr><td><strong>Operator communications</strong></td><td>Send trip-link deliveries, account notices, service updates, billing receipts, and security alerts.</td></tr>
            <tr><td><strong>Guest communications</strong></td><td>Deliver trip links and time-sensitive operational messages related to a Guest's specific booking, using the channel the Operator configured.</td></tr>
            <tr><td><strong>Support and operations</strong></td><td>Diagnose issues reported by Operators, investigate abuse reports, and respond to security disclosures.</td></tr>
            <tr><td><strong>Security</strong></td><td>Detect and prevent unauthorized access, fraud, and abuse; protect the integrity of the audit trail; enforce our Terms.</td></tr>
            <tr><td><strong>Legal obligations</strong></td><td>Respond to lawful requests from courts, regulators, and law enforcement; maintain records we are required by law to keep.</td></tr>
            <tr><td><strong>Product improvement</strong></td><td>Analyze aggregated, non-identifying usage patterns to improve reliability, performance, and user experience.</td></tr>
          </tbody>
        </table>
      </div>
      <p>We do not use Guest data to train general-purpose machine learning models, and we do not sell, rent, or otherwise make Guest data available to advertisers or data brokers.</p>

      <h2 id="s6"><span className="sec">§ 6</span>Legal bases (GDPR, UK GDPR)</h2>
      <p>If you are in the European Economic Area, the United Kingdom, or Switzerland, we rely on one or more of the following legal bases for each processing activity:</p>
      <ul>
        <li><strong>Performance of a contract</strong> — to deliver the Services an Operator has signed up for, or to fulfill a Guest's registration for a specific trip.</li>
        <li><strong>Legitimate interests</strong> — to secure our Services, prevent abuse, support Operators, and improve the product, balanced against your rights and expectations.</li>
        <li><strong>Legal obligation</strong> — to meet recordkeeping, tax, and regulatory requirements.</li>
        <li><strong>Consent</strong> — where we rely on consent (for example, optional Guest marketing communications, or non-essential cookies), we ask for it clearly and honor withdrawal at any time.</li>
      </ul>

      <h2 id="s7"><span className="sec">§ 7</span>How we share</h2>
      <p>We share personal information only in the specific situations below.</p>
      <h3><span className="sec">7.1</span>With the Operator of record</h3>
      <p>Guest data is shared with the Operator of record for the trip. That is the point of the Services — the Operator needs the record. Operators are contractually required to handle Guest data in accordance with applicable law and their own privacy notices.</p>
      <h3><span className="sec">7.2</span>With service providers we engage</h3>
      <p>We use vetted third-party providers to deliver the Services — hosting, database, email and SMS delivery, payment processing, error monitoring, and similar functions. These providers act as subprocessors, receive only the information needed for the task, and are contractually bound to handle it appropriately. See <a className="inline" href="#s8">Section 8</a>.</p>
      <h3><span className="sec">7.3</span>For legal reasons</h3>
      <p>We may disclose information where required by law, subpoena, court order, or valid governmental request; to enforce our Terms; to protect our rights, property, or safety, or those of our users or the public; or in connection with investigation of suspected abuse or fraud.</p>
      <h3><span className="sec">7.4</span>In a business transaction</h3>
      <p>If Boatcheckin is involved in a merger, acquisition, financing, or sale of assets, user information may be transferred as part of that transaction. We will notify affected users and give meaningful choices where the law requires them.</p>
      <h3><span className="sec">7.5</span>With your direction</h3>
      <p>We share information at your direction — for example, when you link your account to another service, or when you explicitly authorize disclosure.</p>

      <div className="callout warn">
        <div className="callout-tag">Not shared with</div>
        <p>We do not share personal information with advertising networks, data brokers, credit reporting agencies, or any party for their own independent marketing purposes.</p>
      </div>

      <h2 id="s8"><span className="sec">§ 8</span>Subprocessors</h2>
      <p>We rely on a limited number of service providers to run the Services — categories include cloud hosting, managed database, email delivery, SMS delivery, payment processing, error monitoring, mapping, and bot/abuse protection. Each is bound by a written agreement that restricts their use of data to the Services we engage them for.</p>
      <p>Operators with a formal vendor-review process can request a current list of subprocessors, including identity, processing purpose, and location, by emailing <a className="inline" href="mailto:privacy@boatcheckin.com">privacy@boatcheckin.com</a>. We also make this list available through our Data Processing Addendum where one is in place.</p>

      <h2 id="s9"><span className="sec">§ 9</span>International transfers</h2>
      <p>Boatcheckin is based in the United States, and our primary systems operate from US data centers. If you access the Services from outside the United States, your information is transferred to, stored in, and processed in the United States and potentially other jurisdictions where our subprocessors operate.</p>
      <p>For transfers of personal data originating in the European Economic Area, the United Kingdom, or Switzerland, we rely on lawful transfer mechanisms including the <strong>Standard Contractual Clauses (SCCs)</strong> adopted by the European Commission, and equivalent mechanisms under UK and Swiss data protection law. Additional safeguards — encryption in transit, encryption at rest, access controls, and contractual restrictions on subprocessor use — apply in every case.</p>

      <h2 id="s10"><span className="sec">§ 10</span>Retention</h2>
      <p>We retain personal information for no longer than necessary for the purposes set out in this Policy, with specific periods as follows.</p>
      <div className="dt-wrap">
        <table className="dt">
          <thead><tr><th style={{ width: '35%' }}>Category</th><th style={{ width: '30%' }}>Retention period</th><th>Reason</th></tr></thead>
          <tbody>
            <tr><td><strong>Compliance records</strong> (waivers, safety attestations, manifests)</td><td>Period set by Operator, bounded by the statute applicable to the Operator's jurisdiction. Default minimum: 5 years from trip completion.</td><td>Charter operators typically need these available well beyond the trip itself for regulatory, insurance, and litigation contingencies.</td></tr>
            <tr><td><strong>Trip operational data</strong> (route configuration, captain logs, non-signature artifacts)</td><td>Duration of the Operator account plus 1 year.</td><td>Supports Operator history and reporting.</td></tr>
            <tr><td><strong>Operator account data</strong></td><td>Duration of the account, plus time necessary to close billing and comply with tax/accounting rules.</td><td>Account continuity and legal obligations.</td></tr>
            <tr><td><strong>Marketing-linked Guest data</strong></td><td>Rolling 90 days from trip completion unless the Guest has opted in to Operator communications.</td><td>Minimize persistence of non-compliance data.</td></tr>
            <tr><td><strong>Technical logs</strong></td><td>90 days for general logs; up to 1 year for security and audit-trail logs.</td><td>Incident investigation and security posture.</td></tr>
            <tr><td><strong>Backups</strong></td><td>Rolling window up to 35 days for point-in-time recovery.</td><td>Disaster recovery and integrity verification.</td></tr>
          </tbody>
        </table>
      </div>
      <p>When the applicable period ends, personal information is deleted or irreversibly anonymized. Where we are required by law to retain specific information longer (for example, accounting records under tax law), we retain only the specific information required and continue to protect it.</p>

      <h2 id="s11"><span className="sec">§ 11</span>Your rights</h2>
      <p>You have rights over your personal information. The rights available to you depend on where you are located; below we describe the rights we extend globally, followed by jurisdiction-specific detail.</p>

      <h3><span className="sec">11.1</span>Rights we extend to everyone</h3>
      <ul>
        <li><strong>Access</strong> — a copy of the personal information we hold about you.</li>
        <li><strong>Correction</strong> — to correct inaccurate or incomplete information.</li>
        <li><strong>Deletion</strong> — to request deletion, subject to legal or regulatory retention requirements described in <a className="inline" href="#s10">Section 10</a>.</li>
        <li><strong>Complaint</strong> — to raise a concern with us and, where applicable, with a supervisory authority.</li>
      </ul>

      <h3><span className="sec">11.2</span>Rights for EEA, UK, and Swiss residents</h3>
      <p>In addition to the above, you have the rights under GDPR / UK GDPR / Swiss FADP to object to processing, restrict processing, data portability, and to withdraw consent where we rely on it. You may lodge a complaint with your local supervisory authority.</p>

      <h3><span className="sec">11.3</span>Rights for California residents (CCPA / CPRA)</h3>
      <p>California residents have the right to know what categories and specific pieces of personal information we have collected, sold, or shared; the right to request deletion; the right to correct inaccurate information; the right to opt out of sale or sharing of personal information for cross-context behavioral advertising; and the right not to be discriminated against for exercising these rights.</p>
      <p><strong>Boatcheckin does not sell personal information and does not share personal information for cross-context behavioral advertising as those terms are defined under the CCPA/CPRA.</strong></p>

      <h3><span className="sec">11.4</span>Rights for residents of other US states</h3>
      <p>Residents of Colorado, Connecticut, Virginia, Utah, Texas, Oregon, Montana, and other states with comprehensive privacy laws have the rights conferred by those laws, including access, correction, deletion, opt-out of targeted advertising and sale, and appeal of denied requests. We honor these rights on the same footing as our CCPA obligations.</p>

      <h3><span className="sec">11.5</span>How to exercise your rights</h3>
      <p>Operators can request access, correction, export, or deletion from the Operator dashboard or by emailing <a className="inline" href="mailto:privacy@boatcheckin.com">privacy@boatcheckin.com</a>.</p>
      <p>Guests seeking to exercise rights over trip records should contact the Operator of record first, since the Operator controls that data. We will support the Operator in responding, and we will process requests directly where we act as the controller.</p>
      <p>We verify requests before responding in order to protect the information from unauthorized disclosure. We respond to verified requests within the period required by applicable law, and in no event later than 45 days for US state privacy law requests, extended by 45 additional days where reasonably necessary with notice.</p>

      <h2 id="s12"><span className="sec">§ 12</span>Children</h2>
      <p>Boatcheckin is designed for use by adults — Operators operating commercial vessels and Guests boarding those vessels. The Services are not directed to children under 13, and we do not knowingly collect personal information from children under 13 without verifiable parental consent.</p>
      <p>Where Operators collect information about minor Guests (for example, a family charter that includes children) as part of the trip record, the information is collected from and entered by an adult responsible for the minor. Operators are responsible for obtaining any parental consent required by applicable law.</p>
      <p>If you believe we have inadvertently collected information from a child under 13 without appropriate consent, contact us at <a className="inline" href="mailto:privacy@boatcheckin.com">privacy@boatcheckin.com</a> and we will delete it.</p>

      <h2 id="s13"><span className="sec">§ 13</span>Security</h2>
      <p>We implement technical and organizational measures designed to protect personal information against unauthorized access, alteration, disclosure, and destruction. These measures are described in our <a className="inline" href="/security">Security page</a>, and include encryption in transit (TLS 1.3) and at rest, least-privilege access controls, cryptographic hashing of signed records, audit logging, and routine review of our practices.</p>
      <p>No system can be guaranteed 100% secure. If a security incident affects your personal information, we will notify you and any applicable regulators in accordance with law.</p>

      <h2 id="s14"><span className="sec">§ 14</span>Cookies and similar technologies</h2>
      <p>We use cookies and similar technologies that are strictly necessary to operate the Services, plus a limited set of functional and analytics technologies. Our <a className="inline" href="/cookies">Cookie Notice</a> explains what we use, why, and how to manage your preferences.</p>

      <h2 id="s15"><span className="sec">§ 15</span>Do Not Track &amp; Global Privacy Control</h2>
      <p>Some browsers transmit a "Do Not Track" signal. Because there is no common industry standard for how to respond, we do not currently change our behavior based on DNT. Where our Services receive a <strong>Global Privacy Control (GPC)</strong> signal from a compatible browser or extension, we honor it as a valid opt-out request for applicable personal information categories under US state privacy laws.</p>

      <h2 id="s16"><span className="sec">§ 16</span>Changes to this Policy</h2>
      <p>We may update this Policy from time to time. When we do, we will update the "Effective date" at the top of the Policy and, for material changes, give notice through the Services or by email to registered Operators. Your continued use of the Services after the effective date of a change constitutes acceptance of the updated Policy.</p>
      <p>Older versions of this Policy are available on request.</p>

      <h2 id="s17"><span className="sec">§ 17</span>Contact us</h2>
      <p>If you have questions about this Policy, want to exercise a right, or have a complaint about how your personal information is handled, contact us.</p>

      <div className="contact-block">
        <h3>Boatcheckin · Privacy</h3>
        <p><strong style={{ color: 'var(--brass)', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Email</strong><br/><a href="mailto:privacy@boatcheckin.com">privacy@boatcheckin.com</a></p>
        <p style={{ marginTop: '14px' }}><strong style={{ color: 'var(--brass)', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Mail</strong><br/>Boatcheckin · Privacy<br/>7901 4th St N, #8722<br/>St. Petersburg, FL 33702 · United States</p>
        <p style={{ marginTop: '14px' }}><strong style={{ color: 'var(--brass)', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Response target</strong><br/>Acknowledgment within 10 business days; full response within the window required by applicable law.</p>
      </div>

    </div>
  </div>
</section>

{/*  FOOTER  */}
    </>
  )
}
