Good call. Scraping is a shortcut that can break. This wizard is the heart of BoatCheckin — every operator does this once and it runs forever. Let me think through every boat type deeply before writing a single instruction.

---

**What each boat type actually needs — deep research:**

MOTOR YACHT / LUXURY YACHT  
  Equipment: AC, generator, galley, salon,  
  swim platform, water toys, sound system,  
  LED lighting, flybridge, tender/dinghy  
  Rules: No heels on teak, no outside food,  
  dress code, no smoking anywhere, gratuity norms  
  Guests bring: Smart casual attire, sunscreen,  
  motion sickness meds, non-marking shoes  
  USCG: 6-pack (up to 6 paying) or  
  100-ton license (unlimited passengers)  
  Add-ons: Catering, photographer, masseur,  
  floral arrangements, champagne service

FISHING CHARTER (6-pack or party boat)  
  Equipment: Rods, reels, tackle, bait  
  (live/artificial), fish finder, rod holders,  
  live bait well, cooler, fish cleaning station  
  Rules: Florida fishing license (who provides),  
  catch limits by species, catch-and-release policy,  
  seasickness protocol, sun protection required  
  Guests bring: Sunscreen, polarised sunglasses,  
  closed-toe shoes, motion sickness meds,  
  licence if bareboat  
  USCG: 6-pack most common in Florida  
  Specific fields: Target species,   
  offshore vs inshore vs flats,  
  fish cleaning included yes/no,  
  keep catch policy, IGFA rules followed  
  Add-ons: Extra tackle, bait upgrade,  
  fish filleting service, ice chest rental

SAILING YACHT / SAILBOAT  
  Equipment: Winches, lines, sails, chart plotter,  
  VHF radio, life raft, flares, EPIRB  
  Rules: No sudden movements during tack/jibe,  
  always clip safety harness offshore,  
  watch your head during boom swing,  
  no interference with helm  
  Guests bring: Layered clothing (it gets cold),  
  closed-toe grip shoes, seasickness meds,  
  motion sickness patches (apply day before)  
  Specific fields: Sailing experience required  
  yes/no, offshore vs coastal,  
  bareboat certification required (ASA/RYA level)  
  Add-ons: Sailing lessons, navigation course,  
  flotilla membership

CATAMARAN (power or sail)  
  Equipment: Trampolines, dual helm,  
  large cockpit, salon, multiple cabins,  
  generator, watermaker (offshore)  
  Rules: Weight distribution important,  
  no jumping on trampolines underway,  
  both stern steps to board only  
  Specific fields: Power cat vs sail cat,  
  bridge deck clearance, galley equipped  
  Add-ons: Snorkel gear, paddleboards,  
  kayaks, water slide

PONTOON / PARTY BOAT  
  Equipment: Bimini top, cooler, bluetooth  
  sound system, swim ladder, lighting  
  Rules: High capacity, weight limit critical,  
  no standing while underway, alcohol policy,  
  bathroom facilities (or lack thereof)  
  Specific fields: Party configuration,  
  capacity (usually 12-15),   
  swim platform, grill included  
  Add-ons: Catering, DJ equipment,  
  floating island/lily pad, tube/wakeboard tow

SPEEDBOAT / BOWRIDER  
  Equipment: Wakeboard tower, ballast bags,  
  sound system, swim platform  
  Rules: No standing at speed, life jackets  
  for under 6 at all times, no alcohol  
  while operating  
  Specific fields: Wake sports available yes/no,  
  surfing vs wakeboarding vs tubing  
  Add-ons: Wake gear rental, lessons,  
  GoPro rental

SNORKEL / DIVE CHARTER  
  Equipment: Masks, fins, snorkels, BCDs,  
  tanks, regulators, wetsuit rental,  
  underwater torch, first aid kit, O2 kit  
  Rules: PADI/SSI cert required for scuba,  
  no touching coral, buddy system mandatory,  
  dive flag always deployed  
  Specific fields: Max depth, dive sites,  
  certification required (which level),  
  gear included or rental,   
  divemaster ratio (1:4 or 1:6)  
  Add-ons: Underwater camera rental,  
  certification course, gear rental

SUNSET CRUISE / TOUR BOAT  
  Equipment: Deck seating, bar setup,  
  sound system, lighting, commentary mic  
  Rules: Assigned seating, no moving  
  between decks while underway,  
  alcohol cutoff policy  
  Specific fields: Route (fixed or flexible),  
  commentary (yes/no), open bar vs cash bar,  
  live music yes/no  
  Add-ons: Champagne toast, live entertainment,  
  private charter upgrade

---

Now I have everything needed. Here is the complete Phase 2 replacement:

---

@docs/agents/00-MASTER.md  
@docs/agents/04-SECURITY.md  
@docs/agents/05-FRONTEND.md  
@docs/agents/06-DESIGN.md  
@docs/agents/07-BACKEND.md  
@docs/agents/16-UX\_SCREENS.md  
@docs/agents/17-AUDIT.md

TASK: Build the complete BoatCheckin Boat Profile  
Wizard. This replaces the previous Phase 2 spec.  
NO scraping. NO URL import.   
Pure manual entry with intelligent pre-loading  
based on boat type selection.

This is the most important operator screen  
in the entire product. An operator does this  
once and it powers every trip forever.  
Make it feel thorough but effortless.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
ARCHITECTURE OVERVIEW  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

8-step wizard. Boat type is selected in  
Step 1 and drives the content of ALL  
subsequent steps via a template system.

Steps:  
  1  Boat type \+ basics  
  2  Marina & dock location  
  3  Captain profile \+ photo  
  4  Equipment & amenities  
  5  Rules, DOs & DON'Ts  
  6  What to bring / What NOT to bring  
  7  Waiver & safety briefing  
  8  Photos \+ add-on menu

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
PART A — BOAT TYPE TEMPLATE SYSTEM  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create: apps/web/lib/wizard/  
  boat-templates.ts  
import 'server-only'

This is the intelligence layer of the wizard.  
When operator selects a boat type, this file  
provides all pre-loaded content for every step.

export type BoatTypeKey \=  
  | 'motor\_yacht'  
  | 'sailing\_yacht'  
  | 'catamaran'  
  | 'fishing\_charter'  
  | 'pontoon'  
  | 'speedboat'  
  | 'snorkel\_dive'  
  | 'sunset\_cruise'  
  | 'other'

interface BoatTemplate {  
  label: string  
  emoji: string  
  description: string

  // Step 4 — Equipment pre-loads  
  standardEquipment: string\[\]  
  optionalEquipment: string\[\]  
    
  // Step 4 — Amenities specific to type  
  amenityGroups: {  
    title: string  
    items: { key: string; label: string; default: boolean }\[\]  
  }\[\]  
    
  // Step 4 — Type-specific fields  
  specificFields: SpecificField\[\]  
    
  // Step 5 — Rules pre-loads  
  standardRules: string\[\]  
  standardDos: string\[\]  
  standardDonts: string\[\]  
    
  // Step 6 — What to bring/not bring  
  whatToBring: string\[\]  
  whatNotToBring: string\[\]  
    
  // Step 7 — Safety briefing points  
  safetyPoints: string\[\]  
    
  // Step 7 — Waiver template  
  waiverTemplate: string  
    
  // Step 8 — Suggested add-ons  
  suggestedAddons: {  
    name: string  
    description: string  
    emoji: string  
    suggestedPrice: number  
  }\[\]  
}

export const BOAT\_TEMPLATES: Record  
  BoatTypeKey,  
  BoatTemplate  
