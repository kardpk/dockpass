/**
 * Boat Type Template System
 *
 * The intelligence layer of the wizard. When an operator selects a boat type,
 * this file provides all pre-loaded content for every subsequent step.
 * 9 boat types, each with deep research-driven defaults.
 *
 * SERVER-ONLY: This file is ~50KB and must never be bundled into the client.
 * The wizard accesses templates via /api/dashboard/wizard/template/[boatType].
 * NOTE: `import "server-only"` removed due to Turbopack PoisonError bug.
 * Protection is enforced at the API route level instead.
 */


import type { BoatTypeKey, WizardData, SpecificField } from "@/app/dashboard/boats/new/types";

export interface BoatTemplate {
  label: string;
  emoji: string;
  description: string;
  standardEquipment: string[];
  optionalEquipment: string[];
  amenityGroups: {
    title: string;
    items: { key: string; label: string; default: boolean }[];
  }[];
  specificFields: SpecificField[];
  standardRules: string[];
  standardDos: string[];
  standardDonts: string[];
  whatToBring: string[];
  whatNotToBring: string[];
  safetyPoints: string[];
  waiverTemplate: string;
  suggestedAddons: {
    name: string;
    description: string;
    emoji: string;
    suggestedPrice: number;
  }[];
}

// ─────────────────────────────────────
// MOTOR YACHT
// ─────────────────────────────────────

const motorYacht: BoatTemplate = {
  label: "Motor Yacht",
  emoji: "🛥️",
  description: "Luxury motor vessel, captained experience",

  standardEquipment: [
    "Life jackets for all passengers",
    "VHF radio (Channel 16)",
    "First aid kit",
    "Fire extinguisher",
    "Flares and signalling devices",
    "GPS / chart plotter",
    "Bluetooth sound system",
  ],
  optionalEquipment: [
    "Air conditioning (main cabin)",
    "Generator onboard",
    "Swim platform",
    "Snorkel gear",
    "Kayak / paddleboard",
    "Water toys",
    "Tender / dinghy",
    "Underwater LED lighting",
    "Satellite internet",
  ],

  amenityGroups: [
    {
      title: "Comfort",
      items: [
        { key: "ac", label: "Air conditioning", default: true },
        { key: "heads", label: "Onboard bathroom", default: true },
        { key: "galley", label: "Galley kitchen", default: false },
        { key: "salon", label: "Indoor salon", default: false },
        { key: "flybridge", label: "Flybridge / upper deck", default: false },
      ],
    },
    {
      title: "Entertainment",
      items: [
        { key: "bluetooth", label: "Bluetooth speaker", default: true },
        { key: "tv", label: "TV onboard", default: false },
        { key: "led_lighting", label: "LED mood lighting", default: false },
        { key: "bar", label: "Bar setup / ice", default: true },
      ],
    },
    {
      title: "Water activities",
      items: [
        { key: "swim_platform", label: "Swim platform", default: true },
        { key: "swim_ladder", label: "Swim ladder", default: true },
        { key: "snorkel", label: "Snorkel gear included", default: false },
        { key: "floating_mat", label: "Floating mat", default: false },
      ],
    },
  ],

  specificFields: [
    {
      key: "yacht_length",
      label: "Vessel length (ft)",
      type: "number",
      required: false,
      placeholder: "42",
      helpText: "Approximate length in feet",
    },
    {
      key: "captain_license_type",
      label: "Captain license type",
      type: "select",
      required: false,
      options: [
        { value: "oupv", label: "OUPV / 6-Pack (up to 6 passengers)" },
        { value: "master_25", label: "Master 25 Ton" },
        { value: "master_50", label: "Master 50 Ton" },
        { value: "master_100", label: "Master 100 Ton" },
        { value: "master_200", label: "Master 200 Ton+" },
      ],
    },
    {
      key: "fuel_policy",
      label: "Fuel pricing",
      type: "select",
      required: false,
      options: [
        { value: "included", label: "Fuel included in charter price" },
        { value: "per_quarter", label: "Charged per quarter tank used" },
        { value: "per_hour", label: "Fuel surcharge per hour" },
        { value: "deposit", label: "Security deposit, refunded unused" },
      ],
    },
    {
      key: "gratuity_expectation",
      label: "Gratuity guidance for guests",
      type: "select",
      required: false,
      options: [
        { value: "none", label: "No gratuity expected" },
        { value: "10_percent", label: "10% is appreciated" },
        { value: "15_percent", label: "15% is standard" },
        { value: "20_percent", label: "20% is customary" },
        { value: "at_discretion", label: "At guest discretion" },
      ],
    },
  ],

  standardRules: [
    "Maximum passenger count must be observed at all times",
    "Captain's instructions must be followed immediately",
    "Coast Guard regulations apply at all times",
    "No swimming without captain's approval",
  ],
  standardDos: [
    "Wear non-marking soft-soled shoes on deck",
    "Apply sunscreen before boarding",
    "Stay seated when vessel is underway",
    "Inform captain of any medical conditions",
    "Ask captain before jumping in the water",
    "Bring a light jacket for return trips in the evening",
  ],
  standardDonts: [
    "No stilettos, heels, or hard-soled shoes on deck",
    "No red wine or dark liquids on deck or in the cabin",
    "No smoking anywhere on the vessel",
    "No throwing anything overboard",
    "Do not touch navigational equipment",
    "No standing on furniture",
  ],

  whatToBring: [
    "Valid government-issued photo ID",
    "Sunscreen (SPF 30 or higher)",
    "Sunglasses and hat",
    "Towel",
    "Light jacket or wrap for evenings",
    "Non-marking soft-soled shoes",
    "Motion sickness medication if prone",
    "Cash for gratuity",
    "Reusable water bottle",
  ],
  whatNotToBring: [
    "High heels or hard-soled shoes",
    "Glass bottles (cans or plastic only)",
    "Large hard-sided coolers",
    "Sharp objects",
    "Illegal substances",
    "Pets (unless previously agreed)",
  ],

  safetyPoints: [
    "Life jackets are located [location]. Each passenger must know where theirs is.",
    "This vessel communicates on VHF Channel 16. In any emergency, hail the US Coast Guard.",
    "The fire extinguisher is located [location].",
    "Muster station in an emergency is the stern swim platform.",
    "Do not attempt to re-board from the water without captain assistance.",
    "No swimming without explicit captain approval and a lookout designated.",
  ],

  waiverTemplate: `CHARTER AGREEMENT AND LIABILITY WAIVER

I, the undersigned, hereby acknowledge and agree to the following terms and conditions for participating in a private boat charter operated by [OPERATOR NAME] ("the Operator").

1. VOLUNTARY PARTICIPATION
I acknowledge that I am voluntarily participating in a recreational boating activity. I understand that boating activities involve inherent risks, including but not limited to: capsizing, falling overboard, collision, equipment failure, adverse weather, and personal injury.

2. ASSUMPTION OF RISK
I voluntarily assume all risks associated with this charter activity, whether foreseeable or unforeseeable, known or unknown.

3. RELEASE OF LIABILITY
I hereby release, waive, and discharge the Operator, its owners, captains, crew members, and agents from any and all claims, demands, or causes of action arising from my participation in this charter.

4. CAPTAIN'S AUTHORITY
I agree to follow all instructions given by the captain at all times. The captain has absolute authority over vessel operations and passenger safety. Failure to comply with captain's instructions may result in immediate return to dock.

5. US COAST GUARD REGULATIONS
I acknowledge that this vessel operates under United States Coast Guard regulations. All safety requirements, including life jacket availability and usage, apply throughout the charter.

6. ALCOHOL POLICY
Consumption of alcohol is permitted at the operator's discretion. No guest may operate the vessel while impaired.

7. PROPERTY AND PERSONAL BELONGINGS
The Operator is not responsible for any lost, stolen, or damaged personal belongings.

8. MEDICAL CONDITIONS
I confirm that I am medically fit to participate in boating activities. I have disclosed any relevant medical conditions to the captain.

9. GOVERNING LAW
This agreement shall be governed by the laws of the State of Florida.

By signing below, I confirm that I have read, understood, and agree to all terms above.`,

  suggestedAddons: [
    { name: "Champagne & Fruit Platter", description: "Premium bottle + seasonal fruit", emoji: "🥂", suggestedPrice: 8500 },
    { name: "Professional Photographer", description: "Onboard photography for your group", emoji: "📸", suggestedPrice: 15000 },
    { name: "Catered Lunch Package", description: "Fresh sandwiches, salads, snacks", emoji: "🍱", suggestedPrice: 3500 },
    { name: "Snorkel Equipment Set", description: "Mask, fins, snorkel per person", emoji: "🤿", suggestedPrice: 2500 },
    { name: "Floating Island / Lily Pad", description: "Large inflatable platform for the water", emoji: "🌊", suggestedPrice: 4000 },
  ],
};

