/**
 * Compliance Rubric Engine — 100-point scoring system for boat setup.
 *
 * ARCHITECTURE: The rubric is defined ONCE as `COMPLIANCE_ITEMS`.
 * - The scorer (`calculateComplianceScore`) is a thin reduce over that array.
 * - The UI panel loops the same array — zero hardcoding in either place.
 * - Adding a new compliance requirement = add one entry here. Done.
 *
 * | Category     | Items                                               | Max |
 * |--------------|-----------------------------------------------------|-----|
 * | vessel       | name, type, marina address, passenger capacity      | 25  |
 * | legal        | captain linked, waiver configured                   | 25  |
 * | safety       | USCG equipment, safety cards, card photos           | 30  |
 * | operations   | boat photos, house rules, packing guide             | 20  |
 * |              | TOTAL                                               | 100 |
 */
import type { SupabaseClient } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ComplianceMeta {
  captainCount: number;
  photoCount: number;
}

export interface ComplianceItem {
  /** Stable machine key — never rename once deployed */
  key: string;
  /** Human-readable label shown in the panel */
  label: string;
  /** Max points this item contributes */
  points: number;
  /** UI grouping */
  category: "vessel" | "legal" | "safety" | "operations";
  /** Short regulatory reference shown as a tag (optional) */
  statute?: string;
  /** URL of the page that explains this statute (optional) */
  statuteHref?: string;
  /** Deep-link to the exact wizard step that fixes this item */
  href: (boatId: string) => string;
  /**
   * Returns points EARNED (0..points).
   * Receives the raw boat row + async-resolved meta (captain/photo counts).
   */
  evaluate: (boat: any, meta: ComplianceMeta) => number;
}

// ─── Rubric ───────────────────────────────────────────────────────────────────

