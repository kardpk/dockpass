import type { Metadata } from 'next'
import './(marketing)/marketing.css'
import HomepageBody from './HomepageBody'

export const metadata: Metadata = {
  title: 'Boatcheckin — The record of every charter trip, kept in order',
  description:
    'Recordkeeping software for Florida charter operators. Document waivers, safety briefings, manifests, and the audit trail regulators ask for. Free for solo captains and small charters.',
  openGraph: {
    title: 'Boatcheckin — The record of every charter trip, kept in order',
    description:
      'One link. Every guest documented, every waiver hashed, every briefing recorded.',
    type: 'website',
    url: 'https://boatcheckin.com',
    siteName: 'Boatcheckin',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Boatcheckin — The record of every charter trip',
    description:
      'Documentation software for Florida charter operators. Aligned with SB 606, 46 CFR §185.506, FWC Ch. 327. Free for solo captains.',
  },
}

export default function HomePage() {
  return (
    <>
      <HomepageBody />
    </>
  )
}