// ─────────────────────────────────────
// FISHING CHARTER
// ─────────────────────────────────────

const fishingCharter: BoatTemplate = {
  label: "Fishing Charter",
  emoji: "🎣",
  description: "Sportfishing, inshore, offshore, or flats",

  standardEquipment: [
    "Fishing rods and reels (matching capacity)",
    "Tackle and terminal tackle",
    "Live bait well",
    "Fish finder / depth sounder",
    "Rod holders",
    "Cooler with ice",
    "Life jackets for all passengers",
    "VHF radio",
    "First aid kit",
    "Sunscreen station",
  ],
  optionalEquipment: [
    "Outriggers",
    "Downriggers",
    "Trolling motor",
    "GPS / chart plotter with waypoints",
    "Underwater lights (night fishing)",
    "GoPro / camera mount",
  ],

  amenityGroups: [
    {
      title: "Fishing setup",
      items: [
        { key: "live_bait", label: "Live bait provided", default: true },
        { key: "artificial_lures", label: "Artificial lures provided", default: true },
        { key: "light_tackle", label: "Light tackle available", default: true },
        { key: "heavy_tackle", label: "Heavy / offshore tackle", default: false },
        { key: "fish_cleaning", label: "Fish cleaning included", default: false },
        { key: "fillet_service", label: "Fillet & pack service", default: false },
      ],
    },
    {
      title: "Comfort",
      items: [
        { key: "cooler", label: "Cooler with ice provided", default: true },
        { key: "shade", label: "Shade / Bimini top", default: true },
        { key: "heads", label: "Onboard bathroom", default: false },
        { key: "cabin", label: "Cabin / indoor area", default: false },
      ],
    },
  ],

  specificFields: [
    {
      key: "fishing_type",
      label: "Primary fishing type",
      type: "multiselect",
      required: true,
      options: [
        { value: "inshore", label: "Inshore (redfish, snook, trout)" },
        { value: "nearshore", label: "Nearshore (grouper, snapper)" },
        { value: "offshore", label: "Offshore (mahi, tuna, wahoo)" },
        { value: "deep_sea", label: "Deep sea (marlin, sailfish)" },
        { value: "flats", label: "Flats fishing (tarpon, bonefish)" },
        { value: "reef", label: "Reef fishing" },
        { value: "freshwater", label: "Freshwater (bass, catfish)" },
      ],
      helpText: "Select all that apply",
    },
    {
      key: "target_species",
      label: "Primary target species",
      type: "text",
      required: false,
      placeholder: "e.g. Mahi-Mahi, Snapper, Grouper, Tarpon",
      helpText: "What fish do guests most commonly catch?",
    },
    {
      key: "license_policy",
      label: "Florida fishing license",
      type: "select",
      required: true,
      options: [
        { value: "vessel_license", label: "Vessel has charter license — guests covered" },
        { value: "guests_bring", label: "Guests must bring their own license" },
        { value: "captain_assists", label: "Captain can help guests purchase online" },
      ],
      helpText: "Florida law requires a valid fishing license",
    },
    {
      key: "catch_policy",
      label: "What happens to the catch?",
      type: "select",
      required: true,
      options: [
        { value: "keep_all", label: "Guests keep their catch" },
        { value: "catch_release", label: "Catch and release only" },
        { value: "keep_selective", label: "Keep within legal limits, release rest" },
        { value: "guest_choice", label: "Guest's choice within regulations" },
      ],
    },
    {
      key: "max_fishing_range",
      label: "Maximum distance from shore",
      type: "select",
      required: false,
      options: [
        { value: "bay_only", label: "Bay / inshore only" },
        { value: "10_miles", label: "Up to 10 miles offshore" },
        { value: "20_miles", label: "Up to 20 miles offshore" },
        { value: "50_miles", label: "Up to 50 miles offshore" },
        { value: "unlimited", label: "No restriction (weather permitting)" },
      ],
    },
  ],

  standardRules: [
    "Florida fishing license regulations apply at all times",
    "All size and bag limits as per FWC regulations",
    "Captain determines fishing locations",
    "No fishing from the bow while underway",
  ],
  standardDos: [
    "Tell the captain what species you are targeting",
    "Wear non-marking, closed-toe shoes with grip",
    "Apply sunscreen 30 minutes before departure",
    "Bring polarised sunglasses",
    "Stay hydrated — fishing trips are long",
    "Listen to the captain's casting instructions",
  ],
  standardDonts: [
    "Do not cast without captain's instruction",
    "No crossing lines with other anglers",
    "Do not touch fish with dry hands (catch and release)",
    "No alcohol before or during fishing (impairs reflexes)",
    "Do not stand on gunwales or bow while underway",
    "No removing hooks — let the mate handle it",
  ],

  whatToBring: [
    "Valid Florida fishing license (if not covered by vessel)",
    "Polarised sunglasses (essential)",
    "Sunscreen SPF 50+ and lip balm",
    "Hat or cap with brim",
    "Closed-toe shoes with non-slip soles",
    "Light rain jacket or windbreaker",
    "Motion sickness medication (taken the night before)",
    "Snacks and water (long trips)",
    "Camera or GoPro",
  ],
  whatNotToBring: [
    "Flip flops or open-toe shoes",
    "Strong cologne or perfume (attracts bugs)",
    "Excessive personal gear",
    "Glass bottles",
  ],

  safetyPoints: [
    "Life jackets are located [location]. Children under 6 must wear at all times.",
    "Hooks are extremely sharp — never run on deck.",
    "If a hook embeds in skin: do not remove it. Inform captain immediately.",
    "VHF Channel 16 monitored at all times.",
    "Emergency position: sit low and hold on when underway at speed.",
    "Motion sickness: inform captain immediately — do not wait.",
  ],

  waiverTemplate: `SPORTFISHING CHARTER AGREEMENT AND LIABILITY WAIVER

I acknowledge that sportfishing activities involve inherent risks including but not limited to: hook injuries, slipping on wet decks, sun exposure, seasickness, fish-related injuries, and adverse ocean conditions.

I voluntarily assume all risks associated with this charter and release the Operator from all liability.

FISHING REGULATIONS: I agree to comply with all applicable federal, state, and local fishing regulations including bag limits, size limits, and licensing requirements.

INJURY FROM EQUIPMENT: I acknowledge that fishing equipment including rods, hooks, gaffs, and knives are potentially dangerous and I will follow all captain and mate instructions regarding their use.

CAPTAIN'S AUTHORITY: The captain has absolute authority over vessel operations and safety.

By signing below, I confirm that I have read, understood, and agree to all terms above.`,

  suggestedAddons: [
    { name: "Premium Live Bait Upgrade", description: "Live pilchards, goggle-eyes, or threadfins", emoji: "🐟", suggestedPrice: 3500 },
    { name: "Fish Cleaning & Filleting", description: "Professional cleaning and packing to go", emoji: "🔪", suggestedPrice: 2500 },
    { name: "GoPro Rental", description: "Waterproof camera for your catch moments", emoji: "🎥", suggestedPrice: 2000 },
    { name: "Fishing License (FWC)", description: "3-day Florida non-resident license", emoji: "📋", suggestedPrice: 3200 },
    { name: "Cooler with Ice & Drinks", description: "Pre-stocked cooler with water, sodas, ice", emoji: "🧊", suggestedPrice: 2500 },
  ],
};

