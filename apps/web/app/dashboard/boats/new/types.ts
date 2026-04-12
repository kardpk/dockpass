export type BoatTypeKey =
  | "motor_yacht"
  | "fishing_charter"
  | "catamaran"
  | "pontoon"
  | "snorkel_dive"
  | "sailing_yacht"
  | "speedboat"
  | "sunset_cruise"
  | "other";

export type CharterType = "captained" | "bareboat" | "both";

export interface SpecificFieldOption {
  value: string;
  label: string;
}

export interface SpecificField {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "multiselect" | "boolean";
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: SpecificFieldOption[];
}

export interface WizardAddon {
  id: string;
  name: string;
  description: string;
  emoji: string;
  priceCents: number;
  maxQuantity: number;
}

export interface CustomRuleSection {
  id: string;
  title: string;
  items: string[];
  type: "bullet" | "numbered" | "check";
}

// ─── Safety Card (USCG 46 CFR / Florida Livery compliance) ───
// Uses topic_key for future global i18n translation.
export interface SafetyCard {
  id: string;
  topic_key: string;         // e.g. "life_jackets", "fire_extinguisher", "custom"
  image_url: string | null;  // Supabase Storage URL after upload (null = not yet uploaded)
  file: File | null;         // Client-only, not serializable to localStorage
  preview: string;           // data URL for client-side display before/during upload
  custom_title?: string;     // Only used when topic_key === "custom"
  instructions: string;      // Captain's boat-specific instructions
  sort_order: number;
}

// ─── Global Safety Dictionary (Admin-managed, multilingual) ───
// Rows in the global_safety_dictionary Supabase table.
// Joined with SafetyCard.topic_key at guest render time.
export interface GlobalSafetyDictEntry {
  topic_key: string;
  language_code: string;
  title: string;
  instructions: string;
  audio_url: string | null;
  emoji: string | null;
}

// ─── Guest Safety Card Data (merged at render time) ───
// Combines Captain's boat-specific photo + admin dictionary translation + audio.
export interface GuestSafetyCardData {
  topic_key: string;
  image_url: string | null;       // from boats.safety_cards (Captain's photo)
  captainInstructions: string;    // from boats.safety_cards (Captain's note)
  title: string;                  // from dictionary (localized)
  instructions: string;           // from dictionary (localized)
  audio_url: string | null;       // from dictionary (pre-recorded MP3)
  emoji: string;                  // from dictionary or fallback
  sort_order: number;
}

// ─── USCG Universal Topics (required for ALL boat types) ───
// 46 CFR Part 185 — Small Passenger Vessel Safety
// Florida SB 606 — Livery Vessel Safety Act
export const USCG_UNIVERSAL_TOPICS = [
  {
    key: "life_jackets",
    label: "Life Jacket Location",
    emoji: "🦺",
    defaultInstructions: "Life jackets are located at ___. Put them on immediately in an emergency.",
  },
  {
    key: "pfd_donning",
    label: "Fitting Your Life Jacket",
    emoji: "🧥",
    defaultInstructions: "Ensure all straps are buckled and pulled tight. Children must wear USCG-approved child-sized PFDs at all times.",
  },
  {
    key: "fire_ext",
    label: "Fire Extinguisher",
    emoji: "🧯",
    defaultInstructions: "Located at ___. Remember P.A.S.S.: Pull pin, Aim at base of fire, Squeeze handle, Sweep side to side.",
  },
  {
    key: "man_overboard",
    label: "Man Overboard",
    emoji: "🛟",
    defaultInstructions: "Shout 'Man Overboard!', keep eyes on them, point continuously, and throw the life ring. Do NOT jump in after them.",
  },
  {
    key: "radio_vhf",
    label: "VHF Radio / Emergency",
    emoji: "📻",
    defaultInstructions: "Use Channel 16 for emergencies ONLY. Press and hold the red Distress button for 3 seconds. State vessel name and position.",
  },
  {
    key: "trash_discharge",
    label: "No Trash Discharge",
    emoji: "🌊",
    defaultInstructions: "It is a federal offense to throw ANY trash, plastic, or waste into the water. All trash goes in onboard bins.",
  },
] as const;

