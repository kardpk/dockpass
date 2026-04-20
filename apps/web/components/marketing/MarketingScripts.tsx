'use client'

import { useEffect, useState } from 'react'

export function MarketingScripts() {
  const [todayDate, setTodayDate] = useState("CAPTAIN'S LOG — TODAY")

  useEffect(() => {
    // Dateline logic
    const d = new Date()
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
    setTodayDate(`CAPTAIN'S LOG — ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`)
    
    const el = document.getElementById('todayDate')
    if (el) el.textContent = `CAPTAIN'S LOG — ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`

    // Animation observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          ;(e.target as HTMLElement).style.opacity = '1'
          ;(e.target as HTMLElement).style.transform = 'translateY(0)'
        }
      })
    }, { threshold: 0.1 })

    const animElements = document.querySelectorAll('.flow-cell, .aud-card, .principle-item, .not-row, .ad-card')
    animElements.forEach(item => {
      const hEl = item as HTMLElement
      hEl.style.opacity = '0'
      hEl.style.transform = 'translateY(16px)'
      hEl.style.transition = 'opacity 0.5s ease, transform 0.5s ease'
      observer.observe(hEl)
    })

    return () => observer.disconnect()
  }, [])

  return null
}
