import { requireOperator } from "@/lib/security/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { getToday } from "@/lib/utils/tripStatus";
import { Plus, ChevronRight, ArrowRight, Calendar } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Fleet — BoatCheckin" };

export default async function BoatsPage() {
  const { operator } = await requireOperator();
  const supabase = createServiceClient();

  const { data: boats } = await supabase
    .from("boats")
    .select("id, boat_name, boat_type, charter_type, max_capacity, marina_name, slip_number, is_active, created_at")
    .eq("operator_id", operator.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const activeBoats = boats ?? [];

  let tripCountMap: Record<string, number> = {};
  if (activeBoats.length > 0) {
    const boatIds = activeBoats.map((b) => b.id);
    const { data: tripCounts } = await supabase
      .from("trips")
      .select("boat_id")
      .in("boat_id", boatIds)
      .in("status", ["upcoming", "active"])
      .gte("trip_date", getToday());

    if (tripCounts) {
      tripCountMap = tripCounts.reduce<Record<string, number>>((acc, t) => {
        acc[t.boat_id] = (acc[t.boat_id] ?? 0) + 1;
        return acc;
      }, {});
    }
  }

  return (
    <div style={{ maxWidth: 660, margin: "0 auto", padding: "var(--s-6) var(--s-5) 120px" }}>

      {/* ── Hover styles ── */}
      <style>{`
        .vessel-row {
          transition: background 140ms ease, border-color 140ms ease;
        }
        .vessel-row:hover {
          background: var(--color-bone) !important;
          border-color: var(--color-ink) !important;
        }
        .vessel-row:hover .vessel-caret {
          color: var(--color-rust) !important;
          transform: translateX(2px);
        }
        .vessel-caret {
          transition: color 140ms ease, transform 140ms ease;
        }
      `}</style>

      {/* ── Page header ── */}
      <div style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        marginBottom: "var(--s-8)",
        gap: "var(--s-4)",
      }}>
        <div>
          <h1
            className="font-display"
            style={{
              fontSize: "clamp(28px, 5vw, 36px)",
              fontWeight: 500,
              letterSpacing: "-0.03em",
              color: "var(--color-ink)",
              lineHeight: 1.0,
            }}
          >
            Your fleet
          </h1>
          {activeBoats.length > 0 && (
            <p
              className="font-mono"
              style={{
                fontSize: "var(--t-mono-xs)",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--color-ink-muted)",
                marginTop: 6,
              }}
            >
              {activeBoats.length} {activeBoats.length === 1 ? "vessel" : "vessels"}
            </p>
          )}
        </div>
        <Link href="/dashboard/boats/new" className="btn btn--rust" style={{ flexShrink: 0 }}>
          <Plus size={14} strokeWidth={2.5} />
          Add boat
        </Link>
      </div>

      {/* ── Fleet list ── */}
      {activeBoats.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
          {activeBoats.map((boat) => {
            const tripCount = tripCountMap[boat.id] ?? 0;

            // Build type label — title case, no underscores
            const typeLabel = boat.boat_type
              ?.replace(/_/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase()) ?? "Vessel";
            const charterLabel = boat.charter_type
              ?.replace(/_/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase()) ?? "";

            // Build the single meta string
            const metaParts: string[] = [];
            if (boat.marina_name) {
              metaParts.push(boat.slip_number
                ? `${boat.marina_name} · ${boat.slip_number}`
                : boat.marina_name);
            }
            if (boat.max_capacity) metaParts.push(`Up to ${boat.max_capacity} guests`);
            const metaLine = metaParts.join("  ·  ");

            return (
              <Link
                key={boat.id}
                href={`/dashboard/boats/${boat.id}`}
                className="vessel-row"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--s-4)",
                  padding: "18px 22px",
                  background: "var(--color-paper)",
                  border: "1.5px solid var(--color-line-soft)",
                  borderRadius: "var(--r-1)",
                  textDecoration: "none",
                  cursor: "pointer",
                  // Brass left stripe only when trips are scheduled
                  borderLeft: tripCount > 0
                    ? "4px solid var(--color-brass)"
                    : "1.5px solid var(--color-line-soft)",
                }}
              >
                {/* ── Info block ── */}
                <div style={{ flex: 1, minWidth: 0 }}>

                  {/* Eyebrow — type · charter */}
                  <div
                    className="font-mono"
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "var(--color-ink-muted)",
                      marginBottom: 4,
                    }}
                  >
                    {typeLabel}{charterLabel ? ` · ${charterLabel}` : ""}
                  </div>

                  {/* Vessel name — the hero element */}
                  <div
                    className="font-display"
                    style={{
                      fontSize: 22,
                      fontWeight: 500,
                      color: "var(--color-ink)",
                      lineHeight: 1.15,
                      letterSpacing: "-0.02em",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {boat.boat_name}
                  </div>

                  {/* Meta — single muted line */}
                  {metaLine && (
                    <div
                      className="font-mono"
                      style={{
                        fontSize: 12,
                        color: "var(--color-ink-muted)",
                        marginTop: 5,
                        letterSpacing: "0.02em",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {metaLine}
                    </div>
                  )}
                </div>

                {/* ── Right side: trip badge + caret ── */}
                <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)", flexShrink: 0 }}>
                  {tripCount > 0 && (
                    <span
                      className="font-mono"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        padding: "4px 10px",
                        borderRadius: "var(--r-pill)",
                        background: "var(--color-status-warn-soft)",
                        color: "var(--color-status-warn)",
                        border: "1px solid var(--color-status-warn)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Calendar size={10} strokeWidth={2.5} />
                      {tripCount} {tripCount === 1 ? "trip" : "trips"}
                    </span>
                  )}

                  <ChevronRight
                    size={16}
                    strokeWidth={2}
                    className="vessel-caret"
                    style={{ color: "var(--color-line)" }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* ── Empty state ── */
        <div
          className="tile"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            padding: "var(--s-16) var(--s-8)",
            gap: "var(--s-4)",
            borderStyle: "dashed",
          }}
        >
          <h2
            className="font-display"
            style={{
              fontSize: 24,
              fontWeight: 500,
              color: "var(--color-ink)",
              letterSpacing: "-0.02em",
            }}
          >
            No vessels yet
          </h2>
          <p style={{ fontSize: "var(--t-body-sm)", color: "var(--color-ink-muted)", maxWidth: 280, lineHeight: 1.6 }}>
            Set up your first boat to start creating trips and checking in guests.
          </p>
          <Link
            href="/dashboard/boats/new"
            className="btn btn--rust"
            style={{ marginTop: "var(--s-2)" }}
          >
            Set up my first boat
            <ArrowRight size={14} strokeWidth={2.5} />
          </Link>
        </div>
      )}
    </div>
  );
}
