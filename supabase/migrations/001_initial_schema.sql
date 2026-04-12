-- ==========================================
-- BoatCheckin — Initial Schema Migration
-- 001_initial_schema.sql
-- 
-- 11 tables in dependency order
-- All indexes, RLS policies, triggers
-- Guests RLS: AUDIT.md CRITICAL 3 fix applied
-- ==========================================

-- ==========================================
-- 1. OPERATORS
-- ==========================================
CREATE TABLE IF NOT EXISTS operators (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE NOT NULL,
  full_name       TEXT NOT NULL,
  company_name    TEXT,
  phone           TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'solo'
                  CHECK (subscription_tier IN ('solo','captain','fleet','marina')),
  subscription_status TEXT NOT NULL DEFAULT 'trial'
                  CHECK (subscription_status IN ('trial','active','paused','cancelled')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  trial_ends_at   TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  max_boats       INT NOT NULL DEFAULT 1,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  referral_code   TEXT UNIQUE DEFAULT UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8)),
  referred_by     UUID REFERENCES operators(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 2. BOATS
-- ==========================================
CREATE TABLE IF NOT EXISTS boats (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id     UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  boat_name       TEXT NOT NULL,
  boat_type       TEXT NOT NULL
                  CHECK (boat_type IN ('yacht','catamaran','motorboat',
                         'sailboat','pontoon','fishing','speedboat','other')),
  charter_type    TEXT NOT NULL DEFAULT 'captained'
                  CHECK (charter_type IN ('captained','bareboat','both')),
  year_built      INT CHECK (year_built >= 1900 AND year_built <= 2030),
  length_ft       NUMERIC(5,1),
  max_capacity    INT NOT NULL CHECK (max_capacity >= 1 AND max_capacity <= 500),
  weight_limit_lbs INT,
  marina_name     TEXT NOT NULL,
  marina_address  TEXT NOT NULL,
  slip_number     TEXT,
  parking_instructions TEXT,
  lat             NUMERIC(10,7),
  lng             NUMERIC(10,7),
  captain_name    TEXT,
  captain_photo_url TEXT,
  captain_bio     TEXT,
  captain_license TEXT,
  captain_languages TEXT[] DEFAULT '{"en"}',
  captain_years_exp INT,
  captain_trip_count INT DEFAULT 0,
  captain_rating  NUMERIC(2,1) DEFAULT 5.0,
  what_to_bring   TEXT,
  house_rules     TEXT,
  prohibited_items TEXT,
  safety_briefing TEXT,
  onboard_info    JSONB DEFAULT '{}',
  waiver_text     TEXT NOT NULL,
  cancellation_policy TEXT,
  boatsetter_url  TEXT,
  getmyboat_url   TEXT,
  photo_urls      TEXT[] DEFAULT '{}',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 3. ADDONS (per boat)
-- ==========================================
CREATE TABLE IF NOT EXISTS addons (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id         UUID NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
  operator_id     UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  emoji           TEXT DEFAULT '🎁',
  price_cents     INT NOT NULL CHECK (price_cents >= 0),
  currency        TEXT NOT NULL DEFAULT 'usd',
  max_quantity    INT DEFAULT 10,
  is_available    BOOLEAN NOT NULL DEFAULT true,
  sort_order      INT DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 4. TRIPS
-- ==========================================
CREATE TABLE IF NOT EXISTS trips (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id     UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  boat_id         UUID NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
  slug            TEXT UNIQUE NOT NULL,
  trip_code       TEXT NOT NULL,
  trip_date       DATE NOT NULL,
  departure_time  TIME NOT NULL,
  duration_hours  NUMERIC(4,1) NOT NULL CHECK (duration_hours > 0),
  max_guests      INT NOT NULL CHECK (max_guests >= 1),
  charter_type    TEXT NOT NULL DEFAULT 'captained',
  route_description TEXT,
  route_stops     JSONB DEFAULT '[]',
  special_notes   TEXT,
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  status          TEXT NOT NULL DEFAULT 'upcoming'
                  CHECK (status IN ('upcoming','active','completed','cancelled')),
  weather_checked_at TIMESTAMPTZ,
  weather_data    JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 5. BOOKINGS (multiple per trip for split charters)
-- ==========================================
CREATE TABLE IF NOT EXISTS bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id         UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  operator_id     UUID NOT NULL REFERENCES operators(id),
  booking_ref     TEXT NOT NULL,
  organiser_name  TEXT NOT NULL,
  organiser_email TEXT,
  max_guests      INT NOT NULL DEFAULT 8,
  booking_link    TEXT UNIQUE NOT NULL,
  booking_code    TEXT NOT NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 6. GUESTS (self-registered)
-- ==========================================
CREATE TABLE IF NOT EXISTS guests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id         UUID NOT NULL REFERENCES trips(id) ON DELETE RESTRICT,
  booking_id      UUID REFERENCES bookings(id),
  operator_id     UUID NOT NULL REFERENCES operators(id),

  -- Personal details
  full_name       TEXT NOT NULL,
  emergency_contact_name TEXT NOT NULL,
  emergency_contact_phone TEXT NOT NULL,
  dietary_requirements TEXT,
  language_preference TEXT DEFAULT 'en',
  date_of_birth   DATE,
  
  -- Waiver
  waiver_signed   BOOLEAN NOT NULL DEFAULT false,
  waiver_signed_at TIMESTAMPTZ,
  waiver_signature_text TEXT,
  waiver_ip_address TEXT,
  waiver_user_agent TEXT,
  
  -- Status
  approval_status TEXT DEFAULT 'auto_approved'
                  CHECK (approval_status IN ('pending','approved','declined','auto_approved')),
  approved_at     TIMESTAMPTZ,
  checked_in_at   TIMESTAMPTZ,
  
  -- QR
  qr_token        TEXT UNIQUE NOT NULL,
  qr_used_at      TIMESTAMPTZ,
  
  -- Metadata
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

-- ==========================================
-- 7. GUEST ADDON ORDERS
-- ==========================================
CREATE TABLE IF NOT EXISTS guest_addon_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id        UUID NOT NULL REFERENCES guests(id),
  trip_id         UUID NOT NULL REFERENCES trips(id),
  addon_id        UUID NOT NULL REFERENCES addons(id),
  operator_id     UUID NOT NULL REFERENCES operators(id),
  quantity        INT NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  unit_price_cents INT NOT NULL,
  total_cents     INT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','confirmed','cancelled','refunded')),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 8. TRIP REVIEWS
-- ==========================================
CREATE TABLE IF NOT EXISTS trip_reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id         UUID NOT NULL REFERENCES trips(id),
  guest_id        UUID REFERENCES guests(id),
  operator_id     UUID NOT NULL REFERENCES operators(id),
  rating          INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_text   TEXT,
  is_public       BOOLEAN NOT NULL DEFAULT false,
  platform        TEXT CHECK (platform IN ('google','boatsetter','getmyboat','internal')),
  ai_draft_response TEXT,
  response_posted_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 9. POSTCARDS
-- ==========================================
CREATE TABLE IF NOT EXISTS postcards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id        UUID NOT NULL REFERENCES guests(id),
  trip_id         UUID NOT NULL REFERENCES trips(id),
  style           TEXT DEFAULT 'classic'
                  CHECK (style IN ('classic','minimal','sunset')),
  image_url       TEXT,
  downloaded_at   TIMESTAMPTZ,
  shared_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 10. OPERATOR NOTIFICATIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS operator_notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id     UUID NOT NULL REFERENCES operators(id),
  type            TEXT NOT NULL,
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  data            JSONB DEFAULT '{}',
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 11. AUDIT LOG
-- ==========================================
CREATE TABLE IF NOT EXISTS audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id     UUID REFERENCES operators(id),
  action          TEXT NOT NULL,
  entity_type     TEXT NOT NULL,
  entity_id       TEXT,
  changes         JSONB,
  ip_address      TEXT,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ==========================================
-- INDEXES
-- ==========================================

-- Operators
CREATE INDEX IF NOT EXISTS idx_operators_email ON operators(email);
CREATE INDEX IF NOT EXISTS idx_operators_stripe_customer ON operators(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_operators_referral_code ON operators(referral_code);

-- Boats
CREATE INDEX IF NOT EXISTS idx_boats_operator_id ON boats(operator_id);
CREATE INDEX IF NOT EXISTS idx_boats_active ON boats(operator_id, is_active);

-- Trips
CREATE INDEX IF NOT EXISTS idx_trips_slug ON trips(slug);
CREATE INDEX IF NOT EXISTS idx_trips_operator ON trips(operator_id);
CREATE INDEX IF NOT EXISTS idx_trips_boat ON trips(boat_id);
CREATE INDEX IF NOT EXISTS idx_trips_date ON trips(trip_date);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);

-- Guests
CREATE INDEX IF NOT EXISTS idx_guests_trip ON guests(trip_id);
CREATE INDEX IF NOT EXISTS idx_guests_operator ON guests(operator_id);
CREATE INDEX IF NOT EXISTS idx_guests_qr_token ON guests(qr_token);
CREATE INDEX IF NOT EXISTS idx_guests_waiver ON guests(trip_id, waiver_signed);
CREATE INDEX IF NOT EXISTS idx_guests_not_deleted ON guests(trip_id)
  WHERE deleted_at IS NULL;

-- Bookings
CREATE INDEX IF NOT EXISTS idx_bookings_trip ON bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_link ON bookings(booking_link);

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_guest ON guest_addon_orders(guest_id);
CREATE INDEX IF NOT EXISTS idx_orders_trip ON guest_addon_orders(trip_id);
CREATE INDEX IF NOT EXISTS idx_orders_operator ON guest_addon_orders(operator_id);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_operator ON operator_notifications(operator_id, read_at);

-- Audit log
CREATE INDEX IF NOT EXISTS idx_audit_log_operator ON audit_log(operator_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);


-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE boats ENABLE ROW LEVEL SECURITY;
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_addon_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE postcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ── OPERATORS ──
DROP POLICY IF EXISTS "operators_own_data" ON operators;
CREATE POLICY "operators_own_data" ON operators
  FOR ALL USING (auth.uid() = id);

-- ── BOATS ──
DROP POLICY IF EXISTS "boats_operator_owns" ON boats;
CREATE POLICY "boats_operator_owns" ON boats
  FOR ALL USING (auth.uid() = operator_id);

DROP POLICY IF EXISTS "boats_public_read" ON boats;
CREATE POLICY "boats_public_read" ON boats
  FOR SELECT USING (is_active = true);

-- ── ADDONS ──
DROP POLICY IF EXISTS "addons_operator_manages" ON addons;
CREATE POLICY "addons_operator_manages" ON addons
  FOR ALL USING (auth.uid() = operator_id);

DROP POLICY IF EXISTS "addons_public_read" ON addons;
CREATE POLICY "addons_public_read" ON addons
  FOR SELECT USING (is_available = true);

-- ── TRIPS ──
DROP POLICY IF EXISTS "trips_operator_owns" ON trips;
CREATE POLICY "trips_operator_owns" ON trips
  FOR ALL USING (auth.uid() = operator_id);

DROP POLICY IF EXISTS "trips_public_read" ON trips;
CREATE POLICY "trips_public_read" ON trips
  FOR SELECT USING (status != 'cancelled');

-- ── BOOKINGS ──
DROP POLICY IF EXISTS "bookings_operator_owns" ON bookings;
CREATE POLICY "bookings_operator_owns" ON bookings
  FOR ALL USING (auth.uid() = operator_id);

-- ══════════════════════════════════════════
-- GUESTS — AUDIT.md CRITICAL 3 FIX
-- The original DATABASE.md had a dangerous
-- "guests_read_own" policy that leaked all
-- guest data to anonymous users. These
-- corrected policies replace it:
-- ══════════════════════════════════════════

-- Operators see their guests
DROP POLICY IF EXISTS "guests_operator_reads" ON guests;
CREATE POLICY "guests_operator_reads" ON guests
  FOR SELECT
  USING (auth.uid() = operator_id);

-- Anonymous can INSERT (registration) but NOT SELECT
DROP POLICY IF EXISTS "guests_anonymous_insert" ON guests;
CREATE POLICY "guests_anonymous_insert" ON guests
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_id
      AND trips.status != 'cancelled'
    )
  );

-- Operators can UPDATE approval status only
DROP POLICY IF EXISTS "guests_operator_approves" ON guests;
CREATE POLICY "guests_operator_approves" ON guests
  FOR UPDATE
  USING (auth.uid() = operator_id)
  WITH CHECK (auth.uid() = operator_id);

-- Nobody can DELETE guest records (soft-delete only)
-- Deletion via GDPR function uses service role

-- ── GUEST ADDON ORDERS ──
DROP POLICY IF EXISTS "orders_operator_sees" ON guest_addon_orders;
CREATE POLICY "orders_operator_sees" ON guest_addon_orders
  FOR SELECT USING (auth.uid() = operator_id);

DROP POLICY IF EXISTS "orders_public_insert" ON guest_addon_orders;
CREATE POLICY "orders_public_insert" ON guest_addon_orders
  FOR INSERT WITH CHECK (true);

-- ── TRIP REVIEWS ──
DROP POLICY IF EXISTS "reviews_operator_owns" ON trip_reviews;
CREATE POLICY "reviews_operator_owns" ON trip_reviews
  FOR ALL USING (auth.uid() = operator_id);

DROP POLICY IF EXISTS "reviews_public_read" ON trip_reviews;
CREATE POLICY "reviews_public_read" ON trip_reviews
  FOR SELECT USING (is_public = true);

-- ── POSTCARDS ──
DROP POLICY IF EXISTS "postcards_public_insert" ON postcards;
CREATE POLICY "postcards_public_insert" ON postcards
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "postcards_operator_reads" ON postcards;
CREATE POLICY "postcards_operator_reads" ON postcards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM guests
      WHERE guests.id = guest_id
      AND guests.operator_id = auth.uid()
    )
  );

