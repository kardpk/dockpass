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

  return (
    <div
      className="tile"
      style={{ margin: '0 var(--s-4)', marginTop: 'var(--s-3)' }}
    >
      <span
        className="font-mono"
        style={{
          fontSize: '11px', fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase' as const,
          color: 'var(--color-ink-muted)',
          display: 'block',
          marginBottom: 'var(--s-3)',
        }}
      >
        {tr.weather}
      </span>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)', marginBottom: 'var(--s-3)' }}>
        <div
          style={{
            width: 44, height: 44,
            borderRadius: 'var(--r-1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px',
            backgroundColor: weather.bgColor,
          }}
        >
          {weather.icon}
        </div>
        <div>
          <p style={{ fontSize: 'var(--t-body-md)', fontWeight: 700, color: 'var(--color-ink)' }}>
            {weather.label}
          </p>
          <p className="font-mono" style={{ fontSize: '12px', color: 'var(--color-ink-muted)', marginTop: 2 }}>
            {tr.feels} {weather.temperature}°F
          </p>
        </div>
      </div>

      {/* Details row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--s-2)', marginBottom: 'var(--s-3)' }}>
        {[
          { Icon: Thermometer, label: `${weather.temperature}°F`, sublabel: 'High' },
          { Icon: Wind, label: `${weather.windspeed} mph`, sublabel: tr.wind },
          { Icon: CloudRain, label: `${weather.precipitation}mm`, sublabel: 'Rain' },
        ].map((item) => (
          <div
            key={item.sublabel}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 2,
              background: 'var(--color-bone)',
              borderRadius: 'var(--r-1)',
              padding: 'var(--s-2) var(--s-2)',
            }}
          >
            <item.Icon size={15} strokeWidth={2} style={{ color: 'var(--color-ink-muted)' }} />
            <span className="font-mono" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-ink)' }}>
              {item.label}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--color-ink-muted)' }}>
              {item.sublabel}
            </span>
          </div>
        ))}
      </div>

      {/* Condition banner */}
      <div
        style={{
          padding: 'var(--s-2) var(--s-3)',
          borderRadius: 'var(--r-1)',
          fontSize: 'var(--t-body-sm)',
          fontWeight: 600,
          backgroundColor: weather.bgColor,
          color: weather.color,
        }}
      >
        {message}
      </div>
    </div>
  )
}
