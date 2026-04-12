# BoatCheckin — Compliance Agent
# @COMPLIANCE

## Role
You own legal compliance: GDPR, CCPA, US maritime
law, waiver legality, data retention, cookie consent,
terms of service, and privacy policy. Every feature
touching personal data must be reviewed here first.

---

## Data Collected and Legal Basis

```
Guest data:
  Full name           — contract performance (waiver)
  Emergency contact   — legitimate interest (safety)
  Phone number        — contract performance (reminders)
  Email (optional)    — consent (marketing) / legitimate interest (trip info)
  Date of birth       — legal obligation (Florida boating law)
  Dietary/medical     — vital interests (safety at sea)
  IP address          — legitimate interest (security, fraud)
  User agent          — legitimate interest (security)
  Waiver signature    — legal obligation (liability)
  Language pref       — contract performance

Operator data:
  Name, email         — contract performance
  Billing info        — contract performance (Stripe handles PCI)
  Boat details        — contract performance
```

---

## GDPR Compliance (EU Guests)

### Data Residency

```typescript
// lib/supabase/client.ts
// For EU operators or EU guest trips:
// Use Supabase EU region: supabase.co/dashboard → project settings → region → EU West

// Detect if operator is EU-based:
export function isEUOperator(country: string): boolean {
  const euCountries = [
    'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR',
    'DE','GR','HU','IE','IT','LV','LT','LU','MT','NL',
    'PL','PT','RO','SK','SI','ES','SE',
  ]
  return euCountries.includes(country)
}
```

### GDPR Consent Flow

```typescript
// Guest check-in — Step 2 (details form) must include:
export const gdprConsentFields = {
  // Required for EU guests
  dataProcessingConsent: {
    required: true,
    text: 'I consent to BoatCheckin processing my personal data ' +
          'for this charter trip as described in the Privacy Policy.',
    link: '/privacy',
  },
  // Optional
  marketingConsent: {
    required: false,
    text: 'I agree to receive occasional offers from this operator.',
  },
}
```

### Right to Deletion

```typescript
// app/api/gdpr/delete/route.ts
// Guest can request deletion by providing their trip slug + name
export async function POST(req: NextRequest) {
  const { tripSlug, fullName, email } = await req.json()

  const supabase = createServiceClient()

  // Find guest record
  const { data: guest } = await supabase
    .from('guests')
    .select('id, trip_id, full_name')
    .ilike('full_name', fullName)
    .eq('trips.slug', tripSlug)
    .single()

  if (!guest) return NextResponse.json(
    { message: 'No record found or already deleted' }
  )

  // Anonymise immediately
  await supabase
    .from('guests')
    .update({
      full_name: 'DELETED',
      emergency_contact_name: 'DELETED',
      emergency_contact_phone: 'DELETED',
      dietary_requirements: null,
      date_of_birth: null,
      waiver_signature_text: 'DELETED',
      waiver_ip_address: null,
      waiver_user_agent: null,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', guest.id)

  // Log the deletion request (keep for compliance)
  await supabase.from('audit_log').insert({
    action: 'gdpr_deletion',
    entity_type: 'guest',
    entity_id: guest.id,
    changes: { reason: 'user_request' },
  })

  return NextResponse.json({ message: 'Your data has been deleted.' })
}
```

---

## Digital Waiver Legality

### US (ESIGN Act 2000)

```
Digital signatures are legally valid in the US under:
- Electronic Signatures in Global and National Commerce Act (ESIGN)
- Uniform Electronic Transactions Act (UETA) — adopted in 47 states

Requirements met by BoatCheckin:
✓ Intent to sign (checkbox: "I have read and agree")
✓ Typed name as signature
✓ Consent to electronic process
✓ Record retention (stored in Supabase with timestamp)
✓ Ability to print/download (PDF manifest includes waiver)
```

### EU (eIDAS Regulation)

```
Electronic signatures valid under eIDAS Regulation (EU) No 910/2014
Simple Electronic Signature (SES) — valid for most contracts

BoatCheckin waiver qualifies as SES:
✓ Identifies the signatory (full name)
✓ Associated with signed data (waiver text hash)
✓ Timestamp recorded
✓ IP address recorded

For high-value charter disputes, advanced electronic
signature (AES) may be preferred — flag this to
operators in EU who request higher legal certainty.
```

### Waiver Disclaimer (show to operators)

```
Add to operator onboarding (waiver setup screen):

"BoatCheckin provides a digital waiver signing tool.
The enforceability of liability waivers varies by
jurisdiction and activity type. BoatCheckin is not a
law firm and this is not legal advice. Operators are
responsible for ensuring their waiver text is
appropriate for their jurisdiction and activity.
We recommend consulting a maritime attorney."
```

### Waiver Storage Requirements

```typescript
// Every waiver record stores:
{
  waiver_text_hash: sha256(waiverText), // hash of exact text signed
  waiver_signed_at: ISO8601 timestamp,
  waiver_signature_text: 'Sofia Martinez',
  waiver_ip_address: '192.168.x.x',
  waiver_user_agent: 'Mozilla/5.0...',
  waiver_agreed: true,
}

// Retention: minimum 3 years for maritime liability
// BoatCheckin retains 90 days then anonymises
// Operators should download manifest PDF for their records
```