// ─────────────────────────────────────
// CATAMARAN
// ─────────────────────────────────────

const catamaran: BoatTemplate = {
  label: "Catamaran",
  emoji: "⛵",
  description: "Sail or power catamaran, stable platform",

  standardEquipment: [
    "Life jackets for all passengers",
    "VHF radio and EPIRB",
    "First aid kit",
    "Fire extinguishers",
    "Life raft (offshore)",
    "GPS / chart plotter",
    "Trampolines fore-deck",
  ],
  optionalEquipment: [
    "Snorkel gear set",
    "Paddleboards",
    "Kayaks",
    "Underwater camera",
    "Hammock",
    "Waterslide",
  ],

  amenityGroups: [
    {
      title: "Onboard facilities",
      items: [
        { key: "salon", label: "Indoor salon", default: true },
        { key: "galley", label: "Full galley kitchen", default: true },
        { key: "heads", label: "Bathroom (heads)", default: true },
        { key: "cabins", label: "Overnight cabins", default: false },
        { key: "generator", label: "Generator", default: false },
        { key: "watermaker", label: "Watermaker", default: false },
      ],
    },
    {
      title: "Entertainment",
      items: [
        { key: "bluetooth", label: "Bluetooth sound system", default: true },
        { key: "trampoline", label: "Fore-deck trampolines", default: true },
        { key: "bar", label: "Bar setup", default: true },
      ],
    },
  ],

  specificFields: [
    {
      key: "cat_type",
      label: "Catamaran type",
      type: "select",
      required: true,
      options: [
        { value: "sailing_cat", label: "Sailing catamaran" },
        { value: "power_cat", label: "Power catamaran" },
        { value: "hybrid", label: "Hybrid (sail + motor)" },
      ],
    },
    {
      key: "beam_width",
      label: "Beam width (ft)",
      type: "number",
      required: false,
      placeholder: "22",
    },
    {
      key: "overnight_capable",
      label: "Available for overnight charters",
      type: "boolean",
      required: false,
      helpText: "Do you offer multi-day liveaboard charters?",
    },
  ],

  standardRules: [
    "Weight must be distributed evenly port and starboard",
    "No jumping off trampolines while underway",
    "Both stern boarding steps only — no climbing hulls",
    "Life jackets mandatory when sailing in open water",
  ],
  standardDos: [
    "Move slowly and deliberately between hulls",
    "Hold handrails when moving forward on trampolines",
    "Sit on or below the trampoline netting, not on the bow rails",
    "Inform captain of non-swimmers in the group",
  ],
  standardDonts: [
    "No jumping off trampolines while vessel is moving",
    "Do not stand on gunwales",
    "No leaning overboard",
    "No glass on the trampoline netting",
  ],

  whatToBring: [
    "Swimwear and towel",
    "Non-marking deck shoes",
    "Sunscreen and hat",
    "Light layers for sailing (wind chill)",
    "Motion sickness tablets",
    "Waterproof bag for valuables",
  ],
  whatNotToBring: [
    "Hard-soled shoes",
    "Glass bottles",
    "Heavy luggage (limited storage)",
  ],

  safetyPoints: [
    "Life jackets under the salon seating.",
    "VHF Channel 16 monitored at all times.",
    "Boom can swing unexpectedly during tack — duck on command.",
    "Both hulls have bilge pumps and emergency exits.",
    "MOB (Man Overboard) procedure: shout MOB, point continuously, do not jump in.",
  ],

  waiverTemplate: `SAILING CHARTER AGREEMENT AND LIABILITY WAIVER

I acknowledge that sailing and catamaran activities involve inherent risks including but not limited to: boom injuries, trampoline falls, seasickness, unexpected weather changes, and open water swimming hazards.

I voluntarily assume all risks and release the Operator from all liability.

CAPTAIN'S AUTHORITY: The captain has absolute authority over vessel operations and safety.

By signing below, I confirm that I have read, understood, and agree to all terms above.`,

  suggestedAddons: [
    { name: "Snorkel Package", description: "Full equipment per person", emoji: "🤿", suggestedPrice: 2500 },
    { name: "Paddleboard Rental", description: "SUP board per person", emoji: "🏄", suggestedPrice: 3000 },
    { name: "Catered Lunch", description: "Fresh food prepared onboard", emoji: "🥗", suggestedPrice: 4500 },
    { name: "Kayak Rental", description: "Single kayak per session", emoji: "🚣", suggestedPrice: 2000 },
  ],
};

