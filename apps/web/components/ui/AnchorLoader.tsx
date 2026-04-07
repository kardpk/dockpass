"use client";

interface AnchorLoaderProps {
  size?: "sm" | "md" | "lg";
  color?: "navy" | "white";
}

export function AnchorLoader({
  size = "md",
  color = "navy",
}: AnchorLoaderProps) {
  const sizes = { sm: 16, md: 24, lg: 48 } as const;
  const px = sizes[size];

  return (
    <span
      role="status"
      aria-label="Loading"
      className="inline-block"
      style={{
        fontSize: px,
        animation: "anchorRock 1.2s ease-in-out infinite",
        transformOrigin: "center bottom",
        display: "inline-block",
        color: color === "white" ? "#FFFFFF" : "#0C447C",
      }}
    >
      ⚓
    </span>
  );
}
