import Link from "next/link";
import { Anchor, Ship, ArrowRight } from "lucide-react";

export function EmptyDashboard({ operatorName }: { operatorName: string }) {
  return (
    <div
      className="max-w-[640px] mx-auto text-center"
      style={{ padding: "var(--s-12) var(--s-4)" }}
    >
      {/* Anchor icon in a clean circle */}
      <div className="empty-state">
        <Anchor size={48} strokeWidth={1.5} className="empty-icon" aria-hidden="true" />

        <h1 className="font-display" style={{ fontSize: "var(--t-card)", fontWeight: 500, letterSpacing: "-0.025em", color: "var(--color-ink)", margin: 0 }}>
          Welcome aboard, {operatorName}.
        </h1>

        <p style={{ fontSize: "var(--t-body-md)", color: "var(--color-ink-muted)", maxWidth: "400px", lineHeight: 1.6, margin: 0 }}>
          Set up your boat profile to start creating trips and checking in guests.
        </p>

        <Link
          href="/dashboard/boats/new"
          className="btn btn--rust"
          style={{ marginTop: "var(--s-2)" }}
        >
          <Ship size={14} strokeWidth={2.5} aria-hidden="true" />
          Set up my first boat
          <ArrowRight size={14} strokeWidth={2.5} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
