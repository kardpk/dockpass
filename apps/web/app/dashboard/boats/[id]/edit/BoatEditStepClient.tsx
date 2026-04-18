"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { updateBoatStep } from "../../new/actions";
import { Step1Vessel } from "../../new/steps/Step1Vessel";
import { Step2Marina } from "../../new/steps/Step2Marina";
import { Step4Equipment } from "../../new/steps/Step4Equipment";
import { Step5Rules } from "../../new/steps/Step5Rules";
import { Step6Packing } from "../../new/steps/Step6Packing";
import { Step7SafetyCards } from "../../new/steps/Step7SafetyCards";
import { INITIAL_WIZARD_DATA } from "../../new/types";
import type { WizardData, BoatTypeKey } from "../../new/types";
import type { BoatTemplate } from "@/lib/wizard/boat-template-types";
import { Check, Loader2 } from "lucide-react";

interface BoatEditStepClientProps {
  boatId: string;
  step: number;
  boatType: string;
  prefill: Partial<WizardData>;
}

/** Steps that change guest-facing content — require confirmation before save */
const CONFIRM_STEPS = new Set([1, 2, 5]);

export function BoatEditStepClient({ boatId, step, boatType, prefill }: BoatEditStepClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Template state for Step 4 Equipment
  const [template, setTemplate] = useState<BoatTemplate | null>(null);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateLoadError, setTemplateLoadError] = useState(false);

  // Fetch template when editing Step 4
  useEffect(() => {
    if (step !== 4) return;
    setTemplateLoading(true);
    setTemplateLoadError(false);
    fetch(`/api/dashboard/wizard/template/${boatType}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch template");
        return r.json();
      })
      .then(({ template: tmpl }) => {
        setTemplate(tmpl);
      })
      .catch(() => setTemplateLoadError(true))
      .finally(() => setTemplateLoading(false));
  }, [step, boatType]);

  // Merge prefill into initial data
  const [data, setData] = useState<WizardData>({
    ...INITIAL_WIZARD_DATA,
    ...prefill,
  });

  function update(patch: Partial<WizardData>) {
    setData((prev) => ({ ...prev, ...patch }));
  }

  // ── Save handler — accepts partial from step's onNext ──────────────────
  const handleSave = useCallback(async (partial?: Partial<WizardData>) => {
    // Merge any incoming partial from the step component into data
    const merged = partial ? { ...data, ...partial } : data;

    // For guest-facing steps, ask for confirmation
    if (CONFIRM_STEPS.has(step)) {
      const confirmed = window.confirm(
        `Save changes to "${merged.boatName || 'this boat'}"?\nThis will update the boat immediately for all future trips.`
      );
      if (!confirmed) return;
    }

    setSaved(false);
    setError(null);

    startTransition(async () => {
      const result = await updateBoatStep(boatId, step, {
        // Step 1
        boatName: merged.boatName,
        boatType: merged.boatType,
        charterType: merged.charterType,
        yearBuilt: merged.yearBuilt,
        lengthFt: merged.lengthFt,
        maxCapacity: merged.maxCapacity,
        // Step 2
        marinaName: merged.marinaName,
        marinaAddress: merged.marinaAddress,
        slipNumber: merged.slipNumber,
        parkingInstructions: merged.parkingInstructions,
        lat: merged.lat,
        lng: merged.lng,
        // Step 4
        selectedEquipment: merged.selectedEquipment,
        selectedAmenities: merged.selectedAmenities,
        specificFieldValues: merged.specificFieldValues,
        customDetails: merged.customDetails,
        // Step 5
        standardRules: merged.standardRules,
        customDos: merged.customDos,
        customDonts: merged.customDonts,
        customRuleSections: merged.customRuleSections,
        // Step 6
        whatToBring: merged.whatToBring,
        whatNotToBring: merged.whatNotToBring,
        // Step 7
        safetyCards: merged.safetyCards,
      });

      if (result.success) {
        setSaved(true);
        setTimeout(() => {
          router.push(`/dashboard/boats/${boatId}`);
          router.refresh();
        }, 800);
      } else {
        setError(result.error ?? "Save failed. Please try again.");
      }
    });
  }, [data, boatId, step, router]);

  // No-op handler for edit mode — boatType change doesn't trigger template reload here
  const handleBoatTypeSelected = useCallback((_type: BoatTypeKey) => {
    // In edit mode, boat type changes are saved on form submit
  }, []);

  const stepProps = {
    data,
    update,
    onNext: handleSave, // treat "Continue" as "Save" in edit mode
    saveLabel: isPending ? "Saving…" : saved ? "Saved ✓" : "Save changes →",
  };

  return (
    <div>
      {/* Step form */}
      <div style={{ marginBottom: "var(--s-6)" }}>
        {step === 1 && (
          <Step1Vessel
            {...stepProps}
            onBoatTypeSelected={handleBoatTypeSelected}
          />
        )}
        {step === 2 && (
          <Step2Marina {...stepProps} />
        )}
        {step === 4 && (
          <Step4Equipment
            {...stepProps}
            template={template}
            loading={templateLoading}
            loadError={templateLoadError}
            onRetry={() => {
              setTemplate(null);
              setTemplateLoadError(false);
              setTemplateLoading(true);
              fetch(`/api/dashboard/wizard/template/${boatType}`)
                .then((r) => r.json())
                .then(({ template: tmpl }) => setTemplate(tmpl))
                .catch(() => setTemplateLoadError(true))
                .finally(() => setTemplateLoading(false));
            }}
          />
        )}
        {step === 5 && (
          <Step5Rules {...stepProps} />
        )}
        {step === 6 && (
          <Step6Packing {...stepProps} />
        )}
        {step === 7 && (
          <Step7SafetyCards
            {...stepProps}
            boatType={(boatType as BoatTypeKey) || "motor_yacht"}
            lengthFt={parseFloat(data.lengthFt) || null}
            charterType={(data.charterType as "captained" | "bareboat" | "both") || "captained"}
            saving={isPending}
          />
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: "var(--s-3) var(--s-4)",
            borderRadius: "var(--r-1)",
            background: "rgba(180,60,60,0.06)",
            border: "1px solid rgba(180,60,60,0.2)",
            color: "var(--color-status-err)",
            fontSize: 13,
            marginBottom: "var(--s-4)",
          }}
        >
          {error}
        </div>
      )}

      {/* Saved indicator (inline, replaces removed sticky footer) */}
      {saved && (
        <div
          style={{
            padding: "var(--s-3) var(--s-4)",
            borderRadius: "var(--r-1)",
            background: "rgba(31,107,82,0.06)",
            border: "1px solid rgba(31,107,82,0.2)",
            color: "var(--color-status-ok)",
            fontSize: 13,
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          <Check size={14} strokeWidth={2.5} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />
          Saved — redirecting…
        </div>
      )}
    </div>
  );
}

