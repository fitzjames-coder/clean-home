-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Add Appliances tables
-- Run this in Supabase SQL Editor BEFORE testing the Appliances feature.
-- Safe to run on a live DB — uses IF NOT EXISTS throughout.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Appliances table
CREATE TABLE IF NOT EXISTS clean_home_appliances (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code      TEXT        NOT NULL,
  name           TEXT        NOT NULL,
  icon           TEXT        NOT NULL,
  frequency      TEXT        NOT NULL DEFAULT 'M'
                             CHECK (frequency IN ('W', '2W', 'M', '3M', '6M', 'Y')),
  instructions   TEXT,
  last_completed TIMESTAMPTZ,
  sort_order     INTEGER     DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Junction table: supply tags linked to appliances
CREATE TABLE IF NOT EXISTS clean_home_appliance_supplies (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  appliance_id  UUID        NOT NULL REFERENCES clean_home_appliances(id) ON DELETE CASCADE,
  supply_tag_id UUID        NOT NULL REFERENCES clean_home_supply_tags(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(appliance_id, supply_tag_id)
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_appliances_code        ON clean_home_appliances(room_code);
CREATE INDEX IF NOT EXISTS idx_appliance_supplies_app ON clean_home_appliance_supplies(appliance_id);
CREATE INDEX IF NOT EXISTS idx_appliance_supplies_tag ON clean_home_appliance_supplies(supply_tag_id);

-- 4. Reload PostgREST schema cache (run this after the above)
NOTIFY pgrst, 'reload schema';
