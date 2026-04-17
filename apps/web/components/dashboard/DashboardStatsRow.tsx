import { Anchor, TrendingUp, Star } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import type { DashboardStats } from "@/types";

export function DashboardStatsRow({ stats }: { stats: DashboardStats }) {
  const items = [
    {
      label: "Charters this month",
      value: stats.bookingsThisMonth.toString(),
      icon: <Anchor size={14} strokeWidth={2} aria-hidden="true" />,
    },
    {
      label: "Add-on revenue",
      value: formatCurrency(stats.addonRevenueThisMonthCents),
      icon: <TrendingUp size={14} strokeWidth={2} aria-hidden="true" />,
    },
    {
      label: "Avg rating",
      value: stats.averageRating ? stats.averageRating.toString() : "—",
      unit: stats.averageRating ? "/5" : undefined,
      icon: <Star size={14} strokeWidth={2} aria-hidden="true" />,
    },
  ];

  return (
    <div className="grid grid-cols-3" style={{ gap: "var(--s-2)" }}>
      {items.map((item) => (
        <div key={item.label} className="kpi">
          {/* Mono icon + label */}
          <span className="kpi-label" style={{ display: "flex", alignItems: "center", gap: "var(--s-1)" }}>
            {item.icon}
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
        </div>
      ))}
    </div>
  );
}