// ─────────────────────────────────────
// PONTOON / PARTY BOAT
// ─────────────────────────────────────

const pontoon: BoatTemplate = {
  label: "Pontoon / Party Boat",
  emoji: "🎉",
  description: "High-capacity party or leisure pontoon",

  standardEquipment: [
    "Life jackets for all passengers",
    "Bimini top for shade",
    "Swim ladder",
    "Bluetooth sound system",
    "Cooler and ice",
    "VHF radio",
  ],
  optionalEquipment: [
    "Water slide",
    "Floating island / lily pad",
    "Tube for towing",
    "Wakeboard / water skis",
    "Grill onboard",
    "Underwater LED lighting",
    "Livewell",
  ],

  amenityGroups: [
    {
      title: "Party features",
      items: [
        { key: "sound_system", label: "Bluetooth sound system", default: true },
        { key: "cooler", label: "Cooler with ice provided", default: true },
        { key: "shade", label: "Bimini / shade top", default: true },
        { key: "grill", label: "Onboard grill", default: false },
        { key: "led_lights", label: "Underwater LED lights", default: false },
        { key: "slide", label: "Water slide", default: false },
      ],
    },
    {
      title: "Towable sports",
      items: [
        { key: "tube", label: "Tube towing", default: false },
        { key: "wakeboard", label: "Wakeboarding", default: false },
        { key: "water_ski", label: "Water skiing", default: false },
      ],
    },
  ],

  specificFields: [
    {
      key: "weight_limit",
      label: "Maximum weight limit (lbs)",
      type: "number",
      required: true,
      placeholder: "2000",
      helpText: "Total weight capacity including passengers and gear",
    },
    {
      key: "bathroom_policy",
      label: "Bathroom facilities",
      type: "select",
      required: true,
      options: [
        { value: "no_bathroom", label: "No bathroom — plan stops accordingly" },
        { value: "portable_toilet", label: "Portable toilet onboard" },
        { value: "full_heads", label: "Full marine toilet (heads)" },
      ],
    },
    {
      key: "alcohol_policy",
      label: "Alcohol policy",
      type: "select",
      required: true,
      options: [
        { value: "byob", label: "BYOB — guests bring their own" },
        { value: "provided", label: "Alcohol provided (in charter price)" },
        { value: "no_alcohol", label: "No alcohol permitted" },
        { value: "add_on", label: "Alcohol available as add-on" },
      ],
    },
    {
      key: "swim_area",
      label: "Designated swim areas",
      type: "text",
      required: false,
      placeholder: "e.g. Nixon Sandbar, Haulover Sandbar",
      helpText: "Where do you typically stop for swimming?",
    },
  ],

  standardRules: [
    "Passenger capacity must not be exceeded at any time",
    "Weight limit must be respected",
    "Life jackets available for all — required for children under 6",
    "No standing on the boat while underway",
    "Captain's instructions are final",
  ],
  standardDos: [
    "Stay seated when the boat is moving",
    "Use swim ladder — do not jump from railings",
    "Apply sunscreen before getting on the water",
    "Drink plenty of water",
    "Designate a responsible person per group",
  ],
  standardDonts: [
    "No standing on seats or railings",
    "No glass containers",
    "No swimming near the engine",
    "No excessive alcohol consumption",
    "Do not overload one side of the boat",
    "No smoking near the fuel tank",
  ],

  whatToBring: [
    "Swimwear and towel",
    "Sunscreen SPF 50+",
    "Hat and sunglasses",
    "Cooler with drinks if BYOB",
    "Snacks (bring your own)",
    "Water shoes or flip flops",
    "Change of dry clothes",
    "Waterproof phone case",
  ],
  whatNotToBring: [
    "Glass bottles or containers",
    "Large hard-sided coolers",
    "Sharp objects",
    "Too much personal gear",
  ],

  safetyPoints: [
    "Life jackets are under the front seats.",
    "Children under 6 must wear life jackets at all times.",
    "VHF Channel 16 monitored throughout the trip.",
    "Swim only with the swim ladder — no jumping from railings.",
    "Stay clear of the propeller area when swimming.",
    "Maximum capacity is [location] — no exceptions.",
  ],

  waiverTemplate: `PONTOON CHARTER AGREEMENT AND LIABILITY WAIVER

I acknowledge participation in a recreational pontoon boat charter and understand risks including: slipping, falling overboard, sun exposure, and waterway hazards.

I voluntarily assume all risks and release the Operator from all liability.

WEIGHT AND CAPACITY: I confirm that the total party weight is within the vessel's stated capacity. Overloading is a serious safety violation.

CAPTAIN'S AUTHORITY: The captain has absolute authority over vessel operations and safety.

By signing below, I confirm that I have read, understood, and agree to all terms above.`,

  suggestedAddons: [
    { name: "Floating Island / Lily Pad", description: "6x15ft inflatable floating platform", emoji: "🌊", suggestedPrice: 4000 },
    { name: "Cooler Package", description: "Pre-stocked cooler with ice, waters, sodas", emoji: "🧊", suggestedPrice: 3000 },
    { name: "Bluetooth Speaker Upgrade", description: "Premium waterproof speaker rental", emoji: "🎵", suggestedPrice: 2000 },
    { name: "Tube Towing Session", description: "Inflatable tube + tow rope", emoji: "🚤", suggestedPrice: 2500 },
    { name: "Photographer", description: "Onboard photographer for the group", emoji: "📸", suggestedPrice: 12000 },
  ],
};

