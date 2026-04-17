import { requireOperator } from "@/lib/security/auth";
import { getDashboardHomeData } from "@/lib/dashboard/getDashboardData";
import { getWeatherData } from "@/lib/trip/getWeatherData";
import { DashboardGreeting } from "@/components/dashboard/DashboardGreeting";
import { TodayTripCard } from "@/components/dashboard/TodayTripCard";
import { TodayWeatherBar } from "@/components/dashboard/TodayWeatherBar";
import { DashboardStatsRow } from "@/components/dashboard/DashboardStatsRow";
import { UpcomingTripsList } from "@/components/dashboard/UpcomingTripsList";
import { EmptyDashboard } from "@/components/dashboard/EmptyDashboard";
import { Anchor } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import type { WeatherData } from "@/lib/trip/getWeatherData";

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

  // Fetch weather for today's trips (parallel)
  const weatherMap = new Map<string, WeatherData>();
  await Promise.all(
    data.todaysTrips.map(async (trip) => {
      if (trip.boat.lat && trip.boat.lng) {
        const w = await getWeatherData(
          trip.boat.lat,
          trip.boat.lng,
          trip.tripDate
        );
        if (w) weatherMap.set(trip.id, w);
      }
    })
  );

  return (
    <div style={{ padding: "var(--s-4)", display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
      {/* Greeting */}
      <DashboardGreeting
        operatorName={operator.full_name?.split(" ")[0] ?? ""}
        todayTripCount={data.todaysTrips.length}
      />

      {/* Today's charter(s) */}
      {data.todaysTrips.map((trip) => {
        const tripWeather = weatherMap.get(trip.id);
        return (
          <div key={trip.id} style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
            {tripWeather && (
              <TodayWeatherBar
                weather={tripWeather}
                boatName={trip.boat.boatName}
                tripId={trip.id}
              />
            )}
            <TodayTripCard trip={trip} />
          </div>
        );
      })}

      {/* Stats row */}
      <DashboardStatsRow stats={data.stats} />

      {/* Upcoming trips (next 7 days) */}
      {data.upcomingTrips.length > 0 && (
        <UpcomingTripsList trips={data.upcomingTrips} />
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
