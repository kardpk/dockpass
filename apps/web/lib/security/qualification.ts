/**
 * qualification.ts
 *
 * SHA-256 attestation hashing for guest self-drive qualifications.
 * Mirrors the waiver.ts signing pattern for ESIGN-comparable audit records.
 *
 * The hash binds: guest identity + trip + all qualification fields + IP + timestamp.
 * Any field change produces a different hash — tamper-detectable.
 *
 * Reference: RESORT_FLEET_ARCHITECTURE.md §3.1 (attestation_hash)
 */

import crypto from 'crypto'

export interface QualificationAttestation {
  guestId:               string
  tripId:                string
  hasBoatOwnership:      boolean
  ownershipYears:        number | null
  ownershipVesselType:   string | null
  experienceYears:       number
  experienceDescription: string | null
  safetyBoaterRequired:  boolean
  safetyBoaterCardUrl:   string | null
  safetyBoaterCardState: string | null
  safetyBoaterCardNumber: string | null
  attestedAt:            string   // ISO 8601 timestamp
  ip:                    string
  userAgent:             string
}

const SCHEMA_VERSION = 'qual_v1'

/**
 * Returns a hex-encoded SHA-256 hash of the full attestation payload.
 * Used as the `attestation_hash` stored in guest_qualifications.
 */
export function hashQualificationAttestation(
  data: QualificationAttestation
): string {
  const payload = JSON.stringify({
    schema:                SCHEMA_VERSION,
    guestId:               data.guestId,
    tripId:                data.tripId,
    hasBoatOwnership:      data.hasBoatOwnership,
    ownershipYears:        data.ownershipYears ?? null,
    ownershipVesselType:   data.ownershipVesselType ?? null,
    experienceYears:       data.experienceYears,
    experienceDescription: data.experienceDescription ?? null,
    safetyBoaterRequired:  data.safetyBoaterRequired,
    safetyBoaterCardUrl:   data.safetyBoaterCardUrl ?? null,
    safetyBoaterCardState: data.safetyBoaterCardState ?? null,
    safetyBoaterCardNumber: data.safetyBoaterCardNumber ?? null,
    attestedAt:            data.attestedAt,
    ip:                    data.ip,
    userAgent:             data.userAgent,
  })
  return crypto.createHash('sha256').update(payload, 'utf8').digest('hex')
}
