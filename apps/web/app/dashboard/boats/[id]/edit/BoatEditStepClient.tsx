"use client";

import { useState, useTransition } from "react";
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
import { Check, Loader2 } from "lucide-react";

interface BoatEditStepClientProps {
  boatId: string;
  step: number;
  boatType: string;
  prefill: Partial<WizardData>;
}

export function BoatEditStepClient({ boatId, step, boatType, prefill }: BoatEditStepClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Merge prefill into initial data
  const [data, setData] = useState<WizardData>({
    ...INITIAL_WIZARD_DATA,
    ...prefill,
  });

  function update(patch: Partial<WizardData>) {
    setData((prev) => ({ ...prev, ...patch }));
  }

  async function handleSave() {
    setSaved(false);
    setError(null);

    startTransition(async () => {
      const result = await updateBoatStep(boatId, step, {
        // Step 1
        boatName: data.boatName,
        boatType: data.boatType,
        charterType: data.charterType,
        yearBuilt: data.yearBuilt,
        lengthFt: data.lengthFt,
        maxCapacity: data.maxCapacity,
        // Step 2
        marinaName: data.marinaName,
        marinaAddress: data.marinaAddress,
        slipNumber: data.slipNumber,
        parkingInstructions: data.parkingInstructions,
        lat: data.lat,
        lng: data.lng,
        // Step 4
        selectedEquipment: data.selectedEquipment,
        selectedAmenities: data.selectedAmenities,
        specificFieldValues: data.specificFieldValues,
        customDetails: data.customDetails,
        // Step 5
        standardRules: data.standardRules,
        customDos: data.customDos,
        customDonts: data.customDonts,
        customRuleSections: data.customRuleSections,
        // Step 6
        whatToBring: data.whatToBring,
        whatNotToBring: data.whatNotToBring,
        // Step 7
        safetyCards: data.safetyCards,
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
  }

  const stepProps = {
    data,
    update,
    onNext: handleSave, // treat "Next" as "Save" in edit mode
  };

  return (
    <div>
      {/* Step form */}
      <div style={{ marginBottom: "var(--s-6)" }}>
        {step === 1 && (
          <Step1Vessel {...stepProps} />
        )}
        {step === 2 && (
          <Step2Marina {...stepProps} />
        )}
        {step === 4 && (
          <Step4Equipment
            {...stepProps}
            boatType={(boatType as BoatTypeKey) || "motor_yacht"}
            templateLoading={false}
            templateLoadError={null}
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

      {/* Sticky save footer */}
      <div
        style={{
          position: "fixed",
          bottom: 56,
          left: 0,
          right: 0,
          zIndex: 40,
          background: "var(--color-paper)",
          borderTop: "1px solid var(--color-line-soft)",
          padding: "var(--s-3) var(--s-5)",
          display: "flex",
          gap: "var(--s-2)",
          maxWidth: 640,
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <button
          onClick={handleSave}
          disabled={isPending || saved}
          className="btn btn--ink"
          style={{
            flex: 1,
            justifyContent: "center",
            height: 48,
            fontSize: 14,
            fontWeight: 500,
            gap: "var(--s-2)",
          }}
        >
          {isPending ? (
            <><Loader2 size={16} className="animate-spin" /> Saving…</>
          ) : saved ? (
            <><Check size={16} strokeWidth={2.5} /> Saved — going back</>
          ) : (
            "Save changes →"
          )}
        </button>
      </div>
    </div>
  );
}
