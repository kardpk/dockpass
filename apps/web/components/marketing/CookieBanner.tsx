'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const consent = localStorage.getItem('cookie_consent')
      if (!consent) setVisible(true)
    } catch {
      // localStorage not available (SSR or private mode)
    }
  }, [])

  function accept() {
    try { localStorage.setItem('cookie_consent', 'accepted') } catch {}
    setVisible(false)
  }

  function decline() {
    try { localStorage.setItem('cookie_consent', 'declined') } catch {}
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookie consent">
      <div className="cookie-inner">
        <div className="cookie-text">
          <span className="cookie-label">🍪 Cookies</span>
          <span>
            We use essential cookies only — no tracking without your consent.{' '}
            <Link href="/cookies" className="cookie-link">Read our Cookie Policy</Link>
            {' '}to see exactly what we set and why.
          </span>
        </div>
        <div className="cookie-actions">
          <button className="cookie-btn cookie-btn-decline" onClick={decline}>
            Decline
          </button>
          <button className="cookie-btn cookie-btn-accept" onClick={accept}>
            Accept Essential Cookies
          </button>
        </div>
      </div>
    </div>
  )
}
