import { formatCurrency } from "@/lib/utils/format";
import type { DashboardStats } from "@/types";

// Mono micro-label shown beneath a stat value to explain an empty state
function MicroLabel({ text }: { text: string }) {
  return (
    <span
      className="mono"
      style={{
        display: "block",
        fontSize: 9,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "var(--color-ink-muted)",
        marginTop: 4,
        lineHeight: 1.4,
      }}
    >
      {text}
    </span>
  );
}

export function DashboardStatsRow({ stats }: { stats: DashboardStats }) {
  const hasCompletedTrips = stats.completedTripsThisMonth > 0;

  const items = [
    {
      label: "Trips this month",
      value: stats.bookingsThisMonth.toString(),
      microLabel: stats.bookingsThisMonth === 0 ? "No trips yet this month" : undefined,
    },
    {
      label: "Add-on revenue",
      value:
        stats.addonRevenueThisMonthCents === 0 && !hasCompletedTrips
          ? " "
          : formatCurrency(stats.addonRevenueThisMonthCents),
      microLabel:
        stats.addonRevenueThisMonthCents === 0 && !hasCompletedTrips
          ? "Unlocks after first completed trip"
          : undefined,
    },
    {
      label: "Avg rating",
      value: stats.averageRating ? stats.averageRating.toString() : " ",
      unit: stats.averageRating ? "/5" : undefined,
      microLabel: !stats.averageRating ? "Shown after first review" : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-3" style={{ gap: "var(--s-2)" }}>
      {items.map((item) => (
        <div key={item.label} className="kpi">
          <span className="kpi-label">
            {item.label}
          </span>
          {/* Fraunces display value */}
          <div
            className="kpi-value"
            style={{ fontSize: "var(--t-card)", marginTop: "var(--s-1)" }}
          >
            {item.value}
            {item.unit && (
              <span className="unit">{item.unit}</span>
            )}
          </div>
          {/* Contextual micro-label for empty states */}
          {item.microLabel && <MicroLabel text={item.microLabel} />}
        </div>
      ))}
    </div>
  );
}
