/**
 * ═══════════════════════════════════════════════════════════════════
 * Pure TypeScript Compliance Rules Engine
 * ═══════════════════════════════════════════════════════════════════
 *
 * Zero database dependency. Derives rules from:
 *   - stateCode  (FL, TX, CA, etc.)
 *   - boatType   (yacht, pwc, pontoon, etc.)
 *   - charterType (captained, bareboat, both)
 *
 * Extensible: add a new state by creating a resolver function.
 *
 * Legal references:
 *   FL §327.395  – FWC Boater Safety ID (born ≥ 1988-01-01)
 *   FL §327.54   – Livery Pre-Ride Instruction (dual signature)
 *   FL §327.33   – PFD for children under 6 on vessels <26ft
 *   CA H&N Code  – PWC operator must be ≥16 years old
 *   CA §655.7    – Wake jumping ban, reckless PWC operation
 *   TX WSA       – Party Boat Act (≥30ft, >6 pax, rented)
 *   46 CFR §185.502 – USCG crew/passenger list (international/overnight)
 *   46 CFR §185.506 – PA-based safety orientation for Subchapter T vessels
 */

// ── Types ─────────────────────────────────────────────────────────

export interface ComplianceRules {
  /** 2-letter state code */
  state: string
  features: {
    /** FL: FWC Boater Safety ID upload required for bareboat */
    require_boater_id_upload: boolean
    /** FL: Livery lock — requires dockmaster dual-signature */
    require_dual_signature: boolean
    /** TX: Party Boat Act enforcement for captain */
    enforce_party_boat_act: boolean
    /** CA: Hard age block for PWC/vessel operation */
    hard_age_gate: boolean
    /** NY/IL: Skip safety cards + addons for high-volume captained tours */
    fast_track_enabled: boolean
  }
  age_gates: {
    /** FL: Born on/after this date must upload FWC ID */
    id_required_born_after: string | null
    /** CA: Minimum age to operate this vessel type */
    min_driver_age: number | null
  }
  /** Safety topic keys to prioritize (sort to front of deck) */
  injected_safety_topics: string[]
  /** Party boat trigger thresholds (TX) */
  party_boat_thresholds: {
    min_length_ft: number
    min_passengers: number
  } | null
  /** Required export documents (e.g., 'uscg_46_cfr_manifest') */
  required_documents: string[]
}

// ── Default (no state-specific rules) ─────────────────────────────

const DEFAULT_RULES: ComplianceRules = {
  state: '',
  features: {
    require_boater_id_upload: false,
    require_dual_signature: false,
    enforce_party_boat_act: false,
    hard_age_gate: false,
    fast_track_enabled: false,
  },
  age_gates: {
    id_required_born_after: null,
    min_driver_age: null,
  },
  injected_safety_topics: [],
  party_boat_thresholds: null,
  required_documents: [],
}

// ── Florida ───────────────────────────────────────────────────────

function getFloridaRules(
  _boatType: string,
  charterType: string,
): ComplianceRules {
  const isBareboat = charterType === 'bareboat' || charterType === 'both'

  return {
    state: 'FL',
    features: {
      require_boater_id_upload: isBareboat,
      require_dual_signature: isBareboat,
      enforce_party_boat_act: false,
      hard_age_gate: false,
      fast_track_enabled: false,
    },
    age_gates: {
      id_required_born_after: isBareboat ? '1988-01-01' : null,
      min_driver_age: null,
    },
    injected_safety_topics: [],
    party_boat_thresholds: null,
    required_documents: [],
  }
}

// ── California ────────────────────────────────────────────────────

function getCaliforniaRules(
  boatType: string,
  charterType: string,
): ComplianceRules {
  const isBareboat = charterType === 'bareboat' || charterType === 'both'
  const isPWC = boatType === 'pwc'

  return {
    state: 'CA',
    features: {
      require_boater_id_upload: false,
      require_dual_signature: false,
      enforce_party_boat_act: false,
      hard_age_gate: isPWC && isBareboat,
      fast_track_enabled: false,
    },
    age_gates: {
      id_required_born_after: null,
      min_driver_age: isPWC && isBareboat ? 16 : null,
    },
    injected_safety_topics: isPWC
      ? ['off_throttle_steering', 'wake_jumping_ban', 'pwc_lanyard_law']
      : [],
    party_boat_thresholds: null,
    required_documents: [],
  }
}