export const COMPLIANCE_ITEMS: ComplianceItem[] = [
  // ── VESSEL SETUP ──────────────────────────────────────────────────────────
  {
    key: "boat_name",
    label: "Vessel name",
    points: 5,
    category: "vessel",
    href: (id) => `/dashboard/boats/${id}/edit?step=vessel`,
    evaluate: (boat) =>
      boat.boat_name && boat.boat_name.trim().length > 0 ? 5 : 0,
  },
  {
    key: "boat_type",
    label: "Vessel type",
    points: 5,
    category: "vessel",
    href: (id) => `/dashboard/boats/${id}/edit?step=vessel`,
    evaluate: (boat) =>
      boat.boat_type && boat.boat_type.trim().length > 0 ? 5 : 0,
  },
  {
    key: "marina_address",
    label: "Home marina address",
    points: 10,
    category: "vessel",
    href: (id) => `/dashboard/boats/${id}/edit?step=location`,
    evaluate: (boat) =>
      boat.marina_address && boat.marina_address.trim().length > 0 ? 10 : 0,
  },
  {
    key: "max_capacity",
    label: "Passenger capacity set",
    points: 5,
    category: "vessel",
    statute: "46 CFR §4.06",
    statuteHref: "/standards#capacity",
    href: (id) => `/dashboard/boats/${id}/edit?step=vessel`,
    evaluate: (boat) => (boat.max_capacity && boat.max_capacity > 0 ? 5 : 0),
  },

  // ── LEGAL & WAIVERS ───────────────────────────────────────────────────────
  {
    key: "captain_linked",
    label: "Licensed captain linked",
    points: 10,
    category: "legal",
    statute: "46 CFR §185.506",
    statuteHref: "/standards#captain",
    href: () => `/dashboard/captains`,
    evaluate: (_boat, meta) => (meta.captainCount >= 1 ? 10 : 0),
  },
  {
    key: "waiver",
    label: "Signed waiver configured",
    points: 15,
    category: "legal",
    statute: "ESIGN / UETA",
    statuteHref: "/standards#waiver",
    href: (id) => `/dashboard/boats/${id}/edit?step=waiver`,
    evaluate: (boat) =>
      boat.firma_template_id ||
      (boat.waiver_text && boat.waiver_text !== "[No waiver configured]")
        ? 15
        : 0,
  },

  // ── SAFETY ────────────────────────────────────────────────────────────────
  {
    key: "uscg_equipment",
    label: "USCG safety equipment checked",
    points: 10,
    category: "safety",
    statute: "46 CFR §25.25",
    statuteHref: "/standards#equipment",
    href: (id) => `/dashboard/boats/${id}/edit?step=safety`,
    evaluate: (boat) => {
      const equipment =
        boat.onboard_info?.equipment || boat.equipment || [];
      return Array.isArray(equipment) && equipment.length > 0 ? 10 : 0;
    },
  },
  {
    key: "safety_cards",
    label: "Safety briefing cards created",
    points: 5,
    category: "safety",
    statute: "46 CFR §185.506",
    statuteHref: "/standards#safety-cards",
    href: (id) => `/dashboard/boats/${id}/edit?step=safety`,
    evaluate: (boat) => {
      const cards = Array.isArray(boat.safety_cards) ? boat.safety_cards : [];
      return cards.length > 0 ? 5 : 0;
    },
  },
  {
    key: "safety_card_photos",
    label: "Safety card photos (proportional)",
    points: 15,
    category: "safety",
    statute: "46 CFR §185.506",
    statuteHref: "/standards#safety-cards",
    href: (id) => `/dashboard/boats/${id}/edit?step=safety`,
    evaluate: (boat) => {
      const cards = Array.isArray(boat.safety_cards) ? boat.safety_cards : [];
      if (cards.length === 0) return 0;
      const withPhotos = cards.filter((c: any) => !!c.url || !!c.image_url).length;
      const proportion = Math.min(1, withPhotos / cards.length);
      return Math.round(15 * proportion);
    },
  },

  // ── OPERATIONS ────────────────────────────────────────────────────────────
  {
    key: "boat_photos",
    label: "Vessel photos uploaded (4 required)",
    points: 10,
    category: "operations",
    href: (id) => `/dashboard/boats/${id}/edit?step=photos`,
    evaluate: (_boat, meta) => {
      if (meta.photoCount >= 4) return 10;
      if (meta.photoCount > 0) return Math.round((10 / 4) * meta.photoCount);
      return 0;
    },
  },
  {
    key: "house_rules",
    label: "House rules documented",
    points: 5,
    category: "operations",
    href: (id) => `/dashboard/boats/${id}/edit?step=rules`,
    evaluate: (boat) => {
      const hasRules =
        !!(
          boat.house_rules ||
          (boat.standard_rules && boat.standard_rules.length > 0) ||
          (boat.onboard_info?.standardRules?.length > 0)
        );
      return hasRules ? 5 : 0;
    },
  },
  {
    key: "packing_guide",
    label: "What-to-bring guide set",
    points: 5,
    category: "operations",
    href: (id) => `/dashboard/boats/${id}/edit?step=packing`,
    evaluate: (boat) =>
      boat.what_to_bring || boat.onboard_info?.whatNotToBring ? 5 : 0,
  },
];

// ─── Scorer (thin reduce over the rubric) ─────────────────────────────────────

/**
 * Calculate the 0–100 compliance score for a boat.
 * This is the ONLY place that adds up points — the UI panel calls
 * `item.evaluate()` individually; it does not re-implement scoring.
 */
export async function calculateComplianceScore(
  supabase: SupabaseClient,
  operatorId: string,
  boatId: string | null,
  boatData: any
): Promise<number> {
  // Resolve async meta (captain + photo counts)
  let captainCount = 0;
  let photoCount = 0;

  if (boatId) {
    const [{ count: capCount }, { count: phCount }] = await Promise.all([
      supabase
        .from("captain_boat_links")
        .select("captain_id", { count: "exact", head: true })
        .eq("boat_id", boatId),
      supabase
        .from("boat_photos")
        .select("id", { count: "exact", head: true })
        .eq("boat_id", boatId),
    ]);
    captainCount = capCount ?? 0;
    photoCount = phCount ?? 0;
  }

  const meta: ComplianceMeta = { captainCount, photoCount };

  const total = COMPLIANCE_ITEMS.reduce(
    (sum, item) => sum + item.evaluate(boatData, meta),
    0
  );

  return Math.min(100, Math.max(0, total));
}
