"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, ChevronUp, Info,
  Ship, Fish, Wind, Zap, Users, Waves, Compass, Gauge,
  Sunrise, Anchor, Home, HelpCircle, Bike,
} from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils/cn";
import { AnchorLoader } from "@/components/ui/AnchorLoader";
import { WizardField } from "@/components/ui/WizardField";
import { ContinueButton } from "@/components/ui/ContinueButton";
import type { LucideIcon } from "lucide-react";
import type { WizardData, BoatTypeKey, CharterType } from "../types";

// ─── MASTER_DESIGN R1: NO emojis — lucide icons only ───
const BOAT_TYPES: { key: BoatTypeKey; Icon: LucideIcon; label: string; desc: string }[] = [
  { key: "motor_yacht",      Icon: Ship,        label: "Motor Yacht",         desc: "Luxury captained vessel" },
  { key: "fishing_charter",  Icon: Fish,        label: "Fishing Charter",     desc: "Sportfishing experiences" },
  { key: "catamaran",        Icon: Wind,        label: "Catamaran (Sailing)", desc: "Stable sailing multihull" },
  { key: "power_catamaran",  Icon: Zap,         label: "Catamaran (Power)",   desc: "Engine-powered multihull" },
  { key: "pontoon",          Icon: Users,       label: "Pontoon / Party",     desc: "High-capacity leisure" },
  { key: "snorkel_dive",     Icon: Waves,       label: "Snorkel / Dive",      desc: "Reef & diving experiences" },
  { key: "sailing_yacht",    Icon: Compass,     label: "Sailing Yacht",       desc: "Classic sailing experience" },
  { key: "speedboat",        Icon: Gauge,       label: "Speedboat",           desc: "Speed & day trips" },
  { key: "wake_sports",      Icon: Waves,       label: "Wake Sports",         desc: "Wakeboard & wakesurf" },
  { key: "sunset_cruise",    Icon: Sunrise,     label: "Sunset Cruise",       desc: "Tours & sightseeing" },
  { key: "center_console",   Icon: Anchor,      label: "Center Console",      desc: "Versatile fishing & cruising" },
  { key: "houseboat",        Icon: Home,        label: "Houseboat",           desc: "Live-aboard multi-day charter" },
  { key: "pwc",              Icon: Bike,        label: "Jet Ski / PWC",       desc: "Personal watercraft rentals" },
  { key: "other",            Icon: HelpCircle,  label: "Other",               desc: "Custom vessel type" },
];

const CHARTER_OPTIONS: {
  value: CharterType;
  title: string;
  body: string;
}[] = [
  { value: "captained", title: "Captained",    body: "You or a captain drives" },
  { value: "bareboat",  title: "Bareboat",     body: "Guests operate the boat" },
  { value: "both",      title: "Both options", body: "Offer either type" },
];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN",
  "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV",
  "NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN",
  "TX","UT","VT","VA","WA","WV","WI","WY",
];

const step1Schema = z.object({
  boatType:    z.string().min(1, "Please select a boat type"),
  boatName:    z.string().min(2, "Please enter your boat name"),
  charterType: z.enum(["captained", "bareboat", "both"], { message: "Please select charter type" }),
  maxCapacity: z.number().min(1, "Must have at least 1 passenger").max(500),
});

function getInfoBanner(type: BoatTypeKey): string | null {
  switch (type) {
    case "fishing_charter": return "Florida vessel charter license information will be covered in Step 4";
    case "sailing_yacht":   return "Bareboat certification requirements will be covered in Step 4";
    case "snorkel_dive":    return "Certification requirements will be covered in Step 4";
    default:                return null;
  }
}

interface Step1Props {
  data: WizardData;
  onNext: (partial: Partial<WizardData>) => void;
  onBoatTypeSelected: (type: BoatTypeKey) => void;
  templateLoading?: boolean;
  saveLabel?: string;
}

