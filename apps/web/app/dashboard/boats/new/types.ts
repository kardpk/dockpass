export type BoatTypeKey =
  | "motor_yacht"
  | "fishing_charter"
  | "catamaran"
  | "power_catamaran"
  | "pontoon"
  | "snorkel_dive"
  | "sailing_yacht"
  | "speedboat"
  | "wake_sports"
  | "sunset_cruise"
  | "center_console"
  | "houseboat"
  | "pwc"
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
  compliance_target: 'bareboat_only' | 'passengers_only' | 'all';
  max_length_ft?: number;
  min_length_ft?: number;
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
// Single canonical source — merged from former safetyCardTemplates + BOAT_SPECIFIC_TOPICS.

export interface BoatSpecificTopic {
  key: string;
  label: string;
  emoji: string;
  defaultInstructions: string;
  /** Who must acknowledge: bareboat operator, passengers only, or everyone */
  compliance_target?: 'bareboat_only' | 'passengers_only' | 'all';
  /** Only show if vessel length ≤ this value (ft). E.g. ECOS law applies to boats <26ft */
  max_length_ft?: number;
  /** Only show if vessel length ≥ this value (ft) */
  min_length_ft?: number;
}

export const BOAT_SPECIFIC_TOPICS: Record<string, BoatSpecificTopic[]> = {
  speedboat: [
    { key: "propeller_swim_platform", label: "Propeller Safety (CRITICAL)", emoji: "⚠️", defaultInstructions: "NEVER swim near the stern while the engine is running — even when in neutral or idle. The propeller is EXTREMELY dangerous and can cause fatal injuries. The engine MUST be fully OFF before anyone enters the water or uses the swim ladder. The propeller danger zone extends 10 feet behind the transom. Wait for the captain's explicit 'ENGINE OFF' before entering the water.", compliance_target: "all" },
    { key: "high_speed_seating", label: "High-Speed Seating Rule", emoji: "💺", defaultInstructions: "ALL passengers MUST remain seated in designated cockpit or bow seating areas while the boat is underway, especially at high speed. Do NOT sit on the bow, gunwales, sunpad, or swim platform while moving. Keep hands and feet inside the boat at all times. Standing or moving at speed risks ejection and serious injury.", compliance_target: "all" },
    { key: "carbon_monoxide_stern", label: "Carbon Monoxide (Stern Warning)", emoji: "💨", defaultInstructions: "Engine exhaust produces deadly carbon monoxide (CO). NEVER sit, swim, or linger near the stern exhaust outlets while the engine is running. CO is odorless and colorless — it can cause sudden loss of consciousness and drowning. Do not 'teak surf' or body surf behind the boat. This is LETHAL.", compliance_target: "all" },
    { key: "ecos_kill_switch", label: "Engine Cut-Off Switch (ECOS)", emoji: "🔑", defaultInstructions: "By federal law (April 2021), operators of vessels under 26ft must wear the ECOS lanyard at all times while on plane or above displacement speed. If you are ejected, this instantly kills the engine and prevents a fatal prop-strike from a runaway circling boat. Do not disconnect or ignore the ECOS.", compliance_target: "bareboat_only", max_length_ft: 26 },
    { key: "wake_awareness", label: "Wake Zone & Speed Laws", emoji: "🌊", defaultInstructions: "Slow-speed/no-wake zones are enforced near shore, marinas, docks, swim areas, and manatee zones. Violating wake zones is a criminal offense with fines up to $500. You are legally responsible for damage caused by your wake. Watch for posted signs and reduce speed when approaching any structure or shallow water.", compliance_target: "bareboat_only" },
    { key: "watersports_spotter", label: "Watersports Spotter Required", emoji: "👀", defaultInstructions: "A designated SPOTTER must watch any towed rider at ALL times — this is law in most states. The spotter must face backward and maintain visual contact with the rider. Use standard hand signals: thumbs UP = speed up, thumbs DOWN = slow down, pat on head = STOP. The spotter communicates between rider and captain.", compliance_target: "all" },
  ],
  wake_sports: [
    { key: "hand_signals_communication", label: "Hand Signals (MANDATORY)", emoji: "✋", defaultInstructions: "You MUST know these hand signals BEFORE riding. Thumbs UP = speed up. Thumbs DOWN = slow down. Pat on head = STOP / I'm finished. Finger across throat = CUT ENGINE. After a fall, give a THUMBS UP immediately to signal you are OK. If you do NOT signal, the captain will initiate an emergency recovery.", compliance_target: "all" },
    { key: "carbon_monoxide_swim_platform", label: "Carbon Monoxide — Swim Platform (CRITICAL)", emoji: "💨", defaultInstructions: "Wake boats have INBOARD engines with exhaust near the swim platform. Carbon monoxide (CO) is an ODORLESS, COLORLESS gas that accumulates near the stern. NEVER sit, hang, or linger on the swim platform while the engine is running or idling. CO poisoning causes sudden loss of consciousness and drowning. This has caused multiple fatalities. Stay AWAY from the stern while the engine is on.", compliance_target: "all" },
    { key: "spotter_requirement", label: "Designated Spotter (MANDATORY)", emoji: "👀", defaultInstructions: "By law in most states, a DESIGNATED SPOTTER must watch any towed rider at ALL times. The spotter must face backward, maintain continuous visual contact with the rider, and communicate rider status to the driver using hand signals. The spotter is the rider's safety lifeline — this role is NOT optional.", compliance_target: "all" },
    { key: "propeller_wake_boat", label: "Propeller Safety (Under-Hull)", emoji: "⚠️", defaultInstructions: "Wake boats have INBOARD engines with the propeller UNDER the hull — it is NOT visible from above. NEVER enter or exit the water while the engine is in gear or running. Wait for the captain's explicit 'ENGINE OFF' before entering the water. The propeller creates suction that can pull swimmers toward it.", compliance_target: "all" },
    { key: "tow_line_safety", label: "Tow Line & Rope Safety", emoji: "🪢", defaultInstructions: "NEVER wrap the tow rope around your hands, wrists, arms, or any body part. If you fall, LET GO of the handle immediately. A tow rope under load can cause severe rope burns, dislocations, or drag injuries. When not in use, keep the tow rope clear of the propeller area.", compliance_target: "all" },
    { key: "ecos_wake_boat", label: "Engine Cut-Off Switch (ECOS)", emoji: "🔑", defaultInstructions: "By federal law (April 2021), the operator must wear the ECOS lanyard at all times while the boat is on plane. If the operator is ejected, this instantly kills the engine and prevents the boat from circling back into riders in the water.", compliance_target: "bareboat_only", max_length_ft: 26 },
    { key: "ballast_weight_awareness", label: "Ballast & Weight Distribution", emoji: "⚖️", defaultInstructions: "Wake boats use ballast tanks to create larger wakes. When ballast is engaged, the boat sits LOWER in the water and handles differently. Do not move around the boat while ballast is filling or draining. Follow the captain's instructions about passenger positioning — weight distribution affects wake shape and boat stability.", compliance_target: "all" },
  ],
  center_console: [
    { key: "hands_feet_docking", label: "Hands & Feet Inside (CRITICAL)", emoji: "✋", defaultInstructions: "Keep your hands and feet INSIDE the boat at ALL TIMES, especially during docking and maneuvering. The open deck plan means your limbs can easily be caught between the boat and dock, pilings, or other vessels. NEVER use your hands or feet to fend off from a dock — this causes crushed fingers and broken bones.", compliance_target: "all" },
    { key: "hook_line_hazards", label: "Hook & Line Hazards", emoji: "🪝", defaultInstructions: "Fishing hooks are razor-sharp. ALWAYS look behind you before casting. Watch for other guests' lines and the location of hooks at all times. When a fish is on the line, stand clear of the rod tip and line under tension — a snapped line can whip back at high speed. The captain or mate will handle all hook removals.", compliance_target: "all" },
    { key: "propeller_center_console", label: "Outboard Propeller Safety", emoji: "⚠️", defaultInstructions: "Center consoles are powered by outboard motor(s) with EXPOSED propellers at the stern. NEVER enter or exit the water near the engines. The engine MUST be OFF and in NEUTRAL before anyone enters the water. Do not stand on the swim platform while engines are running. The propeller danger zone extends 10 feet behind the transom.", compliance_target: "all" },
    { key: "sun_heat_exposure", label: "Sun & Heat Exposure", emoji: "☀️", defaultInstructions: "Center consoles have limited shade. The combination of direct sun, reflected UV from the water, and salt spray can cause rapid dehydration and sunburn. Apply high-SPF lotion sunscreen (NOT spray — slippery deck) BEFORE boarding and reapply every 90 minutes. Drink water continuously. Wear a hat, polarized sunglasses, and sun-protective clothing.", compliance_target: "all" },
    { key: "fish_handling_safety", label: "Fish Handling Safety", emoji: "🐟", defaultInstructions: "Many fish have sharp fins, spines, teeth, or barbs that can cause puncture wounds and infections. NEVER grab a fish without the captain's guidance. Some species (catfish, lionfish, stonefish) are venomous. Let the captain or mate handle all fish — they have the tools and experience to do so safely.", compliance_target: "all" },
    { key: "no_bananas_superstition", label: "No Bananas Aboard", emoji: "🍌", defaultInstructions: "This is a long-standing fishing superstition taken seriously by captains and crews. No bananas or banana-flavored products on board. While its origins are debated, respecting this tradition shows respect for the captain and crew.", compliance_target: "all" },
  ],
  pwc: [
    { key: "ecos_kill_switch", label: "Engine Cut-Off Switch (ECOS)", emoji: "🔑", defaultInstructions: "Always wear the lanyard. If you fall off, the PWC will stop. Required by federal law.", compliance_target: "all" },
    { key: "propeller_strike_hazard", label: "Jet Intake Hazard", emoji: "⚠️", defaultInstructions: "Never put hands, feet, or hair near the jet intake at the rear. Hair entanglement can cause drowning.", compliance_target: "all" },
    { key: "pfd_required_always", label: "PFD Required at All Times", emoji: "🦺", defaultInstructions: "ALL persons aboard a PWC or being towed behind one MUST wear a USCG-approved life jacket (Type I, II, or III) at all times. This is federal law — no exceptions, no excuses.", compliance_target: "all" },
    { key: "off_throttle_steering", label: "Off-Throttle Steering Warning", emoji: "⚠️", defaultInstructions: "PWCs lose ALL steering ability when the throttle is released. Unlike a car, letting go does NOT stop you — you will coast in a straight line with no directional control. Always maintain throttle through turns. If you see an obstacle, steer around it WITH throttle — do not release.", compliance_target: "all" },
    { key: "wake_jumping_ban", label: "Wake Jumping Prohibition", emoji: "🚫", defaultInstructions: "It is illegal to jump or attempt to jump the wake of another vessel within 100 feet. Violating this law can result in reckless operation charges and immediate citation. Maintain safe distance from all vessel wakes.", compliance_target: "all" },
    { key: "pwc_lanyard_law", label: "Engine Cut-Off Lanyard (Required by Law)", emoji: "🔗", defaultInstructions: "If your PWC is equipped with a lanyard-type engine cut-off switch, state and federal law requires you to attach it to your person, clothing, or life jacket AT ALL TIMES while underway. Failure to do so is a citable offense.", compliance_target: "all" },
    { key: "pwc_speed_zones", label: "Speed Restriction Zones", emoji: "🐢", defaultInstructions: "You must operate at 'slow-no-wake' speed (max 5 MPH) within 200 feet of shoreline, docks, swim areas, boat launches, and marinas. Within 100 feet of a swimmer, slow to idle speed.", compliance_target: "all" },
  ],
  pontoon: [
    { key: "weight_distribution", label: "Weight Distribution", emoji: "⚖️", defaultInstructions: "Distribute passengers and gear EVENLY around the boat to maintain stability. Do NOT congregate all passengers in the bow or on one side — this causes listing. Shifting too much weight forward at speed can cause the bow to submarine (dive underwater). Keep weight balanced port and starboard at all times.", compliance_target: "all" },
    { key: "railing_safety", label: "Stay Inside Railings", emoji: "🚧", defaultInstructions: "Keep ALL gates closed while underway. Do not sit on exterior railings or gates. No riding on the bow outside the fence. Under FWC law, sitting on the front deck outside the railing while underway is reckless operation — a fall results in being immediately run over by the pontoon logs and propeller.", compliance_target: "all" },
    { key: "propeller_zone", label: "Propeller Safety (CRITICAL)", emoji: "⚠️", defaultInstructions: "NEVER swim near the rear of the boat while the engine is running — even in neutral. The propeller can cause FATAL injuries. Wait for the captain's explicit 'ENGINE OFF' confirmation before anyone enters the water. Use the swim ladder for re-boarding. The propeller danger zone extends 10 feet behind the transom.", compliance_target: "all" },
    { key: "child_pfd_mandatory", label: "Children's Life Jacket Rule", emoji: "👶", defaultInstructions: "Children under 13 MUST wear a properly fitted, USCG-approved PFD at ALL times while the boat is underway (federal law). Life jackets for all sizes are located in [LOCATION]. Ensure each child has a PFD that fits snugly — it should not ride up over their chin. Supervise children at all times.", compliance_target: "all" },
    { key: "bow_riding", label: "Illegal Bow Riding", emoji: "🚫", defaultInstructions: "Under FWC law, sitting on the front deck outside the railing while underway is reckless operation. A fall results in being immediately run over by the pontoon logs and propeller. Stay inside the rails at all times. This is a CRIMINAL offense in most states.", compliance_target: "all" },
    { key: "weather_awareness", label: "Weather Awareness", emoji: "⛈️", defaultInstructions: "Be alert for rapidly changing weather conditions. If you see dark clouds, lightning, or a significant increase in wind, notify the captain immediately. Lightning on open water is extremely dangerous — the boat is the tallest object. The captain will seek shelter or return to dock.", compliance_target: "all" },
    { key: "submarining", label: "Submarining Hazard", emoji: "⚠️", defaultInstructions: "Pontoons have low displacement bows. Shifting too much weight forward or plowing into a heavy wake can cause the bow to dive underwater (submarining), snapping the deck fence and swamping the boat. Keep weight distributed evenly. Slow down when crossing large wakes.", compliance_target: "bareboat_only" },
    { key: "ecos_pontoon", label: "Federal Engine Cut-Off Switch (ECOS) Law", emoji: "🔑", defaultInstructions: "By federal law (April 2021), operators of vessels under 26ft must wear the ECOS lanyard at all times while on plane or above displacement speed. If you are ejected, this instantly kills the engine. Do not disconnect or ignore the ECOS.", compliance_target: "bareboat_only", max_length_ft: 26 },
  ],
  catamaran: [
    { key: "boom_swing_hazard", label: "Boom Swing Hazard", emoji: "⚠️", defaultInstructions: "The boom is the most dangerous object on a sailboat. An accidental jibe can swing the boom across the cockpit with bone-crushing force. ALWAYS keep your head below the boom. Stay seated when the boat is tacking or changing direction. Listen for the captain's call of 'Ready about!' or 'Jibe-ho!' and duck.", compliance_target: "all" },
    { key: "rigging_line_tension", label: "Rigging & Line Tension", emoji: "🪢", defaultInstructions: "NEVER wrap lines around hands, fingers, or any body part. Lines under load can cause severe friction burns, degloving injuries, or amputation. Keep loose clothing, long hair, and jewelry clear of all blocks, winches, and cleats. If a line starts running, let it go — do not attempt to grab it.", compliance_target: "all" },
    { key: "trampoline_net", label: "Forward Trampoline Safety", emoji: "⛵", defaultInstructions: "The fore-deck trampoline netting is designed for sitting or lying only — NOT standing or jumping. Never jump on the trampolines while underway. Keep fingers and toes clear of the netting edges to avoid entrapment. No glass items on the trampoline. Children must be supervised at all times on the trampolines.", compliance_target: "all" },
    { key: "hull_transition_footing", label: "Moving Between Hulls", emoji: "🚢", defaultInstructions: "When moving about the vessel, especially while underway, ALWAYS use handrails and maintain a secure grip. Practice 'one hand for yourself, one for the boat.' Move slowly between the hulls and bridgedeck. Decks can be slippery when wet. Wear non-marking, non-slip footwear at all times.", compliance_target: "all" },
    { key: "marine_head_usage", label: "Marine Toilet (Head) Usage", emoji: "🚽", defaultInstructions: "Marine toilets are extremely sensitive and easily clogged. ONLY flush the provided marine toilet paper — absolutely nothing else. No wipes, tissues, feminine products, or food waste. Ask the crew for a demonstration of the pumping procedure before first use. A clogged head can end a charter.", compliance_target: "all" },
  ],
  power_catamaran: [
    { key: "propeller_strike_zone", label: "Propeller Strike Zone (MANDATORY)", emoji: "⚠️", defaultInstructions: "Stay clear of the propellers at ALL times, especially when swimming or re-boarding. Twin engines mean TWO sets of spinning propellers. The engines will be turned COMPLETELY OFF before anyone enters the water or uses the swim ladder. Never approach the stern while engines are running. A spinning prop creates suction and causes catastrophic amputations.", compliance_target: "all" },
    { key: "ecos_lanyard", label: "Engine Cut-Off Switch (ECOS)", emoji: "🔑", defaultInstructions: "The captain will wear the ECOS lanyard at all times while underway. If the captain is displaced from the helm, the lanyard will instantly kill both engines. Federal law (April 2021) requires ECOS use on vessels under 26ft. Do not disconnect or tamper with the ECOS system.", compliance_target: "all" },
    { key: "dual_engine_awareness", label: "Twin Engine Awareness", emoji: "🔧", defaultInstructions: "This vessel has twin engines — both propellers spin simultaneously. The tunnel between the hulls can create strong water currents when engines are engaged. Never swim between the hulls while engines are running or in neutral. Wait for the captain's explicit ALL CLEAR before entering the water.", compliance_target: "all" },
    { key: "high_speed_seating", label: "High-Speed Seating Rule", emoji: "💺", defaultInstructions: "ALL guests must remain seated in designated seating areas while the vessel is underway at cruising or high speed. Power catamarans can reach significant speeds — standing or moving about the vessel while at speed risks ejection, falls, and serious injury. Wait for the captain to reduce to idle speed before moving.", compliance_target: "all" },
    { key: "deck_wet_surface", label: "Deck & Wet Surface Safety", emoji: "🚢", defaultInstructions: "Use handrails when moving about the deck at all times. Be aware of wet and slippery surfaces, especially on the swim platform and forward deck. Wear non-marking, non-slip footwear. The wide beam of a catamaran means more deck area — but also more potential slip zones.", compliance_target: "all" },
  ],
  sailing_yacht: [
    { key: "boom_swing_hazard", label: "Boom & Rigging Hazard (CRITICAL)", emoji: "⚠️", defaultInstructions: "The boom is the most dangerous object on a sailboat. An accidental jibe can swing the boom across the cockpit with bone-crushing force. ALWAYS keep your head below the boom. When you hear 'Ready about!' or 'Jibe-ho!' — duck IMMEDIATELY. Stay seated in the cockpit when the boat is tacking or changing direction. The boom's path covers the entire width of the cockpit.", compliance_target: "all" },
    { key: "rigging_line_tension", label: "Rigging & Line Tension", emoji: "🪢", defaultInstructions: "NEVER wrap lines around hands, fingers, or any body part. Lines under load can cause severe friction burns, degloving injuries, or amputation. Keep loose clothing, long hair, and jewelry clear of all blocks, winches, and cleats. If a line starts running, LET IT GO — do not attempt to grab it.", compliance_target: "all" },
    { key: "heeling_movement", label: "Heeling (Leaning) Under Sail", emoji: "⛵", defaultInstructions: "A monohull sailboat WILL heel (lean) under sail — this is normal and safe. Always practice 'one hand for yourself, one for the boat.' Move to the high (windward) side when sailing upwind. Secure all loose items before sailing. Move carefully around the deck, especially when heeled. Never rush.", compliance_target: "all" },
    { key: "winch_pinch", label: "Winch & Block Pinch Points", emoji: "🔧", defaultInstructions: "Winches are powerful and DANGEROUS. Do not operate them without crew instruction. Keep fingers, long hair, and loose clothing far away from blocks, winches, and loaded lines. A loaded jib sheet under tension can easily sever fingers if caught in a turning winch drum.", compliance_target: "all" },
    { key: "propane_galley_safety", label: "Propane Galley Safety", emoji: "🔥", defaultInstructions: "The galley stove uses propane gas — a heavier-than-air gas that sinks into the bilge and can EXPLODE. Ask the crew for a briefing before using the stove. ALWAYS ensure the propane shut-off valve is turned OFF when not in use. Never leave the stove unattended while cooking underway.", compliance_target: "all" },
    { key: "marine_head_sailing", label: "Marine Head (Toilet) Operation", emoji: "🚽", defaultInstructions: "The marine head has a specific pumping procedure — ask the crew for a demonstration before first use. ONLY provided marine toilet paper may be flushed. Nothing else — no wipes, tissues, feminine products, or food waste. As sailors say: 'Nothing goes in the head that you haven't eaten first.' A clogged head disables the sanitation system.", compliance_target: "all" },
    { key: "night_deck_protocol", label: "Night Deck Protocol", emoji: "🌙", defaultInstructions: "NEVER go on deck alone at night without informing the crew AND wearing a life jacket. Use red-light headlamps to preserve night vision. Clip into the jackline with your safety harness if offshore. Moving about the deck at night is significantly more dangerous — every handhold and foot placement matters.", compliance_target: "all" },
  ],
  motor_yacht: [
    { key: "carbon_monoxide_exhaust", label: "Carbon Monoxide Warning", emoji: "💨", defaultInstructions: "Engine and generator exhaust produce deadly carbon monoxide (CO). Never sit, swim, or linger near the stern exhaust outlets while engines or generators are running. CO is odorless and can cause sudden loss of consciousness and drowning. Teak surfing is LETHAL and prohibited.", compliance_target: "all" },
    { key: "deck_hatches", label: "Deck Hatches & Footing", emoji: "🚢", defaultInstructions: "Watch your step around open hatches and companionways. Decks may be slippery when wet. Wear non-marking, non-skid footwear at all times. Use handrails when moving between decks.", compliance_target: "all" },
    { key: "swim_platform_reentry", label: "Swim Platform Re-Entry", emoji: "🏊", defaultInstructions: "Never attempt to re-board from the water without captain assistance. Use the swim ladder only. The swim platform can be slippery — hold the grab rail at all times. Engines MUST be off before anyone enters the water.", compliance_target: "all" },
    { key: "restricted_areas", label: "Restricted Areas (Engine Room)", emoji: "🚫", defaultInstructions: "For your safety, do not enter the engine room, machinery spaces, or the helm station unless accompanied by a crew member. These areas contain moving parts, high-voltage systems, and hot surfaces that can cause serious injury.", compliance_target: "all" },
    { key: "sun_hydration", label: "Sun Exposure & Hydration", emoji: "☀️", defaultInstructions: "UV radiation is significantly stronger on the water due to reflection. Apply reef-safe SPF 30+ sunscreen before boarding and reapply every 2 hours. Wear a hat and stay hydrated — heat exhaustion symptoms include dizziness, nausea, and rapid heartbeat. Inform the crew immediately if you feel unwell.", compliance_target: "all" },
    { key: "marine_toilet_head", label: "Marine Toilet (Head) Usage", emoji: "🚽", defaultInstructions: "The marine head has a specific pumping procedure — ask crew for a demonstration before use. ONLY provided marine toilet paper may be flushed. Absolutely nothing else — no wipes, no tissues, no feminine products. A clogged marine head can disable the entire sanitation system and end the charter.", compliance_target: "all" },
  ],
  fishing_charter: [
    { key: "hook_line_safety", label: "Hook & Line Safety", emoji: "🪝", defaultInstructions: "ALWAYS look behind you before casting to ensure physical clearance. When fish are brought aboard, step back and give the mate room. Never walk near exposed gaffs, treble hooks, or loose leaders on the deck. If a hook embeds in skin, do NOT attempt to remove it — notify the captain immediately.", compliance_target: "all" },
    { key: "fish_handling", label: "Fish Handling & Sharp Spines", emoji: "🐟", defaultInstructions: "Many game fish have razor-sharp spines, teeth, gill plates, or barbs that can cause severe lacerations. Let the mate handle all fish. If catch-and-release, wet your hands before touching fish to protect their slime coat. Wet decks around the fish box are extremely slippery.", compliance_target: "all" },
    { key: "gaff_storage", label: "Gaff & Sharp Tool Storage", emoji: "🔧", defaultInstructions: "Gaffs, fillet knives, and bait-cutting tools are secured in designated holders. Do not handle them without crew supervision. Never leave sharp tools loose on the deck.", compliance_target: "all" },
    { key: "wet_deck_footing", label: "Wet Deck & Footing Safety", emoji: "🚢", defaultInstructions: "Fishing boat decks become extremely slippery from spray, bait, fish slime, and blood. Wear closed-toe shoes with non-slip soles at all times. Use handrails and grab handles when moving about the vessel, especially when underway or in rough seas. Never stand on the gunwales.", compliance_target: "all" },
    { key: "seasickness_protocol", label: "Seasickness & Sun Protection", emoji: "☀️", defaultInstructions: "Take seasickness medication the NIGHT BEFORE your trip — not the morning of (it will be too late). Stay hydrated and eat a light breakfast. If you feel symptoms (dizziness, nausea, cold sweat), tell the captain immediately — early intervention is critical. Apply SPF 50+ sunscreen before boarding and reapply every 2 hours. Sun reflection on water doubles UV exposure.", compliance_target: "all" },
    { key: "fwc_catch_laws", label: "FWC Catch & Release Laws", emoji: "📋", defaultInstructions: "You are responsible for knowing Florida FWC slot limits and protected species. Undersized fish or out-of-season catches must be safely released immediately to avoid severe criminal fines. The captain has final authority on whether a fish is legal to keep.", compliance_target: "bareboat_only" },
    { key: "prop_strike_fishing", label: "Propeller Strike Zone", emoji: "⚠️", defaultInstructions: "Never approach a person in the water with the engine in gear. The engine MUST be in NEUTRAL or OFF before anyone enters the water. A spinning prop creates suction and causes catastrophic amputations. The propeller danger zone extends 10 feet behind the transom.", compliance_target: "bareboat_only" },
  ],
  snorkel_dive: [
    { key: "entry_exit_protocol", label: "Entry & Exit Protocol (CRITICAL)", emoji: "🚪", defaultInstructions: "Enter and exit the water ONLY from the designated dive platform/ladder. ALWAYS wait for the crew's explicit signal before entering. NEVER enter the water when the propellers are running or the engine is in gear. Use the giant stride or controlled seated entry method as instructed. Use the boarding ladder to exit — do not attempt to climb the hull.", compliance_target: "all" },
    { key: "marine_life_protection", label: "Marine Life & Reef Protection", emoji: "🐠", defaultInstructions: "Do NOT touch, chase, grab, stand on, or harass ANY marine life or coral. Coral is a living organism — a single touch can kill years of growth. Maintain neutral buoyancy at all times to avoid contact with the reef. Use ONLY reef-safe sunscreen (non-reef-safe sunscreen is BANNED in many areas including Hawaii, Key West, and Palau).", compliance_target: "all" },
    { key: "dive_flag_law", label: "Dive Flag Law (MANDATORY)", emoji: "🚩", defaultInstructions: "The dive flag (red/white diver-down) MUST be displayed whenever snorkelers or divers are in the water. By law, all divers must stay within the vicinity of the flag. All boaters must maintain at least 300 feet distance in open water and 100 feet in channels (Florida FWC). Failure to display the flag is a criminal violation.", compliance_target: "all" },
    { key: "buddy_system", label: "Buddy System (MANDATORY)", emoji: "🤝", defaultInstructions: "NEVER snorkel or dive alone. Always stay within arm's reach or visual contact of your buddy. Perform a Buddy Check (BWRAF: BCD, Weights, Releases, Air, Final check) before every water entry. If you lose your buddy underwater, search for ONE MINUTE then surface.", compliance_target: "all" },
    { key: "current_awareness", label: "Current & Drift Awareness", emoji: "🌊", defaultInstructions: "Ocean currents can silently carry you away from the boat. Always enter the water UPSTREAM of the vessel. Monitor your position relative to the boat and dive flag at all times. If you feel yourself drifting, signal the crew immediately. Do not fight a strong current — signal for help.", compliance_target: "all" },
    { key: "emergency_oxygen_dcs", label: "Emergency O2 & Decompression", emoji: "🫁", defaultInstructions: "Emergency oxygen is located at [LOCATION] and is for use in suspected decompression sickness (DCS) or respiratory emergencies. Symptoms of DCS include joint pain, dizziness, tingling, and fatigue AFTER a dive. Report ANY unusual symptoms to the crew IMMEDIATELY. Ascend slowly (max 30ft/min) and perform a 3-minute safety stop at 15ft on every dive over 30ft.", compliance_target: "all" },
    { key: "reef_safe_sunscreen_law", label: "Reef-Safe Sunscreen Only", emoji: "☀️", defaultInstructions: "ONLY reef-safe sunscreen is permitted on this charter. Conventional sunscreens containing oxybenzone and octinoxate are BANNED in Hawaii, Key West, Palau, and other marine protected areas. These chemicals cause coral bleaching and death. If you did not bring reef-safe sunscreen, ask the crew — we may have some available for purchase.", compliance_target: "all" },
  ],
  sunset_cruise: [
    { key: "muster_station_procedure", label: "Muster Station & Emergency Procedure", emoji: "🚨", defaultInstructions: "In the event of a general emergency, the captain will sound the vessel's horn. Move CALMLY to the main deck muster station at [LOCATION] and await crew instructions. Life jackets are located at [LOCATION]. Children under 13 must wear a life jacket at all times while underway. Know where the exits and fire extinguishers are before departure.", compliance_target: "all" },
    { key: "overboard_high_capacity", label: "Overboard Procedure (High-Capacity)", emoji: "🆘", defaultInstructions: "If someone falls overboard, shout 'MAN OVERBOARD!' immediately and POINT to the person in the water. Do NOT jump in after them — the crew is trained for water rescue. On a large vessel, keeping visual contact with the person is critical. Throw the ring buoy from [LOCATION] if nearby.", compliance_target: "all" },
    { key: "low_light_navigation", label: "Low-Light & Night Safety", emoji: "🌅", defaultInstructions: "As sunset transitions to darkness, visibility drops rapidly. Stay seated and use handrails when moving between decks. The captain will activate navigation lights — NEVER shine personal flashlights, phone screens, or camera flashes toward the helm as it destroys night vision and endangers the vessel.", compliance_target: "all" },
    { key: "tripping_hazards_deck", label: "Deck Hazards & Footing", emoji: "⚠️", defaultInstructions: "Be mindful of cleats, ropes, door sills, and deck transitions — these are tripping hazards. ALWAYS use handrails when moving between decks or on stairs. Wet decks are slippery. Wear flat, non-slip shoes — high heels are STRONGLY discouraged. Do not stand on seats or railings.", compliance_target: "all" },
    { key: "beverage_glass_safety", label: "Beverage & Glass Safety", emoji: "🥂", defaultInstructions: "No glass containers on deck — use provided plastic or metal drinkware only. Secure all drinks in cup holders while the vessel is moving. Spilled liquids create dangerous slip hazards on a moving deck. Please drink responsibly — the captain may refuse service or terminate passage for intoxication.", compliance_target: "all" },
    { key: "no_swimming_sunset", label: "No Swimming (Tour Vessel)", emoji: "🚫", defaultInstructions: "Swimming is NOT permitted from this vessel at any time. This is a sightseeing tour, not a swim charter. Reduced visibility during sunset and evening makes man-overboard rescue extremely dangerous. Stay inside the rails at all times.", compliance_target: "all" },
  ],
  houseboat: [
    { key: "carbon_monoxide_generator", label: "Carbon Monoxide (CO) — DEADLY", emoji: "💀", defaultInstructions: "The engine and generator produce carbon monoxide (CO) — a COLORLESS, ODORLESS gas that KILLS. CO detectors are installed but you MUST follow these rules: NEVER block exhaust outlets. NEVER swim near the stern while engines or generator are running. NEVER sleep with windows closed while the generator is on. Symptoms include headache, dizziness, nausea, and confusion. If the CO alarm sounds, EVACUATE to open air IMMEDIATELY and notify the captain.", compliance_target: "all" },
    { key: "bilge_blower_4min", label: "Bilge Blower — 4-Minute Rule (MANDATORY)", emoji: "💨", defaultInstructions: "Before starting the engine on ANY gasoline-powered houseboat, you MUST run the bilge blower for at least 4 MINUTES. This clears explosive fuel vapors from the engine compartment. Failure to do this can cause a catastrophic explosion. This is not optional — it is a critical safety procedure required before EVERY engine start.", compliance_target: "bareboat_only" },
    { key: "marine_toilet_rules", label: "Marine Toilet (Head) Rules", emoji: "🚽", defaultInstructions: "The marine sanitation system is EXTREMELY sensitive. ONLY flush human waste and the provided marine-grade toilet paper. NEVER flush: wet wipes, feminine products, paper towels, food, or ANY foreign objects. A single mistake causes immediate clogs requiring professional service and repair fees ($500+). If in doubt, use the trash can.", compliance_target: "all" },
    { key: "slide_water_toy_safety", label: "Slide & Water Toy Safety", emoji: "🛝", defaultInstructions: "Use the slide ONLY when the boat is anchored in deep water (minimum 8 feet). ALWAYS check that the area below the slide is clear of swimmers before sliding. NO head-first sliding. NO jumping or diving from the upper deck or roof. Children must be supervised at ALL times when using water toys. The captain determines when conditions are safe for slide use.", compliance_target: "all" },
    { key: "swimming_alone_night", label: "No Swimming Alone or at Night", emoji: "🌙", defaultInstructions: "NEVER swim alone — always have a buddy and someone watching from the boat. Swimming at night is STRICTLY PROHIBITED — reduced visibility makes rescue nearly impossible. Always wear a life jacket if you are not a strong swimmer. Stay clear of the stern and propeller area. Re-board using the swim ladder only.", compliance_target: "all" },
    { key: "generator_exhaust_stern", label: "Generator Exhaust Zone", emoji: "⚠️", defaultInstructions: "The generator exhaust exits near the stern/waterline. When the generator is running, the stern area is a CO DANGER ZONE. Do NOT sit on the swim platform, stand near the exhaust, or allow children to play near the back of the boat while the generator is running. CO accumulates in the 'station wagon effect' — the area directly behind the boat.", compliance_target: "all" },
    { key: "fire_safety_galley", label: "Fire Safety — Galley & Cabin", emoji: "🔥", defaultInstructions: "The galley has a stove, oven, or microwave — never leave cooking unattended. Know the location of all fire extinguishers BEFORE your first night aboard. No smoking inside the cabin — EVER. Do not overload electrical outlets. If you smell gas (propane), turn off the stove, open all windows, evacuate, and notify the captain immediately.", compliance_target: "all" },
  ],
  other: [
    { key: "general_water_safety", label: "General Water Safety", emoji: "🌊", defaultInstructions: "Always be aware of your surroundings when near the water. Hold handrails when moving, watch your footing on wet decks, and never lean over railings.", compliance_target: "all" },
    { key: "engine_propulsion_hazard", label: "Engine & Propulsion Hazard", emoji: "⚠️", defaultInstructions: "Stay clear of all engine and propulsion components. Never enter the water while engines are running or in gear. Wait for explicit all-clear from the captain.", compliance_target: "all" },
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
