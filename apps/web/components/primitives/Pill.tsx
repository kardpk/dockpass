import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

export type PillVariant =
  | "ok"
  | "warn"
  | "err"
  | "info"
  | "ghost"
  | "rust"
  | "brass"
  | "ink";

export interface PillProps {
  variant?: PillVariant;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

export function Pill({
  variant = "ghost",
  dot = false,
  children,
  className,
}: PillProps) {
  return (
    <span className={cn("pill", `pill--${variant}`, className)}>
      {dot && <span className="pill-dot" aria-hidden="true" />}
      {children}
    </span>
  );
}
