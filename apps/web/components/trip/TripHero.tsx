import { formatTripDate, formatTime, formatDuration } from '@/lib/utils/format'
import { LanguageSelector } from './LanguageSelector'
import type { TripT } from '@/lib/i18n/tripTranslations'
import type { SupportedLang } from '@/lib/i18n/detect'

interface TripHeroProps {
  boatName: string
  tripDate: string
  departureTime: string
  durationHours: number
  marinaName: string
  charterType: 'captained' | 'bareboat' | 'both'
  currentLang: SupportedLang
  tr: TripT
}

export function TripHero({
  boatName,
  tripDate,
  departureTime,
  durationHours,
  marinaName,
  charterType,
  currentLang,
  tr,
}: TripHeroProps) {
  const chips = [
    { icon: '📅', label: formatTripDate(tripDate) },
    { icon: '⏰', label: formatTime(departureTime) },
    { icon: '⏳', label: formatDuration(durationHours) },
    { icon: '🚢', label: tr.charterType[charterType] },
  ]

  return (
    <section className="bg-[#0C447C] px-5 pt-5 pb-8">
      {/* Top row */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-white font-bold text-[17px] tracking-tight">
          BoatCheckin ⚓
        </span>
        <LanguageSelector currentLang={currentLang} />
      </div>

      {/* Boat name */}
      <h1 className="text-[28px] font-bold text-white tracking-tight leading-snug mb-4">
        {boatName}
      </h1>

      {/* Trip chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {chips.map((chip) => (
          <span
            key={chip.label}
            className="bg-white/20 text-white text-[13px] rounded-full px-3 py-1 flex items-center gap-1.5"
          >
            {chip.icon} {chip.label}
          </span>
        ))}
      </div>

      {/* Marina */}
      <p className="text-white/70 text-[13px]">📍 {marinaName}</p>
    </section>
  )
}
