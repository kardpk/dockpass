'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createTrip } from './actions'
import { TripSuccessCard } from './TripSuccessCard'
import { SplitBookingEditor } from './SplitBookingEditor'
import { AnchorLoader } from '@/components/ui/AnchorLoader'
import { cn } from '@/lib/utils/cn'
import type { TripFormData, TripCreatedResult, SplitBookingEntry, TripPurpose } from '@/types'
import { DURATION_OPTIONS, TRIP_PURPOSE_LABELS } from '@/types'
import { shouldShowConsiderationWarning } from '@/lib/compliance/tripCompliance'

interface Boat {
  id: string
  boat_name: string
  boat_type: string
  max_capacity: number
  charter_type: string
  marina_name: string
  slip_number: string | null
}

interface TripCreateFormProps {
  boats: Boat[]
  operatorName: string
}

export function TripCreateForm({ boats }: TripCreateFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<TripCreatedResult | null>(null)
  const [error, setError] = useState<string>('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [showCustomDuration, setShowCustomDuration] = useState(false)
  const [splitBookings, setSplitBookings] = useState<SplitBookingEntry[]>([])

  // ─── Form state ────────────────────────────────────────────────────────────
  const [form, setForm] = useState<TripFormData>({
    boatId: boats.length === 1 ? boats[0]!.id : '',
    boatName: boats.length === 1 ? boats[0]!.boat_name : '',
    boatCapacity: boats.length === 1 ? boats[0]!.max_capacity : 0,
    tripDate: '',
    departureTime: '09:00',
    durationHours: 4,
    maxGuests: boats.length === 1 ? boats[0]!.max_capacity : 0,
    bookingType: 'private',
    requiresApproval: false,
    tripCode: generateTripCodeClient(),
    charterType: (boats.length === 1 ? boats[0]!.charter_type : 'captained') as TripFormData['charterType'],
    specialNotes: '',
    splitBookings: [],
    tripPurpose: 'commercial',
    forceFullCompliance: false,
    fuelShareDisclaimerAccepted: false,
  })

  function handleBoatChange(boatId: string) {
    const boat = boats.find((b) => b.id === boatId)
    if (!boat) return
    setForm((prev) => ({
      ...prev,
      boatId,
      boatName: boat.boat_name,
      boatCapacity: boat.max_capacity,
      maxGuests: boat.max_capacity,
      charterType: boat.charter_type as TripFormData['charterType'],
    }))
    setFieldErrors({})
  }

  const todayStr = new Date().toISOString().split('T')[0]!

  // ─── Submit ────────────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    startTransition(async () => {
      const res = await createTrip({
        ...form,
        splitBookings: form.bookingType === 'split' ? splitBookings : [],
      })

      if (!res.success) {
        setError(res.error)
        if (res.fieldErrors) setFieldErrors(res.fieldErrors)
        return
      }

      setResult(res.data)
    })
  }

  // ─── Success screen ────────────────────────────────────────────────────────
  if (result) {
    return (
      <TripSuccessCard
        result={result}
        onCreateAnother={() => {
          setResult(null)
          setForm((prev) => ({
            ...prev,
            tripDate: '',
            tripCode: generateTripCodeClient(),
            specialNotes: '',
          }))
        }}
        onViewTrip={() => router.push(`/dashboard/trips/${result.tripId}`)}
      />
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">

      {/* ── TRIP PURPOSE ──────────────────────────────────────────────── */}
      <div>
        <label className="block text-[13px] font-medium text-[#6B7C93] mb-2">
          What kind of trip? <span className="text-[#D63B3B]">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(Object.entries(TRIP_PURPOSE_LABELS) as [TripPurpose, typeof TRIP_PURPOSE_LABELS[TripPurpose]][]).map(
            ([value, meta]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setForm((p) => ({
                    ...p,
                    tripPurpose: value,
                    fuelShareDisclaimerAccepted: value !== 'fishing_social' ? false : p.fuelShareDisclaimerAccepted,
                  }))
                }}
                className={cn(
                  'p-3 rounded-[14px] text-left border transition-all min-h-[72px]',
                  form.tripPurpose === value
                    ? 'border-2 border-[#0C447C] bg-[#E8F2FB]'
                    : 'border border-[#D0E2F3] bg-white hover:border-[#A8C4E0]',
                )}
              >
                <div className="text-[20px] mb-0.5">{meta.icon}</div>
                <div className="text-[13px] font-semibold text-[#0D1B2A] leading-tight">{meta.label}</div>
                <div className="text-[11px] text-[#6B7C93] mt-0.5 leading-tight">{meta.description}</div>
              </button>
            ),
          )}
        </div>

        {/* USCG Consideration warning */}
        {shouldShowConsiderationWarning(form.tripPurpose, form.charterType) && (
          <div className="mt-3 p-3.5 rounded-[12px] bg-[#FEF3DC] border border-[#E5910A]/30">
            <p className="text-[12px] text-[#92400E] leading-relaxed">
              <strong>⚠️ USCG Notice:</strong> If you accept <strong>any payment or consideration</strong> for
              this trip (cash, barter, fuel money from non-friends), you are legally operating
              &quot;for-hire&quot; and must comply with commercial vessel requirements (OUPV license,
              drug testing, enhanced equipment).
            </p>
          </div>
        )}

        {/* Fuel-sharing disclaimer for fishing trips */}
        {form.tripPurpose === 'fishing_social' && (
          <div className="mt-3 p-3.5 rounded-[12px] bg-[#F5F8FC] border border-[#D0E2F3]">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.fuelShareDisclaimerAccepted}
                onChange={(e) => setForm((p) => ({ ...p, fuelShareDisclaimerAccepted: e.target.checked }))}
                className="mt-0.5 w-4 h-4 rounded border-[#D0E2F3] text-[#0C447C] focus:ring-[#0C447C]"
              />
              <span className="text-[12px] text-[#0D1B2A] leading-relaxed">
                I confirm that this trip involves <strong>only shared expenses</strong> among friends/acquaintances.
                No passenger is paying me for transportation. I understand that accepting &quot;consideration&quot;
                from passengers would require me to operate as a commercial vessel.
              </span>
            </label>
          </div>
        )}

        {/* Force full compliance toggle for non-commercial trips */}
        {!['commercial', 'corporate'].includes(form.tripPurpose) && (
          <div className="mt-3 flex items-center justify-between p-3.5 rounded-[12px] bg-[#F5F8FC] border border-[#D0E2F3]">
            <div>
              <p className="text-[13px] font-medium text-[#0D1B2A]">Force full compliance</p>
              <p className="text-[11px] text-[#6B7C93] mt-0.5">
                Require waivers + safety briefing even for this trip type
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.forceFullCompliance}
              onClick={() => setForm((p) => ({ ...p, forceFullCompliance: !p.forceFullCompliance }))}
              className={cn(
                'relative w-12 h-6 rounded-full transition-colors',
                'focus-visible:ring-2 focus-visible:ring-[#0C447C]',
                form.forceFullCompliance ? 'bg-[#0C447C]' : 'bg-[#D0E2F3]',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm',
                  form.forceFullCompliance ? 'translate-x-6' : 'translate-x-0',
                )}
              />
            </button>
          </div>
        )}
      </div>

      {/* ── BOAT SELECTION ─────────────────────────────────────────────── */}
      <div>
        <label className="block text-[13px] font-medium text-[#6B7C93] mb-2">
          Which boat? <span className="text-[#D63B3B]">*</span>
        </label>

        {boats.length === 1 ? (
          <div className="flex items-center gap-3 p-4 border border-[#D0E2F3] rounded-[12px] bg-[#F5F8FC]">
            <span className="text-[20px]">🛥️</span>
            <div>
              <p className="text-[15px] font-medium text-[#0D1B2A]">{boats[0]!.boat_name}</p>
              <p className="text-[12px] text-[#6B7C93]">
                {boats[0]!.marina_name} · Up to {boats[0]!.max_capacity} guests
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {boats.map((boat) => (
              <button
                key={boat.id}
                type="button"
                onClick={() => handleBoatChange(boat.id)}
                className={cn(
                  'w-full flex items-center gap-3 p-4 border rounded-[12px] text-left transition-all',
                  form.boatId === boat.id
                    ? 'border-2 border-[#0C447C] bg-[#E8F2FB]'
                    : 'border border-[#D0E2F3] bg-white hover:border-[#A8C4E0]',
                )}
              >
                <span className="text-[18px]">🛥️</span>
                <div>
                  <p className="text-[15px] font-medium text-[#0D1B2A]">{boat.boat_name}</p>
                  <p className="text-[12px] text-[#6B7C93]">
                    {boat.marina_name} · Up to {boat.max_capacity} guests
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
        {fieldErrors.boatId && (
          <p className="text-[12px] text-[#D63B3B] mt-1">{fieldErrors.boatId[0]}</p>
        )}
      </div>

      {/* ── DATE + TIME ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[13px] font-medium text-[#6B7C93] mb-2">
            Date <span className="text-[#D63B3B]">*</span>
          </label>
          <input
            type="date"
            min={todayStr}
            value={form.tripDate}
            onChange={(e) => setForm((p) => ({ ...p, tripDate: e.target.value }))}
            className={cn(
              'w-full h-[52px] px-3 rounded-[10px] text-[15px]',
              'border bg-white text-[#0D1B2A]',
              'focus:outline-none focus:ring-2 focus:ring-[#0C447C] focus:border-transparent',
              fieldErrors.tripDate ? 'border-[#D63B3B]' : 'border-[#D0E2F3]',
            )}
            required
          />
          {fieldErrors.tripDate && (
            <p className="text-[12px] text-[#D63B3B] mt-1">{fieldErrors.tripDate[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-[13px] font-medium text-[#6B7C93] mb-2">
            Departure time <span className="text-[#D63B3B]">*</span>
          </label>
          <input
            type="time"
            step="900"
            value={form.departureTime}
            onChange={(e) => setForm((p) => ({ ...p, departureTime: e.target.value }))}
            className="w-full h-[52px] px-3 rounded-[10px] text-[15px] border border-[#D0E2F3] bg-white text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#0C447C] focus:border-transparent"
            required
          />
        </div>
      </div>

      {/* ── DURATION ─────────────────────────────────────────────────────── */}
      <div>
        <label className="block text-[13px] font-medium text-[#6B7C93] mb-2">
          Duration <span className="text-[#D63B3B]">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {DURATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                if (opt.value === 0) {
                  setShowCustomDuration(true)
                  setForm((p) => ({ ...p, durationHours: 0 }))
                } else {
                  setShowCustomDuration(false)
                  setForm((p) => ({ ...p, durationHours: opt.value }))
                }
              }}
              className={cn(
                'px-4 py-2 rounded-[20px] text-[14px] font-medium',
                'border transition-all duration-150 min-h-[44px]',
                (opt.value === 0 ? showCustomDuration : form.durationHours === opt.value)
                  ? 'bg-[#0C447C] text-white border-[#0C447C]'
                  : 'bg-white text-[#0D1B2A] border-[#D0E2F3] hover:border-[#0C447C]',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {showCustomDuration && (
          <div className="mt-3 flex items-center gap-2">
            <input
              type="number"
              min="0.5"
              max="24"
              step="0.5"
              placeholder="Hours (e.g. 7)"
              value={form.durationHours || ''}
              onChange={(e) =>
                setForm((p) => ({ ...p, durationHours: Number(e.target.value) }))
              }
              className="h-[52px] w-36 px-3 rounded-[10px] text-[15px] border border-[#0C447C] bg-white text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
              autoFocus
            />
            <span className="text-[13px] text-[#6B7C93]">hours</span>
          </div>
        )}
        {fieldErrors.durationHours && (
          <p className="text-[12px] text-[#D63B3B] mt-1">{fieldErrors.durationHours[0]}</p>
        )}
      </div>

      {/* ── MAX GUESTS ───────────────────────────────────────────────────── */}
      <div>
        <label className="block text-[13px] font-medium text-[#6B7C93] mb-2">
          Max guests <span className="text-[#D63B3B]">*</span>
        </label>
        <div className="flex items-center gap-4">
          <div className="flex items-center border border-[#D0E2F3] rounded-[12px] overflow-hidden">
            <button
              type="button"
              onClick={() =>
                setForm((p) => ({ ...p, maxGuests: Math.max(1, p.maxGuests - 1) }))
              }
              className="w-[52px] h-[52px] text-[20px] font-medium text-[#0C447C] hover:bg-[#E8F2FB] transition-colors flex items-center justify-center"
              aria-label="Decrease guests"
            >
              −
            </button>
            <input
              type="number"
              min="1"
              max={form.boatCapacity || 500}
              value={form.maxGuests}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  maxGuests: Math.min(Number(e.target.value), p.boatCapacity || 500),
                }))
              }
              className="w-16 h-[52px] text-center text-[18px] font-semibold text-[#0D1B2A] border-none outline-none bg-transparent"
            />
            <button
              type="button"
              onClick={() =>
                setForm((p) => ({
                  ...p,
                  maxGuests: Math.min(p.maxGuests + 1, p.boatCapacity || 500),
                }))
              }
              className="w-[52px] h-[52px] text-[20px] font-medium text-[#0C447C] hover:bg-[#E8F2FB] transition-colors flex items-center justify-center"
              aria-label="Increase guests"
            >
              +
            </button>
          </div>
          {form.boatCapacity > 0 && (
            <span className="text-[13px] text-[#6B7C93]">
              Max {form.boatCapacity} for this boat
            </span>
          )}
        </div>
        {fieldErrors.maxGuests && (
          <p className="text-[12px] text-[#D63B3B] mt-1">{fieldErrors.maxGuests[0]}</p>
        )}
      </div>

      {/* ── BOOKING TYPE ─────────────────────────────────────────────────── */}
      <div>
        <label className="block text-[13px] font-medium text-[#6B7C93] mb-2">
          Booking type
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'private' as const, icon: '🔒', title: 'Private charter', body: 'One group, one link' },
            { value: 'split' as const, icon: '👥', title: 'Split charter', body: 'Multiple separate groups' },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm((p) => ({ ...p, bookingType: opt.value }))}
              className={cn(
                'p-4 rounded-[16px] text-left border transition-all min-h-[44px]',
                form.bookingType === opt.value
                  ? 'border-2 border-[#0C447C] bg-[#E8F2FB]'
                  : 'border border-[#D0E2F3] bg-white hover:border-[#A8C4E0]',
              )}
            >
              <div className="text-[20px] mb-1">{opt.icon}</div>
              <div className="text-[14px] font-semibold text-[#0D1B2A]">{opt.title}</div>
              <div className="text-[12px] text-[#6B7C93] mt-0.5">{opt.body}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── SPLIT BOOKING EDITOR ─────────────────────────────────────────── */}
      {form.bookingType === 'split' && (
        <SplitBookingEditor
          entries={splitBookings}
          onChange={setSplitBookings}
          maxTotalGuests={form.maxGuests}
        />
      )}

      {/* ── MANUAL APPROVAL ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[15px] font-medium text-[#0D1B2A]">Manual approval</p>
          <p className="text-[13px] text-[#6B7C93] mt-0.5">
            Review each guest before they are confirmed
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={form.requiresApproval}
          onClick={() => setForm((p) => ({ ...p, requiresApproval: !p.requiresApproval }))}
          className={cn(
            'relative w-12 h-6 rounded-full transition-colors',
            'focus-visible:ring-2 focus-visible:ring-[#0C447C]',
            form.requiresApproval ? 'bg-[#0C447C]' : 'bg-[#D0E2F3]',
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm',
              form.requiresApproval ? 'translate-x-6' : 'translate-x-0',
            )}
          />
        </button>
      </div>

      {/* ── TRIP CODE ────────────────────────────────────────────────────── */}
      <div>
        <label className="block text-[13px] font-medium text-[#6B7C93] mb-2">
          Trip code
          <span className="text-[12px] text-[#6B7C93] font-normal ml-2">
            Guests enter this to check in
          </span>
        </label>
        <div className="flex items-center gap-3">
          <input
            type="text"
            maxLength={4}
            value={form.tripCode}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                tripCode: e.target.value.toUpperCase().slice(0, 4),
              }))
            }
            className="w-24 h-[52px] text-center text-[22px] font-mono font-bold tracking-widest uppercase border border-[#D0E2F3] rounded-[10px] text-[#0C447C] focus:outline-none focus:ring-2 focus:ring-[#0C447C] focus:border-transparent bg-white"
            placeholder="SUN4"
          />
          <button
            type="button"
            onClick={() => setForm((p) => ({ ...p, tripCode: generateTripCodeClient() }))}
            className="h-[44px] px-4 rounded-[10px] text-[13px] font-medium border border-[#D0E2F3] text-[#6B7C93] hover:border-[#0C447C] hover:text-[#0C447C] transition-colors"
          >
            Regenerate
          </button>
        </div>
        {fieldErrors.tripCode && (
          <p className="text-[12px] text-[#D63B3B] mt-1">{fieldErrors.tripCode[0]}</p>
        )}
      </div>

      {/* ── SPECIAL NOTES ────────────────────────────────────────────────── */}
      <div>
        <label className="block text-[13px] font-medium text-[#6B7C93] mb-2">
          Special notes
          <span className="text-[12px] font-normal ml-1">(optional)</span>
        </label>
        <textarea
          rows={3}
          maxLength={500}
          value={form.specialNotes}
          onChange={(e) => setForm((p) => ({ ...p, specialNotes: e.target.value }))}
          placeholder="e.g. Corporate event, birthday celebration, sunset route"
          className="w-full px-4 py-3 rounded-[10px] text-[15px] resize-none border border-[#D0E2F3] text-[#0D1B2A] bg-white placeholder:text-[#6B7C93] focus:outline-none focus:ring-2 focus:ring-[#0C447C] focus:border-transparent"
        />
        <div className="flex justify-end mt-1">
          <span
            className={cn(
              'text-[11px]',
              form.specialNotes.length > 450 ? 'text-[#E8593C]' : 'text-[#6B7C93]',
            )}
          >
            {form.specialNotes.length} / 500
          </span>
        </div>
      </div>

      {/* ── GLOBAL ERROR ─────────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-[12px] bg-[#FDEAEA] border border-[#D63B3B]/20">
          <p className="text-[14px] text-[#D63B3B] font-medium">{error}</p>
        </div>
      )}

      {/* ── SUBMIT ───────────────────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={isPending || !form.boatId || !form.tripDate}
        className={cn(
          'w-full h-[52px] rounded-[12px] font-semibold text-[16px]',
          'transition-all duration-150 flex items-center justify-center gap-2',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          'bg-[#0C447C] text-white hover:bg-[#093a6b]',
        )}
      >
        {isPending ? <AnchorLoader size="sm" color="white" /> : <>Generate trip link →</>}
      </button>
    </form>
  )
}

// ─── Client-side trip code generator ─────────────────────────────────────────
// tokens.ts is server-only; this lightweight version is for UI feedback only.
// The server regenerates securely on submission.
function generateTripCodeClient(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 4 }, () =>
    chars[Math.floor(Math.random() * chars.length)]!,
  ).join('')
}
