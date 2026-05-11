import type { Metadata } from 'next'
import './(marketing)/marketing.css'
import HomepageBody from './HomepageBody'

export const metadata: Metadata = {
  title: 'Boatcheckin — Compliance records for every charter trip',
  description:
    'Compliance recordkeeping software for Florida charter operators. Signed waivers, safety briefings, manifests, and audit trails. Hash-verified, retained for years, exportable on demand. Free for solo captains.',
  openGraph: {
    title: 'Boatcheckin — Compliance records for every charter trip',
    description:
      'The complete compliance record for every trip you run. Hash-verified. Retained. Defensible.',
    type: 'website',
    url: 'https://boatcheckin.com',
    siteName: 'Boatcheckin',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Boatcheckin — Compliance records for every charter trip',
    description:
      'Compliance recordkeeping for Florida charter operators. Free for solo captains and charters up to 3 boats.',
  },
}

export default function HomePage() {
  return (
    <>
      <HomepageBody />
    </>
  )
}