-- ── NOTIFICATIONS ──
DROP POLICY IF EXISTS "notifications_own" ON operator_notifications;
CREATE POLICY "notifications_own" ON operator_notifications
  FOR ALL USING (auth.uid() = operator_id);

-- ── AUDIT LOG ──
-- Only service role inserts (no RLS read for operators)
DROP POLICY IF EXISTS "audit_log_operator_reads" ON audit_log;
CREATE POLICY "audit_log_operator_reads" ON audit_log
  FOR SELECT USING (auth.uid() = operator_id);


-- ==========================================
-- TRIGGERS
-- ==========================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS operators_updated_at ON operators;
CREATE TRIGGER operators_updated_at
  BEFORE UPDATE ON operators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS boats_updated_at ON boats;
CREATE TRIGGER boats_updated_at
  BEFORE UPDATE ON boats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trips_updated_at ON trips;
CREATE TRIGGER trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ==========================================
-- FUNCTIONS
-- ==========================================

-- Auto-activate trips on their date, complete past trips
CREATE OR REPLACE FUNCTION auto_activate_trips()
RETURNS void AS $$
BEGIN
  UPDATE trips
  SET status = 'active'
  WHERE status = 'upcoming'
    AND trip_date = CURRENT_DATE;
    
  UPDATE trips
  SET status = 'completed'
  WHERE status = 'active'
    AND trip_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- GDPR: Anonymise guest data 90 days after completed trips
CREATE OR REPLACE FUNCTION gdpr_cleanup()
RETURNS void AS $$
BEGIN
  UPDATE guests
  SET
    full_name = 'DELETED',
    emergency_contact_name = 'DELETED',
    emergency_contact_phone = 'DELETED',
    dietary_requirements = NULL,
    date_of_birth = NULL,
    waiver_signature_text = 'DELETED',
    waiver_ip_address = NULL,
    waiver_user_agent = NULL,
    deleted_at = NOW()
  WHERE
    deleted_at IS NULL
    AND created_at < NOW() - INTERVAL '90 days'
    AND trip_id IN (
      SELECT id FROM trips WHERE status = 'completed'
    );
END;
$$ LANGUAGE plpgsql;
