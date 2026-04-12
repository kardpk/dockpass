"use client";

import { useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import {
  INITIAL_WIZARD_DATA,
  STEP_TITLES,
  TOTAL_STEPS,
  type WizardData,
  type BoatTypeKey,
} from "./types";
import type { BoatTemplate } from "@/lib/wizard/boat-template-types";
import { saveBoatProfile } from "./actions";
import { Step1Vessel } from "./steps/Step1Vessel";
import { Step2Marina } from "./steps/Step2Marina";
import { Step3Captain } from "./steps/Step3Captain";
import { Step4Equipment } from "./steps/Step4Equipment";
import { Step5Rules } from "./steps/Step5Rules";
import { Step6Packing } from "./steps/Step6Packing";
import { Step7SafetyCards } from "./steps/Step7SafetyCards";
import { Step8Waiver } from "./steps/Step8Waiver";
import { Step9Photos } from "./steps/Step9Photos";
import { StepComplete } from "./steps/StepComplete";

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
  }),
};

const DRAFT_KEY = "boatcheckin_boat_wizard_draft";
const DRAFT_STEP_KEY = "boatcheckin_boat_wizard_step";

export function BoatWizard() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<WizardData>(INITIAL_WIZARD_DATA);
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [template, setTemplate] = useState<BoatTemplate | null>(null);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate draft from LocalStorage (with migration from 10-step to 9-step schema)
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(DRAFT_KEY);
      const savedStep = localStorage.getItem(DRAFT_STEP_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);

        // ── Draft migration: 10-step → 9-step schema ──
        // Remove deprecated video acknowledgement field
        if ("safetyVideoAcknowledged" in parsed) {
          delete parsed.safetyVideoAcknowledged;
        }
        // Migrate old safetyImages[] → safetyCards[]
        if (parsed.safetyImages && !parsed.safetyCards) {
          parsed.safetyCards = parsed.safetyImages.map(
            (img: { id: string; preview: string; title: string; instructions: string }, i: number) => ({
              id: img.id,
              topic_key: "custom",
              image_url: null,
              file: null,
              preview: img.preview || "",
              custom_title: img.title || "",
              instructions: img.instructions || "",
              sort_order: i,
            })
          );
          delete parsed.safetyImages;
        }
        // Remove non-serializable waiverPdfFile if present
        if ("waiverPdfFile" in parsed) {
          delete parsed.waiverPdfFile;
        }

        setData({ ...INITIAL_WIZARD_DATA, ...parsed });
      }
      if (savedStep) {
        let parsed = parseInt(savedStep, 10);
        // Clamp to new max (was 10, now 9)
        if (!isNaN(parsed) && parsed >= 1) {
          parsed = Math.min(parsed, TOTAL_STEPS);
          setStep(parsed);
        }
      }
    } catch (e) {
      console.warn("Failed to hydrate boat draft:", e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Auto-save draft to LocalStorage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      // Strip non-serializable File objects before saving
      const serializable = {
        ...data,
        captainPhotoFile: null,
        boatPhotos: [],
        safetyCards: data.safetyCards.map((card) => ({
          ...card,
          file: null, // File objects cannot be stored in localStorage
        })),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(serializable));
      localStorage.setItem(DRAFT_STEP_KEY, step.toString());
    } catch (e) {
      console.warn("Failed to save boat draft:", e);
    }
  }, [data, step, isHydrated]);

  const goNext = useCallback(async (newData: Partial<WizardData>) => {
    const merged = { ...data, ...newData };
    setData(merged);

    if (step === TOTAL_STEPS) {
      // Save to Supabase via server action
      setSaving(true);
      setSaveError(null);
      try {
        const result = await saveBoatProfile({
          boatName: merged.boatName,
          boatType: merged.boatType as string,
          charterType: merged.charterType as string,
          yearBuilt: merged.yearBuilt,
          lengthFt: merged.lengthFt,
          maxCapacity: merged.maxCapacity,
          uscgDocNumber: merged.uscgDocNumber,
          registrationState: merged.registrationState,
          marinaName: merged.marinaName,
          marinaAddress: merged.marinaAddress,
          slipNumber: merged.slipNumber,
          parkingInstructions: merged.parkingInstructions,
          operatingArea: merged.operatingArea,
          lat: merged.lat,
          lng: merged.lng,
          captainName: merged.captainName,
          captainBio: merged.captainBio,
          captainLicense: merged.captainLicense,
          captainLicenseType: merged.captainLicenseType,
          captainLanguages: merged.captainLanguages,
          captainYearsExp: merged.captainYearsExp,
          captainTripCount: merged.captainTripCount,
          captainRating: merged.captainRating,
          captainCertifications: merged.captainCertifications,
          selectedEquipment: merged.selectedEquipment,
          selectedAmenities: merged.selectedAmenities,
          specificFieldValues: merged.specificFieldValues,
          customDetails: merged.customDetails,
          standardRules: merged.standardRules,
          customDos: merged.customDos,
          customDonts: merged.customDonts,
          customRuleSections: merged.customRuleSections,
          whatToBring: merged.whatToBring,
          whatNotToBring: merged.whatNotToBring,

          // Step 7 — Safety cards (USCG compliance)
          safetyCards: merged.safetyCards.map((card) => ({
            id: card.id,
            topic_key: card.topic_key,
            image_url: card.image_url || "",
            custom_title: card.custom_title ?? "",
            instructions: card.instructions,
            sort_order: card.sort_order,
          })),

          // Step 8 — Firma waiver
          firmaTemplateId: merged.firmaTemplateId,

          addons: merged.addons,
        });

        if (result.success) {
          localStorage.removeItem(DRAFT_KEY);
          localStorage.removeItem(DRAFT_STEP_KEY);
          setCompleted(true);
        } else {
          setSaveError(result.error ?? "Failed to save. Please try again.");
        }
      } catch {
        setSaveError("An unexpected error occurred. Please try again.");
      } finally {
        setSaving(false);
      }
    } else {
      setDirection(1);
      setStep((prev) => prev + 1);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step, data]);

  const goBack = useCallback(() => {
    setDirection(-1);
    setStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  /**
   * When boat type is selected in Step 1,
   * fetch template from API and merge defaults into wizard data.
   */
  const handleBoatTypeSelected = useCallback(async (type: BoatTypeKey) => {
    setTemplateLoading(true);
    setData((prev) => ({ ...prev, boatType: type }));

    try {
      const res = await fetch(`/api/dashboard/wizard/template/${type}`);
      if (!res.ok) throw new Error("Failed to fetch template");
      const { template: tmpl, defaults } = await res.json();
      setTemplate(tmpl);
      setData((prev) => ({
        ...prev,
        boatType: type,
        ...defaults,
      }));
    } catch (err) {
      console.error("[BoatWizard] template fetch failed:", err);
    } finally {
      setTemplateLoading(false);
    }
  }, []);

  const progress = completed ? 100 : ((step - 1) / TOTAL_STEPS) * 100;

  if (completed) {
    return <StepComplete boatName={data.boatName || "Your boat"} />;
  }

  return (
    <div className="min-h-screen bg-white md:bg-off-white">
      {/* Progress bar */}
      <div className="w-full h-[4px] bg-border">
        <div
          className="h-full bg-navy transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="px-page py-card max-w-[640px] mx-auto">
        <div className="flex items-center justify-between">
          {step > 1 ? (
            <div className="flex items-center gap-4">
              <button
                onClick={goBack}
                className="flex items-center gap-micro text-label text-grey-text hover:text-dark-text transition-colors"
              >
                <ChevronLeft size={16} />
                Back
              </button>
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to discard your draft and start over?")) {
                    localStorage.removeItem(DRAFT_KEY);
                    localStorage.removeItem(DRAFT_STEP_KEY);
                    setData(INITIAL_WIZARD_DATA);
                    setStep(1);
                    setDirection(-1);
                  }
                }}
                className="text-micro text-error-text opacity-80 hover:opacity-100 transition-opacity"
              >
                Discard Draft
              </button>
            </div>
          ) : (
            <div />
          )}
          <span className="text-micro text-grey-text">
            Step {step} of {TOTAL_STEPS}
          </span>
        </div>
        <h2 className="text-h2 text-navy mt-tight">
          {STEP_TITLES[step]}
        </h2>
      </div>

      {/* Save error */}
      {saveError && (
        <div className="max-w-[640px] mx-auto px-page mb-standard">
          <div className="p-standard bg-error-bg rounded-chip text-[13px] text-error-text">
            ⚠️ {saveError}
          </div>
        </div>
      )}

      {/* Step content */}
      <div className="max-w-[640px] mx-auto px-page pb-hero overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {step === 1 && (
              <Step1Vessel
                data={data}
                onNext={goNext}
                onBoatTypeSelected={handleBoatTypeSelected}
                templateLoading={templateLoading}
              />
            )}
            {step === 2 && <Step2Marina data={data} onNext={goNext} template={template} />}
            {step === 3 && <Step3Captain data={data} onNext={goNext} />}
            {step === 4 && <Step4Equipment data={data} onNext={goNext} template={template} />}
            {step === 5 && <Step5Rules data={data} onNext={goNext} />}
            {step === 6 && <Step6Packing data={data} onNext={goNext} />}
            {step === 7 && <Step7SafetyCards data={data} onNext={goNext} />}
            {step === 8 && <Step8Waiver data={data} onNext={goNext} />}
            {step === 9 && <Step9Photos data={data} onNext={goNext} saving={saving} template={template} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