export function Step1Vessel({ data, onNext, onBoatTypeSelected, templateLoading, saveLabel }: Step1Props) {
  const [boatType, setBoatType] = useState<BoatTypeKey | "">(data.boatType);
  const [loading, setLoading] = useState(false);
  const [boatName, setBoatName] = useState(data.boatName);
  const [charterType, setCharterType] = useState<CharterType | "">(data.charterType);
  const [maxCapacity, setMaxCapacity] = useState(data.maxCapacity);
  // NOTE: lengthFt removed from Step 1 — lives exclusively in Step 4 type-specific block
  const [yearBuilt, setYearBuilt] = useState(data.yearBuilt);
  const [showUSCG, setShowUSCG] = useState(!!data.uscgDocNumber);
  const [uscgDocNumber, setUscgDocNumber] = useState(data.uscgDocNumber);
  const [registrationState, setRegistrationState] = useState(data.registrationState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [justSelected, setJustSelected] = useState(false);

  function handleTypeSelect(type: BoatTypeKey) {
    if (type === boatType) return;
    setBoatType(type);
    setLoading(true);
    setJustSelected(true);
    setTimeout(() => {
      onBoatTypeSelected(type);
      setLoading(false);
    }, 800);
  }

  useEffect(() => {
    if (justSelected && !loading) {
      const timer = setTimeout(() => setJustSelected(false), 300);
      return () => clearTimeout(timer);
    }
  }, [justSelected, loading]);

  function handleContinue() {
    const raw = {
      boatType,
      boatName,
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
      boatName,
      boatType: boatType as BoatTypeKey,
      charterType: charterType as CharterType,
      maxCapacity,
      // lengthFt intentionally NOT passed — input removed from Step 1
      yearBuilt,
      uscgDocNumber,
      registrationState,
    });
  }

  const infoBanner = boatType ? getInfoBanner(boatType as BoatTypeKey) : null;

  return (
    <div className="space-y-page">
      {/* Boat type selector */}
      <div>
        <p className="text-label text-dark-text mb-tight">
          What type of boat is this? <span className="text-error-text">*</span>
        </p>
        {errors.boatType && (
          <p className="text-[12px] text-error-text mb-tight">{errors.boatType}</p>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-tight">
          {BOAT_TYPES.map((t) => {
            const isSelected = boatType === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => handleTypeSelect(t.key)}
                style={{
                  minHeight: 88,
                  borderRadius: 'var(--r-1)',
                  padding: 'var(--s-3)',
                  textAlign: 'left',
                  border: isSelected
                    ? '2px solid var(--color-brass)'
                    : '1px solid var(--color-line)',
                  background: isSelected ? 'var(--color-bone)' : 'var(--color-paper)',
                  transition: 'border-color var(--dur-fast) var(--ease), background var(--dur-fast) var(--ease)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--s-2)',
                }}
              >
                {/* Icon — no emoji */}
                <t.Icon
                  size={18}
                  strokeWidth={1.5}
                  style={{ color: isSelected ? 'var(--color-ink)' : 'var(--color-ink-muted)' }}
                  aria-hidden="true"
                />
                <div>
                  <p
                    className="font-display"
                    style={{
                      fontSize: 'var(--t-body-sm)',
                      fontWeight: 500,
                      lineHeight: 1.2,
                      color: 'var(--color-ink)',
                    }}
                  >
                    {t.label}
                  </p>
                  <p
                    className="mono"
                    style={{
                      fontSize: 'var(--t-mono-xs)',
                      color: 'var(--color-ink-muted)',
                      marginTop: 2,
                      lineHeight: 1.3,
                    }}
                  >
                    {t.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading state */}
      {(loading || templateLoading) && boatType && (
        <div className="flex items-center justify-center gap-tight py-section">
          <AnchorLoader size="sm" color="navy" />
          <span className="text-label text-grey-text">Loading boat settings…</span>
        </div>
      )}

      {/* Form fields — appear after type selected */}
      <AnimatePresence>
        {boatType && !loading && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="space-y-page pt-tight">
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

              {/* Charter type */}
              <WizardField label="How is the boat operated?" required error={errors.charterType}>
                <div className="grid grid-cols-3 gap-tight">
                  {CHARTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setCharterType(opt.value)}
                      style={{
                        borderRadius: 'var(--r-1)',
                        padding: 'var(--s-3)',
                        textAlign: 'left',
                        border: charterType === opt.value
                          ? '2px solid var(--color-ink)'
                          : '1px solid var(--color-line)',
                        background: charterType === opt.value ? 'var(--color-bone)' : 'var(--color-paper)',
                        transition: 'border-color var(--dur-fast) var(--ease), background var(--dur-fast) var(--ease)',
                      }}
                    >
                      <p
                        className="font-display"
                        style={{ fontSize: 'var(--t-body-sm)', fontWeight: 500, color: 'var(--color-ink)' }}
                      >
                        {opt.title}
                      </p>
                      <p
                        style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink-muted)', marginTop: 2 }}
                      >
                        {opt.body}
                      </p>
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
                  max={2030}
                  value={yearBuilt}
                  onChange={(e) => setYearBuilt(e.target.value)}
                  placeholder="e.g. 2019"
                  className="w-full h-[44px] px-standard border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none"
                />
              </WizardField>

              {/* USCG Documentation — collapsible */}
              <div className="border border-border rounded-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowUSCG(!showUSCG)}
                  className="w-full flex items-center justify-between px-standard py-card text-left hover:bg-off-white transition-colors"
                >
                  <span className="text-label text-dark-text">USCG documentation</span>
                  {showUSCG ? (
                    <ChevronUp size={16} className="text-grey-text" />
                  ) : (
                    <ChevronDown size={16} className="text-grey-text" />
                  )}
                </button>
                <AnimatePresence>
                  {showUSCG && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-standard pb-card space-y-standard">
                        <WizardField label="Documentation number" htmlFor="uscgDoc">
                          <input
                            id="uscgDoc"
                            value={uscgDocNumber}
                            onChange={(e) => setUscgDocNumber(e.target.value)}
                            placeholder="e.g. US-1234567"
                            className="w-full h-[44px] px-standard border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none"
                          />
                        </WizardField>
                        <WizardField label="Registration state" htmlFor="regState">
                          <select
                            id="regState"
                            value={registrationState}
                            onChange={(e) => setRegistrationState(e.target.value)}
                            className={cn(
                              "w-full h-[44px] px-standard border border-border rounded-input text-body focus:border-border-dark focus:outline-none appearance-none bg-white",
                              registrationState ? "text-dark-text" : "text-grey-text/50"
                            )}
                          >
                            <option value="" disabled>Select state</option>
                            {US_STATES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </WizardField>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Info banner */}
              {infoBanner && (
                <div className="flex items-start gap-tight p-standard bg-light-blue rounded-chip">
                  <Info size={16} className="text-navy shrink-0 mt-[2px]" />
                  <p className="text-caption text-navy">{infoBanner}</p>
                </div>
              )}

              <ContinueButton onClick={handleContinue}>{saveLabel}</ContinueButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
