/* ============================================
   BoatCheckin — TypeScript Types (ARCH 2 from AUDIT.md)
   ============================================ */

// ── API Response wrapper ──
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// ── Enums ──
export type TripStatus = "upcoming" | "active" | "completed" | "cancelled";
export type SubscriptionTier = "solo" | "captain" | "fleet" | "marina";
export type CharterType = "captained" | "bareboat" | "both";
export type AdminRole = "founder" | "admin" | "member" | "support";
export type TripPurpose =
  | 'commercial'      // Paying customers — full USCG compliance
  | 'private_party'   // Friends/social gathering
  | 'family'          // Family day out
  | 'fishing_social'  // Fishing with buddies, fuel-share
  | 'corporate'       // Corporate event, client entertainment
  | 'training'        // Crew training, delivery
  | 'other';          // Catch-all

export interface BriefingTopic {
  id: string
  label: string
  description: string
  cfrRef: string
  required: boolean
}

export interface ComplianceProfile {
  waiverRequired: boolean
  safetyBriefingRequired: boolean
  floatPlanRecommended: boolean
  emergencyContactRequired: boolean
  insuranceBindRequired: boolean
  headCountRequired: boolean
  preDepBlockOnNonCompliance: boolean
  verbalBriefingRequired: boolean
  briefingTopics: BriefingTopic[]
}

export const TRIP_PURPOSE_LABELS: Record<TripPurpose, {
  label: string; icon: string; description: string;
  compliance: { label: string; color: 'sage' | 'muted' }
}> = {
  commercial:     { label: 'Commercial Charter',   icon: 'Banknote',       description: 'Paying customers aboard',              compliance: { label: 'Captained · SB 606 standard flow',           color: 'sage'  } },
  private_party:  { label: 'Private Party',        icon: 'Users',          description: 'Friends and social gathering',         compliance: { label: 'Captained · SB 606 standard flow',           color: 'sage'  } },
  family:         { label: 'Family Day',            icon: 'Heart',          description: 'Family outing, no guests',             compliance: { label: 'No passengers for hire · simplified flow',   color: 'muted' } },
  fishing_social: { label: 'Fishing Trip',          icon: 'Fish',           description: 'Buddies, fuel-share',                  compliance: { label: 'Captained · SB 606 standard flow',           color: 'sage'  } },
  corporate:      { label: 'Corporate Event',       icon: 'Building2',      description: 'Clients, team building',               compliance: { label: 'Captained · SB 606 standard flow',           color: 'sage'  } },
  training:       { label: 'Training / Delivery',   icon: 'GraduationCap',  description: 'Crew training or repositioning',       compliance: { label: 'Crew only · no guest waiver required',       color: 'muted' } },
  other:          { label: 'Other',                  icon: 'Anchor',         description: 'Custom purpose',                       compliance: { label: 'Operator confirms type at setup',            color: 'muted' } },
}

export type ApprovalStatus =
  | "pending"
  | "approved"
  | "declined"
  | "auto_approved"
  | "pending_livery_briefing";
export type BoatType =
  | "yacht"
  | "catamaran"
  | "motorboat"
  | "sailboat"
  | "pontoon"
  | "fishing"
  | "speedboat"
  | "snorkel_dive"
  | "pwc"
  | "other";

// ── Dynamic Vessel Safety Matrix (USCG/FWC compliance) ──
export type ComplianceTarget = "bareboat_only" | "passengers_only" | "all";

export interface SafetyCardTemplate {
  topic_key: string;
  custom_title: string;
  instructions: string;
  image_url?: string;
  /** Who sees this card — bareboat operators, captained passengers, or everyone */
  compliance_target: ComplianceTarget;
  /** USCG vessel length filter — hide card if boat >= this length (e.g., ECOS law < 26ft) */
  max_length_ft?: number;
  /** USCG vessel length filter — hide card if boat < this length */
  min_length_ft?: number;
}

// ── Operator ──
export interface Operator {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: string;
  isActive: boolean;
  maxBoats: number;
  stripeCustomerId: string | null;
  stripeConnectAccountId: string | null;
  firmaWorkspaceId: string | null;
  createdAt: string;
}

// ── Boat Profile ──
export interface BoatProfile {
  id: string;
  operatorId: string;
  boatName: string;
  boatType: BoatType;
  charterType: CharterType;
  maxCapacity: number;
  marinaName: string;
  marinaAddress: string;
  slipNumber: string | null;
  parkingInstructions: string | null;
  lat: number | null;
  lng: number | null;
  captainName: string | null;
  captainPhotoUrl: string | null;
  captainBio: string | null;
  captainLicense: string | null;
  captainLanguages: string[];
  whatToBring: string | null;
  houseRules: string | null;
  waiverText: string;
  firmaTemplateId: string | null;
  requiresAnnualWaiver: boolean;
  cancellationPolicy: string | null;
  addons: AddonItem[];
  photoUrl: string | null;
  publicSlug: string;   // stable 32-char hex slug for /board/[publicSlug] QR URL
  createdAt: string;
}

