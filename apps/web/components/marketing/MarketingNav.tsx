'use client'

import { useState } from 'react'
import Link from 'next/link'

const COMPLIANCE_LINKS: [string, string][] = [
  ['/standards', 'Standards'],
  ['/security', 'Security'],
  ['/guest-notice', 'Guest Notice'],
]

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display:'inline-block', marginLeft:4, verticalAlign:'middle' }}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

export function MarketingNav() {
  const [navOpen, setNavOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <nav className="hp-nav">
      <div className="nav-inner">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <svg viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="13" stroke="#0B1E2D" strokeWidth="1.5" />
              <path d="M16 6v20M6 16h20" stroke="#0B1E2D" strokeWidth="1.5" />
              <path d="M16 2 L18 6 L14 6 Z" fill="#B84A1F" />
              <circle cx="16" cy="16" r="3" fill="#0B1E2D" />
            </svg>
          </span>
          Boatcheckin
        </Link>

        <div className={`nav-links${navOpen ? ' open' : ''}`}>
          <Link href="/#how">How it Works</Link>

          {/* Compliance dropdown */}
          <div
            className="nav-dropdown-wrap"
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownOpen(false)}
          >
            <Link href="/#compliance" className="nav-dropdown-trigger" onClick={() => setDropdownOpen(o => !o)}>
              Compliance<ChevronIcon />
            </Link>
            {dropdownOpen && (
              <div className="nav-dropdown">
                {COMPLIANCE_LINKS.map(([href, label]) => (
                  <Link key={href} href={href} className="nav-dropdown-item" onClick={() => { setDropdownOpen(false); setNavOpen(false) }}>
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link href="/#operators">For Operators</Link>
          <Link href="/#pricing">Pricing</Link>
          <Link href="/about">About</Link>

          {/* Mobile-only compliance links (shown when nav is open) */}
          {navOpen && (
            <div className="nav-mobile-group">
              <span className="nav-mobile-label">Compliance</span>
              {COMPLIANCE_LINKS.map(([href, label]) => (
                <Link key={href} href={href} className="nav-mobile-sub" onClick={() => setNavOpen(false)}>
                  → {label}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="nav-cta">
          <Link href="/login" className="btn">Sign In</Link>
          <Link href="/signup" className="btn btn-primary">
            Get Started <ArrowIcon />
          </Link>
          <button className="nav-toggle" aria-label="Menu" onClick={() => setNavOpen(o => !o)}>
            <span /><span /><span />
          </button>
        </div>
      </div>
    </nav>
  )
}