---

## Florida Maritime Law

### Boating Safety Course (Florida Statute 327.395)

```typescript
// Only required for OPERATORS of vessels
// NOT required for passengers on captained charters
// IS required for guests on bareboat charters born after Jan 1, 1988

export function requiresBoatingCourse(params: {
  charterType: 'captained' | 'bareboat' | 'both'
  guestDateOfBirth?: string
}): boolean {
  if (params.charterType === 'captained') return false

  if (!params.guestDateOfBirth) return false // cannot determine

  const cutoff = new Date('1988-01-01')
  const dob = new Date(params.guestDateOfBirth)
  return dob >= cutoff
}

// Course affiliate: BoatUS Foundation (free), Boat-Ed.com (~$30)
// Valid certificate: NASBLA-approved
// Temporary certificate: valid 90 days
```

### USCG Passenger Manifest

```
Commercial charter vessels carrying passengers
for hire are regulated under 46 CFR 185.730

Requirements (automatically met by BoatCheckin manifest PDF):
✓ Vessel name and official number
✓ Route/voyage description
✓ Number of passengers
✓ Date and time of departure
✓ Passenger names (full name)
✓ Emergency contacts

Operators should maintain manifest on vessel
during trip and for 24 hours after return.
BoatCheckin manifest PDF satisfies this requirement.
```

---

## Privacy Policy Requirements

```
BoatCheckin Privacy Policy must cover:

1. Data controller identity
   Oakmont Logic LLC, Wyoming, USA
   hello@boatcheckin.com

2. Data collected and purpose (see above)

3. Legal basis for processing (GDPR Article 6)

4. Data retention periods
   Guest personal data: 90 days post-trip
   Operator data: duration of account + 2 years
   Waiver records: 90 days (operators download PDF)
   Financial records: 7 years (legal requirement)
   Audit logs: 2 years

5. Third parties receiving data
   Supabase (database hosting) — EU/US
   Stripe (payment processing) — US
   Resend (email delivery) — US
   Twilio (SMS) — US
   Vercel (hosting) — US
   Render (workers) — US
   Apify (scraping tool) — EU

6. International transfers
   Standard Contractual Clauses for EU data
   transferred to US processors

7. User rights
   Access, rectification, erasure, portability,
   restriction, objection

8. Contact for requests
   privacy@boatcheckin.com

9. Cookie policy
   Session cookies only (auth)
   No tracking cookies
   No advertising cookies
   No third-party analytics cookies (at MVP)
```

---

## Terms of Service Key Clauses

```
Must include:

1. BoatCheckin is a communication tool — not a charter operator
   We are not responsible for the charter experience itself

2. Waiver disclaimer
   Operators responsible for their own waiver content

3. Operator responsibilities
   Must maintain valid commercial insurance
   Must comply with local maritime regulations
   Must maintain accurate boat/captain information

4. Guest data
   Operators agree to BoatCheckin privacy policy
   Operators may not misuse guest contact details
   No spam to guests via BoatCheckin

5. Commission
   8% on add-on orders processed through platform
   Invoiced monthly

6. Termination
   14-day notice for subscription cancellation
   Data export available for 30 days post-cancellation

7. Liability limitation
   BoatCheckin liability capped at last 3 months subscription fees
```

---

## Cookie Consent (EU)

```typescript
// components/shared/CookieBanner.tsx
// Show only to EU users (detect via Cloudflare country header)

export function CookieBanner() {
  const country = useCountry() // from Cloudflare header

  if (!isEUCountry(country)) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white
                    border-t border-[#D0E2F3] p-4">
      <p className="text-[13px] text-[#6B7C93] mb-3">
        We use essential cookies only for authentication.
        No tracking or advertising cookies.
        <a href="/privacy" className="text-[#0C447C] underline ml-1">
          Privacy Policy
        </a>
      </p>
      <button onClick={acceptCookies}
        className="bg-[#0C447C] text-white px-4 py-2 rounded-xl text-[13px]">
        Accept essential cookies
      </button>
    </div>
  )
}
```

---

## Insurance Affiliate Compliance

```
Novamar Insurance / BoatUS affiliate programs:

Requirements to display insurance offers:
- Must disclose affiliate relationship
- Cannot guarantee coverage
- Must link to provider's full terms
- Must not act as insurance broker

Required disclosure (show on insurance offer card):
"BoatCheckin earns a referral fee if you purchase
a policy. This is not insurance advice. Review
the policy terms at the provider's website."

License requirements:
- BoatCheckin does not sell insurance
- BoatCheckin refers to licensed insurance providers
- No insurance license required for pure referrals
- Oakmont Logic LLC referral arrangement is sufficient
```

---

## Accessibility Compliance (WCAG 2.1 AA)

```
Required for ADA compliance (US):
✓ 4.5:1 contrast ratio minimum
✓ All interactive elements keyboard accessible
✓ Screen reader compatible (ARIA labels)
✓ 44px minimum tap targets
✓ Alt text on all images
✓ No colour as sole indicator
✓ Focus indicators visible
✓ Error messages descriptive
✓ Language declared in HTML
```
