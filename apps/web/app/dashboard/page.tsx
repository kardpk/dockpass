import { Suspense } from "react";
import { requireOperator } from "@/lib/security/auth";
import { getDashboardHomeData } from "@/lib/dashboard/getDashboardData";
import { DashboardGreeting } from "@/components/dashboard/DashboardGreeting";
import { TodayTripCard } from "@/components/dashboard/TodayTripCard";
import { TodayWeatherBarAsync } from "@/components/dashboard/TodayWeatherBarAsync";
import { DashboardStatsRow } from "@/components/dashboard/DashboardStatsRow";
import { UpcomingTripsList } from "@/components/dashboard/UpcomingTripsList";
import { EmptyDashboard } from "@/components/dashboard/EmptyDashboard";
import { ShimmerLine } from "@/components/dashboard/TabSkeleton";
import { Anchor } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard — BoatCheckin" };

export default async function DashboardPage() {
  const { operator } = await requireOperator();
  const data = await getDashboardHomeData(operator.id);

  // No boats yet — show setup prompt
  if (!data.hasBoats) {
    return (
      <EmptyDashboard
        operatorName={operator.full_name?.split(" ")[0] ?? "there"}
      />
    );
  }

  return (
    <div style={{ padding: "var(--s-4)", display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
      {/* Greeting */}
      <DashboardGreeting
        operatorName={operator.full_name?.split(" ")[0] ?? ""}
        todayTripCount={data.todaysTrips.length}
      />

      {/* Today's charter(s) — weather streams in via Suspense */}
      {data.todaysTrips.map((trip) => (
        <div key={trip.id} style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
          {trip.boat.lat && trip.boat.lng && (
            <Suspense fallback={<ShimmerLine width="100%" height={40} style={{ borderRadius: 'var(--r-2)' }} />}>
              <TodayWeatherBarAsync
                tripId={trip.id}
                boatName={trip.boat.boatName}
                lat={trip.boat.lat}
                lng={trip.boat.lng}
                tripDate={trip.tripDate}
              />
            </Suspense>
          )}
          <TodayTripCard trip={trip} />
        </div>
      ))}

      {/* Stats row */}
      <DashboardStatsRow stats={data.stats} />

      {/* Upcoming trips (next 7 days) */}
      {data.upcomingTrips.length > 0 ? (
        <UpcomingTripsList trips={data.upcomingTrips} />
      ) : (
        /* Coming Up — empty state: dashed placeholder so the section doesn't just disappear */
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
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
          <Link
            href="/dashboard/trips/new"
            className="tile"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "var(--s-5)",
              borderStyle: "dashed",
              textDecoration: "none",
              gap: "var(--s-3)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)" }}>
              <Anchor size={18} strokeWidth={1.5} style={{ color: "var(--color-ink-muted)", flexShrink: 0 }} />
              <span style={{ fontSize: "var(--t-body-sm)", color: "var(--color-ink-muted)" }}>
                No trips scheduled
              </span>
            </div>
            <span
              className="mono"
              style={{
                fontSize: "var(--t-mono-xs)",
                color: "var(--color-rust)",
                letterSpacing: "0.08em",
                whiteSpace: "nowrap" as const,
              }}
            >
              Create your first trip →
            </span>
          </Link>
        </div>
      )}

      {/* No trips at all — create nudge */}
      {!data.hasTrips && (
        <div
          className="tile text-center"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "var(--s-10)",
            gap: "var(--s-3)",
            borderStyle: "dashed",
          }}
        >
          <Anchor size={28} strokeWidth={1.5} style={{ color: "var(--color-ink-muted)" }} aria-hidden="true" />
          <p style={{ fontSize: "var(--t-body-md)", color: "var(--color-ink-muted)", margin: 0 }}>
            No trips created yet.
          </p>
          <Link
            href="/dashboard/trips/new"
            className="btn btn--rust"
          >
            Create your first trip
          </Link>
        </div>
      )}
    </div>
  );
}
