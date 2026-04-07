"use client";

import { useState } from "react";

type Step = "code" | "details" | "waiver" | "addons" | "confirmation";

interface JoinFlowData {
  tripCode?: string;
  fullName?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  dietaryRequirements?: string;
  languagePreference?: string;
  dateOfBirth?: string;
  waiverSigned?: boolean;
  waiverSignatureText?: string;
  selectedAddons?: Array<{ addonId: string; quantity: number }>;
  guestId?: string;
  qrToken?: string;
}

interface JoinFlowState {
  step: Step;
  direction: number;
  data: JoinFlowData;
}

const STEPS: Step[] = ["code", "details", "waiver", "addons", "confirmation"];

export function useJoinFlow() {
  const [state, setState] = useState<JoinFlowState>({
    step: "code",
    direction: 1,
    data: {},
  });

  const goNext = (newData?: Partial<JoinFlowData>): void => {
    const currentIndex = STEPS.indexOf(state.step);
    const nextStep = STEPS[currentIndex + 1];
    if (nextStep) {
      setState((prev) => ({
        step: nextStep,
        direction: 1,
        data: { ...prev.data, ...newData },
      }));
    }
  };

  const goBack = (): void => {
    const currentIndex = STEPS.indexOf(state.step);
    const prevStep = STEPS[currentIndex - 1];
    if (prevStep) {
      setState((prev) => ({
        ...prev,
        step: prevStep,
        direction: -1,
      }));
    }
  };

  const stepNumber = STEPS.indexOf(state.step) + 1;
  const totalSteps = STEPS.length;

  return { state, goNext, goBack, stepNumber, totalSteps };
}
