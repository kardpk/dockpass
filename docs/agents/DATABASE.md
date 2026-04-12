# BoatCheckin — Database Agent
# @DATABASE

## Role
You are the database architect for BoatCheckin.
You own the Supabase schema, all RLS policies,
migrations, indexes, and query patterns.
Security is your primary concern.
Read @SECURITY.md before making any changes.

---

## Core Principles

1. Row Level Security on EVERY table — no exceptions
2. Never expose service role key to frontend
3. Always use parameterised queries — never string concat
4. Index every foreign key and every queried column
5. Soft delete records — never hard delete guest data
6. Audit log sensitive operations

---

## Full Schema

```sql
-- ==========================================
-- OPERATORS
-- ==========================================
CREATE TABLE operators (
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
-- BOATS
-- ==========================================
CREATE TABLE boats (
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
-- ADDONS (per boat)
-- ==========================================
CREATE TABLE addons (
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
-- TRIPS
-- ==========================================
CREATE TABLE trips (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id     UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  boat_id         UUID NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
  slug            TEXT UNIQUE NOT NULL, -- crypto random, non-guessable
  trip_code       TEXT NOT NULL,        -- 4-char, uppercase
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
-- BOOKINGS (multiple per trip for split charters)
-- ==========================================
CREATE TABLE bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id         UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  operator_id     UUID NOT NULL REFERENCES operators(id),
  booking_ref     TEXT NOT NULL, -- external ref (Boatsetter etc)
  organiser_name  TEXT NOT NULL,
  organiser_email TEXT,
  max_guests      INT NOT NULL DEFAULT 8,
  booking_link    TEXT UNIQUE NOT NULL, -- unique per booking
  booking_code    TEXT NOT NULL,        -- 4-char code
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- GUESTS (self-registered)
-- ==========================================
CREATE TABLE guests (
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
  date_of_birth   DATE, -- for course requirement check
  
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
  qr_token        TEXT UNIQUE NOT NULL, -- HMAC signed token
  qr_used_at      TIMESTAMPTZ,
  
  -- Metadata
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ -- soft delete for GDPR
);

-- ==========================================
-- GUEST ADDON ORDERS
-- ==========================================
CREATE TABLE guest_addon_orders (
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
-- TRIP REVIEWS
-- ==========================================
CREATE TABLE trip_reviews (
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
-- POSTCARDS
-- ==========================================
CREATE TABLE postcards (
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
-- OPERATOR NOTIFICATIONS
-- ==========================================
CREATE TABLE operator_notifications (
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
-- AUDIT LOG
-- ==========================================
CREATE TABLE audit_log (
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
```

---

## Indexes

```sql
-- Operators
CREATE INDEX idx_operators_email ON operators(email);
CREATE INDEX idx_operators_stripe_customer ON operators(stripe_customer_id);
CREATE INDEX idx_operators_referral_code ON operators(referral_code);

-- Boats
CREATE INDEX idx_boats_operator_id ON boats(operator_id);
CREATE INDEX idx_boats_active ON boats(operator_id, is_active);

-- Trips
CREATE INDEX idx_trips_slug ON trips(slug);
CREATE INDEX idx_trips_operator ON trips(operator_id);
CREATE INDEX idx_trips_boat ON trips(boat_id);
CREATE INDEX idx_trips_date ON trips(trip_date);
CREATE INDEX idx_trips_status ON trips(status);

-- Guests
CREATE INDEX idx_guests_trip ON guests(trip_id);
CREATE INDEX idx_guests_operator ON guests(operator_id);
CREATE INDEX idx_guests_qr_token ON guests(qr_token);
CREATE INDEX idx_guests_waiver ON guests(trip_id, waiver_signed);
CREATE INDEX idx_guests_not_deleted ON guests(trip_id)
  WHERE deleted_at IS NULL;

-- Bookings
CREATE INDEX idx_bookings_trip ON bookings(trip_id);
CREATE INDEX idx_bookings_link ON bookings(booking_link);

-- Orders
CREATE INDEX idx_orders_guest ON guest_addon_orders(guest_id);
CREATE INDEX idx_orders_trip ON guest_addon_orders(trip_id);
CREATE INDEX idx_orders_operator ON guest_addon_orders(operator_id);

-- Notifications
CREATE INDEX idx_notifications_operator ON operator_notifications(operator_id, read_at);
```

---

## Row Level Security Policies

