"use client";

import { useRef, useState } from "react";
import { Anchor } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { validateUpload } from "@/lib/security/uploads";
import { AnchorLoader } from "@/components/ui/AnchorLoader";

interface CircularPhotoUploadProps {
  preview: string;
  onFileSelected: (file: File, previewUrl: string) => void;
  error?: string;
}

export function CircularPhotoUpload({
  preview,
  onFileSelected,
  error,
}: CircularPhotoUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  function handleClick() {
    fileRef.current?.click();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = validateUpload(file);
    if (!result.valid) {
      setUploadError(result.error ?? "Invalid file");
      return;
    }

    setUploadError("");
    setLoading(true);

    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      onFileSelected(file, url);
      setLoading(false);
    };
    reader.onerror = () => {
      setUploadError("Failed to read file");
      setLoading(false);
    };
    reader.readAsDataURL(file);
  }

  const displayError = error ?? uploadError;

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "w-[80px] h-[80px] rounded-full flex items-center justify-center overflow-hidden transition-all relative group",
          preview
            ? "border-2 border-success-text"
            : "border-2 border-dashed border-border"
        )}
      >
        {loading ? (
          <AnchorLoader size="sm" color="navy" />
        ) : preview ? (
          <>
            <img
              src={preview}
              alt="Captain photo"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-[11px] font-medium">
                Change
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-[2px]">
            <Anchor size={24} className="text-grey-text" />
          </div>
        )}
      </button>

      {!preview && !loading && (
        <span className="text-micro text-grey-text mt-micro">Photo</span>
      )}

      {displayError && (
        <p className="text-[12px] text-error-text mt-micro text-center">
          {displayError}
        </p>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
