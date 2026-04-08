"use client";

import { useState } from "react";
import { z } from "zod";
import { WizardField } from "@/components/ui/WizardField";
import { ContinueButton } from "@/components/ui/ContinueButton";
import { LocationPicker } from "@/components/shared/LocationPicker";
import type { WizardData } from "../types";

const step2Schema = z.object({
  marinaName: z.string().min(2, "Please enter the marina name"),
  marinaAddress: z.string().min(5, "Please enter the marina address"),
  slipNumber: z.string().max(20).optional(),
  parkingInstructions: z.string().max(500).optional(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
});

interface Step2Props {
  data: WizardData;
  onNext: (partial: Partial<WizardData>) => void;
}

export function Step2Marina({ data, onNext }: Step2Props) {
  const [marinaName, setMarinaName] = useState(data.marinaName);
  const [marinaAddress, setMarinaAddress] = useState(data.marinaAddress);
  const [slipNumber, setSlipNumber] = useState(data.slipNumber);
  const [parkingInstructions, setParkingInstructions] = useState(
    data.parkingInstructions
  );
  const [lat, setLat] = useState<number | null>(data.lat);
  const [lng, setLng] = useState<number | null>(data.lng);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleLocationChange(newLat: number, newLng: number) {
    setLat(newLat);
    setLng(newLng);
  }

  function handleContinue() {
    const raw = {
      marinaName,
      marinaAddress,
      slipNumber: slipNumber || undefined,
      parkingInstructions: parkingInstructions || undefined,
      lat,
      lng,
    };

    const result = step2Schema.safeParse(raw);
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
    onNext({ marinaName, marinaAddress, slipNumber, parkingInstructions, lat, lng });
  }

  return (
    <div className="space-y-page">
      {/* Marina name */}
      <WizardField label="Marina name" required error={errors.marinaName} htmlFor="marinaName">
        <input
          id="marinaName"
          value={marinaName}
          onChange={(e) => setMarinaName(e.target.value)}
          placeholder="Miami Beach Marina"
          className="w-full h-[44px] px-standard border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none"
        />
      </WizardField>

      {/* Address */}
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

      {/* Slip number */}
      <WizardField
        label="Slip or dock number"
        helper="Helps guests find the exact location"
        htmlFor="slipNumber"
      >
        <input
          id="slipNumber"
          value={slipNumber}
          onChange={(e) => setSlipNumber(e.target.value)}
          placeholder="14A"
          className="w-full h-[44px] px-standard border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none"
        />
      </WizardField>

      {/* Parking */}
      <WizardField label="Parking" htmlFor="parking">
        <textarea
          id="parking"
          rows={3}
          value={parkingInstructions}
          onChange={(e) => setParkingInstructions(e.target.value)}
          placeholder="Free parking in Lot B off Alton Rd. Enter from 3rd St. Look for green P signs."
          className="w-full min-h-[100px] p-standard border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none resize-none"
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
        {!lat && !lng && marinaAddress.length > 4 && (
          <div className="mt-tight p-standard bg-warning-bg rounded-chip">
            <p className="text-[12px] text-warning-text">
              ⚠️ No location set — guests may have trouble finding your dock.
            </p>
          </div>
        )}
      </div>

      <ContinueButton onClick={handleContinue} />
    </div>
  );
}
