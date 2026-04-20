import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Cookie Notice — Boatcheckin',
  description: 'What cookies and similar technologies Boatcheckin uses, why, and how to manage them.',
}

export default function CookiesPage() {
  return (
    <>
      <div className="dateline"><div className="container"><div className="dateline-inner"><div><span className="dl-dot">●</span> COOKIE NOTICE</div><div>ST. PETERSBURG · FLORIDA</div><div id="todayDate">CAPTAIN'S LOG — TODAY</div></div></div></div>

<section className="doc-hero">
  <div className="container-doc">
    <span className="eyebrow">Cookie Notice</span>
    <h1>What we store on your device — <em>and why.</em></h1>
    <p style={{ fontSize: '17px', lineHeight: '1.65', color: 'var(--ink-soft)', maxWidth: '680px' }}>This Notice explains the cookies and similar technologies used by boatcheckin.com and the Boatcheckin application, and how to manage them. It supplements our <a className="inline" style={{ color: 'var(--rust)', fontWeight: '500', borderBottom: '1px dashed var(--rust)' }} href="/privacy">Privacy Policy</a>.</p>
    <div className="doc-meta">
      <div className="doc-meta-item"><span className="dm-label">Version</span><span className="dm-value">1.0</span></div>
      <div className="doc-meta-item"><span className="dm-label">Effective date</span><span className="dm-value">April 20, 2026</span></div>
      <div className="doc-meta-item"><span className="dm-label">Ad cookies</span><span className="dm-value">None used</span></div>
    </div>
  </div>
</section>

<section className="container-doc">
  <div className="doc-body">
    <div className="doc-content">

      <div className="callout info">
        <div className="callout-tag info">The short version</div>
        <p>We use the cookies and similar technologies <strong>strictly necessary</strong> to operate the Services, plus a small set of <strong>functional</strong> cookies to remember preferences. We do not use cookies for behavioral advertising, do not share cookie data with advertising networks, and do not place tracking pixels on our site for third-party marketing purposes. If your browser sends a Global Privacy Control (GPC) signal, we honor it.</p>
      </div>

      <h2><span className="sec">§ 1</span>What cookies are</h2>
      <p>A "cookie" is a small text file that a website stores on your device so the site can recognize your browser on subsequent requests — for example, to keep you signed in, remember your preferences, or carry a session across pages. "Similar technologies" include local storage, session storage, pixels, and device identifiers that serve comparable purposes. Throughout this Notice, we refer to all of these as "cookies" for simplicity.</p>

      <h2><span className="sec">§ 2</span>Categories we use</h2>
      <p>We group cookies by purpose. The table below describes each category and whether you can turn it off without breaking the Services.</p>

      <div className="dt-wrap">
        <table className="dt">
          <thead>
            <tr>
              <th style={{ width: '22%' }}>Category</th>
              <th style={{ width: '48%' }}>What it does</th>
              <th style={{ width: '15%' }}>Can you opt out?</th>
              <th style={{ width: '15%' }}>Lifespan</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Strictly necessary</strong></td>
              <td>Keeps you signed in, maintains your session, enforces rate limits, protects against abuse and bot traffic, and delivers the page to you. These are required for the Services to function.</td>
              <td>No — disabling breaks login and core features.</td>
              <td>Session to 30 days</td>
            </tr>
            <tr>
              <td><strong>Functional</strong></td>
              <td>Remembers preferences you've set — theme, language, timezone, UI state, last-used operator dashboard view, accepted cookie banner choice.</td>
              <td>Yes — via our cookie settings or your browser.</td>
              <td>Up to 12 months</td>
            </tr>
            <tr>
              <td><strong>Analytics (privacy-preserving)</strong></td>
              <td>Aggregate, non-identifying usage signals — page views, load times, error rates — used to improve reliability and performance. We use privacy-preserving analytics that do not build cross-site profiles.</td>
              <td>Yes — GPC is honored; you can also decline via settings.</td>
              <td>Up to 24 months</td>
            </tr>
            <tr>
              <td><strong>Advertising / marketing</strong></td>
              <td><strong>None used.</strong> We do not place, permit, or integrate third-party advertising cookies, retargeting pixels, or behavioral-advertising technologies on the Services.</td>
              <td>N/A</td>
              <td>N/A</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2><span className="sec">§ 3</span>First-party and third-party</h2>
      <p>Most cookies we use are <strong>first-party</strong>, set directly by boatcheckin.com. A limited number of <strong>third-party</strong> cookies are set by the service providers we use to run the platform — for example, providers that deliver bot-protection challenges on sign-in forms, or providers that monitor application errors. These are set for the operational purposes above, not for advertising or independent profiling. A current list of subprocessors is available on request — see <a className="inline" href="/privacy#s8">§8 of our Privacy Policy</a>.</p>

      <h2><span className="sec">§ 4</span>How to manage cookies</h2>

      <h3>4.1 Through your browser</h3>
      <p>All modern browsers allow you to view, block, or delete cookies. The exact steps vary by browser — here are links to the major ones:</p>
      <ul>
        <li><strong>Chrome</strong> — Settings → Privacy and security → Cookies and other site data</li>
        <li><strong>Safari</strong> — Preferences → Privacy → Manage Website Data</li>
        <li><strong>Firefox</strong> — Settings → Privacy &amp; Security → Cookies and Site Data</li>
        <li><strong>Edge</strong> — Settings → Cookies and site permissions → Cookies and site data</li>
      </ul>
      <p>Blocking all cookies will prevent sign-in and break most of the Services. Blocking only third-party cookies is generally compatible with normal use.</p>

      <h3>4.2 Through your device settings</h3>
      <p>On mobile devices, operating system settings provide additional controls — including the ability to reset your advertising identifier (which we do not use, but which affects other apps you use).</p>

      <h3>4.3 Through privacy signals we honor</h3>
      <p>We honor the <strong>Global Privacy Control (GPC)</strong> signal transmitted by browsers and extensions that support it — treating it as a valid opt-out for applicable personal information categories under US state privacy laws. If your browser or an installed extension sends GPC, no further action is needed to opt out of data uses covered by that law.</p>
      <p>We do not currently change behavior in response to legacy "Do Not Track" (DNT) headers, because no common industry standard for responding to DNT has emerged.</p>

      <h2><span className="sec">§ 5</span>What we don't do with cookies</h2>
      <p>For clarity — because this is where cookie notices usually hedge:</p>
      <ul>
        <li>We do not sell cookie data. We do not share cookie data with advertising networks for cross-context behavioral advertising.</li>
        <li>We do not use cookies to build behavioral profiles of you across unrelated websites.</li>
        <li>We do not use fingerprinting as a fallback when cookies are disabled.</li>
        <li>We do not set cookies on our public marketing pages for the purpose of retargeting visitors with advertising.</li>
      </ul>

      <h2><span className="sec">§ 6</span>Changes to this Notice</h2>
      <p>We may update this Notice as our use of cookies changes. When we do, we will update the "Effective date" above and, if the change is material, announce it through the Services. Older versions are available on request.</p>

      <h2><span className="sec">§ 7</span>Contact</h2>
      <p>Questions about this Notice, or to request a current list of cookies and subprocessors we rely on, contact us.</p>

      <div className="contact-block">
        <h3>Boatcheckin · Privacy</h3>
        <p style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--brass)' }}>Email</p>
        <p><a href="mailto:privacy@boatcheckin.com">privacy@boatcheckin.com</a></p>
        <p style={{ marginTop: '10px', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--brass)' }}>Mail</p>
        <p>Oakmont Logic LLC · Attn: Privacy · 7901 4th St N, #8722 · St. Petersburg, FL 33702 · United States</p>
      </div>

    </div>
  </div>
</section>
    </>
  )
}
