/**
 * generateShortBoardToken
 *
 * Produces a human-readable short token for the boarding URL.
 * Format: slugify(boatName, max 24) + '-' + sha256(boatId).slice(0, 4)
 * Example: "mv-ocean-star-a3f9"
 *
 * The 4-char SHA-256 suffix provides collision resistance while keeping
 * the total token short enough to type on a phone keyboard.
 *
 * This is a PURE function — no DB calls, no side effects.
 * Call it after boat creation to get the token, then persist it.
 */
export function generateShortBoardToken(boatId: string, boatName: string): string {
  // --- Slugify the boat name ---
  const slug = boatName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')  // strip non-alphanumeric (keeps spaces + hyphens)
    .trim()
    .replace(/\s+/g, '-')           // spaces → hyphens
    .replace(/-+/g, '-')            // collapse consecutive hyphens
    .slice(0, 24)                   // max 24 chars for the name part
    .replace(/-$/, '')              // strip trailing hyphen after slice

  // --- 4-char hash from boat UUID ---
  // SHA-256 of the UUID gives a stable, deterministic 4-char suffix.
  // We use crypto from Node.js (server-only utility).
  const { createHash } = require('crypto') as typeof import('crypto')
  const hash = createHash('sha256').update(boatId).digest('hex').slice(0, 4)

  // Fallback if boat name produced an empty slug (e.g. all special chars)
  const safePart = slug || 'boat'

  return `${safePart}-${hash}`
}
