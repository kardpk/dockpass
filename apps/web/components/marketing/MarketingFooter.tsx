import Link from 'next/link'

export function MarketingFooter() {
  return (
    <footer className="site-footer">
      <div className="w">
        <div className="ft-grid">
          {/* Brand col */}
          <div>
            <div className="ft-brand">Boatcheckin</div>
            <p className="ft-desc">Compliance recordkeeping software for Florida charter operators.</p>
            <div className="ft-c"><div className="ft-cl">General</div><a href="mailto:hello@boatcheckin.com">hello@boatcheckin.com</a></div>
            <div className="ft-c"><div className="ft-cl">Support</div><a href="mailto:support@boatcheckin.com">support@boatcheckin.com</a></div>
            <div className="ft-c"><div className="ft-cl">Phone</div><a href="tel:+17865097869">+1 (786) 509-7869</a></div>
            <div className="ft-c">
              <div className="ft-cl">Mailing address</div>
              <address>Oakmont Logic LLC<br/>7901 4th St N, #8722<br/>St. Petersburg, FL 33702</address>
            </div>
          </div>

          {/* Product */}
          <div className="ft-col">
            <h4>Product</h4>
            <ul>
              <li><Link href="/how-it-works">How it Works</Link></li>
              <li><Link href="/#pricing">Pricing</Link></li>
              <li><Link href="/#operators">For Marinas</Link></li>
              <li><Link href="/signup">Get Started Free</Link></li>
            </ul>
          </div>

          {/* Regulations */}
          <div className="ft-col">
            <h4>Regulations</h4>
            <ul>
              <li><Link href="/standards">SB 606 / §327.54</Link></li>
              <li><Link href="/standards">46 CFR §185.506</Link></li>
              <li><Link href="/standards">FWC Chapter 327</Link></li>
              <li><Link href="/standards">Our Standards</Link></li>
              <li><Link href="/security">Security</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div className="ft-col">
            <h4>Company</h4>
            <ul>
              <li><Link href="/about">About</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/guest-notice">Guest Notice</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="ft-col">
            <h4>Legal</h4>
            <ul>
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms of Service</Link></li>
              <li><Link href="/acceptable-use">Acceptable Use</Link></li>
              <li><Link href="/cookies">Cookie Policy</Link></li>
              <li><Link href="/dmca">DMCA Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="ft-bottom">
          <div className="ft-copy">© 2026 Oakmont Logic LLC. All rights reserved.</div>
          <div className="ft-links">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/cookies">Cookies</Link>
            <Link href="/dmca">DMCA</Link>
            <Link href="/acceptable-use">Acceptable Use</Link>
            <Link href="/guest-notice">Guest Notice</Link>
            <Link href="/security">Security</Link>
          </div>
          <div className="ft-disc">
            <p><strong>Not legal or insurance advice.</strong> Boatcheckin is a software platform that helps charter operators organize, capture, and store compliance documentation. Boatcheckin is not a law firm and does not provide legal advice. Operators remain solely responsible for their own compliance with applicable federal, state, and local law.</p>
            <p><strong>Not an insurance broker or carrier.</strong> Boatcheckin does not sell, solicit, negotiate, bind, or service insurance. Insurance products referenced on this site are offered by licensed agents and underwritten by licensed carriers. Boatcheckin receives a fixed referral fee per qualifying lead, paid regardless of whether a policy is purchased.</p>
            <p><strong>Statutory references.</strong> References to SB 606, 46 CFR §185.506, FWC Chapter 327, the ESIGN Act, and UETA are descriptive, not interpretive. Always consult the original statute and a licensed attorney for application to your operation.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
