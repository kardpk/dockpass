import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { CrewRosterClient } from './CrewRosterClient'
import type { CaptainProfile } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Crew — BoatCheckin',
}

function toCaptainProfile(row: Record<string, unknown>): CaptainProfile {
  return {
    id: row.id as string,
    operatorId: row.operator_id as string,
    fullName: row.full_name as string,
    photoUrl: (row.photo_url as string) ?? null,
    bio: (row.bio as string) ?? null,
    phone: (row.phone as string) ?? null,
    email: (row.email as string) ?? null,
    licenseNumber: (row.license_number as string) ?? null,
    licenseType: (row.license_type as CaptainProfile['licenseType']) ?? null,
    licenseExpiry: (row.license_expiry as string) ?? null,
    languages: (row.languages as string[]) ?? ['en'],
    yearsExperience: (row.years_experience as number) ?? null,
    certifications: (row.certifications as string[]) ?? [],
    isActive: row.is_active as boolean,
    isDefault: row.is_default as boolean,
    defaultRole: (row.default_role as CaptainProfile['defaultRole']) ?? 'captain',
    linkedBoats: [],
    createdAt: row.created_at as string,
  }
}

export default async function CrewPage() {
  const { operator } = await requireOperator()
  const supabase = createServiceClient()

  // Fetch active captains
  const { data: captains } = await supabase
    .from('captains')
    .select('*')
    .eq('operator_id', operator.id)
    .eq('is_active', true)
    .order('is_default', { ascending: false })
    .order('full_name', { ascending: true })

  const profiles: CaptainProfile[] = (captains ?? []).map(r => toCaptainProfile(r as Record<string, unknown>))

  // Fetch boat links
  const { data: boatLinks } = await supabase
    .from('captain_boat_links')
    .select('captain_id, boat_id, boats ( id, boat_name )')
    .eq('operator_id', operator.id)

  // Map links into profiles
  const linkMap = new Map<string, { boatId: string; boatName: string }[]>()
  for (const link of (boatLinks ?? [])) {
    const boat = link.boats as unknown as { id: string; boat_name: string } | null
    if (!boat) continue
    const existing = linkMap.get(link.captain_id) ?? []
    existing.push({ boatId: boat.id, boatName: boat.boat_name })
    linkMap.set(link.captain_id, existing)
  }

  for (const profile of profiles) {
    profile.linkedBoats = linkMap.get(profile.id) ?? []
  }

  // Fetch operator's boats (for the link boat dropdown)
  const { data: operatorBoats } = await supabase
    .from('boats')
    .select('id, boat_name')
    .eq('operator_id', operator.id)
    .eq('is_active', true)
    .order('boat_name', { ascending: true })

  const boatOptions = (operatorBoats ?? []).map(b => ({
    id: b.id as string,
    name: b.boat_name as string,
  }))

  // Check for expiring licenses (within 30 days)
  const expiringCaptains = profiles.filter(c => {
    if (!c.licenseExpiry) return false
    const daysLeft = Math.ceil((new Date(c.licenseExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return daysLeft <= 30
  })

  return (
    <div className="max-w-[640px] mx-auto px-5 pb-[100px] pt-4">
      <CrewRosterClient
        initialCaptains={profiles}
        expiringCaptains={expiringCaptains}
        operatorBoats={boatOptions}
      />
    </div>
  )
}
