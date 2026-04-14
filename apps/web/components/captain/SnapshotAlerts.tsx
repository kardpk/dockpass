import { cn } from '@/lib/utils/cn'

interface Alerts {
  nonSwimmers: number
  children: number
  childrenUnder6: number
  seasicknessProne: number
  dietary: { name: string; requirement: string }[]
}

export function SnapshotAlerts({ alerts }: { alerts: Alerts }) {
  const hasAlerts =
    alerts.nonSwimmers > 0 ||
    alerts.childrenUnder6 > 0 ||
    alerts.children > 0 ||
    alerts.seasicknessProne > 0 ||
    alerts.dietary.length > 0

  if (!hasAlerts) return null

  return (
    <div className="space-y-3">
      {/* ── FWC §327.33 Under-6 PFD Compliance Alert ────────────────────────── */}
      {/* This is the highest-priority alert: federal + state law, immediate safety */}
      {alerts.childrenUnder6 > 0 && (
        <div
          className={cn(
            'relative overflow-hidden rounded-[16px] p-5',
            'bg-gradient-to-r from-[#DC2626] to-[#991B1B]',
            'border-2 border-[#FCA5A5]',
            'shadow-[0_0_20px_rgba(220,38,38,0.3)]',
          )}
        >
          {/* Pulsing border animation */}
          <div className="absolute inset-0 rounded-[16px] border-2 border-white/30 animate-pulse pointer-events-none" />

          <div className="relative">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-[28px] flex-shrink-0 animate-bounce">🚨</span>
              <div>
                <p className="text-[15px] font-extrabold text-white uppercase tracking-wider">
                  Compliance Alert — PFD Required
                </p>
                <p className="text-[13px] font-bold text-white/90 mt-0.5">
                  {alerts.childrenUnder6} child{alerts.childrenUnder6 !== 1 ? 'ren' : ''} under 6 onboard
                </p>
              </div>
            </div>

            <div className="bg-white/15 backdrop-blur-sm rounded-[12px] p-3 border border-white/20">
              <p className="text-[13px] text-white leading-relaxed font-medium">
                <strong>FWC Law (§327.33):</strong> Children under 6 must wear a USCG-approved
                Type I, II, or III PFD <strong>at all times</strong> while this vessel is underway
                on boats under 26ft. Verify life jackets are properly fitted{' '}
                <strong>BEFORE departure.</strong>
              </p>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#FCA5A5] animate-ping" />
              <p className="text-[11px] text-white/80 font-semibold uppercase tracking-wider">
                DO NOT DEPART until PFDs are secured
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Standard Passenger Alerts ────────────────────────────────────────── */}
      <div className="
        bg-[#FDEAEA] rounded-[16px] p-4
        border border-[#E8593C] border-opacity-20
      ">
        <p className="text-[13px] font-bold text-[#E8593C] mb-3 uppercase tracking-wide">
          ⚠️ Passenger alerts
        </p>
        <div className="space-y-2">
          {alerts.nonSwimmers > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[18px]">🏊</span>
              <span className="text-[14px] font-medium text-[#0D1B2A]">
                {alerts.nonSwimmers} non-swimmer{alerts.nonSwimmers !== 1 ? 's' : ''}
                {' '}— life jacket required at all times
              </span>
            </div>
          )}
          {alerts.children > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[18px]">👶</span>
              <span className="text-[14px] font-medium text-[#0D1B2A]">
                {alerts.children} minor{alerts.children !== 1 ? 's' : ''} (under 18) onboard
              </span>
            </div>
          )}
          {alerts.seasicknessProne > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[18px]">💊</span>
              <span className="text-[14px] font-medium text-[#0D1B2A]">
                {alerts.seasicknessProne} seasickness prone
              </span>
            </div>
          )}
          {alerts.dietary.map((d, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-[18px]">🥜</span>
              <span className="text-[14px] text-[#0D1B2A]">
                <strong>{d.name}:</strong> {d.requirement}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
