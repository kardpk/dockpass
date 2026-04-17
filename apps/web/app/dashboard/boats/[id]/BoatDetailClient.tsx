"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface BoatDetailClientProps {
  rules: string[];
  dos: string[];
  donts: string[];
}

const PREVIEW_COUNT = 4;

export function BoatDetailClient({ rules, dos, donts }: BoatDetailClientProps) {
  const [expanded, setExpanded] = useState(false);

  const visibleRules = expanded ? rules : rules.slice(0, PREVIEW_COUNT);
  const hasMore = rules.length > PREVIEW_COUNT;

  return (
    <div className="tile" style={{ padding: 0, overflow: "hidden" }}>
      {/* Standard rules */}
      {visibleRules.length > 0 && (
        <div style={{ padding: "var(--s-3) var(--s-4)", display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
          {visibleRules.map((rule, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "var(--s-2)",
                paddingBottom: i < visibleRules.length - 1 ? "var(--s-2)" : 0,
                borderBottom: i < visibleRules.length - 1 ? "1px solid var(--color-line-soft)" : "none",
              }}
            >
              {/* Brass dot — clean, non-numbered */}
              <span
                aria-hidden="true"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--color-brass)",
                  flexShrink: 0,
                  marginTop: 7,
                }}
              />
              <p style={{ fontSize: "var(--t-body-sm)", color: "var(--color-ink)", lineHeight: 1.5, flex: 1 }}>
                {rule}
              </p>
            </div>
          ))}

        </div>
      )}

      {/* Show more toggle */}
      {hasMore && (
        <>
          <div style={{ height: 1, background: "var(--color-line-soft)" }} />
          <button
            onClick={() => setExpanded((p) => !p)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "var(--s-1)",
              padding: "var(--s-3)",
              background: "var(--color-bone)",
              border: "none",
              cursor: "pointer",
              fontSize: "var(--t-body-sm)",
              color: "var(--color-ink-muted)",
              fontWeight: 500,
            }}
          >
            {expanded ? (
              <>Show fewer rules <ChevronUp size={14} strokeWidth={2} /></>
            ) : (
              <>Show all {rules.length} rules <ChevronDown size={14} strokeWidth={2} /></>
            )}
          </button>
        </>
      )}

      {/* DOs */}
      {dos.length > 0 && (
        <>
          <div style={{ height: 1, background: "var(--color-line-soft)" }} />
          <div style={{ padding: "var(--s-3) var(--s-4)" }}>
            <p
              className="mono"
              style={{
                fontSize: "var(--t-mono-xs)",
                color: "var(--color-status-ok)",
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                marginBottom: "var(--s-2)",
              }}
            >
              DOs
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-2)" }}>
              {dos.map((item, i) => (
                <span key={i} className="pill pill--ok" style={{ fontSize: "var(--t-body-sm)" }}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      {/* DON'Ts */}
      {donts.length > 0 && (
        <>
          <div style={{ height: 1, background: "var(--color-line-soft)" }} />
          <div style={{ padding: "var(--s-3) var(--s-4)" }}>
            <p
              className="mono"
              style={{
                fontSize: "var(--t-mono-xs)",
                color: "var(--color-status-err)",
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                marginBottom: "var(--s-2)",
              }}
            >
              DON&apos;Ts
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-2)" }}>
              {donts.map((item, i) => (
                <span key={i} className="pill pill--err" style={{ fontSize: "var(--t-body-sm)" }}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
