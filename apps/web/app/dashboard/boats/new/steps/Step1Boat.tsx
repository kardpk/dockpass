"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { cn } from "@/lib/utils/cn";
import { AnchorLoader } from "@/components/ui/AnchorLoader";
import { WizardField } from "@/components/ui/WizardField";
import { ContinueButton } from "@/components/ui/ContinueButton";
import type { WizardData, BoatType, CharterType } from "../types";

const BOAT_TYPES: { value: BoatType; emoji: string; label: string }[] = [
  { value: "yacht", emoji: "⛵", label: "Sailing yacht" },
  { value: "motorboat", emoji: "🛥️", label: "Motor yacht" },
  { value: "speedboat", emoji: "🚤", label: "Speedboat" },
  { value: "catamaran", emoji: "⛵", label: "Catamaran" },
  { value: "pontoon", emoji: "🛶", label: "Pontoon boat" },
  { value: "fishing", emoji: "🎣", label: "Fishing charter" },
  { value: "sailboat", emoji: "💨", label: "Sailboat" },
  { value: "other", emoji: "🚢", label: "Other" },
];

const CHARTER_OPTIONS: {
  value: CharterType;
  emoji: string;
  title: string;
  body: string;
}[] = [
  {
    value: "captained",
    emoji: "👨‍✈️",
    title: "Captained",
    body: "You or a captain drives",
  },
  {
    value: "bareboat",
    emoji: "🎯",
    title: "Bareboat",
    body: "Guests operate the boat",
  },
  {
    value: "both",
    emoji: "🔄",
    title: "Both options",
    body: "Offer either type",
  },
];

const step1Schema = z.object({
  boatName: z.string().min(2, "Please enter your boat name"),
  boatType: z.enum(
    ["yacht", "catamaran", "motorboat", "sailboat", "pontoon", "fishing", "speedboat", "other"],
    { message: "Please select a boat type" }
  ),
  charterType: z.enum(["captained", "bareboat", "both"], {
    message: "Please select charter type",
  }),
  maxCapacity: z.number().min(1, "Must have at least 1 passenger").max(500),
});

interface Step1Props {
  data: WizardData;
  onNext: (partial: Partial<WizardData>) => void;
}

