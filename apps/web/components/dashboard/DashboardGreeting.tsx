import { Ship, Sun, Moon } from "lucide-react";

export function DashboardGreeting({
  operatorName,
  todayTripCount,
}: {
  operatorName: string;
  todayTripCount: number;
}) {
  const { text, Icon } = getGreeting();

  return (
    <div style={{ paddingTop: "var(--s-1)" }}>
      {/* Mono eyebrow */}
      <span
        className="mono"
        style={{
          fontSize: "var(--t-mono-sm)",
          letterSpacing: "0.15em",
          textTransform: "uppercase" as const,
          color: "var(--color-ink-muted)",
          display: "block",
          marginBottom: "var(--s-1)",
        }}
      >
        <Icon size={11} strokeWidth={2} style={{ display: "inline", marginRight: "4px", verticalAlign: "middle" }} />
        {text}
      </span>

      {/* Fraunces display heading */}
      <h1
        className="font-display"
        style={{
          fontSize: "var(--t-card)",
          fontWeight: 500,
          letterSpacing: "-0.025em",
          color: "var(--color-ink)",
          lineHeight: 1.15,
          margin: 0,
        }}
      >
        {operatorName}
      </h1>

      {/* Sub-line */}
      <p
        style={{
          marginTop: "var(--s-1)",
          fontSize: "var(--t-body-md)",
          color: "var(--color-ink-muted)",
          fontFamily: "var(--font-body)",
        }}
      >
        {todayTripCount === 0
          ? "No charters today."
          : todayTripCount === 1
          ? "1 charter today."
          : `${todayTripCount} charters today.`}
      </p>
    </div>
  );
}

function getGreeting(): { text: string; Icon: typeof Ship } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good morning", Icon: Sun };
  if (hour < 17) return { text: "Good afternoon", Icon: Ship };
  return { text: "Good evening", Icon: Moon };
}
