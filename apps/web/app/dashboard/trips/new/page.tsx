import { Suspense } from 'react'
import Link from 'next/link'
import { requireOperator } from '@/lib/security/auth'
import { createClient } from '@/lib/supabase/server'
import { AnchorLoader } from '@/components/ui/AnchorLoader'
import { TripCreateForm } from './TripCreateForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create trip — BoatCheckin',
}

async function getOperatorBoats(operatorId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('boats')
    .select('id, boat_name, boat_type, max_capacity, charter_type, marina_name, slip_number')
    .eq('operator_id', operatorId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
  return data ?? []
}

export default async function CreateTripPage() {
  const { operator } = await requireOperator()
  const boats = await getOperatorBoats(operator.id)

  if (boats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
        <div className="text-4xl">⚓</div>
        <h2 className="text-[18px] font-semibold text-[#0D1B2A]">
          Set up a boat first
        </h2>
        <p className="text-[15px] text-[#6B7C93] text-center max-w-xs">
          You need at least one boat profile before creating a trip.
        </p>
        <Link
          href="/dashboard/boats/new"
          className="h-[52px] px-6 rounded-[12px] bg-[#0C447C] text-white font-semibold text-[15px] flex items-center justify-center hover:bg-[#093a6b] transition-colors"
        >
          Set up my boat →
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-[560px] mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-[#0D1B2A]">
          Create a trip
        </h1>
        <p className="text-[15px] text-[#6B7C93] mt-1">
          Share one link with all your guests
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex justify-center py-12">
            <AnchorLoader size="md" color="navy" />
          </div>
        }
      >
        <TripCreateForm
          boats={boats}
          operatorName={operator.full_name ?? ''}
        />
      </Suspense>
    </div>
  )
}