\> \= {

  motor\_yacht: {  
    label: 'Motor Yacht',  
    emoji: '🛥️',  
    description: 'Luxury motor vessel,   
      captained experience',

    standardEquipment: \[  
      'Life jackets for all passengers',  
      'VHF radio (Channel 16)',  
      'First aid kit',  
      'Fire extinguisher',  
      'Flares and signalling devices',  
      'GPS / chart plotter',  
      'Bluetooth sound system',  
    \],  
    optionalEquipment: \[  
      'Air conditioning (main cabin)',  
      'Generator onboard',  
      'Swim platform',  
      'Snorkel gear',  
      'Kayak / paddleboard',  
      'Water toys',  
      'Tender / dinghy',  
      'Underwater LED lighting',  
      'Satellite internet',  
    \],

    amenityGroups: \[  
      {  
        title: 'Comfort',  
        items: \[  
          { key: 'ac', label: 'Air conditioning', default: true },  
          { key: 'heads', label: 'Onboard bathroom', default: true },  
          { key: 'galley', label: 'Galley kitchen', default: false },  
          { key: 'salon', label: 'Indoor salon', default: false },  
          { key: 'flybridge', label: 'Flybridge / upper deck', default: false },  
        \]  
      },  
      {  
        title: 'Entertainment',  
        items: \[  
          { key: 'bluetooth', label: 'Bluetooth speaker', default: true },  
          { key: 'tv', label: 'TV onboard', default: false },  
          { key: 'led\_lighting', label: 'LED mood lighting', default: false },  
          { key: 'bar', label: 'Bar setup / ice', default: true },  
        \]  
      },  
      {  
        title: 'Water activities',  
        items: \[  
          { key: 'swim\_platform', label: 'Swim platform', default: true },  
          { key: 'swim\_ladder', label: 'Swim ladder', default: true },  
          { key: 'snorkel', label: 'Snorkel gear included', default: false },  
          { key: 'floating\_mat', label: 'Floating mat', default: false },  
        \]  
      }  
    \],

    specificFields: \[  
      {  
        key: 'yacht\_length',  
        label: 'Vessel length (ft)',  
        type: 'number',  
        required: false,  
        placeholder: '42',  
        helpText: 'Approximate length in feet'  
      },  
      {  
        key: 'uscg\_documentation',  
        label: 'USCG documentation number',  
        type: 'text',  
        required: false,  
        placeholder: 'e.g. US-1234567',  
        helpText: 'Found on your USCG certificate of documentation'  
      },  
      {  
        key: 'captain\_license\_type',  
        label: 'Captain license type',  
        type: 'select',  
        required: false,  
        options: \[  
          { value: 'oupv', label: 'OUPV / 6-Pack (up to 6 passengers)' },  
          { value: 'master\_25', label: 'Master 25 Ton' },  
          { value: 'master\_50', label: 'Master 50 Ton' },  
          { value: 'master\_100', label: 'Master 100 Ton' },  
          { value: 'master\_200', label: 'Master 200 Ton+' },  
        \]  
      },  
      {  
        key: 'fuel\_policy',  
        label: 'Fuel pricing',  
        type: 'select',  
        required: false,  
        options: \[  
          { value: 'included', label: 'Fuel included in charter price' },  
          { value: 'per\_quarter', label: 'Charged per quarter tank used' },  
          { value: 'per\_hour', label: 'Fuel surcharge per hour' },  
          { value: 'deposit', label: 'Security deposit, refunded unused' },  
        \]  
      },  
      {  
        key: 'gratuity\_expectation',  
        label: 'Gratuity guidance for guests',  
        type: 'select',  
        required: false,  
        options: \[  
          { value: 'none', label: 'No gratuity expected' },  
          { value: '10\_percent', label: '10% is appreciated' },  
          { value: '15\_percent', label: '15% is standard' },  
          { value: '20\_percent', label: '20% is customary' },  
          { value: 'at\_discretion', label: 'At guest discretion' },  
        \]  
      },  
    \],

    standardRules: \[  
      'Maximum passenger count must be observed at all times',  
      'Captain\\'s instructions must be followed immediately',  
      'Coast Guard regulations apply at all times',  
      'No swimming without captain\\'s approval',  
    \],  
    standardDos: \[  
      'Wear non-marking soft-soled shoes on deck',  
      'Apply sunscreen before boarding',  
      'Stay seated when vessel is underway',  
      'Inform captain of any medical conditions',  
      'Ask captain before jumping in the water',  
      'Bring a light jacket for return trips in the evening',  
    \],  
    standardDonts: \[  
      'No stilettos, heels, or hard-soled shoes on deck',  
      'No red wine or dark liquids on deck or in the cabin',  
      'No smoking anywhere on the vessel',  
      'No throwing anything overboard',  
      'Do not touch navigational equipment',  
      'No standing on furniture',  
    \],

    whatToBring: \[  
      'Valid government-issued photo ID',  
      'Sunscreen (SPF 30 or higher)',  
      'Sunglasses and hat',  
      'Towel',  
      'Light jacket or wrap for evenings',  
      'Non-marking soft-soled shoes',  
      'Motion sickness medication if prone',  
      'Cash for gratuity',  
      'Reusable water bottle',  
    \],  
    whatNotToBring: \[  
      'High heels or hard-soled shoes',  
      'Glass bottles (cans or plastic only)',  
      'Large hard-sided coolers',  
      'Sharp objects',  
      'Illegal substances',  
      'Pets (unless previously agreed)',  
    \],

    safetyPoints: \[  
      'Life jackets are located \[location\].   
        Each passenger must know where theirs is.',  
      'This vessel communicates on VHF Channel 16\.   
        In any emergency, hail the US Coast Guard.',  
      'The fire extinguisher is located \[location\].',  
      'Muster station in an emergency is   
        the stern swim platform.',  
      'Do not attempt to re-board from the water   
        without captain assistance.',  
      'No swimming without explicit captain   
        approval and a lookout designated.',  
    \],

    waiverTemplate: \`CHARTER AGREEMENT AND LIABILITY WAIVER

I, the undersigned, hereby acknowledge and agree to the following terms and conditions for participating in a private boat charter operated by \[OPERATOR NAME\] ("the Operator").

1\. VOLUNTARY PARTICIPATION  
I acknowledge that I am voluntarily participating in a recreational boating activity. I understand that boating activities involve inherent risks, including but not limited to: capsizing, falling overboard, collision, equipment failure, adverse weather, and personal injury.

2\. ASSUMPTION OF RISK  
I voluntarily assume all risks associated with this charter activity, whether foreseeable or unforeseeable, known or unknown.

3\. RELEASE OF LIABILITY  
I hereby release, waive, and discharge the Operator, its owners, captains, crew members, and agents from any and all claims, demands, or causes of action arising from my participation in this charter.

4\. CAPTAIN'S AUTHORITY  
I agree to follow all instructions given by the captain at all times. The captain has absolute authority over vessel operations and passenger safety. Failure to comply with captain's instructions may result in immediate return to dock.

5\. US COAST GUARD REGULATIONS  
I acknowledge that this vessel operates under United States Coast Guard regulations. All safety requirements, including life jacket availability and usage, apply throughout the charter.

6\. ALCOHOL POLICY  
Consumption of alcohol is permitted at the operator's discretion. No guest may operate the vessel while impaired.

7\. PROPERTY AND PERSONAL BELONGINGS  
The Operator is not responsible for any lost, stolen, or damaged personal belongings.

8\. MEDICAL CONDITIONS  
I confirm that I am medically fit to participate in boating activities. I have disclosed any relevant medical conditions to the captain.

9\. GOVERNING LAW  
This agreement shall be governed by the laws of the State of Florida.

By signing below, I confirm that I have read, understood, and agree to all terms above.\`,

    suggestedAddons: \[  
      { name: 'Champagne & Fruit Platter', description: 'Premium bottle \+ seasonal fruit', emoji: '🥂', suggestedPrice: 8500 },  
      { name: 'Professional Photographer', description: 'Onboard photography for your group', emoji: '📸', suggestedPrice: 15000 },  
      { name: 'Catered Lunch Package', description: 'Fresh sandwiches, salads, snacks', emoji: '🍱', suggestedPrice: 3500 },  
      { name: 'Snorkel Equipment Set', description: 'Mask, fins, snorkel per person', emoji: '🤿', suggestedPrice: 2500 },  
      { name: 'Floating Island / Lily Pad', description: 'Large inflatable platform for the water', emoji: '🌊', suggestedPrice: 4000 },  
    \],  
  },

  fishing\_charter: {  
    label: 'Fishing Charter',  
    emoji: '🎣',  
    description: 'Sportfishing, inshore, offshore,   
      or flats fishing experiences',

    standardEquipment: \[  
      'Fishing rods and reels (matching capacity)',  
      'Tackle and terminal tackle',  
      'Live bait well',  
      'Fish finder / depth sounder',  
      'Rod holders',  
      'Cooler with ice',  
      'Life jackets for all passengers',  
      'VHF radio',  
      'First aid kit',  
      'Sunscreen station',  
    \],  
    optionalEquipment: \[  
      'Outriggers',  
      'Downriggers',  
      'Trolling motor',  
      'GPS / chart plotter with waypoints',  
      'Underwater lights (night fishing)',  
      'GoPro / camera mount',  
    \],

    amenityGroups: \[  
      {  
        title: 'Fishing setup',  
        items: \[  
          { key: 'live\_bait', label: 'Live bait provided', default: true },  
          { key: 'artificial\_lures', label: 'Artificial lures provided', default: true },  
          { key: 'light\_tackle', label: 'Light tackle available', default: true },  
          { key: 'heavy\_tackle', label: 'Heavy / offshore tackle', default: false },  
          { key: 'fish\_cleaning', label: 'Fish cleaning included', default: false },  
          { key: 'fillet\_service', label: 'Fillet & pack service', default: false },  
        \]  
      },  
      {  
        title: 'Comfort',  
        items: \[  
          { key: 'cooler', label: 'Cooler with ice provided', default: true },  
          { key: 'shade', label: 'Shade / Bimini top', default: true },  
          { key: 'heads', label: 'Onboard bathroom', default: false },  
          { key: 'cabin', label: 'Cabin / indoor area', default: false },  
        \]  
      }  
    \],

    specificFields: \[  
      {  
        key: 'fishing\_type',  
        label: 'Primary fishing type',  
        type: 'multiselect',  
        required: true,  
        options: \[  
          { value: 'inshore', label: 'Inshore (redfish, snook, trout)' },  
          { value: 'nearshore', label: 'Nearshore (grouper, snapper)' },  
          { value: 'offshore', label: 'Offshore (mahi, tuna, wahoo)' },  
          { value: 'deep\_sea', label: 'Deep sea (marlin, sailfish)' },  
          { value: 'flats', label: 'Flats fishing (tarpon, bonefish)' },  
          { value: 'reef', label: 'Reef fishing' },  
          { value: 'freshwater', label: 'Freshwater (bass, catfish)' },  
        \],  
        helpText: 'Select all that apply'  
      },  
      {  
        key: 'target\_species',  
        label: 'Primary target species',  
        type: 'text',  
        required: false,  
        placeholder: 'e.g. Mahi-Mahi, Snapper, Grouper, Tarpon',  
        helpText: 'What fish do guests most commonly catch?'  
      },  
      {  
        key: 'license\_policy',  
        label: 'Florida fishing license',  
        type: 'select',  
        required: true,  
        options: \[  
          { value: 'vessel\_license', label: 'Vessel has charter license — guests covered' },  
          { value: 'guests\_bring', label: 'Guests must bring their own license' },  
          { value: 'captain\_assists', label: 'Captain can help guests purchase online' },  
        \],  
        helpText: 'Florida law requires a valid fishing license'  
      },  
      {  
        key: 'catch\_policy',  
        label: 'What happens to the catch?',  
        type: 'select',  
        required: true,  
        options: \[  
          { value: 'keep\_all', label: 'Guests keep their catch' },  
          { value: 'catch\_release', label: 'Catch and release only' },  
          { value: 'keep\_selective', label: 'Keep within legal limits, release rest' },  
          { value: 'guest\_choice', label: 'Guest\\'s choice within regulations' },  
        \]  
      },  
      {  
        key: 'max\_fishing\_range',  
        label: 'Maximum distance from shore',  
        type: 'select',  
        required: false,  
        options: \[  
          { value: 'bay\_only', label: 'Bay / inshore only' },  
          { value: '10\_miles', label: 'Up to 10 miles offshore' },  
          { value: '20\_miles', label: 'Up to 20 miles offshore' },  
          { value: '50\_miles', label: 'Up to 50 miles offshore' },  
          { value: 'unlimited', label: 'No restriction (weather permitting)' },  
        \]  
      },  
    \],

    standardRules: \[  
      'Florida fishing license regulations apply at all times',  
      'All size and bag limits as per FWC regulations',  
      'Captain determines fishing locations',  
      'No fishing from the bow while underway',  
    \],  
    standardDos: \[  
      'Tell the captain what species you are targeting',  
      'Wear non-marking, closed-toe shoes with grip',  
      'Apply sunscreen 30 minutes before departure',  
      'Bring polarised sunglasses',  
      'Stay hydrated — fishing trips are long',  
      'Listen to the captain\\'s casting instructions',  
    \],  
    standardDonts: \[  
      'Do not cast without captain\\'s instruction',  
      'No crossing lines with other anglers',  
      'Do not touch fish with dry hands (catch and release)',  
      'No alcohol before or during fishing (impairs reflexes)',  
      'Do not stand on gunwales or bow while underway',  
      'No removing hooks — let the mate handle it',  
    \],

    whatToBring: \[  
      'Valid Florida fishing license (if not covered by vessel)',  
      'Polarised sunglasses (essential)',  
      'Sunscreen SPF 50+ and lip balm',  
      'Hat or cap with brim',  
      'Closed-toe shoes with non-slip soles',  
      'Light rain jacket or windbreaker',  
      'Motion sickness medication (taken the night before)',  
      'Snacks and water (long trips)',  
      'Camera or GoPro',  
    \],  
    whatNotToBring: \[  
      'Flip flops or open-toe shoes',  
      'Strong cologne or perfume (attracts bugs)',  
      'Excessive personal gear',  
      'Glass bottles',  
    \],

    safetyPoints: \[  
      'Life jackets are located \[location\]. Children under 6 must wear at all times.',  
      'Hooks are extremely sharp — never run on deck.',  
      'If a hook embeds in skin: do not remove it. Inform captain immediately.',  
      'VHF Channel 16 monitored at all times.',  
      'Emergency position: sit low and hold on when underway at speed.',  
      'Motion sickness: inform captain immediately — do not wait.',  
    \],

    waiverTemplate: \`SPORTFISHING CHARTER AGREEMENT AND LIABILITY WAIVER

I acknowledge that sportfishing activities involve inherent risks including but not limited to: hook injuries, slipping on wet decks, sun exposure, seasickness, fish-related injuries, and adverse ocean conditions.

\[Standard liability release clauses — same structure as motor yacht template above, with fishing-specific additions\]

FISHING REGULATIONS: I agree to comply with all applicable federal, state, and local fishing regulations including bag limits, size limits, and licensing requirements.

INJURY FROM EQUIPMENT: I acknowledge that fishing equipment including rods, hooks, gaffs, and knives are potentially dangerous and I will follow all captain and mate instructions regarding their use.\`,

    suggestedAddons: \[  
      { name: 'Premium Live Bait Upgrade', description: 'Live pilchards, goggle-eyes, or threadfins', emoji: '🐟', suggestedPrice: 3500 },  
      { name: 'Fish Cleaning & Filleting', description: 'Professional cleaning and packing to go', emoji: '🔪', suggestedPrice: 2500 },  
      { name: 'GoPro Rental', description: 'Waterproof camera for your catch moments', emoji: '🎥', suggestedPrice: 2000 },  
      { name: 'Fishing License (FWC)', description: '3-day Florida non-resident license', emoji: '📋', suggestedPrice: 3200 },  
      { name: 'Cooler with Ice & Drinks', description: 'Pre-stocked cooler with water, sodas, ice', emoji: '🧊', suggestedPrice: 2500 },  
    \],  
  },

  catamaran: {  
    label: 'Catamaran',  
    emoji: '⛵',  
    description: 'Sail or power catamaran,   
      stable platform for groups',

    standardEquipment: \[  
      'Life jackets for all passengers',  
      'VHF radio and EPIRB',  
      'First aid kit',  
      'Fire extinguishers',  
      'Life raft (offshore)',  
      'GPS / chart plotter',  
      'Trampolines fore-deck',  
    \],  
    optionalEquipment: \[  
      'Snorkel gear set',  
      'Paddleboards',  
      'Kayaks',  
      'Underwater camera',  
      'Hammock',  
      'Waterslide',  
    \],

    amenityGroups: \[  
      {  
        title: 'Onboard facilities',  
        items: \[  
          { key: 'salon', label: 'Indoor salon', default: true },  
          { key: 'galley', label: 'Full galley kitchen', default: true },  
          { key: 'heads', label: 'Bathroom (heads)', default: true },  
          { key: 'cabins', label: 'Overnight cabins', default: false },  
          { key: 'generator', label: 'Generator', default: false },  
          { key: 'watermaker', label: 'Watermaker', default: false },  
        \]  
      },  
      {  
        title: 'Entertainment',  
        items: \[  
          { key: 'bluetooth', label: 'Bluetooth sound system', default: true },  
          { key: 'trampoline', label: 'Fore-deck trampolines', default: true },  
          { key: 'bar', label: 'Bar setup', default: true },  
        \]  
      }  
    \],

    specificFields: \[  
      {  
        key: 'cat\_type',  
        label: 'Catamaran type',  
        type: 'select',  
        required: true,  
        options: \[  
          { value: 'sailing\_cat', label: 'Sailing catamaran' },  
          { value: 'power\_cat', label: 'Power catamaran' },  
          { value: 'hybrid', label: 'Hybrid (sail \+ motor)' },  
        \]  
      },  
      {  
        key: 'beam\_width',  
        label: 'Beam width (ft)',  
        type: 'number',  
        required: false,  
        placeholder: '22',  
      },  
      {  
        key: 'overnight\_capable',  
        label: 'Available for overnight charters',  
        type: 'boolean',  
        required: false,  
        helpText: 'Do you offer multi-day liveaboard charters?'  
      }  
    \],

    standardRules: \[  
      'Weight must be distributed evenly port and starboard',  
      'No jumping off trampolines while underway',  
      'Both stern boarding steps only — no climbing hulls',  
      'Life jackets mandatory when sailing in open water',  
    \],  
    standardDos: \[  
      'Move slowly and deliberately between hulls',  
      'Hold handrails when moving forward on trampolines',  
      'Sit on or below the trampoline netting, not on the bow rails',  
      'Inform captain of non-swimmers in the group',  
    \],  
    standardDonts: \[  
      'No jumping off trampolines while vessel is moving',  
      'Do not stand on gunwales',  
      'No leaning overboard',  
      'No glass on the trampoline netting',  
    \],

    whatToBring: \[  
      'Swimwear and towel',  
      'Non-marking deck shoes',  
      'Sunscreen and hat',  
      'Light layers for sailing (wind chill)',  
      'Motion sickness tablets',  
      'Waterproof bag for valuables',  
    \],  
    whatNotToBring: \[  
      'Hard-soled shoes',  
      'Glass bottles',  
      'Heavy luggage (limited storage)',  
    \],

    safetyPoints: \[  
      'Life jackets under the salon seating.',  
      'VHF Channel 16 monitored at all times.',  
      'Boom can swing unexpectedly during tack — duck on command.',  
      'Both hulls have bilge pumps and emergency exits.',  
      'MOB (Man Overboard) procedure: shout MOB, point continuously, do not jump in.',  
    \],

    waiverTemplate: \`SAILING CHARTER AGREEMENT AND LIABILITY WAIVER

I acknowledge that sailing and catamaran activities involve inherent risks including but not limited to: boom injuries, trampoline falls, seasickness, unexpected weather changes, and open water swimming hazards. \[Standard clauses follow\]\`,

    suggestedAddons: \[  
      { name: 'Snorkel Package', description: 'Full equipment per person', emoji: '🤿', suggestedPrice: 2500 },  
      { name: 'Paddleboard Rental', description: 'SUP board per person', emoji: '🏄', suggestedPrice: 3000 },  
      { name: 'Catered Lunch', description: 'Fresh food prepared onboard', emoji: '🥗', suggestedPrice: 4500 },  
      { name: 'Kayak Rental', description: 'Single kayak per session', emoji: '🚣', suggestedPrice: 2000 },  
    \],  
  },

  pontoon: {  
    label: 'Pontoon / Party Boat',  
    emoji: '🎉',  
    description: 'High-capacity party or   
      leisure pontoon boat',

    standardEquipment: \[  
      'Life jackets for all passengers',  
      'Bimini top for shade',  
      'Swim ladder',  
      'Bluetooth sound system',  
      'Cooler and ice',  
      'VHF radio',  
    \],  
    optionalEquipment: \[  
      'Water slide',  
      'Floating island / lily pad',  
      'Tube for towing',  
      'Wakeboard / water skis',  
      'Grill onboard',  
      'Underwater LED lighting',  
      'Livewell',  
    \],

    amenityGroups: \[  
      {  
        title: 'Party features',  
        items: \[  
          { key: 'sound\_system', label: 'Bluetooth sound system', default: true },  
          { key: 'cooler', label: 'Cooler with ice provided', default: true },  
          { key: 'shade', label: 'Bimini / shade top', default: true },  
          { key: 'grill', label: 'Onboard grill', default: false },  
          { key: 'led\_lights', label: 'Underwater LED lights', default: false },  
          { key: 'slide', label: 'Water slide', default: false },  
        \]  
      },  
      {  
        title: 'Towable sports',  
        items: \[  
          { key: 'tube', label: 'Tube towing', default: false },  
          { key: 'wakeboard', label: 'Wakeboarding', default: false },  
          { key: 'water\_ski', label: 'Water skiing', default: false },  
        \]  
      }  
    \],

    specificFields: \[  
      {  
        key: 'weight\_limit',  
        label: 'Maximum weight limit (lbs)',  
        type: 'number',  
        required: true,  
        placeholder: '2000',  
        helpText: 'Total weight capacity including passengers and gear'  
      },  
      {  
        key: 'bathroom\_policy',  
        label: 'Bathroom facilities',  
        type: 'select',  
        required: true,  
        options: \[  
          { value: 'no\_bathroom', label: 'No bathroom — plan stops accordingly' },  
          { value: 'portable\_toilet', label: 'Portable toilet onboard' },  
          { value: 'full\_heads', label: 'Full marine toilet (heads)' },  
        \]  
      },  
      {  
        key: 'alcohol\_policy',  
        label: 'Alcohol policy',  
        type: 'select',  
        required: true,  
        options: \[  
          { value: 'byob', label: 'BYOB — guests bring their own' },  
          { value: 'provided', label: 'Alcohol provided (in charter price)' },  
          { value: 'no\_alcohol', label: 'No alcohol permitted' },  
          { value: 'add\_on', label: 'Alcohol available as add-on' },  
        \]  
      },  
      {  
        key: 'swim\_area',  
        label: 'Designated swim areas',  
        type: 'text',  
        required: false,  
        placeholder: 'e.g. Nixon Sandbar, Haulover Sandbar',  
        helpText: 'Where do you typically stop for swimming?'  
      }  
    \],

    standardRules: \[  
      'Passenger capacity must not be exceeded at any time',  
      'Weight limit must be respected',  
      'Life jackets available for all — required for children under 6',  
      'No standing on the boat while underway',  
      'Captain\\'s instructions are final',  
    \],  
    standardDos: \[  
      'Stay seated when the boat is moving',  
      'Use swim ladder — do not jump from railings',  
      'Apply sunscreen before getting on the water',  
      'Drink plenty of water',  
      'Designate a responsible person per group',  
    \],  
    standardDonts: \[  
      'No standing on seats or railings',  
      'No glass containers',  
      'No swimming near the engine',  
      'No excessive alcohol consumption',  
      'Do not overload one side of the boat',  
      'No smoking near the fuel tank',  
    \],

    whatToBring: \[  
      'Swimwear and towel',  
      'Sunscreen SPF 50+',  
      'Hat and sunglasses',  
      'Cooler with drinks if BYOB',  
      'Snacks (bring your own)',  
      'Water shoes or flip flops',  
      'Change of dry clothes',  
      'Waterproof phone case',  
    \],  
    whatNotToBring: \[  
      'Glass bottles or containers',  
      'Large hard-sided coolers',  
      'Sharp objects',  
      'Too much personal gear',  
    \],

    safetyPoints: \[  
      'Life jackets are under the front seats.',  
      'Children under 6 must wear life jackets at all times.',  
      'VHF Channel 16 monitored throughout the trip.',  
      'Swim only with the swim ladder — no jumping from railings.',  
      'Stay clear of the propeller area when swimming.',  
      'Maximum capacity is \[X\] — no exceptions.',  
    \],

    waiverTemplate: \`PONTOON CHARTER AGREEMENT AND LIABILITY WAIVER

I acknowledge participation in a recreational pontoon boat charter and understand risks including: slipping, falling overboard, sun exposure, and waterway hazards. \[Standard clauses follow\]

WEIGHT AND CAPACITY: I confirm that the total party weight is within the vessel's stated capacity. Overloading is a serious safety violation.\`,

    suggestedAddons: \[  
      { name: 'Floating Island / Lily Pad', description: '6x15ft inflatable floating platform', emoji: '🌊', suggestedPrice: 4000 },  
      { name: 'Cooler Package', description: 'Pre-stocked cooler with ice, waters, sodas', emoji: '🧊', suggestedPrice: 3000 },  
      { name: 'Bluetooth Speaker Upgrade', description: 'Premium waterproof speaker rental', emoji: '🎵', suggestedPrice: 2000 },  
      { name: 'Tube Towing Session', description: 'Inflatable tube \+ tow rope', emoji: '🚤', suggestedPrice: 2500 },  
      { name: 'Photographer', description: 'Onboard photographer for the group', emoji: '📸', suggestedPrice: 12000 },  
    \],  
  },

  snorkel\_dive: {  
    label: 'Snorkel / Dive Charter',  
    emoji: '🤿',  
    description: 'Reef snorkelling and   
      scuba diving experiences',

    standardEquipment: \[  
      'Snorkel masks and fins (all sizes)',  
      'Flotation devices / noodles',  
      'Dive flag (required by law)',  
      'Life jackets for all passengers',  
      'First aid kit with O2 unit',  
      'VHF radio',  
      'Anchor and mooring equipment',  
    \],  
    optionalEquipment: \[  
      'BCD and regulators (scuba)',  
      'Wetsuit rental (various sizes)',  
      'Air tanks',  
      'Underwater torch',  
      'Underwater camera rental',  
      'Coral reef ID cards',  
      'Drysuit (cold water)',  
    \],

    amenityGroups: \[  
      {  
        title: 'Snorkel equipment',  
        items: \[  
          { key: 'masks', label: 'Masks and snorkels included', default: true },  
          { key: 'fins', label: 'Fins included', default: true },  
          { key: 'vests', label: 'Snorkel vests included', default: true },  
          { key: 'prescription', label: 'Prescription masks available', default: false },  
          { key: 'kids\_gear', label: 'Children\\'s gear available', default: true },  
        \]  
      },  
      {  
        title: 'Scuba diving',  
        items: \[  
          { key: 'tanks', label: 'Air tanks provided', default: false },  
          { key: 'bcd', label: 'BCDs available for rent', default: false },  
          { key: 'regulators', label: 'Regulators available for rent', default: false },  
          { key: 'wetsuits', label: 'Wetsuit rental available', default: false },  
          { key: 'divemaster', label: 'Certified divemaster onboard', default: false },  
        \]  
      }  
    \],

    specificFields: \[  
      {  
        key: 'cert\_requirement',  
        label: 'Certification required for scuba',  
        type: 'select',  
        required: false,  
        options: \[  
          { value: 'none', label: 'No — snorkel only, no scuba' },  
          { value: 'open\_water', label: 'PADI Open Water or equivalent' },  
          { value: 'advanced', label: 'PADI Advanced Open Water or equivalent' },  
          { value: 'any\_cert', label: 'Any recognised certification' },  
        \]  
      },  
      {  
        key: 'max\_depth',  
        label: 'Maximum diving depth',  
        type: 'select',  
        required: false,  
        options: \[  
          { value: 'surface', label: 'Surface only (snorkel)' },  
          { value: '15ft', label: 'Up to 15ft (beginner)' },  
          { value: '40ft', label: 'Up to 40ft (open water)' },  
          { value: '60ft', label: 'Up to 60ft (advanced)' },  
          { value: '130ft', label: 'Up to 130ft (divemaster)' },  
        \]  
      },  
      {  
        key: 'dive\_sites',  
        label: 'Primary dive / snorkel sites',  
        type: 'text',  
        required: false,  
        placeholder: 'e.g. Molasses Reef, Christ of the Abyss, Pennekamp',  
        helpText: 'Where do you typically take guests?'  
      },  
      {  
        key: 'divemaster\_ratio',  
        label: 'Divemaster to diver ratio',  
        type: 'select',  
        required: false,  
        options: \[  
          { value: '1:4', label: '1 divemaster per 4 divers' },  
          { value: '1:6', label: '1 divemaster per 6 divers' },  
          { value: '1:8', label: '1 divemaster per 8 divers' },  
          { value: 'no\_divemaster', label: 'No divemaster (certified divers only)' },  
        \]  
      }  
    \],

    standardRules: \[  
      'Never dive alone — buddy system mandatory',  
      'No touching, standing on, or collecting coral',  
      'Dive flag must be deployed at all times',  
      'Ascend slowly — maximum 30ft per minute',  
      'Safety stop at 15ft for 3 minutes on all dives over 30ft',  
    \],  
    standardDos: \[  
      'Equalise ear pressure frequently when descending',  
      'Signal OK to buddy every 30 seconds',  
      'Stay with your buddy at all times',  
      'Inform captain of any medical conditions including asthma',  
      'Pre-hydrate well before diving',  
      'Check gear before entering the water',  
    \],  
    standardDonts: \[  
      'No touching, holding, or collecting any marine life',  
      'Do not stand on coral reefs',  
      'No diving after alcohol consumption',  
      'Do not fly within 18 hours of diving (DCS risk)',  
      'No removing anything from the ocean',  
      'Do not feed fish',  
    \],

    whatToBring: \[  
      'Swimwear',  
      'Rash guard or wetsuit (optional)',  
      'Towel',  
      'Sunscreen (reef-safe only)',  
      'Underwater camera (optional)',  
      'Motion sickness medication',  
      'Proof of dive certification (if scuba)',  
      'Snacks and water',  
    \],  
    whatNotToBring: \[  
      'Regular sunscreen (harmful to coral — reef-safe only)',  
      'Jewellery (lost easily in water)',  
      'Contact lenses (unless sealed in prescription mask)',  
    \],

    safetyPoints: \[  
      'Reef-safe sunscreen only — regular sunscreen kills coral.',  
      'Dive flag deployed before any water entry.',  
      'Buddy system — no solo swimming away from the vessel.',  
      'Life jackets under the bow seats.',  
      'O2 unit onboard for dive emergencies.',  
      'DAN (Divers Alert Network) emergency: \+1-919-684-9111',  
    \],

    waiverTemplate: \`SNORKEL AND DIVING CHARTER AGREEMENT AND LIABILITY WAIVER

I acknowledge that snorkelling and scuba diving involve specific risks including but not limited to: decompression sickness, air embolism, marine life encounters, drowning, disorientation, and equipment failure.

MEDICAL FITNESS: I confirm I am medically fit to dive/snorkel. I do not have any of the following conditions without physician approval: asthma, heart conditions, epilepsy, recent surgery, pregnancy, or ear/sinus problems.

CERTIFICATION: For scuba activities, I confirm I hold the stated certification level and my skills are current. I understand that misrepresenting my certification level is dangerous and voids all liability protections.\`,

    suggestedAddons: \[  
      { name: 'Underwater Camera Rental', description: 'GoPro or sealife camera', emoji: '🎥', suggestedPrice: 2500 },  
      { name: 'Full Wetsuit Rental', description: 'Full suit for comfort in cooler water', emoji: '🤿', suggestedPrice: 1500 },  
      { name: 'PADI Discover Scuba', description: 'Intro dive session with divemaster', emoji: '🌊', suggestedPrice: 8500 },  
      { name: 'Reef-Safe Sunscreen', description: 'Protect the reef and yourself', emoji: '☀️', suggestedPrice: 800 },  
    \],  
  },

  sailing\_yacht: {  
    label: 'Sailing Yacht',  
    emoji: '⛵',  
    description: 'Classic or modern sailing   
      yacht experience',

    standardEquipment: \[  
      'Life jackets and harnesses for all',  
      'EPIRB and PLB',  
      'Life raft',  
      'VHF radio and AIS',  
      'Flares',  
      'Storm sails',  
      'First aid kit',  
    \],  
    optionalEquipment: \[  
      'Autopilot',  
      'Windlass (electric anchor)',  
      'Watermaker',  
      'Solar panels',  
      'SSB / satellite phone',  
    \],

    amenityGroups: \[  
      {  
        title: 'Navigation',  
        items: \[  
          { key: 'chartplotter', label: 'Chart plotter / GPS', default: true },  
          { key: 'ais', label: 'AIS transponder', default: true },  
          { key: 'autopilot', label: 'Autopilot', default: false },  
          { key: 'radar', label: 'Radar', default: false },  
        \]  
      },  
      {  
        title: 'Accommodation',  
        items: \[  
          { key: 'heads', label: 'Onboard bathroom', default: true },  
          { key: 'galley', label: 'Galley kitchen', default: true },  
          { key: 'cabins', label: 'Sleeping berths / cabins', default: false },  
          { key: 'ac', label: 'Air conditioning', default: false },  
        \]  
      }  
    \],

    specificFields: \[  
      {  
        key: 'sailing\_experience\_required',  
        label: 'Sailing experience required',  
        type: 'select',  
        required: true,  
        options: \[  
          { value: 'none', label: 'None — fully crewed, relax and enjoy' },  
          { value: 'basic', label: 'Basic — guests may help with lines' },  
          { value: 'intermediate', label: 'Intermediate — ASA 101 or equivalent' },  
          { value: 'advanced', label: 'Advanced — ASA 103/104 or equivalent' },  
        \]  
      },  
      {  
        key: 'bareboat\_cert',  
        label: 'Bareboat certification accepted',  
        type: 'text',  
        required: false,  
        placeholder: 'e.g. ASA 104, RYA Coastal Skipper',  
      },  
      {  
        key: 'offshore\_capable',  
        label: 'Offshore passages',  
        type: 'boolean',  
        required: false,  
        helpText: 'Available for overnight or offshore passages?'  
      }  
    \],

    standardRules: \[  
      'All crew instructions regarding sail handling must be followed',  
      'Boom swings unexpectedly — always be aware of your head',  
      'Safety harness required offshore and at night',  
      'No interference with helm or navigation equipment',  
    \],  
    standardDos: \[  
      'Duck when you hear "Ready about" or "Tacking"',  
      'Move to the high side when boat heels (leans)',  
      'Clip on safety harness when offshore',  
      'Inform skipper of seasickness early',  
    \],  
    standardDonts: \[  
      'Do not touch lines, winches, or sheets without instruction',  
      'Do not stand in path of swinging boom',  
      'No crossing in front of the mast when underway',  
      'Do not lean over rails offshore',  
    \],

    whatToBring: \[  
      'Non-marking deck shoes with grip soles',  
      'Layered clothing (it\\'s colder on a sailboat)',  
      'Waterproof jacket / foul weather gear',  
      'Motion sickness medication',  
      'Sunscreen and polarised sunglasses',  
      'Small soft bag (no hard luggage)',  
      'Sea bands / acupressure wristbands',  
    \],  
    whatNotToBring: \[  
      'Hard-sided luggage',  
      'High heels',  
      'Strong perfume',  
      'Large electronics',  
    \],

    safetyPoints: \[  
      'Life jackets and harnesses stored at the nav station.',  
      'Life raft located at stern.',  
      'EPIRB registered and armed — located at companionway.',  
      'Boom covers the entire cockpit — duck on all tacks.',  
      'MOB procedure: shout Man Overboard, press GPS MOB button, point at person, do not lose sight.',  
      'VHF Channel 16 at all times. Pan-Pan for urgent, Mayday for distress.',  
    \],

    waiverTemplate: \`SAILING CHARTER AGREEMENT AND LIABILITY WAIVER

I acknowledge that sailing activities involve risks including: capsizing, boom injuries, seasickness, rough weather, and open water hazards. \[Standard clauses follow\]\`,

    suggestedAddons: \[  
      { name: 'Sailing Lesson (1 hour)', description: 'Learn to helm and trim sails', emoji: '⛵', suggestedPrice: 5000 },  
      { name: 'Sunset Wine Cruise Package', description: 'Wine, cheese, and crackers selection', emoji: '🍷', suggestedPrice: 4500 },  
      { name: 'Snorkel Stop Package', description: 'Gear for anchored snorkel session', emoji: '🤿', suggestedPrice: 2500 },  
    \],  
  },

  speedboat: {  
    label: 'Speedboat / Bowrider',  
    emoji: '💨',  
    description: 'High-performance speed and   
      wake sports experiences',

    standardEquipment: \[  
      'Life jackets for all passengers',  
      'Swim platform',  
      'Sound system',  
      'VHF radio or cell',  
    \],  
    optionalEquipment: \[  
      'Wakeboard tower',  
      'Ballast bags',  
      'Tow rope and handle',  
      'Tube',  
      'Water skis',  
      'Hydrofoil board',  
    \],

    amenityGroups: \[  
      {  
        title: 'Wake sports',  
        items: \[  
          { key: 'wakeboard', label: 'Wakeboarding setup', default: false },  
          { key: 'water\_ski', label: 'Water skiing setup', default: false },  
          { key: 'wake\_surf', label: 'Wake surfing (ballast)', default: false },  
          { key: 'tube', label: 'Tube towing', default: false },  
          { key: 'hydrofoil', label: 'Hydrofoil board', default: false },  
        \]  
      }  
    \],

    specificFields: \[  
      {  
        key: 'top\_speed',  
        label: 'Top speed (approximate mph)',  
        type: 'number',  
        required: false,  
        placeholder: '55',  
      },  
      {  
        key: 'sports\_included',  
        label: 'Wake sports included in price',  
        type: 'boolean',  
        required: true,  
        helpText: 'Are wake sports equipment and instruction included?'  
      }  
    \],

    standardRules: \[  
      'Life jackets required for all wake sports activities',  
      'Spotter must be present when towing',  
      'No wake sports within 200ft of shore or other vessels',  
      'Operator determines safe conditions for sports',  
    \],  
    standardDos: \[  
      'Wear a properly fitted life jacket for ALL water sports',  
      'Signal to the boat clearly if you fall',  
      'Wait for the all-clear before swimming toward the boat',  
      'Let the instructor know your experience level honestly',  
    \],  
    standardDonts: \[  
      'Do not swim near the propeller',  
      'No unsupervised water sports',  
      'Do not attempt tricks without captain approval',  
      'No alcohol before water sports',  
    \],

    whatToBring: \[  
      'Swimwear',  
      'Rashguard or wetsuit',  
      'Towel',  
      'Sunscreen',  
      'Change of clothes',  
      'Closed-toe water shoes',  
    \],  
    whatNotToBring: \[  
      'Loose jewellery (removed before water sports)',  
      'Contact lenses without goggles',  
    \],

    safetyPoints: \[  
      'Life jackets must be worn for ALL tow sports — no exceptions.',  
      'Spotter required at all times during towing.',  
      'Hand signals: thumbs up \= faster, thumbs down \= slower, wave \= done.',  
      'If you fall: stay still and raise one arm.',  
      'Do not approach the engine area when in the water.',  
    \],

    waiverTemplate: \`POWERBOAT AND WATERSPORTS CHARTER AGREEMENT

I acknowledge risks including high-speed boating, wake sports injuries, falls, and propeller hazards. \[Standard clauses follow\]\`,

    suggestedAddons: \[  
      { name: 'Wakeboard Lesson (30 min)', description: 'Instruction for beginners', emoji: '🏄', suggestedPrice: 4500 },  
      { name: 'GoPro Rental', description: 'Capture your runs', emoji: '🎥', suggestedPrice: 2000 },  
      { name: 'Tube Session', description: 'Fun for the whole group', emoji: '🚤', suggestedPrice: 2000 },  
    \],  
  },

  sunset\_cruise: {  
    label: 'Sunset Cruise / Tour',  
    emoji: '🌅',  
    description: 'Scenic cruises, sunset tours,   
      and sightseeing experiences',

    standardEquipment: \[  
      'Life jackets for all passengers',  
      'Sound system',  
      'Deck seating for all',  
      'Lighting for evening return',  
      'VHF radio',  
    \],  
    optionalEquipment: \[  
      'Bar setup',  
      'Live music setup',  
      'Microphone for narration',  
      'Mood lighting',  
    \],

    amenityGroups: \[  
      {  
        title: 'Entertainment',  
        items: \[  
          { key: 'sound\_system', label: 'Sound system', default: true },  
          { key: 'bar', label: 'Bar setup', default: true },  
          { key: 'lighting', label: 'Mood / ambient lighting', default: false },  
          { key: 'live\_music', label: 'Live music option', default: false },  
          { key: 'narration', label: 'Commentary / narration', default: false },  
        \]  
      }  
    \],

    specificFields: \[  
      {  
        key: 'route\_type',  
        label: 'Route type',  
        type: 'select',  
        required: true,  
        options: \[  
          { value: 'fixed', label: 'Fixed route (same every trip)' },  
          { value: 'flexible', label: 'Flexible (captain recommends)' },  
          { value: 'custom', label: 'Fully customisable by guest' },  
        \]  
      },  
      {  
        key: 'bar\_type',  
        label: 'Bar service',  
        type: 'select',  
        required: true,  
        options: \[  
          { value: 'open\_bar', label: 'Open bar included in price' },  
          { value: 'cash\_bar', label: 'Cash bar onboard' },  
          { value: 'byob', label: 'BYOB welcome' },  
          { value: 'no\_alcohol', label: 'No alcohol' },  
          { value: 'add\_on', label: 'Drinks available as add-on' },  
        \]  
      },  
    \],

    standardRules: \[  
      'Remain seated during departure and arrival',  
      'No leaning over railings for photos',  
      'Alcohol consumption responsibly only',  
      'Captain determines safe weather conditions',  
    \],  
    standardDos: \[  
      'Arrive 15 minutes before departure',  
      'Bring a jacket — it gets cool on the water at sunset',  
      'Have your camera ready — sunsets are quick',  
      'Choose your preferred side early for sunset viewing',  
    \],  
    standardDonts: \[  
      'Do not lean over railings for selfies',  
      'No swimming from a moving vessel',  
      'Do not bring outside food or drinks (check policy)',  
      'No standing on furniture or railings',  
    \],

    whatToBring: \[  
      'Light jacket or wrap',  
      'Camera',  
      'Sunglasses',  
      'Comfortable shoes (no heels)',  
      'Small bag only',  
    \],  
    whatNotToBring: \[  
      'High heels',  
      'Large bags or backpacks',  
      'Outside alcohol (check policy)',  
    \],

    safetyPoints: \[  
      'Life jackets under seats.',  
      'Remain seated during manoeuvring.',  
      'No swimming from vessel during cruise.',  
      'In an emergency: VHF Channel 16.',  
    \],

    waiverTemplate: \`SUNSET CRUISE PARTICIPATION AGREEMENT

I acknowledge participation in a recreational boat cruise and understand associated risks. \[Standard clauses follow\]\`,

    suggestedAddons: \[  
      { name: 'Champagne Toast Package', description: 'Sparkling wine for the sunset moment', emoji: '🥂', suggestedPrice: 6500 },  
      { name: 'Charcuterie Board', description: 'Cheese, meats, crackers, fruit', emoji: '🧀', suggestedPrice: 4500 },  
      { name: 'Professional Photos', description: 'Golden hour photography session', emoji: '📸', suggestedPrice: 12000 },  
      { name: 'Live Acoustic Set', description: '1-hour musician onboard', emoji: '🎸', suggestedPrice: 20000 },  
    \],  
  },

  other: {  
    label: 'Other vessel',  
    emoji: '🚢',  
    description: 'Custom vessel type',  
    standardEquipment: \['Life jackets for all', 'VHF radio', 'First aid kit'\],  
    optionalEquipment: \[\],  
    amenityGroups: \[\],  
    specificFields: \[\],  
    standardRules: \['Follow captain\\'s instructions at all times'\],  
    standardDos: \['Wear appropriate footwear', 'Apply sunscreen'\],  
    standardDonts: \['No glass bottles', 'No throwing objects overboard'\],  
    whatToBring: \['Valid ID', 'Sunscreen', 'Towel'\],  
    whatNotToBring: \['Glass bottles', 'Sharp objects'\],  
    safetyPoints: \['Life jackets located onboard', 'VHF Channel 16 for emergencies'\],  
    waiverTemplate: \`CHARTER AGREEMENT AND LIABILITY WAIVER\\n\\nI acknowledge risks of boating activities...\`,  
    suggestedAddons: \[\],  
  },  
}

// Helper to get template  
export function getBoatTemplate(type: BoatTypeKey): BoatTemplate {  
  return BOAT\_TEMPLATES\[type\]  
}

// Pre-fill defaults from template  
export function getDefaultsFromTemplate(  
  type: BoatTypeKey  
): Partial\<WizardData\> {  
  const t \= BOAT\_TEMPLATES\[type\]  
  return {  
    whatToBring: t.whatToBring.join('\\n'),  
    whatNotToBring: t.whatNotToBring.join('\\n'),  
    standardRules: t.standardRules,  
    customDos: t.standardDos,  
    customDonts: t.standardDonts,  
    waiverText: t.waiverTemplate,  
    safetyPoints: t.safetyPoints,  
    suggestedAddons: t.suggestedAddons,  
    equipment: t.standardEquipment,  
  }  
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
PART B — WIZARD STATE  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create: apps/web/app/dashboard/boats/new/  
  types.ts

Full WizardData interface covering all 8 steps.  
This is larger than before — include all fields:

export interface WizardData {  
  // Step 1  
  boatName: string  
  boatType: BoatTypeKey | ''  
  charterType: 'captained' | 'bareboat' | 'both' | ''  
  yearBuilt: string  
  lengthFt: string  
  maxCapacity: string  
  uscgDocNumber: string  
  registrationState: string  
    
  // Step 2  
  marinaName: string  
  marinaAddress: string  
  slipNumber: string  
  parkingInstructions: string  
  lat: number | null  
  lng: number | null  
    
  // Step 3  
  captainName: string  
  captainPhotoFile: File | null  
  captainPhotoPreview: string  
  captainBio: string  
  captainLicense: string  
  captainLicenseType: string  
  captainLanguages: string\[\]  
  captainYearsExp: string  
  captainTripCount: string  
  captainRating: string  
    
  // Step 4 — Equipment and type-specific  
  selectedEquipment: string\[\]  
  selectedAmenities: Record\<string, boolean\>  
  specificFieldValues: Record\<string, string | boolean | string\[\]\>  
    
  // Step 5 — Rules  
  standardRules: string\[\]  
  customDos: string\[\]  
  customDonts: string\[\]  
  customRuleSections: {  
    id: string  
    title: string  
    items: string\[\]  
    type: 'bullet' | 'numbered' | 'check'  
  }\[\]  
    
  // Step 6 — Bring / Not Bring  
  whatToBring: string  
  whatNotToBring: string  
    
  // Step 7 — Waiver and safety  
  waiverText: string  
  safetyPoints: string\[\]  
    
  // Step 8 — Photos \+ Addons  
  boatPhotos: File\[\]  
  boatPhotosPreviews: string\[\]  
  addons: WizardAddon\[\]  
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
PART C — WIZARD CONTAINER  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create: BoatWizard.tsx as before.  
8 steps total.

Step labels:  
  1  "Vessel basics"  
  2  "Marina & dock"  
  3  "Captain"  
  4  "Equipment"  
  5  "Rules & conduct"  
  6  "Packing guide"  
  7  "Safety & waiver"  
  8  "Photos & add-ons"

KEY BEHAVIOUR:  
When boat type is selected in Step 1:  
  Call getDefaultsFromTemplate(boatType)  
  Merge into wizard data  
  All subsequent steps pre-filled  
  Operator edits, doesn't write from scratch

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
PART D — STEP 1: VESSEL BASICS  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create: steps/Step1Vessel.tsx

BOAT TYPE SELECTOR (most important UI):  
  8 large cards in a grid (2 cols mobile,   
  4 cols desktop)  
    
  Each card:  
    Large emoji (32px)  
    Boat type name (14px, 600\)  
    Description (11px, grey, 1 line)  
    Border: 1px \#D0E2F3 unselected  
    Selected: 2px navy \+ \#E8F2FB background  
    Height: 90px  
    Radius: 12px  
    Hover: \#F5F8FC background  
    
  On select:  
    Visual highlight immediately  
    Template loads in background  
    Show loading indicator briefly  
    "Loading \[Fishing Charter\] settings..."   
    (AnchorLoader sm \+ text, 1.5s max)

AFTER TYPE SELECTED — form appears:

  Boat name \* (text)  
  Charter type \* (3 radio cards as before)  
  Max passengers \* (number)  
  Vessel length (ft) (number, optional)  
  Year built (number, optional)  
    
  USCG Documentation (optional section):  
    Toggle to expand: "USCG documentation"  
    When expanded:  
      Documentation number (text)  
      Registration state (select, US states)  
    
  At bottom: info banner based on boat type:  
    Fishing: "Florida vessel charter license   
      information will be covered in Step 4"  
    Sailing: "Bareboat certification requirements   
      will be covered in Step 4"  
    Dive: "Certification requirements will be   
      covered in Step 4"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
PART E — STEP 2: MARINA & DOCK  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create: steps/Step2Marina.tsx

SAME as before — marina name, address, slip,  
parking, Mapbox location picker.

One addition:  
  OPERATING AREA field (new):  
    Label: "Where does this vessel operate?"  
    Textarea, 2 rows  
    Placeholder:   
      Yacht: "Biscayne Bay and surrounding   
        coastal waters"  
      Fishing: "Biscayne Bay, inshore and   
        nearshore waters up to 20 miles"  
      Sailing: "Coastal Florida waters,   
        not exceeding 12 nautical miles offshore"  
    This appears on guest trip page as   
    "where you'll be going"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
PART F — STEP 3: CAPTAIN  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create: steps/Step3Captain.tsx

SAME as Phase 2 spec plus:

  Trip count (optional):  
    Label: "Number of charter trips completed"  
    Placeholder: "124"  
    Helper: "Shown as social proof on   
      your guest page"

  Average rating (optional):  
    Label: "Current average rating"  
    Placeholder: "4.9"  
    Helper: "Pulls from your Boatsetter/  
      GetMyBoat rating"

  Certifications (new section):  
    Label: "Additional certifications"  
    Toggle chips (multi-select):  
      ✓ CPR / First Aid certified  
      ✓ Swift Water Rescue  
      ✓ USCG Safety Instructor  
      ✓ PADI Divemaster  
      ✓ ASA Certified Instructor  
      ✓ Florida Boating Safety Instructor  
    Selected \= teal bg

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
PART G — STEP 4: EQUIPMENT & AMENITIES  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create: steps/Step4Equipment.tsx

This step is entirely driven by the   
boat template selected in Step 1\.

SECTION 1 — Standard Equipment:  
  Title: "Standard safety equipment"  
  Info text: "Required by USCG for all   
    charter vessels. Check what's onboard."  
    
  Pre-loaded from template.standardEquipment  
  Each item: checkbox (pre-checked) \+ label  
  Operator can uncheck if they don't have it  
    → shows amber warning: "Guests expect this   
      on a \[type\] charter"

SECTION 2 — Optional Equipment:  
  Title: "Optional equipment onboard"  
  Pre-loaded from template.optionalEquipment  
  Each item: checkbox (unchecked by default)  
  Operator checks what they have

SECTION 3 — Amenity Groups:  
  Rendered from template.amenityGroups  
  Each group has its own heading  
  Each item: toggle switch (on/off)  
  Pre-checked per template defaults  
    
  Example (Motor Yacht):  
    ─ Comfort ─────────────────  
    \[■\] Air conditioning  
    \[■\] Onboard bathroom  
    \[□\] Galley kitchen  
      
    ─ Entertainment ────────────  
    \[■\] Bluetooth speaker  
    \[□\] TV onboard

SECTION 4 — Boat-Type Specific Fields:  
  Title: "Specific to \[boat type\]"  
    
  Rendered from template.specificFields  
  Each field has its own component:  
    
  type: 'select' → shadcn Select  
  type: 'multiselect' → checkbox group  
  type: 'text' → Input  
  type: 'number' → number Input  
  type: 'boolean' → Toggle switch  
    
  Each field shows its helpText below  
  Required fields marked with \*  
    
  This is where fishing boats get their  
  "catch policy" and "target species" fields,  
  dive charters get their "certification  
  required" fields, etc.

SECTION 5 — Custom fields:  
  "Add your own details"  
  \[+ Add custom detail\] button  
    
  Opens inline form:  
    Label (text) \+ Value (text)  
    \[Save\] \[Cancel\]  
    
  Saved items appear as a list  
  Operator can add unlimited custom details  
  Examples: "WiFi password: YachtMiami2024"  
            "Bluetooth speaker: JBL Xtreme"  
            "Air draft: 18 feet"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
PART H — STEP 5: RULES & CONDUCT  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create: steps/Step5Rules.tsx

This is the richest step. Fully pre-loaded  
from template but fully customisable.

THREE COLUMN TABS on desktop:  
  \[House Rules\] \[DOs ✓\] \[DON'Ts ✗\]  
Single column with sections on mobile.

HOUSE RULES SECTION:  
  Title: "House rules"  
  Subtext: "These are your non-negotiable   
    vessel rules for every charter."  
    
  Pre-loaded list from template.standardRules  
  Each rule:   
    \[drag handle\] \[rule text\] \[edit ✏️\] \[delete 🗑️\]  
    Edit inline on click  
    
  \[+ Add rule\] at bottom  
  Opens single text input with \[Save\]  
    
  Drag to reorder (use @dnd-kit/core library):  
    npm install @dnd-kit/core @dnd-kit/sortable  
    Drag handle on left of each item

DOS SECTION:  
  Title: "DOs — What we encourage"  
  Same list \+ edit \+ drag pattern  
  Pre-loaded from template.standardDos  
  Each item shown with ✓ green prefix on guest page

DONTS SECTION:  
  Title: "DON'Ts — What's not allowed"  
  Same pattern  
  Pre-loaded from template.standardDonts  
  Each item shown with ✗ coral prefix on guest page

CUSTOM RULE SECTIONS:  
  Below the three standard sections:  
    
  "Add a custom section"  
  Subtitle: "Create your own sections with   
    custom titles and items"  
    
  \[+ Add section\] button  
    
  On click, inline form:  
    Section title: text input  
    Display type: \[• Bullet\] \[1. Numbered\] \[☑ Checklist\]  
    \[Create section\]  
    
  Created sections appear below with:  
    Section title (editable)  
    Items list (editable, same as rules above)  
    Display type badge  
    \[Delete section\]  
    
  Examples operators create:  
    "Alcohol policy" (bullet)  
    "Children guidelines" (checklist)  
    "Photography rules" (bullet)  
    "Overnight procedures" (numbered)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
PART I — STEP 6: PACKING GUIDE  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create: steps/Step6Packing.tsx

Two columns on desktop, single on mobile.

WHAT TO BRING:  
  Title: "What guests should bring"  
  Pre-loaded textarea from template.whatToBring  
  (one item per line)  
    
  Format helper below textarea:  
  "Enter one item per line. These become   
    a tickable checklist for guests."  
    
  Live preview panel (toggle on desktop):  
    Shows items as the actual checklist  
    guests will see on their trip page  
    With tick boxes (visual only)

WHAT NOT TO BRING:  
  Title: "What guests should NOT bring"  
  Same pattern  
  Pre-loaded from template.whatNotToBring  
    
  Live preview shows items with ✗ prefix  
  and coral colour

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
PART J — STEP 7: SAFETY & WAIVER  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create: steps/Step7Safety.tsx

TWO PARTS:

PART A — SAFETY BRIEFING CARDS:  
  Title: "Safety briefing points"  
  Subtext: "Guests swipe through these   
    cards and tap 'Understood' on each   
    before signing the waiver. Legally   
    stronger than a single checkbox."  
    
  Pre-loaded from template.safetyPoints  
  Items contain \[location\] placeholders  
  that operator fills in  
    
  Special placeholder handling:  
    Items containing \[location\] show  
    an inline text input when clicked:  
    "Life jackets are located \_\_\_"  
    Operator types: "under the bow seats"  
    Saves as: "Life jackets are located   
    under the bow seats"  
    
  Each safety card item:  
    \[drag handle\] \[card text\] \[edit\] \[delete\]  
    
  \[+ Add safety point\] button  
    
  Preview card at bottom:  
    Shows what the mobile card looks like  
    Navy border, safety icon, text,   
    "Understood ✓" button (visual only)

PART B — LIABILITY WAIVER:  
  Title: "Liability waiver"  
  Subtext: "Guests sign this individually   
    with their typed name. Each signature   
    is timestamped with IP and device info."  
    
  Disclaimer banner:  
    ⚠️ amber background  
    "BoatCheckin provides this template as a   
    starting point. Consult a maritime   
    attorney to ensure your waiver provides   
    adequate protection in your jurisdiction."  
    
  Tall textarea (min 400px):  
    Pre-loaded from template.waiverTemplate  
    Fully editable  
    Character count (no limit)  
    
  \[Edit\] / \[Preview\] toggle:  
    Preview renders formatted waiver text  
    as guests will see it in their app  
    Shows "Sofia Martinez" as example signature  
    
  Common additions prompt:  
    Collapsible "Add standard clauses" section  
    Chips the operator can tap to append:  
      \[+ Medical conditions clause\]  
      \[+ Weather cancellation clause\]  
      \[+ Photography/media release\]  
      \[+ Minor passengers clause\]  
      \[+ Alcohol liability clause\]  
    Tapping appends the standard legal text  
    for that clause to the waiver

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
PART K — STEP 8: PHOTOS & ADD-ONS  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create: steps/Step8Photos.tsx

SECTION 1 — BOAT PHOTOS:  
  Title: "Photos of your boat"  
  Subtext: "Add photos that appear in your   
    guest's trip page. Clear, well-lit photos   
    of the deck and interior convert best."  
    
  Photo upload grid:  
    4-column grid (2 on mobile)  
    Each cell: 120px × 90px  
      
    Empty cell:  
      Dashed border  
      \+ icon centred  
      "Add photo" text  
      
    Filled cell:  
      Image preview  
      On hover: 🗑️ delete overlay  
      First photo badge: "Cover photo"  
      Drag to reorder  
      
    Allow up to 12 photos  
    Each: max 5MB, JPEG/PNG/WebP  
    Validate magic bytes client-side  
      
    Multi-select on desktop:  
      Can select multiple files at once  
      from file picker  
      
    Mobile: camera icon option to  
      take photo directly  
    
  Tips card below upload area:  
    "📸 Photo tips that work best:  
     ✓ Deck and seating area  
     ✓ Interior/cabin (if applicable)  
     ✓ Captain at helm  
     ✓ Guests enjoying the experience  
     ✓ The view from the boat  
     ✗ Avoid blurry or dark photos"

SECTION 2 — ADD-ON MENU:  
  Title: "Add-on menu"  
  Subtext: "Items guests can pre-order   
    before arriving. You earn the full   
    amount — BoatCheckin takes a small   
    platform fee on orders."  
    
  SUGGESTED ADD-ONS:  
    Show template.suggestedAddons as   
    pre-filled cards with "Add to menu" button  
    Each suggested card:  
      Emoji \+ Name \+ Description \+ Price  
      \[Add to my menu\] → moves to active list  
    
  ACTIVE ADD-ONS list:  
    Items operator has added  
    Each item row:  
      \[emoji picker\] | \[name\] | \[description\]   
      | \[price $\] | \[max qty\] | \[remove\]  
      
    Emoji picker:   
      Small grid of common emojis  
      \+ ability to type any emoji  
      
    Price input:  
      Shows in dollars: $ \_\_\_.\_\_  
      Stored as cents internally  
      
    Max quantity:  
      Default: 10  
      Number input, min 1  
      
    \[+ Add custom item\] at bottom  
    Opens blank row in edit mode  
    
  SKIP OPTION:  
    "Skip for now — I'll add these later"  
    Ghost text link → proceeds without addons  
    Operator can add addons from boat   
    settings anytime

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
PART L — COMPLETION & SAVE  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create: steps/StepComplete.tsx  
Create: apps/web/app/dashboard/boats/new/  
  actions.ts

On final "Save boat profile" button in Step 8:

SERVER ACTION (actions.ts):  
  import 'server-only'  
    
  1\. requireOperator()  
  2\. Validate complete data with   
     boatSetupSchema from sanitise.ts  
  3\. Upload captain photo to Supabase storage:  
     Path: boat-photos/\[operatorId\]/captain/\[uuid\].jpg  
     Use sharp to resize to 400×400px  
  4\. Upload boat photos to Supabase storage:  
     Path: boat-photos/\[operatorId\]/boats/\[uuid\].jpg  
     Use sharp to resize to max 1200px wide  
  5\. INSERT into boats table (full schema)  
  6\. INSERT addons if any  
  7\. auditLog({ action: 'boat\_created', ... })  
  8\. return { boatId }

COMPLETION SCREEN:  
  Full screen, navy background  
    
  Top:  
    Large white ⚓ (48px, static)  
    "Your boat is ready\! ⚓"  
    "\[Boat name\]" in white subtitle  
    
  White card below:  
    "What happens next:"  
      
    Step 1: Create your first trip  
      → Takes 30 seconds  
    Step 2: Copy the trip link  
      → One WhatsApp message to guests    
    Step 3: Guests check in  
      → Waivers signed before they arrive  
      
    \[Create my first trip →\]  
    Primary navy button (full width)  
    → /dashboard/trips/new

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
ADDITIONAL DEPENDENCIES NEEDED  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Install before building:

npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

These power the drag-to-reorder in Step 5  
and photo reordering in Step 8\.  
No other new dependencies needed.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
VERIFICATION TESTS  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TEST 1 — Template loading:  
  Select "Fishing Charter" in Step 1  
  Advance to Step 4  
  Equipment section should show fishing-specific  
  items: "Live bait well", "Rod holders",   
  "Fish finder"  
  "Catch policy" field should appear  
    
  Go back, change to "Motor Yacht"  
  Advance to Step 4  
  Equipment should change to yacht items  
  Catch policy should be gone

TEST 2 — Rules editing:  
  In Step 5, edit a pre-loaded rule inline  
  Add a new rule  
  Drag to reorder  
  Add a custom section with 3 items

TEST 3 — Safety card placeholder:  
  In Step 7, click on a safety card  
  containing "\[location\]"  
  Should show inline text input  
  Type a location and save  
  Text should update with filled location

TEST 4 — Waiver clause append:  
  Tap "Add medical conditions clause"  
  Standard clause text appends to bottom  
  of waiver textarea

TEST 5 — Photo upload:  
  Upload 3 photos in Step 8  
  Drag to reorder  
  Delete one  
  Verify cover photo badge on first

TEST 6 — Add-on from suggestion:  
  Click "Add to my menu" on a   
  suggested add-on  
  It moves to active list  
  Edit the price

TEST 7 — Complete save:  
  Complete all 8 steps  
  Click "Save boat profile"  
  Verify in Supabase: boats table has new row  
  Verify: addons table has items if added  
  Verify: photos in Supabase storage  
  Verify: audit\_log entry

TEST 8 — Build:  
  npm run typecheck → zero errors  
  npm run build → zero errors

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
REPORT BACK  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When all 8 tests pass:  
  1\. Every file created with full path  
  2\. All 8 tests: pass/fail  
  3\. Any deviations from spec \+ why  
  4\. Any library issues encountered  
  5\. Screenshot description of Step 4  
     for both fishing and yacht types  
     (showing template difference)

---

**What this Phase 2 gives you:**

✅ 9 boat types with unique field sets  
✅ Smart template system — type drives content  
✅ Step 4: Equipment changes per boat type  
✅ Step 5: Rules, DOs, DON'Ts pre-loaded  
     \+ custom sections \+ drag to reorder  
✅ Step 6: Packing guide with live preview  
✅ Step 7: Safety cards with \[location\] fill  
     \+ waiver with clause append buttons  
✅ Step 8: Multi-photo upload \+ reorder  
     \+ add-on menu with suggestions  
✅ All data saved to Supabase on complete  
✅ Operator sees it once — runs forever

Phase 3 after this is trip creation — 30 seconds, one WhatsApp message, first guest link. 🌙

