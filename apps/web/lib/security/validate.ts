import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";

// ── Input sanitization ──
export function sanitiseInput<T extends Record<string, unknown>>(
  raw: T
): T {
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

// ── Common validation schemas ──
export const tripCodeSchema = z
  .string()
  .length(4)
  .regex(/^[A-Z0-9]{4}$/, "Trip code must be 4 uppercase alphanumeric characters");

export const guestRegistrationSchema = z.object({
  tripCode: tripCodeSchema,
  fullName: z.string().min(2).max(100),
  emergencyContactName: z.string().min(2).max(100),
  emergencyContactPhone: z.string().min(7).max(20),
  dietaryRequirements: z.string().max(500).optional(),
  languagePreference: z.enum(["en", "es", "pt", "fr", "de", "it", "ru"]),
});

export type GuestRegistrationInput = z.infer<typeof guestRegistrationSchema>;
