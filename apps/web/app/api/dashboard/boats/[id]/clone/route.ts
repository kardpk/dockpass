import { NextRequest, NextResponse } from "next/server";
import { requireOperator } from "@/lib/security/auth";
import type { WizardData } from "@/lib/wizard/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { operator, supabase } = await requireOperator();

    const { data: boat, error } = await supabase
      .from("boats")
      .select("*")
      .eq("id", id)
      .eq("operator_id", operator.id)
      .single();

    if (error || !boat) {
      return NextResponse.json({ error: "Boat not found" }, { status: 404 });
    }

    // Parse onboard_info JSONB
    const onboardInfo = typeof boat.onboard_info === 'object' ? boat.onboard_info ?? {} : {};

    // Remap to partial WizardData rules (Cloned fields: boat type, equipment, safety card text, house rules, DOS/DON'TS, packing guide, waiver. Cleared: name, slip, photos, safety_card photos)
    const safetyCardsRaw = Array.isArray(boat.safety_cards) ? boat.safety_cards : [];
    
    // We intentionally map custom_title, instructions, and topic_key over but strip image_url and id
    const clonedSafetyCards = safetyCardsRaw.map((card: any, idx: number) => ({
      id: crypto.randomUUID(),
      topic_key: card.topic_key,
      custom_title: card.custom_title,
      instructions: card.instructions,
      image_url: null,
      file: null,
      preview: "",
      sort_order: idx,
    }));

    // Construct the partial default dataset to hydrate the wizard
    const clonedWizardData: Partial<WizardData> = {
      // Cloned core
      boatType: boat.boat_type as never,
      charterType: boat.charter_type as never,
      yearBuilt: boat.year_built ? boat.year_built.toString() : "",
      lengthFt: boat.length_ft ? boat.length_ft.toString() : "",
      maxCapacity: boat.max_capacity ? boat.max_capacity.toString() : "",
      uscgDocNumber: boat.onboard_info?.uscgDocNumber || "",
      registrationState: boat.onboard_info?.registrationState || "",
      
      // Geography (cleared slip)
      marinaName: boat.marina_name ?? "",
      marinaAddress: boat.marina_address ?? "",
      parkingInstructions: boat.parking_instructions ?? "",
      operatingArea: onboardInfo.operatingArea ?? "",
      lat: boat.lat,
      lng: boat.lng,
      slipNumber: "", // Cleared

      // Fields cleared
      boatName: "", // Cleared
      boatPhotos: [], // Cleared
      boatPhotosPreviews: [], // Cleared

      // Cloned Captain info (link existing captain ids)
      linkedCaptainIds: [], // We won't carry over crew, or maybe we do? Prompt: "cloned fields: boat type, equipment, safety card text, house rules, DOS/DONTs, packing guide, waiver"

      // Equipment
      selectedEquipment: Array.isArray(onboardInfo.equipment) ? onboardInfo.equipment : [],
      selectedAmenities: typeof onboardInfo.amenities === 'object' ? onboardInfo.amenities : {},
      specificFieldValues: typeof onboardInfo.specificFields === 'object' ? onboardInfo.specificFields : {},
      customDetails: Array.isArray(onboardInfo.customDetails) ? onboardInfo.customDetails : [],

      // Rules
      standardRules: Array.isArray(onboardInfo.standardRules) ? onboardInfo.standardRules : [],
      customDos: Array.isArray(onboardInfo.dos) ? onboardInfo.dos : [],
      customDonts: Array.isArray(onboardInfo.donts) ? onboardInfo.donts : [],
      customRuleSections: Array.isArray(onboardInfo.customRuleSections) ? onboardInfo.customRuleSections : [],

      // Packing
      whatToBring: boat.what_to_bring || "",
      whatNotToBring: onboardInfo.whatNotToBring || "",

      // Safety Cards
      safetyCards: clonedSafetyCards,

      // Waiver
      firmaTemplateId: boat.firma_template_id || "",
    };

    return NextResponse.json({ success: true, data: clonedWizardData });

  } catch (err) {
    console.error("[CloneBoat] exception:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
