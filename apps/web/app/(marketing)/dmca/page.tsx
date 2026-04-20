import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Copyright &amp; DMCA Policy — Boatcheckin',
  description: 'How to report copyright infringement on Boatcheckin, how to submit a counter-notice, and our repeat-infringer policy.',
}

export default function DmcaPage() {
  return (
    <>
      <div className="dateline"><div className="container"><div className="dateline-inner"><div><span className="dl-dot">●</span> COPYRIGHT &amp; DMCA</div><div>17 U.S.C. § 512 · SAFE HARBOR</div><div id="todayDate">CAPTAIN'S LOG — TODAY</div></div></div></div>

<section className="doc-hero">
  <div className="container-doc">
    <span className="eyebrow">Copyright &amp; DMCA Policy</span>
    <h1>How to report <em>copyright infringement</em> on Boatcheckin.</h1>
    <p style={{ fontSize: '17px', lineHeight: '1.65', color: 'var(--ink-soft)', maxWidth: '680px' }}>Boatcheckin respects intellectual property rights and responds to valid notices of alleged copyright infringement under the Digital Millennium Copyright Act (the "DMCA," 17 U.S.C. § 512). This Policy explains how to submit a notice, how to respond with a counter-notice if you believe content was removed in error, and our policy for users who repeatedly infringe.</p>
    <div className="doc-meta">
      <div className="doc-meta-item"><span className="dm-label">Version</span><span className="dm-value">1.0</span></div>
      <div className="doc-meta-item"><span className="dm-label">Effective date</span><span className="dm-value">April 20, 2026</span></div>
      <div className="doc-meta-item"><span className="dm-label">Notices to</span><span className="dm-value">legal@boatcheckin.com</span></div>
    </div>
  </div>
</section>

<section className="container-doc">
  <div className="doc-body">
    <div className="doc-content">

      <h2><span className="sec">§ 1</span>About this Policy</h2>
      <p>The Services enable Operators and Guests to upload content — waiver text, vessel photos, operator logos, and similar materials. We do not pre-screen this content; Operators are responsible for the content they submit under our <a className="inline" href="/terms">Terms of Service</a> and <a className="inline" href="/acceptable-use">Acceptable Use Policy</a>.</p>
      <p>If you are a copyright owner (or an agent authorized to act on behalf of one) and you believe content on the Services infringes your copyright, you can submit a notice as described below. We will respond to properly submitted notices in accordance with the DMCA.</p>

      <h2><span className="sec">§ 2</span>Designated Agent</h2>
      <p>Our Designated Agent for receipt of notices of claimed infringement is:</p>

      <div className="agent-card">
        <div className="agent-tag">DMCA Designated Agent</div>
        <h3>Oakmont Logic LLC · Attn: DMCA Agent</h3>
        <div className="agent-row"><div className="agent-lbl">Email</div><div className="agent-val"><a href="mailto:legal@boatcheckin.com">legal@boatcheckin.com</a><br/><span style={{ fontSize: '12px', color: 'rgba(244,239,230,0.6)' }}>Subject line: "DMCA Notice"</span></div></div>
        <div className="agent-row"><div className="agent-lbl">Mail</div><div className="agent-val">Oakmont Logic LLC<br/>Attn: DMCA Agent<br/>7901 4th St N, #8722<br/>St. Petersburg, FL 33702<br/>United States</div></div>
        <div className="agent-row"><div className="agent-lbl">Phone</div><div className="agent-val"><a href="tel:+17865097869">+1 (786) 509-7869</a></div></div>
      </div>

      <h2><span className="sec">§ 3</span>Submitting a Notice of Infringement</h2>
      <p>To be effective under 17 U.S.C. § 512(c)(3), your notice must include <strong>each of the following six elements</strong>. Notices missing any of these may not be actionable.</p>

      <ul className="checklist">
        <li><span className="num">01</span><div><strong>A physical or electronic signature</strong> of a person authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.</div></li>
        <li><span className="num">02</span><div><strong>Identification of the copyrighted work</strong> claimed to have been infringed, or — if multiple works are covered by a single notice — a representative list.</div></li>
        <li><span className="num">03</span><div><strong>Identification of the allegedly infringing material</strong> and information reasonably sufficient to permit us to locate it — typically, the specific URL(s) on the Services where the material appears.</div></li>
        <li><span className="num">04</span><div><strong>Your contact information</strong> — name, address, telephone number, and email address — so we can respond and, if appropriate, share it with the user who posted the content.</div></li>
        <li><span className="num">05</span><div><strong>A statement</strong> that you have a good-faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.</div></li>
        <li><span className="num">06</span><div><strong>A statement, under penalty of perjury</strong>, that the information in the notice is accurate and that you are the copyright owner or authorized to act on the owner's behalf.</div></li>
      </ul>

      <div className="callout critical">
        <div className="callout-tag">Knowingly false notices</div>
        <p>Under 17 U.S.C. § 512(f), any person who knowingly materially misrepresents that material is infringing may be liable for damages, including costs and attorneys' fees, incurred by us or by the user whose content was removed in reliance on the notice. Please do not submit a notice for content you are not certain infringes your copyright.</p>
      </div>

      <h2><span className="sec">§ 4</span>What we do when we receive a valid notice</h2>
      <p>On receipt of a notice we determine to be substantially compliant with § 512(c)(3), we will:</p>
      <ol>
        <li>Remove or disable access to the allegedly infringing material promptly.</li>
        <li>Notify the user who submitted the material of the removal and provide a copy of the notice.</li>
        <li>Inform the user of their right to submit a counter-notice under § 3 below.</li>
      </ol>
      <p>We are not obligated to evaluate the merits of a claim of infringement; removal or disabling access is our protective response under the DMCA.</p>

      <h2><span className="sec">§ 5</span>Submitting a Counter-Notice</h2>
      <p>If you are a user whose content was removed or disabled and you believe it was removed in error — for example, because the content is your own, is licensed, is used with permission, or qualifies as fair use — you may submit a counter-notice.</p>
      <p>To be effective under 17 U.S.C. § 512(g)(3), your counter-notice must include each of the following:</p>

      <ul className="checklist">
        <li><span className="num">01</span><div><strong>Your physical or electronic signature.</strong></div></li>
        <li><span className="num">02</span><div><strong>Identification of the material</strong> that was removed or disabled and the location where it appeared before removal.</div></li>
        <li><span className="num">03</span><div><strong>A statement, under penalty of perjury</strong>, that you have a good-faith belief that the material was removed or disabled as a result of mistake or misidentification.</div></li>
        <li><span className="num">04</span><div><strong>Your name, address, and telephone number</strong>, and a statement that you consent to the jurisdiction of the federal district court for the judicial district in which your address is located — or, if your address is outside the United States, any judicial district in which Boatcheckin may be found — and that you will accept service of process from the party who submitted the original notice or an agent of that party.</div></li>
      </ul>

      <h2><span className="sec">§ 6</span>What happens after a Counter-Notice</h2>
      <p>On receipt of a counter-notice we determine to be substantially compliant with § 512(g)(3), we will:</p>
      <ol>
        <li>Promptly provide a copy to the party who submitted the original notice.</li>
        <li>Inform that party that we may restore the removed material in 10 business days.</li>
        <li>Restore the removed material between 10 and 14 business days after receipt of the counter-notice, unless we first receive notice from the copyright owner that they have filed a legal action seeking a court order to restrain the alleged infringement.</li>
      </ol>

      <h2><span className="sec">§ 7</span>Repeat Infringer Policy</h2>
      <p>It is Boatcheckin's policy, in accordance with 17 U.S.C. § 512(i), to terminate in appropriate circumstances the accounts of users who are repeat infringers. We consider a user a repeat infringer when the user's account has been the subject of multiple unresolved, substantially compliant DMCA notices, or when the user has admitted to repeat infringement.</p>
      <p>We apply this policy at our reasonable discretion based on the full record of conduct, including good-faith counter-notices and the nature of the content involved.</p>

      <h2><span className="sec">§ 8</span>Trademark and other IP concerns</h2>
      <p>This Policy applies specifically to copyright. If you believe your trademark, publicity right, or other intellectual property right is being infringed on the Services, contact us at <a className="inline" href="mailto:legal@boatcheckin.com">legal@boatcheckin.com</a>. We evaluate each notice on its merits; non-copyright IP matters are not subject to the statutory DMCA timelines but receive a good-faith response.</p>

      <h2><span className="sec">§ 9</span>Good faith and sworn statements</h2>
      <p>Both a notice under § 3 and a counter-notice under § 5 include a statement made under penalty of perjury. Treat the required statements accordingly. If you are unsure whether your concern rises to the level of infringement — for example, whether a use qualifies as fair use, or whether a license you signed permits the use — we recommend consulting an attorney before submitting a notice.</p>

      <h2><span className="sec">§ 10</span>Contact</h2>
      <p>All DMCA notices and counter-notices should be directed to the Designated Agent above. For general copyright questions, contact us.</p>

      <div className="contact-block">
        <h3>Boatcheckin · Legal</h3>
        <p style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--brass)' }}>Email</p>
        <p><a href="mailto:legal@boatcheckin.com">legal@boatcheckin.com</a></p>
        <p style={{ marginTop: '10px', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--brass)' }}>Mail</p>
        <p>Oakmont Logic LLC · Attn: DMCA Agent · 7901 4th St N, #8722 · St. Petersburg, FL 33702 · United States</p>
      </div>

    </div>
  </div>
</section>
    </>
  )
}
