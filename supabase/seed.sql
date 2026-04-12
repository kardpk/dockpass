-- ==========================================
-- BoatCheckin — Seed Data (local testing)
-- Run: npx supabase db reset (applies migration + seed)
-- ==========================================

-- Demo operator: Conrad Rivera
INSERT INTO operators (id, email, full_name, company_name, subscription_tier, subscription_status, max_boats, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'demo@boatcheckin.com',
  'Conrad Rivera',
  'Conrad Charter Co.',
  'fleet',
  'active',
  10,
  true
);

-- Demo boat: Conrad's Yacht Miami
INSERT INTO boats (
  operator_id, boat_name, boat_type, charter_type,
  max_capacity, marina_name, marina_address, slip_number,
  parking_instructions, lat, lng,
  captain_name, captain_bio, captain_license,
  captain_languages, what_to_bring, house_rules,
  waiver_text, cancellation_policy
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Conrad''s Yacht Miami',
  'yacht',
  'captained',
  8,
  'Miami Beach Marina',
  '300 Alton Rd, Miami Beach, FL 33139',
  '14A',
  'Free parking in Lot B off Alton Rd. Enter from 3rd St. Look for green P signs.',
  25.7786,
  -80.1392,
  'Captain Conrad',
  'USCG licensed captain with 7 years experience on Biscayne Bay. 124 trips, 4.9 star rating.',
  'USCG-12345-FL',
  ARRAY['en','es'],
  'Sunscreen, towel, valid ID, light jacket for evening trips, non-marking shoes',
  'No red wine on deck. Remove shoes before boarding. No smoking below deck. Children must wear life jackets. Maximum 8 passengers. No glass bottles.',
  'CHARTER AGREEMENT AND LIABILITY WAIVER

By signing this agreement, I acknowledge and agree that I am voluntarily participating in a boat charter activity. I understand that boating activities involve inherent risks including but not limited to capsizing, falling overboard, collision, and adverse weather conditions. I agree to follow all captain instructions and safety guidelines. I waive any claims against the operator for injuries arising from normal charter operations.',
  'Free cancellation until 48 hours before departure. 50% refund 24-48 hours before. No refund within 24 hours of departure.'
);
