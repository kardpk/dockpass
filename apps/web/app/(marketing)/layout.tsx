import type { ReactNode } from 'react'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { MarketingScripts } from '@/components/marketing/MarketingScripts'
import { CookieBanner } from '@/components/marketing/CookieBanner'
import './marketing.css'

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="marketing-page">
      <MarketingNav />
      {children}
      <MarketingFooter />
      <CookieBanner />
      <MarketingScripts />
    </div>
  )
}

