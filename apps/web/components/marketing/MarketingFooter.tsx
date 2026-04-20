'use client'

import Link from 'next/link'

export function MarketingFooter() {
  return (
    <footer className="hp-footer">
      <div className="hp-container">
        <div className="footer-grid">
          {/* Col 1 — Brand + Contact */}
          <div>
            <div className="footer-brand">Boatcheckin</div>
            <p className="footer-desc">Recordkeeping software for Florida charter operators. Built by people who've watched too many paper clipboards blow off the dock.</p>
            <div className="footer-contact-item"><span className="fci-label">General</span><a href="mailto:hello@boatcheckin.com">hello@boatcheckin.com</a></div>
            <div className="footer-contact-item"><span className="fci-label">Support</span><a href="mailto:support@boatcheckin.com">support@boatcheckin.com</a></div>
            <div className="footer-contact-item"><span className="fci-label">Phone</span><a href="tel:+17865097869">+1 (786) 509-7869</a></div>
            <div className="footer-contact-item">
              <span className="fci-label">Mailing Address</span>
              <address>Oakmont Logic LLC<br />7901 4th St N, #8722<br />St. Petersburg, FL 33702<br />United States</address>
            </div>
          </div>

          {/* Col 2 — Product */}
          <div className="footer-col">
            <h4>Product</h4>
            <ul>
              {([
                ['/#how', 'How it Works'],
                ['/#compliance', 'Compliance'],
                ['/#pricing', 'Pricing'],
                ['/#operators', 'For Marinas'],
                ['/signup', 'Get Started Free'],
              ] as [string, string][]).map(([href, label]) => (
                <li key={label}><Link href={href}>{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Regulations */}
          <div className="footer-col">
            <h4>Regulations</h4>
            <ul>
              {([
                ['/#compliance', 'SB 606 / §327.54'],
                ['/#compliance', '46 CFR §185.506'],
                ['/#compliance', 'FWC Chapter 327'],
                ['/#compliance', 'USCG Manifest'],
                ['/standards', 'Our Standards'],
                ['/security', 'Security'],
              ] as [string, string][]).map(([href, label]) => (
                <li key={label}><Link href={href}>{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Col 4 — Company */}
          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              {([
                ['/about', 'About Us'],
                ['/contact', 'Contact'],
                ['/guest-notice', 'Guest Notice'],
              ] as [string, string][]).map(([href, label]) => (
                <li key={label}><Link href={href}>{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Col 5 — Legal (NEW) */}
          <div className="footer-col">
            <h4>Legal</h4>
            <ul>
              {([
                ['/privacy', 'Privacy Policy'],
                ['/terms', 'Terms of Service'],
                ['/acceptable-use', 'Acceptable Use'],
                ['/cookies', 'Cookie Policy'],
                ['/dmca', 'DMCA Policy'],
              ] as [string, string][]).map(([href, label]) => (
                <li key={label}><Link href={href}>{label}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="footer-bottom">
          <div className="fb-meta">
            <span>© 2026 Oakmont Logic LLC. All rights reserved.</span>
            <span className="fb-sep">·</span>
            <span>Boatcheckin™ is a product of Oakmont Logic LLC, a Wyoming-registered entity with a Florida mailing address.</span>
          </div>
          <div className="footer-bottom-links">
            {([
              ['/privacy', 'Privacy'],
              ['/terms', 'Terms'],
              ['/cookies', 'Cookies'],
              ['/dmca', 'DMCA'],
              ['/acceptable-use', 'Acceptable Use'],
              ['/guest-notice', 'Guest Notice'],
              ['/security', 'Security'],
            ] as [string, string][]).map(([href, label], i, arr) => (
              <span key={label}>
                <Link href={href}>{label}</Link>
                {i < arr.length - 1 && <span className="fb-sep"> · </span>}
              </span>
            ))}
          </div>
          <div className="footer-legal">
            <p><strong>Not legal or insurance advice.</strong> Boatcheckin is a software platform that helps charter operators organize, capture, and store compliance documentation. Boatcheckin is not a law firm and does not provide legal advice; nothing on this site should be relied upon as legal advice for your specific situation. Operators remain solely responsible for their own compliance with applicable federal, state, and local law.</p>
            <p><strong>Not an insurance broker or carrier.</strong> Boatcheckin does not sell, solicit, negotiate, bind, or service insurance. Insurance products referenced on this site are offered by licensed agents and underwritten by licensed carriers. Boatcheckin receives a fixed referral fee per qualifying lead, paid regardless of whether a policy is purchased.</p>
            <p><strong>Statutory references.</strong> References to SB 606, 46 CFR §185.506, FWC Chapter 327, the ESIGN Act, and UETA are descriptive, not interpretive. Always consult the original statute and a licensed attorney for application to your operation.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
