/* ============================================
   DockPass — TypeScript Types (ARCH 2 from AUDIT.md)
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
export type ApprovalStatus =
  | "pending"
  | "approved"
  | "declined"
  | "auto_approved";
export type BoatType =
  | "yacht"
  | "catamaran"
  | "motorboat"
  | "sailboat"
  | "pontoon"
  | "fishing"
  | "speedboat"
  | "other";

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
  cancellationPolicy: string | null;
  addons: AddonItem[];
  photoUrl: string | null;
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
