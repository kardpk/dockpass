"use client";

import { cn } from "@/lib/utils/cn";
import { AnchorLoader } from "@/components/ui/AnchorLoader";

interface ContinueButtonProps {
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  type?: "button" | "submit";
}

export function ContinueButton({
  loading,
  disabled,
  onClick,
  children,
  type = "button",
}: ContinueButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      className={cn(
        "w-full h-[52px] mt-section bg-navy text-white font-medium rounded-btn",
        "hover:bg-mid-blue transition-colors flex items-center justify-center",
        (loading || disabled) && "opacity-40 cursor-not-allowed"
      )}
    >
      {loading ? (
        <AnchorLoader size="sm" color="white" />
      ) : (
        children ?? "Continue →"
      )}
    </button>
  );
}
