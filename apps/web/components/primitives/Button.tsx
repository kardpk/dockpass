import { cn } from "@/lib/utils/cn";
import type { ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "rust" | "brass" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  /** Render as an anchor tag (pass href separately via ...rest) */
  asChild?: boolean;
}

export function Button({
  variant = "default",
  size = "md",
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        "btn",
        variant !== "default" && `btn--${variant}`,
        size !== "md" && `btn--${size}`,
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
