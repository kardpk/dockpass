'use client'

import type { CrewRole } from '@/types'

interface CrewMember {
  name: string
  role: string
  license: string | null
}

const ROLE_LABELS: Record<CrewRole, string> = {
  captain: 'Captain',
  first_mate: 'First Mate',
  crew: 'Crew',
  deckhand: 'Deckhand',
}

const ROLE_ICONS: Record<CrewRole, string> = {
  captain: '👨‍✈️',
  first_mate: '⚓',
  crew: '🧑‍🤝‍🧑',
  deckhand: '🪢',
}

export function CrewManifestPanel({
  crewManifest,
  captainName,
  captainLicense,
}: {
  crewManifest: CrewMember[]
  captainName: string | null
  captainLicense: string | null
}) {
  // If no assignments and no boat-default captain, don't render
  if (crewManifest.length === 0 && !captainName) return null

  // If no assignments but boat has a default captain, show just the default
  const effectiveCrew: CrewMember[] = crewManifest.length > 0
    ? crewManifest
    : captainName
      ? [{ name: captainName, role: 'captain', license: captainLicense }]
      : []

  if (effectiveCrew.length === 0) return null

  return (
    <div className="bg-white rounded-[20px] border border-[#D0E2F3] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#F5F8FC]">
        <h2 className="text-[16px] font-semibold text-[#0D1B2A]">
          👨‍✈️ Crew Manifest
        </h2>
      </div>
      <div className="divide-y divide-[#F5F8FC]">
        {effectiveCrew.map((member, idx) => {
          const role = member.role as CrewRole
          return (
            <div key={`${member.name}-${idx}`} className="px-5 py-3.5 flex items-center gap-3">
              <div className="
                w-10 h-10 rounded-full bg-[#E8F2FB]
                flex items-center justify-center
                text-[18px] flex-shrink-0
              ">
                {ROLE_ICONS[role] ?? '🧑'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-[#0D1B2A] truncate">
                  {member.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[12px] text-[#6B7C93]">
                    {ROLE_LABELS[role] ?? member.role}
                  </span>
                  {member.license && (
                    <>
                      <span className="text-[#D0E2F3]">·</span>
                      <span className="text-[11px] text-[#0C447C] font-medium">
                        🪪 {member.license}
                      </span>
                    </>
                  )}
                </div>
              </div>
              {role === 'captain' && (
                <span className="text-[11px] font-bold text-[#0C447C] bg-[#E8F2FB] px-2.5 py-1 rounded-full flex-shrink-0">
                  PIC
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
