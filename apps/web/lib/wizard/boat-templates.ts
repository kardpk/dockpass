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
  description: "High-end luxury vessel with professional crew. 40–100+ ft, multi-deck amenities.",

  // ── USCG Part 175 Mandatory Equipment ──
  standardEquipment: [
    "Wearable PFD for each person (USCG Type I/II/III)",
    "Throwable PFD (USCG Type IV) — vessels >16ft",
    "Fire extinguisher(s) (B-I or B-II per vessel size)",
    "Visual Distress Signals — day/night (flares or electronic)",
    "Sound-producing device (horn or whistle, 4-sec blast)",
    "VHF radio (Channel 16 monitored)",
    "GPS / chart plotter",
    "Radar",
    "Autopilot",
    "First aid kit (comprehensive)",
    "Navigation lights (night/reduced visibility)",
    "Anchor and rode",
  ],
  optionalEquipment: [
    "Air conditioning (all cabins)",
    "Generator onboard",
    "Swim platform with ladder",
    "Snorkel gear (masks, fins, snorkels)",
    "Kayak / paddleboard",
    "Water toys (towables, inflatables)",
    "Tender / dinghy with outboard",
    "Underwater LED lighting",
    "Satellite internet / Wi-Fi",
    "Television (salon/stateroom)",
    "Jet ski (subject to insurance)",
    "Waterslide / inflatable slide",
    "E-foil / electric surfboard",
  ],

  amenityGroups: [
    {
      title: "Interior Comfort",
      items: [
        { key: "ac", label: "Air conditioning (all zones)", default: true },
        { key: "heads", label: "Marine head(s) / bathroom(s)", default: true },
        { key: "galley", label: "Enclosed galley kitchen", default: true },
        { key: "salon", label: "Indoor salon / lounge", default: false },
        { key: "staterooms", label: "Private stateroom(s)", default: false },
      ],
    },
    {
      title: "Entertainment",
      items: [
        { key: "bluetooth", label: "Bluetooth sound system", default: true },
        { key: "tv", label: "TV / streaming onboard", default: false },
        { key: "led_lighting", label: "LED mood / underwater lighting", default: false },
        { key: "bar", label: "Bar setup with ice maker", default: true },
      ],
    },
    {
      title: "Exterior & Water Activities",
      items: [
        { key: "flybridge", label: "Flybridge / upper deck", default: false },
        { key: "sunpad", label: "Sunpad / foredeck lounging", default: false },
        { key: "swim_platform", label: "Swim platform with ladder", default: true },
        { key: "snorkel", label: "Snorkel gear included", default: false },
        { key: "floating_mat", label: "Floating mat / lily pad", default: false },
      ],
    },
    {
      title: "Crew & Service",
      items: [
        { key: "chef", label: "Private chef available", default: false },
        { key: "stewardess", label: "Stewardess / hostess", default: false },
        { key: "provisioning", label: "Full provisioning service", default: false },
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
      helpText: "Typical range: 40–100+ ft. Determines USCG equipment requirements.",
    },
    {
      key: "captain_license_type",
      label: "Captain USCG license type",
      type: "select",
      required: false,
      helpText: "OUPV for ≤6 pax, Master for >6 pax (USCG Title 46)",
      options: [
        { value: "oupv", label: "OUPV / 6-Pack (≤6 passengers)" },
        { value: "master_25", label: "Master 25 GRT" },
        { value: "master_50", label: "Master 50 GRT" },
        { value: "master_100", label: "Master 100 GRT" },
        { value: "master_200", label: "Master 200 GRT+" },
      ],
    },
    {
      key: "uscg_vessel_class",
      label: "USCG vessel classification",
      type: "select",
      required: false,
      helpText: "UPV for ≤6 pax uninspected. Subchapter T for >6 pax inspected.",
      options: [
        { value: "upv", label: "UPV — Uninspected Passenger Vessel" },
        { value: "subchapter_t", label: "Subchapter T — Inspected (>6 pax)" },
        { value: "recreational", label: "Recreational (no passengers for hire)" },
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
        { value: "per_hour", label: "Fuel surcharge per engine hour" },
        { value: "deposit", label: "Fuel deposit, refund unused" },
      ],
    },
    {
      key: "gratuity_expectation",
      label: "Gratuity guidance for guests",
      type: "select",
      required: false,
      helpText: "Industry standard is 15-20% of charter fee",
      options: [
        { value: "none", label: "No gratuity expected" },
        { value: "10_percent", label: "10% is appreciated" },
        { value: "15_percent", label: "15% is standard" },
        { value: "20_percent", label: "20% is customary" },
        { value: "at_discretion", label: "At guest discretion" },
      ],
    },
    {
      key: "insurance_coverage",
      label: "Insurance coverage type",
      type: "select",
      required: false,
      helpText: "Charter yachts must carry hull + P&I coverage",
      options: [
        { value: "hull_pi", label: "Hull + P&I (Protection & Indemnity)" },
        { value: "full_charter", label: "Full charter coverage" },
        { value: "contact_operator", label: "Contact operator for details" },
      ],
    },
  ],

  standardRules: [
    "Captain has final authority on all safety matters — decisions are non-negotiable",
    "Maximum passenger capacity must be observed at all times (USCG rated)",
    "Coast Guard regulations apply at all times while underway",
    "Illegal drugs are strictly prohibited — charter will be terminated immediately",
    "Smoking is only permitted in designated areas (never below deck)",
    "No glass bottles or containers on deck",
    "Respect the privacy of other guests and crew members",
    "Follow crew instructions at all times, especially during docking and anchoring",
  ],
  standardDos: [
    "Wear non-marking soft-soled shoes on deck (no stilettos or hard soles)",
    "Listen carefully to the safety briefing before departure",
    "Apply reef-safe sunscreen before boarding and reapply regularly",
    "Stay hydrated — drink plenty of water throughout the charter",
    "Inform captain of any medical conditions before departure",
    "Ask crew if you have any questions or concerns at any time",
    "Stay seated when vessel is underway at speed",
    "Bring a light jacket or sweater for cooler evening returns",
  ],
  standardDonts: [
    "No stilettos, heels, or hard-soled shoes on deck",
    "No red wine or dark liquids on deck or in the cabin (white wine only)",
    "No smoking below deck — designated areas only",
    "No throwing anything overboard (federal offense)",
    "Do not touch navigational equipment or helm controls",
    "Do not flush anything except provided toilet paper in the marine head",
    "Do not dive or jump from the yacht while it is underway",
    "No drones or remote-controlled aircraft without prior captain approval",
  ],

  whatToBring: [
    "Valid government-issued photo ID",
    "Soft-sided duffel bag or collapsible luggage (no hard cases)",
    "Reef-safe sunscreen (SPF 30+)",
    "Sunglasses with retainer strap and wide-brimmed hat",
    "Light clothing, swimwear, and cover-ups",
    "Light jacket or sweater for cooler evenings",
    "Non-marking soft-soled shoes (boat shoes or deck sandals)",
    "Personal medications and motion sickness remedy",
    "Waterproof bag or case for phone and electronics",
    "Reusable water bottle",
  ],
  whatNotToBring: [
    "Hard-sided luggage or suitcases (will not fit in stateroom lockers)",
    "Glass bottles or containers (cans and plastic only)",
    "Valuable jewelry or electronics that could be lost or damaged",
    "Drones or remote-controlled aircraft (unless approved by captain)",
    "Pets (unless specifically permitted in charter agreement)",
    "Illegal substances of any kind",
    "High-wattage appliances (hair dryers — may overload electrical system)",
  ],

  waiverTemplate: `MOTOR YACHT CHARTER AGREEMENT AND LIABILITY WAIVER

I, the undersigned, hereby acknowledge and agree to the following terms and conditions for participating in a private motor yacht charter operated by [OPERATOR NAME] ("the Operator").

1. VOLUNTARY PARTICIPATION
I acknowledge that I am voluntarily participating in a recreational boating activity aboard a motor yacht. I understand that boating activities involve inherent risks, including but not limited to: capsizing, falling overboard, collision, equipment failure, adverse weather, carbon monoxide exposure, and personal injury.

2. ASSUMPTION OF RISK
I voluntarily assume all risks associated with this charter activity, whether foreseeable or unforeseeable, known or unknown. I understand and acknowledge that participating in activities on and around a motor yacht involves inherent risks, including the risks of drowning, falling, collisions, and injuries from equipment.

3. RELEASE OF LIABILITY
I hereby release, waive, and discharge the Operator, its owners, captains, crew members, and agents from any and all claims, demands, or causes of action arising from my participation in this charter, including claims of negligence.

4. CAPTAIN'S AUTHORITY
I agree to follow all instructions given by the captain at all times. The captain has absolute authority over vessel operations and passenger safety, which may include changes to the itinerary due to weather or other safety concerns. Failure to comply with captain's instructions may result in immediate return to dock.

5. US COAST GUARD REGULATIONS
I acknowledge that this vessel operates under United States Coast Guard regulations (Title 33 & Title 46). All safety requirements, including life jacket availability and usage, apply throughout the charter.

6. SWIMMING AND WATER SPORTS
I acknowledge that I am a competent swimmer and that I will not swim or engage in water sports without the captain's explicit permission. I will follow all instructions from the crew regarding the safe use of water toys, swim platforms, and associated equipment. I assume all risks associated with swimming and water-based activities.

7. ALCOHOL CONSUMPTION
I agree to consume alcohol responsibly and understand that the captain may limit or prohibit alcohol consumption for safety reasons. I acknowledge that excessive alcohol consumption impairs judgment and physical ability, and I hold the Operator harmless for any accidents or injuries resulting from my consumption of alcohol.

8. MEDICAL CONDITIONS
I have disclosed any and all medical conditions, allergies, or physical limitations to the charter operator and crew. I confirm that I am medically fit to participate in boating activities. I consent to receive medical treatment which may be deemed advisable in the event of injury, accident, or illness during this charter.

9. MARINE TOILET (HEAD) USAGE
I agree to follow all instructions regarding the operation of the marine toilet (head). I understand that improper use can disable the sanitation system and may result in additional cleaning charges.

10. PROPERTY AND PERSONAL BELONGINGS
The Operator is not responsible for any lost, stolen, or damaged personal belongings. I understand that the marine environment poses risks to electronics, jewelry, and other personal items.

11. ITINERARY CHANGES
I understand that the captain may modify or cancel the planned itinerary due to weather conditions, mechanical issues, or other safety concerns. No refunds will be issued for weather-related itinerary changes.

12. GOVERNING LAW
This agreement shall be governed by the laws of the State of [STATE].

By signing below, I confirm that I have read, understood, and agree to all terms above.`,

  suggestedAddons: [
    { name: "Private Chef", description: "Professional chef for all meals onboard", emoji: "👨‍🍳", suggestedPrice: 75000 },
    { name: "Water Toy Package", description: "Jet ski, e-foil, towables, water slide", emoji: "🏄", suggestedPrice: 50000 },
    { name: "Professional Photographer", description: "Onboard photography session for your group", emoji: "📸", suggestedPrice: 15000 },
    { name: "Champagne & Fruit Platter", description: "Premium champagne bottle + seasonal fruit", emoji: "🥂", suggestedPrice: 8500 },
    { name: "Specialty Provisions", description: "Fine wines, premium spirits, and gourmet foods", emoji: "🍷", suggestedPrice: 25000 },
    { name: "SCUBA Diving Package", description: "Certified instructor + full equipment per person", emoji: "🤿", suggestedPrice: 25000 },
    { name: "Event Setup", description: "Decorations, flowers, and custom arrangements", emoji: "🎉", suggestedPrice: 20000 },
    { name: "Fuel Surcharge (Extended Cruise)", description: "For high-speed or extended cruising itinerary", emoji: "⛽", suggestedPrice: 0 },
  ],
};

// ─────────────────────────────────────
// FISHING CHARTER
// ─────────────────────────────────────