// ── Trip ──
export interface Trip {
  id: string;
  slug: string;
  boatId: string;
  operatorId: string;
  tripCode: string;
  tripDate: string;
  departureTime: string;
  durationHours: number;
  maxGuests: number;
  status: TripStatus;
  charterType: CharterType;
  createdAt: string;
}

export interface TripWithBoat extends Trip {
  boat: BoatProfile;
}

// ── Guest ──
export interface GuestRecord {
  id: string;
  tripId: string;
  customerId: string | null;
  fullName: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  dietaryRequirements: string | null;
  languagePreference: string;
  approvalStatus: ApprovalStatus;
  waiverSigned: boolean;
  waiverSignedAt: string | null;
  waiverSignatureText: string | null;
  qrToken: string;
  addonOrders: AddonOrder[];
  createdAt: string;
}

// ── Weather ──
export interface WeatherData {
  temperature: number;
  windspeed: number;
  code: number;
  description: string;
}

// ── Add-on Item (operator defines) ──
export interface AddonItem {
  id: string;
  boatId: string;
  name: string;
  description: string | null;
  emoji: string;
  priceCents: number;
  maxQuantity: number;
}

// ── Add-on Order (guest orders) ──
export interface AddonOrder {
  addonId: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
}

// ─── Phase 3A: Trip Creation ──────────────────────────────────────────────────

export interface TripFormData {
  boatId: string
  boatName: string           // display only
  boatCapacity: number       // max from boat profile
  tripDate: string           // YYYY-MM-DD
  departureTime: string      // HH:MM
  durationHours: number
  maxGuests: number
  bookingType: 'private' | 'split'
  requiresApproval: boolean
  tripCode: string           // 4-char, auto or manual
  charterType: 'captained' | 'bareboat' | 'both'
  specialNotes: string
  splitBookings: SplitBookingEntry[]
  tripPurpose: TripPurpose                     // NEW — trip classification
  forceFullCompliance: boolean                 // NEW — operator override
  fuelShareDisclaimerAccepted: boolean         // NEW — fishing_social disclaimer
}

export interface SplitBookingEntry {
  id: string                 // temp client-side ID
  organiserName: string
  organiserEmail: string
  maxGuests: number
  notes: string
}

export interface TripCreatedResult {
  tripId: string
  tripSlug: string
  tripCode: string
  tripLink: string           // full URL
  whatsappMessage: string    // pre-written
  bookings: BookingCreatedResult[]
}

export interface BookingCreatedResult {
  bookingId: string
  bookingLink: string        // full URL
  bookingCode: string        // 4-char
  organiserName: string
  maxGuests: number
  whatsappMessage: string
}

// ── Trip list item (shaped for dashboard) ──
export interface TripListItem {
  id: string
  slug: string
  tripCode: string
  tripDate: string
  departureTime: string
  durationHours: number
  maxGuests: number
  status: TripStatus
  charterType: CharterType
  specialNotes: string | null
  guestCount: number
  waiversSigned: number
  boat: {
    id: string
    boatName: string
    boatType: string
    marinaName: string
    slipNumber: string | null
    captainName: string | null
    lat: number | null
    lng: number | null
  }
}

// ── Duration picker options ──
export const DURATION_OPTIONS = [
  { value: 2,  label: '2 hours' },
  { value: 3,  label: '3 hours' },
  { value: 4,  label: '4 hours' },
  { value: 5,  label: '5 hours' },
  { value: 6,  label: '6 hours' },
  { value: 8,  label: '8 hours' },
  { value: 10, label: '10 hours' },
  { value: 12, label: 'Full day (12 hrs)' },
  { value: 0,  label: 'Custom duration' },
] as const

// ── Phase 3C — Guest Join Flow ──────────────────────────────────────────────

/** Stored in localStorage after successful check-in. Key: dp-guest-{slug} */
export interface GuestSession {
  guestId: string
  tripSlug: string
  qrToken: string
  guestName: string
  checkedInAt: string       // ISO timestamp
  addonOrderIds: string[]   // for receipt display
}

/** Helper to get the localStorage key for a trip */
export const GUEST_SESSION_KEY = (slug: string) => `dp-guest-${slug}`

/** Individual safety acknowledgment (stored in guest record) */
export interface SafetyAck {
  topic_key: string              // matches SafetyCard.topic_key (e.g. 'life_jackets')
  acknowledgedAt: string         // ISO timestamp
}

