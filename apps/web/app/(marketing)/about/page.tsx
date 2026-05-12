import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About — Boatcheckin',
  description:
    'Boatcheckin is a compliance recordkeeping platform for charter operators. What we do, what we don\'t do, and the operating principles that guide both.',
  openGraph: {
    title: 'About Boatcheckin',
    description: 'Compliance recordkeeping for charter operators. The record is the product.',
    type: 'website',
    url: 'https://boatcheckin.com/about',
  },
}

export default function AboutPage() {
  return (
    <>
      {/* ═══ HERO ═══ */}
      <section className="hero" style={{ paddingBottom: 72 }}>
        <div className="w">
          <div style={{ maxWidth: 800 }}>
            <div className="lbl lbl-inv" style={{ marginBottom: 16 }}>About Boatcheckin</div>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(32px,4.8vw,52px)', fontWeight: 700, color: '#e8e8e0', lineHeight: 1.12, letterSpacing: '-0.02em', marginBottom: 20 }}>
              The record is what we do.<br />Everything else is someone else&rsquo;s job.
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: 'rgba(232,232,224,0.65)', maxWidth: 620, marginBottom: 10 }}>
              Boatcheckin is a compliance recordkeeping platform for charter operators. We capture waivers, safety briefings, manifests, and audit trails for every trip you run. We do not offer legal advice, insurance, compliance certification, or booking services.
            </p>
            <p style={{ fontSize: 14, color: 'rgba(232,232,224,0.35)', marginBottom: 30 }}>
              That last sentence is not a disclaimer. It is how we stay useful.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href="/signup" className="btn btn-gold btn-lg">Start Free</Link>
              <a href="#scope" className="btn btn-ghost btn-lg">Read more</a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SCOPE — WHAT WE DO ═══ */}
      <section className="sec" id="scope">
        <div className="w">
          <div className="lbl">What we do</div>
          <h2>A recordkeeping layer for the hours between booking and boarding.</h2>
          <p className="sec-sub">Positioned after the reservation, before the trip. Built for the documentation moment that most platforms skip entirely.</p>
          <div className="scope-grid">
            <div className="scope-block">
              <h3>The operator directs. Boatcheckin records.</h3>
              <p>One shareable trip link goes out to the booker. Every guest self-registers, signs the waiver the operator chose, and acknowledges each safety item individually before boarding. The captain reviews the manifest at the dock and confirms departure. At that moment, the record is complete and sealed.</p>
              <p>The software captures decisions operators make. It does not make decisions on their behalf. Waiver text, briefing content, go/no-go calls, and passenger-count decisions remain entirely with the operator and captain.</p>
            </div>
            <div className="scope-block">
              <h3>Hash-verified. Retained. Available when asked.</h3>
              <p>Every waiver is SHA-256 hashed at the moment of signing. The exact text the guest saw, their signature, the timestamp, and the device metadata are bound together. Any modification after signing is detectable.</p>
              <p>Compliance records are retained for the period the operator&rsquo;s jurisdiction requires. Default minimum is five years. Every record is exportable as a complete PDF package on demand. When a regulator, insurer, or attorney asks for the documentation from a specific trip 18 months ago, the answer is not in a filing cabinet. It is one search away.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ WHAT IT IS NOT ═══ */}
      <section className="sec sec-alt" id="not">
        <div className="w">
          <div className="lbl">Scope limits</div>
          <h2>What Boatcheckin is not.</h2>
          <p className="sec-sub">These are stated early because they matter to operators making a compliance decision. Clarity about limits is part of the product.</p>
          <div className="not-card-grid">
            {[
              ['Not a law firm', 'Nothing on this site is legal advice. Waiver text, briefing content, and compliance decisions remain yours, reviewed with your licensed attorney. We capture what you decide. We do not decide for you.'],
              ['Not an insurance broker', 'Boatcheckin does not sell, solicit, negotiate, bind, or service insurance. Where insurance partners appear, they are licensed agents and carriers. Boatcheckin receives a fixed referral fee per qualifying lead, regardless of whether a policy is purchased.'],
              ['Not a certifying body', 'Using Boatcheckin does not certify an operator as compliant with any statute. Compliance is the operator\'s responsibility. Our tooling supports the documentation that compliance requires. It does not attest to compliance on your behalf.'],
              ['Not a booking platform', 'Boatcheckin sits after the booking, not in it. We connect to the platforms operators already use for reservations. The trip arrives in our system with a confirmed guest list. What follows is recordkeeping, not sales.'],
              ['Not a substitute for the captain', 'No software makes the go/no-go call. No software signs the manifest. No software takes responsibility for what happens on the water. The captain directs. Boatcheckin records. That boundary is designed to be unambiguous.'],
              ['Not a data broker', 'Guest information belongs to the operator of record and to the guest. We do not sell it, license it, or build advertising profiles from it. Retention follows the statutory window for compliance records and a short rolling cycle for everything else.'],
            ].map(([title, desc]) => (
              <div className="not-card" key={title}>
                <div className="not-x-icon">✕</div>
                <h4>{title}</h4>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FOUR VERBS ═══ */}
      <section className="sec sec-dark" id="verbs">
        <div className="w">
          <div className="lbl lbl-inv">The product in four words</div>
          <h2>Document. Organize. Retain. Prove.</h2>
          <p className="sec-sub">Every feature in Boatcheckin maps to one of these four. If a feature does not strengthen the record, it does not ship.</p>
          <div className="verb-strip">
            <div className="verb-cell">
              <div className="verb-n">01</div>
              <div className="verb-word">Document</div>
              <p>Capture the trip, the people, and their consent. Guest identity, emergency contact, waiver signature, safety-card acknowledgments, captain attestation. Collected from the guest&rsquo;s own phone. No clipboard, no duplicate entry.</p>
            </div>
            <div className="verb-cell">
              <div className="verb-n">02</div>
              <div className="verb-word">Organize</div>
              <p>Keep the record in the shape an auditor expects to read it. Per trip, per vessel, per operator. Manifests in USCG format. Per-card briefing delivery with timestamps. Exportable as PDF or CSV on demand, without support tickets.</p>
            </div>
            <div className="verb-cell">
              <div className="verb-n">03</div>
              <div className="verb-word">Retain</div>
              <p>Hold the record as long as the statute requires. Compliance records retained for the window the operator&rsquo;s jurisdiction specifies, with a five-year minimum default. Marketing-linked data cleared on a rolling 90-day cycle unless guests opt in.</p>
            </div>
            <div className="verb-cell">
              <div className="verb-n">04</div>
              <div className="verb-word">Prove</div>
              <p>Show the record is exactly what it was when the trip happened. Waiver records are SHA-256 hashed. Every state change is logged. When a question arrives two years later, the answer is already on file with its integrity intact.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ WHO WE SERVE ═══ */}
      <section className="sec" id="operators">
        <div className="w">
          <div className="lbl">Who we serve</div>
          <h2>Operators who carry the responsibility themselves.</h2>
          <p className="sec-sub">Built for the small end of the charter fleet, where the captain, owner, and compliance officer are often the same person. The tooling scales, but the first user we design for is the one with the most personal exposure and the least institutional support.</p>
          <div className="tier-grid">
            <div className="tier-card">
              <div className="tier-tag">Solo captains</div>
              <h3>One boat. Free, forever.</h3>
              <p>Licensed captains running one vessel through a booking platform or direct. Carrying every compliance obligation personally. Solo tier has no time limit and no artificial feature gates. The tier with the highest personal exposure gets the lowest price.</p>
              <ul className="tier-list">
                <li>Unlimited trips and guests</li>
                <li>Full guest flow, waivers, captain snapshot</li>
                <li>No credit card required</li>
              </ul>
            </div>
            <div className="tier-card">
              <div className="tier-tag">Charter companies</div>
              <h3>Up to 3 boats. Also free.</h3>
              <p>Small charter operations running two to three vessels with a crew on the schedule. The record has to be consistent across captains. Multi-boat dashboard, captain roster per vessel, seven guest languages with audio briefings.</p>
              <ul className="tier-list">
                <li>Multi-boat dashboard</li>
                <li>Captain roster and credentials</li>
                <li>7 guest languages + audio briefings</li>
              </ul>
            </div>
            <div className="tier-card">
              <div className="tier-tag">Fleets and marinas</div>
              <h3>4+ boats. From $99/month.</h3>
              <p>Resort properties, rental marinas, and commercial fleet operations running 8 or more vessels daily. Dock staff fulfillment, qualification checks for self-drive renters, pre-trip add-on ordering, and FareHarbor webhook integration.</p>
              <ul className="tier-list">
                <li>Unified fleet dashboard</li>
                <li>FareHarbor and booking platform integration</li>
                <li>Dock fulfillment, self-drive qualification</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ ORIGIN / WHY THIS EXISTS ═══ */}
      <section className="sec sec-mid" id="origin">
        <div className="w">
          <div className="lbl">Why this exists</div>
          <h2>The record that should have been there.</h2>
          <div className="origin-inner">
            <p>Most charter operators can describe, precisely, the moment that changed how they think about documentation. Not in general terms. In specific ones.</p>
            <div className="scenario-strip">
              <div className="scenario-row">
                <div className="sr-tag">Scenario 01</div>
                <div className="sr-body">A guest files a personal injury claim four months after a trip. The operator&rsquo;s insurer asks for the signed release and the safety briefing record. The paper waiver is in a binder somewhere on the boat. The guest disputes whether they were told about the no-swimming rule.</div>
              </div>
              <div className="scenario-row">
                <div className="sr-tag">Scenario 02</div>
                <div className="sr-body">A USCG inspection at the dock. The officer asks for the passenger manifest for the previous voyage. The captain has a handwritten list of names. Whether it satisfies 46 CFR §185.506 is now a question the captain has to answer in real time.</div>
              </div>
              <div className="scenario-row">
                <div className="sr-tag">Scenario 03</div>
                <div className="sr-body">An insurer requests documentation for a trip from 14 months ago while evaluating a policy renewal. The relevant paperwork is gone, illegible, or was never created in a form anyone outside the operation could interpret.</div>
              </div>
            </div>
            <p>Charter operators do not lack diligence. They lack <strong>a place for the diligence to land</strong>: something that captures the briefing, the signature, and the head count at the moment they happen, and holds them in a shape the next person who asks can actually use.</p>
            <p>Boatcheckin is that place. Not an improvement on paper. A replacement for it, built around the legal standards the record is eventually measured against.</p>
          </div>
        </div>
      </section>

      {/* ═══ PRINCIPLES ═══ */}
      <section className="sec sec-dark" id="principles">
        <div className="w">
          <div className="lbl lbl-inv">Operating principles</div>
          <h2>Five decisions we have made more than once.</h2>
          <p className="sec-sub">These are not values in the brochure sense. They are decisions written down so they do not have to be made again.</p>
          <div className="prin-grid">
            <div className="prin-card">
              <div className="prin-n">Principle I</div>
              <h4>Operator-first, always</h4>
              <p>The captain is the operator of record. Boatcheckin does not route around that. Every feature either serves the captain&rsquo;s judgment or gets out of the way. Guests are documented because the operator chooses to document them.</p>
            </div>
            <div className="prin-card">
              <div className="prin-n">Principle II</div>
              <h4>Evidence, not advice</h4>
              <p>We record what operators direct. We do not draft waivers, interpret statutes, or tell a captain what to say at the briefing. Those are the operator&rsquo;s decisions, reviewed with their attorney. Our job is to hold the record of what was decided.</p>
            </div>
            <div className="prin-card">
              <div className="prin-n">Principle III</div>
              <h4>Free where it matters most</h4>
              <p>Solo captains carry the most personal exposure with the least commercial cushion. They get Boatcheckin free, without time limit, without artificial feature gates. That is a structural commitment, not a promotional tactic. Pricing lives further up the stack.</p>
            </div>
            <div className="prin-card">
              <div className="prin-n">Principle IV</div>
              <h4>Built to survive two years of silence</h4>
              <p>Most records are looked at once, if ever. When they are, it is long after the trip. We design the record to hold up under that delay: hashed for integrity, exportable without us, legible without training, retained for the full statutory window.</p>
            </div>
            <div className="prin-card prin-full">
              <div className="prin-n">Principle V</div>
              <h4>Boring where it counts</h4>
              <p>Compliance tooling that tries to feel like a consumer app usually ends up serving neither purpose. We make the dramatic parts fast and the important parts boring. Manifests look like manifests. Waivers look like waivers. The record reads the way the next person who asks for it expects it to read.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ THE ENTITY ═══ */}
      <section className="sec" id="entity">
        <div className="w">
          <div className="lbl">The company</div>
          <h2>Oakmont Logic LLC, doing business as Boatcheckin.</h2>
          <div className="entity-grid">
            <div className="entity-item">
              <h4>Legal entity</h4>
              <p>Oakmont Logic LLC is a limited liability company organized under the laws of Wyoming. Boatcheckin is a product of Oakmont Logic LLC. The company has a Florida mailing address and operates primarily in the Florida charter operator market.</p>
            </div>
            <div className="entity-item">
              <h4>Mailing address</h4>
              <address>
                Oakmont Logic LLC<br />
                7901 4th St N, #8722<br />
                St. Petersburg, FL 33702<br />
                United States
              </address>
            </div>
            <div className="entity-item">
              <h4>Contact</h4>
              <p>
                General: <a href="mailto:hello@boatcheckin.com">hello@boatcheckin.com</a><br />
                Support: <a href="mailto:support@boatcheckin.com">support@boatcheckin.com</a><br />
                Legal: <a href="mailto:legal@boatcheckin.com">legal@boatcheckin.com</a><br />
                Phone: <a href="tel:+17865097869">+1 (786) 509-7869</a>
              </p>
            </div>
          </div>
          <div className="entity-divider" />
          <p style={{ fontSize: 13.5, color: 'var(--muted)', maxWidth: 700, lineHeight: 1.65 }}>
            The legal pages on this site (Privacy Policy, Terms of Service, Acceptable Use Policy, Guest Notice, Cookie Notice, DMCA Policy) govern the use of Boatcheckin and the handling of operator and guest data. Those pages are available in the footer and at each linked URL.
          </p>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="cta">
        <div className="w">
          <div className="lbl lbl-inv" style={{ display: 'block', textAlign: 'center', marginBottom: 12 }}>Ready to start</div>
          <h2>Set up the record. Ready for your next booking.</h2>
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
