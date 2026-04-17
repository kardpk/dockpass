"use client";

import { Anchor } from "lucide-react";
import { NotificationBell } from "@/components/dashboard/NotificationBell";

interface TopBarProps {
  operatorName: string;
  operatorId: string;
}

export function TopBar({ operatorName, operatorId }: TopBarProps) {
  const initials = operatorName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: "var(--color-ink)",
        borderBottom: "1px solid rgba(244, 239, 230, 0.1)",
      }}
    >
      <div
        className="max-w-[768px] mx-auto flex items-center justify-between"
        style={{ padding: "14px var(--s-4)" }}
      >
        {/* Brand — Anchor icon + Fraunces wordmark */}
        <div className="flex items-center" style={{ gap: "var(--s-3)" }}>
          <div
            className="avatar avatar--sm flex items-center justify-center"
            style={{
              borderColor: "var(--color-brass)",
              background: "transparent",
              color: "var(--color-brass)",
              width: "30px",
              height: "30px",
            }}
          >
            <Anchor size={14} strokeWidth={2} />
          </div>
          <span
            className="font-display"
            style={{
              fontSize: "var(--t-tile)",
              fontWeight: 500,
              color: "var(--color-bone)",
              letterSpacing: "-0.02em",
            }}
          >
            Boatcheckin
          </span>
        </div>

        {/* Right side: notification bell + avatar */}
        <div className="flex items-center" style={{ gap: "var(--s-3)" }}>
          <NotificationBell operatorId={operatorId} />
          {/* Operator initials avatar */}
          <div
            className="avatar avatar--sm"
            style={{
              background: "rgba(244, 239, 230, 0.12)",
              borderColor: "rgba(244, 239, 230, 0.25)",
              color: "var(--color-bone)",
              fontSize: "var(--t-mono-sm)",
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              letterSpacing: "0.05em",
            }}
          >
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
