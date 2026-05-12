'use client'
import { useState } from 'react'

const FAQ_LEFT: [string, string][] = [
  [
    "What if a guest doesn't complete the link before the trip?",
    "The captain snapshot shows who has and has not completed registration. The captain decides whether to proceed. Boatcheckin never prevents departure — the captain directs, Boatcheckin records. You can also send a reminder from the dashboard, or have guests complete registration on-site using the 4-character trip code.",
  ],
  [
    "Can guests complete it on the day, at the dock?",
    "Yes. The trip link stays open until the captain seals the trip. A guest who has not completed ahead of time can use their phone at the dock. The 4-character trip code can also be used to find the trip directly if they lose the link.",
  ],
  [
    "Does the captain need the Boatcheckin app?",
    "No. The captain snapshot is a link sent by SMS before the trip. They open it in any browser. No login, no download, no account. It is designed to work on marginal signal at a marina — the page loads fast and functions offline once loaded.",
  ],
]

const FAQ_RIGHT: [string, string][] = [
  [
    "Can Boatcheckin connect to FareHarbor or my booking platform?",
    "Yes. Boatcheckin supports webhook integrations with FareHarbor, Rezdy, and other booking platforms. When a booking is confirmed, Boatcheckin automatically creates the trip and queues the guest link for the booker. Fleet and Harbormaster tier operators include integration setup support.",
  ],
  [
    "How do guests sign if they don't have a smartphone?",
    "The trip link works on any device with a browser, including basic smartphones and tablets. For guests without a device, the operator can complete registration on their behalf using the operator dashboard — entering the guest's details and obtaining a signature that is attached to the record.",
  ],
  [
    "What happens to the record after the trip?",
    "The record is sealed at trip completion, retained for a minimum of five years (operator-configurable), and searchable from the operator dashboard by date, vessel, captain, or guest name. Any trip record can be exported as a complete PDF package containing waivers, acknowledgments, manifest, and audit trail.",
  ],
]

export function HowItWorksFAQ() {
  const [openKey, setOpenKey] = useState<string | null>(null)

  function toggle(key: string) {
    setOpenKey(prev => (prev === key ? null : key))
  }

  function Item({ q, a, id }: { q: string; a: string; id: string }) {
    const isOpen = openKey === id
    return (
      <div className="fq-item" style={isOpen ? {} : {}}>
        <button className="fq-q" onClick={() => toggle(id)} aria-expanded={isOpen}>
          {q}
        </button>
        <div className="fq-a" style={{ maxHeight: isOpen ? 400 : 0 }}>
          <div className="fq-a-in">{a}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="faq-cols">
      <div>
        {FAQ_LEFT.map(([q, a]) => (
          <Item key={q} q={q} a={a} id={q} />
        ))}
      </div>
      <div>
        {FAQ_RIGHT.map(([q, a]) => (
          <Item key={q} q={q} a={a} id={q} />
        ))}
      </div>
    </div>
  )
}
