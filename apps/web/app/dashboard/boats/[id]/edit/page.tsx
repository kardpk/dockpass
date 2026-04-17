import { requireOperator } from "@/lib/security/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { STEP_TITLES } from "../../new/types";
import { BoatEditStepClient } from "./BoatEditStepClient";

interface EditPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ step?: string }>;
}

export default async function BoatEditPage({ params, searchParams }: EditPageProps) {
  const { id } = await params;
  const { step: stepStr } = await searchParams;
  const step = parseInt(stepStr ?? "1");

  // Only steps 1–7 are editable (8 = waiver external, 9 = photos managed separately)
  if (!step || step < 1 || step > 7) redirect(`/dashboard/boats/${id}/edit?step=1`);

  const { operator, supabase } = await requireOperator();

  const { data: boat } = await supabase
    .from("boats")
    .select("*")
    .eq("id", id)
    .eq("operator_id", operator.id)
    .single();

  if (!boat) return notFound();

  const stepTitle = STEP_TITLES[step] ?? "Edit";

  // Map DB row back to WizardData fields for this step
  const onboardInfo = (boat.onboard_info as Record<string, unknown>) ?? {};

  const prefill = {
    // Step 1
    boatName: boat.boat_name ?? "",
    boatType: boat.boat_type ?? "",
    charterType: boat.charter_type ?? "",
    yearBuilt: boat.year_built ? String(boat.year_built) : "",
    lengthFt: boat.length_ft ? String(boat.length_ft) : "",
    maxCapacity: boat.max_capacity ? String(boat.max_capacity) : "",
    // Step 2
    marinaName: boat.marina_name ?? "",
    marinaAddress: boat.marina_address ?? "",
    slipNumber: boat.slip_number ?? "",
    parkingInstructions: boat.parking_instructions ?? "",
    operatingArea: (onboardInfo.operatingArea as string) ?? "",
    lat: boat.lat as number | null,
    lng: boat.lng as number | null,
    // Step 4
    selectedEquipment: (onboardInfo.equipment as string[]) ?? [],
    selectedAmenities: (onboardInfo.amenities as Record<string, boolean>) ?? {},
    specificFieldValues: (onboardInfo.specificFields as Record<string, string | boolean | string[]>) ?? {},
    customDetails: (onboardInfo.customDetails as { label: string; value: string }[]) ?? [],
    // Step 5
    standardRules: (onboardInfo.standardRules as string[]) ?? [],
    customDos: (onboardInfo.dos as string[]) ?? [],
    customDonts: (onboardInfo.donts as string[]) ?? [],
    customRuleSections: (onboardInfo.customRuleSections as { id: string; title: string; items: string[]; type: string }[]) ?? [],
    // Step 6
    whatToBring: boat.what_to_bring ?? "",
    whatNotToBring: (onboardInfo.whatNotToBring as string) ?? "",
    // Step 7
    safetyCards: Array.isArray(boat.safety_cards) ? boat.safety_cards.map((c: Record<string, unknown>) => ({
      id: String(c.id),
      topic_key: String(c.topic_key),
      image_url: (c.url as string) ?? null,
      file: null,
      preview: (c.url as string) ?? "",
      custom_title: c.custom_title ? String(c.custom_title) : undefined,
      instructions: String(c.instructions ?? ""),
      sort_order: Number(c.sort_order ?? 0),
    })) : [],
  };

  return (
    <div className="max-w-[640px] mx-auto pb-[100px]">
      {/* Header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          background: "var(--color-paper)",
          borderBottom: "1px solid var(--color-line-soft)",
          padding: "var(--s-3) var(--s-5)",
          display: "flex",
          alignItems: "center",
          gap: "var(--s-3)",
        }}
      >
        <Link
          href={`/dashboard/boats/${id}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            color: "var(--color-ink-muted)",
            fontSize: 13,
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <ChevronLeft size={14} strokeWidth={2} />
          {boat.boat_name}
        </Link>
        <div style={{ flex: 1, textAlign: "center" }}>
          <p
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--color-ink-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Edit · {stepTitle}
          </p>
        </div>
        <div style={{ width: 80 }} /> {/* spacer to center title */}
      </div>

      {/* Step selector tabs */}
      <div
        style={{
          display: "flex",
          overflowX: "auto",
          scrollbarWidth: "none",
          gap: "var(--s-1)",
          padding: "var(--s-3) var(--s-5)",
          borderBottom: "1px solid var(--color-line-soft)",
        }}
      >
        {([1, 2, 4, 5, 6, 7] as const).map((s) => (
          <Link
            key={s}
            href={`/dashboard/boats/${id}/edit?step=${s}`}
            style={{
              flexShrink: 0,
              padding: "4px 10px",
              borderRadius: 9999,
              fontSize: 12,
              fontWeight: s === step ? 600 : 400,
              background: s === step ? "var(--color-ink)" : "var(--color-bone)",
              color: s === step ? "var(--color-paper)" : "var(--color-ink-muted)",
              border: s === step ? "1px solid var(--color-ink)" : "1px solid var(--color-line)",
              textDecoration: "none",
              transition: "all 0.15s",
            }}
          >
            {STEP_TITLES[s]}
          </Link>
        ))}
      </div>

      {/* Step content — client component handles the form + save */}
      <div style={{ padding: "var(--s-5)" }}>
        <BoatEditStepClient
          boatId={id}
          step={step}
          boatType={boat.boat_type ?? "other"}
          prefill={prefill}
        />
      </div>
    </div>
  );
}
