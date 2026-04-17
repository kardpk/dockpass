"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { ContinueButton } from "@/components/ui/ContinueButton";
import { Plus, X, Package, ShoppingBag, Eye, EyeOff, Check } from "lucide-react";
import type { WizardData } from "../types";

interface Step6Props {
  data: WizardData;
  onNext: (partial: Partial<WizardData>) => void;
}

// ── Preset suggestions ──────────────────────────────────────────────────────
const BRING_SUGGESTIONS = [
  "Valid photo ID",
  "Reef-safe sunscreen",
  "Non-marking shoes",
  "Sunglasses",
  "Swimwear",
  "Light jacket",
  "Motion sickness remedy",
  "Towel",
  "Water bottle",
  "Hat",
  "Camera",
  "Cash or card",
];

const NOT_BRING_SUGGESTIONS = [
  "Glass bottles",
  "High heels",
  "Hard-sided luggage",
  "Drones",
  "Pets",
  "Sharp objects",
  "Illegal substances",
  "Glitter or confetti",
];

// ── Parse a block of text into individual items ──────────────────────────────
function parseToItems(text: string): string[] {
  if (!text) return [];
  return text
    .split("\n")
    .map((s) =>
      s
        .replace(/^[\d]+\.\s*/, "")
        .replace(/^[✓✗x\-*•]\s*/i, "")
        .trim()
    )
    .filter(Boolean);
}

// ── Serialize items back to newline text ──────────────────────────────────────
function itemsToText(items: string[]): string {
  return items.join("\n");
}

// ── Single tag-chip input panel ───────────────────────────────────────────────
interface TagPanelProps {
  id: string;
  label: string;
  sublabel: string;
  items: string[];
  suggestions: string[];
  variant: "bring" | "avoid";
  onChange: (items: string[]) => void;
}