const fishingCharter: BoatTemplate = {
  label: "Fishing Charter",
  emoji: "🎣",
  description: "6-pack inshore/offshore fishing with licensed OUPV captain. 24–40ft center console.",

  // ── USCG UPV Mandatory Equipment + Activity-Specific Gear ──
  standardEquipment: [
    "Wearable PFD for each person (USCG Type I/II/III)",
    "Throwable PFD (USCG Type IV)",
    "Fire extinguisher (Class B)",
    "Visual Distress Signals — day/night (flares)",
    "Sound-producing device (horn or whistle)",
    "VHF radio (Channel 16 monitored)",
    "GPS / chart plotter with depth sounder",
    "First aid kit",
    "Fishing rods and reels (matching trip type)",
    "Tackle and terminal tackle (hooks, leaders, sinkers)",
    "Live bait well",
    "Fish box / cooler with ice",
    "Rod holders (gunwale + T-top mounted)",
    "Fish finder / depth sounder",
  ],
  optionalEquipment: [
    "Outriggers (offshore trolling)",
    "Downriggers (deep trolling)",
    "Kite fishing rig",
    "Fighting chair / stand-up harness",
    "Trolling motor (inshore/flats)",
    "Fish cleaning station (transom-mounted)",
    "Underwater lights (night fishing)",
    "GoPro / camera mount",
    "T-top with rocket launchers (rod storage)",
    "Gaff and landing net",
  ],

  amenityGroups: [
    {
      title: "Fishing Setup",
      items: [
        { key: "live_bait", label: "Live bait provided", default: true },
        { key: "artificial_lures", label: "Artificial lures & tackle", default: true },
        { key: "light_tackle", label: "Light tackle (inshore)", default: true },
        { key: "heavy_tackle", label: "Heavy / offshore tackle", default: false },
        { key: "fish_cleaning", label: "Fish cleaning included", default: false },
        { key: "fillet_service", label: "Fillet & vacuum-pack service", default: false },
      ],
    },
    {
      title: "Guest Comfort",
      items: [
        { key: "cooler", label: "Cooler with ice provided", default: true },
        { key: "shade", label: "T-top / hardtop shade", default: true },
        { key: "heads", label: "Marine toilet (console head)", default: false },
        { key: "seating", label: "Cushioned seating / leaning post", default: true },
        { key: "cabin", label: "Cabin / enclosed area", default: false },
      ],
    },
    {
      title: "Electronics & Navigation",
      items: [
        { key: "fishfinder", label: "Fish finder / bottom machine", default: true },
        { key: "chartplotter", label: "GPS chart plotter with waypoints", default: true },
        { key: "radar_overlay", label: "Radar overlay (offshore)", default: false },
        { key: "underwater_lights", label: "Underwater LED lights (night fishing)", default: false },
        { key: "gopro_mount", label: "GoPro / action camera mount", default: false },
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
      helpText: "What fish do guests most commonly catch on your trips?",
    },
    {
      key: "captain_license_type",
      label: "Captain USCG license type",
      type: "select",
      required: false,
      helpText: "OUPV (6-pack) is the industry standard for this boat class",
      options: [
        { value: "oupv", label: "OUPV / 6-Pack (≤6 passengers)" },
        { value: "master_25", label: "Master 25 GRT" },
        { value: "master_50", label: "Master 50 GRT" },
        { value: "master_100", label: "Master 100 GRT" },
      ],
    },
    {
      key: "license_policy",
      label: "Fishing license policy",
      type: "select",
      required: true,
      options: [
        { value: "vessel_license", label: "Vessel has charter license — guests covered" },
        { value: "guests_bring", label: "Guests must bring their own license" },
        { value: "captain_assists", label: "Captain can help guests purchase online" },
      ],
      helpText: "FL: charter license covers guests. CA/NY: guests need own license.",
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
    {
      key: "gratuity_expectation",
      label: "Gratuity guidance for guests",
      type: "select",
      required: false,
      helpText: "Industry standard for fishing charters is 15-20% of trip cost",
      options: [
        { value: "none", label: "No gratuity expected" },
        { value: "15_percent", label: "15% is standard" },
        { value: "20_percent", label: "20% is customary" },
        { value: "at_discretion", label: "At guest discretion" },
      ],
    },
  ],

  standardRules: [
    "Captain's instructions must be followed at all times — no exceptions",
    "All fish kept must comply with state size and bag limits (FWC/state agency)",
    "No glass bottles or containers permitted on board",
    "No bananas on board (captain's discretion — fishing tradition)",
    "Illegal drugs and firearms are strictly prohibited",
    "Excessive alcohol consumption is not permitted — captain may terminate trip",
    "Dispose of all trash in designated receptacles — nothing overboard",
    "Captain determines fishing locations and may adjust based on conditions",
  ],
  standardDos: [
    "Tell the captain what species you want to target before departure",
    "Listen carefully to the captain's safety briefing and casting instructions",
    "Wear closed-toe, non-marking shoes with non-slip grip",
    "Apply non-spray sunscreen (SPF 50+) 30 minutes before departure",
    "Bring polarized sunglasses — essential for sight fishing",
    "Stay hydrated — fishing trips are long and sun exposure is intense",
    "Hold on to a stable object when the boat is moving at speed",
    "Communicate any seasickness symptoms to the captain immediately — early is better",
  ],
  standardDonts: [
    "Do not cast without the captain's instruction or signal",
    "No bananas on the boat — longstanding fishing tradition",
    "Do not bring hard-soled shoes or boots (damages deck, poor grip)",
    "No crossing lines with other anglers while fighting fish",
    "Do not stand on gunwales or bow while underway",
    "Do not touch fish with dry hands if catch-and-release",
    "No leaning over the side of the boat unnecessarily",
    "No removing hooks yourself — let the mate handle it",
  ],

  whatToBring: [
    "Polarized sunglasses (essential for sight fishing and glare)",
    "Non-spray sunscreen SPF 50+ and lip balm with SPF",
    "Hat or cap with brim (dark underside reduces glare)",
    "Closed-toe shoes with non-slip soles (no flip-flops)",
    "Light rain jacket or windbreaker",
    "Motion sickness medication (take the night before — not morning of)",
    "Snacks and water for long trips",
    "Camera or GoPro (waterproof case recommended)",
    "Small cooler for your catch (if keeping fish)",
    "Any personal medications",
  ],
  whatNotToBring: [
    "Bananas (longstanding fishing superstition — captains enforce this)",
    "Hard-soled shoes or boots (damages gel coat, poor grip on wet decks)",
    "Glass bottles or containers (cans and plastic only)",
    "Flip-flops or open-toe shoes (hook hazard)",
    "Strong cologne or perfume (attracts insects, spooks fish)",
    "Large coolers or excessive baggage (limited deck space)",
    "Firearms or weapons of any kind",
  ],

  waiverTemplate: `SPORTFISHING CHARTER AGREEMENT AND LIABILITY WAIVER

I, the undersigned, hereby acknowledge and agree to the following terms and conditions for participating in a sportfishing charter operated by [OPERATOR NAME] ("the Operator").

1. VOLUNTARY PARTICIPATION
I acknowledge that I am voluntarily participating in a sportfishing charter. I understand that fishing and boating activities involve inherent risks, including but not limited to: hook injuries, slipping on wet decks, sun exposure, seasickness, fish-related injuries, equipment failure, adverse weather, and adverse ocean conditions.

2. ASSUMPTION OF RISK
I voluntarily assume all risks associated with this fishing charter, whether foreseeable or unforeseeable, known or unknown. I understand fishing involves handling sharp hooks, gaffs, knives, and contact with fish that may have sharp spines, teeth, or barbs.

3. RELEASE OF LIABILITY
I hereby release, waive, and discharge the Operator, its owners, captains, mates, crew members, and agents from any and all claims, demands, or causes of action arising from my participation in this charter, including claims of negligence.

4. CAPTAIN'S AUTHORITY
I agree to follow all instructions given by the captain and mate at all times. The captain has absolute authority over vessel operations, fishing decisions, and passenger safety. The captain may terminate the trip at any time for safety reasons, including unsafe passenger behavior or intoxication. No refund will be issued for early termination due to passenger conduct.

5. FISHING EQUIPMENT AND INJURY
I acknowledge that fishing equipment including rods, hooks, gaffs, leaders, and fillet knives are inherently dangerous. I will follow all captain and mate instructions regarding their safe use, storage, and handling. I will not attempt to remove embedded hooks or handle sharp-spined fish without crew assistance.

6. FISHING REGULATIONS COMPLIANCE
I agree to comply with all applicable federal, state, and local fishing regulations including bag limits, size limits, slot limits, season closures, and licensing requirements. I understand that violations of fishing regulations are criminal offenses and may result in substantial fines. The captain has final authority on whether a fish is legal to keep.

7. ALCOHOL CONSUMPTION
I agree to consume alcohol responsibly and in moderation. I understand that the captain has the authority to limit, refuse, or prohibit alcohol consumption for safety reasons. Intoxication may result in immediate return to dock with no refund.

8. MEDICAL CONDITIONS
I certify that I am physically fit to participate in this fishing charter. I have disclosed any medical conditions, allergies, physical limitations, or medications to the captain. I consent to receive medical treatment in the event of injury, accident, or illness.

9. WEATHER AND ITINERARY
I understand that the captain may modify fishing locations, change the itinerary, or return to dock early due to weather conditions, sea state, mechanical issues, or other safety concerns. No refunds will be issued for weather-related changes.

10. GOVERNING LAW
This agreement shall be governed by the laws of the State of [STATE].

By signing below, I confirm that I have read, understood, and agree to all terms above.`,

  suggestedAddons: [
    { name: "Premium Live Bait Upgrade", description: "Live pilchards, goggle-eyes, or threadfins", emoji: "🦐", suggestedPrice: 5000 },
    { name: "Fish Cleaning & Filleting", description: "Professional cleaning, filleting, and vacuum-packing", emoji: "🔪", suggestedPrice: 2500 },
    { name: "Dedicated Mate", description: "Second crew member for rigging, gaffing, and instruction", emoji: "👨‍✈️", suggestedPrice: 15000 },
    { name: "GoPro Trip Video", description: "Waterproof action camera for your catch moments", emoji: "📷", suggestedPrice: 5000 },
    { name: "Catering Package", description: "Box lunches, snacks, and drinks for the group", emoji: "🍱", suggestedPrice: 3500 },
    { name: "Fishing License (Non-Resident)", description: "3-day state non-resident fishing license", emoji: "📋", suggestedPrice: 3200 },
    { name: "Tournament Entry", description: "Entry into a local fishing tournament", emoji: "🏆", suggestedPrice: 0 },
    { name: "Fuel Surcharge (Extended Offshore)", description: "For trips beyond standard range", emoji: "⛽", suggestedPrice: 0 },
  ],
};

// ─────────────────────────────────────
// CATAMARAN
// ─────────────────────────────────────

const catamaran: BoatTemplate = {
  label: "Catamaran",
  emoji: "⛵",
  description: "Stable, spacious sailing multihull. 38–60ft, dual-hull platform ideal for families and groups.",

  // ── USCG Mandatory + Sailing + Navigation Equipment ──
  standardEquipment: [
    "Wearable PFD for each person (USCG Type I/II/III)",
    "Throwable PFD (USCG Type IV)",
    "Fire extinguisher(s) (multiple Class B)",
    "Visual Distress Signals — day/night (flares)",
    "Sound-producing device (horn or whistle)",
    "Navigation lights (night/reduced visibility)",
    "VHF radio (Channel 16 monitored)",
    "GPS / chart plotter with autopilot",
    "Depth sounder and wind instruments",
    "Comprehensive first aid kit",
    "Anchor and rode",
    "Dinghy with outboard motor",
    "Fore-deck trampoline netting",
  ],
  optionalEquipment: [
    "EPIRB (offshore sailing)",
    "Life raft (offshore passages)",
    "Snorkel gear set (masks, fins, snorkels)",
    "Stand-up paddleboards (SUPs)",
    "Kayaks (single or tandem)",
    "Waterslide / inflatable slide",
    "Underwater camera / GoPro",
    "Hammock (fore-deck or cockpit)",
    "Fishing gear (trolling or casting)",
    "Watermaker (desalination system)",
  ],

  amenityGroups: [
    {
      title: "Deck Features",
      items: [
        { key: "trampoline", label: "Forward trampoline netting", default: true },
        { key: "flybridge", label: "Elevated bridgedeck / helm", default: false },
        { key: "cockpit_dining", label: "Aft cockpit dining area", default: true },
        { key: "swim_ladder", label: "Swim ladder (stern)", default: true },
        { key: "sunpad", label: "Sunpad / foredeck lounging", default: false },
      ],
    },
    {
      title: "Interior Comfort",
      items: [
        { key: "galley", label: "Fully equipped galley (stove, oven, fridge)", default: true },
        { key: "cabins", label: "Private cabins with berths", default: true },
        { key: "heads", label: "Marine head(s) / bathroom(s)", default: true },
        { key: "salon", label: "Salon dining / lounge area", default: true },
        { key: "ac", label: "Air conditioning (all cabins)", default: false },
        { key: "generator", label: "Generator", default: false },
      ],
    },
    {
      title: "Entertainment & Activities",
      items: [
        { key: "bluetooth", label: "Bluetooth sound system", default: true },
        { key: "bar", label: "Bar setup with ice", default: true },
        { key: "snorkel", label: "Snorkel gear included", default: false },
        { key: "sup", label: "Stand-up paddleboards", default: false },
        { key: "kayak", label: "Kayaks included", default: false },
      ],
    },
    {
      title: "Crew & Service",
      items: [
        { key: "chef", label: "Professional chef / cook", default: false },
        { key: "provisioning", label: "Full provisioning service", default: false },
        { key: "stewardess", label: "Stewardess / hostess", default: false },
      ],
    },
  ],

  specificFields: [
    {
      key: "vessel_length",
      label: "Vessel length (ft)",
      type: "number",
      required: false,
      placeholder: "45",
      helpText: "Typical charter cats: 38–60ft. Determines cabin count and capacity.",
    },
    {
      key: "beam_width",
      label: "Beam width (ft)",
      type: "number",
      required: false,
      placeholder: "22",
      helpText: "Catamarans are typically 50–60% as wide as they are long.",
    },
    {
      key: "captain_license_type",
      label: "Captain USCG license type",
      type: "select",
      required: false,
      helpText: "OUPV for ≤6 pax, Master for >6 pax (USCG Title 46)",
      options: [
        { value: "oupv", label: "OUPV / 6-Pack (≤6 passengers)" },
        { value: "master_25", label: "Master 25 GRT" },
        { value: "master_50", label: "Master 50 GRT" },
        { value: "master_100", label: "Master 100 GRT" },
      ],
    },
    {
      key: "crew_config",
      label: "Crew configuration",
      type: "select",
      required: false,
      helpText: "What crew is included in the charter?",
      options: [
        { value: "captain_only", label: "Captain only" },
        { value: "captain_chef", label: "Captain + Chef" },
        { value: "captain_chef_mate", label: "Captain + Chef + Mate" },
        { value: "full_crew", label: "Full crew (captain, chef, stewardess)" },
        { value: "bareboat", label: "Bareboat (no crew — charterer operates)" },
      ],
    },
    {
      key: "provisioning",
      label: "Provisioning / meal plan",
      type: "select",
      required: false,
      helpText: "Are meals included or does the guest self-cater?",
      options: [
        { value: "all_inclusive", label: "All-inclusive (meals + drinks)" },
        { value: "half_board", label: "Half board (breakfast + lunch or dinner)" },
        { value: "provisioning_service", label: "Provisioning service (pre-stocked)" },
        { value: "self_catered", label: "Self-catered (bareboat)" },
      ],
    },
    {
      key: "itinerary_type",
      label: "Itinerary flexibility",
      type: "select",
      required: false,
      options: [
        { value: "fixed", label: "Fixed itinerary (set route)" },
        { value: "flexible", label: "Flexible (captain suggests, guest decides)" },
        { value: "fully_custom", label: "Fully customizable by guest" },
      ],
    },
    {
      key: "overnight_capable",
      label: "Available for overnight charters",
      type: "boolean",
      required: false,
      helpText: "Do you offer multi-day liveaboard charters?",
    },
    {
      key: "gratuity_expectation",
      label: "Gratuity guidance for guests",
      type: "select",
      required: false,
      helpText: "Industry standard for sailing charters is 15-20% of charter fee",
      options: [
        { value: "none", label: "No gratuity expected" },
        { value: "15_percent", label: "15% is standard" },
        { value: "20_percent", label: "20% is customary" },
        { value: "at_discretion", label: "At guest discretion" },
      ],
    },
  ],

  standardRules: [
    "Captain's authority is absolute on all matters of safety and navigation",
    "Illegal drugs are strictly prohibited — charter will be terminated immediately",
    "Smoking is strictly prohibited on board (fire hazard with sails and rigging)",
    "Guests may not enter engine rooms or other restricted areas",
    "All trash must be stowed in designated receptacles — nothing overboard",
    "Treat the vessel and all equipment with care and respect",
    "Weight must be distributed evenly between port and starboard hulls",
    "Follow all crew instructions immediately and without argument",
  ],
  standardDos: [
    "Practice 'one hand for yourself, one hand for the boat' — always hold on",
    "Ask the crew if you are unsure about anything — no question is too small",
    "Apply reef-safe sunscreen regularly and wear a hat and protective clothing",
    "Stay hydrated — drink plenty of water throughout the day",
    "Take seasickness medication before departure if you are prone",
    "Move slowly and deliberately when transitioning between hulls",
    "Sit on or below the trampoline netting, not on the bow rails",
    "Inform the captain of any non-swimmers in the group",
  ],
  standardDonts: [
    "Do not bring hard-sided luggage (soft-sided duffel bags only)",
    "No black-soled or dark-soled shoes (marks the deck permanently)",
    "Do not flush anything except provided toilet paper in the marine head",
    "No glass bottles on board (cans and plastic only)",
    "No high-wattage appliances (hair dryers — may overload electrical system)",
    "No jumping off trampolines while vessel is underway",
    "Do not dive or jump from the boat while it is in motion",
    "No standing on gunwales or leaning overboard",
  ],

  whatToBring: [
    "Soft-sided duffel bag (hard luggage will not fit in cabin storage)",
    "Reef-safe sunscreen (SPF 30+) and lip balm with SPF",
    "Polarized sunglasses with retainer strap",
    "Wide-brimmed hat for sun protection",
    "Non-marking, non-slip boat shoes or deck sandals",
    "Swimwear, cover-ups, and a light towel",
    "Light rain jacket or windbreaker (wind chill on catamaran is real)",
    "Light layers — evenings on the water can be cool",
    "Personal medications and motion sickness remedy",
    "Waterproof bag or case for phone and electronics",
  ],
  whatNotToBring: [
    "Hard-sided luggage or suitcases (will not fit in cabin lockers)",
    "Shoes with black or dark-colored soles (permanent deck marks)",
    "Glass bottles or containers (breakage hazard)",
    "High-wattage appliances (hair dryers, curling irons — overloads system)",
    "Valuable jewelry or electronics that could be lost or damaged",
    "Excessive personal items (space is limited even on a catamaran)",
    "Drones without prior captain approval",
  ],

  waiverTemplate: `SAILING CATAMARAN CHARTER AGREEMENT AND LIABILITY WAIVER

I, the undersigned, hereby acknowledge and agree to the following terms and conditions for participating in a sailing catamaran charter operated by [OPERATOR NAME] ("the Operator").

1. VOLUNTARY PARTICIPATION
I acknowledge that I am voluntarily participating in a sailing charter aboard a catamaran. I understand that sailing and boating activities involve inherent risks, including but not limited to: the unpredictable nature of the marine environment, changing weather conditions, the motion of the vessel, boom swing injuries, trampoline falls, seasickness, and personal injury.

2. ASSUMPTION OF RISK
I voluntarily assume all risks associated with this charter activity, whether foreseeable or unforeseeable, known or unknown. I understand that sailing on a catamaran involves unique hazards including but not limited to boom and rigging injuries, line burns, and falls between hulls.

3. RELEASE OF LIABILITY
I hereby release, waive, and discharge the Operator, its owners, captains, crew members, and agents from any and all claims, demands, or causes of action arising from my participation in this charter, including claims of negligence.

4. CAPTAIN'S AUTHORITY
I agree to follow all instructions given by the captain and crew at all times. The captain has absolute authority over vessel operations, sailing decisions, and passenger safety, including changes to itinerary due to weather or safety. Failure to comply may result in immediate return to port.

5. US COAST GUARD REGULATIONS
I acknowledge that this vessel operates under United States Coast Guard regulations. All safety requirements, including life jacket availability and usage, apply throughout the charter.

6. SWIMMING AND WATER ACTIVITIES
I acknowledge that I am a competent swimmer and that swimming, snorkeling, and use of water toys is at my own risk. I will not enter the water without the captain's permission and will follow all crew instructions regarding water activities.

7. BOOM AND RIGGING HAZARD
I understand that the boom and rigging of a sailing vessel present significant injury risks. I will always be aware of the boom's position and stay clear of its path during tacks and jibes. I will not handle lines, winches, or rigging without crew supervision.

8. ALCOHOL CONSUMPTION
I agree to consume alcohol responsibly and in moderation. I understand that the captain may limit or prohibit alcohol consumption for safety reasons. Excessive intoxication may result in immediate return to dock.

9. MARINE TOILET (HEAD) USAGE
I agree to follow all instructions regarding the operation of the marine toilet (head). Only provided marine toilet paper may be flushed. Improper use can disable the sanitation system.

10. PROPERTY AND PERSONAL BELONGINGS
The Operator is not responsible for any lost, stolen, or damaged personal belongings. I understand that the marine environment poses risks to electronics, jewelry, and other personal items.

11. GOVERNING LAW
This agreement shall be governed by the laws of the State of [STATE].

By signing below, I confirm that I have read, understood, and agree to all terms above.`,

  suggestedAddons: [
    { name: "Professional Chef", description: "Private chef for all meals onboard ($150–300/day)", emoji: "👩‍🍳", suggestedPrice: 25000 },
    { name: "Provisioning Service", description: "Boat stocked with your preferred food and beverages", emoji: "🛒", suggestedPrice: 0 },
    { name: "Stand-Up Paddleboards", description: "SUP boards for exploring coves and coastline", emoji: "🏄", suggestedPrice: 5000 },
    { name: "Snorkel Package", description: "Full snorkel gear set per person", emoji: "🤿", suggestedPrice: 2500 },
    { name: "SCUBA Diving Excursion", description: "Certified instructor + equipment per person per dive", emoji: "🤿", suggestedPrice: 10000 },
    { name: "Fishing Gear Rental", description: "Trolling or casting gear for the day ($50–150)", emoji: "🎣", suggestedPrice: 10000 },
    { name: "Onboard Wi-Fi", description: "Satellite internet access ($20–50/day)", emoji: "📶", suggestedPrice: 3500 },
    { name: "Captain & Crew Gratuity", description: "Standard 15-20% of charter fee", emoji: "💵", suggestedPrice: 0 },
  ],
};

// ─────────────────────────────────────
// POWER CATAMARAN
// ─────────────────────────────────────

const powerCatamaran: BoatTemplate = {
  label: "Power Catamaran",
  emoji: "🛥️",
  description: "Engine-powered multihull with expansive deck space. 25–60+ft, twin-hull stability.",

  // ── USCG Mandatory Equipment + Power-Specific ──
  standardEquipment: [
    "Wearable PFD for each person (USCG Type I/II/III)",
    "Throwable PFD (USCG Type IV)",
    "Fire extinguisher(s) (multiple Class B)",
    "Visual Distress Signals — day/night (flares or electronic)",
    "Sound-producing device (horn or whistle)",
    "Navigation lights (night/reduced visibility)",
    "Engine Cut-Off Switch (ECOS) lanyard",
    "VHF radio (Channel 16 monitored)",
    "GPS / chart plotter with radar",
    "Autopilot",
    "Depth sounder",
    "Comprehensive first aid kit",
    "Anchor and rode",
    "Swim platform with ladder",
  ],
  optionalEquipment: [
    "EPIRB (offshore vessels)",
    "Forward trampoline / netting",
    "Snorkel gear set (masks, fins, snorkels)",
    "Stand-up paddleboards (SUPs)",
    "Kayaks (single or tandem)",
    "Towable water toys (tubes, inflatables)",
    "Fishing gear (trolling or casting)",
    "Freshwater deck shower",
    "Underwater LED lighting",
    "Dinghy with outboard motor",
  ],

  amenityGroups: [
    {
      title: "Deck & Hull Features",
      items: [
        { key: "twin_hulls", label: "Twin parallel hulls (wide beam)", default: true },
        { key: "swim_platform", label: "Swim platform with ladder", default: true },
        { key: "trampoline", label: "Forward trampoline / netting", default: false },
        { key: "flybridge", label: "Flybridge / elevated helm", default: false },
        { key: "sunpad", label: "Sunpad / foredeck lounging", default: false },
      ],
    },
    {
      title: "Interior Comfort",
      items: [
        { key: "galley", label: "Galley with refrigerator and stove", default: true },
        { key: "heads", label: "Marine toilet(s) / head(s)", default: true },
        { key: "cabins", label: "Private cabin(s) with berths", default: false },
        { key: "salon", label: "Salon / lounge area", default: false },
        { key: "ac", label: "Air conditioning", default: false },
        { key: "shower", label: "Freshwater shower", default: false },
      ],
    },
    {
      title: "Entertainment & Activities",
      items: [
        { key: "bluetooth", label: "Bluetooth sound system", default: true },
        { key: "bar", label: "Bar setup with ice", default: true },
        { key: "snorkel", label: "Snorkel gear included", default: false },
        { key: "sup", label: "Stand-up paddleboards", default: false },
        { key: "kayak", label: "Kayaks included", default: false },
        { key: "fishing", label: "Fishing gear available", default: false },
      ],
    },
    {
      title: "Crew & Service",
      items: [
        { key: "chef", label: "Professional cook / chef", default: false },
        { key: "provisioning", label: "Full provisioning service", default: false },
        { key: "stewardess", label: "Stewardess / hostess", default: false },
      ],
    },
  ],

  specificFields: [
    {
      key: "vessel_length",
      label: "Vessel length (ft)",
      type: "number",
      required: false,
      placeholder: "40",
      helpText: "Typical power cats: 25–60+ft. Wide beam provides 1.25x deck space of monohulls.",
    },
    {
      key: "captain_license_type",
      label: "Captain USCG license type",
      type: "select",
      required: false,
      helpText: "OUPV for ≤6 pax, Master for >6 pax (USCG Title 46)",
      options: [
        { value: "oupv", label: "OUPV / 6-Pack (≤6 passengers)" },
        { value: "master_25", label: "Master 25 GRT" },
        { value: "master_50", label: "Master 50 GRT" },
        { value: "master_100", label: "Master 100 GRT" },
      ],
    },
    {
      key: "charter_type",
      label: "Charter type",
      type: "select",
      required: false,
      options: [
        { value: "crewed", label: "Crewed (captain + crew provided)" },
        { value: "bareboat", label: "Bareboat (charterer operates)" },
        { value: "skippered", label: "Skippered (captain only, no crew)" },
      ],
    },
    {
      key: "alcohol_policy",
      label: "Alcohol policy",
      type: "select",
      required: false,
      options: [
        { value: "byob", label: "BYOB — guests bring their own" },
        { value: "provided", label: "Alcohol provided / included" },
        { value: "available_purchase", label: "Available for purchase onboard" },
        { value: "no_alcohol", label: "No alcohol permitted" },
      ],
    },
    {
      key: "provisioning",
      label: "Provisioning / meal plan",
      type: "select",
      required: false,
      options: [
        { value: "all_inclusive", label: "All-inclusive (meals + drinks)" },
        { value: "half_board", label: "Half board (breakfast + one meal)" },
        { value: "provisioning_service", label: "Provisioning service (pre-stocked)" },
        { value: "self_catered", label: "Self-catered" },
      ],
    },
    {
      key: "overnight_capable",
      label: "Available for overnight charters",
      type: "boolean",
      required: false,
      helpText: "Do you offer multi-day liveaboard charters?",
    },
    {
      key: "gratuity_expectation",
      label: "Gratuity guidance for guests",
      type: "select",
      required: false,
      helpText: "Industry standard is 15-20% of charter fee",
      options: [
        { value: "none", label: "No gratuity expected" },
        { value: "15_percent", label: "15% is standard" },
        { value: "20_percent", label: "20% is customary" },
        { value: "at_discretion", label: "At guest discretion" },
      ],
    },
  ],

  standardRules: [
    "Captain's instructions must be followed at all times — no exceptions",
    "All guests must remain seated while vessel is underway at high speed",
    "Illegal drugs are strictly prohibited on board",
    "Smoking is not permitted on board",
    "Excessive alcohol consumption is not permitted — captain may terminate trip",
    "Guests are not permitted in engine rooms or at the helm without permission",
    "All trash must be stowed in designated receptacles — nothing overboard",
    "Engines must be OFF before anyone enters the water",
  ],
  standardDos: [
    "Ask questions if you are unsure about any safety procedures",
    "Inform the crew of any medical conditions or concerns before departure",
    "Wear non-marking, soft-soled footwear at all times on deck",
    "Stay hydrated and apply reef-safe sunscreen regularly",
    "Use handrails when moving about the vessel, even in calm conditions",
    "Listen carefully to the pre-departure safety briefing",
    "Remain seated in designated areas while at cruising speed",
    "Enjoy the unique stability and space of a power catamaran!",
  ],
  standardDonts: [
    "Do not bring hard-sided luggage (soft-sided duffel bags or backpacks only)",
    "No shoes with black or marking soles (permanent deck damage)",
    "No glass bottles or containers (cans and plastic only)",
    "Do not flush anything except provided toilet paper in the marine head",
    "Do not enter the water without the captain's explicit permission",
    "No standing or moving about the vessel at high speed",
    "No diving or jumping from the boat while engines are running",
    "No high-wattage appliances (may overload electrical system)",
  ],

  whatToBring: [
    "Soft-sided duffel bag or backpack (no hard luggage)",
    "Reef-safe sunscreen (SPF 30+) and lip balm with SPF",
    "Polarized sunglasses with retainer strap",
    "Hat for sun protection",
    "Swimsuit and cover-up",
    "Non-marking boat shoes or deck sandals",
    "Light jacket or windbreaker",
    "Seasickness medication if you are prone to motion sickness",
    "Waterproof phone case or bag",
    "Any personal medications",
  ],
  whatNotToBring: [
    "Hard-sided suitcases (will not fit in cabin storage)",
    "Shoes with black or dark-colored soles (marks deck permanently)",
    "Glass bottles or containers (breakage hazard on deck)",
    "Valuable electronics or jewelry that could be water-damaged",
    "Weapons or firearms",
    "Drones (without prior captain permission)",
    "High-wattage appliances (hair dryers, curling irons)",
  ],

  waiverTemplate: `POWER CATAMARAN CHARTER AGREEMENT AND LIABILITY WAIVER

I, the undersigned, hereby acknowledge and agree to the following terms and conditions for participating in a power catamaran charter operated by [OPERATOR NAME] ("the Operator").

1. VOLUNTARY PARTICIPATION
I acknowledge that I am voluntarily participating in a power catamaran charter. I understand that boating activities involve inherent risks, including but not limited to: propeller injuries, falling overboard, collision, equipment failure, adverse weather, and personal injury.

2. ASSUMPTION OF RISK
I voluntarily assume all risks associated with this charter activity, whether foreseeable or unforeseeable, known or unknown. I understand that a power catamaran has twin engines with dual propellers, creating specific hazards in and around the water.

3. RELEASE OF LIABILITY
I hereby release, waive, and discharge the Operator, its owners, captains, crew members, and agents from any and all claims, demands, or causes of action arising from my participation in this charter, including claims of negligence.

4. CAPTAIN'S AUTHORITY
I agree to follow all instructions given by the captain and crew at all times. The captain has absolute authority over vessel operations and passenger safety. The captain may limit or terminate the charter for safety reasons, including unsafe behavior or intoxication. No refund will be issued for early termination due to passenger conduct.

5. PROPELLER AND ENGINE SAFETY
I understand that this vessel has twin engines with propellers that present serious injury risks. I will not enter the water until the captain has confirmed engines are OFF. I will stay clear of the stern and propeller areas at all times when engines are running.

6. US COAST GUARD REGULATIONS
I acknowledge that this vessel operates under United States Coast Guard regulations. All safety requirements, including life jacket availability and usage, apply throughout the charter.

7. SWIMMING AND WATER ACTIVITIES
I acknowledge that I am a competent swimmer and that swimming, snorkeling, and use of water toys is at my own risk. I will not enter the water without the captain's explicit permission.

8. ALCOHOL CONSUMPTION
I agree to consume alcohol responsibly. I understand that the captain has the authority to limit, refuse, or prohibit alcohol consumption for safety reasons. Intoxication may result in immediate return to dock.

9. MEDICAL CONDITIONS
I have disclosed any medical conditions, allergies, or physical limitations to the captain. I consent to receive medical treatment in the event of injury, accident, or illness.

10. PROPERTY AND PERSONAL BELONGINGS
The Operator is not responsible for any lost, stolen, or damaged personal belongings.

11. GOVERNING LAW
This agreement shall be governed by the laws of the State of [STATE].

By signing below, I confirm that I have read, understood, and agree to all terms above.`,

  suggestedAddons: [
    { name: "Skipper / Captain", description: "Licensed captain to operate the vessel ($200–400/day)", emoji: "👨‍✈️", suggestedPrice: 30000 },
    { name: "Professional Cook / Chef", description: "Private chef for all meals onboard ($150–300/day)", emoji: "👨‍🍳", suggestedPrice: 25000 },
    { name: "Provisioning Service", description: "Boat pre-stocked with your food and beverage selections", emoji: "🛒", suggestedPrice: 0 },
    { name: "Water Toys (Kayaks/SUPs)", description: "Kayaks, paddleboards, and towable tubes", emoji: "🛶", suggestedPrice: 10000 },
    { name: "Fishing Gear Rental", description: "Rods, reels, and tackle for the day", emoji: "🎣", suggestedPrice: 10000 },
    { name: "Onboard Wi-Fi", description: "Satellite internet access ($25–50/day)", emoji: "📶", suggestedPrice: 3500 },
    { name: "Crew Gratuity", description: "Standard 15-20% of charter fee", emoji: "💵", suggestedPrice: 0 },
    { name: "Airport Transfer", description: "Round-trip transportation to/from airport", emoji: "🚗", suggestedPrice: 10000 },
  ],
};

// ─────────────────────────────────────
// PONTOON / PARTY BOAT
// ─────────────────────────────────────

const pontoon: BoatTemplate = {
  label: "Pontoon / Party Boat",
  emoji: "🎉",
  description: "Spacious flat-deck vessel on aluminum pontoons. 16–28ft, ideal for families and large groups on lakes and rivers.",

  // ── USCG Mandatory Equipment + Pontoon-Specific ──
  standardEquipment: [
    "Wearable PFD for each person (USCG Type I/II/III)",
    "Throwable PFD (USCG Type IV)",
    "Fire extinguisher (Class B)",
    "Visual Distress Signals — day/night (flares or flags)",
    "Sound-producing device (horn or whistle)",
    "Navigation lights",
    "VHF radio (Channel 16)",
    "USCG capacity plate (verified and visible)",
    "Bimini top for shade",
    "Swim ladder (stern-mounted)",
    "First aid kit",
    "Anchor and rode",
  ],
  optionalEquipment: [
    "Floating island / lily pad",
    "Water slide (deck-mounted)",
    "Tube for towing",
    "Wakeboard / water skis",
    "Onboard grill (marine-rated)",
    "Underwater LED lighting",
    "Livewell (fishing pontoons)",
    "Premium Bluetooth speaker upgrade",
    "Changing curtain / privacy enclosure",
    "Engine Cut-Off Switch (ECOS) lanyard",
  ],

  amenityGroups: [
    {
      title: "Deck & Shade",
      items: [
        { key: "bimini", label: "Bimini top / shade canopy", default: true },
        { key: "seating", label: "Wrap-around lounge seating", default: true },
        { key: "swim_ladder", label: "Rear swim ladder", default: true },
        { key: "table", label: "Table with cup holders", default: true },
        { key: "storage", label: "Under-seat storage compartments", default: true },
        { key: "changing_area", label: "Changing curtain / privacy area", default: false },
      ],
    },
    {
      title: "Entertainment",
      items: [
        { key: "sound_system", label: "Bluetooth stereo system", default: true },
        { key: "cooler", label: "Built-in cooler / ice chest", default: true },
        { key: "grill", label: "Onboard marine grill", default: false },
        { key: "led_lights", label: "Underwater / deck LED lights", default: false },
        { key: "slide", label: "Water slide", default: false },
      ],
    },
    {
      title: "Towable Sports",
      items: [
        { key: "tube", label: "Tube towing", default: false },
        { key: "wakeboard", label: "Wakeboarding", default: false },
        { key: "water_ski", label: "Water skiing", default: false },
        { key: "lily_pad", label: "Floating mat / lily pad", default: false },
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
      helpText: "Per USCG capacity plate — total weight including passengers and gear",
    },
    {
      key: "capacity_plate_verified",
      label: "USCG capacity plate verified",
      type: "boolean",
      required: true,
      helpText: "Confirm the USCG capacity plate is installed, visible, and accurate",
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
        { value: "byob", label: "BYOB — guests bring their own (no glass)" },
        { value: "provided", label: "Alcohol provided (in charter price)" },
        { value: "no_alcohol", label: "No alcohol permitted" },
        { value: "add_on", label: "Alcohol available as add-on" },
      ],
    },
    {
      key: "watersports_policy",
      label: "Water sports allowed",
      type: "select",
      required: false,
      options: [
        { value: "none", label: "No water sports — cruising only" },
        { value: "tubing_only", label: "Tubing only" },
        { value: "tubing_skiing", label: "Tubing and water skiing" },
        { value: "all_sports", label: "All towable sports available" },
      ],
    },
    {
      key: "swim_area",
      label: "Designated swim areas",
      type: "text",
      required: false,
      placeholder: "e.g. Nixon Sandbar, Haulover Sandbar, Lake Austin",
      helpText: "Where do you typically stop for swimming?",
    },
    {
      key: "gratuity_expectation",
      label: "Gratuity guidance for guests",
      type: "select",
      required: false,
      helpText: "Industry standard is 15-20% of charter fee",
      options: [
        { value: "none", label: "No gratuity expected" },
        { value: "15_percent", label: "15% is standard" },
        { value: "20_percent", label: "20% is customary" },
        { value: "at_discretion", label: "At guest discretion" },
      ],
    },
  ],

  standardRules: [
    "USCG capacity plate limits must not be exceeded — ever",
    "Remain seated while the boat is underway, especially at high speeds",
    "Follow the captain's instructions at all times without exception",
    "No smoking is permitted on board (fire hazard near fuel)",
    "Alcohol consumption is at the captain's discretion and may be limited or refused",
    "Illegal drugs and firearms are strictly prohibited",
    "Do not tamper with any of the boat's equipment, controls, or engine",
    "Distribute weight evenly port and starboard — no crowding one side or the bow",
  ],
  standardDos: [
    "Stay seated when the boat is moving — use the swim ladder to enter water",
    "Apply non-spray sunscreen regularly (SPF 50+)",
    "Stay hydrated — drink plenty of water, especially in the sun",
    "Wear appropriate non-slip footwear (water shoes or deck sandals)",
    "Supervise children at all times — children under 13 must wear PFDs while underway",
    "Ask the captain for assistance or clarification about anything",
    "Arrive 10-15 minutes before your scheduled departure",
    "Designate a responsible adult per group (especially on party charters)",
  ],
  standardDonts: [
    "Do not stand on seats, tables, or railings at any time",
    "No glass bottles or containers — cans and plastic only",
    "No swimming near the engine or propeller — wait for engine OFF confirmation",
    "No excessive alcohol consumption — captain may terminate the trip",
    "Do not overload one side of the boat (causes listing and instability)",
    "No diving or jumping from the boat while it is in motion",
    "Do not operate the boat, engine, or any equipment without permission",
    "No throwing anything overboard",
  ],

  whatToBring: [
    "Swimwear and towel",
    "Non-spray sunscreen SPF 50+ and lip balm with SPF",
    "Hat and sunglasses (with retainer strap)",
    "Soft-sided cooler with drinks (if BYOB — NO GLASS)",
    "Snacks and water for the group",
    "Water shoes or non-slip sandals (no flip-flops at speed)",
    "Change of dry clothes",
    "Waterproof phone case",
    "Any personal medications",
    "Camera for group photos",
  ],
  whatNotToBring: [
    "Glass bottles or containers (breakage hazard on open deck)",
    "Hard-sided coolers (take up too much space, trip hazard)",
    "Sharp fishing hooks or tackle (unless designated fishing charter)",
    "Pets (unless previously approved by the charter operator)",
    "Drones (without prior operator permission)",
    "Excessive personal gear (limited storage on pontoons)",
    "Firearms or weapons of any kind",
  ],

  waiverTemplate: `PONTOON CHARTER AGREEMENT AND LIABILITY WAIVER

I, the undersigned, hereby acknowledge and agree to the following terms and conditions for participating in a pontoon boat charter operated by [OPERATOR NAME] ("the Operator").

1. VOLUNTARY PARTICIPATION
I acknowledge that I am voluntarily participating in a recreational pontoon boat charter. I understand that boating activities involve inherent risks, including but not limited to: slipping on wet decks, falling overboard, sun exposure, propeller injury, waterway hazards, and adverse weather.

2. ASSUMPTION OF RISK
I voluntarily assume all risks associated with this charter, whether foreseeable or unforeseeable, known or unknown. I understand that pontoon boats have an open deck design and rear-mounted propeller that present specific hazards.

3. RELEASE OF LIABILITY
I hereby release, waive, and discharge the Operator, its owners, captains, crew members, and agents from any and all claims, demands, or causes of action arising from my participation in this charter, including claims of negligence.

4. CAPTAIN'S AUTHORITY
I agree to follow all instructions given by the captain at all times. The captain has absolute authority over vessel operations and passenger safety. The captain may terminate the charter for safety reasons, including intoxication or unsafe behavior. No refund will be issued for early termination due to passenger conduct.

5. WEIGHT AND CAPACITY
I confirm that the total number of passengers and weight of gear are within the vessel's USCG-stated capacity. I understand that overloading is a serious safety violation and may result in the captain refusing to depart.

6. WATER ACTIVITIES
I acknowledge that swimming, tubing, water skiing, and other water activities carry inherent risks including drowning, collision, and impact injury. I will not enter the water without the captain's explicit confirmation that the engine is OFF. I will use the swim ladder for re-boarding.

7. PROPELLER SAFETY
I understand that the boat's propeller can cause fatal injuries even when the engine is in neutral. I will NEVER swim near the rear of the boat. I will wait for the captain's "ENGINE OFF" confirmation before entering the water.

8. ALCOHOL CONSUMPTION
I agree to consume alcohol responsibly. I understand that the captain has the right to limit, refuse, or terminate the charter if any guest becomes intoxicated and poses a danger to themselves or others. No refund will be issued.

9. PROPERTY DAMAGE
I agree to be financially responsible for any damage to the vessel or its equipment caused by my negligence, misconduct, or that of my guests. This includes damage to the Bimini top, seats, railings, and engine.

10. GOVERNING LAW
This agreement shall be governed by the laws of the State of [STATE].

By signing below, I confirm that I have read, understood, and agree to all terms above.`,

  suggestedAddons: [
    { name: "Floating Island / Lily Pad", description: "6x15ft foam floating mat for lounging", emoji: "🟨", suggestedPrice: 7500 },
    { name: "Catering Package", description: "Sandwiches, snacks, and drinks for the group", emoji: "🥪", suggestedPrice: 2500 },
    { name: "Cooler Package", description: "Pre-stocked cooler with ice, waters, sodas", emoji: "🧊", suggestedPrice: 3000 },
    { name: "Tube Towing Session", description: "Inflatable tube + tow rope for the group", emoji: "🍩", suggestedPrice: 4000 },
    { name: "Fishing Gear Rental", description: "Rods, reels, and basic tackle ($25-50/person)", emoji: "🎣", suggestedPrice: 3500 },
    { name: "Photography Package", description: "Professional on-water group photos", emoji: "📸", suggestedPrice: 15000 },
    { name: "Fuel Surcharge (Extended/High-Speed)", description: "For longer trips or sustained high-speed cruising", emoji: "⛽", suggestedPrice: 0 },
    { name: "Captain & Crew Gratuity", description: "Standard 15-20% of charter fee", emoji: "💵", suggestedPrice: 0 },
  ],
};

// ─────────────────────────────────────
// SNORKEL / DIVE
// ─────────────────────────────────────

const snorkelDive: BoatTemplate = {
  label: "Snorkel / Dive Charter",
  emoji: "🤿",
  description: "Specialized vessel with dive platform and tank racks. 25–65ft, for snorkeling tours and SCUBA expeditions.",

  // ── USCG Mandatory + Dive-Specific Equipment ──
  standardEquipment: [
    "Wearable PFD for each person (USCG Type I/II/III)",
    "Throwable PFD (USCG Type IV — ring buoy)",
    "Fire extinguisher(s)",
    "Visual Distress Signals — day/night (flares or electronic)",
    "Sound-producing device (horn or whistle)",
    "Navigation lights",
    "VHF radio (Channel 16)",
    "GPS / chart plotter with depth sounder",
    "Dive flag — Red/White diver-down AND/OR Alpha flag (required by law)",
    "Emergency oxygen (O2) kit",
    "Comprehensive first aid kit",
    "Snorkel masks, snorkels, and fins (all sizes incl. children's)",
    "Flotation devices / snorkel vests / noodles",
    "Anchor and mooring equipment",
  ],
  optionalEquipment: [
    "BCD and regulators (scuba rental)",
    "Air tanks (aluminum 80s)",
    "Enriched air nitrox (EANx) tanks",
    "Wetsuit rental (various sizes / thickness)",
    "Dive computer rental",
    "Underwater torch / dive light",
    "Underwater camera / GoPro rental",
    "Coral reef identification cards / slates",
    "Drysuit (cold water operations)",
    "Night dive lights and glow sticks",
    "Prescription snorkel masks",
    "Freshwater rinse-down shower",
  ],

  amenityGroups: [
    {
      title: "Dive Deck & Platform",
      items: [
        { key: "dive_platform", label: "Oversized dive platform", default: true },
        { key: "dive_ladder", label: "Heavy-duty boarding ladders (fin-friendly)", default: true },
        { key: "tank_racks", label: "Custom tank racks", default: false },
        { key: "gear_rinse", label: "Freshwater gear rinse-down", default: false },
        { key: "gear_stowage", label: "Gear stowing area / benches", default: true },
      ],
    },
    {
      title: "Snorkel Equipment",
      items: [
        { key: "masks", label: "Masks and snorkels included", default: true },
        { key: "fins", label: "Fins included (all sizes)", default: true },
        { key: "vests", label: "Snorkel vests / flotation included", default: true },
        { key: "prescription", label: "Prescription masks available", default: false },
        { key: "kids_gear", label: "Children's gear available", default: true },
      ],
    },
    {
      title: "Scuba Equipment",
      items: [
        { key: "tanks", label: "Air tanks provided", default: false },
        { key: "bcd", label: "BCDs available for rent", default: false },
        { key: "regulators", label: "Regulators available for rent", default: false },
        { key: "wetsuits", label: "Wetsuit rental available", default: false },
        { key: "dive_computer", label: "Dive computer rental", default: false },
        { key: "nitrox", label: "Enriched air nitrox (EANx)", default: false },
      ],
    },
    {
      title: "Guest Comfort",
      items: [
        { key: "shade", label: "Shaded seating area", default: true },
        { key: "heads", label: "Marine head (toilet)", default: false },
        { key: "cooler", label: "Cooler with ice and water", default: true },
        { key: "dry_storage", label: "Dry storage for valuables", default: true },
        { key: "divemaster", label: "Certified divemaster onboard", default: false },
      ],
    },
  ],

  specificFields: [
    {
      key: "cert_requirement",
      label: "Certification required for scuba",
      type: "select",
      required: true,
      options: [
        { value: "none", label: "No — snorkel only, no scuba" },
        { value: "discover_scuba", label: "None — Discover Scuba (intro) offered" },
        { value: "open_water", label: "PADI/NAUI/SSI Open Water or equivalent" },
        { value: "advanced", label: "PADI Advanced Open Water or equivalent" },
        { value: "any_cert", label: "Any recognized certification" },
      ],
    },
    {
      key: "num_dives",
      label: "Number of dives included",
      type: "select",
      required: false,
      options: [
        { value: "snorkel_only", label: "Snorkel only (no scuba dives)" },
        { value: "1_tank", label: "1 tank dive" },
        { value: "2_tank", label: "2 tank dives" },
        { value: "3_tank", label: "3 tank dives" },
        { value: "unlimited", label: "Unlimited (liveaboard/day trip)" },
      ],
    },
    {
      key: "guided_or_unguided",
      label: "Guided or unguided",
      type: "select",
      required: false,
      options: [
        { value: "guided", label: "Guided — divemaster-led tours" },
        { value: "unguided", label: "Unguided — certified divers dive independently" },
        { value: "both", label: "Both options available" },
      ],
    },
    {
      key: "nitrox_available",
      label: "Enriched air nitrox (EANx) available",
      type: "boolean",
      required: false,
      helpText: "For certified nitrox divers to extend bottom time ($10-20/tank)",
    },
    {
      key: "rental_gear_available",
      label: "Rental gear available",
      type: "select",
      required: false,
      options: [
        { value: "snorkel_only", label: "Snorkel gear only (included)" },
        { value: "partial", label: "Partial scuba gear (BCD, reg)" },
        { value: "full", label: "Full scuba gear (BCD, reg, wetsuit, computer)" },
        { value: "none", label: "No rental — bring your own" },
      ],
    },
    {
      key: "max_depth",
      label: "Maximum diving depth",
      type: "select",
      required: false,
      options: [
        { value: "surface", label: "Surface only (snorkel)" },
        { value: "15ft", label: "Up to 15ft (Discover Scuba)" },
        { value: "40ft", label: "Up to 40ft (Open Water)" },
        { value: "60ft", label: "Up to 60ft (Advanced)" },
        { value: "100ft", label: "Up to 100ft (Deep specialty)" },
        { value: "130ft", label: "Up to 130ft (technical)" },
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
    {
      key: "gratuity_expectation",
      label: "Gratuity guidance for guests",
      type: "select",
      required: false,
      helpText: "Industry standard is 15-20% of charter fee",
      options: [
        { value: "none", label: "No gratuity expected" },
        { value: "15_percent", label: "15% is standard" },
        { value: "20_percent", label: "20% is customary" },
        { value: "at_discretion", label: "At guest discretion" },
      ],
    },
  ],

  standardRules: [
    "All divers MUST show proof of certification before gearing up",
    "No one enters the water until the captain gives the explicit signal",
    "Dive flag MUST be deployed when divers/snorkelers are in the water",
    "All divers must stay within the vicinity of the dive flag (300ft open water)",
    "Never dive alone — buddy system is MANDATORY",
    "Strictly no touching, standing on, or collecting coral or marine life",
    "Ascend slowly — maximum 30ft per minute with safety stop",
    "All gear must be properly stowed while the vessel is underway",
  ],
  standardDos: [
    "Perform a thorough 'Buddy Check' (BWRAF) before every entry",
    "Listen carefully to the pre-dive/snorkel site briefing",
    "Stay with your designated buddy at all times underwater",
    "Signal the boat or divemaster immediately if in distress",
    "Equalize ear pressure frequently when descending",
    "Check all gear before entering the water — every time",
    "Use reef-safe sunscreen only (regular sunscreen kills coral)",
    "Log your dive with the crew after surfacing",
  ],
  standardDonts: [
    "Do NOT enter the water without the crew's explicit permission",
    "No non-reef-safe sunscreen (harmful to coral — banned in many areas)",
    "No touching, holding, collecting, or standing on any marine life or coral",
    "Do not dive after alcohol consumption — ever",
    "Do NOT fly within 18-24 hours of scuba diving (decompression sickness risk)",
    "No removing anything from the ocean (shells, coral, artifacts)",
    "Do not feed fish or marine animals",
    "Do not wander off from your buddy or the group",
  ],

  whatToBring: [
    "Swimsuit (worn under clothes for convenience)",
    "Quick-dry towel",
    "Rash guard or wetsuit for sun/thermal protection",
    "Reef-safe sunscreen ONLY (SPF 30+)",
    "Hat and sunglasses (for the boat)",
    "Waterproof bag for phone, wallet, valuables",
    "Underwater camera or waterproof phone case",
    "Proof of dive certification (card or digital — if scuba)",
    "Personal medications and motion sickness medication",
    "Reusable water bottle and snacks",
  ],
  whatNotToBring: [
    "Non-reef-safe sunscreen (harmful to coral — BANNED in many destinations)",
    "Valuable jewelry (easily lost in water)",
    "Glass bottles or breakable items",
    "Contact lenses without sealed prescription mask (scuba)",
    "Pets (not allowed on charter boats)",
    "Fishing gear (unless combined snorkel/fishing charter)",
    "Drones (generally prohibited near dive sites)",
  ],

  waiverTemplate: `SNORKEL AND DIVE CHARTER AGREEMENT AND LIABILITY WAIVER

I, the undersigned, hereby acknowledge and agree to the following terms and conditions for participating in a snorkel/dive charter operated by [OPERATOR NAME] ("the Operator").

1. VOLUNTARY PARTICIPATION
I acknowledge that I am voluntarily participating in snorkeling and/or scuba diving activities. I understand these are inherently risky activities involving specific dangers including but not limited to: drowning, decompression sickness ("the bends"), arterial gas embolism, disorientation, marine life encounters, equipment failure, and adverse currents.

2. ASSUMPTION OF RISK
I voluntarily assume ALL risks associated with this charter, whether foreseeable or unforeseeable. I understand that the underwater environment is inherently unpredictable and dangerous.

3. RELEASE OF LIABILITY
I hereby release, waive, and discharge the Operator, its owners, captains, crew, divemasters, and agents from any and all claims, demands, or causes of action arising from my participation, including claims of negligence.

4. MEDICAL FITNESS
I confirm I am medically fit to snorkel and/or dive. I certify that I do NOT have any of the following conditions without written physician approval: asthma, heart conditions, epilepsy/seizures, recent surgery, pregnancy, ear/sinus problems, diabetes, or any condition that could impair consciousness.

5. CERTIFICATION AND COMPETENCY (SCUBA)
For scuba diving activities, I confirm that I hold the stated certification level from a recognized agency (PADI, NAUI, SSI, etc.) and that my skills are current. I have provided accurate certification information.

6. EQUIPMENT RESPONSIBILITY
I acknowledge that I am responsible for the proper use and care of all rental equipment. I have inspected my equipment and confirm it is in acceptable working order. I will notify the crew of any equipment concerns before entering the water.

7. DIVE FLAG AND BOUNDARIES
I understand the dive flag will be displayed while divers/snorkelers are in the water. I will remain within the protected area surrounding the dive flag as required by law.

8. MARINE LIFE AND REEF PROTECTION
I agree not to touch, stand on, collect, or harass any marine life or coral. I will use ONLY reef-safe sunscreen. I will maintain neutral buoyancy to protect the reef.

9. NO-FLY RESTRICTION
I understand that I must NOT fly within 18-24 hours after scuba diving due to the risk of decompression sickness.

10. CAPTAIN'S AUTHORITY
The captain and divemaster have absolute authority over all diving operations and may cancel, postpone, or modify any dive for safety reasons. No refund will be issued for cancellations due to safety concerns.

11. GOVERNING LAW
This agreement shall be governed by the laws of the State of [STATE].

By signing below, I confirm that I have read, understood, and agree to all terms above.`,

  suggestedAddons: [
    { name: "Guided Divemaster Tour", description: "Professional divemaster-led reef tour", emoji: "⭐", suggestedPrice: 7500 },
    { name: "Underwater Photo/Video Package", description: "Professional underwater photography ($50-150)", emoji: "📸", suggestedPrice: 10000 },
    { name: "Full Gear Rental", description: "BCD, regulator, wetsuit, mask, fins ($40-75/person)", emoji: "🎽", suggestedPrice: 6000 },
    { name: "Enriched Air Nitrox (EANx)", description: "Extended bottom time for certified nitrox divers", emoji: "🧪", suggestedPrice: 1500 },
    { name: "GoPro / Underwater Camera Rental", description: "Capture your underwater memories", emoji: "🎥", suggestedPrice: 4000 },
    { name: "Night Dive / Night Snorkel", description: "Experience the reef under lights ($75-150/person)", emoji: "🌙", suggestedPrice: 12500 },
    { name: "Prescription Mask Rental", description: "For guests who wear glasses ($10-15)", emoji: "👓", suggestedPrice: 1200 },
    { name: "Lunch / Catering Package", description: "Meals and drinks on the boat ($25-75/person)", emoji: "🥪", suggestedPrice: 0 },
  ],
};

// ─────────────────────────────────────
// SAILING YACHT
// ─────────────────────────────────────

const sailingYacht: BoatTemplate = {
  label: "Sailing Yacht",
  emoji: "🌬️",
  description: "Classic monohull sailboat. 32–53ft, responsive handling with authentic heeling experience.",

  // ── USCG Mandatory + Sailing & Navigation Equipment ──
  standardEquipment: [
    "Wearable PFD for each person (USCG Type I/II/III)",
    "Throwable PFD (USCG Type IV)",
    "Fire extinguisher(s) (Class B)",
    "Visual Distress Signals — day/night (flares or electronic)",
    "Sound-producing device (horn or whistle / fog horn)",
    "Navigation lights (night/reduced visibility)",
    "VHF radio (Channel 16 monitored)",
    "GPS / chart plotter with depth sounder",
    "Compass (magnetic)",
    "Comprehensive first aid kit",
    "Anchor, rode, and chain",
    "Sails (mainsail + genoa/jib)",
    "Winches, lines, and fenders",
    "Bilge pump (manual and/or electric)",
  ],
  optionalEquipment: [
    "EPIRB / PLB (offshore passages)",
    "Life raft (offshore rating)",
    "Autopilot",
    "Windlass (electric anchor)",
    "Watermaker (desalination)",
    "Solar panels / wind generator",
    "SSB radio / satellite phone",
    "Spinnaker or gennaker (performance sail)",
    "Dinghy with oars or outboard motor",
    "Storm sails (trysail / storm jib)",
  ],

  amenityGroups: [
    {
      title: "Sailing & Deck",
      items: [
        { key: "mainsail", label: "Mainsail & genoa/jib", default: true },
        { key: "winches", label: "Winches & line handling", default: true },
        { key: "bimini", label: "Bimini / sprayhood", default: true },
        { key: "cockpit_cushions", label: "Cockpit cushions", default: true },
        { key: "swim_ladder", label: "Swim ladder (stern)", default: true },
        { key: "stern_shower", label: "Stern shower", default: false },
      ],
    },
    {
      title: "Interior Accommodation",
      items: [
        { key: "galley", label: "Galley with fridge and stove (propane)", default: true },
        { key: "heads", label: "Marine head(s) / bathroom(s)", default: true },
        { key: "cabins", label: "Sleeping cabins with berths", default: true },
        { key: "bedding", label: "Bedding and towels provided", default: false },
        { key: "ac", label: "Air conditioning", default: false },
        { key: "salon", label: "Salon seating / dining", default: true },
      ],
    },
    {
      title: "Navigation & Electronics",
      items: [
        { key: "chartplotter", label: "GPS chart plotter", default: true },
        { key: "ais", label: "AIS transponder", default: true },
        { key: "autopilot", label: "Autopilot", default: false },
        { key: "radar", label: "Radar", default: false },
        { key: "wind_instruments", label: "Wind speed & direction instruments", default: false },
      ],
    },
    {
      title: "Crew & Service",
      items: [
        { key: "skipper", label: "Professional skipper / captain", default: false },
        { key: "cook", label: "Cook / hostess", default: false },
        { key: "provisioning", label: "Provisioning service", default: false },
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
      key: "captain_license_type",
      label: "Captain USCG license type",
      type: "select",
      required: false,
      helpText: "OUPV for ≤6 pax, Master for >6 pax (USCG Title 46)",
      options: [
        { value: "oupv", label: "OUPV / 6-Pack (≤6 passengers)" },
        { value: "master_25", label: "Master 25 GRT" },
        { value: "master_50", label: "Master 50 GRT" },
        { value: "master_100", label: "Master 100 GRT" },
      ],
    },
    {
      key: "crew_config",
      label: "Crew configuration",
      type: "select",
      required: false,
      options: [
        { value: "captain_only", label: "Captain / skipper only" },
        { value: "captain_cook", label: "Captain + Cook/Hostess" },
        { value: "bareboat", label: "Bareboat (charterer operates)" },
      ],
    },
    {
      key: "bareboat_cert",
      label: "Bareboat certification accepted",
      type: "text",
      required: false,
      placeholder: "e.g. ASA 104, RYA Day Skipper, ICC",
      helpText: "What sailing certifications do you accept for bareboat charters?",
    },
    {
      key: "provisioning",
      label: "Provisioning / meal plan",
      type: "select",
      required: false,
      options: [
        { value: "all_inclusive", label: "All-inclusive (meals + drinks)" },
        { value: "half_board", label: "Half board" },
        { value: "provisioning_service", label: "Provisioning service (pre-stocked)" },
        { value: "self_catered", label: "Self-catered (bareboat)" },
      ],
    },
    {
      key: "offshore_capable",
      label: "Offshore passages",
      type: "boolean",
      required: false,
      helpText: "Available for overnight or offshore passages?",
    },
    {
      key: "spinnaker_available",
      label: "Spinnaker / gennaker available",
      type: "boolean",
      required: false,
      helpText: "Performance sails for experienced sailors — may require additional deposit",
    },
    {
      key: "gratuity_expectation",
      label: "Gratuity guidance for guests",
      type: "select",
      required: false,
      helpText: "Industry standard is 15-20% of charter fee",
      options: [
        { value: "none", label: "No gratuity expected" },
        { value: "15_percent", label: "15% is standard" },
        { value: "20_percent", label: "20% is customary" },
        { value: "at_discretion", label: "At guest discretion" },
      ],
    },
  ],

  standardRules: [
    "Captain's decisions regarding safety are final — no exceptions",
    "No smoking is permitted on board (fire hazard with sails and propane)",
    "Illegal drugs are strictly prohibited — charter terminates immediately",
    "Follow all safety instructions from crew immediately and without question",
    "Be mindful of water and power consumption — both are limited at sea",
    "Do not leave personal belongings in common areas (tripping hazard)",
    "Practice 'one hand for yourself, one hand for the boat' at all times",
    "Safety harness required when offshore or at night on deck",
  ],
  standardDos: [
    "Ask questions if unsure about any aspect of boat safety or procedures",
    "Wear soft-soled, non-marking shoes for deck grip and protection",
    "Practice 'one hand for yourself, one hand for the boat' when moving",
    "Stay hydrated and apply reef-safe sunscreen regularly",
    "Communicate seasickness to the crew early — early intervention works",
    "Duck immediately when you hear 'Ready about!' or 'Tacking!'",
    "Move to the high (windward) side when the boat heels under sail",
    "Ask the crew for a galley and marine head demonstration before first use",
  ],
  standardDonts: [
    "Do not bring hard-sided luggage — soft collapsible duffel bags only",
    "No hard-soled shoes, high heels, or black-soled shoes on deck",
    "Do not flush anything except provided toilet paper in the marine head",
    "No going on deck alone at night without informing crew and wearing PFD",
    "Do not distract the captain during docking, anchoring, or tight navigation",
    "No touching lines, winches, or sheets without crew instruction",
    "Do not stand in the path of the swinging boom",
    "No high-wattage appliances (hair dryers — boat electrical cannot handle it)",
  ],

  whatToBring: [
    "Soft-sided duffel bag (essential — hard luggage will not fit in lockers)",
    "Non-marking, soft-soled deck shoes (best grip on wet decks)",
    "Waterproof jacket and pants (sea spray even in warm climates)",
    "Layered clothing — t-shirts, long-sleeves, and a fleece/sweater",
    "Reef-safe sunscreen (SPF 30+) — required in many destinations",
    "Polarized sunglasses with retainer strap",
    "Hat with chin strap (stays on in wind)",
    "Seasickness medication (take the night before, not morning of)",
    "Sea bands / acupressure wristbands (non-drowsy alternative)",
    "Personal medications and any prescriptions",
  ],
  whatNotToBring: [
    "Hard-sided suitcases (impossible to stow in irregular lockers)",
    "Valuable jewelry or electronics (high risk of water damage or loss)",
    "Drones (prohibited by most charter companies and marine areas)",
    "Hair dryers or high-wattage appliances (overloads boat electrical)",
    "Non-reef-safe sunscreen (banned in many charter destinations)",
    "High heels or hard-soled shoes (deck damage, poor grip)",
    "Excessive personal items (space is very limited on a sailboat)",
  ],

  waiverTemplate: `SAILING YACHT CHARTER AGREEMENT AND LIABILITY WAIVER

I, the undersigned, hereby acknowledge and agree to the following terms and conditions for participating in a sailing yacht charter operated by [OPERATOR NAME] ("the Operator").

1. VOLUNTARY PARTICIPATION
I acknowledge that I am voluntarily participating in a sailing charter. I understand that sailing involves inherent risks, including but not limited to: changing weather and sea conditions, the risk of falling overboard, heeling (leaning) of the vessel, and potential injury from moving parts including the boom, winches, and lines.

2. ASSUMPTION OF RISK
I voluntarily assume all risks associated with this charter, whether foreseeable or unforeseeable, known or unknown. I understand that a monohull sailing yacht heels under sail, creating unique physical demands on passengers.

3. RELEASE OF LIABILITY
I hereby release, waive, and discharge the Operator, its owners, captains, crew members, and agents from any and all claims, demands, or causes of action arising from my participation in this charter, including claims of negligence.

4. CAPTAIN'S AUTHORITY
I agree to follow all safety instructions given by the captain and crew. The captain has final authority on all decisions regarding safety of the vessel and passengers, including changes to itinerary due to weather. Failure to comply may result in early termination without refund.

5. BOOM AND RIGGING HAZARD
I understand that the boom and rigging of a sailing vessel present significant injury risks. The boom can swing across the boat with force during tacks and jibes. I will always be aware of the boom's position, stay low when moving about the cockpit, and never wrap lines around my hands.

6. BAREBOAT COMPETENCY (IF APPLICABLE)
I certify that I am experienced and competent to charter and operate the vessel in the intended cruising area. I have provided an accurate sailing resume and assume full responsibility for safe navigation and operation of the vessel and all persons on board.

7. SWIMMING AND WATER ACTIVITIES
I acknowledge that swimming, snorkeling, and use of dinghies or water toys is at my own risk. I will not enter the water without informing the captain and will follow all crew instructions.

8. MARINE HEAD AND GALLEY
I agree to follow all instructions regarding the marine head (toilet) and galley (kitchen). I understand that improper use of the marine head can disable the sanitation system, and improper use of the propane galley stove creates fire risk.

9. ALCOHOL CONSUMPTION
I agree to consume alcohol responsibly. The captain may limit or prohibit alcohol consumption for safety reasons.

10. PROPERTY AND SECURITY DEPOSIT
I agree to treat the vessel with care. I understand that I may be held financially responsible for damage caused by negligence. I acknowledge the terms of any security deposit or damage waiver.

11. GOVERNING LAW
This agreement shall be governed by the laws of the State of [STATE].

By signing below, I confirm that I have read, understood, and agree to all terms above.`,

  suggestedAddons: [
    { name: "Professional Skipper", description: "Licensed captain for the vessel ($200–400/day)", emoji: "👨‍✈️", suggestedPrice: 30000 },
    { name: "Cook / Hostess", description: "Crew for meals, provisioning, and light cleaning ($150–300/day)", emoji: "👩‍🍳", suggestedPrice: 22500 },
    { name: "Provisioning Package", description: "Boat pre-stocked with food, drinks, and supplies", emoji: "🛒", suggestedPrice: 0 },
    { name: "Stand-Up Paddleboards", description: "SUPs for exploring anchorages and coves", emoji: "🏄", suggestedPrice: 5000 },
    { name: "Damage Waiver Insurance", description: "Reduces security deposit amount ($40–60/day)", emoji: "🛡️", suggestedPrice: 5000 },
    { name: "Onboard Wi-Fi Hotspot", description: "Satellite internet access ($50–100/week)", emoji: "📶", suggestedPrice: 7500 },
    { name: "Snorkel Stop Package", description: "Gear for anchored snorkel session", emoji: "🤿", suggestedPrice: 2500 },
    { name: "Captain & Crew Gratuity", description: "Standard 15-20% of charter fee", emoji: "💵", suggestedPrice: 0 },
  ],
};

// ─────────────────────────────────────
// SPEEDBOAT / BOWRIDER
// ─────────────────────────────────────

const speedboat: BoatTemplate = {
  label: "Speedboat / Bowrider",
  emoji: "💨",
  description: "Versatile V-hull recreational boat with open bow seating. 16–35ft, ideal for watersports and day trips.",

  // ── USCG Mandatory Equipment + Performance-Specific ──
  standardEquipment: [
    "Wearable PFD for each person (USCG Type I/II/III/V)",
    "Throwable PFD (USCG Type IV)",
    "Fire extinguisher (B-I type minimum)",
    "Visual Distress Signals — day/night (coastal)",
    "Sound-producing device (horn or whistle)",
    "Navigation lights",
    "VHF radio (Channel 16)",
    "GPS / chart plotter with depth sounder",
    "First aid kit",
    "Swim platform with ladder",
    "Bimini top for shade",
    "Anchor and rode",
  ],
  optionalEquipment: [
    "Engine Cut-Off Switch (ECOS) lanyard",
    "Wakeboard tower",
    "Ballast bags (wake shaping)",
    "Tow rope and handle (watersports)",
    "Inflatable tube",
    "Water skis",
    "Hydrofoil / wake surf board",
    "Floating mat / lily pad",
    "Snorkel gear set",
    "USB charging ports / power outlets",
  ],

  amenityGroups: [
    {
      title: "Seating & Layout",
      items: [
        { key: "bow_seating", label: "Open bow seating area", default: true },
        { key: "windshield", label: "Walk-through windshield", default: true },
        { key: "swim_platform", label: "Swim platform with ladder", default: true },
        { key: "sunpad", label: "Sunpad / lounge area", default: false },
        { key: "bimini", label: "Bimini top for shade", default: true },
        { key: "storage", label: "Under-seat storage compartments", default: true },
      ],
    },
    {
      title: "Tech & Sound",
      items: [
        { key: "bluetooth", label: "Bluetooth stereo system", default: true },
        { key: "depth_sounder", label: "Depth sounder", default: true },
        { key: "usb", label: "USB charging ports", default: false },
        { key: "cooler", label: "Built-in cooler / ice chest", default: false },
      ],
    },
    {
      title: "Watersports Equipment",
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
      helpText: "Typical bowriders: 40-65mph. Performance models may exceed 70mph.",
    },
    {
      key: "captain_license_type",
      label: "Captain USCG license type",
      type: "select",
      required: false,
      helpText: "OUPV for ≤6 pax, Master for >6 pax (USCG Title 46)",
      options: [
        { value: "oupv", label: "OUPV / 6-Pack (≤6 passengers)" },
        { value: "master_25", label: "Master 25 GRT" },
        { value: "master_50", label: "Master 50 GRT" },
      ],
    },
    {
      key: "service_level",
      label: "Service level",
      type: "select",
      required: false,
      options: [
        { value: "captained", label: "Captained (captain provided)" },
        { value: "bareboat", label: "Bareboat (renter operates)" },
        { value: "both", label: "Both options available" },
      ],
    },
    {
      key: "watersports_offered",
      label: "Watersports offered",
      type: "select",
      required: false,
      options: [
        { value: "none", label: "No watersports — cruising only" },
        { value: "tubing", label: "Tubing only" },
        { value: "tubing_skiing", label: "Tubing and water skiing" },
        { value: "all_sports", label: "All watersports (tube, ski, wakeboard, surf)" },
      ],
    },
    {
      key: "alcohol_policy",
      label: "Alcohol policy",
      type: "select",
      required: false,
      options: [
        { value: "byob", label: "BYOB — guests bring their own (no glass)" },
        { value: "provided", label: "Alcohol provided / included" },
        { value: "no_alcohol", label: "No alcohol permitted" },
        { value: "available_purchase", label: "Available for purchase onboard" },
      ],
    },
    {
      key: "sports_included",
      label: "Watersports equipment included in price",
      type: "boolean",
      required: false,
      helpText: "Are watersports equipment and instruction included?",
    },
    {
      key: "gratuity_expectation",
      label: "Gratuity guidance for guests",
      type: "select",
      required: false,
      helpText: "Industry standard is 15-20% of charter fee",
      options: [
        { value: "none", label: "No gratuity expected" },
        { value: "15_percent", label: "15% is standard" },
        { value: "20_percent", label: "20% is customary" },
        { value: "at_discretion", label: "At guest discretion" },
      ],
    },
  ],

  standardRules: [
    "ALL passengers must remain seated while the boat is underway at high speed",
    "Follow all instructions from the captain immediately — no exceptions",
    "No smoking or illegal drugs on board",
    "No glass containers permitted — cans and plastic only",
    "Captain has final authority on all safety matters",
    "Life jackets required for ALL watersports activities",
    "A designated spotter must be present when towing any rider",
    "Respect the boat and equipment — treat vessel with care",
  ],
  standardDos: [
    "Keep your hands and feet inside the boat at all times while underway",
    "Stay hydrated and apply lotion sunscreen regularly (not spray)",
    "Supervise children at all times — children must wear PFDs underway",
    "Inform the captain if you feel unwell or seasick",
    "Arrive on time for your charter (10-15 mins early recommended)",
    "Listen carefully to the pre-departure safety briefing",
    "Signal clearly to the boat if you fall during watersports (thumbs up = OK)",
    "Wait for the captain's 'ALL CLEAR' before entering the water",
  ],
  standardDonts: [
    "Do not stand on seats, gunwales, sunpad, or bow while moving",
    "No spray sunscreen (creates extremely slippery deck hazards)",
    "No glass bottles or red wine (stains and breakage hazard)",
    "Do not jump from the boat until the engine is fully OFF",
    "No swimming near the propeller — ever, even when engine is idling",
    "Do not distract the captain while the boat is underway",
    "No leaning over the side of the boat, especially at speed",
    "No excessive alcohol before or during watersports",
  ],

  whatToBring: [
    "Swimwear and towel",
    "Lotion sunscreen SPF 30+ (NOT spray — deck hazard)",
    "Polarized sunglasses with retainer strap",
    "Hat for sun protection",
    "Rashguard or wetsuit (for watersports in cooler water)",
    "Non-drowsy motion sickness medication",
    "Change of dry clothes",
    "Waterproof phone case or bag",
    "Camera / GoPro (with strap for watersports)",
    "Soft-sided cooler with drinks (if BYOB — NO GLASS)",
  ],
  whatNotToBring: [
    "Spray sunscreen (makes deck dangerously slippery)",
    "Glass bottles or red wine (stains and breakage)",
    "Hard-sided coolers (limited space, trip hazard)",
    "Loose jewelry (must be removed for watersports)",
    "Pets (unless specifically approved by operator)",
    "Firearms or weapons of any kind",
    "Contact lenses without goggles (for watersports)",
  ],

  waiverTemplate: `SPEEDBOAT / BOWRIDER CHARTER AND WATERSPORTS LIABILITY WAIVER

I, the undersigned, hereby acknowledge and agree to the following terms and conditions for participating in a speedboat charter operated by [OPERATOR NAME] ("the Operator").

1. VOLUNTARY PARTICIPATION
I acknowledge that I am voluntarily participating in a high-speed powerboat charter. I understand that boating activities involve inherent risks, including but not limited to: high-speed ejection, propeller injuries, falling overboard, collision, equipment failure, adverse weather, and personal injury.

2. ASSUMPTION OF RISK — WATERSPORTS
I voluntarily assume all risks associated with watersports including waterskiing, wakeboarding, wake surfing, and tubing. I understand these activities carry heightened risks of injury including impact, drowning, and equipment-related injuries. I will wear a USCG-approved life jacket for all watersports.

3. RELEASE OF LIABILITY
I hereby release, waive, and discharge the Operator, its owners, captains, crew members, and agents from any and all claims, demands, or causes of action arising from my participation in this charter, including claims of negligence.

4. CAPTAIN'S AUTHORITY
I agree to follow all instructions given by the captain immediately. The captain has absolute authority over vessel operations, speed, and passenger safety. The captain may terminate the charter for safety reasons or passenger misconduct. No refund will be issued for early termination due to passenger conduct.

5. PROPELLER SAFETY
I understand the boat's propeller can cause fatal injuries even when the engine is idling. I will NEVER swim near the stern of the boat. I will wait for the captain's "ENGINE OFF" confirmation before entering the water.

6. CARBON MONOXIDE WARNING
I understand that engine exhaust produces deadly carbon monoxide (CO). I will not linger near the stern exhaust while the engine is running. CO is odorless and can cause sudden loss of consciousness.

7. HIGH-SPEED SAFETY
I agree to remain seated in designated seating areas while the boat is underway. I will not sit on the bow, gunwales, or sunpad while the boat is in motion.

8. ALCOHOL CONSUMPTION
I agree to consume alcohol responsibly. I will not consume alcohol before or during any watersports activity. The captain may limit or terminate the charter due to intoxication.

9. PROPERTY DAMAGE
I agree to be responsible for damage to the vessel or equipment caused by negligence or misconduct.

10. GOVERNING LAW
This agreement shall be governed by the laws of the State of [STATE].

By signing below, I confirm that I have read, understood, and agree to all terms above.`,

  suggestedAddons: [
    { name: "Watersports Package", description: "Tube, water skis, wakeboard — full equipment", emoji: "🏄", suggestedPrice: 10000 },
    { name: "Floating Mat / Lily Pad", description: "6x15ft foam mat for lounging on the water", emoji: "🟨", suggestedPrice: 7500 },
    { name: "Snorkel Gear Rental", description: "Masks, fins, and snorkels for the group", emoji: "🤿", suggestedPrice: 2000 },
    { name: "GoPro Rental", description: "Waterproof action camera with mounts", emoji: "📸", suggestedPrice: 3500 },
    { name: "Premium Sound System", description: "Upgraded Bluetooth speaker setup", emoji: "🔊", suggestedPrice: 5000 },
    { name: "Catering / Provisioning", description: "Snacks, sandwiches, and drinks for the group", emoji: "🥪", suggestedPrice: 0 },
    { name: "Fuel Surcharge (High-Speed)", description: "For sustained high-speed running or extended trips", emoji: "⛽", suggestedPrice: 0 },
    { name: "Captain & Crew Gratuity", description: "Standard 15-20% of charter fee", emoji: "💵", suggestedPrice: 0 },
  ],
};

// ─────────────────────────────────────
// WAKE SPORTS BOAT (Wakeboard / Wakesurf)
// ─────────────────────────────────────

const wakeSports: BoatTemplate = {
  label: "Wake Sports Boat",
  emoji: "🏄",
  description: "Specialized tow boat with ballast systems and tower. 20–25ft, engineered for wakeboarding and wakesurfing.",

  // ── USCG Mandatory Equipment + Wake-Specific ──
  standardEquipment: [
    "Wearable PFD for each person (USCG Type I/II/III/V)",
    "Throwable PFD (USCG Type IV)",
    "Fire extinguisher (B-I or B-II type)",
    "Visual Distress Signals — day/night (coastal)",
    "Sound-producing device (horn or whistle)",
    "Engine Cut-Off Switch (ECOS) lanyard",
    "First aid kit",
    "VHF radio or cell phone in waterproof case",
    "GPS / depth finder",
    "Wake tower with board racks",
    "Integrated ballast system (wake shaping)",
    "Tow ropes and handles (wakeboard + wakesurf)",
    "Oversized swim platform with ladder",
  ],
  optionalEquipment: [
    "Wake-shaping tabs / surf gates",
    "Premium wakeboard(s) — various sizes",
    "Premium wakesurf board(s) — various sizes",
    "Inflatable tube (multi-rider)",
    "Bimini top / tower-mounted shade",
    "Premium Bluetooth audio system (tower speakers)",
    "Cooler / ice chest",
    "Floating mat / lily pad",
    "GoPro camera with tower mount",
    "Dry bag for personal items",
  ],

  amenityGroups: [
    {
      title: "Towed Sports Tech",
      items: [
        { key: "wake_tower", label: "Wake tower with board racks", default: true },
        { key: "ballast", label: "Integrated ballast system", default: true },
        { key: "surf_tabs", label: "Wake-shaping tabs / surf gates", default: false },
        { key: "tow_ropes", label: "Tow ropes and handles", default: true },
        { key: "speed_control", label: "GPS speed control (Perfect Pass / Zero Off)", default: false },
      ],
    },
    {
      title: "Guest Experience",
      items: [
        { key: "tower_speakers", label: "Tower-mounted speakers", default: true },
        { key: "bluetooth", label: "Bluetooth audio system", default: true },
        { key: "swim_platform", label: "Oversized swim platform", default: true },
        { key: "bimini", label: "Bimini top / shade", default: false },
        { key: "cooler", label: "Built-in cooler", default: false },
      ],
    },
    {
      title: "Boards & Equipment",
      items: [
        { key: "wakeboards", label: "Wakeboards (multiple sizes)", default: false },
        { key: "wakesurf_boards", label: "Wakesurf boards (multiple sizes)", default: false },
        { key: "tube", label: "Towable tube (multi-rider)", default: false },
        { key: "life_vests_sport", label: "Competition-style life vests", default: false },
      ],
    },
  ],

  specificFields: [
    {
      key: "wake_activities",
      label: "Activities available",
      type: "select",
      required: true,
      options: [
        { value: "wakeboarding", label: "Wakeboarding only" },
        { value: "wakesurfing", label: "Wakesurfing only" },
        { value: "both_wake", label: "Wakeboarding and wakesurfing" },
        { value: "all_towed", label: "All towed sports (wakeboard, surf, tube)" },
      ],
    },
    {
      key: "rider_experience",
      label: "Typical rider experience level",
      type: "select",
      required: false,
      options: [
        { value: "beginner", label: "Beginner — first-timers welcome" },
        { value: "intermediate", label: "Intermediate — some experience" },
        { value: "advanced", label: "Advanced — experienced riders" },
        { value: "all_levels", label: "All skill levels" },
      ],
    },
    {
      key: "rider_stance",
      label: "Surf side / stance configuration",
      type: "select",
      required: false,
      helpText: "Determines which side the wake is shaped for surfing",
      options: [
        { value: "regular", label: "Regular (left foot forward)" },
        { value: "goofy", label: "Goofy (right foot forward)" },
        { value: "switchable", label: "Switchable (both sides available)" },
      ],
    },
    {
      key: "board_sizes",
      label: "Board sizes available",
      type: "select",
      required: false,
      options: [
        { value: "small", label: "Small (youth / light riders)" },
        { value: "medium", label: "Medium (average adults)" },
        { value: "all_sizes", label: "All sizes (S/M/L)" },
        { value: "bring_own", label: "Guests bring their own" },
      ],
    },
    {
      key: "alcohol_policy",
      label: "Alcohol policy",
      type: "select",
      required: false,
      options: [
        { value: "no_alcohol", label: "No alcohol — watersports charter" },
        { value: "byob_after", label: "BYOB after sports activities only" },
        { value: "byob", label: "BYOB — no glass containers" },
        { value: "provided", label: "Drinks provided / included" },
      ],
    },
    {
      key: "music_preference",
      label: "Guest music / playlist preference",
      type: "text",
      required: false,
      placeholder: "e.g. Spotify playlist link, genre preference",
      helpText: "Guests can share playlist preferences before their session",
    },
    {
      key: "sports_included",
      label: "Equipment and instruction included in price",
      type: "boolean",
      required: false,
      helpText: "Are boards, ropes, and basic instruction included?",
    },
    {
      key: "gratuity_expectation",
      label: "Gratuity guidance for guests",
      type: "select",
      required: false,
      helpText: "Industry standard is 15-20% of charter fee",
      options: [
        { value: "none", label: "No gratuity expected" },
        { value: "15_percent", label: "15% is standard" },
        { value: "20_percent", label: "20% is customary" },
        { value: "at_discretion", label: "At guest discretion" },
      ],
    },
  ],

  standardRules: [
    "Captain's instructions must be followed at ALL times — immediately and without question",
    "A designated spotter MUST be watching the rider at all times (law in most states)",
    "Remain seated while the boat is underway at speed",
    "No smoking or glass containers permitted on board",
    "Illegal drugs and weapons are strictly prohibited",
    "No wake sports while under the influence of alcohol or drugs",
    "Do not enter the water until the captain confirms 'ENGINE OFF'",
    "Know the hand signals BEFORE your first ride",
  ],
  standardDos: [
    "Wear a USCG-approved life jacket for ALL watersports activities",
    "Give a THUMBS UP immediately after a fall to signal you are OK",
    "Use standard hand signals: thumbs up (faster), thumbs down (slower), pat head (stop)",
    "Apply lotion sunscreen regularly — NOT spray (slippery deck hazard)",
    "Stay hydrated and drink water between sets",
    "Communicate your experience level honestly to the captain",
    "Let go of the tow handle if you fall — do NOT hold on",
    "Stay clear of the swim platform while the engine is running (CO risk)",
  ],
  standardDonts: [
    "Do NOT sit on the swim platform while the engine is running (CO KILLS)",
    "No hard-soled shoes on board (damages EVA foam deck — soft soles or barefoot only)",
    "No glass bottles or containers at any time",
    "Do not wrap tow rope around hands, wrists, or any body part",
    "No swimming near the boat while the engine is running or in gear",
    "Do not distract the operator during towing maneuvers",
    "No leaning over the side of the boat while underway",
    "Do not throw anything overboard",
  ],

  whatToBring: [
    "Swimsuit and towel",
    "Rashguard or sun-protective clothing (highly recommended for riding)",
    "Lotion sunscreen SPF 30+ (NOT spray — deck hazard)",
    "Polarized sunglasses with retainer strap",
    "Hat for sun protection (between sets)",
    "Waterproof bag for electronics and personal items",
    "Reusable water bottle",
    "Change of dry clothes",
    "Any personal medications",
    "Non-drowsy motion sickness medication",
  ],
  whatNotToBring: [
    "Glass bottles or containers",
    "Hard-soled shoes (EVA foam deck damage — barefoot or soft soles only)",
    "Fishing gear (unless specifically permitted)",
    "Large hard-sided coolers (limited deck space)",
    "Drones (safety hazard around towed riders)",
    "Excessive personal gear (minimal storage on wake boats)",
    "Spray sunscreen (makes deck dangerously slippery)",
  ],

  waiverTemplate: `WAKE SPORTS BOAT CHARTER AND TOWED WATERSPORTS LIABILITY WAIVER

I, the undersigned, hereby acknowledge and agree to the following terms and conditions for participating in a wake sports boat charter operated by [OPERATOR NAME] ("the Operator").

1. VOLUNTARY PARTICIPATION
I acknowledge that I am voluntarily participating in a wake sports charter that involves specialized towed watersports. I understand that wakeboarding, wakesurfing, and other towed watersports are INHERENTLY DANGEROUS activities that can result in serious injury or death.

2. ASSUMPTION OF RISK — WAKE SPORTS
I voluntarily assume ALL risks associated with wakeboarding, wakesurfing, tubing, and other towed watersports. These risks include but are not limited to: impact injuries from falls at speed, drowning, concussion, spinal injuries, equipment failure, rope burns, collision with the boat or other objects, and propeller injury.

3. RELEASE OF LIABILITY
I hereby release, waive, and discharge the Operator, its owners, captains, crew members, and agents from any and all claims, demands, or causes of action arising from my participation in this charter, including claims of negligence.

4. SWIMMING COMPETENCY
I certify that I am a competent swimmer and am able to handle myself in open water in the event of a fall. I understand that towed watersports REQUIRE the ability to swim.

5. EQUIPMENT ACKNOWLEDGEMENT
I acknowledge that I have inspected the wake sports equipment provided and have determined it is in acceptable working order. I agree to use all equipment in a safe and responsible manner. I will notify the captain of any equipment concerns.

6. CARBON MONOXIDE WARNING
I understand that the boat's inboard engine produces carbon monoxide (CO) near the swim platform. CO is odorless and can cause sudden death. I will NOT sit on or linger near the swim platform while the engine is running.

7. CAPTAIN'S AUTHORITY
I agree to follow all instructions given by the captain immediately. The captain has absolute authority and may terminate any activity or the charter at any time for safety reasons. No refund will be issued for termination due to passenger conduct.

8. HAND SIGNALS
I confirm that I have been briefed on and understand the standard hand signals used for communication between rider, spotter, and driver.

9. ALCOHOL AND DRUGS
I agree NOT to participate in any wake sports activities while under the influence of alcohol or drugs. The captain may refuse service to any guest who appears impaired.

10. PROPERTY DAMAGE
I agree to be responsible for damage to the vessel, tower, equipment, or boards caused by negligence or misconduct.

11. GOVERNING LAW
This agreement shall be governed by the laws of the State of [STATE].

By signing below, I confirm that I have read, understood, and agree to all terms above.`,

  suggestedAddons: [
    { name: "Pro Wake Lesson (1 hour)", description: "Professional wakeboard or wakesurf instruction", emoji: "⭐", suggestedPrice: 15000 },
    { name: "Premium Board Rental", description: "High-performance wakeboard or wakesurf board", emoji: "🏄", suggestedPrice: 7500 },
    { name: "GoPro Rental & Video Package", description: "Tower-mounted camera with edited highlights", emoji: "📸", suggestedPrice: 5000 },
    { name: "Tubing Package (Multi-Rider)", description: "Towable tube for group fun between sets", emoji: "🍩", suggestedPrice: 5000 },
    { name: "Extended Session (Per Hour)", description: "Add extra riding time ($150–250/hr)", emoji: "⏱️", suggestedPrice: 20000 },
    { name: "Photography / Videography", description: "Professional action photos and video ($200–500)", emoji: "🎬", suggestedPrice: 35000 },
    { name: "Catering / Cooler Package", description: "Snacks, drinks, and ice for the group", emoji: "🧊", suggestedPrice: 3000 },
    { name: "Captain & Crew Gratuity", description: "Standard 15-20% of charter fee", emoji: "💵", suggestedPrice: 0 },
  ],
};

// ─────────────────────────────────────
// SUNSET CRUISE / TOUR
// ─────────────────────────────────────

const sunsetCruise: BoatTemplate = {
  label: "Sunset Cruise / Tour Vessel",
  emoji: "🌅",
  description: "Commercial sightseeing vessel for scheduled tours and sunset cruises. 30–150ft, 6–150+ passengers.",

  // ── USCG Subchapter T/K Mandatory + Tour Equipment ──
  standardEquipment: [
    "USCG-approved life jackets for all passengers and crew",
    "Ring life buoys with throw lines",
    "Fire extinguishers (fixed and portable per USCG Subchapter T)",
    "Visual Distress Signals — day/night (flares or electronic)",
    "Sound-producing device (horn or whistle)",
    "Emergency lighting system",
    "Navigation lights",
    "VHF radio (Channel 16)",
    "GPS / chart plotter with radar",
    "Depth sounder / compass",
    "First aid kit",
    "PA / sound system for narration and announcements",
    "Deck seating for maximum rated capacity",
    "Marine heads (restrooms) — count per capacity",
  ],
  optionalEquipment: [
    "Survival craft (life floats or inflatable buoyant apparatus — Subchapter T)",
    "AED (Automated External Defibrillator)",
    "Climate-controlled main cabin",
    "Multi-level observation decks",
    "Panoramic windows",
    "Professional bar / galley area",
    "Live music / DJ setup",
    "Mood / ambient lighting system",
    "Narration microphone / headset system",
    "Wheelchair accessibility features",
  ],

  amenityGroups: [
    {
      title: "Decks & Seating",
      items: [
        { key: "upper_deck", label: "Open-air upper sightseeing deck", default: true },
        { key: "enclosed_cabin", label: "Enclosed lower cabin", default: true },
        { key: "panoramic_windows", label: "Panoramic windows", default: false },
        { key: "fixed_seating", label: "Fixed bench / chair seating", default: true },
        { key: "climate_control", label: "Climate-controlled cabin (A/C / heat)", default: false },
        { key: "wheelchair", label: "Wheelchair accessible", default: false },
      ],
    },
    {
      title: "Service & Refreshments",
      items: [
        { key: "bar", label: "Professional bar service", default: true },
        { key: "galley", label: "Galley / food prep area", default: false },
        { key: "heads", label: "Marine heads (restrooms)", default: true },
        { key: "cash_register", label: "Cash register / POS system", default: false },
      ],
    },
    {
      title: "Entertainment & Experience",
      items: [
        { key: "sound_system", label: "PA / sound system", default: true },
        { key: "narration", label: "Commentary / narration system", default: false },
        { key: "mood_lighting", label: "Mood / ambient lighting", default: false },
        { key: "live_music", label: "Live music / DJ setup", default: false },
        { key: "photo_spot", label: "Designated photo spot / backdrop", default: false },
      ],
    },
  ],

  specificFields: [
    {
      key: "vessel_classification",
      label: "USCG vessel classification",
      type: "select",
      required: false,
      helpText: "Determines safety equipment and crew requirements",
      options: [
        { value: "upv_6pack", label: "Uninspected — OUPV / 6-Pack (≤6 passengers)" },
        { value: "subchapter_t", label: "Subchapter T — Small Passenger Vessel (≤150 pax)" },
        { value: "subchapter_k", label: "Subchapter K — Large Passenger Vessel (>150 pax)" },
      ],
    },
    {
      key: "captain_license",
      label: "Captain USCG license type",
      type: "select",
      required: false,
      helpText: "Master license required for inspected vessels (>6 pax)",
      options: [
        { value: "oupv", label: "OUPV / 6-Pack (≤6 passengers)" },
        { value: "master_25", label: "Master 25 GRT" },
        { value: "master_50", label: "Master 50 GRT" },
        { value: "master_100", label: "Master 100 GRT" },
      ],
    },
    {
      key: "route_type",
      label: "Tour route / description",
      type: "text",
      required: false,
      placeholder: "e.g. Miami Skyline & Star Island, San Francisco Bay Sunset",
      helpText: "Describe your primary tour route for guest marketing",
    },
    {
      key: "narration_language",
      label: "Narration / commentary language",
      type: "select",
      required: false,
      options: [
        { value: "english", label: "English only" },
        { value: "english_spanish", label: "English and Spanish" },
        { value: "multilingual", label: "Multilingual (3+ languages)" },
        { value: "no_narration", label: "No narration — music only" },
      ],
    },
    {
      key: "food_bev_policy",
      label: "Food & beverage policy",
      type: "select",
      required: true,
      options: [
        { value: "open_bar", label: "Open bar included in price" },
        { value: "cash_bar", label: "Cash bar onboard" },
        { value: "byob", label: "BYOB welcome (no glass)" },
        { value: "no_alcohol", label: "No alcohol" },
        { value: "drink_addon", label: "Drinks available as add-on package" },
        { value: "full_catering", label: "Full catering / dinner included" },
      ],
    },
    {
      key: "entertainment",
      label: "Live entertainment",
      type: "select",
      required: false,
      options: [
        { value: "none", label: "No live entertainment" },
        { value: "acoustic", label: "Live acoustic musician" },
        { value: "dj", label: "DJ playing music" },
        { value: "band", label: "Live band" },
        { value: "narrator", label: "Professional narrator / guide" },
      ],
    },
    {
      key: "dress_code",
      label: "Dress code",
      type: "select",
      required: false,
      options: [
        { value: "casual", label: "Casual attire" },
        { value: "resort_casual", label: "Resort casual (no swimwear)" },
        { value: "smart_casual", label: "Smart casual" },
        { value: "no_code", label: "No dress code" },
      ],
    },
    {
      key: "gratuity_expectation",
      label: "Gratuity guidance for guests",
      type: "select",
      required: false,
      helpText: "Industry standard is 15-20% of ticket/charter fee",
      options: [
        { value: "none", label: "No gratuity expected" },
        { value: "15_percent", label: "15% is standard" },
        { value: "20_percent", label: "20% is customary" },
        { value: "included", label: "Gratuity included in ticket price" },
        { value: "at_discretion", label: "At guest discretion" },
      ],
    },
  ],

  standardRules: [
    "All guests must remain seated while the vessel is docking or undocking",
    "Follow all crew and captain instructions immediately — their authority is final",
    "No throwing trash, food, or any items overboard",
    "Smoking and vaping only in designated areas (if any)",
    "Do not climb on railings, seats, or any structures",
    "Guests are NOT permitted in crew-only areas or the pilothouse",
    "Children must be supervised by an adult at all times",
    "The captain may terminate passage for unsafe behavior — no refund",
  ],
  standardDos: [
    "Use handrails when moving between decks, especially on stairs",
    "Arrive 15 minutes before departure — vessel departs ON TIME",
    "Bring a light jacket or sweater — it gets cool on the water at sunset",
    "Have your camera ready and choose your sunset-viewing side early",
    "Stay hydrated, especially on warm days",
    "Inform the crew immediately if you feel unwell or seasick",
    "Have valid ID ready for beverage service (21+)",
    "Ask the crew for sightseeing tips — they know the best photo angles",
  ],
  standardDonts: [
    "Do NOT stand on seats, tables, or railings for photos or views",
    "No high heels or slippery-soled shoes — boat decks can be slippery",
    "Do not bring outside alcohol unless permitted by the operator",
    "No unauthorized drones or remote aircraft",
    "Do not dangle arms or legs over the side while the vessel is moving",
    "Do not enter the pilothouse or helm station without permission",
    "No allowing children to run unsupervised on deck",
    "Do not interfere with crew while they are handling lines or equipment",
  ],

  whatToBring: [
    "Light jacket or sweater (cooler on the water, especially after sunset)",
    "Lotion sunscreen SPF 30+ (NOT spray)",
    "Sunglasses and hat",
    "Camera or smartphone (golden hour photos!)",
    "Comfortable, non-slip shoes (NO high heels)",
    "Valid ID for beverage service (21+)",
    "Cash for gratuity (customary to tip crew)",
    "Binoculars (for wildlife or landmarks)",
    "Small bag or clutch only (limited space)",
    "Motion sickness medication (if prone — take BEFORE boarding)",
  ],
  whatNotToBring: [
    "High heels (slippery deck hazard — STRONGLY discouraged)",
    "Hard-sided coolers (limited space, operator provides refreshments)",
    "Glass bottles or containers",
    "Outside alcohol (unless BYOB policy)",
    "Drones (prohibited for safety and regulatory reasons)",
    "Pets (unless service animals)",
    "Fishing equipment (this is a sightseeing tour, not a charter)",
  ],

  waiverTemplate: `SUNSET CRUISE / TOUR VESSEL PARTICIPATION AGREEMENT AND LIABILITY WAIVER

I, the undersigned, hereby acknowledge and agree to the following terms and conditions for participating in a cruise/tour operated by [OPERATOR NAME] ("the Operator").

1. VOLUNTARY PARTICIPATION
I acknowledge that I am voluntarily participating in a recreational boat cruise/tour. I understand that being on a vessel involves inherent risks including but not limited to: changing weather conditions, wave action, vessel motion, slips, falls, and other injuries.

2. ASSUMPTION OF RISK
I voluntarily assume ALL risks associated with this cruise, whether foreseeable or unforeseeable, including risks from vessel motion, weather changes, and water conditions.

3. RELEASE OF LIABILITY
I hereby release, waive, and discharge the Operator, its owners, captains, crew members, and agents from any and all claims, demands, or causes of action arising from my participation, including claims of negligence.

4. ALCOHOL CONSUMPTION
I agree to consume alcoholic beverages responsibly. I acknowledge that the Operator has the right to refuse service to any passenger who appears intoxicated. I assume all risks associated with the consumption of alcohol while on board.

5. FOLLOWING CREW INSTRUCTIONS
I agree to follow all safety instructions and directions given by the captain and crew at all times. I understand that failure to comply may result in the termination of my passage without refund.

6. PERSONAL PROPERTY
I understand that the Operator is not responsible for any lost, stolen, or damaged personal property brought on board. I will secure my belongings at all times.

7. PHOTOGRAPHY AND MEDIA
I consent to being photographed or recorded during the tour for promotional purposes by the Operator. If I wish to opt out, I will inform the crew before departure.

8. WEATHER AND CANCELLATION
I understand the captain may alter the route, shorten the tour, or cancel due to weather or safety concerns. Refund or rescheduling policies are at the Operator's discretion.

9. CAPTAIN'S AUTHORITY
The captain has absolute authority over all vessel operations. The captain may direct any passenger to disembark for safety reasons or misconduct.

10. GOVERNING LAW
This agreement shall be governed by the laws of the State of [STATE].

By signing below, I confirm that I have read, understood, and agree to all terms above.`,

  suggestedAddons: [
    { name: "Celebration Package", description: "Champagne bottle, small cake, and decorations ($75-200)", emoji: "🎂", suggestedPrice: 12500 },
    { name: "Premium Drink Upgrade", description: "Cocktails, top-shelf spirits, or champagne toast", emoji: "🍸", suggestedPrice: 1500 },
    { name: "Appetizer / Charcuterie Platter", description: "Cheese, meats, crackers, and fruit for the group", emoji: "🧀", suggestedPrice: 7500 },
    { name: "Private Table Reservation", description: "Guaranteed premium seating or private area", emoji: "📍", suggestedPrice: 5000 },
    { name: "Professional Photography", description: "Golden hour photo session during the cruise", emoji: "📸", suggestedPrice: 12000 },
    { name: "Live Music / Acoustic Set", description: "1-hour musician or DJ set onboard", emoji: "🎸", suggestedPrice: 20000 },
    { name: "Binocular Rental", description: "For wildlife spotting and distant landmarks", emoji: "🔭", suggestedPrice: 800 },
    { name: "Souvenir Merchandise", description: "Branded hat, t-shirt, or keepsake", emoji: "👕", suggestedPrice: 2500 },
  ],
};

// ─────────────────────────────────────
// CENTER CONSOLE (Versatile Fishing / Cruising)
// ─────────────────────────────────────

const centerConsole: BoatTemplate = {
  label: "Center Console",
  emoji: "🚤",
  description: "Versatile open-deck vessel with central helm. 18–50ft, 360° water access for fishing, cruising, and watersports.",

  // ── USCG Mandatory + Center Console Standard ──
  standardEquipment: [
    "Wearable PFD for each person (USCG Type I/II/III)",
    "Throwable PFD (USCG Type IV)",
    "Fire extinguisher(s) (Type B)",
    "Visual Distress Signals — day/night (flares or flags)",
    "Sound-producing device (horn or whistle)",
    "Navigation lights",
    "VHF radio (Channel 16)",
    "GPS / chart plotter with fishfinder / depth sounder",
    "First aid kit",
    "Anchor with sufficient rode",
    "Rod holders (gunwale and/or T-top mounted)",
    "Livewell for bait",
    "Fish box / insulated fish storage",
  ],
  optionalEquipment: [
    "Outriggers (offshore trolling)",
    "Radar (offshore operations)",
    "T-top or hardtop with shade",
    "Tow pylon or ski tow bar (watersports)",
    "Swim ladder",
    "Livewell upgrade (circulating)",
    "Downriggers (deep fishing)",
    "Trolling motor (inshore)",
    "Snorkel gear rental set",
    "Cooler / ice chest",
  ],

  amenityGroups: [
    {
      title: "Deck & Shade",
      items: [
        { key: "center_console", label: "Center helm console station", default: true },
        { key: "ttop", label: "T-top or hardtop shade", default: true },
        { key: "bow_seating", label: "Bow seating area", default: true },
        { key: "stern_seating", label: "Stern seating / casting platform", default: true },
        { key: "swim_ladder", label: "Swim ladder", default: false },
      ],
    },
    {
      title: "Fishing Utility",
      items: [
        { key: "rod_holders", label: "Rod holders (multiple)", default: true },
        { key: "livewell", label: "Livewell for bait", default: true },
        { key: "fish_box", label: "Insulated fish box", default: true },
        { key: "outriggers", label: "Outriggers (offshore)", default: false },
        { key: "fishfinder", label: "GPS / fishfinder / depth sounder", default: true },
      ],
    },
    {
      title: "Comfort",
      items: [
        { key: "cooler", label: "Cooler with ice and water", default: true },
        { key: "heads", label: "Marine head (inside console)", default: false },
        { key: "bluetooth", label: "Bluetooth audio system", default: false },
        { key: "raw_water_washdown", label: "Raw water washdown", default: false },
      ],
    },
  ],

  specificFields: [
    {
      key: "target_species",
      label: "Primary target fish species",
      type: "text",
      required: false,
      placeholder: "e.g. Snook, Redfish, Tarpon, Mahi-mahi, Tuna",
      helpText: "What species do you typically target on charters?",
    },
    {
      key: "fishing_style",
      label: "Fishing style / type",
      type: "select",
      required: false,
      options: [
        { value: "trolling", label: "Trolling (offshore)" },
        { value: "bottom", label: "Bottom fishing" },
        { value: "inshore", label: "Inshore / flats fishing" },
        { value: "fly", label: "Fly fishing" },
        { value: "spearfishing", label: "Spearfishing / freediving" },
        { value: "mixed", label: "Mixed / versatile" },
        { value: "cruising_only", label: "Cruising only (no fishing)" },
      ],
    },
    {
      key: "alcohol_policy",
      label: "Alcohol policy",
      type: "select",
      required: false,
      options: [
        { value: "beer_wine", label: "Beer and wine welcome (no glass)" },
        { value: "byob", label: "BYOB — no glass containers" },
        { value: "no_alcohol", label: "No alcohol" },
        { value: "provided", label: "Drinks provided / included" },
      ],
    },
    {
      key: "catering_options",
      label: "Catering / food options",
      type: "select",
      required: false,
      options: [
        { value: "byof", label: "Bring your own food and drinks" },
        { value: "boxed_lunch", label: "Boxed lunches available (add-on)" },
        { value: "full_catering", label: "Full catering provided" },
        { value: "none", label: "No food service" },
      ],
    },
    {
      key: "snorkel_available",
      label: "Snorkel gear available",
      type: "boolean",
      required: false,
      helpText: "Do you offer snorkel stops as part of fishing or cruising trips?",
    },
    {
      key: "watersports_available",
      label: "Watersports / tubing available",
      type: "boolean",
      required: false,
      helpText: "Do you offer towed watersports on this vessel?",
    },
    {
      key: "fish_cleaning_service",
      label: "Fish cleaning / filleting service",
      type: "select",
      required: false,
      options: [
        { value: "included", label: "Included in charter price" },
        { value: "addon", label: "Available as add-on ($25-50)" },
        { value: "none", label: "Not available" },
      ],
    },
    {
      key: "gratuity_expectation",
      label: "Gratuity guidance for guests",
      type: "select",
      required: false,
      helpText: "Industry standard is 15-20% of charter fee",
      options: [
        { value: "none", label: "No gratuity expected" },
        { value: "15_percent", label: "15% is standard" },
        { value: "20_percent", label: "20% is customary" },
        { value: "at_discretion", label: "At guest discretion" },
      ],
    },
  ],

  standardRules: [
    "Captain's authority is FINAL for the safety of all passengers",
    "Follow all state and federal fishing regulations (size and bag limits)",
    "No illegal drugs or firearms permitted on board",
    "Zero tolerance for unsafe intoxication — charter may be terminated without refund",
    "Children must be supervised by an adult at all times",
    "Do not throw anything overboard — dispose of trash in designated receptacles",
    "No bananas on board (fishing tradition — taken seriously)",
    "Keep hands and feet inside the boat during docking and maneuvering",
  ],
  standardDos: [
    "Listen carefully to the captain's safety and fishing briefing",
    "Ask questions about gear, techniques, or safety — the crew is here to help",
    "Stay hydrated and apply lotion sunscreen regularly (NOT spray — slippery deck)",
    "Inform the captain of any medical conditions before departure",
    "Look behind you BEFORE casting (hook hazard to other guests)",
    "Let the captain or mate handle all fish — many have sharp spines or barbs",
    "Wear polarized sunglasses (reduce glare and see fish in the water)",
    "Bring non-drowsy motion sickness medication (take BEFORE departure)",
  ],
  standardDonts: [
    "Do NOT bring bananas or banana-flavored products aboard",
    "No hard-soled shoes, boots, or high heels (soft-soled, non-marking only)",
    "No glass bottles or containers at any time",
    "Do not interfere with the helm, navigation, or fishing equipment",
    "Do not dangle hands or feet outside the boat while underway",
    "No entering the water while the engine is running or in gear",
    "Do not be late — the charter operates on a schedule",
    "Do not bring excessive baggage (limited storage on center consoles)",
  ],

  whatToBring: [
    "Polarized sunglasses (essential for seeing fish and reducing glare)",
    "Wide-brimmed hat for sun protection",
    "High-SPF lotion sunscreen (NOT spray — slippery deck)",
    "Non-marking, soft-soled shoes or fishing sandals",
    "Lightweight, sun-protective clothing (long-sleeved recommended)",
    "Camera / phone in waterproof case",
    "Reusable water bottle",
    "Personal medications and seasickness medication (take BEFORE boarding)",
    "Small soft-sided cooler with snacks/drinks (check operator policy)",
    "Cash for gratuity (customary 15-20%)",
  ],
  whatNotToBring: [
    "Bananas or banana-flavored products (fishing superstition)",
    "Glass bottles or containers",
    "Hard-soled shoes, boots, or high heels (deck damage risk)",
    "Excessive baggage (limited storage on center consoles)",
    "Firearms or illegal drugs (strictly prohibited)",
    "Drones (safety hazard near fishing lines)",
    "Spray sunscreen (makes deck dangerously slippery)",
  ],

  waiverTemplate: `CENTER CONSOLE CHARTER AGREEMENT AND LIABILITY WAIVER

I, the undersigned, hereby acknowledge and agree to the following terms and conditions for participating in a center console charter operated by [OPERATOR NAME] ("the Operator").

1. VOLUNTARY PARTICIPATION
I acknowledge that I am voluntarily participating in a boating charter that may involve fishing, cruising, snorkeling, and/or watersports activities. I understand that these activities involve inherent risks including injury and drowning.

2. ASSUMPTION OF RISK — FISHING
I voluntarily assume ALL risks associated with fishing activities, including but not limited to: injuries from fishing hooks, lines, and equipment; the unpredictable behavior of hooked fish and marine life; sunburn; dehydration; seasickness; and slipping on wet decks.

3. ASSUMPTION OF RISK — SWIMMING & SNORKELING
If I choose to enter the water for swimming or snorkeling, I acknowledge that I do so at my own risk. I am a competent swimmer. I am aware of risks from currents, marine life, and other underwater hazards.

4. RELEASE OF LIABILITY
I hereby release, waive, and discharge the Operator, its owners, captains, crew, and agents from any and all claims, demands, or causes of action arising from my participation, including claims of negligence.

5. FISHING REGULATIONS
I agree to comply with all applicable state and federal fishing regulations, including size and bag limits. I understand that any fines or penalties for violating these regulations are my SOLE responsibility.

6. EQUIPMENT RESPONSIBILITY
I acknowledge that I am responsible for the proper use and care of all equipment provided. I will report any equipment concerns to the captain before use.

7. CAPTAIN'S AUTHORITY
The captain has absolute authority over all operations. The captain may terminate the charter at any time for safety reasons or passenger misconduct. No refund will be issued for termination due to passenger conduct.

8. ALCOHOL AND DRUGS
I agree to consume alcohol responsibly, if permitted. The captain may refuse service and terminate the charter for intoxication that creates a safety risk.

9. PROPERTY DAMAGE
I agree to be responsible for damage to the vessel or equipment caused by my negligence or misconduct.

10. GOVERNING LAW
This agreement shall be governed by the laws of the State of [STATE].

By signing below, I confirm that I have read, understood, and agree to all terms above.`,

  suggestedAddons: [
    { name: "Live Bait Upgrade (Premium)", description: "Premium live bait for trophy fishing ($50-150)", emoji: "🦐", suggestedPrice: 10000 },
    { name: "Fish Cleaning & Filleting", description: "Professional cleaning with vacuum-sealed bags", emoji: "🔪", suggestedPrice: 3500 },
    { name: "GoPro Trip Rental", description: "Capture your fishing adventure on camera", emoji: "📸", suggestedPrice: 5000 },
    { name: "Catering Package", description: "Boxed lunches, snacks, and drinks ($25-75/person)", emoji: "🥪", suggestedPrice: 0 },
    { name: "Tubing / Watersports Package", description: "Towable tube and watersports add-on", emoji: "🍩", suggestedPrice: 10000 },
    { name: "Extended Trip Time", description: "Add extra hours to your charter ($100-200/hr)", emoji: "⏱️", suggestedPrice: 15000 },
    { name: "Snorkel Gear Rental", description: "Masks, fins, and snorkels for reef stops", emoji: "🤿", suggestedPrice: 2000 },
    { name: "Captain & Crew Gratuity", description: "Standard 15-20% of charter fee", emoji: "💵", suggestedPrice: 0 },
  ],
};

// ─────────────────────────────────────
// HOUSEBOAT / LIVE-ABOARD CHARTER
// ─────────────────────────────────────

const houseboat: BoatTemplate = {
  label: "Houseboat / Live-Aboard",
  emoji: "🏠",
  description: "Spacious multi-deck vessel for multi-day vacations. 30–90ft, combining home comforts with waterway freedom.",

  // ── USCG Mandatory + Live-Aboard Specific ──
  standardEquipment: [
    "Wearable PFD for each person (USCG Type I/II/III)",
    "Throwable PFD (USCG Type IV — life ring)",
    "Fire extinguishers (B-I/B-II marine type)",
    "Visual Distress Signals — day/night (coastal/Great Lakes)",
    "Sound-producing device (horn or whistle)",
    "Navigation lights",
    "Carbon monoxide (CO) detectors — installed and operational",
    "Gasoline ventilation system / bilge blower",
    "Backfire flame arrestor (gasoline engines)",
    "VHF radio (Channel 16)",
    "GPS / depth finder",
    "First aid kit",
    "Swim ladder",
    "Anchor with sufficient rode",
  ],
  optionalEquipment: [
    "Water slide (upper deck mounted)",
    "Outdoor grill / BBQ",
    "Kayak or paddleboard",
    "Small fishing skiff / dinghy",
    "Personal watercraft (Jet Ski) rental",
    "Fishing gear (rods, reels, tackle)",
    "Generator (onboard)",
    "Air conditioning / heating system",
    "Water sports equipment (skis, wakeboard, tube)",
    "Wi-Fi hotspot",
    "Floating mat / lily pad",
    "AED (Automated External Defibrillator)",
  ],

  amenityGroups: [
    {
      title: "Interior Comfort",
      items: [
        { key: "full_galley", label: "Full galley (fridge, stove, microwave)", default: true },
        { key: "marine_head", label: "Marine head with shower", default: true },
        { key: "beds_linens", label: "Beds with linens provided", default: true },
        { key: "ac_heat", label: "Air conditioning / heating", default: true },
        { key: "hot_water", label: "Hot water heater", default: false },
      ],
    },
    {
      title: "Exterior & Deck",
      items: [
        { key: "upper_deck", label: "Upper sun deck / flybridge", default: true },
        { key: "outdoor_grill", label: "Outdoor grill / BBQ", default: false },
        { key: "swim_ladder", label: "Swim ladder", default: true },
        { key: "water_slide", label: "Water slide", default: false },
        { key: "railings", label: "Safety railings on all decks", default: true },
      ],
    },
    {
      title: "Entertainment",
      items: [
        { key: "tv_media", label: "TV / media system", default: false },
        { key: "bluetooth", label: "Bluetooth audio system", default: false },
        { key: "wifi", label: "Wi-Fi (if equipped)", default: false },
        { key: "board_games", label: "Board games / cards", default: false },
      ],
    },
    {
      title: "Water Activities",
      items: [
        { key: "kayak", label: "Kayak / paddleboard", default: false },
        { key: "fishing_gear", label: "Fishing gear available", default: false },
        { key: "snorkel_gear", label: "Snorkel gear", default: false },
        { key: "tube", label: "Towable tube", default: false },
        { key: "floating_mat", label: "Floating mat / lily pad", default: false },
        { key: "jet_ski", label: "Jet Ski rental available", default: false },
      ],
    },
  ],

  specificFields: [
    {
      key: "cruising_limits",
      label: "Cruising area boundaries",
      type: "text",
      required: true,
      placeholder: "e.g. Lake Powell North Basin only, Cumberland River mile markers 45-120",
      helpText: "Define the exact geographic boundaries the houseboat may operate within",
    },
    {
      key: "generator_hours",
      label: "Generator operating hours",
      type: "text",
      required: false,
      placeholder: "e.g. 8:00 AM - 10:00 PM",
      helpText: "When can the generator be run? (quiet hours enforcement)",
    },
    {
      key: "pet_policy",
      label: "Pet policy",
      type: "select",
      required: false,
      options: [
        { value: "no_pets", label: "No pets allowed" },
        { value: "pets_fee", label: "Pets allowed with additional fee" },
        { value: "pets_free", label: "Pets welcome (no extra fee)" },
        { value: "service_only", label: "Service animals only" },
      ],
    },
    {
      key: "fuel_policy",
      label: "Fuel service / policy",
      type: "select",
      required: false,
      options: [
        { value: "prepaid", label: "Pre-paid fuel package" },
        { value: "market_rate", label: "Market rate at fuel dock" },
        { value: "included", label: "Fuel included in charter price" },
        { value: "byof", label: "Renter handles fueling" },
      ],
    },
    {
      key: "alcohol_policy",
      label: "Alcohol policy",
      type: "select",
      required: false,
      options: [
        { value: "byob", label: "BYOB — no glass containers" },
        { value: "provided", label: "Alcohol included / provided" },
        { value: "no_alcohol", label: "No alcohol permitted" },
        { value: "purchase_onboard", label: "Available for purchase through operator" },
      ],
    },
    {
      key: "quiet_hours",
      label: "Quiet hours enforcement",
      type: "text",
      required: false,
      placeholder: "e.g. 10:00 PM - 8:00 AM",
      helpText: "Standard quiet hours for generator, music, and noise",
    },
    {
      key: "linens_provided",
      label: "Linens and towels provided",
      type: "boolean",
      required: false,
      helpText: "Are bed linens, pillows, and bath towels included?",
    },
    {
      key: "provisioning_available",
      label: "Provisioning service available",
      type: "boolean",
      required: false,
      helpText: "Can the boat be pre-stocked with groceries before arrival?",
    },
    {
      key: "gratuity_expectation",
      label: "Gratuity guidance for guests",
      type: "select",
      required: false,
      helpText: "Industry standard is 15-20% of charter fee",
      options: [
        { value: "none", label: "No gratuity expected" },
        { value: "15_percent", label: "15% is standard" },
        { value: "20_percent", label: "20% is customary" },
        { value: "at_discretion", label: "At guest discretion" },
      ],
    },
  ],

  standardRules: [
    "No smoking permitted INSIDE the cabin — ever",
    "Quiet hours strictly enforced (generator, music, noise) per posted times",
    "Only the designated captain/operator may operate the vessel",
    "Passenger count must NEVER exceed the vessel's stated capacity",
    "Do not dispose of any trash, waste, or sewage overboard",
    "Marine toilet: flush ONLY human waste and provided TP (nothing else — EVER)",
    "All guests must comply with captain's instructions, especially safety matters",
    "Children must be supervised on ALL decks and near the water slide at all times",
  ],
  standardDos: [
    "Listen carefully to the pre-departure safety and orientation briefing",
    "Run the bilge blower for 4 MINUTES before starting gasoline engines",
    "Know the location of all fire extinguishers and exits BEFORE your first night",
    "Conserve fresh water and battery power while anchored overnight",
    "Report any safety, mechanical, or plumbing concerns IMMEDIATELY",
    "Secure all personal belongings while the boat is underway",
    "Use the swim ladder to enter and exit the water safely",
    "Keep all decks clear of tripping hazards (bags, shoes, toys)",
  ],
  standardDonts: [
    "Do NOT flush anything but human waste and provided TP (clogs cost $500+)",
    "Do NOT lean against, sit on, or climb over railings",
    "Do NOT swim alone — always have a buddy and someone watching",
    "Do NOT swim at night — rescue in darkness is nearly impossible",
    "Do NOT leave children unattended on decks, near the slide, or near water",
    "Do NOT jump or dive from the upper deck or roof",
    "Do NOT sleep with windows closed while the generator is running (CO risk)",
    "Do NOT bring illegal drugs or firearms aboard",
  ],

  whatToBring: [
    "Soft-sided duffel bags (NO hard suitcases — limited storage)",
    "Sunscreen, hat, and sunglasses",
    "Swimsuits and beach towels",
    "Non-slip shoes with non-marking soles",
    "Insect repellent (essential for lake and river locations)",
    "Casual clothing and a light jacket for cooler evenings",
    "Personal medications (including seasickness if prone)",
    "Reusable water bottle",
    "Camera / phone with waterproof case",
    "A good book and entertainment for quiet evenings",
  ],
  whatNotToBring: [
    "Hard-sided luggage or suitcases (soft bags only — no storage)",
    "Glass bottles or containers (use cans or plastic)",
    "Valuables that could be damaged by water",
    "Pets (unless specifically authorized — check pet policy)",
    "Your own water toys or inflatables (check with operator first)",
    "Non-reef-safe sunscreen (if in protected waters)",
    "Fireworks or open flame devices",
  ],

  waiverTemplate: `HOUSEBOAT / LIVE-ABOARD CHARTER AGREEMENT AND LIABILITY WAIVER

I, the undersigned, hereby acknowledge and agree to the following terms and conditions for participating in a houseboat charter operated by [OPERATOR NAME] ("the Operator").

1. VOLUNTARY PARTICIPATION
I acknowledge that I am voluntarily participating in a multi-day houseboat charter. I understand that living aboard a vessel involves inherent risks including but not limited to: drowning, carbon monoxide exposure, slips and falls, fire, and weather-related hazards.

2. ASSUMPTION OF RISK — WATER ACTIVITIES
I voluntarily assume ALL risks associated with swimming, water slides, water sports, and other aquatic activities during this charter. I acknowledge that these activities can result in serious injury or death.

3. CARBON MONOXIDE ACKNOWLEDGEMENT
I understand that the vessel's engine and generator produce carbon monoxide (CO), a colorless, odorless, poisonous gas. I agree to follow ALL CO safety protocols including: never blocking exhaust outlets, never swimming near the stern while engines/generator are running, and never sleeping with windows closed while the generator is operating.

4. RELEASE OF LIABILITY
I hereby release, waive, and discharge the Operator, its owners, captains, crew, and agents from any and all claims, demands, or causes of action arising from my participation, including claims of negligence.

5. BAREBOAT OPERATION (IF APPLICABLE)
If this is a bareboat charter, I certify that I am experienced and competent in handling a vessel of this size and type. I accept full responsibility for the safe operation of the vessel and compliance with all applicable laws and regulations.

6. MARINE SANITATION
I agree to use the marine toilet ONLY for human waste and provided marine-grade toilet paper. I understand that flushing any other materials will cause damage requiring professional repair, and I accept financial responsibility for any such damage.

7. SLIDES AND WATER TOYS
I assume all risks associated with the use of water slides, water toys, and other provided equipment. I agree to use them safely, only when the boat is anchored in deep water, and to supervise all minors at all times.

8. PROPERTY DAMAGE
I agree to be responsible for damage to the vessel, its fixtures, equipment, or furnishings caused by my negligence, misconduct, or failure to follow operating instructions.

9. CAPTAIN'S AUTHORITY
The captain has absolute authority over all vessel operations. The charter may be terminated at any time for safety reasons or guest misconduct. No refund will be issued for early termination due to passenger conduct.

10. OVERNIGHT SAFETY
I agree to follow all overnight safety protocols including CO detector verification, proper ventilation, fire prevention procedures, and securing all hatches and doors.

11. GOVERNING LAW
This agreement shall be governed by the laws of the State of [STATE].

By signing below, I confirm that I have read, understood, and agree to all terms above.`,

  suggestedAddons: [
    { name: "Provisioning Service", description: "Boat stocked with groceries before arrival (cost + 20-30% fee)", emoji: "🛒", suggestedPrice: 0 },
    { name: "Jet Ski / PWC Rental", description: "Personal watercraft for high-speed fun ($300-500/day)", emoji: "🚤", suggestedPrice: 40000 },
    { name: "Professional Captain Hire", description: "Licensed captain to operate the boat ($300-600/day)", emoji: "👨‍✈️", suggestedPrice: 45000 },
    { name: "Small Fishing Skiff Rental", description: "Explore coves and fish from a smaller boat ($150-300/day)", emoji: "🎣", suggestedPrice: 22500 },
    { name: "Damage Waiver / Trip Insurance", description: "Peace of mind coverage ($50-150/trip)", emoji: "🛡️", suggestedPrice: 10000 },
    { name: "Water Sports Package", description: "Skis, wakeboard, and towable tube ($50-100/day)", emoji: "🏄", suggestedPrice: 7500 },
    { name: "Fishing Gear Rental", description: "Rods, reels, and tackle ($25-50/person/day)", emoji: "🐟", suggestedPrice: 3500 },
    { name: "Captain & Crew Gratuity", description: "Standard 15-20% of charter fee", emoji: "💵", suggestedPrice: 0 },
  ],
};

// ─────────────────────────────────────
// OTHER
// ─────────────────────────────────────

const other: BoatTemplate = {
  label: "Other vessel",
  emoji: "🚢",
  description: "Custom vessel type",

  standardEquipment: ["Life jackets for all passengers", "VHF radio (Channel 16)", "First aid kit", "Fire extinguisher", "Flares or signalling device"],
  optionalEquipment: ["GPS / chart plotter", "Sound system", "Swim platform", "Anchor and rode"],

  amenityGroups: [
    {
      title: "Basics",
      items: [
        { key: "heads", label: "Onboard bathroom", default: false },
        { key: "shade", label: "Sun shade / bimini top", default: false },
        { key: "cooler", label: "Cooler / ice chest", default: false },
        { key: "bluetooth", label: "Bluetooth speaker", default: false },
      ],
    },
  ],

  specificFields: [
    {
      key: "vessel_description",
      label: "Describe your vessel type",
      type: "text" as const,
      required: true,
      placeholder: "e.g. Airboat, Tugboat, Hovercraft…",
    },
    {
      key: "propulsion_type",
      label: "Propulsion type",
      type: "select" as const,
      required: false,
      options: [
        { value: "inboard", label: "Inboard motor" },
        { value: "outboard", label: "Outboard motor" },
        { value: "jet", label: "Jet drive" },
        { value: "sail", label: "Sail" },
        { value: "paddle", label: "Paddle / manual" },
        { value: "other", label: "Other" },
      ],
    },
  ],

  standardRules: [
    "Follow captain's instructions at all times",
    "Life jackets must be accessible for all passengers",
    "No swimming without captain approval",
    "Inform captain of any medical conditions before departure",
  ],
  standardDos: [
    "Wear appropriate non-skid footwear",
    "Apply sunscreen before boarding",
    "Hold handrails when moving on the vessel",
    "Stay hydrated — bring water",
  ],
  standardDonts: [
    "No glass bottles on the vessel",
    "No throwing objects overboard",
    "No standing on railings or gunwales",
    "No operating vessel equipment without permission",
  ],
  whatToBring: ["Valid ID", "Sunscreen", "Towel", "Water bottle", "Change of clothes"],
  whatNotToBring: ["Glass bottles", "Sharp objects", "Hard-sided luggage"],

  waiverTemplate: `CHARTER AGREEMENT AND LIABILITY WAIVER

I, the undersigned, acknowledge that I am voluntarily participating in a recreational boating activity that involves inherent risks, including but not limited to: falling overboard, collision, equipment failure, weather exposure, and personal injury.

I voluntarily assume all risks associated with this charter and release the Operator, its owners, captains, crew members, and agents from any and all claims, demands, or causes of action arising from my participation.

CAPTAIN'S AUTHORITY: The captain has absolute authority over vessel operations and safety decisions.

By signing below, I confirm that I have read, understood, and agree to all terms above.`,

  suggestedAddons: [
    { name: "Photography Package", description: "On-water photo session", emoji: "📸", suggestedPrice: 5000 },
    { name: "Cooler with Drinks", description: "Pre-stocked cooler with water, sodas, ice", emoji: "🧊", suggestedPrice: 2500 },
    { name: "Custom Experience", description: "Personalized add-on for your trip", emoji: "🎁", suggestedPrice: 0 },
  ],
};

// ─────────────────────────────────────
// PERSONAL WATERCRAFT (JET SKI / PWC)
// ─────────────────────────────────────

const pwc: BoatTemplate = {
  label: "Personal Watercraft (Jet Ski)",
  emoji: "🏍️",
  description: "Jet Ski, WaveRunner, Sea-Doo, or similar personal watercraft rentals",
  standardEquipment: [
    "USCG-approved life jacket (Type III)",
    "Engine cut-off lanyard",
    "Whistle / sound signaling device",
    "Fire extinguisher",
    "Rearview mirror",
  ],
  optionalEquipment: [
    "Wetsuit / rash guard",
    "Dry bag for personal items",
    "GoPro mount",
    "Tow rope",
  ],
  amenityGroups: [
    {
      title: "Safety Gear",
      items: [
        { key: "life_jacket_included", label: "Life jacket included", default: true },
        { key: "lanyard_included", label: "Engine cut-off lanyard", default: true },
        { key: "wetsuit_available", label: "Wetsuit available", default: false },
      ],
    },
    {
      title: "Extras",
      items: [
        { key: "gopro_mount", label: "GoPro mount", default: false },
        { key: "tow_rope", label: "Tow rope", default: false },
        { key: "dry_bag", label: "Dry bag", default: false },
      ],
    },
  ],
  specificFields: [
    {
      key: "pwc_brand",
      label: "PWC Brand",
      type: "select",
      required: false,
      options: [
        { value: "yamaha", label: "Yamaha WaveRunner" },
        { value: "seadoo", label: "Sea-Doo" },
        { value: "kawasaki", label: "Kawasaki Jet Ski" },
        { value: "other", label: "Other" },
      ],
    },
    {
      key: "max_riders",
      label: "Max Riders",
      type: "select",
      required: false,
      options: [
        { value: "1", label: "1 (Solo)" },
        { value: "2", label: "2 (Tandem)" },
        { value: "3", label: "3" },
      ],
    },
  ],
  standardRules: [
    "Engine cut-off lanyard must be attached at all times",
    "Life jacket must be worn at all times — no exceptions",
    "Speed limit: 5 MPH within 200ft of shore, docks, or swimmers",
    "No wake jumping within 100ft of another vessel",
    "No riding between sunset and sunrise",
    "No alcohol consumption before or during operation",
    "Operator must meet state minimum age requirements",
  ],
  standardDos: [
    "✅ Wear life jacket at all times",
    "✅ Attach engine cut-off lanyard before starting",
    "✅ Maintain safe distance from all vessels and swimmers",
    "✅ Return to dock at the agreed-upon time",
    "✅ Report any mechanical issues immediately",
  ],
  standardDonts: [
    "🚫 No wake jumping near other boats (100ft rule)",
    "🚫 No spraying other vessels or swimmers",
    "🚫 No operating under the influence of alcohol or drugs",
    "🚫 No riding after dark",
    "🚫 No modifications to engine or safety equipment",
  ],
  whatToBring: [
    "Swimsuit / wetsuit",
    "Sunscreen (reef-safe if applicable)",
    "Sunglasses with strap",
    "Water shoes",
    "Valid photo ID",
    "Boating safety card (if required by state)",
  ],
  whatNotToBring: [
    "Glass items",
    "Loose jewelry",
    "Electronics without waterproof case",
    "Valuables you can't afford to lose",
  ],
  waiverTemplate: `PERSONAL WATERCRAFT (PWC) RENTAL AGREEMENT AND LIABILITY WAIVER

I acknowledge that operating a personal watercraft (PWC / Jet Ski) involves inherent risks including but not limited to: collision, drowning, injury from impact, equipment malfunction, and exposure to weather conditions.

I certify that:
• I meet the minimum age requirement to operate a PWC in this state.
• I understand that a PWC loses steering when the throttle is released.
• I will wear the engine cut-off lanyard at all times while underway.
• I will wear a USCG-approved life jacket at all times.
• I will not operate this PWC under the influence of alcohol or drugs.
• I will obey all posted speed limits and no-wake zones.
• I will not jump wakes within 100ft of another vessel.

I voluntarily assume all risks associated with PWC operation and release the Operator from all liability for personal injury, property damage, or death arising from use of this vessel.

By signing below, I confirm that I have read, understood, and agree to all terms above.`,
  suggestedAddons: [
    {
      name: "GoPro Rental",
      description: "Waterproof action camera with mount",
      emoji: "📷",
      suggestedPrice: 25,
    },
    {
      name: "Wetsuit Rental",
      description: "Full-body wetsuit for cold water",
      emoji: "🤿",
      suggestedPrice: 15,
    },
    {
      name: "Extended Ride (30min)",
      description: "Add 30 minutes to your rental",
      emoji: "⏱️",
      suggestedPrice: 40,
    },
  ],
};

// ─────────────────────────────────────
// EXPORT MAP
// ─────────────────────────────────────

export const BOAT_TEMPLATES: Record<BoatTypeKey, BoatTemplate> = {
  motor_yacht: motorYacht,
  fishing_charter: fishingCharter,
  catamaran,
  power_catamaran: powerCatamaran,
  pontoon,
  snorkel_dive: snorkelDive,
  sailing_yacht: sailingYacht,
  speedboat,
  wake_sports: wakeSports,
  sunset_cruise: sunsetCruise,
  center_console: centerConsole,
  houseboat,
  pwc,
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