// ─────────────────────────────────────
// SNORKEL / DIVE
// ─────────────────────────────────────

const snorkelDive: BoatTemplate = {
  label: "Snorkel / Dive Charter",
  emoji: "🤿",
  description: "Reef snorkelling and scuba diving",

  standardEquipment: [
    "Snorkel masks and fins (all sizes)",
    "Flotation devices / noodles",
    "Dive flag (required by law)",
    "Life jackets for all passengers",
    "First aid kit with O2 unit",
    "VHF radio",
    "Anchor and mooring equipment",
  ],
  optionalEquipment: [
    "BCD and regulators (scuba)",
    "Wetsuit rental (various sizes)",
    "Air tanks",
    "Underwater torch",
    "Underwater camera rental",
    "Coral reef ID cards",
    "Drysuit (cold water)",
  ],

  amenityGroups: [
    {
      title: "Snorkel equipment",
      items: [
        { key: "masks", label: "Masks and snorkels included", default: true },
        { key: "fins", label: "Fins included", default: true },
        { key: "vests", label: "Snorkel vests included", default: true },
        { key: "prescription", label: "Prescription masks available", default: false },
        { key: "kids_gear", label: "Children's gear available", default: true },
      ],
    },
    {
      title: "Scuba diving",
      items: [
        { key: "tanks", label: "Air tanks provided", default: false },
        { key: "bcd", label: "BCDs available for rent", default: false },
        { key: "regulators", label: "Regulators available for rent", default: false },
        { key: "wetsuits", label: "Wetsuit rental available", default: false },
        { key: "divemaster", label: "Certified divemaster onboard", default: false },
      ],
    },
  ],

  specificFields: [
    {
      key: "cert_requirement",
      label: "Certification required for scuba",
      type: "select",
      required: false,
      options: [
        { value: "none", label: "No — snorkel only, no scuba" },
        { value: "open_water", label: "PADI Open Water or equivalent" },
        { value: "advanced", label: "PADI Advanced Open Water or equivalent" },
        { value: "any_cert", label: "Any recognised certification" },
      ],
    },
    {
      key: "max_depth",
      label: "Maximum diving depth",
      type: "select",
      required: false,
      options: [
        { value: "surface", label: "Surface only (snorkel)" },
        { value: "15ft", label: "Up to 15ft (beginner)" },
        { value: "40ft", label: "Up to 40ft (open water)" },
        { value: "60ft", label: "Up to 60ft (advanced)" },
        { value: "130ft", label: "Up to 130ft (divemaster)" },
      ],
    },
    {
      key: "dive_sites",
      label: "Primary dive / snorkel sites",
      type: "text",
      required: false,
      placeholder: "e.g. Molasses Reef, Christ of the Abyss, Pennekamp",
      helpText: "Where do you typically take guests?",
    },
    {
      key: "divemaster_ratio",
      label: "Divemaster to diver ratio",
      type: "select",
      required: false,
      options: [
        { value: "1:4", label: "1 divemaster per 4 divers" },
        { value: "1:6", label: "1 divemaster per 6 divers" },
        { value: "1:8", label: "1 divemaster per 8 divers" },
        { value: "no_divemaster", label: "No divemaster (certified divers only)" },
      ],
    },
  ],

  standardRules: [
    "Never dive alone — buddy system mandatory",
    "No touching, standing on, or collecting coral",
    "Dive flag must be deployed at all times",
    "Ascend slowly — maximum 30ft per minute",
    "Safety stop at 15ft for 3 minutes on all dives over 30ft",
  ],
  standardDos: [
    "Equalise ear pressure frequently when descending",
    "Signal OK to buddy every 30 seconds",
    "Stay with your buddy at all times",
    "Inform captain of any medical conditions including asthma",
    "Pre-hydrate well before diving",
    "Check gear before entering the water",
  ],
  standardDonts: [
    "No touching, holding, or collecting any marine life",
    "Do not stand on coral reefs",
    "No diving after alcohol consumption",
    "Do not fly within 18 hours of diving (DCS risk)",
    "No removing anything from the ocean",
    "Do not feed fish",
  ],

  whatToBring: [
    "Swimwear",
    "Rash guard or wetsuit (optional)",
    "Towel",
    "Sunscreen (reef-safe only)",
    "Underwater camera (optional)",
    "Motion sickness medication",
    "Proof of dive certification (if scuba)",
    "Snacks and water",
  ],
  whatNotToBring: [
    "Regular sunscreen (harmful to coral — reef-safe only)",
    "Jewellery (lost easily in water)",
    "Contact lenses (unless sealed in prescription mask)",
  ],

  safetyPoints: [
    "Reef-safe sunscreen only — regular sunscreen kills coral.",
    "Dive flag deployed before any water entry.",
    "Buddy system — no solo swimming away from the vessel.",
    "Life jackets under the bow seats.",
    "O2 unit onboard for dive emergencies.",
    "DAN (Divers Alert Network) emergency: +1-919-684-9111",
  ],

  waiverTemplate: `SNORKEL AND DIVING CHARTER AGREEMENT AND LIABILITY WAIVER

I acknowledge that snorkelling and scuba diving involve specific risks including but not limited to: decompression sickness, air embolism, marine life encounters, drowning, disorientation, and equipment failure.

MEDICAL FITNESS: I confirm I am medically fit to dive/snorkel. I do not have any of the following conditions without physician approval: asthma, heart conditions, epilepsy, recent surgery, pregnancy, or ear/sinus problems.

CERTIFICATION: For scuba activities, I confirm I hold the stated certification level and my skills are current.

I voluntarily assume all risks and release the Operator from all liability.

By signing below, I confirm that I have read, understood, and agree to all terms above.`,

  suggestedAddons: [
    { name: "Underwater Camera Rental", description: "GoPro or sealife camera", emoji: "🎥", suggestedPrice: 2500 },
    { name: "Full Wetsuit Rental", description: "Full suit for comfort in cooler water", emoji: "🤿", suggestedPrice: 1500 },
    { name: "PADI Discover Scuba", description: "Intro dive session with divemaster", emoji: "🌊", suggestedPrice: 8500 },
    { name: "Reef-Safe Sunscreen", description: "Protect the reef and yourself", emoji: "☀️", suggestedPrice: 800 },
  ],
};

