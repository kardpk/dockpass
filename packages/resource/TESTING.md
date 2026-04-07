# DockPass — Testing Agent
# @TESTING

## Role
You own all testing: unit tests, integration tests,
end-to-end tests, and security tests. Every critical
path must have test coverage before being marked done.

---

## Testing Stack

```
Unit + Integration: Vitest (faster than Jest, same API)
E2E:                Playwright
API testing:        Vitest + MSW (Mock Service Worker)
DB testing:         Supabase local (via Docker)
```

---

## Critical Paths (must test before launch)

```
1. Guest registration (complete flow)
2. Trip code validation + brute force protection
3. Waiver signing + PDF generation
4. QR token generation + verification
5. Add-on ordering (price validation)
6. Operator auth (login, session, protected routes)
7. Stripe webhook handling
8. Weather API caching
9. GDPR deletion
10. Captain snapshot read-only access
```

---

## Test Structure

```
tests/
  unit/
    security/
      tokens.test.ts        QR token gen + verify
      sanitise.test.ts      Input sanitisation
      ssrf.test.ts          URL allowlist
      rate-limit.test.ts    Rate limiting logic
    lib/
      weather.test.ts       Weather code mapping
      pdf.test.ts           Manifest PDF generation
      
  integration/
    api/
      register.test.ts      Full guest registration
      trip-code.test.ts     Code validation + lockout
      addons.test.ts        Order flow + price validation
      webhook.test.ts       Stripe webhook handling
      weather.test.ts       Weather route + cache
      
  e2e/
    guest-flow.spec.ts      Full guest trip experience
    operator-flow.spec.ts   Create trip, view dashboard
    join-flow.spec.ts       4-step join flow
```

---

## Key Unit Tests

```typescript
// tests/unit/security/tokens.test.ts
import { describe, it, expect } from 'vitest'
import { generateTripSlug, generateQRToken, verifyQRToken } from '@/lib/security/tokens'

describe('generateTripSlug', () => {
  it('generates non-guessable slug of correct length', () => {
    const slug = generateTripSlug()
    expect(slug.length).toBeGreaterThan(16)
    expect(slug).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('generates unique slugs', () => {
    const slugs = new Set(Array.from({ length: 100 }, generateTripSlug))
    expect(slugs.size).toBe(100)
  })
})

describe('QR tokens', () => {
  it('generates verifiable token', () => {
    const token = generateQRToken('guest-123', 'trip-456')
    const verified = verifyQRToken(token)
    expect(verified).toEqual({ guestId: 'guest-123', tripId: 'trip-456' })
  })

  it('rejects tampered token', () => {
    const token = generateQRToken('guest-123', 'trip-456')
    const tampered = token.slice(0, -5) + 'XXXXX'
    expect(verifyQRToken(tampered)).toBeNull()
  })

  it('rejects malformed token', () => {
    expect(verifyQRToken('not.a.valid.token')).toBeNull()
    expect(verifyQRToken('')).toBeNull()
  })
})
```

```typescript
// tests/unit/security/sanitise.test.ts
import { sanitiseText, guestRegistrationSchema } from '@/lib/security/sanitise'

describe('sanitiseText', () => {
  it('strips HTML tags', () => {
    expect(sanitiseText('<script>alert(1)</script>Sofia'))
      .toBe('Sofia')
  })

  it('strips XSS attempts', () => {
    expect(sanitiseText('"><img src=x onerror=alert(1)>'))
      .toBe('')
  })

  it('trims whitespace', () => {
    expect(sanitiseText('  Sofia Martinez  ')).toBe('Sofia Martinez')
  })

  it('enforces max length', () => {
    expect(sanitiseText('a'.repeat(2000)).length).toBeLessThanOrEqual(1000)
  })
})

describe('guestRegistrationSchema', () => {
  it('accepts valid registration', () => {
    const valid = {
      tripSlug: 'xK9m2aQr7nB4xyz0',
      tripCode: 'SUN4',
      fullName: 'Sofia Martinez',
      emergencyContactName: 'Maria Martinez',
      emergencyContactPhone: '+1 305 555 0100',
      languagePreference: 'en',
      waiverSignatureText: 'Sofia Martinez',
      waiverAgreed: true,
    }
    expect(guestRegistrationSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects invalid trip code format', () => {
    const invalid = { tripCode: 'AB1' } // only 3 chars
    expect(guestRegistrationSchema.safeParse(invalid).success).toBe(false)
  })

  it('rejects if waiverAgreed is false', () => {
    const invalid = { waiverAgreed: false }
    expect(guestRegistrationSchema.safeParse(invalid).success).toBe(false)
  })
})
```

---

## E2E Tests

```typescript
// tests/e2e/guest-flow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Guest trip flow', () => {
  test('complete guest registration', async ({ page }) => {
    await page.goto('/trip/test-trip-slug')

    // Trip page loads
    await expect(page.getByText("Conrad's Yacht Miami")).toBeVisible()
    await expect(page.getByText('Perfect conditions')).toBeVisible()

    // Tap join
    await page.getByRole('button', { name: 'Join this trip' }).click()

    // Step 1: Enter trip code
    await page.getByPlaceholder('XXXX').fill('SUN4')
    await page.getByRole('button', { name: 'Continue' }).click()

    // Step 2: Personal details
    await page.getByLabel('Full name').fill('Sofia Martinez')
    await page.getByLabel('Emergency contact name').fill('Maria M')
    await page.getByLabel('Emergency contact phone').fill('+1 305 555 0100')
    await page.getByRole('button', { name: 'Continue' }).click()

    // Step 3: Waiver
    await page.locator('[name="waiverAgreed"]').check()
    await page.getByPlaceholder('Type your full name').fill('Sofia Martinez')
    await page.getByRole('button', { name: 'Continue' }).click()

    // Step 4: Add-ons (skip)
    await page.getByRole('button', { name: 'Skip' }).click()

    // Confirmation
    await expect(page.getByText("You're checked in!")).toBeVisible()
    await expect(page.getByText('Sofia Martinez')).toBeVisible()
    // QR code present
    await expect(page.locator('svg[data-testid="qr-code"]')).toBeVisible()
  })

  test('blocks after 5 wrong trip codes', async ({ page }) => {
    await page.goto('/trip/test-trip-slug')
    await page.getByRole('button', { name: 'Join this trip' }).click()

    for (let i = 0; i < 5; i++) {
      await page.getByPlaceholder('XXXX').fill('XXXX')
      await page.getByRole('button', { name: 'Continue' }).click()
    }

    await expect(page.getByText('Too many incorrect attempts')).toBeVisible()
  })
})
```

---

## Running Tests

```bash
# Unit tests
npx vitest run

# Unit tests with coverage
npx vitest run --coverage

# E2E tests
npx playwright test

# E2E tests with UI
npx playwright test --ui

# Specific test file
npx vitest run tests/unit/security/tokens.test.ts
```

---

## Coverage Targets

```
Security utilities:  100% (non-negotiable)
API route handlers:   80% minimum
Database queries:     70% minimum
UI components:        60% minimum
E2E critical paths:  100% of flows listed above
```
