import { cn } from "@/lib/utils/cn";
import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

/* ── Field wrapper ── */
export interface FieldProps {
  children: ReactNode;
  hasError?: boolean;
  className?: string;
}

export function Field({ children, hasError, className }: FieldProps) {
  return (
    <div className={cn("field", hasError && "field--error", className)}>
      {children}
    </div>
  );
}

/* ── Field label ── */
export function FieldLabel({
  htmlFor,
  children,
  className,
}: {
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={cn("field-label", className)}>
      {children}
    </label>
  );
}

/* ── Input ── */
export interface FieldInputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export function FieldInput({ hasError: _hasError, className, ...rest }: FieldInputProps) {
  return (
    <input
      className={cn("field-input", className)}
      {...rest}
    />
  );
}

/* ── Textarea ── */
export interface FieldTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export function FieldTextarea({ hasError: _hasError, className, ...rest }: FieldTextareaProps) {
  return (
    <textarea
      className={cn("field-input", className)}
      style={{ resize: "vertical", minHeight: "80px" }}
      {...rest}
    />
  );
}

/* ── Select ── */
export interface FieldSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

export function FieldSelect({ hasError: _hasError, className, children, ...rest }: FieldSelectProps) {
  return (
    <select className={cn("field-input", className)} {...rest}>
      {children}
    </select>
  );
}

/* ── Hint ── */
export function FieldHint({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("field-hint", className)}>{children}</span>;
}

/* ── Error message ── */
export function FieldError({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("field-error", className)} role="alert">
      {children}
    </span>
  );
}
