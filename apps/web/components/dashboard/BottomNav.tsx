"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Ship, Anchor, Users, Settings, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const tabs = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/dashboard/boats", icon: Ship, label: "Boats" },
  { href: "/dashboard/trips", icon: Anchor, label: "Trips" },
  { href: "/dashboard/captains", icon: Users, label: "Crew" },
  { href: "/dashboard/settings", icon: Settings, label: "More" },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const isTripsRoot = pathname === "/dashboard/trips";

  return (
    <>
      {/* ── FAB: create new trip (trips page only) ── */}
      {isTripsRoot && (
        <Link
          href="/dashboard/trips/new"
          className="fixed bottom-[72px] right-5 z-50 flex items-center justify-center"
          style={{
            width: "52px",
            height: "52px",
            background: "var(--color-rust)",
            border: "var(--border-w) solid var(--color-rust)",
            borderRadius: "var(--r-1)", /* sharp — not pill-shaped per R5 */
            color: "var(--color-bone)",
            boxShadow: "var(--shadow-float)",
            transition: "background var(--dur-fast) var(--ease)",
          }}
          aria-label="Create new trip"
        >
          <Plus size={22} strokeWidth={2.5} />
        </Link>
      )}

      {/* ── Bottom nav bar ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: "var(--color-paper)",
          borderTop: "var(--border-w) solid var(--color-line-soft)",
        }}
      >
        <div
          className="max-w-[768px] mx-auto flex"
          style={{
            height: "56px",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          {tabs.map((tab) => {
            const isActive =
              tab.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(tab.href);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center",
                  "transition-colors"
                )}
                style={{
                  gap: "3px",
                  /* Active: rust color per §12.2 */
                  color: isActive
                    ? "var(--color-rust)"
                    : "var(--color-ink-muted)",
                  /* Active left-border is only practical for sidebar, not bottom nav
                     — use color + font weight as the active signal here */
                }}
              >
                <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span
                  className="font-mono"
                  style={{
                    fontSize: "var(--t-mono-xs)",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
