import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About — Boatcheckin',
  description: 'Boatcheckin is recordkeeping software for charter operators. Built for captains who want a clean record of every trip — before anyone has to ask.',
}

export default function AboutPage() {
  return (
    <>
      {/*  ═══ DATELINE ═══  */}
<div className="dateline">
  <div className="container">
    <div className="dateline-inner">
      <div><span className="dl-dot">●</span> ABOUT — BOATCHECKIN</div>
      <div>ST. PETERSBURG · FLORIDA</div>
      <div id="todayDate">CAPTAIN'S LOG — TODAY</div>
    </div>
  </div>
</div>

{/*  ═══ HERO ═══  */}
<section className="page-hero">
  <div className="container">
    <span className="eyebrow">About Boatcheckin</span>
    <h1>
      A clean record<br/>
      of every trip.<br/>
      <em>That's the whole idea.</em>
    </h1>
    <p className="lede">
      Boatcheckin is recordkeeping software for charter operators. We help captains document the waivers, safety briefings, manifests, and audit trail that a regulator, an insurer, or an attorney might eventually ask to see without paper clipboards, without chaos at the dock, and without handing an operator's discretion over to a piece of software.
    </p>
  </div>
</section>

{/*  ═══ WHAT WE ARE ═══  */}
<section className="block" style={{ paddingTop: '48px' }}>
  <div className="container">
    <div className="two-col">
      <div>
        <span className="eyebrow sea">What Boatcheckin is</span>
        <h2 className="section-title">Documentation,<br/><em>not a replacement</em><br/>for the captain.</h2>
      </div>
      <div className="prose">
        <p><strong>Boatcheckin is a purpose-built recordkeeping layer for the moments between a booking confirmation and lines off the dock.</strong> One shareable trip link goes out; every guest self-registers, signs a waiver the operator chose, and acknowledges each safety item before boarding. The captain starts the trip when the record is clean.</p>
       <p>Everything a regulator, insurer, or attorney might ask about who was aboard, what they were told, what they agreed to, and when is captured, hashed, timestamped, and retained on file. The software doesn't draft waivers, interpret statutes, or make operational calls. Operators direct; Boatcheckin records.</p>
        <p>We are a software platform, not a law firm, not an insurance broker, and not a certifying body. The captain is still the captain of the vessel. We just make sure nothing about the trip disappears into a damp clipboard.</p>
      </div>
    </div>
  </div>
</section>

{/*  ═══ WHAT WE DO — 2x2 FLOW ═══  */}
<section className="block" style={{ paddingTop: '32px' }}>
  <div className="container">
    <div className="section-header">
      <span className="eyebrow">What we do, in four verbs</span>
      <h2 className="section-title">Document. Organize. Retain. <em>Prove.</em></h2>
      <p className="section-sub">Every feature in Boatcheckin maps to one of these four. If a feature doesn't strengthen the record, it doesn't ship.</p>
    </div>

    <div className="flow-grid">
      <div className="flow-cell">
        <span className="fc-num">01</span>
        <span className="fc-label">Document</span>
        <div className="fc-title">Capture the trip, the people, and their consent.</div>
       <div className="fc-body">Guest identity, emergency contact, waiver signature, safety-card acknowledgments, captain attestations. Collected once, per trip, from the guest's own phone no app install, no friction.</div>
      </div>
      <div className="flow-cell">
        <span className="fc-num">02</span>
        <span className="fc-label">Organize</span>
        <div className="fc-title">Keep the record shaped the way an auditor reads it.</div>
        <div className="fc-body">Per trip. Per vessel. Per operator. Manifests generated in USCG format. Per-card briefing delivery with timestamps. Everything exportable as PDF or CSV on demand, without support tickets.</div>
      </div>
      <div className="flow-cell">
        <span className="fc-num">03</span>
        <span className="fc-label">Retain</span>
        <div className="fc-title">Hold the record as long as the operator's statute requires.</div>
        <div className="fc-body">Compliance-relevant records are retained for the period the operator's jurisdiction specifies. Marketing-linked data is cleared on a rolling 90-day cycle unless guests opt in. Every retention window is exportable before it closes.</div>
      </div>
      <div className="flow-cell">
        <span className="fc-num">04</span>
        <span className="fc-label">Prove</span>
        <div className="fc-title">Show the record is what it was when the trip happened.</div>
       <div className="fc-body">Waiver and attestation records are cryptographically hashed any modification is detectable. Every state change is logged. When a question comes two years later, the answer is already on file, with its integrity intact.</div>
      </div>
    </div>
  </div>
</section>

{/*  ═══ WHO WE SERVE ═══  */}
<section style={{ padding: '48px 0 72px', background: 'var(--paper)', position: 'relative', zIndex: 1 }}>
  <div className="container">
    <div className="section-header">
      <span className="eyebrow brass">Who we serve</span>
      <h2 className="section-title">Operators who carry<br/>the <em>responsibility</em> themselves.</h2>
     <p className="section-sub">Boatcheckin is built for the small end of the charter fleet where the captain, the owner, and the compliance officer are often the same person. The tooling scales up, but the first user we design for is the one standing on the dock at 0630 with a clipboard in one hand and coffee in the other.</p>
    </div>

    <div className="audience-grid">
      <div className="aud-card">
        <span className="aud-tag">Tier One</span>
        <div className="aud-title">Solo <em>captains.</em></div>
       <div className="aud-body">Licensed captains running one vessel, often charter-by-charter through a booking platform. They carry every obligation personally and they get Boatcheckin free, without time limit.</div>
        <ul className="aud-list">
          <li>Unlimited trips and guests</li>
          <li>Core recordkeeping features</li>
          <li>No credit card, no expiration</li>
        </ul>
      </div>

      <div className="aud-card featured">
        <span className="aud-tag">Tier Two</span>
        <div className="aud-title">Small charter <em>companies.</em></div>
       <div className="aud-body">Two to ten vessels, a small dispatch operation, multiple captains on the schedule. The record has to be consistent across crew which is where clipboards start to show gaps.</div>
        <ul className="aud-list">
          <li>Multi-boat, multi-captain dashboards</li>
          <li>Role-based access within the operator</li>
          <li>Branded guest-facing experience</li>
        </ul>
      </div>

      <div className="aud-card">
        <span className="aud-tag">Tier Three</span>
        <div className="aud-title">Marinas &amp; <em>fleets.</em></div>
       <div className="aud-body">Marinas and fleet operators who need a trip record across many captains and many hulls and who answer to a commercial insurer, a property owner, or a port authority when something happens.</div>
        <ul className="aud-list">
          <li>Fleet-level reporting &amp; exports</li>
          <li>Single record across all vessels</li>
          <li>Commercial pilot program on request</li>
        </ul>
      </div>
    </div>
  </div>
</section>

{/*  ═══ WHY WE BUILT IT ═══  */}
<section className="block" style={{ background: 'var(--paper-warm)', borderTop: '1px solid var(--line-soft)', borderBottom: '1px solid var(--line-soft)', zIndex: 1, position: 'relative' }}>
  <div className="container">
    <div className="two-col">
      <div>
        <span className="eyebrow">Why we built it</span>
        <h2 className="section-title">The answer to<br/>&quot;where is the paperwork&quot;<br/><em>should never be</em><br/>&quot;somewhere on the boat.&quot;</h2>
      </div>
      <div className="prose">
       <p>Most charter operators we've talked to can describe, in detail, the one bad moment that changed how they think about documentation. A guest made a claim months after a trip. An insurer asked for the signed waiver. A regulator wanted the manifest from a specific date. And the record if it existed at all was a water-stained page in a binder under the helm seat, or a photo buried in a captain's camera roll.</p>
       <p>Charter operators don't lack diligence. They lack <strong>a place for the diligence to land</strong> something that captures the briefing, the signature, and the head count at the moment they happen, and keeps them in a shape the next person who asks can actually read.</p>
       <p>That's the gap Boatcheckin fills. Not insurance. Not legal advice. Not a replacement for good judgment on the water. Just a clean record, kept the way a small operation needs it kept before anyone has to ask.</p>
      </div>
    </div>
  </div>
</section>

{/*  ═══ PRINCIPLES (DARK) ═══  */}
<section className="principles">
  <div className="container">
    <div className="section-header">
      <span className="eyebrow light">How we think about our work</span>
      <h2 className="section-title">Five principles<br/>we hold to <em>on purpose.</em></h2>
      <p className="section-sub">These aren't values in the brochure sense. They're the decisions we've had to make more than once, written down so we don't have to make them again.</p>
    </div>

    <div className="principle-stack">
      <div className="principle-item">
        <div className="p-num">I.</div>
        <div>
          <div className="p-title">Operator-first, always.</div>
         <div className="p-body">The captain is the operator of record. We don't route around that. Every feature either serves the captain's judgment or gets out of the way. Guests are served because the operator chooses to serve them not because Boatcheckin demands it.</div>
        </div>
      </div>

      <div className="principle-item">
        <div className="p-num">II.</div>
        <div>
          <div className="p-title">Evidence, not advice.</div>
          <div className="p-body">We record what operators direct. We don't draft waivers, interpret statutes, or tell a captain what to say at the briefing. Those are the operator's decisions, reviewed with the operator's attorney. Our job is to hold the record of what was decided.</div>
        </div>
      </div>

      <div className="principle-item">
        <div className="p-num">III.</div>
        <div>
          <div className="p-title">Free where it matters.</div>
         <div className="p-body">Solo captains the tier carrying the most personal exposure with the least commercial cushion get Boatcheckin free, with no time limit and no artificial feature gates. That's a structural commitment. Pricing lives further up the stack.</div>
        </div>
      </div>

      <div className="principle-item">
        <div className="p-num">IV.</div>
        <div>
          <div className="p-title">Built to survive two years of silence.</div>
         <div className="p-body">Most records are looked at once, if ever and when they are, it's long after the trip. We design the record to hold up under that kind of delay: hashed for integrity, exportable without us, legible without training, retained for the statutory window.</div>
        </div>
      </div>

      <div className="principle-item">
        <div className="p-num">V.</div>
        <div>
          <div className="p-title">Boring where it counts.</div>
         <div className="p-body">Compliance tooling that tries to feel like a consumer app usually ends up serving neither. We make the dramatic parts fast and the important parts boring manifests look like manifests, waivers look like waivers, and the record reads the way the next person expects it to read.</div>
        </div>
      </div>
    </div>
  </div>
</section>

{/*  ═══ WHAT WE DON'T DO ═══  */}
<section className="not-block">
  <div className="container">
    <div className="section-header" style={{ marginBottom: '40px' }}>
      <span className="eyebrow">What Boatcheckin is not</span>
      <h2 className="section-title">As important as<br/>what <em>we do.</em></h2>
      <p className="section-sub">A lot of the clarity in this product comes from the work we've chosen not to take on. This section is how we state that out loud.</p>
    </div>

    <div className="not-grid">
      <div className="not-list">
        <div className="not-row">
          <div className="not-x">✕</div>
          <div>
            <div className="not-title">Not a law firm.</div>
            <div className="not-body">Nothing on this site is legal advice. Waiver text, briefing content, and operational decisions remain the operator's to author and review with a licensed attorney. Statutory references on our pages are descriptive, not interpretive.</div>
          </div>
        </div>
        <div className="not-row">
          <div className="not-x">✕</div>
          <div>
            <div className="not-title">Not an insurance broker or carrier.</div>
           <div className="not-body">Boatcheckin does not sell, solicit, negotiate, bind, or service insurance. Where insurance partners are referenced, they are licensed agents and carriers we receive a fixed referral fee per qualifying lead, paid regardless of policy outcome.</div>
          </div>
        </div>
        <div className="not-row">
          <div className="not-x">✕</div>
          <div>
            <div className="not-title">Not a certifying body.</div>
           <div className="not-body">Using Boatcheckin does not certify an operator as compliant with any statute. Compliance is the operator's responsibility. Our tooling supports the documentation that compliance requires it does not attest to it on the operator's behalf.</div>
          </div>
        </div>
      </div>

      <div className="not-list">
        <div className="not-row">
          <div className="not-x">✕</div>
          <div>
            <div className="not-title">Not a booking platform.</div>
            <div className="not-body">Boatcheckin sits after the booking, not in it. We integrate with the platforms operators already use for reservations. The trip arrives in our system with a confirmed guest list; what happens next is recordkeeping, not sales.</div>
          </div>
        </div>
        <div className="not-row">
          <div className="not-x">✕</div>
          <div>
            <div className="not-title">Not a substitute for the captain.</div>
           <div className="not-body">No software makes the go/no-go call. No software signs the manifest. No software takes responsibility for what happens on the water. A clean record supports the captain's judgment it does not replace it, and we design so that boundary is never ambiguous.</div>
          </div>
        </div>
        <div className="not-row">
          <div className="not-x">✕</div>
          <div>
            <div className="not-title">Not a data broker.</div>
            <div className="not-body">Guest information belongs to the operator of record and to the guest. We don't sell it. We don't license it. We don't build lookalike audiences from it. Retention follows the statutory window for compliance records and a short cycle for everything else.</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

{/*  ═══ FINAL CTA ═══  */}
<section className="final-cta">
  <div className="container">
    <div className="fca-grid">
      <div>
        <h2 className="fca-h">Now you know us.<br/><em>Let us meet the boat.</em></h2>
        <p className="fca-sub">Set up your first vessel in under 10 minutes. Send your first guest link by tonight. Start the record on a clean page.</p>
      </div>
      <div className="fca-stack">
       <a href="/signup" className="btn">Start Free · 10-min Setup →</a>
        <a href="/contact" className="btn btn-outline">Talk to Us First</a>
      </div>
    </div>
  </div>
</section>

{/*  ═══ FOOTER ═══  */}
    </>
  )
}