export function Step1Boat({ data, onNext }: Step1Props) {
  const [showForm, setShowForm] = useState(data.boatName !== "");
  const [importing, setImporting] = useState(false);
  const [importUrl, setImportUrl] = useState(data.importUrl);
  const [importSuccess, setImportSuccess] = useState(data.importSuccess);
  const [importError, setImportError] = useState("");
  const [importedSummary, setImportedSummary] = useState<string[]>([]);

  const [boatName, setBoatName] = useState(data.boatName);
  const [boatType, setBoatType] = useState<BoatType | "">(data.boatType);
  const [charterType, setCharterType] = useState<CharterType | "">(data.charterType);
  const [maxCapacity, setMaxCapacity] = useState(data.maxCapacity);
  const [yearBuilt, setYearBuilt] = useState(data.yearBuilt);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleImport() {
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportError("");

    try {
      const res = await fetch("/api/dashboard/boats/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl }),
      });

      const json = await res.json();

      if (!res.ok) {
        setImportError(
          json.error ?? "Couldn't read that listing. Try entering your details manually below."
        );
        return;
      }

      const d = json.data;
      setBoatName(d.boatName ?? "");
      setBoatType(d.boatType ?? "");
      setMaxCapacity(d.maxCapacity?.toString() ?? "");
      setImportSuccess(true);

      const summary: string[] = [];
      if (d.boatName) summary.push(d.boatName);
      if (d.marinaName) summary.push(d.marinaName);
      if (d.houseRules) {
        const count = d.houseRules.split("\n").filter(Boolean).length;
        summary.push(`${count} house rules`);
      }
      if (d.photoUrls?.length) summary.push(`${d.photoUrls.length} photos`);
      setImportedSummary(summary);

      // Also pre-fill other wizard fields for later steps
      onNext({
        importUrl,
        importSuccess: true,
        boatName: d.boatName ?? "",
        boatType: d.boatType ?? "",
        maxCapacity: d.maxCapacity?.toString() ?? "",
        marinaName: d.marinaName ?? "",
        marinaAddress: d.marinaAddress ?? "",
        captainName: d.captainName ?? "",
        houseRules: d.houseRules ?? "",
        whatToBring: d.whatToBring ?? "",
        cancellationPolicy: d.cancellationPolicy ?? "",
        photoUrls: d.photoUrls ?? [],
      });
    } catch {
      setImportError("Couldn't read that listing. Try entering your details manually below.");
    } finally {
      setImporting(false);
    }
  }

  function handleContinue() {
    const raw = {
      boatName,
      boatType,
      charterType,
      maxCapacity: maxCapacity ? Number(maxCapacity) : 0,
    };

    const result = step1Schema.safeParse(raw);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    onNext({
      importUrl,
      importSuccess,
      boatName,
      boatType: boatType as BoatType,
      charterType: charterType as CharterType,
      maxCapacity,
      yearBuilt,
    });
  }

  return (
    <div className="space-y-standard">
      {/* Import + Manual cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-standard">
        {/* Import card */}
        <div className="relative border-2 border-navy bg-light-blue rounded-card p-card">
          <span className="absolute top-3 right-3 bg-navy text-white text-[10px] font-semibold px-2 py-[2px] rounded-pill">
            Recommended
          </span>
          <span className="text-[24px]">🔗</span>
          <h3 className="text-h3 text-navy mt-tight">Import from Boatsetter</h3>
          <p className="text-caption text-grey-text mt-micro">
            Paste your listing URL and we&apos;ll fill in everything automatically.
          </p>

          {!importSuccess ? (
            <div className="mt-standard space-y-standard">
              <input
                type="url"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                placeholder="https://www.boatsetter.com/boats/..."
                className="w-full h-[44px] px-standard border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none"
              />
              {importError && (
                <p className="text-[12px] text-error-text">{importError}</p>
              )}
              <button
                onClick={handleImport}
                disabled={importing || !importUrl.trim()}
                className="w-full h-[52px] bg-navy text-white font-medium rounded-btn hover:bg-mid-blue transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {importing ? (
                  <>
                    <AnchorLoader size="sm" color="white" />
                    <span>Scanning…</span>
                  </>
                ) : (
                  "Import my listing →"
                )}
              </button>
            </div>
          ) : (
            <div className="mt-standard p-standard bg-success-bg border border-success-text rounded-chip">
              <p className="text-[14px] font-semibold text-success-text">
                ✓ We found your boat!
              </p>
              <ul className="mt-micro space-y-[2px]">
                {importedSummary.map((item, i) => (
                  <li key={i} className="text-caption text-dark-text">
                    ✓ {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Manual card */}
        <div className="border border-border bg-white rounded-card p-card">
          <span className="text-[24px]">✏️</span>
          <h3 className="text-h3 text-dark-text mt-tight">Enter manually</h3>
          <p className="text-caption text-grey-text mt-micro">
            Takes about 10 minutes. Fill in your boat details step by step.
          </p>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full h-[52px] mt-standard border border-navy text-navy font-medium rounded-btn hover:bg-light-blue transition-colors"
            >
              Enter manually →
            </button>
          )}
        </div>
      </div>

      {/* Form fields */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="space-y-page pt-section">
              {/* Boat name */}
              <WizardField label="Boat name" required error={errors.boatName} htmlFor="boatName">
                <input
                  id="boatName"
                  value={boatName}
                  onChange={(e) => setBoatName(e.target.value)}
                  placeholder="e.g. Conrad's Yacht Miami"
                  className="w-full h-[44px] px-standard border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none"
                />
              </WizardField>

              {/* Boat type */}
              <WizardField label="Type of boat" required error={errors.boatType} htmlFor="boatType">
                <select
                  id="boatType"
                  value={boatType}
                  onChange={(e) => setBoatType(e.target.value as BoatType)}
                  className={cn(
                    "w-full h-[44px] px-standard border border-border rounded-input text-body focus:border-border-dark focus:outline-none appearance-none bg-white",
                    boatType ? "text-dark-text" : "text-grey-text/50"
                  )}
                >
                  <option value="" disabled>Select boat type</option>
                  {BOAT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.emoji} {t.label}
                    </option>
                  ))}
                </select>
              </WizardField>

              {/* Charter type — radio cards */}
              <WizardField label="How is the boat operated?" required error={errors.charterType}>
                <div className="grid grid-cols-3 gap-tight">
                  {CHARTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setCharterType(opt.value)}
                      className={cn(
                        "border rounded-card p-standard text-left transition-all",
                        charterType === opt.value
                          ? "border-navy bg-light-blue"
                          : "border-border bg-white hover:border-border-dark"
                      )}
                    >
                      <span className="text-[20px]">{opt.emoji}</span>
                      <p className="text-label text-dark-text mt-micro">{opt.title}</p>
                      <p className="text-[11px] text-grey-text mt-[2px]">{opt.body}</p>
                    </button>
                  ))}
                </div>
              </WizardField>

              {/* Max passengers */}
              <WizardField
                label="Maximum passengers"
                required
                helper="Including yourself if applicable"
                error={errors.maxCapacity}
                htmlFor="maxCapacity"
              >
                <input
                  id="maxCapacity"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={500}
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(e.target.value)}
                  placeholder="8"
                  className="w-full h-[44px] px-standard border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none"
                />
              </WizardField>

              {/* Year built */}
              <WizardField label="Year built" htmlFor="yearBuilt">
                <input
                  id="yearBuilt"
                  type="number"
                  inputMode="numeric"
                  min={1950}
                  max={2026}
                  value={yearBuilt}
                  onChange={(e) => setYearBuilt(e.target.value)}
                  placeholder="e.g. 2019"
                  className="w-full h-[44px] px-standard border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none"
                />
              </WizardField>

              <ContinueButton onClick={handleContinue} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
