'use client'
import { useState } from 'react'
import Link from 'next/link'

export function MarketingNav() {
  const [open, setOpen] = useState(false)
  return (
    <header className="site-nav">
      <div className="nav-in">
        <Link href="/" className="logo">
          <span className="logo-mark">
            <svg viewBox="0 0 32 32" fill="none">
              <path d="M16 5v22M5 16h22" stroke="#e8e8e0" strokeWidth="1.5"/>
              <path d="M16 1 L19 6 L13 6 Z" fill="#c9a227"/>
              <circle cx="16" cy="16" r="3" fill="#c9a227"/>
            </svg>
          </span>
          Boatcheckin
        </Link>

        <nav className={`nav-links${open ? ' open' : ''}`}>
          <Link href="/how-it-works" onClick={() => setOpen(false)}>How it Works</Link>
          <Link href="/#operators" onClick={() => setOpen(false)}>For Operators</Link>
          <Link href="/#pricing" onClick={() => setOpen(false)}>Pricing</Link>
          <Link href="/standards" onClick={() => setOpen(false)}>Standards</Link>
          <Link href="/about" onClick={() => setOpen(false)}>About</Link>
        </nav>

        <div className="nav-cta">
          <Link href="/login" className="btn btn-ghost">Sign In</Link>
          <Link href="/signup" className="btn btn-gold">Get Started</Link>
          <button className="m-toggle" aria-label="Menu" onClick={() => setOpen(o => !o)}>
            <span/><span/><span/>
          </button>
        </div>
      </div>
    </header>
  )
}
