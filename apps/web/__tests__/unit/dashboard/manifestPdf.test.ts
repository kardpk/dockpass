import { describe, it, expect } from 'vitest'
import { generateManifest } from '@/lib/pdf/manifest'
import { buildAddonSummary, buildCaptainAlerts } from '@/lib/dashboard/getDashboardData'
import type { OperatorTripDetail } from '@/types'

const mockTrip: OperatorTripDetail = {
  id: 'trip-1',
  slug: 'test-slug-abc',
  tripCode: 'SUN4',
  tripDate: '2024-10-21',
  departureTime: '14:00',
  durationHours: 4,
  maxGuests: 8,
  status: 'upcoming',
  charterType: 'captained',
  requiresApproval: false,
  specialNotes: null,
  startedAt: null,
  buoyPolicyId: null,
  boat: {
    id: 'boat-1',
    boatName: 'Conrad\'s Yacht Miami',
    boatType: 'yacht',
    marinaName: 'Miami Beach Marina',
    marinaAddress: '300 Alton Rd, Miami Beach, FL',
    slipNumber: '14A',
    lat: 25.7786, lng: -80.1392,
    captainName: 'Captain Conrad',
    waiverText: 'Test waiver text...',
    firmaTemplateId: null,
    safetyCards: [],
  },
  guests: [
    {
      id: 'guest-1',
      customerId: null,
      fullName: 'Sofia Martinez',
      emergencyContactName: 'Carlos Martinez',
      emergencyContactPhone: '+1-305-555-0199',
      languagePreference: 'es',
      dietaryRequirements: null,
      dateOfBirth: '1995-06-15',
      isNonSwimmer: false,
      isSeaSicknessProne: false,
      waiverSigned: true,
      waiverSignedAt: '2024-10-20T10:00:00Z',
      approvalStatus: 'auto_approved',
      checkedInAt: null,
      createdAt: '2024-10-20T10:00:00Z',
      safetyAcknowledgments: [],
      waiverTextHash: null,
      fwcLicenseUrl: null,
      liveryBriefingVerifiedAt: null,
      liveryBriefingVerifiedBy: null,
      addonOrders: [
        { addonName: 'Champagne', emoji: '🥂', quantity: 1, totalCents: 8500 },
      ],
    },
    {
      id: 'guest-2',
      customerId: null,
      fullName: 'Ahmed Khan',
      emergencyContactName: null,
      emergencyContactPhone: null,
      languagePreference: 'en',
      dietaryRequirements: 'Nut allergy',
      dateOfBirth: '1990-03-22',
      isNonSwimmer: true,
      isSeaSicknessProne: true,
      waiverSigned: false,
      waiverSignedAt: null,
      approvalStatus: 'pending',
      checkedInAt: null,
      createdAt: '2024-10-20T11:00:00Z',
      safetyAcknowledgments: [],
      waiverTextHash: null,
      fwcLicenseUrl: null,
      liveryBriefingVerifiedAt: null,
      liveryBriefingVerifiedBy: null,
      addonOrders: [],
    },
  ],
  bookings: [],
}

describe('generateManifest', () => {
  it('returns a Uint8Array (PDF bytes)', async () => {
    const bytes = await generateManifest(
      mockTrip, 'Conrad Rivera', []
    )
    expect(bytes).toBeInstanceOf(Uint8Array)
    expect(bytes.length).toBeGreaterThan(1000)
  })

  it('PDF starts with %PDF-1', async () => {
    const bytes = await generateManifest(mockTrip, 'Conrad', [])
    const header = new TextDecoder().decode(bytes.slice(0, 8))
    expect(header).toContain('%PDF-1')
  })
})

describe('buildAddonSummary', () => {
  it('aggregates addons by name', () => {
    const summary = buildAddonSummary(mockTrip.guests)
    expect(summary).toHaveLength(1)
    expect(summary[0]?.addonName).toBe('Champagne')
    expect(summary[0]?.totalQty).toBe(1)
    expect(summary[0]?.totalCents).toBe(8500)
    expect(summary[0]?.guestNames).toContain('Sofia')
  })

  it('returns empty for guests with no orders', () => {
    const guestNoAddons = {
      ...mockTrip.guests[1]!,
      addonOrders: [],
    }
    expect(buildAddonSummary([guestNoAddons])).toHaveLength(0)
  })

  it('combines multiple guests ordering same addon', () => {
    const guests = [
      { ...mockTrip.guests[0]!, addonOrders: [
        { addonName: 'Champagne', emoji: '🥂', quantity: 2, totalCents: 17000 },
      ]},
      { ...mockTrip.guests[1]!, addonOrders: [
        { addonName: 'Champagne', emoji: '🥂', quantity: 1, totalCents: 8500 },
      ]},
    ]
    const summary = buildAddonSummary(guests)
    expect(summary).toHaveLength(1)
    expect(summary[0]?.totalQty).toBe(3)
    expect(summary[0]?.totalCents).toBe(25500)
    expect(summary[0]?.guestNames).toEqual(['Sofia', 'Ahmed'])
  })
})

describe('buildCaptainAlerts', () => {
  it('detects non-swimmers', () => {
    const alerts = buildCaptainAlerts(mockTrip.guests)
    expect(alerts.nonSwimmers).toBe(1)
  })

  it('detects seasickness prone', () => {
    const alerts = buildCaptainAlerts(mockTrip.guests)
    expect(alerts.seasicknessProne).toBe(1)
  })

  it('includes dietary requirements', () => {
    const alerts = buildCaptainAlerts(mockTrip.guests)
    expect(alerts.dietary).toHaveLength(1)
    expect(alerts.dietary[0]?.requirement).toBe('Nut allergy')
  })
})
