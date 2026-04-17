import Link from "next/link";
import { MapPin, ChevronRight } from "lucide-react";
import { formatTripDate, formatTime } from "@/lib/utils/format";
import type { OperatorTripDetail } from "@/types";

export function UpcomingTripsList({ trips }: { trips: OperatorTripDetail[] }) {
  return (
    <div>
      {/* Section header */}
      <div
        className="flex items-center"
        style={{
          gap: "var(--s-3)",
          marginBottom: "var(--s-3)",
          paddingBottom: "var(--s-3)",
          borderBottom: "1.5px solid var(--color-ink)",
        }}
      >
        <span
          className="mono"
          style={{
            fontSize: "var(--t-mono-sm)",
            letterSpacing: "0.15em",
            textTransform: "uppercase" as const,
            color: "var(--color-ink-muted)",
            fontWeight: 600,
          }}
        >
          Coming up
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
        {trips.map((trip) => {
          const guestCount = trip.guests.length;
          const signed = trip.guests.filter((g) => g.waiverSigned).length;
          const dateObj = new Date(trip.tripDate + "T00:00:00");
          const dayNum = dateObj.getDate();
          const dayLabel = formatTripDate(trip.tripDate).split(",")[0];

          return (
            <Link
              key={trip.id}
              href={`/dashboard/trips/${trip.id}`}
              className="tile tile--hover"
              style={{ textDecoration: "none" }}
            >
              <div className="flex items-center" style={{ gap: "var(--s-4)" }}>
                {/* Date block — monospace */}
                <div
                  className="flex flex-col items-center justify-center flex-shrink-0"
                  style={{
                    width: "46px",
                    height: "46px",
                    border: "1.5px solid var(--color-line-soft)",
                    borderRadius: "var(--r-1)",
                    background: "var(--color-bone-warm)",
                  }}
                >
                  <span
                    className="mono"
                    style={{
                      fontSize: "var(--t-mono-xs)",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase" as const,
                      color: "var(--color-ink-muted)",
                      lineHeight: 1,
                    }}
                  >
                    {dayLabel}
                  </span>
                  <span
                    className="font-display"
                    style={{
                      fontSize: "var(--t-tile)",
                      fontWeight: 600,
                      color: "var(--color-ink)",
                      lineHeight: 1.1,
                    }}
                  >
                    {dayNum}
                  </span>
                </div>

                {/* Trip info */}
                <div className="flex-1 min-w-0">
                  <p
                    className="font-display truncate"
                    style={{ fontSize: "var(--t-tile)", fontWeight: 500, letterSpacing: "-0.02em", color: "var(--color-ink)", margin: 0 }}
                  >
                    {trip.boat.boatName}
                  </p>
                  <p
                    className="mono flex items-center"
                    style={{ fontSize: "var(--t-mono-sm)", color: "var(--color-ink-muted)", margin: "3px 0 0", gap: "var(--s-1)" }}
                  >
                    <MapPin size={11} strokeWidth={2} aria-hidden="true" />
                    {formatTime(trip.departureTime)} · {trip.boat.marinaName}
                  </p>
                </div>

                {/* Guest count */}
                <div className="text-right flex-shrink-0">
                  <p
                    className="font-display"
                    style={{ fontSize: "var(--t-tile)", fontWeight: 600, color: "var(--color-ink)", margin: 0 }}
                  >
                    {guestCount}
                    <span className="unit">/{trip.maxGuests}</span>
                  </p>
                  <p
                    className="mono"
                    style={{ fontSize: "var(--t-mono-xs)", color: "var(--color-ink-muted)", marginTop: "2px" }}
                  >
                    {signed} signed
                  </p>
                </div>

                <ChevronRight size={16} strokeWidth={2} aria-hidden="true" style={{ color: "var(--color-ink-muted)", flexShrink: 0 }} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