// ─── Boat-Type-Specific Topics (Florida Livery Law F.S. 327.54 / USCG Operator Rules) ───
export const BOAT_SPECIFIC_TOPICS: Record<string, { key: string; label: string; emoji: string; defaultInstructions: string }[]> = {
  speedboat: [
    { key: "ecos_kill_switch", label: "Engine Cut-Off Switch (ECOS)", emoji: "🔑", defaultInstructions: "The operator MUST attach the kill switch lanyard to their person at all times. If the operator falls overboard, the engine cuts immediately. Federal law (Elijah's Law)." },
    { key: "propeller_strike_hazard", label: "Propeller Strike Hazard Zone", emoji: "⚠️", defaultInstructions: "Never swim near the stern when the engine is running or in neutral. The propeller zone extends 10 feet behind the transom." },
    { key: "wake_awareness", label: "Wake Zone Awareness", emoji: "🌊", defaultInstructions: "Reduce speed to idle in no-wake zones. You are responsible for damage caused by your wake." },
  ],
  pwc: [
    { key: "ecos_kill_switch", label: "Engine Cut-Off Switch (ECOS)", emoji: "🔑", defaultInstructions: "Always wear the lanyard. If you fall off, the PWC will stop. Required by federal law." },
    { key: "propeller_strike_hazard", label: "Jet Intake Hazard", emoji: "⚠️", defaultInstructions: "Never put hands, feet, or hair near the jet intake at the rear. Hair entanglement can cause drowning." },
    { key: "pfd_required_always", label: "PFD Required at All Times", emoji: "🦺", defaultInstructions: "All PWC operators and passengers must wear a USCG-approved life jacket AT ALL TIMES while on the water." },
  ],
  pontoon: [
    { key: "weight_distribution", label: "Weight Distribution", emoji: "⚖️", defaultInstructions: "Do not congregate all passengers in the bow or on one side. Keep weight evenly distributed to prevent listing." },
    { key: "railing_safety", label: "Stay Inside Railings", emoji: "🚧", defaultInstructions: "Keep all gates closed while in motion. Do not sit on exterior railings or gates. No riding on the bow." },
    { key: "propeller_zone", label: "Propeller Safety", emoji: "⚠️", defaultInstructions: "Engine must be OFF and in neutral before anyone enters the water or approaches the swim platform." },
  ],
  catamaran: [
    { key: "boom_swing_hazard", label: "Boom Swing Hazard", emoji: "⚠️", defaultInstructions: "The boom swings during tacking and jibing. Listen for 'Ready About!' and duck below the boom immediately." },
    { key: "rigging_line_tension", label: "Rigging & Line Tension", emoji: "🪢", defaultInstructions: "Never wrap lines around hands or fingers. Lines under load can cause severe burns or amputation. Learn winch release." },
    { key: "trampoline_net", label: "Trampoline Net Safety", emoji: "⛵", defaultInstructions: "The trampoline net between hulls is NOT a play area while underway. Waves can wash over it without warning." },
  ],
  sailing_yacht: [
    { key: "boom_swing_hazard", label: "Boom Swing Hazard", emoji: "⚠️", defaultInstructions: "The boom swings during tacking and jibing. Listen for 'Ready About!' and duck below the boom immediately." },
    { key: "rigging_line_tension", label: "Rigging & Line Tension", emoji: "🪢", defaultInstructions: "Never wrap lines around hands or fingers. Lines under load can cause severe burns or amputation. Learn winch release." },
    { key: "heeling_movement", label: "Heeling & Crew Movement", emoji: "⛵", defaultInstructions: "The boat will lean (heel) while sailing — this is normal. Always use handrails when moving. Three points of contact." },
  ],
  motor_yacht: [
    { key: "carbon_monoxide_exhaust", label: "Carbon Monoxide Warning", emoji: "💨", defaultInstructions: "NEVER swim near the exhaust outlets at the stern. CO is invisible and odorless. Teak surfing is LETHAL and prohibited." },
    { key: "deck_hatches", label: "Deck Hatches & Footing", emoji: "🚢", defaultInstructions: "Watch your step around open hatches. Decks may be slippery when wet. Wear non-skid footwear at all times." },
  ],
  fishing_charter: [
    { key: "hook_line_safety", label: "Hook & Line Safety", emoji: "🪝", defaultInstructions: "Announce 'Casting!' before every cast. Be aware of other passengers. If hooked, do NOT pull — notify the captain." },
    { key: "fish_handling", label: "Fish Handling", emoji: "🐟", defaultInstructions: "Many fish have sharp spines, teeth, or barbs. Let the mate handle the catch. Wet decks are extremely slippery." },
    { key: "gaff_storage", label: "Gaff & Sharp Tool Storage", emoji: "🔧", defaultInstructions: "Gaffs and fillet knives are secured in designated holders. Do not handle them without crew supervision." },
  ],
  snorkel_dive: [
    { key: "buddy_system", label: "Buddy System & Dive Flags", emoji: "🤝", defaultInstructions: "Never snorkel or dive alone. Always stay within sight of your buddy. The dive flag MUST be displayed when divers are in the water." },
    { key: "current_awareness", label: "Current Awareness", emoji: "🌊", defaultInstructions: "Assess current direction before entry. Always swim INTO the current first so the return is easier. Signal the boat if drifting." },
  ],
  sunset_cruise: [
    { key: "low_light_navigation", label: "Low-Light Safety", emoji: "🌅", defaultInstructions: "As the sun sets, visibility drops. Stay seated while the vessel is in motion. Watch for trip hazards on deck." },
    { key: "beverage_glass_safety", label: "Beverage & Glass Safety", emoji: "🥂", defaultInstructions: "No glass containers on deck. Secure drinks in holders. Spilled liquids create dangerous slip hazards." },
  ],
};

