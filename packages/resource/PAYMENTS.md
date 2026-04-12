# BoatCheckin — Payments Agent
# @PAYMENTS

## Role
You own all Stripe integration, subscription
management, add-on order flow, and payout logic.
Never handle raw card data — Stripe does that.
Always verify webhooks. Always calculate
prices server-side. Reference @SECURITY.md.

---

## Pricing Tiers

```typescript
// lib/stripe/plans.ts
export const PLANS = {
  solo: {
    name: 'Solo',
    maxBoats: 1,
    monthlyPriceId: 'price_solo_monthly',
    annualPriceId: 'price_solo_annual',
    monthlyAmount: 4900,   // $49.00 in cents
    annualAmount: 39200,   // $392/yr = $32.67/mo (save ~$120)
  },
  captain: {
    name: 'Captain',
    maxBoats: 3,
    monthlyPriceId: 'price_captain_monthly',
    annualPriceId: 'price_captain_annual',
    monthlyAmount: 8900,
    annualAmount: 71200,
  },
  fleet: {
    name: 'Fleet',
    maxBoats: 10,
    monthlyPriceId: 'price_fleet_monthly',
    annualPriceId: 'price_fleet_annual',
    monthlyAmount: 17900,
    annualAmount: 143200,
  },
  marina: {
    name: 'Marina',
    maxBoats: 999,
    monthlyPriceId: 'price_marina_monthly',
    annualPriceId: 'price_marina_annual',
    monthlyAmount: 34900,
    annualAmount: 279200,
  },
} as const

export type PlanTier = keyof typeof PLANS
```

---

## Stripe Client Setup

```typescript
// lib/stripe/client.ts
import Stripe from 'stripe'

// Server-side only — never expose to browser
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
  typescript: true,
})

// lib/stripe/browser.ts
import { loadStripe } from '@stripe/stripe-js'

// Browser-safe publishable key only
export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)
```

---

## Subscription Checkout

```typescript
// app/api/billing/checkout/route.ts
import { stripe } from '@/lib/stripe/client'
import { PLANS } from '@/lib/stripe/plans'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest) {
  const { operator } = await requireOperator()
  const { tier, billing } = await req.json()

  const plan = PLANS[tier as PlanTier]
  if (!plan) return NextResponse.json(
    { error: 'Invalid plan' }, { status: 400 }
  )

  const priceId = billing === 'annual'
    ? plan.annualPriceId
    : plan.monthlyPriceId

  const supabase = createServiceClient()

  // Get or create Stripe customer
  let customerId = operator.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: operator.email,
      name: operator.full_name,
      metadata: { operatorId: operator.id },
    })
    customerId = customer.id

    await supabase
      .from('operators')
      .update({ stripe_customer_id: customerId })
      .eq('id', operator.id)
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    subscription_data: {
      metadata: {
        operatorId: operator.id,
        tier,
        billing,
      },
      trial_period_days: operator.subscription_tier === 'trial' ? 14 : 0,
    },
    allow_promotion_codes: true,
  })

  return NextResponse.json({ url: session.url })
}
```

---

## Subscription Portal (manage billing)

```typescript
// app/api/billing/portal/route.ts
export async function POST(req: NextRequest) {
  const { operator } = await requireOperator()

  if (!operator.stripe_customer_id) return NextResponse.json(
    { error: 'No billing account found' }, { status: 400 }
  )

  const session = await stripe.billingPortal.sessions.create({
    customer: operator.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
  })

  return NextResponse.json({ url: session.url })
}
```

---

## Webhook Handler (all subscription events)

