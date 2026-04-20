import Link from 'next/link'

export function MarketingFooter() {
  return (
    <footer className="hp-footer">
      <div className="hp-container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">Boatcheckin</div>
            <p className="footer-desc">Recordkeeping software for Florida charter operators. Built by people who've watched too many paper clipboards blow off the dock.</p>
            <div className="footer-contact-item"><span className="fci-label">General</span><a href="mailto:hello@boatcheckin.com">hello@boatcheckin.com</a></div>
            <div className="footer-contact-item"><span className="fci-label">Phone</span><a href="tel:+17865097869">+1 (786) 509-7869</a></div>
            <div className="footer-contact-item">
              <span className="fci-label">Mailing Address</span>
              <address>Oakmont Logic LLC<br />7901 4th St N, #8722<br />St. Petersburg, FL 33702<br />United States</address>
            </div>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <ul>
              {[['/#how', 'How it Works'], ['/#compliance', 'Compliance'], ['/#pricing', 'Pricing'], ['/#operators', 'For Marinas']].map(([href, label]) => (
                <li key={label}><Link href={href}>{label}</Link></li>
              ))}
            </ul>
          </div>
          <div className="footer-col">
            <h4>Regulations</h4>
            <ul>
              {[['/#compliance', 'SB 606 / §327.54'], ['/#compliance', '46 CFR §185.506'], ['/#compliance', 'FWC Chapter 327'], ['/#compliance', 'USCG Manifest'], ['/standards', 'Our Standards']].map(([href, label]) => (
                <li key={label}><Link href={href}>{label}</Link></li>
              ))}
            </ul>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              {[['/about', 'About'], ['/contact', 'Contact'], ['/privacy', 'Privacy'], ['/terms', 'Terms'], ['/security', 'Security'], ['/acceptable-use', 'Acceptable Use']].map(([href, label]) => (
                <li key={label}><Link href={href}>{label}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="fb-meta">
            <span>© 2026 Oakmont Logic LLC. All rights reserved.</span>
            <span className="fb-sep">·</span>
            <span>Boatcheckin™ is a product of Oakmont Logic LLC, a Wyoming-registered entity with a Florida mailing address.</span>
          </div>
          <div className="footer-legal">
            <p><strong style={{ color: 'rgba(244,239,230,0.65)' }}>Not legal or insurance advice.</strong> Boatcheckin is a software platform that helps charter operators organize, capture, and store compliance documentation. Boatcheckin is not a law firm and does not provide legal advice; nothing on this site should be relied upon as legal advice for your specific situation. Operators remain solely responsible for their own compliance with applicable federal, state, and local law.</p>
            <p><strong style={{ color: 'rgba(244,239,230,0.65)' }}>Not an insurance broker or carrier.</strong> Boatcheckin does not sell, solicit, negotiate, bind, or service insurance. Insurance products referenced on this site are offered by licensed agents and underwritten by licensed carriers. Boatcheckin receives a fixed referral fee per qualifying lead, paid regardless of whether a policy is purchased.</p>
            <p><strong style={{ color: 'rgba(244,239,230,0.65)' }}>Statutory references.</strong> References to SB 606, 46 CFR §185.506, FWC Chapter 327, the ESIGN Act, and UETA are descriptive, not interpretive. Always consult the original statute and a licensed attorney for application to your operation.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