// ── Texas ─────────────────────────────────────────────────────────

function getTexasRules(
  _boatType: string,
  charterType: string,
): ComplianceRules {
  const isBareboat = charterType === 'bareboat' || charterType === 'both'

  return {
    state: 'TX',
    features: {
      require_boater_id_upload: false,
      require_dual_signature: false,
      enforce_party_boat_act: !isBareboat,
      hard_age_gate: false,
      fast_track_enabled: false,
    },
    age_gates: {
      id_required_born_after: null,
      min_driver_age: null,
    },
    injected_safety_topics: [],
    party_boat_thresholds: {
      min_length_ft: 30,
      min_passengers: 7,
    },
    required_documents: [],
  }
}

// ── New York ──────────────────────────────────────────────────────
// High-volume captained tours (dinner cruises, sightseeing ferries).
// 46 CFR §185.506: PA-based safety briefing replaces individual card swipes.

function getNewYorkRules(
  _boatType: string,
  charterType: string,
): ComplianceRules {
  const isCaptained = charterType === 'captained'

  return {
    state: 'NY',
    features: {
      require_boater_id_upload: false,
      require_dual_signature: false,
      enforce_party_boat_act: false,
      hard_age_gate: false,
      // Fast-track only for captained tours — bareboat renters still get full flow
      fast_track_enabled: isCaptained,
    },
    age_gates: {
      id_required_born_after: null,
      min_driver_age: null,
    },
    injected_safety_topics: [],
    party_boat_thresholds: null,
    required_documents: isCaptained ? ['uscg_46_cfr_manifest'] : [],
  }
}

// ── Illinois ─────────────────────────────────────────────────────
// Chicago dinner cruises, Lake Michigan tours.
// Same fast-track logic as NY for captained high-volume operations.

function getIllinoisRules(
  _boatType: string,
  charterType: string,
): ComplianceRules {
  const isCaptained = charterType === 'captained'

  return {
    state: 'IL',
    features: {
      require_boater_id_upload: false,
      require_dual_signature: false,
      enforce_party_boat_act: false,
      hard_age_gate: false,
      fast_track_enabled: isCaptained,
    },
    age_gates: {
      id_required_born_after: null,
      min_driver_age: null,
    },
    injected_safety_topics: [],
    party_boat_thresholds: null,
    required_documents: isCaptained ? ['uscg_46_cfr_manifest'] : [],
  }
}

// ── Public API ────────────────────────────────────────────────────

/**
 * Get state-specific compliance rules for a trip.
 *
 * @param stateCode   2-letter US state code (defaults to 'FL')
 * @param boatType    The boat type key (e.g., 'pwc', 'yacht', 'pontoon')
 * @param charterType The charter type ('captained', 'bareboat', 'both')
 * @returns Resolved compliance rules for the given state + vessel
 */
export function getComplianceRules(
  stateCode: string | null | undefined,
  boatType: string,
  charterType: string,
): ComplianceRules {
  const code = (stateCode ?? 'FL').toUpperCase()

  switch (code) {
    case 'FL':
      return getFloridaRules(boatType, charterType)
    case 'CA':
      return getCaliforniaRules(boatType, charterType)
    case 'TX':
      return getTexasRules(boatType, charterType)
    case 'NY':
      return getNewYorkRules(boatType, charterType)
    case 'IL':
      return getIllinoisRules(boatType, charterType)
    default:
      return { ...DEFAULT_RULES, state: code }
  }
}

/**
 * Check if the Texas Party Boat Act is triggered for this specific trip.
 * This is a dynamic check — same boat can trigger or not based on passenger count.
 */
export function isPartyBoatTriggered(
  rules: ComplianceRules,
  lengthFt: number | null,
  guestCount: number,
): boolean {
  if (!rules.features.enforce_party_boat_act) return false
  if (!rules.party_boat_thresholds) return false
  if (!lengthFt) return false

  return (
    lengthFt >= rules.party_boat_thresholds.min_length_ft &&
    guestCount >= rules.party_boat_thresholds.min_passengers
  )
}

/**
 * Calculate exact age from date of birth string.
 * Uses year/month/day precision (not just year subtraction).
 */
export function calculateAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--
  }
  return age
}
