import { requireOperator } from "@/lib/security/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { getToday } from "@/lib/utils/tripStatus";
import { Plus } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { DashTile, type TileStatus } from "@/components/ui/DashTile";

export const metadata: Metadata = { title: "Fleet — BoatCheckin" };

export default async function BoatsPage() {
  const { operator } = await requireOperator();
  const supabase = createServiceClient();

  const [boatsResult, tripsResult] = await Promise.all([
    supabase
      .from("boats")
      .select("id, boat_name, boat_type, charter_type, max_capacity, marina_name, slip_number, is_active, created_at")
      .eq("operator_id", operator.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),

    supabase
      .from("trips")
      .select("boat_id, status, trip_date")
      .eq("operator_id", operator.id)
      .in("status", ["upcoming", "active"])
      .gte("trip_date", getToday()),
  ]);

  const activeBoats = boatsResult.data ?? [];

  // Trip count per boat
  const tripsByBoat: Record<string, number> = {};
  for (const t of tripsResult.data ?? []) {
    tripsByBoat[t.boat_id] = (tripsByBoat[t.boat_id] ?? 0) + 1;
  }

  // KPI data
  const totalTripsThisWeek = (tripsResult.data ?? []).length;
  const boatsWithTrips = activeBoats.filter(b => (tripsByBoat[b.id] ?? 0) > 0).length;


  return (
    <div style={{ padding: 'var(--s-4)', display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}>

      {/* ── Page header ── */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 'var(--s-3)',
      }}>
        <div>
          <h1 style={{
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--color-ink)',
            margin: 0,
            lineHeight: 1.2,
          }}>
            Fleet
          </h1>
          {activeBoats.length > 0 && (
            <p className="font-mono" style={{
              fontSize: 'var(--t-mono-xs)',
              color: 'var(--color-ink-muted)',
              marginTop: 4,
              letterSpacing: '0.05em',
            }}>
              {activeBoats.length} vessel{activeBoats.length !== 1 ? 's' : ''}
              {boatsWithTrips > 0 && ` · ${boatsWithTrips} active`}
            </p>
          )}
        </div>
        <Link href="/dashboard/boats/new" className="btn btn--rust" style={{ flexShrink: 0 }}>
          <Plus size={14} strokeWidth={2.5} />
          Add boat
        </Link>
      </div>

      {/* ── KPI strip ── */}
      {activeBoats.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "var(--s-3)",
        }}>
          <DashTile
            variant="kpi"
            status="info"
            label="Total vessels"
            value={String(activeBoats.length)}
            sub="in your fleet"
          />
          <DashTile
            variant="kpi"
            status={totalTripsThisWeek > 0 ? "brass" : "grey"}
            label="Upcoming trips"
            value={String(totalTripsThisWeek)}
            sub="from today"
          />
          <DashTile
            variant="kpi"
            status={boatsWithTrips > 0 ? "ok" : "grey"}
            label="Active boats"
            value={String(boatsWithTrips)}
            sub="trips scheduled"
          />
        </div>
      )}

      {/* ── Fleet grid ── */}
      {activeBoats.length > 0 ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "var(--s-3)",
        }}>
          {activeBoats.map((boat) => {
            const tripCount = tripsByBoat[boat.id] ?? 0;

            const typeLabel = boat.boat_type
              ?.replace(/_/g, " ")
              .replace(/\b\w/g, (c: string) => c.toUpperCase()) ?? "Vessel";
            const charterLabel = boat.charter_type
              ?.replace(/_/g, " ")
              .replace(/\b\w/g, (c: string) => c.toUpperCase()) ?? "";

            const metaParts: string[] = [];
            if (boat.marina_name) {
              metaParts.push(boat.slip_number
                ? `Slip ${boat.slip_number}`
                : boat.marina_name);
            }
            if (boat.max_capacity) metaParts.push(`${boat.max_capacity} guests`);

            const status: TileStatus = tripCount > 0 ? "brass" : "grey";

            return (
              <DashTile
                key={boat.id}
                variant="vessel"
                status={status}
                eyebrow={`${typeLabel}${charterLabel ? ` · ${charterLabel}` : ""}`}
                title={boat.boat_name}
                meta={metaParts.join(" · ")}
                pill={{
                  label: tripCount > 0
                    ? `${tripCount} TRIP${tripCount !== 1 ? "S" : ""}`
                    : "NO TRIPS",
                }}
                href={`/dashboard/boats/${boat.id}`}
              />
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
          </Link>
        </div>
      )}
    </div>
  );
}
