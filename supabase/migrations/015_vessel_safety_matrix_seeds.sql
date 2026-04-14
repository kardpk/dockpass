-- ==========================================
-- Migration 015: Vessel Safety Matrix — Dictionary Seeds
--
-- Seeds the global_safety_dictionary with vessel-specific
-- safety topic entries for the Dynamic Vessel Safety Matrix.
-- These entries provide legally-precise USCG/FWC compliant
-- titles and instructions for each topic_key used by the
-- boat template system.
-- ==========================================

INSERT INTO public.global_safety_dictionary (topic_key, language_code, title, instructions, emoji)
VALUES
  -- ── Pontoon / Party Boat ─────────────────────────────────────────────
  ('bow_riding', 'en', 'Illegal Bow Riding',
   'Under FWC law, sitting on the front deck outside the railing while underway is reckless operation. A fall results in being immediately run over by the pontoon logs and propeller. Stay inside the rails at all times.',
   '🚫'),

  ('submarining', 'en', 'Submarining Hazard',
   'Pontoons have low displacement bows. Shifting too much weight forward or plowing into a heavy wake can cause the bow to dive underwater (submarining), snapping the deck fence and swamping the boat. Keep weight distributed evenly.',
   '⚠️'),

  -- ── Speedboat / Center Console ───────────────────────────────────────
  ('ecos_law', 'en', 'Federal Engine Cut-Off Switch (ECOS) Law',
   'By federal law (April 2021), operators of vessels under 26ft must wear the ECOS lanyard at all times while on plane or above displacement speed. If you are ejected, this instantly kills the engine and prevents a fatal prop-strike from a runaway circling boat.',
   '🔴'),

  ('prop_strike', 'en', 'Propeller Strike Zone',
   'Never approach a person in the water with the engine in gear. The engine MUST be in NEUTRAL or OFF. A spinning prop creates suction and causes catastrophic amputations.',
   '⛔'),

  ('wake_zone', 'en', 'Wake Zone & Speed Laws',
   'Florida law mandates slow-speed/no-wake zones near shore, marinas, docks, and manatee zones. Violating wake zones is a criminal offense with fines up to $500. Watch for posted signs and reduce speed when approaching any structure or shallow water.',
   '🐢'),

  -- ── Sailboat ─────────────────────────────────────────────────────────
  ('boom_swing', 'en', 'Lethal Boom Swing',
   'The boom is the most dangerous object on a sailboat. An accidental jibe can swing the boom across the cockpit with bone-crushing force. Keep your head low and remain seated when the boat is tacking or changing direction.',
   '💥'),

  ('winch_pinch', 'en', 'Winch & Rigging Pinch Points',
   'Keep fingers, long hair, and loose clothing far away from blocks, winches, and loaded lines. A loaded jib sheet under tension can easily sever fingers if caught in a turning winch.',
   '⚙️'),

  ('heeling', 'en', 'Heeling & Weight Distribution',
   'Sailboats lean (heel) under wind pressure — this is normal. Stay on the high (windward) side when sailing upwind. Secure all loose items. Move slowly and deliberately, always maintaining three points of contact.',
   '⛵'),

  -- ── Fishing Charter ──────────────────────────────────────────────────
  ('hook_gaff', 'en', 'Hook, Gaff & Casting Safety',
   'Always look behind you before casting to ensure physical clearance. When fish are brought aboard, step back. Never walk near exposed gaffs or loose treble hooks on the deck.',
   '🪝'),

  ('fwc_catch', 'en', 'FWC Catch & Release Laws',
   'You are responsible for knowing Florida FWC slot limits and protected species. Undersized fish or out-of-season catches must be safely released immediately to avoid severe criminal fines.',
   '📏'),

  -- ── Motor Yacht ──────────────────────────────────────────────────────
  ('water_entry', 'en', 'Swim Platform Re-Entry',
   'Never attempt to re-board from the water without captain assistance. Use the swim ladder only. The swim platform can be slippery — hold the grab rail at all times.',
   '🏊'),

  ('carbon_monoxide', 'en', 'Carbon Monoxide Hazard',
   'Engine and generator exhaust produce deadly carbon monoxide (CO). Never sit, swim, or linger near the stern exhaust outlets while engines or generators are running. CO is odorless and can cause sudden loss of consciousness and drowning.',
   '☠️'),

  -- ── Catamaran ────────────────────────────────────────────────────────
  ('trampoline_netting', 'en', 'Trampoline Netting Safety',
   'The fore-deck trampoline netting is designed for sitting or lying, not standing or jumping. Never jump on the trampolines while underway. Keep fingers and toes clear of the netting edges to avoid entrapment.',
   '🕸️'),

  -- ── Snorkel / Dive ───────────────────────────────────────────────────
  ('dive_flag', 'en', 'Dive Flag Law (FWC)',
   'Florida law requires a diver-down flag displayed whenever snorkelers or divers are in the water. All boaters must stay at least 300 feet away in open water and 100 feet in channels. Failure to display the flag is a criminal violation.',
   '🏴‍☠️'),

  ('current_awareness', 'en', 'Current & Drift Awareness',
   'Ocean currents can silently carry you away from the boat. Always enter the water upstream of the vessel. Monitor your position relative to the hull at all times. If you feel yourself drifting, signal the captain immediately.',
   '🌊'),

  -- ── Sunset Cruise ────────────────────────────────────────────────────
  ('low_light', 'en', 'Low-Light Navigation Safety',
   'As sunset transitions to darkness, visibility drops rapidly. Stay seated and hold handrails when moving. The captain will activate navigation lights — never shine personal flashlights toward the helm as it destroys night vision.',
   '🌅')

ON CONFLICT (topic_key, language_code) DO UPDATE
  SET title = EXCLUDED.title,
      instructions = EXCLUDED.instructions,
      emoji = EXCLUDED.emoji,
      updated_at = NOW();
