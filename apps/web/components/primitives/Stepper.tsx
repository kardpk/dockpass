import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

export type StepStatus = "done" | "active" | "pending" | "incomplete";

export interface Step {
  label: string;
  status: StepStatus;
}

export interface StepperProps {
  steps: Step[];
  className?: string;
}

export function Stepper({ steps, className }: StepperProps) {
  return (
    <div className={cn("stepper", className)} aria-label="Progress">
      {steps.map((step, i) => (
        <StepperPill
          key={step.label}
          status={step.status}
          aria-current={step.status === "active" ? "step" : undefined}
        >
          {step.label}
        </StepperPill>
      ))}
    </div>
  );
}

function StepperPill({
  status,
  children,
  ...rest
}: {
  status: StepStatus;
  children: ReactNode;
  [key: string]: unknown;
}) {
  return (
    <span
      className={cn(
        "stepper-pill",
        status === "done" && "stepper-pill--done",
        status === "active" && "stepper-pill--active",
        status === "incomplete" && "stepper-pill--incomplete"
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
