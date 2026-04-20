/**
 * Evaluate the 100-point rubric for boat compliance.
 *
 * | Category | Points |
 * |----------|--------|
 * | Boat name set | 5 |
 * | Boat type set | 5 |
 * | Marina address set | 10 |
 * | Max passengers set | 5 |
 * | ≥ 1 captain linked | 10 |
 * | Waiver uploaded/default | 15 |
 * | All USCG equipment checked | 10 |
 * | Safety cards created (>0) | 5 |
 * | Safety card photos (proportional) | up to 15 |
 * | ≥ 4 boat photos | 10 |
 * | House rules set | 5 |
 * | Packing guide items set | 5 |
 */
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Evaluate the 100-point rubric for boat compliance.
 */
export async function calculateComplianceScore(
  supabase: SupabaseClient,
  operatorId: string,
  boatId: string | null,
  boatData: any
): Promise<number> {
  let score = 0;

  if (boatData.boat_name && boatData.boat_name.trim().length > 0) score += 5;
  if (boatData.boat_type && boatData.boat_type.trim().length > 0) score += 5;
  if (boatData.marina_address && boatData.marina_address.trim().length > 0) score += 10;
  if (boatData.max_capacity && boatData.max_capacity > 0) score += 5;

  let captainCount = 0;
  let photoCount = 0;

  if (boatId) {
    const [{ count: capCount }, { count: phCount }] = await Promise.all([
      supabase.from("captain_boat_links").select("captain_id", { count: "exact", head: true }).eq("boat_id", boatId),
      supabase.from("boat_photos").select("id", { count: "exact", head: true }).eq("boat_id", boatId)
    ]);
    captainCount = capCount ?? 0;
    photoCount = phCount ?? 0;
  }

  if (captainCount >= 1) score += 10;
  
  if (boatData.firma_template_id || (boatData.waiver_text && boatData.waiver_text !== "[No waiver configured]")) {
    score += 15;
  }

  const equipment = boatData.onboard_info?.equipment || boatData.equipment || [];
  if (Array.isArray(equipment) && equipment.length > 0) {
    score += 10;
  }

  const scards = boatData.safety_cards || [];
  const scardsArr = Array.isArray(scards) ? scards : [];
  if (scardsArr.length > 0) {
    score += 5;
    const cardsWithPhotos = scardsArr.filter((c: any) => !!c.url || !!c.image_url).length;
    const proportion = Math.min(1, cardsWithPhotos / scardsArr.length);
    score += Math.round(15 * proportion);
  }

  if (photoCount >= 4) {
    score += 10;
  } else if (photoCount > 0) {
    score += Math.round((10 / 4) * photoCount);
  }

  const hasHouseRules = !!(boatData.house_rules || (boatData.standard_rules && boatData.standard_rules.length > 0) || (boatData.onboard_info?.standardRules?.length > 0));
  if (hasHouseRules) score += 5;

  if (boatData.what_to_bring || boatData.onboard_info?.whatNotToBring) score += 5;

  return Math.min(100, Math.max(0, score));
}
