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

  // Run all 3 queries in parallel (was sequential: ~180ms → ~60ms)
  const [captainsResult, boatLinksResult, operatorBoatsResult] = await Promise.all([
    // Fetch active captains
    supabase
      .from('captains')
      .select('*')
      .eq('operator_id', operator.id)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('full_name', { ascending: true }),

    // Fetch boat links
    supabase
      .from('captain_boat_links')
      .select('captain_id, boat_id, boats ( id, boat_name )')
      .eq('operator_id', operator.id),

    // Fetch operator's boats (for the link boat dropdown)
    supabase
      .from('boats')
      .select('id, boat_name')
      .eq('operator_id', operator.id)
      .eq('is_active', true)
      .order('boat_name', { ascending: true }),
  ])

  const profiles: CaptainProfile[] = (captainsResult.data ?? []).map(r => toCaptainProfile(r as Record<string, unknown>))

  // Map links into profiles
  const linkMap = new Map<string, { boatId: string; boatName: string }[]>()
  for (const link of (boatLinksResult.data ?? [])) {
    const boat = link.boats as unknown as { id: string; boat_name: string } | null
    if (!boat) continue
    const existing = linkMap.get(link.captain_id) ?? []
    existing.push({ boatId: boat.id, boatName: boat.boat_name })
    linkMap.set(link.captain_id, existing)
  }

  for (const profile of profiles) {
    profile.linkedBoats = linkMap.get(profile.id) ?? []
  }

  const boatOptions = (operatorBoatsResult.data ?? []).map(b => ({
    id: b.id as string,
    name: b.boat_name as string,
  }))

  // Check for expiring/expired licenses (within 60 days)
  const expiringCaptains = profiles.filter(c => {
    if (!c.licenseExpiry) return false
    const daysLeft = Math.ceil((new Date(c.licenseExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return daysLeft <= 60
  })

  return (
    <div style={{ maxWidth: 660, margin: '0 auto', padding: 'var(--s-6) var(--s-5) 120px' }}>
      <CrewRosterClient
        initialCaptains={profiles}
        expiringCaptains={expiringCaptains}
        operatorBoats={boatOptions}
      />
    </div>
  )
}
