import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Security — Boatcheckin',
  description: 'How Boatcheckin protects the charter record. Principles, practices, and our vulnerability disclosure program — written to be useful, not to impress.',
}

export default function SecurityPage() {
  return (
    <>
      {/*  ═══ DATELINE ═══  */}
<div className="dateline">
  <div className="container">
    <div className="dateline-inner">
      <div><span className="dl-dot">●</span> SECURITY — BOATCHECKIN</div>
      <div>ST. PETERSBURG · FLORIDA</div>
      <div id="todayDate">CAPTAIN'S LOG — TODAY</div>
    </div>
  </div>
</div>

{/*  ═══ HERO ═══  */}
<section className="page-hero">
  <div className="container">
    <span className="eyebrow">Security</span>
    <h1>
      The record is only<br/>
      worth keeping if it's<br/>
      <em>still intact.</em>
    </h1>
    <p className="lede">
      Boatcheckin holds the kind of documentation operators need to produce two years after a trip sometimes longer. That's only useful if the record is still what it was the day it was signed. Here is how we protect it, how we restrict access to it, how we handle the parts we get wrong, and how to tell us when you find something we missed.
    </p>
  </div>
</section>

{/*  ═══ POSTURE (up-front honesty) ═══  */}
<section className="block" style={{ paddingTop: '24px' }}>
  <div className="container">
    <div className="posture-panel">
      <span className="pp-tag">Our posture, up front</span>
      <div className="pp-grid">
        <div className="pp-title">Designed to recognized security principles. <em>Not yet independently certified.</em></div>
        <div className="pp-body">
         <p>Boatcheckin is a young product. The practices on this page reflect how the system was built from the beginning least privilege, defense in depth, cryptographic record integrity, and minimal data retention and they map cleanly to the principles behind common independent frameworks such as SOC 2 Type II and ISO 27001.</p>
         <p><strong>We do not currently hold an independent audit certification.</strong> Operators with a formal vendor-review process should treat this page as a statement of practice, not an attestation and should contact <a href="mailto:security@boatcheckin.com" style={{ color: 'var(--rust)', fontWeight: '600' }}>security@boatcheckin.com</a> to request the most current security questionnaire responses. We'd rather tell you that plainly than imply a certification we haven't earned.</p>
        </div>
      </div>
    </div>
  </div>
</section>

{/*  ═══ PRINCIPLES GRID ═══  */}
<section className="block-tight" style={{ paddingTop: '0' }}>
  <div className="container">
    <div className="section-header">
      <span className="eyebrow">Principles we build to</span>
      <h2 className="section-title">Six decisions made <em>on day one.</em></h2>
     <p className="section-sub">These are the structural commitments that shape every feature we ship. They are not aspirational they are how the code gets reviewed.</p>
    </div>

    <div className="principle-grid">
      <div className="pr-cell">
        <span className="pr-num">Principle I</span>
        <div className="pr-title">Least privilege, <em>by default.</em></div>
       <div className="pr-body">Every operator account sees only their own trips, vessels, and guests. Every guest session sees only their own record for their own trip. Database-level access rules enforce these boundaries, not just application code so a bug in one layer can't expose data across another.</div>
      </div>

      <div className="pr-cell">
        <span className="pr-num">Principle II</span>
        <div className="pr-title">Record integrity is <em>non-optional.</em></div>
       <div className="pr-body">Waivers and safety attestations are cryptographically hashed (SHA-256) at the moment of signing. Any modification to a stored record is detectable on re-verification. The trip's audit log is sealed at trip completion no row can be silently altered after the fact.</div>
      </div>

      <div className="pr-cell">
        <span className="pr-num">Principle III</span>
        <div className="pr-title">Encryption everywhere, <em>at all times.</em></div>
        <div className="pr-body">Data in transit is protected with TLS 1.3. Data at rest is encrypted with modern symmetric cipher standards (AES-256 class). Authentication tokens and shareable links are signed with HMAC and have explicit expiry. No cleartext storage of credentials, tokens, or guest PII, ever.</div>
      </div>

      <div className="pr-cell">
        <span className="pr-num">Principle IV</span>
        <div className="pr-title">Minimize what <em>we collect.</em></div>
        <div className="pr-body">We collect the guest data the operator's statute requires, and the operator data needed to run the account. No silent telemetry on guests. No behavioral profiling. No lookalike-audience exports. What isn't collected can't be exposed.</div>
      </div>

      <div className="pr-cell">
        <span className="pr-num">Principle V</span>
        <div className="pr-title">Every action is <em>attributable.</em></div>
       <div className="pr-body">State changes on a trip record creation, signature, start, completion, export produce an audit trail with actor, timestamp, method, and client metadata. When a question comes two years later, the answer to "who did this, and when" is already in the record.</div>
      </div>

      <div className="pr-cell">
        <span className="pr-num">Principle VI</span>
        <div className="pr-title">No security through <em>obscurity.</em></div>
       <div className="pr-body">We don't rely on secret URLs as an access control, unguessable IDs as a privacy boundary, or undocumented endpoints as a security layer. Public surfaces are rate-limited, authenticated, validated, and logged as if every request were adversarial, because some of them are.</div>
      </div>
    </div>
  </div>
</section>

{/*  ═══ PROTECTING THE RECORD (DARK) ═══  */}
<section className="practice-section">
  <div className="container">
    <div className="section-header">
      <span className="eyebrow light">Protecting the record</span>
      <h2 className="section-title">How the trip record<br/>is <em>kept intact.</em></h2>
      <p className="section-sub">This is the layer that matters most: what stops a waiver from being quietly altered, a manifest from being retroactively rewritten, or a safety attestation from being manufactured after the fact.</p>
    </div>

    <div className="practice-stack">

      <div className="practice-row">
        <div className="pr-meta">Data · Transport</div>
        <div>
          <div className="pr-h">Encrypted in transit, modern cipher suites only.</div>
          <div className="pr-p">All traffic between guests, operators, and Boatcheckin is protected by <strong>TLS 1.3</strong>. Older TLS versions are disabled. HSTS is enforced across our domains so a downgrade attack cannot coerce a session to an older protocol.</div>
          <div className="pr-p">No feature of Boatcheckin has ever required an operator or guest to transmit credentials or PII over an unencrypted channel, and none ever will.</div>
        </div>
      </div>

      <div className="practice-row">
        <div className="pr-meta">Data · Storage</div>
        <div>
          <div className="pr-h">Encrypted at rest, minimal privilege inside the database.</div>
          <div className="pr-p">Operational data is stored in a managed, enterprise-grade relational database with encryption at rest using modern symmetric ciphers (AES-256 class). Access to the database is restricted to service identities using rotated credentials; humans do not hold direct production credentials.</div>
          <div className="pr-p">Row-level access rules, enforced at the database tier, isolate operator data from other operators and guest data from other guests. A bug in application code cannot override a database-tier policy that says "this row does not belong to this account."</div>
        </div>
      </div>

      <div className="practice-row">
        <div className="pr-meta">Data · Integrity</div>
        <div>
          <div className="pr-h">Signatures and attestations are cryptographically hashed.</div>
         <div className="pr-p">At the moment a guest signs a waiver or acknowledges a safety card, the exact text the guest saw plus the guest's signature, timestamp, IP, and user agent is combined into a canonical document and hashed with <strong>SHA-256</strong>. The hash is stored alongside the record.</div>
         <div className="pr-p">If a record is later exported and its contents are altered even by a single character re-hashing the modified document produces a different digest. <strong>Tampering becomes visible.</strong> This is the technical backbone of ESIGN and UETA-aligned record integrity.</div>
        </div>
      </div>

      <div className="practice-row">
        <div className="pr-meta">Data · Audit trail</div>
        <div>
          <div className="pr-h">State changes are logged with actor, time, and method.</div>
          <div className="pr-p">Trip creation, waiver signing, captain start, per-card acknowledgment, trip completion, and every export produce structured audit entries. Each entry carries the acting identity (operator, captain, or guest), the timestamp, the method of the action, and the client context.</div>
         <div className="pr-p">Audit entries are append-only there is no API or UI that edits or deletes them. After trip completion, the trip's audit log is sealed: further entries reference the sealed state rather than mutating it.</div>
        </div>
      </div>

      <div className="practice-row">
        <div className="pr-meta">Data · Backups</div>
        <div>
          <div className="pr-h">Backups with integrity verification and tested restores.</div>
          <div className="pr-p">Production data is backed up on a continuous basis with point-in-time recovery across a rolling retention window. Backups inherit the same encryption-at-rest posture as primary storage.</div>
         <div className="pr-p">We run restore drills on a scheduled cadence a backup that hasn't been tested is an assumption, not a backup.</div>
        </div>
      </div>

    </div>
  </div>
</section>

{/*  ═══ RESTRICTING ACCESS (LIGHT) ═══  */}
<section className="practice-light">
  <div className="container">
    <div className="section-header">
      <span className="eyebrow sea">Restricting access</span>
     <h2 className="section-title">Who can touch the record<br/>and <em>how that's enforced.</em></h2>
      <p className="section-sub">The strongest encryption doesn't help if the wrong identity can walk through the front door. Access control sits at multiple layers, so no single mistake exposes an account.</p>
    </div>

    <div className="practice-stack">

      <div className="practice-row">
        <div className="pr-meta">Access · Operators</div>
        <div>
          <div className="pr-h">Operator sign-in uses short-lived, scoped sessions.</div>
          <div className="pr-p">Operator accounts authenticate via email with strong-password requirements and, where elected, passwordless or multi-factor methods. Sessions are short-lived and bound to the originating client; session tokens are rotated on privilege-sensitive actions.</div>
          <div className="pr-p">Every route that accesses operator data verifies the session, verifies the account is active, and verifies the target record belongs to the requesting operator. A session for one operator cannot read another operator's data, even by direct object reference.</div>
        </div>
      </div>

      <div className="practice-row">
        <div className="pr-meta">Access · Guests</div>
        <div>
          <div className="pr-h">Guest trip links are signed, scoped, and time-limited.</div>
         <div className="pr-p">When an operator sends a trip link, the URL carries a cryptographically signed token that binds the link to exactly one trip. The guest flow can join that trip and only that trip it cannot pivot to another trip, another operator, or the operator dashboard.</div>
          <div className="pr-p">Guest sessions are disposable. Once a guest has completed boarding, their session is no longer usable for administrative actions on the trip or the operator.</div>
        </div>
      </div>

      <div className="practice-row">
        <div className="pr-meta">Access · Captains</div>
        <div>
          <div className="pr-h">Captain snapshot tokens: versioned, revocable, expiring.</div>
         <div className="pr-p">Captains can open a trip snapshot directly from a link without logging in so the workflow holds up on a phone with marginal signal at the dock. The link carries an HMAC-signed token with an explicit expiry and a version counter.</div>
          <div className="pr-p">If a captain changes or a snapshot is re-issued, the version counter increments and the prior link stops working. Operators can revoke all active snapshots for a trip from the dashboard.</div>
        </div>
      </div>

      <div className="practice-row">
        <div className="pr-meta">Access · Internal</div>
        <div>
          <div className="pr-h">Our team reaches production data only when necessary, only when logged.</div>
         <div className="pr-p">Our team does not routinely access production operator or guest data. When access is required to investigate a reported issue and only with an identifiable legitimate purpose it is performed via scoped, auditable tooling, and the access itself is logged. Bulk extracts, casual browsing, and "just looking" are not supported workflows.</div>
          <div className="pr-p">Production secrets and service credentials are stored in a dedicated secret store, rotated on a defined schedule, and never committed to source code. Principle of least privilege applies to our team as much as it applies to operators.</div>
        </div>
      </div>

      <div className="practice-row">
        <div className="pr-meta">Access · Public surface</div>
        <div>
          <div className="pr-h">Every public endpoint is rate-limited and validated.</div>
         <div className="pr-p">Public-facing API endpoints guest join, waiver submission, contact forms are rate-limited at the edge to slow automated abuse, guarded by a bot challenge where appropriate, and strictly schema-validated on the server side. No endpoint trusts client-supplied data as authoritative.</div>
         <div className="pr-p">Suspicious patterns rapid enumeration, malformed payloads, repeated failed signatures produce alerts that route to on-call. We'd rather investigate a false positive than miss a real one.</div>
        </div>
      </div>

    </div>
  </div>
</section>

{/*  ═══ VULNERABILITY DISCLOSURE ═══  */}
<section className="vdp" id="disclosure">
  <div className="container">
    <div className="section-header">
      <span className="eyebrow light">Vulnerability disclosure program</span>
      <h2 className="section-title">Find something<br/>we missed? <em>Tell us.</em></h2>
      <p className="section-sub">We welcome responsible-disclosure reports from security researchers, operators, and curious engineers. This section describes the scope, the rules, the safe harbor, and how to reach the team directly.</p>
    </div>

    <div className="vdp-grid">

      <div className="vdp-card">
        <div className="vdp-lbl">In scope</div>
        <div className="vdp-h">What we want to hear about</div>
       <div className="vdp-p">Anything that would let an unauthorized party read, modify, or destroy operator or guest data or impersonate an operator, captain, or guest to do so.</div>
        <ul className="vdp-list">
          <li>Authentication and session handling flaws</li>
          <li>Authorization bypass across operators or trips</li>
          <li>Data exposure via direct object reference or enumeration</li>
          <li>Injection vulnerabilities (SQL, template, header, etc.)</li>
          <li>Cross-site scripting on operator or guest surfaces</li>
          <li>Token generation, signing, or rotation weaknesses</li>
          <li>Abuse of audit-log or record-integrity guarantees</li>
        </ul>
      </div>

      <div className="vdp-card">
        <div className="vdp-lbl">Out of scope</div>
        <div className="vdp-h">What we usually won't prioritize</div>
        <div className="vdp-p">Reports on these categories are still welcome, but typically do not receive the same urgency as issues above:</div>
        <ul className="vdp-list">
          <li>Missing security headers without a concrete exploit</li>
          <li>Self-XSS that cannot be weaponized against another user</li>
          <li>Rate-limiting abuse against public marketing pages</li>
          <li>Clickjacking on unauthenticated pages with no sensitive action</li>
          <li>Reports from automated scanners without a working PoC</li>
          <li>Denial of service via volumetric traffic</li>
          <li>Social engineering of our team or operators</li>
        </ul>
      </div>

      <div className="vdp-card vdp-card-full">
        <div className="vdp-lbl">Safe harbor &amp; the rules</div>
       <div className="vdp-h">Good-faith research is welcome within these lines.</div>
        <div className="vdp-p">We will not pursue legal action against security researchers who act in good faith: who report findings promptly, who do not access or exfiltrate more data than necessary to demonstrate the issue, who do not degrade service for operators or guests, and who do not publicly disclose the finding before we've had a reasonable opportunity to remediate.</div>
        <div className="vdp-p"><strong>Please do not</strong> test against real operator accounts or real guest trip links without permission. Use your own account and your own trips. <strong>Please do not</strong> run automated scans that generate load comparable to a real operator's traffic. <strong>Please do not</strong> ask for or access payment data, as our payment flow is handled by a PCI-DSS Level 1 processor that is out of scope for independent testing by our program.</div>
        <div className="vdp-p">We don't currently run a paid bounty program, but we acknowledge valid findings publicly (with your permission) and are happy to write meaningful references for researchers whose work helps us.</div>
      </div>

    </div>

    <a href="mailto:security@boatcheckin.com" className="vdp-email-bar">
      <div>
        <div className="vdp-email-bar-lbl">Submit a report to</div>
        <div className="vdp-email-bar-addr">security@boatcheckin.com</div>
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>PGP key on request →</div>
    </a>
  </div>
</section>

{/*  ═══ DISCLOSURE TIMELINE ═══  */}
<section className="timeline-section">
  <div className="container">
    <div className="section-header">
      <span className="eyebrow">Our commitment after you report</span>
      <h2 className="section-title">What happens <em>after you hit send.</em></h2>
     <p className="section-sub">These are operational targets we hold ourselves to when a report arrives at security@boatcheckin.com. Severity affects the remediation window but acknowledgment and communication do not.</p>
    </div>

    <div className="tl-grid">
      <div className="tl-item">
        <div className="tl-label">Stage 01</div>
        <div className="tl-target">&lt; 2<span className="unit">business days</span></div>
       <div className="tl-desc">Human acknowledgment with a tracking reference. Not a bot reply a person confirming we have the report.</div>
      </div>
      <div className="tl-item">
        <div className="tl-label">Stage 02</div>
        <div className="tl-target">&lt; 7<span className="unit">days</span></div>
       <div className="tl-desc">Initial triage outcome reproduced, scoped, or clarifying questions with a target remediation timeline.</div>
      </div>
      <div className="tl-item">
        <div className="tl-label">Stage 03</div>
        <div className="tl-target">Per<span className="unit">severity</span></div>
        <div className="tl-desc">Remediation and verification. Critical findings: mitigated fast, patched as soon as safely possible. Lower severity: grouped into the regular release cycle.</div>
      </div>
      <div className="tl-item">
        <div className="tl-label">Stage 04</div>
        <div className="tl-target">On<span className="unit">resolution</span></div>
       <div className="tl-desc">Follow-up to the reporter, credit (with permission), and where affected notice to operators whose data was at risk.</div>
      </div>
    </div>
  </div>
</section>

{/*  ═══ INCIDENT COMMUNICATION ═══  */}
<section className="block" style={{ background: 'var(--paper)' }}>
  <div className="container">
    <div style={{ maxWidth: '820px' }}>
      <span className="eyebrow brass">If something goes wrong</span>
      <h2 className="section-title">Incident communication,<br/>before we <em>need</em> it.</h2>
      <div className="prose" style={{ maxWidth: '720px' }}>
       <p>Any platform in production for long enough eventually has an incident. Writing down our communication posture <strong>in advance</strong> rather than when we&apos;re in the middle of one is part of being a serious operator ourselves.</p>
       <p>If a security incident occurs that affects operator or guest data, affected operators receive direct email notice without waiting for a public announcement. Where the statute in the operator&apos;s jurisdiction requires downstream notification to guests or to regulators, we support operators with the technical details they need to meet those obligations. Our timelines in each category are designed to meet or exceed applicable breach-notification windows including US state laws, and where applicable, GDPR&apos;s 72-hour rule.</p>
       <p>For service-availability incidents downtime, degraded performance we publish updates to a status page so operators don&apos;t need to file a ticket just to learn whether the issue is on our side.</p>
       <p>In every case, we prefer <strong>direct, specific, and early</strong> communication over polished marketing language after the fact.</p>
      </div>
    </div>
  </div>
</section>

{/*  ═══ FINAL CTA ═══  */}
<section className="final-cta">
  <div className="container">
    <div className="fca-grid">
      <div>
        <h2 className="fca-h">Questions a security<br/>review needs answered? <em>Ask us.</em></h2>
        <p className="fca-sub">Operators with a formal vendor-review process can request our current security questionnaire, data-processing addendum, and subprocessor list by email. We'd rather have the conversation than have it avoided.</p>
      </div>
      <div className="fca-stack">
        <a href="mailto:security@boatcheckin.com" className="btn">Email Security →</a>
        <a href="/contact" className="btn btn-outline">General Contact</a>
      </div>
    </div>
  </div>
</section>

{/*  ═══ FOOTER ═══  */}
    </>
  )
}
