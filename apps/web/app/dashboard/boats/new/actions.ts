"use server";

import { requireOperator } from "@/lib/security/auth";
import { auditLog } from "@/lib/security/audit";
import { generateShortBoardToken } from "@/lib/utils/shortBoardToken";
import { calculateComplianceScore } from "@/lib/wizard/compliance";
import type { WizardAddon } from "./types";

/**
 * Server action: Save complete boat profile to Supabase.
 * Called when operator completes all 9 wizard steps.
 *
 * Flow:
 * 1. requireOperator() — auth check
 * 2. Boat count check against subscription tier
 * 3. INSERT into boats table (with safety_cards JSONB + firma_template_id)
 * 4. INSERT addons if any
 * 5. auditLog boat_created
 * 6. Return { boatId }
 */

interface SaveBoatResult {
  success: boolean;
  boatId?: string;
  error?: string;
}

export async function saveBoatProfile(data: {
  // Serializable data only (no File objects)
  boatName: string;
  boatType: string;
  charterType: string;
  yearBuilt: string;
  lengthFt: string;
  maxCapacity: string;
  uscgDocNumber: string;
  registrationState: string;

  marinaName: string;
  marinaAddress: string;
  slipNumber: string;
  parkingInstructions: string;
  operatingArea: string;
  lat: number | null;
  lng: number | null;

  // Step 3 — Crew linking (captain IDs selected from existing roster)
  linkedCaptainIds: string[];

  selectedEquipment: string[];
  selectedAmenities: Record<string, boolean>;
  specificFieldValues: Record<string, string | boolean | string[]>;
  customDetails: { label: string; value: string }[];

  standardRules: string[];
  customDos: string[];
  customDonts: string[];
  customRuleSections: { id: string; title: string; items: string[]; type: string }[];

  whatToBring: string;
  whatNotToBring: string;

  // Step 7 — Safety cards (USCG compliance, serialized)
  safetyCards: {
    id: string;
    topic_key: string;
    image_url: string;
    custom_title?: string;
    instructions: string;
    sort_order: number;
  }[];

  // Step 8 — Firma waiver
  firmaTemplateId: string;

  addons: WizardAddon[];
}): Promise<SaveBoatResult> {
  try {
    // 1. Auth
    const { operator, supabase } = await requireOperator();

    // 2. Boat count check
    const { count } = await supabase
      .from("boats")
      .select("id", { count: "exact", head: true })
      .eq("operator_id", operator.id)
      .eq("is_active", true);

    if ((count ?? 0) >= operator.max_boats) {
      return { success: false, error: "Boat limit reached for your subscription tier." };
    }

    // 3. Build house_rules text from structured data
    const houseRulesText = [
      "HOUSE RULES:",
      ...data.standardRules.map((r, i) => `${i + 1}. ${r}`),
      "",
      "DOs:",
      ...data.customDos.map((d) => `✓ ${d}`),
      "",
      "DON'Ts:",
      ...data.customDonts.map((d) => `✗ ${d}`),
    ].join("\n");

    // 4. Build safety_cards JSONB for the database column
    const safetyCardsJson = data.safetyCards.map((card, i) => ({
      id: card.id,
      topic_key: card.topic_key,
      custom_title: card.custom_title || null,
      instructions: card.instructions,
      sort_order: i,
      url: card.image_url || null,
    }));

    // 5. Calculate compliance score
    const boatPayload = {
      boat_name: data.boatName,
      boat_type: data.boatType,
      max_capacity: parseInt(data.maxCapacity) || 1,
      marina_address: data.marinaAddress,
      waiver_text: data.firmaTemplateId ? "[Firma PDF Waiver — template configured]" : "[No waiver configured]",
      firma_template_id: data.firmaTemplateId || null,
      house_rules: houseRulesText,
      what_to_bring: data.whatToBring || null,
      safety_cards: safetyCardsJson,
      onboard_info: {
        equipment: data.selectedEquipment,
        amenities: data.selectedAmenities,
        specificFields: data.specificFieldValues,
        customDetails: data.customDetails,
        captainCertifications: data.captainCertifications,
        captainLicenseType: data.captainLicenseType,
        whatNotToBring: data.whatNotToBring,
        uscgDocNumber: data.uscgDocNumber,
        registrationState: data.registrationState,
        operatingArea: data.operatingArea,
        standardRules: data.standardRules,
        dos: data.customDos,
        donts: data.customDonts,
        customRuleSections: data.customRuleSections,
      }
    };

    const initialScore = await calculateComplianceScore(supabase, operator.id, null, boatPayload);

    // 6. INSERT boat
    const { data: boat, error: boatError } = await supabase
      .from("boats")
      .insert({
        operator_id: operator.id,
        boat_name: data.boatName,
        boat_type: data.boatType,
        charter_type: data.charterType,
        year_built: data.yearBuilt ? parseInt(data.yearBuilt) : null,
        length_ft: data.lengthFt ? parseFloat(data.lengthFt) : null,
        max_capacity: parseInt(data.maxCapacity) || 1,
        marina_name: data.marinaName,
        marina_address: data.marinaAddress,
        slip_number: data.slipNumber || null,
        parking_instructions: data.parkingInstructions || null,
        lat: data.lat,
        lng: data.lng,
        captain_name: data.captainName || null,
        captain_bio: data.captainBio || null,
        captain_license: data.captainLicense || null,
        captain_languages: data.captainLanguages,
        captain_years_exp: data.captainYearsExp ? parseInt(data.captainYearsExp) : null,
        captain_trip_count: data.captainTripCount ? parseInt(data.captainTripCount) : null,
        captain_rating: data.captainRating ? parseFloat(data.captainRating) : null,
        what_to_bring: data.whatToBring || null,
        house_rules: houseRulesText,
        waiver_text: boatPayload.waiver_text,
        firma_template_id: boatPayload.firma_template_id,
        safety_cards: safetyCardsJson,
        onboard_info: boatPayload.onboard_info,
        is_active: true,
        compliance_score: initialScore,
      })
      .select("id")
      .single();

    if (boatError || !boat) {
      console.error("[saveBoatProfile] boats INSERT failed:", boatError);
      return { success: false, error: boatError?.message ?? "Failed to save boat." };
    }

    // 5b. Assign short_board_token immediately after getting the boat.id
    //     This is done as a separate UPDATE so the INSERT stays clean.
    //     Non-fatal if it fails — backfill endpoint covers it.
    const shortToken = generateShortBoardToken(boat.id, data.boatName);
    const { error: tokenError } = await supabase
      .from("boats")
      .update({ short_board_token: shortToken })
      .eq("id", boat.id)
      .is("short_board_token", null); // idempotency: only set if not already assigned
    if (tokenError) {
      console.warn("[saveBoatProfile] short_board_token assign failed (non-fatal):", tokenError.message);
    }
    // 6. INSERT addons
    if (data.addons.length > 0) {
      const addonRows = data.addons.map((addon, i) => ({
        boat_id: boat.id,
        operator_id: operator.id,
        name: addon.name,
        description: addon.description || null,
        emoji: addon.emoji || "",
        price_cents: addon.priceCents,
        max_quantity: addon.maxQuantity || 10,
        sort_order: i,
        is_available: true,
      }));

      const { error: addonsError } = await supabase.from("addons").insert(addonRows);
      if (addonsError) {
        console.error("[saveBoatProfile] addons INSERT failed:", addonsError);
      }
    }

    // 7. Link pre-existing crew members to this boat (selected on Step 3)
    // Captains are managed exclusively via the Crew tab; the wizard only links them.
    const linkedIds: string[] = Array.isArray(data.linkedCaptainIds)
      ? data.linkedCaptainIds.filter(Boolean)
      : [];

    if (linkedIds.length > 0) {
      const linkRows = linkedIds.map((captainId) => ({
        captain_id:  captainId,
        boat_id:     boat.id,
        operator_id: operator.id,
      }));

      const { error: linkError } = await supabase
        .from('captain_boat_links')
        .upsert(linkRows, { onConflict: 'captain_id,boat_id', ignoreDuplicates: true });

      if (linkError) {
        console.error('[saveBoatProfile] captain_boat_links upsert failed (non-fatal):', linkError);
      }
    }


    // 7. Audit log
    auditLog({
      action: "boat_created",
      operatorId: operator.id,
      actorType: "operator",
      actorIdentifier: operator.id,
      entityType: "boat",
      entityId: boat.id,
      changes: {
        boatName: data.boatName,
        boatType: data.boatType,
        charterType: data.charterType,
        addonCount: data.addons.length,
        safetyCardCount: data.safetyCards.length,
        firmaConfigured: !!data.firmaTemplateId,
      },
    });

    return { success: true, boatId: boat.id };
  } catch (err: unknown) {
    console.error("[saveBoatProfile] unexpected error:", err);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// updateBoatStep — targeted UPDATE for edit-mode wizard (single step at a time)
// Called from /dashboard/boats/[id]/edit when captain edits one step and saves.
// ─────────────────────────────────────────────────────────────────────────────
export async function updateBoatStep(
  boatId: string,
  step: number,
  data: Partial<Parameters<typeof saveBoatProfile>[0]>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { operator, supabase } = await requireOperator();

    // Build the partial update payload based on which step is being saved
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const patch: Record<string, any> = {};

    if (step === 1) {
      if (data.boatName !== undefined) patch.boat_name = data.boatName;
      if (data.boatType !== undefined) patch.boat_type = data.boatType;
      if (data.charterType !== undefined) patch.charter_type = data.charterType;
      if (data.yearBuilt !== undefined) patch.year_built = data.yearBuilt ? parseInt(data.yearBuilt) : null;
      if (data.lengthFt !== undefined) patch.length_ft = data.lengthFt ? parseFloat(data.lengthFt) : null;
      if (data.maxCapacity !== undefined) patch.max_capacity = parseInt(data.maxCapacity) || 1;
    }

    if (step === 2) {
      if (data.marinaName !== undefined) patch.marina_name = data.marinaName;
      if (data.marinaAddress !== undefined) patch.marina_address = data.marinaAddress;
      if (data.slipNumber !== undefined) patch.slip_number = data.slipNumber || null;
      if (data.parkingInstructions !== undefined) patch.parking_instructions = data.parkingInstructions || null;
      if (data.lat !== undefined) patch.lat = data.lat;
      if (data.lng !== undefined) patch.lng = data.lng;
    }

    if (step === 4) {
      // Equipment, amenities, specificFields stored in onboard_info JSONB
      const { data: existing } = await supabase
        .from("boats")
        .select("onboard_info")
        .eq("id", boatId)
        .eq("operator_id", operator.id)
        .single();
      const existingInfo = (existing?.onboard_info as Record<string, unknown>) ?? {};
      patch.onboard_info = {
        ...existingInfo,
        equipment: data.selectedEquipment,
        amenities: data.selectedAmenities,
        specificFields: data.specificFieldValues,
        customDetails: data.customDetails,
      };
    }

    if (step === 5) {
      const { data: existing } = await supabase
        .from("boats")
        .select("onboard_info")
        .eq("id", boatId)
        .eq("operator_id", operator.id)
        .single();
      const existingInfo = (existing?.onboard_info as Record<string, unknown>) ?? {};
      const houseRulesText = [
        "HOUSE RULES:",
        ...(data.standardRules ?? []).map((r, i) => `${i + 1}. ${r}`),
        "",
        "DOs:",
        ...(data.customDos ?? []).map((d) => `✓ ${d}`),
        "",
        "DON'Ts:",
        ...(data.customDonts ?? []).map((d) => `✗ ${d}`),
      ].join("\n");
      patch.house_rules = houseRulesText;
      patch.onboard_info = {
        ...existingInfo,
        standardRules: data.standardRules,
        dos: data.customDos,
        donts: data.customDonts,
        customRuleSections: data.customRuleSections,
      };
    }

    if (step === 6) {
      if (data.whatToBring !== undefined) patch.what_to_bring = data.whatToBring || null;
      const { data: existing } = await supabase
        .from("boats")
        .select("onboard_info")
        .eq("id", boatId)
        .eq("operator_id", operator.id)
        .single();
      const existingInfo = (existing?.onboard_info as Record<string, unknown>) ?? {};
      patch.onboard_info = { ...existingInfo, whatNotToBring: data.whatNotToBring };
    }

    if (step === 7) {
      if (data.safetyCards !== undefined) {
        patch.safety_cards = data.safetyCards.map((card, i) => ({
          id: card.id,
          topic_key: card.topic_key,
          custom_title: card.custom_title || null,
          instructions: card.instructions,
          sort_order: i,
          url: card.image_url || null,
        }));
      }
    }

    if (Object.keys(patch).length === 0) {
      // Even if no specific step fields updated, photo count might have changed (e.g. step 9 upload).
      // We will still re-evaluate compliance score.
    }

    const { data: currentBoat } = await supabase
      .from("boats")
      .select("*")
      .eq("id", boatId)
      .eq("operator_id", operator.id)
      .single();

    if (currentBoat) {
      const mergedBoat = { ...currentBoat, ...patch };
      const newScore = await calculateComplianceScore(supabase, operator.id, boatId, mergedBoat);
      patch.compliance_score = newScore;
    }

    const { error } = await supabase
      .from("boats")
      .update(patch)
      .eq("id", boatId)
      .eq("operator_id", operator.id);

    if (error) {
      console.error("[updateBoatStep] UPDATE failed:", error);
      return { success: false, error: error.message };
    }

    auditLog({
      action: "boat_updated",
      operatorId: operator.id,
      actorType: "operator",
      actorIdentifier: operator.id,
      entityType: "boat",
      entityId: boatId,
      changes: { step },
    });

    return { success: true };
  } catch (err) {
    console.error("[updateBoatStep] unexpected error:", err);
    return { success: false, error: "An unexpected error occurred." };
  }
}

