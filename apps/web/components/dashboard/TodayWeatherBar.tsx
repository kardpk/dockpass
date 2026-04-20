import { CloudSun, CloudRain, CloudLightning, AlertTriangle, Wind, ChevronRight } from "lucide-react";
import { evaluateWeatherAlert } from "@/lib/weather/alertRules";
import type { WeatherData } from "@/lib/trip/getWeatherData";

interface TodayWeatherBarProps {
  weather: WeatherData;
  boatName: string;
  tripId: string;
}

const weatherIcons: Record<string, typeof CloudSun> = {
  fair:      CloudRain,
  marginal:  CloudRain,
  poor:      CloudLightning,
  dangerous: AlertTriangle,
};

export function TodayWeatherBar({
  weather,
  boatName,
  tripId,
}: TodayWeatherBarProps) {
  const alert = evaluateWeatherAlert(weather);

  if (!alert.shouldAlert) return null;

  const Icon = weatherIcons[alert.severity] ?? CloudSun;

  // Background + accent colors by severity
  const palette =
    alert.severity === "dangerous"
      ? { bg: "rgba(235,87,87,0.10)", border: "rgba(235,87,87,0.35)", stripe: "#EB5757", icon: "#EB5757", text: "#C0392B" }
      : alert.severity === "poor"
      ? { bg: "rgba(232,89,60,0.09)", border: "rgba(232,89,60,0.3)", stripe: "#E8593C", icon: "#E8593C", text: "#C04A2E" }
      : { bg: "rgba(242,178,35,0.10)", border: "rgba(242,178,35,0.3)", stripe: "#F2B223", icon: "#B8860B", text: "#7A5A00" };

  return (
    <a
      href={`/dashboard/trips/${tripId}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 18px",
        background: palette.bg,
        border: `1.5px solid ${palette.border}`,
        borderLeft: `4px solid ${palette.stripe}`,
        borderRadius: "var(--r-1)",
        textDecoration: "none",
        cursor: "pointer",
      }}
    >
      {/* Icon */}
      <Icon
        size={22}
        strokeWidth={1.8}
        style={{ color: palette.icon, flexShrink: 0 }}
        aria-hidden="true"
      />

      {/* Text block — full hierarchy */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Headline — large, legible, bold */}
        <p style={{
          fontFamily: "var(--font-body)",
          fontSize: 15,
          fontWeight: 700,
          color: "var(--color-ink)",
          margin: 0,
          lineHeight: 1.2,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {alert.headline} — {boatName}
        </p>

        {/* Detail line — readable, not tiny */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 4,
        }}>
          <Wind size={11} strokeWidth={2} style={{ color: palette.text, flexShrink: 0 }} aria-hidden="true" />
          <p style={{
            fontFamily: "var(--mono)",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--color-ink-muted)",
            margin: 0,
            letterSpacing: "0.03em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {weather.label} · {weather.windspeed} mph wind
          </p>
        </div>
      </div>

      {/* Chevron */}
      <ChevronRight
        size={16}
        strokeWidth={2}
        style={{ color: "var(--color-ink-muted)", flexShrink: 0 }}
        aria-hidden="true"
      />
    </a>
  );
}
