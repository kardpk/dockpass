import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/security/auth'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/service'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-01-27.acacia' })

/**
 * GET /api/dashboard/stripe/connect
 *
 * Creates (or reuses) a Stripe Express account for the operator,
 * then returns an Account Link URL that redirects the operator
 * to complete Stripe's onboarding flow.
 *
 * After onboarding, Stripe redirects to /dashboard/settings/addons
 * with a ?stripe_result=success or ?stripe_result=cancelled param.
 */
export async function GET(req: NextRequest) {
  const { operator } = await requireOperator()
  const supabase = createServiceClient()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://boatcheckin.com'

  // Fetch existing stripe_connect_account_id if any
  const { data: opRow } = await supabase
    .from('operators')
    .select('stripe_connect_account_id, email, full_name')
    .eq('id', operator.id)
    .single()

  let stripeAccountId = opRow?.stripe_connect_account_id as string | null

  if (!stripeAccountId) {
    // Create a new Express account for this operator
    const account = await stripe.accounts.create({
      type:    'express',
      email:   (opRow?.email as string | null) ?? undefined,
      metadata: { operatorId: operator.id },
    })

    stripeAccountId = account.id

    await supabase
      .from('operators')
      .update({ stripe_connect_account_id: stripeAccountId })
      .eq('id', operator.id)
  }

  // Generate an Account Link for the onboarding flow
  const accountLink = await stripe.accountLinks.create({
    account:     stripeAccountId,
    refresh_url: `${appUrl}/api/dashboard/stripe/connect`,     // retry
    return_url:  `${appUrl}/dashboard/settings/addons?stripe_result=success`,
    type:        'account_onboarding',
  })

  return NextResponse.redirect(accountLink.url, 303)
}