// ─────────────────────────────────────
// SAILING YACHT
// ─────────────────────────────────────

const sailingYacht: BoatTemplate = {
  label: "Sailing Yacht",
  emoji: "⛵",
  description: "Classic or modern sailing yacht",

  standardEquipment: [
    "Life jackets and harnesses for all",
    "EPIRB and PLB",
    "Life raft",
    "VHF radio and AIS",
    "Flares",
    "Storm sails",
    "First aid kit",
  ],
  optionalEquipment: [
    "Autopilot",
    "Windlass (electric anchor)",
    "Watermaker",
    "Solar panels",
    "SSB / satellite phone",
  ],

  amenityGroups: [
    {
      title: "Navigation",
      items: [
        { key: "chartplotter", label: "Chart plotter / GPS", default: true },
        { key: "ais", label: "AIS transponder", default: true },
        { key: "autopilot", label: "Autopilot", default: false },
        { key: "radar", label: "Radar", default: false },
      ],
    },
    {
      title: "Accommodation",
      items: [
        { key: "heads", label: "Onboard bathroom", default: true },
        { key: "galley", label: "Galley kitchen", default: true },
        { key: "cabins", label: "Sleeping berths / cabins", default: false },
        { key: "ac", label: "Air conditioning", default: false },
      ],
    },
  ],

  specificFields: [
    {
      key: "sailing_experience_required",
      label: "Sailing experience required",
      type: "select",
      required: true,
      options: [
        { value: "none", label: "None — fully crewed, relax and enjoy" },
        { value: "basic", label: "Basic — guests may help with lines" },
        { value: "intermediate", label: "Intermediate — ASA 101 or equivalent" },
        { value: "advanced", label: "Advanced — ASA 103/104 or equivalent" },
      ],
    },
    {
      key: "bareboat_cert",
      label: "Bareboat certification accepted",
      type: "text",
      required: false,
      placeholder: "e.g. ASA 104, RYA Coastal Skipper",
    },
    {
      key: "offshore_capable",
      label: "Offshore passages",
      type: "boolean",
      required: false,
      helpText: "Available for overnight or offshore passages?",
    },
  ],

  standardRules: [
    "All crew instructions regarding sail handling must be followed",
    "Boom swings unexpectedly — always be aware of your head",
    "Safety harness required offshore and at night",
    "No interference with helm or navigation equipment",
  ],
  standardDos: [
    "Duck when you hear \"Ready about\" or \"Tacking\"",
    "Move to the high side when boat heels (leans)",
    "Clip on safety harness when offshore",
    "Inform skipper of seasickness early",
  ],
  standardDonts: [
    "Do not touch lines, winches, or sheets without instruction",
    "Do not stand in path of swinging boom",
    "No crossing in front of the mast when underway",
    "Do not lean over rails offshore",
  ],

  whatToBring: [
    "Non-marking deck shoes with grip soles",
    "Layered clothing (it's colder on a sailboat)",
    "Waterproof jacket / foul weather gear",
    "Motion sickness medication",
    "Sunscreen and polarised sunglasses",
    "Small soft bag (no hard luggage)",
    "Sea bands / acupressure wristbands",
  ],
  whatNotToBring: [
    "Hard-sided luggage",
    "High heels",
    "Strong perfume",
    "Large electronics",
  ],

  safetyPoints: [
    "Life jackets and harnesses stored at the nav station.",
    "Life raft located at stern.",
    "EPIRB registered and armed — located at companionway.",
    "Boom covers the entire cockpit — duck on all tacks.",
    "MOB procedure: shout Man Overboard, press GPS MOB button, point at person, do not lose sight.",
    "VHF Channel 16 at all times. Pan-Pan for urgent, Mayday for distress.",
  ],

  waiverTemplate: `SAILING CHARTER AGREEMENT AND LIABILITY WAIVER

I acknowledge that sailing activities involve risks including: capsizing, boom injuries, seasickness, rough weather, and open water hazards.

I voluntarily assume all risks and release the Operator from all liability.

CAPTAIN'S AUTHORITY: The captain has absolute authority over vessel operations and safety.

By signing below, I confirm that I have read, understood, and agree to all terms above.`,

  suggestedAddons: [
    { name: "Sailing Lesson (1 hour)", description: "Learn to helm and trim sails", emoji: "⛵", suggestedPrice: 5000 },
    { name: "Sunset Wine Cruise Package", description: "Wine, cheese, and crackers selection", emoji: "🍷", suggestedPrice: 4500 },
    { name: "Snorkel Stop Package", description: "Gear for anchored snorkel session", emoji: "🤿", suggestedPrice: 2500 },
  ],
};

