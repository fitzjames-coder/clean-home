-- Clean Home Tracker Schema
-- Run this in your Supabase SQL editor to set up the database
--
-- Scoping model: every row in clean_home_rooms and clean_home_supply_tags
-- carries a plain `room_code` text column (e.g. "FITZ1"). The app stores
-- this code in localStorage and filters every query with .eq('room_code', code).
-- No households table, no UUIDs to look up, no foreign keys to rooms.

-- Rooms table
CREATE TABLE IF NOT EXISTS clean_home_rooms (
  id         UUID  DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code  TEXT  NOT NULL DEFAULT '',
  name       TEXT  NOT NULL,
  icon       TEXT  NOT NULL DEFAULT 'living-room',
  remarks    TEXT  DEFAULT '',
  sort_order INTEGER DEFAULT 0,          -- manually-added column; kept here so rebuilds match live DB
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tools table: one row per tool per room
CREATE TABLE IF NOT EXISTS clean_home_tools (
  id             UUID  DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id        UUID  NOT NULL REFERENCES clean_home_rooms(id) ON DELETE CASCADE,
  tool_type      TEXT  NOT NULL CHECK (tool_type IN ('duster', 'broom', 'mop', 'vacuum', 'bot')),
  -- Human-readable display name: "Duster", "Broom", "Mop", "Vacuum", "Bot"
  tool_name      TEXT  NOT NULL,
  is_active      BOOLEAN DEFAULT TRUE,
  last_completed TIMESTAMPTZ,
  frequency      TEXT  NOT NULL DEFAULT 'W' CHECK (frequency IN ('D', 'W', '2W', '2+W')),
  instructions   TEXT  DEFAULT '',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, tool_type)
);

-- Supply tags table
CREATE TABLE IF NOT EXISTS clean_home_supply_tags (
  id         UUID  DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code  TEXT  NOT NULL DEFAULT '',
  name_en    TEXT  NOT NULL,
  name_de    TEXT,
  photo_url  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction table: supplies linked to rooms
CREATE TABLE IF NOT EXISTS clean_home_room_supplies (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id       UUID NOT NULL REFERENCES clean_home_rooms(id) ON DELETE CASCADE,
  supply_tag_id UUID NOT NULL REFERENCES clean_home_supply_tags(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, supply_tag_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_rooms_code         ON clean_home_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_tools_room         ON clean_home_tools(room_id);
CREATE INDEX IF NOT EXISTS idx_supply_tags_code   ON clean_home_supply_tags(room_code);
CREATE INDEX IF NOT EXISTS idx_room_supplies_room ON clean_home_room_supplies(room_id);
CREATE INDEX IF NOT EXISTS idx_room_supplies_tag  ON clean_home_room_supplies(supply_tag_id);

-- Migration helpers (safe to run on a live DB that used the old household_id schema)
-- ALTER TABLE clean_home_rooms ADD COLUMN IF NOT EXISTS room_code TEXT NOT NULL DEFAULT '';
-- ALTER TABLE clean_home_rooms DROP COLUMN IF EXISTS household_id;
-- ALTER TABLE clean_home_supply_tags ADD COLUMN IF NOT EXISTS room_code TEXT NOT NULL DEFAULT '';
-- ALTER TABLE clean_home_supply_tags DROP COLUMN IF EXISTS household_id;
-- DROP TABLE IF EXISTS clean_home_households CASCADE;
-- NOTIFY pgrst, 'reload schema';

-- Enable Row Level Security (optional – configure policies for your auth setup)
-- ALTER TABLE clean_home_rooms ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE clean_home_tools ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE clean_home_supply_tags ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE clean_home_room_supplies ENABLE ROW LEVEL SECURITY;
