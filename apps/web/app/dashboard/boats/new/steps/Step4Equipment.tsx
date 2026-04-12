"use client";

import { useState } from "react";
import { Plus, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { WizardField } from "@/components/ui/WizardField";
import { ContinueButton } from "@/components/ui/ContinueButton";
import type { BoatTemplate } from "@/lib/wizard/boat-template-types";
import type { WizardData, BoatTypeKey } from "../types";

interface Step4Props {
  data: WizardData;
  onNext: (partial: Partial<WizardData>) => void;
  template: BoatTemplate | null;
}

export function Step4Equipment({ data, onNext, template }: Step4Props) {

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

  if (!template) return null;

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

  // Check which standard equipment items were unchecked
  const uncheckedStandard = template.standardEquipment.filter(
    (item) => !selectedEquipment.includes(item)
  );

  return (
    <div className="space-y-section">
      {/* SECTION 1 — Standard equipment */}
      <div>
        <h3 className="text-h3 text-dark-text">Standard safety equipment</h3>
        <p className="text-caption text-grey-text mt-micro">
          Required by USCG for all charter vessels. Check what&apos;s onboard.
        </p>
        <div className="mt-standard space-y-tight">
          {template.standardEquipment.map((item) => (
            <label key={item} className="flex items-center gap-tight cursor-pointer">
              <input
                type="checkbox"
                checked={selectedEquipment.includes(item)}
                onChange={() => toggleEquipment(item)}
                className="w-4 h-4 rounded border-border text-navy focus:ring-navy accent-[#0C447C]"
              />
              <span className="text-body text-dark-text">{item}</span>
            </label>
          ))}
        </div>
        {uncheckedStandard.length > 0 && (
          <div className="mt-tight p-standard bg-warning-bg rounded-chip flex items-start gap-tight">
            <AlertTriangle size={14} className="text-warning-text shrink-0 mt-[2px]" />
            <p className="text-[12px] text-warning-text">
              Guests expect {uncheckedStandard.length === 1 ? "this" : "these"} on a{" "}
              {template.label.toLowerCase()} charter
            </p>
          </div>
        )}
      </div>

      {/* SECTION 2 — Optional equipment */}
      {template.optionalEquipment.length > 0 && (
        <div>
          <h3 className="text-h3 text-dark-text">Optional equipment onboard</h3>
          <div className="mt-standard space-y-tight">
            {template.optionalEquipment.map((item) => (
              <label key={item} className="flex items-center gap-tight cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedEquipment.includes(item)}
                  onChange={() => toggleEquipment(item)}
                  className="w-4 h-4 rounded border-border text-navy focus:ring-navy accent-[#0C447C]"
                />
                <span className="text-body text-dark-text">{item}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3 — Amenity groups */}
      {template.amenityGroups.map((group) => (
        <div key={group.title}>
          <h3 className="text-h3 text-dark-text">{group.title}</h3>
          <div className="mt-standard space-y-tight">
            {group.items.map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <span className="text-body text-dark-text">{item.label}</span>
                <button
                  type="button"
                  onClick={() => toggleAmenity(item.key)}
                  className={cn(
                    "w-[44px] h-[24px] rounded-full transition-colors relative",
                    selectedAmenities[item.key] ? "bg-navy" : "bg-border"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-[2px] w-[20px] h-[20px] rounded-full bg-white shadow transition-transform",
                      selectedAmenities[item.key] ? "translate-x-[22px]" : "translate-x-[2px]"
                    )}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* SECTION 4 — Boat-type specific */}
      {template.specificFields.length > 0 && (
        <div>
          <h3 className="text-h3 text-dark-text">Specific to {template.label}</h3>
          <div className="mt-standard space-y-page">
            {template.specificFields.map((field) => {
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
                      className="w-full h-[44px] px-standard border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none"
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
                      className="w-full h-[44px] px-standard border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none"
                    />
                  )}
                  {field.type === "select" && field.options && (
                    <select
                      id={field.key}
                      value={(val as string) ?? ""}
                      onChange={(e) => updateSpecificField(field.key, e.target.value)}
                      className={cn(
                        "w-full h-[44px] px-standard border border-border rounded-input text-body focus:border-border-dark focus:outline-none appearance-none bg-white",
                        val ? "text-dark-text" : "text-grey-text/50"
                      )}
                    >
                      <option value="" disabled>Select…</option>
                      {field.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  )}
                  {field.type === "multiselect" && field.options && (
                    <div className="space-y-tight">
                      {field.options.map((opt) => {
                        const selected = ((val as string[]) ?? []).includes(opt.value);
                        return (
                          <label key={opt.value} className="flex items-center gap-tight cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleMultiselect(field.key, opt.value)}
                              className="w-4 h-4 rounded accent-[#0C447C]"
                            />
                            <span className="text-body text-dark-text">{opt.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                  {field.type === "boolean" && (
                    <div className="flex items-center justify-between">
                      <span className="text-body text-dark-text">{field.helpText}</span>
                      <button
                        type="button"
                        onClick={() => updateSpecificField(field.key, !(val as boolean))}
                        className={cn(
                          "w-[44px] h-[24px] rounded-full transition-colors relative",
                          val ? "bg-navy" : "bg-border"
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-[2px] w-[20px] h-[20px] rounded-full bg-white shadow transition-transform",
                            val ? "translate-x-[22px]" : "translate-x-[2px]"
                          )}
                        />
                      </button>
                    </div>
                  )}
                </WizardField>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 5 — Custom details */}
      <div>
        <h3 className="text-h3 text-dark-text">Add your own details</h3>
        {customDetails.length > 0 && (
          <div className="mt-standard space-y-tight">
            {customDetails.map((detail, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-tight px-standard border border-border rounded-input"
              >
                <div>
                  <span className="text-label text-dark-text">{detail.label}:</span>{" "}
                  <span className="text-body text-grey-text">{detail.value}</span>
                </div>
                <button onClick={() => removeCustomDetail(i)} className="text-grey-text hover:text-error-text">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        {showCustomForm ? (
          <div className="mt-standard p-standard border border-border rounded-card space-y-standard">
            <input
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder="Label (e.g. WiFi password)"
              className="w-full h-[40px] px-standard border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none"
            />
            <input
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              placeholder="Value (e.g. YachtMiami2024)"
              className="w-full h-[40px] px-standard border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none"
            />
            <div className="flex gap-tight">
              <button
                onClick={addCustomDetail}
                disabled={!customLabel.trim() || !customValue.trim()}
                className="px-page py-tight bg-navy text-white text-label rounded-btn disabled:opacity-40"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowCustomForm(false);
                  setCustomLabel("");
                  setCustomValue("");
                }}
                className="px-page py-tight text-label text-grey-text hover:text-dark-text"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCustomForm(true)}
            className="mt-standard flex items-center gap-micro text-label text-navy hover:text-mid-blue transition-colors"
          >
            <Plus size={16} />
            Add custom detail
          </button>
        )}
      </div>

      <ContinueButton onClick={handleContinue} />
    </div>
  );
}