function TagPanel({ id, label, sublabel, items, suggestions, variant, onChange }: TagPanelProps) {
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const chipBg = variant === "bring" ? "var(--color-ink)" : "var(--color-status-err)";
  const chipColor = "var(--color-paper)";

  const unusedSuggestions = suggestions.filter(
    (s) => !items.some((i) => i.toLowerCase() === s.toLowerCase())
  );

  function addItem(val: string) {
    const trimmed = val.trim();
    if (!trimmed) return;
    if (items.some((i) => i.toLowerCase() === trimmed.toLowerCase())) return;
    onChange([...items, trimmed]);
    setInputVal("");
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addItem(inputVal);
    } else if (e.key === "Backspace" && !inputVal && items.length > 0) {
      removeItem(items.length - 1);
    }
  }

  return (
    <div
      style={{
        background: "var(--color-paper)",
        border: "1px solid var(--color-line)",
        borderRadius: "var(--r-2)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "var(--s-4)",
          borderBottom: items.length > 0 || inputVal ? "1px solid var(--color-line-soft)" : "none",
          background: variant === "bring" ? "rgba(11,30,45,0.03)" : "rgba(180,60,60,0.03)",
        }}
      >
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--color-ink)",
            marginBottom: 2,
          }}
        >
          {label}
        </p>
        <p
          className="mono"
          style={{ fontSize: 11, color: "var(--color-ink-muted)", letterSpacing: "0.02em" }}
        >
          {sublabel}
        </p>
      </div>

      {/* Chip input area */}
      <div
        onClick={() => inputRef.current?.focus()}
        style={{
          padding: "var(--s-3) var(--s-4)",
          minHeight: 72,
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--s-1)",
          alignContent: "flex-start",
          cursor: "text",
        }}
      >
        {items.map((item, i) => (
          <span
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 10px",
              borderRadius: 9999,
              background: chipBg,
              color: chipColor,
              fontSize: 13,
              fontWeight: 500,
              lineHeight: 1.3,
              maxWidth: "100%",
              wordBreak: "break-word",
            }}
          >
            {item}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeItem(i); }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                color: "rgba(232,225,210,0.6)",
                flexShrink: 0,
              }}
              aria-label={`Remove ${item}`}
            >
              <X size={11} strokeWidth={2.5} />
            </button>
          </span>
        ))}

        {/* Inline text input */}
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addItem(inputVal)}
          placeholder={items.length === 0 ? "Type an item and press Enter…" : "Add more…"}
          style={{
            flex: "1 1 120px",
            minWidth: 80,
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 13,
            color: "var(--color-ink)",
            padding: "4px 2px",
          }}
        />
      </div>

      {/* Suggestions */}
      {unusedSuggestions.length > 0 && (
        <div
          style={{
            padding: "var(--s-2) var(--s-4) var(--s-3)",
            borderTop: "1px solid var(--color-line-soft)",
            background: "var(--color-bone)",
          }}
        >
          <p
            className="mono"
            style={{
              fontSize: 10,
              color: "var(--color-ink-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "var(--s-1)",
            }}
          >
            Quick add
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-1)" }}>
            {unusedSuggestions.slice(0, 8).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addItem(s)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "3px 10px",
                  borderRadius: 9999,
                  border: "1px solid var(--color-line)",
                  background: "var(--color-paper)",
                  color: "var(--color-ink-muted)",
                  fontSize: 12,
                  cursor: "pointer",
                  transition: "all 0.12s",
                }}
              >
                <Plus size={10} strokeWidth={2.5} />
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main step component ──────────────────────────────────────────────────────
export function Step6Packing({ data, onNext }: Step6Props) {
  const [bringItems, setBringItems] = useState<string[]>(parseToItems(data.whatToBring));
  const [avoidItems, setAvoidItems] = useState<string[]>(parseToItems(data.whatNotToBring));
  const [showPreview, setShowPreview] = useState(false);

  function handleContinue() {
    onNext({
      whatToBring: itemsToText(bringItems),
      whatNotToBring: itemsToText(avoidItems),
    });
  }

  const hasContent = bringItems.length > 0 || avoidItems.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-5)" }}>

      {/* Step intro */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", marginBottom: "var(--s-1)" }}>
          <div
            style={{
              width: 32, height: 32, borderRadius: "var(--r-1)",
              background: "var(--color-ink)", display: "flex",
              alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}
          >
            <Package size={16} strokeWidth={1.5} style={{ color: "var(--color-paper)" }} />
          </div>
          <p style={{ fontSize: 13, color: "var(--color-ink-muted)", lineHeight: 1.4 }}>
            Help guests arrive prepared. These appear as a checklist on their boarding pass.
          </p>
        </div>
      </div>

      {/* Bring panel */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", marginBottom: "var(--s-2)" }}>
          <ShoppingBag size={14} strokeWidth={1.75} style={{ color: "var(--color-ink-muted)" }} />
          <p className="mono" style={{ fontSize: 11, color: "var(--color-ink-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            What to bring · {bringItems.length} item{bringItems.length !== 1 ? "s" : ""}
          </p>
        </div>
        <TagPanel
          id="whatToBring"
          label="Pack these"
          sublabel="Essentials guests should bring aboard"
          items={bringItems}
          suggestions={BRING_SUGGESTIONS}
          variant="bring"
          onChange={setBringItems}
        />
      </div>

      {/* Avoid panel */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", marginBottom: "var(--s-2)" }}>
          <X size={14} strokeWidth={1.75} style={{ color: "var(--color-ink-muted)" }} />
          <p className="mono" style={{ fontSize: 11, color: "var(--color-ink-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Leave at home · {avoidItems.length} item{avoidItems.length !== 1 ? "s" : ""}
          </p>
        </div>
        <TagPanel
          id="whatNotToBring"
          label="Leave these behind"
          sublabel="Items not permitted on board"
          items={avoidItems}
          suggestions={NOT_BRING_SUGGESTIONS}
          variant="avoid"
          onChange={setAvoidItems}
        />
      </div>

      {/* Guest preview toggle */}
      {hasContent && (
        <div>
          <button
            type="button"
            onClick={() => setShowPreview((p) => !p)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--s-1)",
              padding: "6px 14px",
              borderRadius: 9999,
              border: "1px solid var(--color-line)",
              background: "var(--color-bone)",
              color: "var(--color-ink-muted)",
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {showPreview ? <EyeOff size={13} strokeWidth={1.75} /> : <Eye size={13} strokeWidth={1.75} />}
            {showPreview ? "Hide guest preview" : "Preview as guest"}
          </button>

          {showPreview && (
            <div
              style={{
                marginTop: "var(--s-3)",
                padding: "var(--s-4)",
                border: "1px solid var(--color-line)",
                borderRadius: "var(--r-2)",
                background: "var(--color-bone)",
              }}
            >
              <p
                className="mono"
                style={{
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--color-ink-muted)",
                  marginBottom: "var(--s-3)",
                }}
              >
                Guest view
              </p>

              {bringItems.length > 0 && (
                <div style={{ marginBottom: "var(--s-4)" }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-ink)", marginBottom: "var(--s-2)" }}>
                    What to bring
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-1)" }}>
                    {bringItems.map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
                        <div
                          style={{
                            width: 16, height: 16, border: "1.5px solid var(--color-line)",
                            borderRadius: 4, flexShrink: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          <Check size={9} strokeWidth={2.5} style={{ color: "var(--color-line)" }} />
                        </div>
                        <span style={{ fontSize: 13, color: "var(--color-ink)" }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {avoidItems.length > 0 && (
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-ink)", marginBottom: "var(--s-2)" }}>
                    Leave at home
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-1)" }}>
                    {avoidItems.map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
                        <X size={13} strokeWidth={2} style={{ color: "var(--color-status-err)", flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: "var(--color-ink)" }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Skip cue */}
      <p
        className="mono"
        style={{ fontSize: 11, color: "var(--color-ink-muted)", textAlign: "center", letterSpacing: "0.02em" }}
      >
        Optional — you can update this anytime from the boat settings
      </p>

      <ContinueButton onClick={handleContinue} />
    </div>
  );
}
