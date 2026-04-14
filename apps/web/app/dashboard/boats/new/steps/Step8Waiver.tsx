"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  FileSignature,
  Upload,
  AlertTriangle,
  Check,
  File,
  X,
  RefreshCw,
  ShieldCheck,
  Download,
} from "lucide-react";
import { AnchorLoader } from "@/components/ui/AnchorLoader";
import { ContinueButton } from "@/components/ui/ContinueButton";
import type { BoatTemplate } from "@/lib/wizard/boat-template-types";
import type { WizardData } from "../types";

const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10MB

// ─── Step 8: Waiver PDF + Firma Embedded Editor ───

interface Step8Props {
  data: WizardData;
  onNext: (partial: Partial<WizardData>) => void;
  template: BoatTemplate | null;
}

export function Step8Waiver({ data, onNext, template }: Step8Props) {
  // Track the File object locally (not persisted to localStorage — File is not serializable)
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPreview, setPdfPreview] = useState(data.waiverPdfPreview);
  const [firmaTemplateId, setFirmaTemplateId] = useState(
    data.firmaTemplateId
  );
  const [editorJwt, setEditorJwt] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [editorReady, setEditorReady] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Listen for Firma postMessage events (template saved)
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // Only accept messages from Firma domain
      if (
        !event.origin.includes("firma.dev") &&
        !event.origin.includes("localhost")
      )
        return;

      const { type, templateId } = event.data ?? {};
      if (type === "template.saved" && templateId) {
        setFirmaTemplateId(templateId);
      }
      if (type === "editor.ready") {
        setEditorReady(true);
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Handle PDF file selection
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");

    if (file.type !== "application/pdf") {
      setUploadError("Only PDF files are accepted.");
      return;
    }

    if (file.size > MAX_PDF_SIZE) {
      setUploadError("PDF must be smaller than 10MB.");
      return;
    }

    setPdfFile(file);
    setPdfPreview(file.name);
    setFirmaTemplateId(""); // Reset template when new PDF is uploaded
    setEditorReady(false);

    // Trigger the upload + Firma template creation
    uploadAndCreateTemplate(file);

    if (fileRef.current) fileRef.current.value = "";
  }

  // Upload PDF and create Firma template
  const uploadAndCreateTemplate = useCallback(async (file: File) => {
    setUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("pdf", file);

      const res = await fetch("/api/dashboard/wizard/firma-template", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Failed to create waiver template");
      }

      const { templateId, editorJwt: jwt } = await res.json();
      if (templateId) setFirmaTemplateId(templateId);
      if (jwt) setEditorJwt(jwt);
    } catch (err: unknown) {
      console.error("[Step8Waiver] upload failed:", err);
      setUploadError(
        err instanceof Error
          ? err.message
          : "Failed to upload PDF. Please try again."
      );
    } finally {
      setUploading(false);
    }
  }, []);

  function removePdf() {
    setPdfFile(null);
    setPdfPreview("");
    setFirmaTemplateId("");
    setEditorJwt(null);
    setEditorReady(false);
  }

  function handleContinue() {
    onNext({
      waiverPdfPreview: pdfPreview,
      firmaTemplateId,
    });
  }

  function handleSkip() {
    onNext({
      waiverPdfPreview: "",
      firmaTemplateId: "",
    });
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Determine if we have a PDF (either freshly selected or previously configured)
  const hasPdf = !!pdfFile || !!pdfPreview;

  return (
    <div className="space-y-section">
      {/* Header info */}
      <div className="p-card bg-light-blue rounded-card border border-navy/10">
        <div className="flex items-start gap-tight">
          <FileSignature size={20} className="text-navy shrink-0 mt-[2px]" />
          <div>
            <p className="text-label text-navy">Digital Waiver</p>
            <p className="text-[13px] text-dark-text mt-micro leading-relaxed">
              Upload your liability waiver as a PDF. Then use the editor below
              to drag and drop signature, date, and initials fields where guests
              need to sign. Every guest signs digitally via Firma.dev before
              boarding.
            </p>
          </div>
        </div>
      </div>

      {/* Legal disclaimer */}
      <div className="p-standard bg-warning-bg rounded-chip flex items-start gap-tight">
        <AlertTriangle
          size={14}
          className="text-warning-text shrink-0 mt-[2px]"
        />
        <p className="text-[12px] text-warning-text">
          BoatCheckin provides this integration as a convenience. Consult a
          maritime attorney to ensure your waiver provides adequate legal
          protection for your jurisdiction and charter type.
        </p>
      </div>

      {/* Waiver Essentials Checklist */}
      <div className="border border-border rounded-card overflow-hidden">
        <div className="p-standard bg-off-white border-b border-border">
          <p className="text-label text-dark-text flex items-center gap-micro">
            <ShieldCheck size={14} className="text-navy" />
            Essential clauses your waiver should include
          </p>
        </div>
        <div className="p-standard space-y-tight">
          {[
            "Voluntary participation and assumption of risk",
            "Release of liability for operator, captain, and crew",
            "Captain\u2019s authority acknowledgement",
            "USCG regulation compliance acknowledgement",
            "Medical fitness confirmation",
            "Alcohol and substance policy",
            "Personal property disclaimer",
            "Governing law (state jurisdiction)",
          ].map((clause) => (
            <p key={clause} className="text-[13px] text-dark-text flex items-center gap-tight">
              <Check size={12} className="text-success-text shrink-0" />
              {clause}
            </p>
          ))}
        </div>
        {/* Download starter waiver */}
        {template?.waiverTemplate && (
          <div className="p-standard border-t border-border bg-off-white">
            <button
              type="button"
              onClick={() => {
                const blob = new Blob([template.waiverTemplate], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${template.label.replace(/\s+/g, '_')}_Waiver_Template.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="text-[12px] text-navy hover:text-mid-blue transition-colors flex items-center gap-micro"
            >
              <Download size={12} />
              Download starter waiver template (.txt)
            </button>
            <p className="text-[10px] text-grey-text mt-micro">
              Pre-written for {template.label}. Edit in Word, save as PDF, then upload below.
            </p>
          </div>
        )}
      </div>

      {/* STATE A — No PDF uploaded */}
      {!hasPdf && !uploading && (
        <div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full py-hero border-2 border-dashed border-border hover:border-navy rounded-card flex flex-col items-center justify-center gap-standard transition-all group cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-light-blue flex items-center justify-center group-hover:bg-navy/10 transition-colors">
              <Upload size={24} className="text-navy" />
            </div>
            <div className="text-center">
              <p className="text-label text-dark-text">
                Upload your waiver PDF
              </p>
              <p className="text-[12px] text-grey-text mt-micro">
                PDF only · Max 10MB
              </p>
            </div>
          </button>
        </div>
      )}

      {/* STATE B — Uploading / Creating template */}
      {uploading && (
        <div className="flex flex-col items-center gap-standard py-hero">
          <AnchorLoader size="md" color="navy" />
          <div className="text-center">
            <p className="text-label text-dark-text">
              Setting up your waiver template…
            </p>
            <p className="text-[12px] text-grey-text mt-micro">
              Uploading PDF and preparing the signature editor
            </p>
          </div>
        </div>
      )}

      {/* STATE C — PDF uploaded, show editor or success */}
      {hasPdf && !uploading && (
        <div className="space-y-standard">
          {/* PDF file info bar */}
          <div className="flex items-center justify-between p-standard bg-off-white rounded-card border border-border">
            <div className="flex items-center gap-tight">
              <File size={20} className="text-navy" />
              <div>
                <p className="text-label text-dark-text">{pdfPreview}</p>
                {pdfFile && (
                  <p className="text-[11px] text-grey-text">
                    {formatFileSize(pdfFile.size)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-tight">
              <button
                onClick={() => fileRef.current?.click()}
                className="text-[12px] text-navy hover:text-mid-blue transition-colors flex items-center gap-micro"
              >
                <RefreshCw size={12} /> Replace
              </button>
              <button
                onClick={removePdf}
                className="text-grey-text hover:text-error-text transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Upload error */}
          {uploadError && (
            <div className="p-standard bg-error-bg rounded-chip text-[13px] text-error-text">
              ⚠️ {uploadError}
              <button
                onClick={() => pdfFile && uploadAndCreateTemplate(pdfFile)}
                className="ml-2 underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Firma Template Editor iframe */}
          {editorJwt && !firmaTemplateId && (
            <div>
              <p className="text-label text-dark-text mb-tight">
                Place signature fields on your waiver
              </p>
              <p className="text-[12px] text-grey-text mb-standard">
                Drag &amp; drop signature, date, and initials blocks where guests
                need to sign. Click &quot;Save&quot; when done.
              </p>
              <div className="w-full h-[700px] border border-border rounded-card bg-white overflow-hidden shadow-sm relative">
                {!editorReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                    <AnchorLoader size="sm" color="navy" />
                  </div>
                )}
                <iframe
                  ref={iframeRef}
                  src={`https://app.firma.dev/embed/templates?jwt=${editorJwt}&theme=light&brandColor=0C447C`}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allow="fullscreen"
                  title="Firma Template Editor"
                  onLoad={() => setEditorReady(true)}
                />
              </div>
            </div>
          )}

          {/* Success state — template saved */}
          {firmaTemplateId && (
            <div className="flex items-center justify-between p-card bg-success-bg rounded-card border border-success-text/20">
              <div className="flex items-center gap-tight">
                <div className="w-8 h-8 rounded-full bg-success-text flex items-center justify-center">
                  <Check size={16} className="text-white" strokeWidth={3} />
                </div>
                <div>
                  <p className="text-label text-success-text">
                    Waiver template configured
                  </p>
                  <p className="text-[12px] text-dark-text">
                    Guests will sign this digitally before boarding
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setFirmaTemplateId("");
                  if (pdfFile) uploadAndCreateTemplate(pdfFile);
                }}
                className="text-[12px] text-success-text hover:text-dark-text transition-colors"
              >
                Edit template
              </button>
            </div>
          )}

          {/* No JWT yet and no error — waiting or already configured */}
          {!editorJwt && !uploadError && !firmaTemplateId && !pdfFile && pdfPreview && (
            <div className="p-standard bg-off-white rounded-card text-center">
              <p className="text-[13px] text-grey-text">
                Previously configured waiver. Upload a new PDF to reconfigure.
              </p>
            </div>
          )}

          {!editorJwt && !uploadError && !firmaTemplateId && pdfFile && (
            <div className="p-standard bg-off-white rounded-card text-center">
              <p className="text-[13px] text-grey-text">
                Template will load after Firma processes your PDF…
              </p>
              <button
                onClick={() => pdfFile && uploadAndCreateTemplate(pdfFile)}
                className="mt-tight text-[12px] text-navy underline"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Skip */}
      <button
        type="button"
        onClick={handleSkip}
        className="text-label text-grey-text hover:text-dark-text transition-colors"
      >
        Skip for now — I&apos;ll configure this later from Settings
      </button>

      <ContinueButton onClick={handleContinue} />
    </div>
  );
}
