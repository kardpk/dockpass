"use client";

import { useState } from "react";
import Link from "next/link";
import { TriangleAlert, X } from "lucide-react";

interface ReadinessCheck {
  label: string;
  ok: boolean;
  warnLabel: string;
  step: number;
}

interface TripReadinessModalProps {
  boatId: string;
  readinessScore: number;
  totalChecks: number;
  readinessChecks: ReadinessCheck[];
}

export function TripReadinessModal({
  boatId,
  readinessScore,
  totalChecks,
  readinessChecks,
}: TripReadinessModalProps) {
  const [open, setOpen] = useState(false);
  const isFullyReady = readinessScore >= totalChecks;

  // If boat is fully configured, behave as a normal link with no modal
  if (isFullyReady) {
    return (
      <Link
        href={`/dashboard/trips/new?boat=${boatId}`}
        className="btn btn--ink"
        style={{ flex: 1, justifyContent: "center", height: 48, fontSize: "var(--t-body-sm)", fontWeight: 500 }}
      >
        Create trip →
      </Link>
    );
  }

  const pendingChecks = readinessChecks.filter((c) => !c.ok);
  // Deep-link to the first failing step
  const firstFailingStep = pendingChecks[0]?.step ?? 1;

  return (
    <>
      {/* CTA button — opens modal */}
      <button
        onClick={() => setOpen(true)}
        className="btn btn--ink"
        style={{ flex: 1, justifyContent: "center", height: 48, fontSize: "var(--t-body-sm)", fontWeight: 500 }}
      >
        Create trip →
      </button>

      {/* Backdrop */}
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "rgba(11,30,45,0.55)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Bottom sheet modal */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 201,
          background: "var(--color-paper)",
          borderTop: "2px solid var(--color-ink)",
          padding: "var(--s-6) var(--s-5) calc(var(--s-6) + 56px)", // 56px for bottom nav
          maxWidth: 640,
          marginInline: "auto",
          transform: open ? "translateY(0)" : "translateY(110%)",
          transition: "transform 320ms cubic-bezier(0.4,0,0.2,1)",
          pointerEvents: open ? "auto" : "none",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Trip readiness check"
      >
        {/* Close */}
        <button
          onClick={() => setOpen(false)}
          style={{
            position: "absolute",
            top: "var(--s-4)",
            right: "var(--s-4)",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--color-ink-muted)",
            padding: 4,
          }}
          aria-label="Close"
        >
          <X size={18} strokeWidth={2} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: "var(--s-4)" }}>
          <p
            className="mono"
            style={{
              fontSize: "var(--t-mono-xs)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--color-status-warn)",
              marginBottom: "var(--s-1)",
            }}
          >
            Trip readiness · {readinessScore}/{totalChecks}
          </p>
          <h2
            className="font-display"
            style={{
              fontSize: "var(--t-tile)",
              fontWeight: 600,
              letterSpacing: "-0.015em",
              color: "var(--color-ink)",
              lineHeight: 1.15,
            }}
          >
            A few things need attention
          </h2>
        </div>

        {/* Pending items */}
        <div
          style={{
            borderTop: "1px solid var(--color-line-soft)",
            marginBottom: "var(--s-5)",
          }}
        >
          {pendingChecks.map((check) => (
            <div
              key={check.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--s-3)",
                padding: "var(--s-3) 0",
                borderBottom: "1px solid var(--color-line-soft)",
              }}
            >
              <TriangleAlert
                size={14}
                strokeWidth={1.75}
                style={{ color: "var(--color-status-warn)", flexShrink: 0 }}
              />
              <span
                style={{
                  fontSize: "var(--t-body-sm)",
                  color: "var(--color-status-warn)",
                  fontWeight: 500,
                }}
              >
                {check.warnLabel}
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
          <Link
            href={`/dashboard/boats/${boatId}/edit?step=${firstFailingStep}`}
            className="btn btn--rust"
            style={{ justifyContent: "center", height: 48, fontWeight: 500 }}
            onClick={() => setOpen(false)}
          >
            Finish setup first →
          </Link>
          <Link
            href={`/dashboard/trips/new?boat=${boatId}`}
            className="btn btn--ghost"
            style={{ justifyContent: "center", height: 44, fontSize: "var(--t-body-sm)", color: "var(--color-ink-muted)" }}
            onClick={() => setOpen(false)}
          >
            Create trip anyway
          </Link>
        </div>
      </div>
    </>
  );
}
