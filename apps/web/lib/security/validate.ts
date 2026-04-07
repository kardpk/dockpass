import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";

/**
 * Input sanitization — strips all HTML/XSS from string values.
 */
export function sanitiseInput<T extends Record<string, unknown>>(raw: T): T {
  const sanitised = { ...raw };

  for (const key of Object.keys(sanitised)) {
    const value = sanitised[key];
    if (typeof value === "string") {
      (sanitised as Record<string, unknown>)[key] = DOMPurify.sanitize(
        value.trim()
      );
    }
  }

  return sanitised;
}

// ── Guest Registration (existing) ──

export const tripCodeSchema = z
  .string()
  .length(4)
  .regex(
    /^[A-Z0-9]{4}$/,
    "Trip code must be 4 uppercase alphanumeric characters"
  );

export const guestRegistrationSchema = z.object({
  tripCode: tripCodeSchema,
  fullName: z.string().min(2).max(100),
  emergencyContactName: z.string().min(2).max(100),
  emergencyContactPhone: z.string().min(7).max(20),
  dietaryRequirements: z.string().max(500).optional(),
  languagePreference: z.enum(["en", "es", "pt", "fr", "de", "it", "ru"]),
});

export type GuestRegistrationInput = z.infer<typeof guestRegistrationSchema>;

// ── HIGH 1: Boat Setup Schema ──

export const boatSetupSchema = z.object({
  boatName: z.string().min(2).max(100),
  boatType: z.enum([
    "yacht",
    "catamaran",
    "motorboat",
    "sailboat",
    "pontoon",
    "fishing",
    "speedboat",
    "other",
  ]),
  charterType: z.enum(["captained", "bareboat", "both"]),
  yearBuilt: z.number().int().min(1950).max(2026).optional(),
  lengthFt: z.number().min(10).max(500).optional(),
  maxCapacity: z.number().int().min(1).max(500),
  marinaName: z.string().min(2).max(200),
  marinaAddress: z.string().min(5).max(500),
  slipNumber: z.string().max(20).optional(),
  parkingInstructions: z.string().max(1000).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  captainName: z.string().min(2).max(100).optional(),
  captainBio: z.string().max(1000).optional(),
  captainLicense: z.string().max(50).optional(),
  captainLanguages: z
    .array(z.enum(["en", "es", "pt", "fr", "de", "it", "ru"]))
    .max(7)
    .optional(),
  whatToBring: z.string().max(2000).optional(),
  houseRules: z.string().max(2000).optional(),
  waiverText: z.string().min(100).max(10000),
  cancellationPolicy: z.string().max(1000).optional(),
  boatsetterUrl: z.string().url().optional(),
});

export type BoatSetupInput = z.infer<typeof boatSetupSchema>;

// ── HIGH 1: Trip Creation Schema ──

export const tripCreationSchema = z.object({
  boatId: z.string().uuid(),
  tripDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  departureTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationHours: z.number().min(0.5).max(24),
  maxGuests: z.number().int().min(1).max(500),
  bookingType: z.enum(["private", "split"]),
  requiresApproval: z.boolean(),
  tripCode: z
    .string()
    .regex(/^[A-Z0-9]{4}$/)
    .optional(),
  specialNotes: z.string().max(500).optional(),
  charterType: z.enum(["captained", "bareboat", "both"]),
});

export type TripCreationInput = z.infer<typeof tripCreationSchema>;

// ── HIGH 1: Add-on Schema ──

export const addonSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(300).optional(),
  emoji: z.string().max(4).optional(),
  priceCents: z.number().int().min(0).max(100000),
  maxQuantity: z.number().int().min(1).max(100),
});

export type AddonInput = z.infer<typeof addonSchema>;
