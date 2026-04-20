import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Contact — Boatcheckin',
  description: 'Reach Boatcheckin — general questions, operator support, security disclosures, and legal notices. With the right channel for each.',
}

export default function ContactPage() {
  return (
    <>
      {/*  ═══ DATELINE ═══  */}
<div className="dateline">
  <div className="container">
    <div className="dateline-inner">
      <div><span className="dl-dot">●</span> CONTACT — BOATCHECKIN</div>
      <div>ST. PETERSBURG · FLORIDA</div>
      <div id="todayDate">CAPTAIN'S LOG — TODAY</div>
    </div>
  </div>
</div>

{/*  ═══ HERO ═══  */}
<section className="page-hero">
  <div className="container">
    <span className="eyebrow">Contact</span>
    <h1>
      Reach us —<br/>
      and <em>reach the right<br/>
      place</em> the first time.
    </h1>
    <p className="lede">
      One catch-all inbox is how real questions get buried under newsletter replies. We route by channel: operator support, security disclosures, legal notices, and general questions each go to a queue that expects them. Pick the one that fits, and we'll be in touch.
    </p>
  </div>
</section>

{/*  ═══ CHANNEL GRID ═══  */}
<section className="block" style={{ paddingTop: '24px' }}>
  <div className="container">
    <div className="channel-grid">

      <div className="ch-card">
        <div className="ch-icon">
          <svg viewBox="0 0 24 24"><path d="M3 8l9 6 9-6M3 6h18v12H3z"/></svg>
        </div>
        <span className="ch-tag">Channel · General</span>
        <div className="ch-title">General <em>questions.</em></div>
        <div className="ch-body">For everything that isn't an active support ticket, a security report, or a formal legal notice. Pilot programs, partnership inquiries, media, demo requests, and operators trying to figure out if Boatcheckin is the right fit — this is the inbox.</div>
        <div className="ch-address">
          <a href="mailto:hello@boatcheckin.com" className="ch-email">hello@boatcheckin.com</a>
          <span className="ch-meta">Typical reply · 1 business day</span>
        </div>
      </div>

      <div className="ch-card">
        <div className="ch-icon">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2"/></svg>
        </div>
        <span className="ch-tag">Channel · Operators</span>
        <div className="ch-title">Operator <em>support.</em></div>
        <div className="ch-body">For active customers with a question about a trip, a guest record, an export, billing, or anything under the operator dashboard. Fastest path: sign in to Boatcheckin and use the in-app support button so your account context comes along with the message.</div>
        <div className="ch-address">
          <a href="mailto:support@boatcheckin.com" className="ch-email">support@boatcheckin.com</a>
          <span className="ch-meta">Mon–Fri · Priority for paid plans</span>
        </div>
      </div>

      <div className="ch-card">
        <div className="ch-icon">
          <svg viewBox="0 0 24 24"><path d="M12 3l8 4v6c0 5-3.5 7.5-8 8-4.5-0.5-8-3-8-8V7l8-4z"/></svg>
        </div>
        <span className="ch-tag">Channel · Security</span>
        <div className="ch-title">Security &amp; <em>disclosure.</em></div>
        <div className="ch-body">For responsible-disclosure reports from security researchers and operators who think they've found a vulnerability, data-exposure issue, or abuse pattern. We commit to acknowledging reports within two business days and keeping reporters informed through resolution.</div>
        <div className="ch-address">
          <a href="mailto:security@boatcheckin.com" className="ch-email">security@boatcheckin.com</a>
          <span className="ch-meta">Ack &lt; 2 business days · See /security</span>
        </div>
      </div>

      <div className="ch-card">
        <div className="ch-icon">
          <svg viewBox="0 0 24 24"><path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5"/></svg>
        </div>
        <span className="ch-tag">Channel · Legal</span>
        <div className="ch-title">Legal &amp; <em>notices.</em></div>
        <div className="ch-body">Service of process, DMCA notices, law enforcement requests, data subject requests under CCPA / GDPR, and anything else that belongs on legal letterhead. We reply to valid requests through legal counsel within the statutory window for each notice type.</div>
        <div className="ch-address">
          <a href="mailto:legal@boatcheckin.com" className="ch-email">legal@boatcheckin.com</a>
          <span className="ch-meta">Written notices only · No advice given</span>
        </div>
      </div>

    </div>
  </div>
</section>

{/*  ═══ PRIMARY CONTACT ═══  */}
<section className="block-tight">
  <div className="container">
    <div className="primary-contact">
      <span className="dossier-tag">Ship's Address</span>
      <div className="pc-grid">

        <div>
          <div className="pc-block">
            <span className="pc-label">Phone</span>
            <div className="pc-value"><a href="tel:+17865097869">+1 (786) 509-7869</a></div>
            <span className="pc-note">Business hours, Eastern Time · Not for emergencies on the water</span>
          </div>

          <div className="pc-block">
            <span className="pc-label">Mailing address</span>
            <div className="pc-value">
              <address>
                Boatcheckin<br/>
                7901 4th St N, #8722<br/>
                St. Petersburg, FL 33702<br/>
                United States
              </address>
            </div>
            <span className="pc-note">Mail, service of process, and formal notices</span>
          </div>
        </div>

        <div>
          <div className="pc-block">
            <span className="pc-label">Operating hours</span>
            <div className="pc-value">Mon – Fri · 09:00 – 18:00 ET</div>
            <span className="pc-note">Weekend triage for paid-plan operators via in-app support</span>
          </div>

          <div className="pc-block">
            <span className="pc-label">Response expectations</span>
            <div className="pc-value">1 business day, general<br/>Under 4 hours, paid support</div>
            <span className="pc-note">Security disclosures acknowledged &lt; 2 business days</span>
          </div>
        </div>

      </div>
    </div>
  </div>
</section>

{/*  ═══ RESPONSE EXPECTATIONS ═══  */}
<section className="response-band">
  <div className="container">
    <div style={{ maxWidth: '680px', marginBottom: '40px' }}>
      <span className="eyebrow">What to expect after you write</span>
      <h2 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(28px,3.6vw,40px)', fontWeight: '500', letterSpacing: '-0.025em', lineHeight: '1.1', fontVariationSettings: '"opsz" 144' }}>Response targets, written down so they're <em style={{ fontStyle: 'italic', color: 'var(--rust)' }}>accountable.</em></h2>
    </div>

    <div className="resp-grid">
      <div className="resp-item">
        <div className="resp-label">General inbox</div>
        <div className="resp-value">1<span className="unit">business day</span></div>
        <div className="resp-desc">First reply to hello@ during Mon–Fri business hours, ET.</div>
      </div>
      <div className="resp-item">
        <div className="resp-label">Paid-plan support</div>
        <div className="resp-value">&lt; 4<span className="unit">hours</span></div>
        <div className="resp-desc">First reply during business hours for active paid-plan operators.</div>
      </div>
      <div className="resp-item">
        <div className="resp-label">Security disclosure</div>
        <div className="resp-value">&lt; 2<span className="unit">business days</span></div>
        <div className="resp-desc">Acknowledgment of any submission to security@, with tracking reference.</div>
      </div>
      <div className="resp-item">
        <div className="resp-label">Legal notices</div>
        <div className="resp-value">Per<span className="unit">statute</span></div>
        <div className="resp-desc">Valid DMCA, subpoena, and data-subject requests handled within statutory windows.</div>
      </div>
    </div>
  </div>
</section>

{/*  ═══ EMERGENCY ═══  */}
<section className="emergency">
  <div className="container">
    <span className="emg-badge">Important · Maritime emergencies</span>
    <h2 className="emg-title">
      If the emergency is <em>on the water</em>,<br/>
      do not email us.
    </h2>
    <p className="emg-lede">
      Boatcheckin is software. We cannot dispatch a rescue, coordinate a tow, or reach a vessel in distress. If you are aboard a vessel that needs assistance, <strong>contact the authorities who can actually help you</strong>, and do it first.
    </p>

    <div className="emg-grid">
      <div className="emg-card">
        <div className="emg-lbl">Immediate distress</div>
        <div className="emg-name">U.S. Coast Guard</div>
        <div className="emg-detail">Marine VHF — <strong>Channel 16</strong><br/>Digital Selective Calling — <strong>DSC distress</strong><br/>By phone — <strong>dial 911</strong> and specify marine emergency</div>
      </div>
      <div className="emg-card">
        <div className="emg-lbl">Florida waters · non-emergency</div>
        <div className="emg-name">FWC Boating Hotline</div>
        <div className="emg-detail">For boating-law questions, vessel stops, wildlife-related vessel incidents, and reporting suspicious activity.<br/><strong>*FWC (*392)</strong> from any Florida cellular line</div>
      </div>
      <div className="emg-card">
        <div className="emg-lbl">Vessel-assist &amp; tow</div>
        <div className="emg-name">Commercial tow services</div>
        <div className="emg-detail">For a disabled vessel that is safe (no injury, no taking-on-water), contact your commercial tow service directly — TowBoatUS, Sea Tow, or equivalent — on Channel 16 or by phone.</div>
      </div>
    </div>

    <div className="emg-footnote">
      <strong>This is not legal or emergency-response advice.</strong> The phone numbers, radio channels, and agencies listed above are provided for operator reference and may be superseded by local Captain of the Port orders, state or county advisories, or individual vessel SOPs. Every captain should maintain their own documented emergency protocol appropriate to the vessel, crew, and operating area.
    </div>
  </div>
</section>

{/*  ═══ DO / DON'T ═══  */}
<section className="do-dont">
  <div className="container">
    <div style={{ maxWidth: '680px', marginBottom: '48px' }}>
      <span className="eyebrow">Getting a fast reply</span>
      <h2 className="section-title">What helps, and what<br/><em>slows us down.</em></h2>
      <p className="section-sub">A small amount of framing in the opening message gets you a substantive reply instead of a clarifying question. This is the framing we find most useful.</p>
    </div>

    <div className="dd-grid">

      <div className="dd-card do">
        <div className="dd-head">
          <div className="dd-mark ok">✓</div>
          <div className="dd-title">What helps</div>
        </div>
        <ul className="dd-list">
          <li><strong>Your operator type.</strong> Solo captain, small charter company, marina or fleet — the context changes the answer.</li>
          <li><strong>Your vessel class.</strong> Six-pack, inspected small passenger vessel, bareboat livery, rental — relevant for almost any compliance question.</li>
          <li><strong>What you've already tried.</strong> Screenshots, the time of the event in Eastern Time, the trip or guest ID if applicable.</li>
          <li><strong>The channel that fits.</strong> Security reports to security@, legal notices to legal@, product questions to support@ or in-app. Saves routing time.</li>
          <li><strong>How to reach you back.</strong> Email is fine; phone if the situation is time-sensitive and you'd rather talk.</li>
        </ul>
      </div>

      <div className="dd-card">
        <div className="dd-head">
          <div className="dd-mark no">✕</div>
          <div className="dd-title">What slows things down</div>
        </div>
        <ul className="dd-list">
          <li><strong>Sending the same message to every channel.</strong> It triggers duplicate-handling and delays all threads — pick one inbox and we'll route internally if needed.</li>
          <li><strong>Emergencies on the water.</strong> We can't help; the USCG, FWC, or a commercial tow can. Please see the emergency section above.</li>
          <li><strong>Requests for legal interpretation.</strong> We cannot tell you whether your operation complies with a particular statute. That's what your attorney is for.</li>
          <li><strong>Requests to customize a waiver.</strong> Waiver language is yours to author with your attorney. We store and hash the text you provide; we do not draft it.</li>
          <li><strong>"Can you make an exception."</strong> For security-critical features — audit logs, consent capture, retention windows — the answer is no, by design. We'll explain why, happily.</li>
        </ul>
      </div>

    </div>
  </div>
</section>

{/*  ═══ FOOTER ═══  */}
    </>
  )
}