export interface WizardData {
  // Step 1 — Vessel basics
  boatName: string;
  boatType: BoatTypeKey | "";
  charterType: CharterType | "";
  yearBuilt: string;
  lengthFt: string;
  maxCapacity: string;
  uscgDocNumber: string;
  registrationState: string;

  // Step 2 — Marina
  marinaName: string;
  marinaAddress: string;
  slipNumber: string;
  parkingInstructions: string;
  operatingArea: string;
  lat: number | null;
  lng: number | null;

  // Step 3 — Captain
  captainName: string;
  captainPhotoFile: File | null;
  captainPhotoPreview: string;
  captainBio: string;
  captainLicense: string;
  captainLicenseType: string;
  captainLanguages: string[];
  captainYearsExp: string;
  captainTripCount: string;
  captainRating: string;
  captainCertifications: string[];

  // Step 4 — Equipment & amenities
  selectedEquipment: string[];
  selectedAmenities: Record<string, boolean>;
  specificFieldValues: Record<string, string | boolean | string[]>;
  customDetails: { label: string; value: string }[];

  // Step 5 — Rules
  standardRules: string[];
  customDos: string[];
  customDonts: string[];
  customRuleSections: CustomRuleSection[];

  // Step 6 — Packing guide
  whatToBring: string;
  whatNotToBring: string;

  // Step 7 — Safety cards (USCG compliance)
  safetyCards: SafetyCard[];

  // Step 8 — Waiver (Firma PDF)
  waiverPdfPreview: string;   // filename only (File objects are not serializable)
  firmaTemplateId: string;

  // Step 9 — Photos + add-ons
  boatPhotos: File[];
  boatPhotosPreviews: string[];
  addons: WizardAddon[];
}

export const INITIAL_WIZARD_DATA: WizardData = {
  boatName: "",
  boatType: "",
  charterType: "",
  yearBuilt: "",
  lengthFt: "",
  maxCapacity: "",
  uscgDocNumber: "",
  registrationState: "",
  marinaName: "",
  marinaAddress: "",
  slipNumber: "",
  parkingInstructions: "",
  operatingArea: "",
  lat: null,
  lng: null,
  captainName: "",
  captainPhotoFile: null,
  captainPhotoPreview: "",
  captainBio: "",
  captainLicense: "",
  captainLicenseType: "",
  captainLanguages: ["en"],
  captainYearsExp: "",
  captainTripCount: "",
  captainRating: "",
  captainCertifications: [],
  selectedEquipment: [],
  selectedAmenities: {},
  specificFieldValues: {},
  customDetails: [],
  standardRules: [],
  customDos: [],
  customDonts: [],
  customRuleSections: [],
  whatToBring: "",
  whatNotToBring: "",
  safetyCards: [],
  waiverPdfPreview: "",
  firmaTemplateId: "",
  boatPhotos: [],
  boatPhotosPreviews: [],
  addons: [],
};

export const STEP_TITLES: Record<number, string> = {
  1: "Vessel basics",
  2: "Marina & dock",
  3: "Captain",
  4: "Equipment",
  5: "Rules & conduct",
  6: "Packing guide",
  7: "Safety cards",
  8: "Liability waiver",
  9: "Photos & add-ons",
};

export const TOTAL_STEPS = 9;