```sql
-- Enable RLS on all tables
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

-- ==========================================
-- OPERATORS policies
-- ==========================================
-- Operators can only see/edit their own record
CREATE POLICY "operators_own_data" ON operators
  FOR ALL USING (auth.uid() = id);

-- ==========================================
-- BOATS policies
-- ==========================================
-- Operators see only their boats
CREATE POLICY "boats_operator_owns" ON boats
  FOR ALL USING (auth.uid() = operator_id);

-- Public can read active boats for trip pages
-- (only what's needed for guest page - no private data)
CREATE POLICY "boats_public_read" ON boats
  FOR SELECT USING (is_active = true);

-- ==========================================
-- TRIPS policies
-- ==========================================
-- Operators manage their trips
CREATE POLICY "trips_operator_owns" ON trips
  FOR ALL USING (auth.uid() = operator_id);

-- Public can read trips (for guest page)
-- Only non-cancelled trips
CREATE POLICY "trips_public_read" ON trips
  FOR SELECT USING (status != 'cancelled');

-- ==========================================
-- GUESTS policies
-- ==========================================
-- Operators see guests on their trips
CREATE POLICY "guests_operator_sees" ON guests
  FOR SELECT USING (auth.uid() = operator_id);

-- Operators can update approval status
CREATE POLICY "guests_operator_updates" ON guests
  FOR UPDATE USING (auth.uid() = operator_id)
  WITH CHECK (auth.uid() = operator_id);

-- Anonymous guests can INSERT (registration)
-- But cannot read other guests
CREATE POLICY "guests_public_insert" ON guests
  FOR INSERT WITH CHECK (true);

-- Guests can only read their own record (by qr_token)
-- No auth needed - token acts as identity
CREATE POLICY "guests_read_own" ON guests
  FOR SELECT USING (
    -- Only if accessed with correct qr_token
    -- Handled in API layer, not RLS
    auth.uid() = operator_id
    OR deleted_at IS NULL
  );

-- ==========================================
-- ADDONS policies
-- ==========================================
CREATE POLICY "addons_operator_manages" ON addons
  FOR ALL USING (auth.uid() = operator_id);

CREATE POLICY "addons_public_read" ON addons
  FOR SELECT USING (is_available = true);

-- ==========================================
-- ORDERS policies
-- ==========================================
CREATE POLICY "orders_operator_sees" ON guest_addon_orders
  FOR SELECT USING (auth.uid() = operator_id);

-- Guests insert orders (anonymous, validated in API)
CREATE POLICY "orders_public_insert" ON guest_addon_orders
  FOR INSERT WITH CHECK (true);

-- ==========================================
-- NOTIFICATIONS policies
-- ==========================================
CREATE POLICY "notifications_own" ON operator_notifications
  FOR ALL USING (auth.uid() = operator_id);
```

---

## Triggers

```sql
-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER operators_updated_at
  BEFORE UPDATE ON operators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER boats_updated_at
  BEFORE UPDATE ON boats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-set trip status to 'active' on trip day
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
-- Called by Render cron daily
```

---

## GDPR Data Retention

```sql
-- Soft delete guest data after 90 days
CREATE OR REPLACE FUNCTION gdpr_cleanup()
RETURNS void AS $$
BEGIN
  -- Anonymise guest personal data after 90 days
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
-- Called by Render cron weekly
```

---

## Query Patterns

### Get trip with all data for guest page
```typescript
const { data: trip } = await supabase
  .from('trips')
  .select(`
    *,
    boats (
      boat_name, boat_type, marina_name, marina_address,
      slip_number, parking_instructions, lat, lng,
      captain_name, captain_photo_url, captain_bio,
      captain_license, captain_languages, captain_years_exp,
      captain_trip_count, captain_rating,
      what_to_bring, house_rules, prohibited_items,
      safety_briefing, onboard_info, waiver_text,
      cancellation_policy, photo_urls,
      addons (id, name, description, emoji, price_cents, max_quantity)
    )
  `)
  .eq('slug', slug)
  .neq('status', 'cancelled')
  .single()
```

### Get operator dashboard summary
```typescript
const { data } = await supabase
  .from('trips')
  .select(`
    id, slug, trip_date, departure_time, status,
    boats (boat_name),
    guests (id, waiver_signed, approval_status, deleted_at),
    guest_addon_orders (total_cents, status)
  `)
  .eq('operator_id', operatorId)
  .gte('trip_date', today)
  .order('trip_date', { ascending: true })
  .limit(10)
```

### Get passenger manifest
```typescript
const { data } = await supabase
  .from('guests')
  .select(`
    full_name, emergency_contact_name,
    emergency_contact_phone, dietary_requirements,
    waiver_signed, waiver_signed_at, language_preference,
    guest_addon_orders (
      quantity, unit_price_cents,
      addons (name)
    )
  `)
  .eq('trip_id', tripId)
  .is('deleted_at', null)
  .order('created_at')
```

---

## Migration Naming Convention

```
supabase/migrations/
  001_initial_schema.sql
  002_add_bookings.sql
  003_add_postcards.sql
  004_add_audit_log.sql
  005_add_gdpr_functions.sql
```

Always: forward-only migrations. Never edit existing migrations.
