import { Thermometer, Wind, CloudRain } from 'lucide-react'
import type { WeatherData } from '@/lib/trip/getWeatherData'
import type { TripT } from '@/lib/i18n/tripTranslations'

interface WeatherWidgetProps {
  weather: WeatherData
  tripDate: string
  tr: TripT
}

const SEVERITY_MESSAGES: Record<WeatherData['severity'], keyof TripT> = {
  good: 'weatherGood',
  fair: 'weatherFair',
  poor: 'weatherPoor',
  dangerous: 'weatherDangerous',
}

export function WeatherWidget({ weather, tr }: WeatherWidgetProps) {
  const messageKey = SEVERITY_MESSAGES[weather.severity]
  const message = tr[messageKey] as string
  const isGood = weather.severity === 'good'
  const isDangerous = weather.severity === 'dangerous'

  return (
    <div
      className="tile"
      style={{
        margin: '0 var(--s-4)', marginTop: 'var(--s-3)',
        padding: 'var(--s-3) var(--s-4)',
      }}
    >
      {/* Top row: condition + stats inline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)', marginBottom: 'var(--s-2)' }}>
        {/* Condition label */}
        <div style={{ flex: 1 }}>
          <span
            className="font-mono"
            style={{
              fontSize: '10px', fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase' as const,
              color: 'var(--color-ink-muted)',
              display: 'block',
              marginBottom: 2,
            }}
          >
            Weather
          </span>
          <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-ink)', lineHeight: 1.2 }}>
            {weather.label}
          </p>
        </div>

        {/* Compact stats */}
        <div style={{ display: 'flex', gap: 'var(--s-3)' }}>
          <Stat Icon={Thermometer} value={`${weather.temperature}°`} />
          <Stat Icon={Wind} value={`${weather.windspeed}mph`} />
          <Stat Icon={CloudRain} value={`${weather.precipitation}mm`} />
        </div>
      </div>

      {/* Condition banner — tight */}
      <div
        style={{
          padding: '6px var(--s-3)',
          borderRadius: 'var(--r-1)',
          fontSize: '13px',
          fontWeight: 600,
          backgroundColor: isDangerous ? 'var(--color-status-err-soft)' : isGood ? 'var(--color-status-ok-soft)' : weather.bgColor,
          color: isDangerous ? 'var(--color-status-err)' : isGood ? 'var(--color-status-ok)' : weather.color,
        }}
      >
        {message}
      </div>
    </div>
  )
}

function Stat({ Icon, value }: { Icon: typeof Thermometer; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <Icon size={13} strokeWidth={2} style={{ color: 'var(--color-ink-muted)' }} />
      <span className="font-mono" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-ink)' }}>
        {value}
      </span>
    </div>
  )
}
