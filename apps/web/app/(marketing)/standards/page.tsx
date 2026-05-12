import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Standards — Boatcheckin',
  description:
    'The statutes Boatcheckin is built to support. 46 CFR §185.506, FWC Chapter 327, F.S. §327.54, SB 606, ESIGN Act, UETA. Descriptive references, not legal advice.',
  openGraph: {
    title: 'Compliance Standards — Boatcheckin',
    description:
      'The record we keep, and the statutes it answers to. Statutory references with plain-English descriptions and explicit mapping to what Boatcheckin captures.',
    type: 'website',
    url: 'https://boatcheckin.com/standards',
  },
}

export default function StandardsPage() {
  return (
    <>
      {/* ═══ HERO ═══ */}
      <section className="hero" style={{ paddingBottom: 56 }}>
        <div className="w">
          <div style={{ maxWidth: 760 }}>
            <div className="lbl lbl-inv" style={{ marginBottom: 14 }}>Statutory Alignment</div>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(30px,4.2vw,46px)', fontWeight: 700, color: '#e8e8e0', lineHeight: 1.12, letterSpacing: '-0.02em', marginBottom: 18 }}>
              The record we keep,<br />and the statutes it answers to.
            </h1>
            <p style={{ fontSize: 17, lineHeight: 1.6, color: 'rgba(232,232,224,0.6)', maxWidth: 620 }}>
              Boatcheckin is built around the documentation small-passenger-vessel operators are expected to produce under US federal maritime rules, Florida state charter regulations, and electronic signature law. This page maps each statute to the specific records the software helps you capture, hash, and retain.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ STICKY TOC STRIP ═══ */}
      <div className="toc-strip">
        <div className="toc-inner-scroll">
          <a href="#disclaimer" className="toc-tab">Read first</a>
          <a href="#federal" className="toc-tab">US Federal</a>
          <a href="#florida" className="toc-tab">Florida State</a>
          <a href="#esign" className="toc-tab">ESIGN &amp; UETA</a>
          <a href="#privacy" className="toc-tab">Privacy</a>
          <a href="#not-claimed" className="toc-tab">Scope limits</a>
          <a href="#version" className="toc-tab">Version</a>
        </div>
      </div>

      {/* ═══ DISCLAIMER ═══ */}
      <section className="sec" id="disclaimer" style={{ paddingTop: 40, paddingBottom: 40 }}>
        <div className="w">
          <div className="disclaimer-box">
            <span className="disc-tag">Read this first</span>
            <p><strong>References are descriptive. Not interpretive. Not legal advice.</strong> The statutes, regulations, and standards on this page are cited because they describe the records a Boatcheckin operator is typically expected to keep, not because Boatcheckin attests that any individual operator is compliant with them. Compliance belongs to the operator.</p>
            <p>Each section pairs a plain-English summary of what a statute requires with a clear description of how Boatcheckin supports the corresponding recordkeeping. That mapping is not an opinion on how the statute applies to your operation. For that, consult a licensed attorney familiar with your jurisdiction, vessel class, and charter type.</p>
            <p>Statutes are subject to amendment. The original text, on the issuing body&rsquo;s website, is always authoritative. If we appear to describe a statute in a way that conflicts with its current text, the current text is correct. Please email <a href="mailto:hello@boatcheckin.com">hello@boatcheckin.com</a> so we can correct this page.</p>
          </div>
        </div>
      </section>

      {/* ═══ US FEDERAL ═══ */}
      <section className="sec sec-dark" id="federal">
        <div className="w">
          <div className="lbl lbl-inv">US Federal maritime standards</div>
          <h2>United States Coast Guard and 46 CFR.</h2>
          <p className="sec-sub">The federal baseline for small passenger vessel operations, including the safety instruction and manifest requirements that govern most inspected charters. Applies to operators under US Coast Guard jurisdiction carrying passengers for hire.</p>
          <div className="statute-list">

            <div className="si si-dark">
              <div className="si-hd">
                <span className="si-badge">Federal · 46 CFR</span>
                <span className="si-cite">46 CFR §185.506</span>
              </div>
              <div className="si-bd">
                <div className="si-name">Pre-Departure Safety Orientation</div>
                <div className="si-desc">
                  <p>Small passenger vessel operators are required to provide each passenger with a safety orientation before getting underway. The orientation covers life preserver stowage and use, emergency exits, fire extinguishers, distress signals, and the location of emergency equipment, along with the actions passengers are expected to take in an emergency.</p>
                  <p>The master is responsible for ensuring this instruction occurs on every voyage, for every passenger aboard. A verbal briefing at the dock is effective in the moment but difficult to document after the fact. The record of what was said, to whom, and when is what creates a defensible position after an incident.</p>
                </div>
              </div>
              <div className="si-map">
                <div className="si-map-lbl">How Boatcheckin supports this record</div>
                <div className="si-map-body">Each guest acknowledges a per-topic safety card on their own device before boarding: life preserver location, emergency exits, fire extinguisher, distress signals, and emergency actions. Each acknowledgment is timestamped with delivery method, IP, and user agent. The captain&rsquo;s departure attestation seals the full set into the trip record. <strong>The record shows who was told what, when, and how they confirmed it.</strong></div>
              </div>
            </div>

            <div className="si si-dark">
              <div className="si-hd">
                <span className="si-badge">Federal · USCG</span>
                <span className="si-cite">46 CFR Subchapter T · USCG guidance</span>
              </div>
              <div className="si-bd">
                <div className="si-name">Passenger Manifest Requirements</div>
                <div className="si-desc">
                  <p>Small passenger vessels carrying six or more passengers are typically expected to maintain a passenger list for every trip, including names, date, and voyage identifier. Specific requirements vary by vessel class, route, and Captain of the Port jurisdiction, but the underlying obligation is consistent: the operator must be able to produce a record of who was aboard on a given voyage.</p>
                  <p>This obligation matters most in post-incident review. Coast Guard investigators, insurers, and emergency responders rely on accurate manifests to reconstruct a voyage. A manifest that cannot be produced promptly is not treated differently from a manifest that does not exist.</p>
                </div>
              </div>
              <div className="si-map">
                <div className="si-map-lbl">How Boatcheckin supports this record</div>
                <div className="si-map-body">Every trip generates a USCG-format manifest PDF on demand: vessel name, voyage ID, departure time, captain of record, and every guest who signed in through the trip link. The manifest is filed into the trip record and exportable at any point in the retention window. <strong>Produced in seconds, not searched for later.</strong></div>
              </div>
            </div>

            <div className="si si-dark">
              <div className="si-hd">
                <span className="si-badge">Federal · OUPV / Master</span>
                <span className="si-cite">46 U.S.C. §8104 · USCG licensing framework</span>
              </div>
              <div className="si-bd">
                <div className="si-name">Master&rsquo;s Authority and Operational Responsibility</div>
                <div className="si-desc">
                  <p>The licensed captain, whether an OUPV (Six-Pack) or a Master, holds ultimate authority and responsibility for the vessel, passengers, crew, and operation. No software, no booking platform, and no third party displaces that authority. Go/no-go calls, route decisions, and the decision to put lines off the dock remain the captain&rsquo;s, and the captain&rsquo;s alone.</p>
                </div>
              </div>
              <div className="si-map">
                <div className="si-map-lbl">How Boatcheckin supports this record</div>
                <div className="si-map-body">The captain&rsquo;s decision to start the trip is an explicit, attested action in Boatcheckin: a slide-to-start confirmation, recorded with timestamp and attribution. The software never auto-starts a trip, never clears a checklist on the captain&rsquo;s behalf, and never routes around the master&rsquo;s authority. <strong>The captain directs. Boatcheckin records.</strong></div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══ FLORIDA STATE ═══ */}
      <section className="sec" id="florida">
        <div className="w">
          <div className="lbl">Florida state standards</div>
          <h2>Florida Statutes and FWC Chapter 327.</h2>
          <p className="sec-sub">Florida applies state-specific requirements on top of federal maritime rules, administered primarily by the Florida Fish and Wildlife Conservation Commission. Charter and livery operators face additional obligations under F.S. §327.54.</p>
          <div className="statute-list">

            <div className="si si-light">
              <div className="si-hd">
                <span className="si-badge">Florida · FWC</span>
                <span className="si-cite">Florida Statutes Chapter 327</span>
              </div>
              <div className="si-bd">
                <div className="si-name">Vessel Safety and Boating Safety Identification</div>
                <div className="si-desc">
                  <p>Florida Statutes Chapter 327 is the state&rsquo;s primary vessel safety law, administered by FWC. It covers registration, required safety equipment, operator conduct, and under §327.395 the Boating Safety Identification Card requirement for most operators of vessels of 10 horsepower or greater. Guests who take the helm of a chartered bareboat are often subject to this requirement.</p>
                </div>
              </div>
              <div className="si-map">
                <div className="si-map-lbl">How Boatcheckin supports this record</div>
                <div className="si-map-body">For bareboat charters and self-drive rentals where a guest is expected to operate the vessel, the trip registration prompts for Boating Safety ID details where applicable, captures a record of the check, and ties it to the guest profile and trip manifest. <strong>No surprises at the dock on qualification status.</strong></div>
              </div>
            </div>

            <div className="si si-light">
              <div className="si-hd">
                <span className="si-badge">Florida · Livery</span>
                <span className="si-cite">F.S. §327.54 · SB 606 (2022)</span>
              </div>
              <div className="si-bd">
                <div className="si-name">Livery and Rental Vessel Requirements</div>
                <div className="si-desc">
                  <p>Florida livery operators — businesses that rent or charter vessels — are required under F.S. §327.54 to provide renters with specific pre-operation instruction: operation of the vessel, required safety equipment, local hazards, and applicable state laws. Livery operators must also satisfy recordkeeping requirements on the identity of renters, relevant certifications, and rental terms.</p>
                  <p>Subsequent Florida legislation, including changes under SB 606 of the 2022 session and related amendments, has continued to refine these requirements. Operators are expected to stay current with amendments. Boatcheckin stays aligned to the recordkeeping pattern the statute describes, and this page is reviewed when material amendments occur.</p>
                </div>
              </div>
              <div className="si-map">
                <div className="si-map-lbl">How Boatcheckin supports this record</div>
                <div className="si-map-body">Livery operators can structure the guest flow to include renter identification, equipment-review acknowledgments, vessel-operation instructions, and local-hazard briefings, each captured as a discrete attested item in the trip record. Every item is timestamped and tied to the renter, the vessel, and the rental window. <strong>The paper trail the statute describes, without the paper.</strong></div>
              </div>
            </div>

            <div className="si si-light">
              <div className="si-hd">
                <span className="si-badge">Florida · Insurance</span>
                <span className="si-cite">F.S. §626.112 et seq.</span>
              </div>
              <div className="si-bd">
                <div className="si-name">Insurance Solicitation and Referral Structure</div>
                <div className="si-desc">
                  <p>Florida, like most states, restricts who may sell, solicit, or negotiate insurance, requiring appointment as a licensed agent. Referral arrangements between unlicensed parties and licensed agents are permitted only under specific conditions, including that referral compensation not be contingent on policy purchase.</p>
                </div>
              </div>
              <div className="si-map">
                <div className="si-map-lbl">How Boatcheckin structures referrals</div>
                <div className="si-map-body">Boatcheckin does not sell, solicit, negotiate, bind, or service insurance. Where an insurance product is referenced on the platform, it is offered by a licensed agent and carrier. Boatcheckin receives a fixed referral fee per qualifying lead, paid regardless of whether a policy is purchased. <strong>The customer&rsquo;s relationship is with the licensed agent, not with Boatcheckin.</strong></div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══ ESIGN AND UETA ═══ */}
      <section className="sec sec-dark" id="esign">
        <div className="w">
          <div className="lbl lbl-inv">Electronic signature law</div>
          <h2>ESIGN and UETA: when a digital signature holds up.</h2>
          <p className="sec-sub">Electronic waivers and attestations are legally equivalent to ink-signed ones when the record establishes the signer&rsquo;s identity, intent, consent to use electronic form, and integrity of the document. Boatcheckin is designed to produce records that meet each of those tests.</p>
          <div className="statute-list">

            <div className="si si-dark">
              <div className="si-hd">
                <span className="si-badge">Federal · ESIGN</span>
                <span className="si-cite">15 U.S.C. §7001 et seq.</span>
              </div>
              <div className="si-bd">
                <div className="si-name">Electronic Signatures in Global and National Commerce Act</div>
                <div className="si-desc">
                  <p>The ESIGN Act, signed into federal law in 2000, establishes that electronic signatures and electronic records have the same legal validity as ink signatures and paper records for most interstate commerce transactions, provided the signer consented to electronic form, the identity of the signer can be attributed, and the record is retained in a form that accurately reflects the agreement.</p>
                  <p>Waivers, release-of-liability agreements, and safety acknowledgments signed through Boatcheckin fall within ESIGN&rsquo;s scope for the vast majority of charter transactions.</p>
                </div>
              </div>
              <div className="si-map">
                <div className="si-map-lbl">How Boatcheckin supports the four ESIGN tests</div>
                <div className="si-map-body">
                  <p><strong>Intent:</strong> The signer performs an affirmative signature act — a drawn or typed signature, tied to the specific waiver text they saw.</p>
                  <p><strong>Consent to electronic form:</strong> The guest is shown electronic-records consent language at the start of the flow and confirms acceptance before proceeding.</p>
                  <p><strong>Attribution:</strong> Signature is recorded with timestamp, IP, user agent, and a link to the OTP-verified guest identity.</p>
                  <p><strong>Record integrity:</strong> The completed waiver is SHA-256 hashed at signing. Any post-hoc modification is detectable, and the hash is retained alongside the document for the full retention window.</p>
                </div>
              </div>
            </div>

            <div className="si si-dark">
              <div className="si-hd">
                <span className="si-badge">Florida · UETA</span>
                <span className="si-cite">F.S. Chapter 668, Part I (§668.50)</span>
              </div>
              <div className="si-bd">
                <div className="si-name">Uniform Electronic Transactions Act</div>
                <div className="si-desc">
                  <p>Florida&rsquo;s adoption of UETA, codified at F.S. §668.50, is the state-law counterpart to federal ESIGN. It provides the same foundational rule — that an electronic record or signature cannot be denied legal effect solely because it is electronic — and adds Florida-specific provisions on record retention, original documents, and admissibility as evidence.</p>
                  <p>UETA applies to transactions between parties who have agreed to conduct them electronically, which in charter operations is established by the guest&rsquo;s explicit consent at the start of the trip flow.</p>
                </div>
              </div>
              <div className="si-map">
                <div className="si-map-lbl">How Boatcheckin supports UETA alignment</div>
                <div className="si-map-body">Electronic-records consent is captured explicitly at the start of the guest flow. Retention follows the statutory window for the record type. Records are stored in a form that is retrievable and accurately reproducible throughout the retention window, meeting Florida&rsquo;s retention-of-electronic-records standard under §668.50(12). <strong>The record is admissible because the record is intact.</strong></div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══ PRIVACY AND CONSENT ═══ */}
      <section className="sec" id="privacy">
        <div className="w">
          <div className="lbl">Privacy and consent standards</div>
          <h2>The rules that follow the guest&rsquo;s data, not the vessel.</h2>
          <p className="sec-sub">Because Boatcheckin operates guest-facing flows across jurisdictions and channels, privacy and consent law applies at the layer of each individual guest, not the operator&rsquo;s state alone.</p>
          <div className="statute-list">

            <div className="si si-light">
              <div className="si-hd">
                <span className="si-badge">Federal · TCPA</span>
                <span className="si-cite">47 U.S.C. §227</span>
              </div>
              <div className="si-bd">
                <div className="si-name">Telephone Consumer Protection Act</div>
                <div className="si-desc">
                  <p>The TCPA governs commercial SMS, MMS, and automated voice messages to US phone numbers. Express written consent is required for most marketing messages. Transactional and operational messages related to a confirmed service, such as a trip confirmation, are treated differently but still require consent in most interpretations.</p>
                </div>
              </div>
              <div className="si-map">
                <div className="si-map-lbl">How Boatcheckin structures SMS compliance</div>
                <div className="si-map-body">SMS is used for operational trip messages tied to a guest&rsquo;s confirmed booking: trip link delivery, pre-departure reminders, and captain communication. Marketing SMS requires explicit opt-in tied to the guest record. Operator messages to guests without an existing booking relationship are not supported on the platform.</div>
              </div>
            </div>

            <div className="si si-light">
              <div className="si-hd">
                <span className="si-badge">Federal · CAN-SPAM</span>
                <span className="si-cite">15 U.S.C. §7701 et seq.</span>
              </div>
              <div className="si-bd">
                <div className="si-name">CAN-SPAM Act</div>
                <div className="si-desc">
                  <p>The CAN-SPAM Act sets federal standards for commercial email: clear identification of the sender, accurate subject lines, a physical postal address, and a functional unsubscribe mechanism honored within ten business days.</p>
                </div>
              </div>
              <div className="si-map">
                <div className="si-map-lbl">How Boatcheckin structures email compliance</div>
                <div className="si-map-body">Every operator-sent email carries a clear sender identity, the operator&rsquo;s postal address, and an unsubscribe link. Marketing-linked guest data is cleared on a rolling 90-day cycle unless the guest has opted in to operator communications. Unsubscribe actions take effect immediately.</div>
              </div>
            </div>

            <div className="si si-light">
              <div className="si-hd">
                <span className="si-badge">State and international</span>
                <span className="si-cite">Cal. Civ. Code §1798.100 · EU GDPR · UK GDPR</span>
              </div>
              <div className="si-bd">
                <div className="si-name">CCPA, GDPR, and Guest Data Rights</div>
                <div className="si-desc">
                  <p>Guests from California have rights under the CCPA: access, deletion, and opt-out from sale of personal information. Guests from the European Economic Area and the UK have broader rights under the GDPR: lawful basis, access, rectification, erasure, portability, and restriction. Because charter operators in Florida regularly serve guests from both regions, these rights can apply per-guest even when the vessel never leaves state waters.</p>
                </div>
              </div>
              <div className="si-map">
                <div className="si-map-lbl">How Boatcheckin supports guest data rights</div>
                <div className="si-map-body">Guests can request access, export, or deletion of their personal data through the trip link or by contacting the operator or Boatcheckin directly. Requests are actioned within statutory windows. Compliance-relevant records — signed waivers, safety attestations, manifests — may be exempt from deletion under legal-obligation grounds and are retained for the statutory period the operator&rsquo;s operation requires. <strong>The compliance record stays intact. The marketing layer does not.</strong></div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══ SCOPE LIMITS ═══ */}
      <section className="sec sec-mid" id="not-claimed">
        <div className="w">
          <div className="lbl">Scope limits</div>
          <h2>What Boatcheckin does not claim.</h2>
          <p className="sec-sub" style={{ marginBottom: 28 }}>A standards page that does not include this section is overpromising. These are the lines we do not cross, stated directly.</p>
          <div className="claim-grid">
            <div className="claim-card">
              <h4>We do not certify compliance</h4>
              <p>Using Boatcheckin does not make an operator compliant with any statute. We support the documentation that compliance requires. We do not attest to it on your behalf. No badge or page on this site substitutes for a review of your operation by a competent attorney.</p>
            </div>
            <div className="claim-card">
              <h4>We do not interpret law for your operation</h4>
              <p>Every statute on this page has edge cases, jurisdictional variations, vessel-class distinctions, and court-interpreted nuances that a marketing page cannot responsibly cover. Your attorney can. We describe the statutes plainly. We do not apply them to your specific operation.</p>
            </div>
            <div className="claim-card">
              <h4>We do not draft your waivers</h4>
              <p>Waiver language is specific to the operator, the state, the vessel class, and the activity type. Boatcheckin captures and hashes the text you provide. It does not generate it, review it, or stand behind its enforceability in any jurisdiction. A starter template is scaffolding, not counsel.</p>
            </div>
            <div className="claim-card">
              <h4>We do not replace the captain&rsquo;s judgment</h4>
              <p>No record replaces the go/no-go call. No checklist certifies sea conditions. No software takes responsibility for what happens on the water. Boatcheckin documents what the captain decided. The captain decided it.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ VERSION ═══ */}
      <section className="sec" id="version" style={{ paddingTop: 40, paddingBottom: 40 }}>
        <div className="w">
          <div className="vs-grid">
            <div>
              <div className="vs-lbl">Page version</div>
              <div className="vs-val">v1.0</div>
              <div className="vs-note">Initial publication</div>
            </div>
            <div>
              <div className="vs-lbl">Last reviewed</div>
              <div className="vs-val">May 2026</div>
              <div className="vs-note">Annual review minimum. Reviewed on statute change.</div>
            </div>
            <div>
              <div className="vs-lbl">Found an error?</div>
              <div className="vs-val" style={{ fontSize: 15, marginTop: 2 }}>Email us</div>
              <div className="vs-note">If a statute has been amended in a way that changes this page, email <a href="mailto:hello@boatcheckin.com">hello@boatcheckin.com</a>. The original text on the issuing body&rsquo;s website is always authoritative.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="cta">
        <div className="w">
          <div className="lbl lbl-inv" style={{ display: 'block', textAlign: 'center', marginBottom: 12 }}>Start the record</div>
          <h2>The statutes define the standard.<br />Boatcheckin builds the record.</h2>
          <p>Free for solo captains and charter operators with up to three boats. No credit card required.</p>
          <div className="cta-btns">
            <Link href="/signup" className="btn btn-gold btn-lg">Start Free</Link>
            <Link href="/contact" className="btn btn-ghost btn-lg">Contact us</Link>
          </div>
        </div>
      </section>
    </>
  )
}
