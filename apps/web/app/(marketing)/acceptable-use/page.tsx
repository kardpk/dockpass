import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Acceptable Use Policy — Boatcheckin',
  description: 'What Operators and users may not do on Boatcheckin. Rules that keep the platform trustworthy for everyone.',
}

export default function AcceptableUsePage() {
  return (
    <>
      <div className="dateline"><div className="container"><div className="dateline-inner"><div><span className="dl-dot">●</span> ACCEPTABLE USE</div><div>ST. PETERSBURG · FLORIDA</div><div id="todayDate">CAPTAIN'S LOG — TODAY</div></div></div></div>

<section className="doc-hero">
  <div className="container-doc">
    <span className="eyebrow">Acceptable Use Policy</span>
    <h1>What you can't do with Boatcheckin —<br/><em>and why it matters.</em></h1>
    <p style={{ fontSize: '17px', lineHeight: '1.65', color: 'var(--ink-soft)', maxWidth: '680px' }}>This Acceptable Use Policy ("<strong>AUP</strong>") lists the uses of Boatcheckin that are not allowed. It applies to everyone who accesses or uses the Services — Operators, Captains, Guests, invited users, and visitors — and it is incorporated into our <a className="inline" href="/terms">Terms of Service</a>.</p>
    <div className="doc-meta">
      <div className="doc-meta-item"><span className="dm-label">Version</span><span className="dm-value">1.0</span></div>
      <div className="doc-meta-item"><span className="dm-label">Effective date</span><span className="dm-value">April 20, 2026</span></div>
      <div className="doc-meta-item"><span className="dm-label">Report abuse</span><span className="dm-value">abuse@boatcheckin.com</span></div>
    </div>
  </div>
</section>

<section className="container-doc">
  <div className="doc-body">

    <aside className="toc-nav">
      <div className="toc-heading">Contents</div>
      <ul>
        <li><a href="#s1">1 · Spirit of this policy</a></li>
        <li><a href="#s2">2 · Illegal or harmful</a></li>
        <li><a href="#s3">3 · Charter-specific</a></li>
        <li><a href="#s4">4 · Platform abuse</a></li>
        <li><a href="#s5">5 · Security</a></li>
        <li><a href="#s6">6 · Communications abuse</a></li>
        <li><a href="#s7">7 · Privacy violations</a></li>
        <li><a href="#s8">8 · IP violations</a></li>
        <li><a href="#s9">9 · Security research</a></li>
        <li><a href="#s10">10 · Enforcement</a></li>
        <li><a href="#s11">11 · Reporting</a></li>
      </ul>
    </aside>

    <div className="doc-content">

      <h2 id="s1"><span className="sec">§ 1</span>The spirit of this policy</h2>
      <p>Boatcheckin is trusted by charter operators to hold records that matter — documentation that a regulator, an insurer, or an attorney may eventually rely on. That trust is fragile. A small number of bad actors, left unchecked, can erode it for everyone.</p>
      <p>This AUP describes the uses of the Services that undermine that trust. <strong>We'd rather state these clearly, once, than guess at intent later.</strong> If your use is plainly within this list, we will act. If we're uncertain, we will ask — but we reserve the right to suspend access while we do.</p>

      <div className="callout info">
        <div className="callout-tag info">How this list works</div>
        <p>The list below is not exhaustive. Conduct that is not explicitly enumerated but is clearly within the spirit of a prohibition is still prohibited. We apply these rules consistently and in good faith.</p>
      </div>

      <h2 id="s2"><span className="sec">§ 2</span>Illegal or harmful conduct</h2>
      <p>You may not use the Services to engage in activity that is illegal, harmful, or tortious. This includes, without limitation:</p>

      <div className="prohibit-grid">
        <div className="prohibit-item"><div className="px">✕</div><div><div className="pt">Violate the law.</div><div className="pb">Any use that violates applicable federal, state, or local law — including laws governing charter operations, passenger transport, livery rentals, maritime safety, licensing, taxation, sanctions, and export control.</div></div></div>
        <div className="prohibit-item"><div className="px">✕</div><div><div className="pt">Commit fraud.</div><div className="pb">Misrepresent your identity, your credentials, your vessel, your insurance, your authorization to operate, or any other material fact to Boatcheckin or to another user of the Services.</div></div></div>
        <div className="prohibit-item"><div className="px">✕</div><div><div className="pt">Harass, threaten, or endanger.</div><div className="pb">Use the Services to stalk, threaten, harass, defame, or attempt to harm any person, including through the content sent via trip links or operator communications.</div></div></div>
        <div className="prohibit-item"><div className="px">✕</div><div><div className="pt">Exploit minors.</div><div className="pb">Any use of the Services that would facilitate harm, exploitation, or unlawful contact involving a minor. This is treated as an immediate-termination offense and reported to authorities where required by law.</div></div></div>
      </div>

      <h2 id="s3"><span className="sec">§ 3</span>Charter-specific prohibitions</h2>
      <p>Because Boatcheckin's purpose is recordkeeping, the integrity of the record is non-negotiable. You may not:</p>

      <div className="prohibit-grid">
        <div className="prohibit-item"><div className="px">✕</div><div><div className="pt">Falsify trip records.</div><div className="pb">Manufacture, alter, or misrepresent waiver signatures, safety attestations, manifests, or any other record. This includes creating records for trips that did not occur, altering timestamps, or falsifying the identity of passengers aboard.</div></div></div>
        <div className="prohibit-item"><div className="px">✕</div><div><div className="pt">Sign on behalf of a Guest.</div><div className="pb">A waiver must be signed by the Guest themselves (or by a parent or legal guardian for a minor, where lawful). Signing on another adult Guest's behalf without their authorization is prohibited and may violate state electronic signature law.</div></div></div>
        <div className="prohibit-item"><div className="px">✕</div><div><div className="pt">Use Boatcheckin to operate without required credentials.</div><div className="pb">You may not use the Services to support operations for which the Operator, the Captain, or the vessel lacks required licenses, certifications, inspections, or insurance.</div></div></div>
        <div className="prohibit-item"><div className="px">✕</div><div><div className="pt">Use the Services as a substitute for the Captain.</div><div className="pb">The Services do not replace the judgment of the licensed Captain. You may not misrepresent to Guests or regulators that Boatcheckin performs functions it does not perform — including safety certification, compliance certification, or go/no-go decisions.</div></div></div>
        <div className="prohibit-item"><div className="px">✕</div><div><div className="pt">Misuse insurance references.</div><div className="pb">Where the Services reference insurance partners, you may not represent to Guests or regulators that Boatcheckin sells, administers, or underwrites insurance. Boatcheckin does none of those things.</div></div></div>
      </div>

      <h2 id="s4"><span className="sec">§ 4</span>Platform abuse</h2>
      <p>You may not interfere with the availability, reliability, or integrity of the Services.</p>

      <div className="prohibit-grid">
        <div className="prohibit-item"><div className="px">✕</div><div><div className="pt">Overwhelm or disrupt.</div><div className="pb">Launch denial-of-service attacks, flood the Services with traffic, submit malformed requests designed to crash or degrade performance, or otherwise interfere with normal operation.</div></div></div>
        <div className="prohibit-item"><div className="px">✕</div><div><div className="pt">Scrape at scale.</div><div className="pb">Automated scraping, mass data extraction, systematic harvesting of Guest information, or circumventing rate limits through technical means is prohibited. Normal use of the Services — including export of your own data through the intended UI — is not restricted.</div></div></div>
        <div className="prohibit-item"><div className="px">✕</div><div><div className="pt">Reverse engineer.</div><div className="pb">Decompile, disassemble, or reverse-engineer the Services, except to the limited extent applicable law expressly permits despite this restriction.</div></div></div>
        <div className="prohibit-item"><div className="px">✕</div><div><div className="pt">Create derivative or competing services.</div><div className="pb">Use the Services to benchmark for a competing product, build a competing service, or train machine learning models, without our prior written consent.</div></div></div>
        <div className="prohibit-item"><div className="px">✕</div><div><div className="pt">Submit harmful content.</div><div className="pb">Upload, transmit, or distribute viruses, worms, trojans, malware, or other code intended to disrupt, damage, or gain unauthorized access to any system.</div></div></div>
      </div>

      <h2 id="s5"><span className="sec">§ 5</span>Security violations</h2>
      <p>You may not compromise the security of the Services or of any user.</p>

      <div className="prohibit-grid">
        <div className="prohibit-item"><div className="px">✕</div><div><div className="pt">Access without authorization.</div><div className="pb">Attempt to access accounts, trips, records, or data you are not authorized to access; probe or test vulnerabilities without following our disclosure program; or exploit any discovered vulnerability for purposes beyond responsible demonstration.</div></div></div>
        <div className="prohibit-item"><div className="px">✕</div><div><div className="pt">Misuse authentication.</div><div className="pb">Share credentials with unauthorized parties, impersonate another user, bypass authentication mechanisms, or use stolen credentials.</div></div></div>
        <div className="prohibit-item"><div className="px">✕</div><div><div className="pt">Tamper with records.</div><div className="pb">Attempt to modify audit logs, alter cryptographic hashes, backdate signatures, or otherwise defeat the record-integrity mechanisms that make Boatcheckin useful to Operators.</div></div></div>
      </div>

      <h2 id="s6"><span className="sec">§ 6</span>Communications abuse</h2>
      <p>You may not misuse Boatcheckin's communication features.</p>

      <div className="prohibit-grid">
        <div className="prohibit-item"><div className="px">✕</div><div><div className="pt">Send unsolicited communications.</div><div className="pb">Use trip links, Operator emails, or SMS tools to send unsolicited bulk messages, spam, or marketing to individuals who have not consented. Our SMS and email capabilities are for operational trip communications — not for mass marketing.</div></div></div>
        <div className="prohibit-item"><div className="px">✕</div><div><div className="pt">Violate TCPA, CAN-SPAM, or similar laws.</div><div className="pb">Any use that violates the Telephone Consumer Protection Act, CAN-SPAM Act, or equivalent law in the recipient's jurisdiction is prohibited — regardless of the content of the message.</div></div></div>
        <div className="prohibit-item"><div className="px">✕</div><div><div className="pt">Misrepresent the sender.</div><div className="pb">Forge headers, spoof sender identity, or otherwise disguise the origin of any communication sent through the Services.</div></div></div>
      </div>

      <h2 id="s7"><span className="sec">§ 7</span>Privacy violations</h2>
      <p>You may not use the Services to violate the privacy of other users.</p>

      <div className="prohibit-grid">
        <div className="prohibit-item"><div className="px">✕</div><div><div className="pt">Collect Guest data unlawfully.</div><div className="pb">Use Boatcheckin to collect Guest information for any purpose the Guest has not reasonably anticipated, without a lawful basis, or in violation of applicable privacy law. Operators remain the controller of the Guest data they collect.</div></div></div>
        <div className="prohibit-item"><div className="px">✕</div><div><div className="pt">Sell or share Guest data.</div><div className="pb">Sell, license, or otherwise transfer Guest information to third parties for their independent marketing or profiling purposes without explicit consent from the Guest where consent is required.</div></div></div>
        <div className="prohibit-item"><div className="px">✕</div><div><div className="pt">Ignore rights requests.</div><div className="pb">Refuse, delay, or mishandle Guest requests to exercise privacy rights that apply in the Guest's jurisdiction. Where you are the controller of the data, you are responsible for responding.</div></div></div>
      </div>

      <h2 id="s8"><span className="sec">§ 8</span>Intellectual property violations</h2>
      <p>You may not use the Services to infringe on the intellectual property rights of others, including copyrights, trademarks, trade secrets, and patents. You may not use the "Boatcheckin" name or logo in a way that implies endorsement, affiliation, or certification that does not exist.</p>
      <p>If you believe content on the Services infringes your copyright, see our <a className="inline" href="/dmca">Copyright &amp; DMCA Policy</a> for how to submit a takedown notice.</p>

      <h2 id="s9"><span className="sec">§ 9</span>Security research &amp; safe harbor</h2>
      <p>We welcome security research conducted in good faith. The rules and safe harbor are described on our <a className="inline" href="/security#disclosure">Vulnerability Disclosure Program</a>. Research that stays within the scope described there does not violate this AUP. Research that exceeds that scope — accessing or exfiltrating real user data, degrading service, or going public before remediation — does.</p>

      <div className="callout info">
        <div className="callout-tag info">If you're a researcher</div>
        <p>Report findings to <a className="inline" href="mailto:security@boatcheckin.com">security@boatcheckin.com</a>. We acknowledge within 2 business days, triage within a week, and remediate on a severity-based schedule. We do not take legal action against good-faith research that stays within the program.</p>
      </div>

      <h2 id="s10"><span className="sec">§ 10</span>Enforcement</h2>
      <p>When we identify conduct that violates this AUP, we may — at our discretion, and depending on severity:</p>
      <ul>
        <li><strong>Warn.</strong> Notify the Operator and request remediation.</li>
        <li><strong>Restrict.</strong> Temporarily limit specific features pending investigation.</li>
        <li><strong>Suspend.</strong> Pause account access until the issue is resolved.</li>
        <li><strong>Terminate.</strong> End the account, with retention of compliance records as required by §6 of the Terms.</li>
        <li><strong>Report.</strong> Notify law enforcement or applicable regulators where the conduct warrants it.</li>
      </ul>
      <p>For severe violations — including fraud, record tampering, minor exploitation, or conduct that creates immediate risk to others — we may skip the warning stage and terminate without notice. We apply these actions consistently and document each.</p>

      <h2 id="s11"><span className="sec">§ 11</span>Reporting abuse</h2>
      <p>If you believe someone is using Boatcheckin in violation of this AUP, we want to hear about it. Reports are handled confidentially.</p>

      <div className="contact-block">
        <h3>Report abuse</h3>
        <p><strong>Email</strong><br/><a href="mailto:abuse@boatcheckin.com">abuse@boatcheckin.com</a></p>
        <p style={{ marginTop: '14px' }}>Please include: the account or trip involved (if you know it), a description of what you observed, the date and time, and any evidence (screenshots, message excerpts, trip IDs).</p>
        <p style={{ marginTop: '14px' }}><strong>Acknowledgment</strong><br/>Within 2 business days. Investigation outcomes are shared with reporters where consistent with privacy obligations.</p>
      </div>

    </div>
  </div>
</section>
    </>
  )
}