/** Steps in the guest join flow */
export type JoinStep =
  | 'code'       // step 1 — trip code entry
  | 'details'    // step 2 — personal info
  | 'safety'     // step 3 — safety card swipe
  | 'waiver'     // step 4 — waiver signing + registration submit
  | 'insurance'  // step 4.5 — conditional FL course info
  | 'addons'     // step 5 — add-on ordering
  | 'boarding'   // step 6 — boarding pass + QR

/** Full state of the join flow bottom sheet */
export interface JoinFlowState {
  step: JoinStep

  // Step 1 — code
  tripCode: string
  codeError: string
  codeAttempts: number
  codeLocked: boolean
  codeLockUntil: number       // unix ms timestamp
  turnstileToken: string      // Cloudflare Turnstile verification token

  // Step 2 — details
  fullName: string
  phone: string
  emergencyContactName: string
  emergencyContactPhone: string
  dietaryRequirements: string
  languagePreference: string
  dateOfBirth: string
  isNonSwimmer: boolean
  isSeaSicknessProne: boolean
  gdprConsent: boolean
  marketingConsent: boolean
  isEU: boolean               // server-detected

  // Step 2b — FWC compliance (bareboat only)
  fwcLicenseUrl: string | null      // uploaded FWC Boater Safety ID photo
  fwcLicenseUploading: boolean      // upload in progress

  // Step 3 — safety
  safetyAcks: SafetyAck[]
  currentSafetyCard: number

  // Step 4 — waiver
  waiverScrolled: boolean     // must scroll to bottom before signing
  waiverAgreed: boolean
  signatureText: string
  waiverTextHash: string

  // Step 5 — addons
  addonQuantities: Record<string, number>  // addonId → qty

  // Result
  guestId: string
  qrToken: string
  approvalStatus: ApprovalStatus | null  // returned from registration API
  requiresCourse: boolean
  isSubmitting: boolean
  submitError: string
}

// ═══════════════════════════════════════════
// Phase 3D — Operator Dashboard Types
// ═══════════════════════════════════════════

// ─── Full guest record for dashboard ────────
export interface DashboardGuest {
  id: string
  customerId: string | null
  fullName: string
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  languagePreference: string
  dietaryRequirements: string | null
  dateOfBirth: string | null
  isNonSwimmer: boolean
  isSeaSicknessProne: boolean
  waiverSigned: boolean
  waiverSignedAt: string | null
  approvalStatus: ApprovalStatus
  checkedInAt: string | null
  createdAt: string
  safetyAcknowledgments: { topic_key: string; acknowledgedAt: string }[]
  waiverTextHash: string | null   // 'firma_template' = Firma PDF, hex = legacy scroll
  fwcLicenseUrl: string | null
  liveryBriefingVerifiedAt: string | null
  liveryBriefingVerifiedBy: string | null
  addonOrders: {
    addonName: string
    emoji: string
    quantity: number
    totalCents: number
  }[]
}

// ─── Trip detail for operator ───────────────
export interface OperatorTripDetail {
  id: string
  slug: string
  tripCode: string
  tripDate: string
  departureTime: string
  durationHours: number
  maxGuests: number
  status: TripStatus
  charterType: CharterType
  requiresApproval: boolean
  specialNotes: string | null
  startedAt: string | null
  buoyPolicyId: string | null
  boat: {
    id: string
    boatName: string
    boatType: string
    marinaName: string
    marinaAddress: string
    slipNumber: string | null
    lat: number | null
    lng: number | null
    captainName: string | null
    waiverText: string
    firmaTemplateId: string | null
    safetyCards: Record<string, unknown>[]
  }
  guests: DashboardGuest[]
  bookings: {
    id: string
    organiserName: string
    organiserEmail: string | null
    maxGuests: number
    bookingCode: string
    notes: string | null
  }[]
}

// ─── Dashboard home stats ───────────────────
export interface DashboardStats {
  bookingsThisMonth: number
  addonRevenueThisMonthCents: number
  averageRating: number | null
  totalGuestsThisMonth: number
  completedTripsThisMonth: number
}

// ─── Add-on summary for trip ─────────────────
export interface AddonSummaryItem {
  addonId: string
  addonName: string
  emoji: string
  totalQty: number
  totalCents: number
  guestNames: string[]
}

