/* ============================================
   DockPass — Shared TypeScript Types
   ============================================ */

// ── API Response wrapper ──
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// ── Operator ──
export interface Operator {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  subscriptionTier: "solo" | "captain" | "fleet" | "marina";
  stripeCustomerId: string | null;
  stripeConnectAccountId: string | null;
  createdAt: string;
}

// ── Boat ──
export interface Boat {
  id: string;
  operatorId: string;
  name: string;
  type: string;
  capacity: number;
  marina: string;
  slip: string;
  photoUrl: string | null;
  description: string | null;
  amenities: string[];
  rules: string[];
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
  startTime: string;
  durationMinutes: number;
  maxGuests: number;
  pricePerGuest: number;
  status: "draft" | "active" | "completed" | "cancelled";
  createdAt: string;
}

export interface TripWithBoat extends Trip {
  boat: Boat;
}

// ── Guest ──
export interface Guest {
  id: string;
  tripId: string;
  fullName: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  dietaryRequirements: string | null;
  languagePreference: string;
  waiverSigned: boolean;
  waiverSignedAt: string | null;
  qrToken: string | null;
  createdAt: string;
}

// ── Weather ──
export interface WeatherData {
  temperature: number;
  windspeed: number;
  code: number;
  description: string;
}

// ── Add-on ──
export interface AddOn {
  id: string;
  boatId: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
}

// ── Add-on Order ──
export interface AddOnOrder {
  addonId: string;
  quantity: number;
  price: number;
}
