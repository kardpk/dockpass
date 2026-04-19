"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { Download, Copy, Check, QrCode } from "lucide-react";

interface Props {
  boatId: string;
  boatName: string;
  publicSlug: string;
  /** Short human-readable token: e.g. "mv-lotus-a3f9" → boatcheckin.com/b/mv-lotus-a3f9
   *  Falls back to the full /board/[publicSlug] URL if null (pre-migration boats). */
  shortBoardToken: string | null;
}

export function BoatQRSection({ boatId, boatName, publicSlug, shortBoardToken }: Props) {
  // Prefer short URL — much cleaner for SMS and printing
  const boardingUrl = shortBoardToken
    ? `https://boatcheckin.com/b/${shortBoardToken}`
    : `https://boatcheckin.com/board/${publicSlug}`;

  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(boardingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* silent fallback */ }
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/dashboard/boats/${boatId}/qr-pdf`);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `boatcheckin-qr-${boatName.replace(/\s+/g, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("PDF download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    /* Tile — §7.3: ink border, --r-1, no shadow */
    <div style={{
      background: "var(--color-paper)",
      border: "var(--border-w) solid var(--color-line)",
      borderRadius: "var(--r-1)",
      overflow: "hidden",
    }}>
      {/* Top brass accent bar §7.3 */}
      <div style={{ height: 3, background: "var(--color-brass)" }} />

      <div style={{ padding: "var(--s-5)" }}>
        {/* Tile label — §7.4 mono, uppercase */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--s-2)",
          marginBottom: "var(--s-5)",
        }}>
          <QrCode size={16} strokeWidth={2} color="var(--color-ink-muted)" />
          <span style={{
            fontFamily: "var(--font-jetbrains)",
            fontSize: "var(--t-mono-sm)",
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--color-ink-soft)",
          }}>
            Dock QR Code
          </span>
          <span style={{
            marginLeft: "auto",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontFamily: "var(--font-jetbrains)",
            fontSize: "var(--t-mono-xs)",
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--color-status-ok)",
            background: "var(--color-status-ok-soft)",
            padding: "3px 8px",
            borderRadius: "var(--r-pill)",
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--color-status-ok)" }} />
            Permanent
          </span>
        </div>

        {/* QR display — §10.4: always white bg, ink fg, min 120px, ECL M
            Short URL = fewer modules = larger cells = easier scan in direct sun */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "var(--s-4)",
        }}>
          <div style={{
            padding: "var(--s-3)",
            background: "#FFFFFF",
            border: "var(--border-w) solid var(--color-line)",
            borderRadius: "var(--r-1)",
            display: "inline-block",
          }}>
            <QRCodeSVG
              value={boardingUrl}
              size={160}
              level="M"
              fgColor="#0B1E2D"
              bgColor="#FFFFFF"
            />
          </div>
        </div>

        {/* URL — mono, caption §10.4
            Short form is legible; fallback long form word-breaks cleanly */}
        <p style={{
          fontFamily: "var(--font-jetbrains)",
          fontSize: "var(--t-mono-xs)",
          fontWeight: 500,
          color: "var(--color-ink-muted)",
          textAlign: "center",
          wordBreak: "break-all",
          marginBottom: "var(--s-5)",
        }}>
          {boardingUrl}
        </p>

        {/* Action buttons — §7.1 btn pattern */}
        <div style={{ display: "flex", gap: "var(--s-2)" }}>
          <button
            onClick={handleCopy}
            style={{
              flex: 1,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "var(--s-2)",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.01em",
              color: copied ? "var(--color-status-ok)" : "var(--color-ink)",
              background: "var(--color-paper)",
              border: `var(--border-w) solid ${copied ? "var(--color-status-ok)" : "var(--color-line)"}`,
              borderRadius: "var(--r-1)",
              cursor: "pointer",
              transition: "all var(--dur-fast) var(--ease)",
            }}
          >
            {copied
              ? <Check size={14} strokeWidth={2.5} />
              : <Copy size={14} strokeWidth={2} />
            }
            {copied ? "Copied" : "Copy link"}
          </button>

          <button
            onClick={handleDownload}
            disabled={downloading}
            style={{
              flex: 1,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "var(--s-2)",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.01em",
              color: "var(--color-bone)",
              background: downloading ? "var(--color-ink-muted)" : "var(--color-ink)",
              border: "var(--border-w) solid var(--color-line)",
              borderRadius: "var(--r-1)",
              cursor: downloading ? "not-allowed" : "pointer",
              opacity: downloading ? 0.7 : 1,
              transition: "background var(--dur-fast) var(--ease)",
            }}
          >
            <Download size={14} strokeWidth={2} />
            {downloading ? "Generating…" : "Download PDF"}
          </button>
        </div>

        {/* Guidance — alert--info style §7.5 */}
        <div style={{
          marginTop: "var(--s-4)",
          paddingTop: "var(--s-4)",
          borderTop: "1px dashed var(--color-line-soft)",
        }}>
          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--t-body-sm)",
            color: "var(--color-ink-muted)",
            lineHeight: 1.6,
          }}>
            Print at <strong style={{ color: "var(--color-ink)", fontWeight: 600 }}>4 × 4 inches</strong> minimum.
            Laminate for marine durability. This QR code{" "}
            <strong style={{ color: "var(--color-ink)", fontWeight: 600 }}>never changes</strong> —
            guests scan it for any current trip on this boat without a new QR each day.
          </p>
        </div>
      </div>
    </div>
  );
}
