"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { z } from "zod";
import { WizardField } from "@/components/ui/WizardField";
import { ContinueButton } from "@/components/ui/ContinueButton";
import type { BoatTemplate } from "@/lib/wizard/boat-template-types";
import type { WizardData, BoatTypeKey } from "../types";

// Dynamic import — mapbox-gl is 250KB+, only load when Step 2 renders
const LocationPicker = dynamic(
  () => import("@/components/shared/LocationPicker").then(m => m.LocationPicker),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: '100%',
          height: 200,
          background: 'var(--color-bone)',
          borderRadius: 'var(--r-2)',
          border: 'var(--border-w) solid var(--color-line-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-ink-muted)',
          fontSize: 'var(--t-body-sm)',
        }}
      >
        Loading map…
      </div>
    ),
  }
);

const OPERATING_AREA_PLACEHOLDERS: Partial<Record<BoatTypeKey, string>> = {
  motor_yacht: "Biscayne Bay and surrounding coastal waters",
  fishing_charter: "Biscayne Bay, inshore and nearshore waters up to 20 miles",
  sailing_yacht: "Coastal Florida waters, not exceeding 12 nautical miles offshore",
  catamaran: "Biscayne Bay and the Florida Keys",
  snorkel_dive: "Key Largo reefs and John Pennekamp Coral Reef State Park",
  sunset_cruise: "Biscayne Bay sunset circuit departing from Miami Beach Marina",
};

const step2Schema = z.object({
  marinaName: z.string().min(2, "Please enter the marina name"),
  marinaAddress: z.string().min(5, "Please enter the marina address"),
});

interface Step2Props {
  data: WizardData;
  onNext: (partial: Partial<WizardData>) => void;
  template: BoatTemplate | null;
  saveLabel?: string;
}

export function Step2Marina({ data, onNext, saveLabel }: Step2Props) {
  const [marinaName, setMarinaName] = useState(data.marinaName);
  const [marinaAddress, setMarinaAddress] = useState(data.marinaAddress);
  const [slipNumber, setSlipNumber] = useState(data.slipNumber);
  const [parkingInstructions, setParkingInstructions] = useState(data.parkingInstructions);
  const [operatingArea, setOperatingArea] = useState(data.operatingArea);
  const [lat, setLat] = useState<number | null>(data.lat);
  const [lng, setLng] = useState<number | null>(data.lng);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // template prop available if needed for type-specific UI
  const operatingPlaceholder =
    OPERATING_AREA_PLACEHOLDERS[data.boatType as BoatTypeKey] ??
    "e.g. Biscayne Bay and surrounding waters";

  function handleLocationChange(newLat: number, newLng: number) {
    setLat(newLat);
    setLng(newLng);
  }

  function handleContinue() {
    const result = step2Schema.safeParse({ marinaName, marinaAddress });
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
    onNext({ marinaName, marinaAddress, slipNumber, parkingInstructions, operatingArea, lat, lng });
  }

  return (
    <div className="space-y-page">
      <WizardField label="Marina name" required error={errors.marinaName} htmlFor="marinaName">
        <input
          id="marinaName"
          value={marinaName}
          onChange={(e) => setMarinaName(e.target.value)}
          placeholder="Miami Beach Marina"
          className="w-full h-[44px] px-standard border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none"
        />
      </WizardField>

      <WizardField
        label="Marina address"
        required
        helper="This is what guests see and navigate to"
        error={errors.marinaAddress}
        htmlFor="marinaAddress"
      >
        <input
          id="marinaAddress"
          value={marinaAddress}
          onChange={(e) => setMarinaAddress(e.target.value)}
          placeholder="300 Alton Rd, Miami Beach, FL 33139"
          className="w-full h-[44px] px-standard border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none"
        />
      </WizardField>

      <WizardField label="Slip or dock number" helper="Helps guests find the exact location" htmlFor="slipNumber">
        <input
          id="slipNumber"
          value={slipNumber}
          onChange={(e) => setSlipNumber(e.target.value)}
          placeholder="14A"
          className="w-full h-[44px] px-standard border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none"
        />
      </WizardField>

      <WizardField label="Parking" htmlFor="parking">
        <textarea
          id="parking"
          rows={3}
          value={parkingInstructions}
          onChange={(e) => setParkingInstructions(e.target.value)}
          placeholder="Free parking in Lot B off Alton Rd. Enter from 3rd St."
          className="w-full min-h-[100px] p-standard border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none resize-none"
        />
      </WizardField>

      {/* Operating area — new */}
      <WizardField
        label="Where does this vessel operate?"
        helper="Appears on the guest trip page as 'where you'll be going'"
        htmlFor="operatingArea"
      >
        <textarea
          id="operatingArea"
          rows={2}
          value={operatingArea}
          onChange={(e) => setOperatingArea(e.target.value)}
          placeholder={operatingPlaceholder}
          className="w-full min-h-[70px] p-standard border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none resize-none"
        />
      </WizardField>

      {/* Map */}
      <div>
        <p className="text-label text-dark-text mb-tight">Location</p>
        <LocationPicker
          lat={lat}
          lng={lng}
          onLocationChange={handleLocationChange}
          address={marinaAddress}
        />
        {!lat && !lng && marinaAddress.length > 4 ? (
          <div className="mt-tight p-standard bg-warning-bg rounded-chip">
            <p className="text-[12px] text-warning-text">
              No location set — guests may have trouble finding your dock.
            </p>
          </div>
        ) : !/\b\d{5}(?:-\d{4})?\b/.test(marinaAddress) && marinaAddress.length > 4 ? (
          <div className="mt-tight p-standard bg-warning-bg rounded-chip">
            <p className="text-[12px] text-warning-text">
              <span className="font-bold">Tip:</span> Please include a full address with city, state, and zip code to help guests find your dock.
            </p>
          </div>
        ) : null}
      </div>

      <ContinueButton onClick={handleContinue}>{saveLabel}</ContinueButton>
    </div>
  );
}
