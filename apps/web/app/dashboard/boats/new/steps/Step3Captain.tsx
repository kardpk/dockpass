"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils/cn";
import { WizardField } from "@/components/ui/WizardField";
import { ContinueButton } from "@/components/ui/ContinueButton";
import { CircularPhotoUpload } from "@/components/shared/CircularPhotoUpload";
import type { WizardData } from "../types";

const LANGUAGES = [
  { code: "en", flag: "🇬🇧", name: "English" },
  { code: "es", flag: "🇪🇸", name: "Spanish" },
  { code: "pt", flag: "🇵🇹", name: "Portuguese" },
  { code: "fr", flag: "🇫🇷", name: "French" },
  { code: "de", flag: "🇩🇪", name: "German" },
  { code: "it", flag: "🇮🇹", name: "Italian" },
] as const;

const YEARS_OPTIONS = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6-10",
  "10-15",
  "15-20",
  "20+",
];

const step3Schema = z.object({
  captainName: z.string().min(2, "Please enter the captain's name"),
  captainLanguages: z
    .array(z.string())
    .min(1, "Please select at least one language"),
  captainBio: z.string().max(300).optional(),
  captainLicense: z.string().max(50).optional(),
});

interface Step3Props {
  data: WizardData;
  onNext: (partial: Partial<WizardData>) => void;
}

export function Step3Captain({ data, onNext }: Step3Props) {
  const [captainName, setCaptainName] = useState(data.captainName);
  const [captainPhotoFile, setCaptainPhotoFile] = useState<File | null>(
    data.captainPhotoFile
  );
  const [captainPhotoPreview, setCaptainPhotoPreview] = useState(
    data.captainPhotoPreview
  );
  const [captainLicense, setCaptainLicense] = useState(data.captainLicense);
  const [captainYearsExp, setCaptainYearsExp] = useState(data.captainYearsExp);
  const [captainLanguages, setCaptainLanguages] = useState<string[]>(
    data.captainLanguages
  );
  const [captainBio, setCaptainBio] = useState(data.captainBio);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function toggleLanguage(code: string) {
    setCaptainLanguages((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  function handlePhotoSelected(file: File, previewUrl: string) {
    setCaptainPhotoFile(file);
    setCaptainPhotoPreview(previewUrl);
  }

  function handleContinue() {
    const raw = {
      captainName,
      captainLanguages,
      captainBio: captainBio || undefined,
      captainLicense: captainLicense || undefined,
    };

    const result = step3Schema.safeParse(raw);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    onNext({
      captainName,
      captainPhotoFile,
      captainPhotoPreview,
      captainLicense,
      captainYearsExp,
      captainLanguages,
      captainBio,
    });
  }

  const bioRemaining = 300 - captainBio.length;

  return (
    <div className="space-y-page">
      {/* Photo upload */}
      <div className="flex justify-center">
        <CircularPhotoUpload
          preview={captainPhotoPreview}
          onFileSelected={handlePhotoSelected}
        />
      </div>

      {/* Captain name */}
      <WizardField
        label="Captain name"
        required
        error={errors.captainName}
        htmlFor="captainName"
      >
        <input
          id="captainName"
          value={captainName}
          onChange={(e) => setCaptainName(e.target.value)}
          placeholder="Captain Conrad Rivera"
          className="w-full h-[44px] px-standard border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none"
        />
      </WizardField>

      {/* USCG License */}
      <WizardField label="USCG license number" htmlFor="captainLicense">
        <div className="flex items-center gap-tight mb-micro">
          <span className="bg-light-blue text-navy text-[10px] font-semibold px-2 py-[2px] rounded-pill">
            Recommended
          </span>
        </div>
        <input
          id="captainLicense"
          value={captainLicense}
          onChange={(e) => setCaptainLicense(e.target.value)}
          placeholder="e.g. USCG-12345-FL"
          className="w-full h-[44px] px-standard border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none"
        />
        <p className="text-[12px] text-grey-text mt-micro flex items-center gap-micro">
          <Info size={14} className="shrink-0" />
          Required for captained commercial charters
        </p>
      </WizardField>

      {/* Years experience */}
      <WizardField label="Years of experience" htmlFor="captainYearsExp">
        <select
          id="captainYearsExp"
          value={captainYearsExp}
          onChange={(e) => setCaptainYearsExp(e.target.value)}
          className={cn(
            "w-full h-[44px] px-standard border border-border rounded-input text-body focus:border-border-dark focus:outline-none appearance-none bg-white",
            captainYearsExp ? "text-dark-text" : "text-grey-text/50"
          )}
        >
          <option value="" disabled>
            Select experience
          </option>
          {YEARS_OPTIONS.map((yr) => (
            <option key={yr} value={yr}>
              {yr} years
            </option>
          ))}
        </select>
      </WizardField>

      {/* Languages */}
      <WizardField
        label="Languages spoken"
        required
        helper="Guests see this on the trip page"
        error={errors.captainLanguages}
      >
        <div className="flex flex-wrap gap-tight">
          {LANGUAGES.map((lang) => {
            const selected = captainLanguages.includes(lang.code);
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => toggleLanguage(lang.code)}
                className={cn(
                  "px-standard py-[6px] rounded-pill text-label transition-all",
                  selected
                    ? "bg-navy text-white border border-navy"
                    : "bg-white text-grey-text border border-border hover:border-border-dark"
                )}
              >
                {lang.flag} {lang.name}
              </button>
            );
          })}
        </div>
      </WizardField>

      {/* Bio */}
      <WizardField label="About the captain" htmlFor="captainBio">
        <textarea
          id="captainBio"
          rows={4}
          maxLength={300}
          value={captainBio}
          onChange={(e) => setCaptainBio(e.target.value)}
          placeholder="USCG licensed captain with 7 years experience on Biscayne Bay. 124 trips, 4.9 star rating. Specialises in sunset cruises and snorkelling tours."
          className="w-full min-h-[100px] p-standard border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none resize-none"
        />
        <p
          className={cn(
            "text-[11px] text-right mt-[2px]",
            bioRemaining < 20 ? "text-error-text" : "text-grey-text"
          )}
        >
          {captainBio.length} / 300
        </p>
      </WizardField>

      <ContinueButton onClick={handleContinue} />
    </div>
  );
}
