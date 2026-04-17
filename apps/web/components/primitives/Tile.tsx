import { cn } from "@/lib/utils/cn";
import type { ReactNode, HTMLAttributes } from "react";

export interface TileProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  dark?: boolean;
  hover?: boolean;
  featured?: boolean;
  children: ReactNode;
}

export function Tile({
  size = "md",
  dark = false,
  hover = false,
  featured = false,
  className,
  children,
  ...rest
}: TileProps) {
  return (
    <div
      className={cn(
        "tile",
        size === "sm" && "tile--sm",
        size === "lg" && "tile--lg",
        dark && "tile--dark",
        hover && "tile--hover",
        featured && "tile--featured",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function TileLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={cn("tile-label", className)}>{children}</span>;
}

export function TileTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("tile-title", className)}>{children}</div>;
}

export function TileValue({
  children,
  unit,
  className,
}: {
  children: ReactNode;
  unit?: string;
  className?: string;
}) {
  return (
    <div className={cn("tile-value", className)}>
      {children}
      {unit && <span className="unit">{unit}</span>}
    </div>
  );
}

export function TileBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={cn("tile-body", className)}>{children}</p>;
}
