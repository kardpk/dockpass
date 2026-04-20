import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service — Boatcheckin',
  description: 'The terms that govern use of Boatcheckin by charter operators and their users.',
}

export default function TermsPage() {
  return (
    <>
      <div className="dateline"><div className="container"><div className="dateline-inner"><div><span className="dl-dot">●</span> TERMS OF SERVICE</div><div>ST. PETERSBURG · FLORIDA</div><div id="todayDate">CAPTAIN'S LOG — TODAY</div></div></div></div>

<section className="doc-hero">
  <div className="container-doc">
    <span className="eyebrow">Terms of Service</span>
    <h1>The terms that govern use of <em>Boatcheckin.</em></h1>
    <p style={{ fontSize: '17px', lineHeight: '1.65', color: 'var(--ink-soft)', maxWidth: '680px' }}>These Terms form a binding agreement between you and Boatcheckin. They cover what the Services are, what we expect from you, what you can expect from us, the disclaimers that apply, and how disputes are resolved. Please read them carefully — <strong>particularly §10 (Disclaimers), §11 (Limitation of Liability), and §14 (Dispute Resolution)</strong>, which affect your legal rights.</p>
    <div className="doc-meta">
      <div className="doc-meta-item"><span className="dm-label">Version</span><span className="dm-value">1.0</span></div>
      <div className="doc-meta-item"><span className="dm-label">Effective date</span><span className="dm-value">April 20, 2026</span></div>
      <div className="doc-meta-item"><span className="dm-label">Governing law</span><span className="dm-value">Florida, USA</span></div>
      <div className="doc-meta-item"><span className="dm-label">Dispute forum</span><span className="dm-value">Arbitration · Florida</span></div>
    </div>
  </div>
</section>

<section className="container-doc">
  <div className="doc-body">
    <aside className="toc-nav">
      <div className="toc-heading">Contents</div>
      <ul>
        <li><a href="#s1">1 · Acceptance</a></li>
        <li><a href="#s2">2 · Definitions</a></li>
        <li><a href="#s3">3 · The Services</a></li>
        <li><a href="#s4">4 · Accounts</a></li>
        <li><a href="#s5">5 · Fees &amp; billing</a></li>
        <li><a href="#s6">6 · Your responsibilities</a></li>
        <li><a href="#s7">7 · Content &amp; IP</a></li>
        <li><a href="#s8">8 · Third parties</a></li>
        <li><a href="#s9">9 · Maritime context</a></li>
        <li><a href="#s10">10 · Disclaimers</a></li>
        <li><a href="#s11">11 · Liability cap</a></li>
        <li><a href="#s12">12 · Indemnification</a></li>
        <li><a href="#s13">13 · Termination</a></li>
        <li><a href="#s14">14 · Dispute resolution</a></li>
        <li><a href="#s15">15 · Governing law</a></li>
        <li><a href="#s16">16 · Changes</a></li>
        <li><a href="#s17">17 · Notices</a></li>
        <li><a href="#s18">18 · Miscellaneous</a></li>
        <li><a href="#s19">19 · Contact</a></li>
      </ul>
    </aside>

    <div className="doc-content">

      <h2 id="s1"><span className="sec">§ 1</span>Acceptance of these Terms</h2>
      <p>These Terms of Service ("<strong>Terms</strong>") are a binding legal agreement between <strong>Oakmont Logic LLC</strong>, doing business as Boatcheckin ("<strong>Boatcheckin</strong>," "<strong>we</strong>," "<strong>our</strong>," "<strong>us</strong>"), and the person or entity accessing or using the Services ("<strong>you</strong>" or the "<strong>Operator</strong>"). By creating an account, accessing boatcheckin.com, or using the Boatcheckin application, you agree to these Terms, our <a className="inline" href="/privacy">Privacy Policy</a>, and our <a className="inline" href="/acceptable-use">Acceptable Use Policy</a>.</p>
      <p>If you are entering into these Terms on behalf of a business, you represent that you are authorized to bind that business to these Terms, and "you" refers to that business as well as you personally.</p>
      <p><strong>If you do not agree to these Terms, do not use the Services.</strong></p>

      <div className="callout info">
        <div className="callout-tag info">Guests, not Operators</div>
        <p>If you are a passenger or other Guest completing a trip link sent to you by an Operator, the terms that apply to you are at <a className="inline" href="/guest-notice">/guest-notice</a>. These Terms govern the Operator's use of the Services.</p>
      </div>

      <h2 id="s2"><span className="sec">§ 2</span>Definitions</h2>
      <div className="defs">
        <dl>
          <dt>Services</dt>
          <dd>Boatcheckin's website at boatcheckin.com, the Boatcheckin application, related APIs, and any supporting tools we make available to Operators.</dd>
          <dt>Operator</dt>
          <dd>The person or business that creates a Boatcheckin account to document trips, passengers, and related compliance records.</dd>
          <dt>Captain</dt>
          <dd>The licensed individual with ultimate authority and responsibility for a vessel during a trip, whether the Operator themselves or a crew member authorized by the Operator.</dd>
          <dt>Guest</dt>
          <dd>A passenger, renter, or other participant who uses a trip link to register for a specific trip.</dd>
          <dt>Operator Content</dt>
          <dd>Any information, waiver text, briefing content, photos, logos, data, or other material submitted to the Services by the Operator or on the Operator's behalf.</dd>
          <dt>Trip Record</dt>
          <dd>The compiled documentation of a specific trip, including waivers, attestations, manifests, audit logs, and related artifacts.</dd>
        </dl>
      </div>

      <h2 id="s3"><span className="sec">§ 3</span>The Services</h2>
      <h3><span className="sec">3.1</span>What Boatcheckin provides</h3>
      <p>Boatcheckin provides software tools for charter operators to capture, organize, hash, and retain the documentation that their operation requires. The Services are a <strong>recordkeeping platform</strong>: they document decisions and actions that Operators and Captains make; they do not make those decisions or take those actions.</p>

      <h3><span className="sec">3.2</span>What Boatcheckin is not</h3>
      <p>The Services are <strong>not</strong>: (a) legal advice or a substitute for advice from a licensed attorney; (b) insurance or a substitute for insurance; (c) a safety certification, compliance certification, or attestation of any kind; (d) a booking, dispatch, or reservation platform; or (e) a substitute for the judgment, credentials, or authority of a licensed Captain.</p>

      <h3><span className="sec">3.3</span>Free tier</h3>
      <p>We offer a free tier of the Services. The free tier is provided on an as-available basis and may be limited, changed, suspended, or discontinued at our discretion, subject to the notice provisions of §13. Features available on the free tier may change over time; Operators using free features do not acquire a perpetual right to any specific feature.</p>

      <h3><span className="sec">3.4</span>Beta and preview features</h3>
      <p>We may designate certain features as "beta," "preview," "experimental," or similar. Beta features are provided <span className="allcaps">as-is</span> and without warranty of any kind; they may be unreliable, may be changed or withdrawn without notice, and should not be relied upon for production or safety-critical workflows.</p>

      <h2 id="s4"><span className="sec">§ 4</span>Your account</h2>
      <h3><span className="sec">4.1</span>Eligibility</h3>
      <p>To use the Services, you must be at least 18 years old and legally capable of entering into a binding contract in your jurisdiction. You must not be barred from receiving the Services under the laws of the United States or any applicable jurisdiction.</p>

      <h3><span className="sec">4.2</span>Accuracy</h3>
      <p>You agree to provide accurate, current, and complete information when creating your account, and to keep that information current. We may suspend or terminate accounts with materially false or misleading information.</p>

      <h3><span className="sec">4.3</span>Security</h3>
      <p>You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. Notify us immediately at <a className="inline" href="mailto:security@boatcheckin.com">security@boatcheckin.com</a> if you believe your account has been compromised.</p>

      <h3><span className="sec">4.4</span>Authorized users</h3>
      <p>If you invite crew members, captains, or dispatch staff to your account, you remain responsible for their use of the Services and for ensuring they are aware of and comply with these Terms.</p>

      <h2 id="s5"><span className="sec">§ 5</span>Fees, billing, and free tier</h2>
      <h3><span className="sec">5.1</span>Fees</h3>
      <p>Paid plans are billed at the rates published on our pricing page or as otherwise agreed with you in writing. Unless stated otherwise, fees are in US dollars and exclusive of taxes.</p>

      <h3><span className="sec">5.2</span>Automatic renewal</h3>
      <p>Paid plans renew automatically at the end of each billing period at the then-current rate, unless you cancel before the renewal date. You can cancel from the Operator dashboard at any time; cancellation takes effect at the end of the current billing period and you retain access until then. No refunds are issued for partial periods except as required by applicable law.</p>

      <h3><span className="sec">5.3</span>Changes to pricing</h3>
      <p>We may change pricing with at least 30 days' advance notice to Operators on paid plans. If you do not agree to a price change, you may cancel before the change takes effect; continuing the subscription constitutes acceptance.</p>

      <h3><span className="sec">5.4</span>Taxes</h3>
      <p>You are responsible for all taxes associated with your use of the Services, other than taxes on our net income.</p>

      <h3><span className="sec">5.5</span>Chargebacks</h3>
      <p>If you dispute a charge with your card issuer or bank, we may suspend your account pending resolution. We ask that you contact us at <a className="inline" href="mailto:support@boatcheckin.com">support@boatcheckin.com</a> before initiating a chargeback so we can resolve issues directly.</p>

      <h2 id="s6"><span className="sec">§ 6</span>Your responsibilities as an Operator</h2>
      <p>Use of the Services involves responsibilities that remain entirely with you. By using the Services, you agree to each of the following.</p>

      <h3><span className="sec">6.1</span>Compliance with law</h3>
      <p>You are solely responsible for your compliance with all applicable federal, state, and local laws, including but not limited to: US Coast Guard regulations, Florida Fish and Wildlife Conservation Commission rules, Florida Statutes Chapter 327, federal and state electronic signature law, telecommunications consumer protection law, and privacy and data protection law applicable to your Guests. Use of Boatcheckin does not constitute, substitute for, or certify compliance with any of these.</p>

      <h3><span className="sec">6.2</span>Licensed operation</h3>
      <p>If your use of the Services involves operating a vessel for hire, carrying passengers, or renting vessels, you represent and warrant that you hold all credentials, licenses, permits, registrations, insurance, and authorizations required by applicable law to conduct those activities.</p>

      <h3><span className="sec">6.3</span>Waiver and briefing content</h3>
      <p>You are solely responsible for the waiver text, safety briefing content, and other operator-authored materials you configure or publish through the Services, and for their legality, accuracy, and enforceability under applicable law. Boatcheckin does not author, review, endorse, or attest to the sufficiency of Operator Content.</p>

      <h3><span className="sec">6.4</span>Captain authority</h3>
      <p>Nothing in the Services displaces the authority and responsibility of the licensed Captain for the safe operation of the vessel. Go/no-go decisions, route selection, weather calls, passenger-count decisions, and the decision to depart, divert, or return to port are the Captain's alone.</p>

      <h3><span className="sec">6.5</span>Guest data and notices</h3>
      <p>You are responsible for collecting Guest information lawfully, for providing any privacy notices your jurisdiction requires, and for responding to Guest requests to exercise rights over their personal data where you are the controller of that data. We will support you in responding; we do not act on Guest rights requests unilaterally with respect to data you control.</p>

      <h3><span className="sec">6.6</span>Acceptable Use</h3>
      <p>Your use of the Services must comply with our <a className="inline" href="/acceptable-use">Acceptable Use Policy</a>, which is incorporated into these Terms by reference.</p>

      <h2 id="s7"><span className="sec">§ 7</span>Content and intellectual property</h2>
      <h3><span className="sec">7.1</span>Operator Content ownership</h3>
      <p>You retain all rights, title, and interest in Operator Content. By submitting Operator Content to the Services, you grant Boatcheckin a worldwide, non-exclusive, royalty-free license to host, copy, transmit, display, and process Operator Content solely for the purpose of providing and improving the Services, and as otherwise permitted by our <a className="inline" href="/privacy">Privacy Policy</a>.</p>

      <h3><span className="sec">7.2</span>Our intellectual property</h3>
      <p>Boatcheckin, boatcheckin.com, the Boatcheckin application, our logos, and our underlying software and design are owned by Oakmont Logic LLC or our licensors and are protected by intellectual property laws. We grant you a limited, revocable, non-transferable, non-sublicensable license to access and use the Services in accordance with these Terms. No other rights are granted by implication, estoppel, or otherwise.</p>

      <h3><span className="sec">7.3</span>Feedback</h3>
      <p>If you provide feedback, suggestions, or ideas about the Services, you grant Boatcheckin a perpetual, irrevocable, worldwide, royalty-free license to use and incorporate that feedback without attribution or compensation. You are not required to provide feedback, but if you do, it is provided without expectation of any confidential relationship.</p>

      <h3><span className="sec">7.4</span>Trademark</h3>
      <p>"Boatcheckin" and the Boatcheckin logo are trademarks of Oakmont Logic LLC. You may not use them without our prior written consent, except to accurately identify the Services in compliance with applicable law.</p>

      <h2 id="s8"><span className="sec">§ 8</span>Third-party services</h2>
      <p>The Services may integrate with, link to, or rely on services provided by third parties — including booking platforms, payment processors, SMS and email delivery networks, mapping providers, identity verification services, and insurance agents or brokers. Third-party services are provided by those third parties under their own terms and privacy notices. We are not responsible for, and make no representations about, the availability, security, content, or practices of third-party services. Your use of third-party services is at your own risk.</p>

      <div className="callout info">
        <div className="callout-tag info">Insurance partners</div>
        <p>Where the Services reference insurance products, those products are offered, underwritten, and serviced by licensed insurance agents and carriers — not by Boatcheckin. Boatcheckin does not sell, solicit, negotiate, bind, or service insurance. Where a referral relationship exists, Boatcheckin receives a fixed fee regardless of whether a policy is purchased. Any insurance relationship is between you and the licensed agent or carrier.</p>
      </div>

      <h2 id="s9"><span className="sec">§ 9</span>Maritime context</h2>
      <p>The Services support activities that may be subject to federal maritime law, admiralty jurisdiction, and state charter regulation. You acknowledge and agree that:</p>
      <ul>
        <li><strong>Nothing in the Services is admiralty or maritime legal advice.</strong> Maritime law is specialized; consult a licensed admiralty attorney for questions about liability, limitation of liability, waivers of admiralty jurisdiction, and claims under federal maritime statutes.</li>
        <li><strong>Waiver enforceability varies.</strong> Courts have evaluated the enforceability of passenger waivers differently in maritime and non-maritime contexts, and the law continues to evolve. Boatcheckin captures and hashes the waiver text you provide; we do not attest to its enforceability in any jurisdiction or against any claim type.</li>
        <li><strong>Statutory liability limitations are not ours to invoke on your behalf.</strong> If you are entitled to protections such as those under the Shipowner's Limitation of Liability Act or analogous statutes, invoking them requires specific legal action; the Services do not initiate, maintain, or administer such actions for you.</li>
        <li><strong>The Captain remains the Captain.</strong> No feature of the Services operates a vessel, makes navigational decisions, or assumes any of the statutory responsibilities of the licensed Captain or Master.</li>
      </ul>

      <h2 id="s10"><span className="sec">§ 10</span>Disclaimers</h2>
      <div className="callout critical">
        <div className="callout-tag">Read this section carefully</div>
        <p>THE FOLLOWING DISCLAIMERS AFFECT YOUR LEGAL RIGHTS AND LIMIT WHAT YOU CAN RECOVER FROM US. BY USING THE SERVICES YOU ACCEPT THEM. SOME JURISDICTIONS DO NOT ALLOW CERTAIN DISCLAIMERS, AND IN THOSE JURISDICTIONS THE DISCLAIMERS APPLY TO THE MAXIMUM EXTENT PERMITTED BY LAW.</p>
      </div>

      <h3><span className="sec">10.1</span>Services provided as-is</h3>
      <p><span className="allcaps">The services are provided "as is" and "as available," with all faults, and without warranty of any kind, express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, non-infringement, title, accuracy, reliability, and quiet enjoyment. Without limiting the foregoing, we do not warrant that the services will be uninterrupted, error-free, timely, secure, or free from viruses or other harmful components; that any data will be preserved without loss; or that the services will meet your specific requirements.</span></p>

      <h3><span className="sec">10.2</span>No legal, compliance, or safety certification</h3>
      <p><span className="allcaps">Boatcheckin does not provide legal advice, does not certify compliance with any statute, regulation, or standard, does not attest to the enforceability of any document produced through the services, and does not provide safety advice or a guarantee of any safety outcome. Use of the services does not establish an attorney-client, insurance broker, or safety-consultant relationship.</span></p>

      <h3><span className="sec">10.3</span>No insurance</h3>
      <p><span className="allcaps">Boatcheckin does not sell, solicit, negotiate, bind, or service insurance. Any insurance product referenced in the services is offered by a licensed agent and carrier, and your relationship with respect to that insurance is with those parties, not with Boatcheckin.</span></p>

      <h3><span className="sec">10.4</span>No substitute for captain's judgment</h3>
      <p><span className="allcaps">You acknowledge that no feature of the services replaces the judgment of a licensed captain, displaces the authority of the master of the vessel, or assumes responsibility for decisions regarding safe operation of any vessel.</span></p>

      <h2 id="s11"><span className="sec">§ 11</span>Limitation of liability</h2>

      <h3><span className="sec">11.1</span>Excluded damages</h3>
      <p><span className="allcaps">To the maximum extent permitted by applicable law, in no event will Boatcheckin, our affiliates, officers, directors, employees, agents, licensors, or service providers be liable for any indirect, incidental, special, consequential, exemplary, or punitive damages, or for any loss of profits, revenue, business, goodwill, data, or use, or any damages resulting from bodily injury, death, or property damage, arising out of or relating to the services, whether based on contract, tort (including negligence), strict liability, product liability, or any other theory, and whether or not we have been advised of the possibility of such damages.</span></p>

      <h3><span className="sec">11.2</span>Aggregate cap</h3>
      <p><span className="allcaps">To the maximum extent permitted by applicable law, the aggregate liability of Boatcheckin and our affiliates arising out of or relating to the services, whether in contract, tort, or any other theory, will not exceed the greater of (a) the total amount paid by you to Boatcheckin in the twelve (12) months immediately preceding the event giving rise to the claim, or (b) one hundred US dollars ($100.00).</span></p>

      <h3><span className="sec">11.3</span>Basis of the bargain</h3>
      <p>You acknowledge that the fees we charge, including the availability of the free tier, reflect the allocation of risk set out in §10 and §11, and that these provisions are an essential basis of the bargain between you and us. These limitations will apply even if a remedy fails its essential purpose.</p>

      <h3><span className="sec">11.4</span>Exceptions</h3>
      <p>Nothing in these Terms excludes or limits liability that cannot be excluded or limited under applicable law, including liability for death or personal injury caused by our gross negligence or willful misconduct, or liability for fraud.</p>

      <h2 id="s12"><span className="sec">§ 12</span>Indemnification</h2>
      <p>You agree to defend, indemnify, and hold harmless Boatcheckin, our affiliates, and our respective officers, directors, employees, and agents from and against any claims, demands, actions, liabilities, damages, losses, costs, and expenses (including reasonable attorneys' fees) arising out of or relating to: (a) your use of the Services; (b) your Operator Content, including the waiver text and safety briefing content you configure; (c) your breach of these Terms, the Acceptable Use Policy, or any representation or warranty made by you; (d) your violation of applicable law, including maritime, charter, insurance, privacy, or consumer-protection law; (e) your operation of a vessel; or (f) any claim brought by a Guest or third party arising from your acts or omissions.</p>
      <p>We reserve the right, at our own expense, to assume the exclusive defense and control of any matter otherwise subject to indemnification by you, in which event you agree to cooperate with our defense. You may not settle any matter without our prior written consent.</p>

      <h2 id="s13"><span className="sec">§ 13</span>Suspension and termination</h2>
      <h3><span className="sec">13.1</span>Termination by you</h3>
      <p>You may terminate your account at any time through the Operator dashboard or by emailing <a className="inline" href="mailto:support@boatcheckin.com">support@boatcheckin.com</a>. Termination takes effect on the date requested or, if not specified, on receipt.</p>

      <h3><span className="sec">13.2</span>Termination or suspension by us</h3>
      <p>We may suspend or terminate your access to the Services, in whole or in part, at any time if we reasonably determine that: (a) you have breached these Terms or the Acceptable Use Policy; (b) your use of the Services poses a security, legal, or reputational risk; (c) we are required to do so by law or by a governmental request; or (d) we cease to offer the Services generally. Where feasible and not prohibited by law, we will provide notice and a reasonable opportunity to cure curable breaches.</p>

      <h3><span className="sec">13.3</span>Effect of termination</h3>
      <p>On termination, your right to access and use the Services ends, but the following survive: §6 (your responsibilities for records you created), §7 (IP), §10–12 (disclaimers, liability, indemnification), §14–19, and any other provision that by its nature should survive termination.</p>

      <h3><span className="sec">13.4</span>Data export and retention after termination</h3>
      <p>For a period of 30 days following termination, you may export your Trip Records and Operator Content through the Services. After that period, we may delete your data subject to the retention schedule in our <a className="inline" href="/privacy">Privacy Policy</a>. Compliance records subject to statutory retention requirements may be retained beyond termination for the period the applicable statute requires.</p>

      <h2 id="s14"><span className="sec">§ 14</span>Dispute resolution and arbitration</h2>

      <div className="callout critical">
        <div className="callout-tag">Arbitration &amp; class waiver</div>
        <p>THIS SECTION REQUIRES YOU AND BOATCHECKIN TO RESOLVE DISPUTES THROUGH INDIVIDUAL ARBITRATION RATHER THAN IN COURT, AND IT WAIVES YOUR RIGHT TO PARTICIPATE IN A CLASS ACTION. READ IT CAREFULLY.</p>
      </div>

      <h3><span className="sec">14.1</span>Informal resolution first</h3>
      <p>Before initiating arbitration, the parties will attempt to resolve any dispute by informal negotiation. A party must send written notice of the dispute to <a className="inline" href="mailto:legal@boatcheckin.com">legal@boatcheckin.com</a> (or to the address on the account, if we are the noticing party), describing the claim and the relief requested. The parties will attempt in good faith to resolve the dispute within sixty (60) days.</p>

      <h3><span className="sec">14.2</span>Binding arbitration</h3>
      <p>If informal resolution fails, any dispute, claim, or controversy arising out of or relating to these Terms or the Services ("<strong>Dispute</strong>") will be resolved exclusively by binding individual arbitration administered by the American Arbitration Association ("<strong>AAA</strong>") under its Commercial Arbitration Rules then in effect, as modified by these Terms. The arbitration will be conducted in English, seated in Pinellas County, Florida, or by video conference at the claimant's election. Judgment on the award may be entered in any court having jurisdiction.</p>

      <h3><span className="sec">14.3</span>Class action waiver</h3>
      <p><span className="allcaps">You and Boatcheckin each agree that any dispute will be resolved only on an individual basis. Neither party will participate in a class action, class arbitration, collective action, or representative action, and the arbitrator may not consolidate more than one party's claims or preside over any form of representative proceeding. If this waiver is found unenforceable with respect to a particular claim or remedy, that claim or remedy will be severed and resolved in court, and the remainder of this §14 will apply to all other claims.</span></p>

      <h3><span className="sec">14.4</span>Exceptions</h3>
      <p>The following are not subject to arbitration: (a) claims for injunctive or equitable relief to protect intellectual property rights; (b) small-claims actions that qualify for small-claims court and proceed on an individual (non-class) basis; and (c) any claim that cannot be arbitrated under applicable law.</p>

      <h3><span className="sec">14.5</span>Fees and costs</h3>
      <p>The allocation of arbitration fees is governed by the AAA rules. Each party bears its own attorneys' fees except where a statute or the arbitrator awards otherwise.</p>

      <h3><span className="sec">14.6</span>Opt-out</h3>
      <p>You may opt out of this arbitration agreement by sending written notice to <a className="inline" href="mailto:legal@boatcheckin.com">legal@boatcheckin.com</a> within thirty (30) days of first accepting these Terms. The notice must identify you, your account, and state that you opt out of arbitration. Opt-outs are irrevocable and apply only to you individually.</p>

      <h2 id="s15"><span className="sec">§ 15</span>Governing law and venue</h2>
      <p>These Terms are governed by and construed in accordance with the laws of the <strong>State of Florida</strong>, United States, without regard to its conflict-of-laws rules, except where federal maritime law applies to a particular claim, in which case federal maritime law governs that claim. The United Nations Convention on Contracts for the International Sale of Goods does not apply.</p>
      <p>For disputes not subject to arbitration under §14, the parties submit to the exclusive jurisdiction of the state and federal courts located in Pinellas County, Florida.</p>

      <h2 id="s16"><span className="sec">§ 16</span>Changes to these Terms</h2>
      <p>We may modify these Terms from time to time. When we make material changes, we will give at least 30 days' advance notice through the Services, by email to registered Operators, or by posting an updated version with a new Effective Date. Non-material changes take effect when posted. Your continued use of the Services after the effective date of a change constitutes acceptance of the updated Terms. If you do not agree, your remedy is to stop using the Services and, if applicable, cancel your account.</p>

      <h2 id="s17"><span className="sec">§ 17</span>Notices</h2>
      <p>Notices to you may be sent to the email associated with your account or posted within the Services; notice is deemed given when sent or posted. Notices to us must be sent to <a className="inline" href="mailto:legal@boatcheckin.com">legal@boatcheckin.com</a> with a copy by US mail to the mailing address on this page; notice is deemed given on receipt.</p>

      <h2 id="s18"><span className="sec">§ 18</span>Miscellaneous</h2>
      <h3><span className="sec">18.1</span>Entire agreement</h3>
      <p>These Terms, together with the documents they incorporate, constitute the entire agreement between you and Boatcheckin regarding the Services and supersede all prior agreements and understandings on that subject.</p>

      <h3><span className="sec">18.2</span>Severability</h3>
      <p>If any provision is held invalid or unenforceable, that provision will be enforced to the maximum extent permitted, and the remaining provisions will remain in full force.</p>

      <h3><span className="sec">18.3</span>No waiver</h3>
      <p>Our failure to enforce any provision is not a waiver of that provision or of any other provision.</p>

      <h3><span className="sec">18.4</span>Assignment</h3>
      <p>You may not assign or transfer these Terms without our prior written consent. We may assign these Terms to an affiliate or in connection with a merger, acquisition, reorganization, or sale of substantially all of our assets.</p>

      <h3><span className="sec">18.5</span>Force majeure</h3>
      <p>We are not liable for any failure or delay in performance caused by events beyond our reasonable control, including natural disasters, severe weather, acts of war or terrorism, government actions, labor disputes, internet or utility outages, or third-party failures.</p>

      <h3><span className="sec">18.6</span>Relationship</h3>
      <p>The parties are independent contractors. Nothing in these Terms creates a partnership, joint venture, agency, or employment relationship.</p>

      <h3><span className="sec">18.7</span>Third-party beneficiaries</h3>
      <p>These Terms do not confer any rights on any third party, except that our affiliates and service providers are intended beneficiaries of §10, §11, and §12.</p>

      <h3><span className="sec">18.8</span>Export controls and sanctions</h3>
      <p>You may not use the Services in violation of US export-control laws or in a jurisdiction subject to US sanctions. You represent that you are not on a US government denied-party or sanctioned-party list.</p>

      <h3><span className="sec">18.9</span>US government users</h3>
      <p>The Services are "commercial items" as defined in FAR 2.101, and use by US government customers is subject to the restrictions of this commercial license.</p>

      <h2 id="s19"><span className="sec">§ 19</span>Contact us</h2>
      <p>For legal notices, questions about these Terms, or to exercise any right described above, contact us.</p>

      <div className="contact-block">
        <h3>Boatcheckin · Legal</h3>
        <p><strong>Email</strong><br/><a href="mailto:legal@boatcheckin.com">legal@boatcheckin.com</a></p>
        <p style={{ marginTop: '14px' }}><strong>Mail</strong><br/>Oakmont Logic LLC · Attn: Legal<br/>7901 4th St N, #8722<br/>St. Petersburg, FL 33702 · United States</p>
        <p style={{ marginTop: '14px' }}><strong>Service of process</strong><br/>Service of process should be directed to Oakmont Logic LLC's registered agent in its state of formation.</p>
      </div>

    </div>
  </div>
</section>
    </>
  )
}
