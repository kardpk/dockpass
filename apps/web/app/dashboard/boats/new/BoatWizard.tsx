"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import {
  INITIAL_WIZARD_DATA,
  STEP_TITLES,
  TOTAL_STEPS,
  type WizardData,
} from "./types";
import { Step1Boat } from "./steps/Step1Boat";
import { Step2Marina } from "./steps/Step2Marina";
import { Step3Captain } from "./steps/Step3Captain";

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
  }),
};

export function BoatWizard() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<WizardData>(INITIAL_WIZARD_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function goNext(newData: Partial<WizardData>) {
    setData((prev) => ({ ...prev, ...newData }));
    setDirection(1);
    setStep((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setDirection(-1);
    setStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const progress = ((step - 1) / TOTAL_STEPS) * 100;

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
      <div className="px-page py-card max-w-[520px] mx-auto">
        <div className="flex items-center justify-between">
          {/* Back button */}
          {step > 1 ? (
            <button
              onClick={goBack}
              className="flex items-center gap-micro text-label text-grey-text hover:text-dark-text transition-colors"
            >
              <ChevronLeft size={16} />
              Back
            </button>
          ) : (
            <div />
          )}

          {/* Step indicator */}
          <span className="text-micro text-grey-text">
            Step {step} of {TOTAL_STEPS}
          </span>
        </div>

        <h2 className="text-h2 text-navy mt-tight">
          {STEP_TITLES[step]}
        </h2>
      </div>

      {/* Step content */}
      <div className="max-w-[520px] mx-auto px-page pb-hero overflow-hidden">
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
            {step === 1 && <Step1Boat data={data} onNext={goNext} />}
            {step === 2 && <Step2Marina data={data} onNext={goNext} />}
            {step === 3 && <Step3Captain data={data} onNext={goNext} />}
            {step >= 4 && (
              <div className="text-center py-hero">
                <p className="text-body text-grey-text">
                  Steps 4–6 coming in Phase 3 ⚓
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
