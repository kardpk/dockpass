import type { TripPurpose, ComplianceProfile } from '@/types'

// ─── Compliance Profile Presets ──────────────────────────────────────────────

/** Full USCG compliance — commercial charters, corporate events */
const FULL_COMPLIANCE: ComplianceProfile = {
  waiverRequired: true,
  safetyBriefingRequired: true,
  floatPlanRecommended: true,
  emergencyContactRequired: true,
  insuranceBindRequired: true,
  headCountRequired: true,
  preDepBlockOnNonCompliance: true,
}

/** Social compliance — friends, fishing buddies */
const SOCIAL_COMPLIANCE: ComplianceProfile = {
  waiverRequired: false,   // recommended but not required
  safetyBriefingRequired: false,
  floatPlanRecommended: true,
  emergencyContactRequired: false,
  insuranceBindRequired: false,
  headCountRequired: true,
  preDepBlockOnNonCompliance: false, // don't block the Start Trip button
}

/** Minimal compliance — family day out */
const MINIMAL_COMPLIANCE: ComplianceProfile = {
  waiverRequired: false,
  safetyBriefingRequired: false,
  floatPlanRecommended: true,
  emergencyContactRequired: false,
  insuranceBindRequired: false,
  headCountRequired: false,
  preDepBlockOnNonCompliance: false,
}

/** Training/delivery — float plan recommended, everything else optional */
const TRAINING_COMPLIANCE: ComplianceProfile = {
  waiverRequired: false,
  safetyBriefingRequired: false,
  floatPlanRecommended: true,
  emergencyContactRequired: false,
  insuranceBindRequired: false,
  headCountRequired: false,
  preDepBlockOnNonCompliance: false,
}

// ─── Compliance Profile Derivation ───────────────────────────────────────────

/**
 * Derives the compliance rules for a trip based on its purpose.
 * 
 * @param purpose - The classified trip purpose
 * @param forceOverride - Operator can force full compliance on any trip
 * @returns The applicable ComplianceProfile
 * 
 * Resolution chain:
 *   forceOverride=true → FULL_COMPLIANCE
 *   commercial/corporate → FULL_COMPLIANCE
 *   private_party/fishing_social → SOCIAL_COMPLIANCE
 *   family → MINIMAL_COMPLIANCE
 *   training → TRAINING_COMPLIANCE
 *   other/unknown → FULL_COMPLIANCE (safe default)
 */
export function getComplianceProfile(
  purpose: TripPurpose,
  forceOverride: boolean = false
): ComplianceProfile {
  if (forceOverride) {
    return FULL_COMPLIANCE
  }

  switch (purpose) {
    case 'commercial':
    case 'corporate':
      return FULL_COMPLIANCE

    case 'private_party':
    case 'fishing_social':
      return SOCIAL_COMPLIANCE

    case 'family':
      return MINIMAL_COMPLIANCE

    case 'training':
      return TRAINING_COMPLIANCE

    case 'other':
    default:
      return FULL_COMPLIANCE // safe default: never under-enforce
  }
}

/**
 * Returns a display-friendly compliance level label.
 */
export function getComplianceLevel(purpose: TripPurpose, forceOverride: boolean = false): {
  level: 'full' | 'social' | 'minimal' | 'training'
  label: string
  color: string
  icon: string
} {
  if (forceOverride) {
    return { level: 'full', label: 'FULL COMPLIANCE', color: '#1D9E75', icon: '🟢' }
  }

  switch (purpose) {
    case 'commercial':
    case 'corporate':
      return { level: 'full', label: 'FULL COMPLIANCE', color: '#1D9E75', icon: '🟢' }
    case 'private_party':
    case 'fishing_social':
      return { level: 'social', label: 'SOCIAL MODE', color: '#E5910A', icon: '🟡' }
    case 'family':
      return { level: 'minimal', label: 'FAMILY MODE', color: '#6B7C93', icon: '⚪' }
    case 'training':
      return { level: 'training', label: 'TRAINING MODE', color: '#0C447C', icon: '🔵' }
    default:
      return { level: 'full', label: 'FULL COMPLIANCE', color: '#1D9E75', icon: '🟢' }
  }
}

/**
 * Checks if a trip purpose requires the USCG consideration warning.
 * Private trips on commercially-typed boats should see the warning.
 */
export function shouldShowConsiderationWarning(
  purpose: TripPurpose,
  charterType: string
): boolean {
  const isNonCommercial = ['private_party', 'family', 'fishing_social', 'other'].includes(purpose)
  const isCommercialBoat = charterType === 'captained' || charterType === 'both'
  return isNonCommercial && isCommercialBoat
}