// ─────────────────────────────────────
// SPEEDBOAT / BOWRIDER
// ─────────────────────────────────────

const speedboat: BoatTemplate = {
  label: "Speedboat / Bowrider",
  emoji: "💨",
  description: "High-performance speed and wake sports",

  standardEquipment: [
    "Life jackets for all passengers",
    "Swim platform",
    "Sound system",
    "VHF radio or cell",
  ],
  optionalEquipment: [
    "Wakeboard tower",
    "Ballast bags",
    "Tow rope and handle",
    "Tube",
    "Water skis",
    "Hydrofoil board",
  ],

  amenityGroups: [
    {
      title: "Wake sports",
      items: [
        { key: "wakeboard", label: "Wakeboarding setup", default: false },
        { key: "water_ski", label: "Water skiing setup", default: false },
        { key: "wake_surf", label: "Wake surfing (ballast)", default: false },
        { key: "tube", label: "Tube towing", default: false },
        { key: "hydrofoil", label: "Hydrofoil board", default: false },
      ],
    },
  ],

  specificFields: [
    {
      key: "top_speed",
      label: "Top speed (approximate mph)",
      type: "number",
      required: false,
      placeholder: "55",
    },
    {
      key: "sports_included",
      label: "Wake sports included in price",
      type: "boolean",
      required: true,
      helpText: "Are wake sports equipment and instruction included?",
    },
  ],

  standardRules: [
    "Life jackets required for all wake sports activities",
    "Spotter must be present when towing",
    "No wake sports within 200ft of shore or other vessels",
    "Operator determines safe conditions for sports",
  ],
  standardDos: [
    "Wear a properly fitted life jacket for ALL water sports",
    "Signal to the boat clearly if you fall",
    "Wait for the all-clear before swimming toward the boat",
    "Let the instructor know your experience level honestly",
  ],
  standardDonts: [
    "Do not swim near the propeller",
    "No unsupervised water sports",
    "Do not attempt tricks without captain approval",
    "No alcohol before water sports",
  ],

  whatToBring: [
    "Swimwear",
    "Rashguard or wetsuit",
    "Towel",
    "Sunscreen",
    "Change of clothes",
    "Closed-toe water shoes",
  ],
  whatNotToBring: [
    "Loose jewellery (removed before water sports)",
    "Contact lenses without goggles",
  ],

  safetyPoints: [
    "Life jackets must be worn for ALL tow sports — no exceptions.",
    "Spotter required at all times during towing.",
    "Hand signals: thumbs up = faster, thumbs down = slower, wave = done.",
    "If you fall: stay still and raise one arm.",
    "Do not approach the engine area when in the water.",
  ],

  waiverTemplate: `POWERBOAT AND WATERSPORTS CHARTER AGREEMENT

I acknowledge risks including high-speed boating, wake sports injuries, falls, and propeller hazards.

I voluntarily assume all risks and release the Operator from all liability.

CAPTAIN'S AUTHORITY: The captain has absolute authority over vessel operations and safety.

By signing below, I confirm that I have read, understood, and agree to all terms above.`,

  suggestedAddons: [
    { name: "Wakeboard Lesson (30 min)", description: "Instruction for beginners", emoji: "🏄", suggestedPrice: 4500 },
    { name: "GoPro Rental", description: "Capture your runs", emoji: "🎥", suggestedPrice: 2000 },
    { name: "Tube Session", description: "Fun for the whole group", emoji: "🚤", suggestedPrice: 2000 },
  ],
};

// ─────────────────────────────────────
// SUNSET CRUISE / TOUR
// ─────────────────────────────────────

