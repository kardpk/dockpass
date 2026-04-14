import type { TripPurpose, ComplianceProfile, BriefingTopic } from '@/types'

// ─── USCG 46 CFR §185.506 Briefing Topics ───────────────────────────────────

const USCG_BRIEFING_TOPICS: BriefingTopic[] = [
  {
    id: 'emergency_exits',
    label: 'Emergency exits & survival craft',
    description: 'Pointed out all emergency exits and survival craft embarkation areas',
    cfrRef: '§185.506(a)(1)',
    required: true,
  },
  {
    id: 'life_jacket_location',
    label: 'Life jacket locations',
    description: 'Showed passengers where life jackets are stowed on this vessel',
    cfrRef: '§185.506(a)(2)',
    required: true,
  },
  {
    id: 'life_jacket_donning',
    label: 'Life jacket donning procedure',
    description: 'Demonstrated or directed passengers to crew for proper life jacket fitting',
    cfrRef: '§185.506(a)(3)',
    required: true,
  },
  {
    id: 'instruction_placards',
    label: 'Instruction placards',
    description: 'Pointed out location of instruction placards for lifesaving devices',
    cfrRef: '§185.506(a)(4)',
    required: true,
  },
  {
    id: 'hazardous_conditions',
    label: 'Hazardous conditions protocol',
    description: 'Informed passengers they must don life jackets when directed by captain',
    cfrRef: '§185.506(a)(5)',
    required: true,
  },
  {
    id: 'reduced_manning',
    label: 'Reduced manning notice',
    description: 'Disclosed any reduced manning or equipment conditions if applicable',
    cfrRef: '§185.506(a)(6)',
    required: false, // only required if vessel is operating with reduced manning
  },
]

const SOCIAL_BRIEFING_TOPICS: BriefingTopic[] = [
  USCG_BRIEFING_TOPICS[0]!, // emergency_exits
  USCG_BRIEFING_TOPICS[1]!, // life_jacket_location
  {
    id: 'fire_extinguisher',
    label: 'Fire extinguisher location',
    description: 'Showed passengers where fire extinguishers are located',
    cfrRef: 'Best practice',
    required: true,
  },
]

const FAMILY_BRIEFING_TOPICS: BriefingTopic[] = [
  {
    id: 'life_jackets_onboard',
    label: 'Life jackets onboard & accessible',
    description: 'Confirmed life jackets are onboard and accessible for all passengers',
    cfrRef: 'Safety best practice',
    required: true,
  },
]

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
  verbalBriefingRequired: true,
  briefingTopics: USCG_BRIEFING_TOPICS,
}

/** Social compliance — friends, fishing buddies */
const SOCIAL_COMPLIANCE: ComplianceProfile = {
  waiverRequired: false,
  safetyBriefingRequired: false,
  floatPlanRecommended: true,
  emergencyContactRequired: false,
  insuranceBindRequired: false,
  headCountRequired: true,
  preDepBlockOnNonCompliance: false,
  verbalBriefingRequired: true,
  briefingTopics: SOCIAL_BRIEFING_TOPICS,
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
  verbalBriefingRequired: true,
  briefingTopics: FAMILY_BRIEFING_TOPICS,
}

/** Training/delivery — full safety topics, everything else optional */
const TRAINING_COMPLIANCE: ComplianceProfile = {
  waiverRequired: false,
  safetyBriefingRequired: false,
  floatPlanRecommended: true,
  emergencyContactRequired: false,
  insuranceBindRequired: false,
  headCountRequired: false,
  preDepBlockOnNonCompliance: false,
  verbalBriefingRequired: true,
  briefingTopics: USCG_BRIEFING_TOPICS,
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
