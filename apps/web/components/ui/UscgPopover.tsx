"use client";

import { useState, useRef, useEffect } from "react";
import { Info, ExternalLink, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function UscgPopover({
  children,
  citationPath = "46 CFR §25.25-5",
  title = "USCG Compliance",
  explanation = "This safety equipment or procedure is mandated by the United States Coast Guard for charter vessels carrying passengers for hire.",
  ecfrUrl = "https://www.ecfr.gov/current/title-46/chapter-I/subchapter-C",
}: {
  children: React.ReactNode;
  citationPath?: string;
  title?: string;
  explanation?: string;
  ecfrUrl?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isOpen &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Trap focus or handle Escape key if needed
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) setIsOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        style={{ background: "none", border: "none", padding: 0, margin: 0, cursor: "pointer", display: "flex" }}
        aria-expanded={isOpen}
      >
        {children}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              marginTop: "8px",
              zIndex: 50,
              width: "280px",
              background: "var(--color-paper)",
              border: "1px solid var(--color-line)",
              borderRadius: "var(--r-2)",
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
              padding: "var(--s-4)",
              textAlign: "left",
              cursor: "default", // reset from button
            }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--s-2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
                <Info size={16} strokeWidth={2} style={{ color: "var(--color-ink)" }} />
                <span className="font-display" style={{ fontSize: "var(--t-body-sm)", fontWeight: 600, color: "var(--color-ink)" }}>
                  {title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{ background: "none", border: "none", padding: 4, cursor: "pointer", color: "var(--color-ink-muted)" }}
                aria-label="Close popover"
              >
                <X size={14} strokeWidth={2} />
              </button>
            </div>
            
            <p className="mono" style={{ fontSize: "var(--t-mono-xs)", color: "var(--color-ink)", backgroundColor: "var(--color-bone)", padding: "4px 6px", borderRadius: "var(--r-1)", display: "inline-block", marginBottom: "var(--s-3)", border: "1px solid var(--color-line-soft)" }}>
              Ref: {citationPath}
            </p>

            <p style={{ fontSize: "14px", color: "var(--color-ink)", lineHeight: 1.5, marginBottom: "var(--s-4)" }}>
              {explanation}
            </p>

            <a
              href={ecfrUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--s-1)",
                fontSize: "13px",
                color: "var(--color-navy)",
                fontWeight: 500,
                textDecoration: "none"
              }}
            >
              View full regulation <ExternalLink size={14} strokeWidth={2} />
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
