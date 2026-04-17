import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

export type AlertVariant = "ok" | "warn" | "err" | "info";

export interface AlertProps {
  variant?: AlertVariant;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Alert({ variant = "info", icon, children, className }: AlertProps) {
  return (
    <div
      className={cn("alert", `alert--${variant}`, className)}
      role={variant === "err" ? "alert" : "status"}
    >
      {icon && icon}
      <div className="alert__body">{children}</div>
    </div>
  );
}