// ─── Captain snapshot token ─────────────────
export interface CaptainSnapshotData {
  tripId: string
  slug: string
  boatName: string
  maxGuests: number
  requiredSafetyCards: number   // boat.safety_cards.length — for USCG compliance math
  marinaName: string
  slipNumber: string | null
  tripDate: string
  departureTime: string
  durationHours: number
  captainName: string | null
  stateCode: string
  boatType: string
  charterType: string
  lengthFt: number | null
  weather: { label: string; temperature: number; icon: string } | null
  alerts: {
    nonSwimmers: number
    children: number
    childrenUnder6: number
    seasicknessProne: number
    dietary: { name: string; requirement: string }[]
  }
  guests: {
    id: string
    fullName: string
    dateOfBirth: string | null
    waiverSigned: boolean
    waiverTextHash: string | null
    safetyAckCount: number
    languageFlag: string
    addonEmojis: string[]
    approvalStatus: string
    fwcLicenseUrl: string | null
    liveryBriefingVerifiedAt: string | null
    liveryBriefingVerifiedBy: string | null
  }[]
  addonSummary: AddonSummaryItem[]
  generatedAt: string
  expiresAt: string
  captainPhotoUrl: string | null
  captainLicense: string | null
  captainRole: string
  crewManifest: {
    name: string
    role: string
    license: string | null
  }[]
  tripPurpose: TripPurpose
  forceFullCompliance: boolean
  // Safety briefing gate
  safetyBriefingConfirmedAt: string | null
  safetyBriefingConfirmedBy: string | null
  safetyBriefingType: string | null
}

// ═══════════════════════════════════════════
// Captain Roster & Trip Assignment
// ═══════════════════════════════════════════

export type CrewRole = 'captain' | 'first_mate' | 'crew' | 'deckhand'

export type LicenseType =
  | 'OUPV'
  | 'Master 25 Ton'
  | 'Master 50 Ton'
  | 'Master 100 Ton'
  | 'Master 200 Ton'
  | 'Master Unlimited'
  | 'Able Seaman'
  | 'Other'

export interface CaptainProfile {
  id: string
  operatorId: string
  fullName: string
  photoUrl: string | null
  bio: string | null
  phone: string | null
  email: string | null
  licenseNumber: string | null
  licenseType: LicenseType | null
  licenseExpiry: string | null
  languages: string[]
  yearsExperience: number | null
  certifications: string[]
  isActive: boolean
  isDefault: boolean
  defaultRole: CrewRole
  linkedBoats: { boatId: string; boatName: string }[]
  createdAt: string
}

export interface TripAssignment {
  id: string
  tripId: string
  captainId: string
  operatorId: string
  role: CrewRole
  assignedBy: string | null
  assignedAt: string
  captain: CaptainProfile  // joined from captains table
}

// ─── Phase 3F: Post-Trip Types ─────────────────

export interface ReviewSubmission {
  tripSlug: string
  guestId: string
  rating: number
  feedbackText: string
  platform: 'internal' | 'google' | 'boatsetter'
}

export type PostcardStyle = 'classic' | 'minimal' | 'sunset'

export interface PostcardData {
  guestName: string
  boatName: string
  captainName: string | null
  marinaName: string
  tripDate: string
  durationHours: number
  weatherIcon: string | null
  weatherLabel: string | null
  temperature: number | null
  style: PostcardStyle
}

export interface PostTripPageData {
  tripId: string
  slug: string
  tripDate: string
  departureTime: string
  durationHours: number
  boatName: string
  captainName: string | null
  marinaName: string
  operatorCompanyName: string | null
  boatsetterUrl: string | null
  googleReviewUrl: string | null
  boatsetterReviewUrl: string | null
  weather: {
    icon: string
    label: string
    temperature: number
  } | null
  guestName: string | null
  existingRating: number | null
}

// ═══════════════════════════════════════════
// Phase 3G — Real-time Layer Types
// ═══════════════════════════════════════════

// ─── Chat message ─────────────────────────
export interface ChatMessage {
  id: string
  tripId: string
  guestId: string | null
  senderType: 'guest' | 'captain' | 'operator' | 'system'
  senderName: string
  body: string
  isQuickChip: boolean
  chipKey: string | null
  readAt: string | null
  createdAt: string
}

// ─── Quick chips (predefined guest messages) ─
export interface QuickChip {
  key: string
  icon: string
  label: string
}

export const QUICK_CHIPS: QuickChip[] = [
  { key: 'parking',   icon: '🅿️', label: "Where exactly do I park?" },
  { key: 'late_10',   icon: '⏱️', label: "I'm running 10 min late" },
  { key: 'entrance',  icon: '🚢', label: "Which dock entrance?" },
  { key: 'arrived',   icon: '📍', label: "I'm at the marina now" },
  { key: 'cant_find', icon: '🔍', label: "I can't find the boat" },
  { key: 'question',  icon: '💬', label: "I have a question" },
]

// ─── Realtime channel names (centralised) ──
export const CHANNELS = {
  tripGuests: (tripId: string) =>
    `trip-guests-${tripId}` as const,

  tripStatus: (tripId: string) =>
    `trip-status-${tripId}` as const,

  tripChat: (tripId: string) =>
    `trip-chat-${tripId}` as const,

  operatorNotifications: (operatorId: string) =>
    `op-notifications-${operatorId}` as const,

  operatorDashboard: (operatorId: string) =>
    `op-dashboard-${operatorId}` as const,
} as const

// ─── Connection state ─────────────────────
export type RealtimeStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error'
