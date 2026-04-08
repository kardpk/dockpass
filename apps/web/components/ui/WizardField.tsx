"use client";

import { cn } from "@/lib/utils/cn";

interface WizardFieldProps {
  label: string;
  required?: boolean;
  helper?: string | undefined;
  error?: string | undefined;
  htmlFor?: string | undefined;
  children: React.ReactNode;
  className?: string | undefined;
}

export function WizardField({
  label,
  required,
  helper,
  error,
  htmlFor,
  children,
  className,
}: WizardFieldProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <label
        htmlFor={htmlFor}
        className="text-label text-dark-text mb-micro flex items-center gap-1"
      >
        {label}
        {required && <span className="text-error-text">*</span>}
      </label>
      {children}
      {helper && !error && (
        <p className="text-[12px] text-grey-text mt-micro">{helper}</p>
      )}
      {error && (
        <p className="text-[12px] text-error-text mt-micro">{error}</p>
      )}
    </div>
  );
}
