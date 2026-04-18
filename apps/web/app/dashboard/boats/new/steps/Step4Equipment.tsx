"use client";

import { useState } from "react";
import { Plus, X, AlertTriangle, Check, RefreshCw } from "lucide-react";
import { Switch } from "@/components/ui/Switch";
import { WizardField } from "@/components/ui/WizardField";
import { ContinueButton } from "@/components/ui/ContinueButton";
import type { BoatTemplate } from "@/lib/wizard/boat-template-types";
import type { WizardData } from "../types";

interface Step4Props {
  data: WizardData;
  onNext: (partial: Partial<WizardData>) => void;
  template: BoatTemplate | null;
  loading?: boolean;
  loadError?: boolean;
  onRetry?: () => void;
  saveLabel?: string;
}

// ─── Skeleton shimmer row ───
function SkeletonRow() {
  return (
    <div
      style={{
        height: 44,
        borderRadius: "var(--r-1)",
        background: "linear-gradient(90deg, var(--color-bone) 25%, var(--color-line-soft) 50%, var(--color-bone) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s ease-in-out infinite",
        marginBottom: "var(--s-1)",
      }}
    />
  );
}

// ─── Section tile wrapper ───
function SectionTile({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      className="tile"
      style={{
        padding: 0,
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Section header inside tile ───
function SectionHeader({
  title,
  subtitle,
  pill,
}: {
  title: string;
  subtitle?: string;
  pill?: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: "var(--s-3) var(--s-4)",
        background: "var(--color-bone)",
        borderBottom: "1px solid var(--color-line-soft)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
        <p
          className="mono"
          style={{
            fontSize: "var(--t-mono-xs)",
            color: "var(--color-ink-muted)",
            fontWeight: 500,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            flex: 1,
          }}
        >
          {title}
        </p>
        {pill}
      </div>
      {subtitle && (
        <p
          style={{
            fontSize: "var(--t-body-sm)",
            color: "var(--color-ink-muted)",
            marginTop: 2,
            lineHeight: 1.4,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ─── Custom checkbox row (replaces raw <input type="checkbox">) ───
function CheckRow({
  label,
  checked,
  onChange,
  isLast,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  isLast?: boolean;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--s-3)",
        padding: "var(--s-3) var(--s-4)",
        borderBottom: isLast ? "none" : "1px solid var(--color-line-soft)",
        cursor: "pointer",
        background: checked ? "var(--color-bone)" : "var(--color-paper)",
        // Brass left stripe when checked
        borderLeft: checked ? "3px solid var(--color-brass)" : "3px solid transparent",
        transition: "background 0.15s ease, border-left-color 0.15s ease",
      }}
    >
      {/* Custom checkbox icon */}
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
        tabIndex={0}
      />
      <span
        aria-hidden="true"
        style={{
          width: 18,
          height: 18,
          flexShrink: 0,
          borderRadius: "var(--r-1)",
          border: checked ? "none" : "1.5px solid var(--color-line)",
          background: checked ? "var(--color-ink)" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.15s, border-color 0.15s",
        }}
      >
        {checked && <Check size={11} strokeWidth={3} style={{ color: "var(--color-paper)" }} />}
      </span>
      <span
        style={{
          fontSize: "var(--t-body-sm)",
          color: "var(--color-ink)",
          lineHeight: 1.4,
          flex: 1,
        }}
      >
        {label}
      </span>
    </label>
  );
}

// ─── Switch row (amenity toggle) ───
function SwitchRow({
  label,
  checked,
  onChange,
  isLast,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  isLast?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "var(--s-3) var(--s-4)",
        borderBottom: isLast ? "none" : "1px solid var(--color-line-soft)",
        gap: "var(--s-4)",
      }}
    >
      <span
        style={{
          fontSize: "var(--t-body-sm)",
          color: "var(--color-ink)",
          lineHeight: 1.4,
          flex: 1,
        }}
      >
        {label}
      </span>
      <Switch checked={checked} onChange={() => onChange()} />
    </div>
  );
}

export function Step4Equipment({
  data,
  onNext,
  template,
  loading = false,
  loadError = false,
  onRetry,
  saveLabel,
}: Step4Props) {
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(data.selectedEquipment);
  const [selectedAmenities, setSelectedAmenities] = useState<Record<string, boolean>>(
    data.selectedAmenities
  );
  const [specificFieldValues, setSpecificFieldValues] = useState<
    Record<string, string | boolean | string[]>
  >(data.specificFieldValues);
  const [customDetails, setCustomDetails] = useState(data.customDetails);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customLabel, setCustomLabel] = useState("");
  const [customValue, setCustomValue] = useState("");

  function toggleEquipment(item: string) {
    setSelectedEquipment((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  }

  function toggleAmenity(key: string) {
    setSelectedAmenities((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function updateSpecificField(key: string, value: string | boolean | string[]) {
    setSpecificFieldValues((prev) => ({ ...prev, [key]: value }));
  }

  function toggleMultiselect(fieldKey: string, optionValue: string) {
    const current = (specificFieldValues[fieldKey] as string[]) ?? [];
    const updated = current.includes(optionValue)
      ? current.filter((v) => v !== optionValue)
      : [...current, optionValue];
    updateSpecificField(fieldKey, updated);
  }

  function addCustomDetail() {
    if (!customLabel.trim() || !customValue.trim()) return;
    setCustomDetails((prev) => [...prev, { label: customLabel.trim(), value: customValue.trim() }]);
    setCustomLabel("");
    setCustomValue("");
    setShowCustomForm(false);
  }

  function removeCustomDetail(index: number) {
    setCustomDetails((prev) => prev.filter((_, i) => i !== index));
  }

  function handleContinue() {
    onNext({ selectedEquipment, selectedAmenities, specificFieldValues, customDetails });
  }

  // ─── Loading skeleton ───
  if (loading || (!template && !loadError)) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-5)" }}>
        <style>{`
          @keyframes shimmer {
            0%   { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
        {/* Skeleton section 1 */}
        <SectionTile>
          <SectionHeader title="Standard safety equipment" />
          <div style={{ padding: "var(--s-2) 0" }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ padding: "var(--s-1) var(--s-4)" }}>
                <SkeletonRow />
              </div>
            ))}
          </div>
        </SectionTile>
        {/* Skeleton section 2 */}
        <SectionTile>
          <SectionHeader title="Optional equipment" />
          <div style={{ padding: "var(--s-2) 0" }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ padding: "var(--s-1) var(--s-4)" }}>
                <SkeletonRow />
              </div>
            ))}
          </div>
        </SectionTile>
        {/* Skeleton section 3 */}
        <SectionTile>
          <SectionHeader title="Amenities" />
          <div style={{ padding: "var(--s-2) 0" }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ padding: "var(--s-1) var(--s-4)" }}>
                <SkeletonRow />
              </div>
            ))}
          </div>
        </SectionTile>
      </div>
    );
  }

  // ─── Error state ───
  if (loadError && !template) {
    return (
      <div
        className="tile"
        style={{
          padding: "var(--s-6)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "var(--s-3)",
          textAlign: "center",
        }}
      >
        <AlertTriangle
          size={28}
          strokeWidth={1.5}
          style={{ color: "var(--color-status-warn)" }}
        />
        <p
          className="font-display"
          style={{ fontSize: "var(--t-body-lg)", fontWeight: 500, color: "var(--color-ink)" }}
        >
          Couldn&apos;t load equipment list
        </p>
        <p style={{ fontSize: "var(--t-body-sm)", color: "var(--color-ink-muted)" }}>
          Check your connection and try again.
        </p>
        {onRetry && (
          <button onClick={onRetry} className="btn btn--ghost btn--sm" style={{ marginTop: "var(--s-2)", gap: "var(--s-2)" }}>
            <RefreshCw size={14} strokeWidth={1.75} aria-hidden="true" />
            Retry
          </button>
        )}
      </div>
    );
  }

  // ─── Full content ───
  const uncheckedStandard = template!.standardEquipment.filter(
    (item) => !selectedEquipment.includes(item)
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-5)" }}>

      {/* ── SECTION 1: Standard safety equipment ── */}
      <SectionTile>
        <SectionHeader
          title="USCG Required"
          subtitle="Required for all charter vessels. Check what's onboard."
          pill={
            <span className="pill pill--warn" style={{ fontSize: "var(--t-mono-xs)" }}>
              Safety
            </span>
          }
        />
        <div>
          {template!.standardEquipment.map((item, i) => (
            <CheckRow
              key={item}
              label={item}
              checked={selectedEquipment.includes(item)}
              onChange={() => toggleEquipment(item)}
              isLast={i === template!.standardEquipment.length - 1}
            />
          ))}
        </div>
        {uncheckedStandard.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "var(--s-2)",
              padding: "var(--s-3) var(--s-4)",
              background: "rgba(var(--color-status-warn-rgb, 184,136,42),0.06)",
              borderTop: "1px solid var(--color-line-soft)",
            }}
          >
            <AlertTriangle
              size={13}
              strokeWidth={1.75}
              style={{ color: "var(--color-status-warn)", flexShrink: 0, marginTop: 2 }}
            />
            <p className="mono" style={{ fontSize: "var(--t-mono-xs)", color: "var(--color-status-warn)" }}>
              {uncheckedStandard.length} item{uncheckedStandard.length !== 1 ? "s" : ""} unchecked
              &mdash; guests expect{" "}
              {uncheckedStandard.length === 1 ? "this" : "these"} on a{" "}
              {template!.label.toLowerCase()} charter
            </p>
          </div>
        )}
      </SectionTile>

      {/* ── SECTION 2: Optional equipment ── */}
      {template!.optionalEquipment.length > 0 && (
        <SectionTile>
          <SectionHeader
            title="Optional onboard"
            subtitle="Add any additional equipment your vessel has."
          />
          <div>
            {template!.optionalEquipment.map((item, i) => (
              <CheckRow
                key={item}
                label={item}
                checked={selectedEquipment.includes(item)}
                onChange={() => toggleEquipment(item)}
                isLast={i === template!.optionalEquipment.length - 1}
              />
            ))}
          </div>
        </SectionTile>
      )}

      {/* ── SECTION 3: Amenity groups ── */}
      {template!.amenityGroups.map((group) => (
        <SectionTile key={group.title}>
          <SectionHeader title={group.title} />
          <div>
            {group.items.map((item, i) => (
              <SwitchRow
                key={item.key}
                label={item.label}
                checked={!!selectedAmenities[item.key]}
                onChange={() => toggleAmenity(item.key)}
                isLast={i === group.items.length - 1}
              />
            ))}
          </div>
        </SectionTile>
      ))}

      {/* ── SECTION 4: Boat-type specific ── */}
      {template!.specificFields.length > 0 && (
        <SectionTile>
          <SectionHeader
            title={`Specific to ${template!.label}`}
          />
          <div style={{ padding: "var(--s-4)", display: "flex", flexDirection: "column", gap: "var(--s-5)" }}>
            {template!.specificFields.map((field) => {
              const val = specificFieldValues[field.key];
              return (
                <WizardField
                  key={field.key}
                  label={field.label}
                  required={field.required ?? false}
                  helper={field.helpText ?? ""}
                  htmlFor={field.key}
                >
                  {field.type === "text" && (
                    <input
                      id={field.key}
                      value={(val as string) ?? ""}
                      onChange={(e) => updateSpecificField(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="field-input"
                    />
                  )}
                  {field.type === "number" && (
                    <input
                      id={field.key}
                      type="number"
                      inputMode="numeric"
                      value={(val as string) ?? ""}
                      onChange={(e) => updateSpecificField(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="field-input"
                    />
                  )}
                  {field.type === "select" && field.options && (
                    <select
                      id={field.key}
                      value={(val as string) ?? ""}
                      onChange={(e) => updateSpecificField(field.key, e.target.value)}
                      className="field-input"
                      style={{ appearance: "none" }}
                    >
                      <option value="" disabled>Select…</option>
                      {field.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  )}
                  {field.type === "multiselect" && field.options && (
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {field.options.map((opt, i) => {
                        const selected = ((val as string[]) ?? []).includes(opt.value);
                        return (
                          <CheckRow
                            key={opt.value}
                            label={opt.label}
                            checked={selected}
                            onChange={() => toggleMultiselect(field.key, opt.value)}
                            isLast={i === (field.options?.length ?? 0) - 1}
                          />
                        );
                      })}
                    </div>
                  )}
                  {field.type === "boolean" && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--s-4)" }}>
                      <span style={{ fontSize: "var(--t-body-sm)", color: "var(--color-ink-muted)" }}>
                        {field.helpText}
                      </span>
                      <Switch
                        id={field.key}
                        checked={!!(val as boolean)}
                        onChange={(next) => updateSpecificField(field.key, next)}
                      />
                    </div>
                  )}
                </WizardField>
              );
            })}
          </div>
        </SectionTile>
      )}

      {/* ── SECTION 5: Custom details ── */}
      <SectionTile>
        <SectionHeader
          title="Custom details"
          subtitle="Add anything else guests should know about this vessel."
        />
        <div style={{ padding: "var(--s-4)", display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
          {/* Existing custom details */}
          {customDetails.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-1)" }}>
              {customDetails.map((detail, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--s-2) var(--s-3)",
                    borderRadius: "var(--r-1)",
                    background: "var(--color-bone)",
                    borderLeft: "3px solid var(--color-brass)",
                    gap: "var(--s-3)",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: "var(--t-body-sm)", fontWeight: 500, color: "var(--color-ink)" }}>
                      {detail.label}
                    </span>
                    <span style={{ fontSize: "var(--t-body-sm)", color: "var(--color-ink-muted)", marginLeft: "var(--s-2)" }}>
                      {detail.value}
                    </span>
                  </div>
                  <button
                    onClick={() => removeCustomDetail(i)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--color-ink-muted)", padding: 4, flexShrink: 0,
                      display: "flex", alignItems: "center",
                    }}
                    aria-label="Remove detail"
                  >
                    <X size={14} strokeWidth={1.5} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Custom form or add button */}
          {showCustomForm ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
              <input
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="Label (e.g. WiFi password)"
                className="field-input"
              />
              <input
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                placeholder="Value (e.g. YachtMiami2024)"
                className="field-input"
              />
              <div style={{ display: "flex", gap: "var(--s-2)" }}>
                <button
                  onClick={addCustomDetail}
                  disabled={!customLabel.trim() || !customValue.trim()}
                  className="btn btn--rust btn--sm"
                >
                  <Check size={13} strokeWidth={2.5} aria-hidden="true" /> Save
                </button>
                <button
                  onClick={() => {
                    setShowCustomForm(false);
                    setCustomLabel("");
                    setCustomValue("");
                  }}
                  className="btn btn--ghost btn--sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCustomForm(true)}
              className="btn btn--ghost btn--sm"
              style={{ alignSelf: "flex-start", gap: "var(--s-1)", color: "var(--color-ink-muted)" }}
            >
              <Plus size={14} strokeWidth={2} aria-hidden="true" />
              Add custom detail
            </button>
          )}
        </div>
      </SectionTile>

      <ContinueButton onClick={handleContinue}>{saveLabel}</ContinueButton>
    </div>
  );
}