```typescript
// app/api/webhooks/stripe/route.ts
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe/client'
import { PLANS } from '@/lib/stripe/plans'
import { createServiceClient } from '@/lib/supabase/service'

// IMPORTANT: must disable body parsing for raw body
export const config = { api: { bodyParser: false } }

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) return NextResponse.json(
    { error: 'No signature' }, { status: 400 }
  )

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body, sig, process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  switch (event.type) {

    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription') break

      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      )
      await updateOperatorSubscription(supabase, subscription)
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      await updateOperatorSubscription(supabase, subscription)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const operatorId = subscription.metadata.operatorId
      if (!operatorId) break

      await supabase
        .from('operators')
        .update({
          subscription_tier: 'solo',
          subscription_status: 'cancelled',
          max_boats: 1,
        })
        .eq('id', operatorId)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const sub = await stripe.subscriptions.retrieve(
        invoice.subscription as string
      )
      const operatorId = sub.metadata.operatorId
      if (!operatorId) break

      await supabase
        .from('operators')
        .update({ subscription_status: 'paused' })
        .eq('id', operatorId)

      // Notify operator via email
      await sendPaymentFailedEmail(operatorId)
      break
    }
  }

  return NextResponse.json({ received: true })
}

async function updateOperatorSubscription(
  supabase: ReturnType<typeof createServiceClient>,
  subscription: Stripe.Subscription
) {
  const operatorId = subscription.metadata.operatorId
  if (!operatorId) return

  const tier = subscription.metadata.tier as PlanTier ?? 'solo'
  const plan = PLANS[tier]

  const statusMap: Record<string, string> = {
    active: 'active',
    trialing: 'trial',
    past_due: 'paused',
    canceled: 'cancelled',
    unpaid: 'paused',
  }

  await supabase
    .from('operators')
    .update({
      subscription_tier: tier,
      subscription_status: statusMap[subscription.status] ?? 'active',
      stripe_subscription_id: subscription.id,
      max_boats: plan.maxBoats,
    })
    .eq('id', operatorId)
}
```

---

## Add-On Commission Tracking

```typescript
// Add-on orders are stored in guest_addon_orders table
// BoatCheckin takes 8% commission on all add-on sales
// This is tracked but payment collection is phase 2
// (Phase 1: operator collects cash, BoatCheckin invoices monthly)

// lib/stripe/commission.ts
export const ADDON_COMMISSION_RATE = 0.08 // 8%

export function calculateCommission(totalCents: number): number {
  return Math.round(totalCents * ADDON_COMMISSION_RATE)
}

// Monthly commission invoice (phase 2 — use Stripe Invoicing)
export async function createCommissionInvoice(
  operatorId: string,
  totalAddonCents: number,
  period: string
) {
  const commissionCents = calculateCommission(totalAddonCents)

  const invoice = await stripe.invoices.create({
    customer: await getStripeCustomerId(operatorId),
    auto_advance: true,
    description: `BoatCheckin add-on commission — ${period}`,
    metadata: { operatorId, period, type: 'commission' },
  })

  await stripe.invoiceItems.create({
    customer: await getStripeCustomerId(operatorId),
    invoice: invoice.id,
    amount: commissionCents,
    currency: 'usd',
    description: `8% commission on $${(totalAddonCents / 100).toFixed(2)} add-on sales`,
  })

  await stripe.invoices.finalizeInvoice(invoice.id)
  return invoice
}
```

---

## Upgrade Flow (in-app)

```typescript
// When operator adds boat beyond their limit:
// components/dashboard/UpgradePrompt.tsx

export function UpgradePrompt({ currentTier, boatCount }: UpgradePromptProps) {
  const nextTier = getNextTier(currentTier)
  const plan = PLANS[nextTier]

  const handleUpgrade = async () => {
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      body: JSON.stringify({ tier: nextTier, billing: 'monthly' }),
    })
    const { url } = await res.json()
    window.location.href = url
  }

  return (
    <div className="bg-[#E8F2FB] border border-[#D0E2F3] rounded-2xl p-5">
      <p className="text-[#0C447C] font-semibold text-[15px] mb-1">
        Upgrade to {plan.name}
      </p>
      <p className="text-[#6B7C93] text-[13px] mb-4">
        You have {boatCount} boats. {plan.name} covers up to {plan.maxBoats}.
        Just ${plan.monthlyAmount / 100}/month.
      </p>
      <button onClick={handleUpgrade}
        className="bg-[#0C447C] text-white px-4 py-2 rounded-xl text-[14px] font-medium">
        Upgrade now →
      </button>
    </div>
  )
}
```

---

## Referral System

```typescript
// lib/stripe/referrals.ts
// Operator gets 1 free month when referral signs up

export async function applyReferralCredit(
  referredOperatorId: string,
  referrerCode: string
) {
  const supabase = createServiceClient()

  // Find referrer
  const { data: referrer } = await supabase
    .from('operators')
    .select('id, stripe_customer_id')
    .eq('referral_code', referrerCode)
    .single()

  if (!referrer?.stripe_customer_id) return

  // Apply credit to referrer's next invoice
  await stripe.customerBalanceTransactions.create(
    referrer.stripe_customer_id,
    {
      amount: -4900, // $49 credit (Solo tier value)
      currency: 'usd',
      description: 'Referral reward — 1 month free',
      metadata: { referredOperatorId },
    }
  )

  // Mark referral on new operator
  await supabase
    .from('operators')
    .update({ referred_by: referrer.id })
    .eq('id', referredOperatorId)
}
```