const sunsetCruise: BoatTemplate = {
  label: "Sunset Cruise / Tour",
  emoji: "🌅",
  description: "Scenic cruises, sunset tours, sightseeing",

  standardEquipment: [
    "Life jackets for all passengers",
    "Sound system",
    "Deck seating for all",
    "Lighting for evening return",
    "VHF radio",
  ],
  optionalEquipment: [
    "Bar setup",
    "Live music setup",
    "Microphone for narration",
    "Mood lighting",
  ],

  amenityGroups: [
    {
      title: "Entertainment",
      items: [
        { key: "sound_system", label: "Sound system", default: true },
        { key: "bar", label: "Bar setup", default: true },
        { key: "lighting", label: "Mood / ambient lighting", default: false },
        { key: "live_music", label: "Live music option", default: false },
        { key: "narration", label: "Commentary / narration", default: false },
      ],
    },
  ],

  specificFields: [
    {
      key: "route_type",
      label: "Route type",
      type: "select",
      required: true,
      options: [
        { value: "fixed", label: "Fixed route (same every trip)" },
        { value: "flexible", label: "Flexible (captain recommends)" },
        { value: "custom", label: "Fully customisable by guest" },
      ],
    },
    {
      key: "bar_type",
      label: "Bar service",
      type: "select",
      required: true,
      options: [
        { value: "open_bar", label: "Open bar included in price" },
        { value: "cash_bar", label: "Cash bar onboard" },
        { value: "byob", label: "BYOB welcome" },
        { value: "no_alcohol", label: "No alcohol" },
        { value: "add_on", label: "Drinks available as add-on" },
      ],
    },
  ],

  standardRules: [
    "Remain seated during departure and arrival",
    "No leaning over railings for photos",
    "Alcohol consumption responsibly only",
    "Captain determines safe weather conditions",
  ],
  standardDos: [
    "Arrive 15 minutes before departure",
    "Bring a jacket — it gets cool on the water at sunset",
    "Have your camera ready — sunsets are quick",
    "Choose your preferred side early for sunset viewing",
  ],
  standardDonts: [
    "Do not lean over railings for selfies",
    "No swimming from a moving vessel",
    "Do not bring outside food or drinks (check policy)",
    "No standing on furniture or railings",
  ],

  whatToBring: [
    "Light jacket or wrap",
    "Camera",
    "Sunglasses",
    "Comfortable shoes (no heels)",
    "Small bag only",
  ],
  whatNotToBring: [
    "High heels",
    "Large bags or backpacks",
    "Outside alcohol (check policy)",
  ],

  safetyPoints: [
    "Life jackets under seats.",
    "Remain seated during manoeuvring.",
    "No swimming from vessel during cruise.",
    "In an emergency: VHF Channel 16.",
  ],

  waiverTemplate: `SUNSET CRUISE PARTICIPATION AGREEMENT

I acknowledge participation in a recreational boat cruise and understand associated risks.

I voluntarily assume all risks and release the Operator from all liability.

CAPTAIN'S AUTHORITY: The captain has absolute authority over vessel operations and safety.

By signing below, I confirm that I have read, understood, and agree to all terms above.`,

  suggestedAddons: [
    { name: "Champagne Toast Package", description: "Sparkling wine for the sunset moment", emoji: "🥂", suggestedPrice: 6500 },
    { name: "Charcuterie Board", description: "Cheese, meats, crackers, fruit", emoji: "🧀", suggestedPrice: 4500 },
    { name: "Professional Photos", description: "Golden hour photography session", emoji: "📸", suggestedPrice: 12000 },
    { name: "Live Acoustic Set", description: "1-hour musician onboard", emoji: "🎸", suggestedPrice: 20000 },
  ],
};

// ─────────────────────────────────────
// OTHER
// ─────────────────────────────────────

const other: BoatTemplate = {
  label: "Other vessel",
  emoji: "🚢",
  description: "Custom vessel type",

  standardEquipment: ["Life jackets for all", "VHF radio", "First aid kit"],
  optionalEquipment: [],
  amenityGroups: [],
  specificFields: [],
  standardRules: ["Follow captain's instructions at all times"],
  standardDos: ["Wear appropriate footwear", "Apply sunscreen"],
  standardDonts: ["No glass bottles", "No throwing objects overboard"],
  whatToBring: ["Valid ID", "Sunscreen", "Towel"],
  whatNotToBring: ["Glass bottles", "Sharp objects"],
  safetyPoints: ["Life jackets located onboard", "VHF Channel 16 for emergencies"],
  waiverTemplate: `CHARTER AGREEMENT AND LIABILITY WAIVER

I acknowledge risks of boating activities and voluntarily assume all risks. I release the Operator from all liability.

By signing below, I confirm that I have read, understood, and agree to all terms above.`,
  suggestedAddons: [],
};

// ─────────────────────────────────────
// EXPORT MAP
// ─────────────────────────────────────

export const BOAT_TEMPLATES: Record<BoatTypeKey, BoatTemplate> = {
  motor_yacht: motorYacht,
  fishing_charter: fishingCharter,
  catamaran,
  pontoon,
  snorkel_dive: snorkelDive,
  sailing_yacht: sailingYacht,
  speedboat,
  sunset_cruise: sunsetCruise,
  other,
};

export function getBoatTemplate(type: BoatTypeKey): BoatTemplate {
  return BOAT_TEMPLATES[type];
}

/**
 * Pre-fill wizard data from a boat type template.
 * Called when operator selects boat type in Step 1.
 */
export function getDefaultsFromTemplate(
  type: BoatTypeKey
): Partial<WizardData> {
  const t = BOAT_TEMPLATES[type];

  // Build default amenities map
  const selectedAmenities: Record<string, boolean> = {};
  for (const group of t.amenityGroups) {
    for (const item of group.items) {
      selectedAmenities[item.key] = item.default;
    }
  }

  return {
    selectedEquipment: [...t.standardEquipment],
    selectedAmenities,
    specificFieldValues: {},
    standardRules: [...t.standardRules],
    customDos: [...t.standardDos],
    customDonts: [...t.standardDonts],
    whatToBring: t.whatToBring.join("\n"),
    whatNotToBring: t.whatNotToBring.join("\n"),
    // waiverText and safetyPoints are no longer part of wizard data.
    // Waivers are now uploaded as PDFs via Firma.dev (Step 9).
    // Safety is handled via videos (Step 7) and images (Step 8).
  };
}
