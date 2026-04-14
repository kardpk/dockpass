import 'server-only'

import { z } from 'zod'
import sanitizeHtml from 'sanitize-html'

// ─── Text sanitiser ───────────────────────────────────────────────────────────

/**
 * Strips all HTML/XSS from a string. Use before any user-supplied
 * text is written to the database.
 */
export function sanitiseText(input: string): string {
  return sanitizeHtml(input.trim())
}

// ─── Trip creation schema ─────────────────────────────────────────────────────

export const createTripSchema = z.object({
  boatId: z.string().uuid({
    message: 'Please select a boat',
  }),
  tripDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .refine((date) => {
      const selected = new Date(date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return selected >= today
    }, 'Trip date cannot be in the past'),
  departureTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  durationHours: z
    .number()
    .min(0.5, 'Minimum duration is 30 minutes')
    .max(24, 'Maximum duration is 24 hours'),
  maxGuests: z
    .number()
    .int()
    .min(1, 'At least 1 guest required')
    .max(500, 'Maximum 500 guests'),
  bookingType: z.enum(['private', 'split']),
  requiresApproval: z.boolean(),
  tripCode: z
    .string()
    .regex(
      /^[A-Z0-9]{4}$/,
      'Trip code must be 4 uppercase letters/numbers',
    )
    .optional(),
  charterType: z.enum(['captained', 'bareboat', 'both']),
  specialNotes: z.string().max(500, 'Notes max 500 characters').optional(),
  tripPurpose: z.enum([
    'commercial', 'private_party', 'family',
    'fishing_social', 'corporate', 'training', 'other'
  ]).default('commercial'),
  forceFullCompliance: z.boolean().optional().default(false),
  fuelShareDisclaimerAccepted: z.boolean().optional().default(false),
})

// ─── Split booking schema ─────────────────────────────────────────────────────

export const createBookingSchema = z.object({
  tripId: z.string().uuid(),
  organisers: z
    .array(
      z.object({
        organiserName: z
          .string()
          .min(2, 'Name must be at least 2 characters')
          .max(100),
        organiserEmail: z.string().email().optional(),
        maxGuests: z.number().int().min(1).max(500),
        notes: z.string().max(500).optional(),
      }),
    )
    .min(1, 'At least one booking required')
    .max(20, 'Maximum 20 split bookings'),
})

// ─── Trip update schema ───────────────────────────────────────────────────────

export const updateTripSchema = z.object({
  tripDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  departureTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  durationHours: z.number().min(0.5).max(24).optional(),
  maxGuests: z.number().int().min(1).max(500).optional(),
  requiresApproval: z.boolean().optional(),
  specialNotes: z.string().max(500).optional(),
  status: z.enum(['upcoming', 'cancelled']).optional(),
})

// ─── Inferred types ───────────────────────────────────────────────────────────

export type CreateTripInput = z.infer<typeof createTripSchema>
export type CreateBookingInput = z.infer<typeof createBookingSchema>
export type UpdateTripInput = z.infer<typeof updateTripSchema>

// ─── Guest registration schema (Phase 3C) ────────────────────────────────────

export const guestRegistrationSchema = z.object({
  // Trip identification
  tripSlug: z.string()
    .regex(/^[A-Za-z0-9_-]{16,30}$/, 'Invalid trip link'),
  tripCode: z.string()
    .regex(/^[A-Z0-9]{4}$/, 'Trip code must be 4 characters'),

  // Personal details
  fullName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .transform(s => s.trim()),
  emergencyContactName: z.string()
    .min(2, 'Emergency contact name required')
    .max(100)
    .transform(s => s.trim()),
  emergencyContactPhone: z.string()
    .min(7, 'Phone number too short')
    .max(20, 'Phone number too long')
    .regex(/^[+\d\s()\-\.]+$/, 'Invalid phone format'),
  dietaryRequirements: z.string()
    .max(500)
    .optional()
    .transform(s => s?.trim() || undefined),
  languagePreference: z.enum(
    ['en', 'es', 'pt', 'fr', 'de', 'it', 'ar'],
    { message: 'Unsupported language' }
  ),
  dateOfBirth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  isNonSwimmer: z.boolean().optional().default(false),
  isSeaSicknessProne: z.boolean().optional().default(false),

  // GDPR
  gdprConsent: z.boolean().optional().default(false),
  marketingConsent: z.boolean().optional().default(false),

  // Safety acknowledgments
  // Each object: { topic_key: string, acknowledgedAt: ISO string }
  safetyAcknowledgments: z.array(z.object({
    topic_key: z.string().min(1).max(100),
    acknowledgedAt: z.string().datetime(),
  })).min(0).max(30),

  // Waiver
  waiverSignatureText: z.string()
    .min(2, 'Signature required')
    .max(100)
    .transform(s => s.trim()),
  waiverAgreed: z.literal(true, {
    error: 'You must agree to the waiver',
  }),
  waiverTextHash: z.string()
    .regex(/^([a-f0-9]{64}|firma_template)$/, 'Invalid waiver hash'),

  // FWC Boater Safety ID (bareboat/livery compliance — FWC Ch.327)
  fwcLicenseUrl: z.string().url().optional().nullable().default(null),

  // Turnstile bot protection token (optional in dev when widget fails to load)
  turnstileToken: z.string().optional().default(''),
})

// ─── Addon order schema (Phase 3C) ───────────────────────────────────────────

export const addonOrderSchema = z.object({
  guestId: z.string().uuid(),
  tripId: z.string().uuid().optional().default(''),
  orders: z.array(z.object({
    addonId: z.string().uuid(),
    quantity: z.number().int().min(1).max(50),
  })).min(1).max(20),
})

export type GuestRegistrationInput = z.infer<typeof guestRegistrationSchema>
export type AddonOrderInput = z.infer<typeof addonOrderSchema>

// ─── Phase 3F Post-Trip Schemas ──────────────────────────────────────────────

export const reviewSchema = z.object({
  tripSlug: z.string()
    .regex(/^[A-Za-z0-9_-]{16,30}$/, 'Invalid trip'),
  guestId: z.string().uuid('Invalid guest ID'),
  rating: z.number()
    .int()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  feedbackText: z.string()
    .max(2000, 'Feedback too long')
    .optional()
    .transform(s => s?.trim() || undefined),
})

export const postcardSchema = z.object({
  tripId: z.string().uuid(),
  guestId: z.string().uuid(),
  style: z.enum(['classic', 'minimal', 'sunset']),
})

export type ReviewInput = z.infer<typeof reviewSchema>
export type PostcardInput = z.infer<typeof postcardSchema>
