-- Clean Home Tracker Schema
-- Run this in your Supabase SQL editor to set up the database

-- Households table: shared household with a join code
CREATE TABLE IF NOT EXISTS clean_home_households (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rooms table
CREATE TABLE IF NOT EXISTS clean_home_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES clean_home_households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'living-room',
  remarks TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tools table: one row per tool per room
CREATE TABLE IF NOT EXISTS clean_home_tools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES clean_home_rooms(id) ON DELETE CASCADE,
  tool_type TEXT NOT NULL CHECK (tool_type IN ('duster', 'broom', 'mop', 'vacuum', 'bot')),
  -- Human-readable display name: "Duster", "Broom", "Mop", "Vacuum", "Bot"
  tool_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_completed TIMESTAMPTZ,
  frequency TEXT NOT NULL DEFAULT 'W' CHECK (frequency IN ('D', 'W', '2W', '2+W')),
  instructions TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, tool_type)
);

-- Migration: add tool_name to existing tables (safe to run on a live DB)
-- The UPDATE backfills any rows that predate this column.
ALTER TABLE clean_home_tools
  ADD COLUMN IF NOT EXISTS tool_name TEXT;

UPDATE clean_home_tools
SET tool_name = CASE tool_type
  WHEN 'duster'  THEN 'Duster'
  WHEN 'broom'   THEN 'Broom'
  WHEN 'mop'     THEN 'Mop'
  WHEN 'vacuum'  THEN 'Vacuum'
  WHEN 'bot'     THEN 'Bot'
END
WHERE tool_name IS NULL;

-- Make the column NOT NULL once backfill is complete
ALTER TABLE clean_home_tools
  ALTER COLUMN tool_name SET NOT NULL;

-- Supply tags table
CREATE TABLE IF NOT EXISTS clean_home_supply_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES clean_home_households(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_de TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction table: supplies linked to rooms (via tools for context)
CREATE TABLE IF NOT EXISTS clean_home_room_supplies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES clean_home_rooms(id) ON DELETE CASCADE,
  supply_tag_id UUID NOT NULL REFERENCES clean_home_supply_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, supply_tag_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_rooms_household ON clean_home_rooms(household_id);
CREATE INDEX IF NOT EXISTS idx_tools_room ON clean_home_tools(room_id);
CREATE INDEX IF NOT EXISTS idx_supply_tags_household ON clean_home_supply_tags(household_id);
CREATE INDEX IF NOT EXISTS idx_room_supplies_room ON clean_home_room_supplies(room_id);
CREATE INDEX IF NOT EXISTS idx_room_supplies_tag ON clean_home_room_supplies(supply_tag_id);

-- Enable Row Level Security (optional – configure policies for your auth setup)
-- ALTER TABLE clean_home_households ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE clean_home_rooms ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE clean_home_tools ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE clean_home_supply_tags ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE clean_home_room_supplies ENABLE ROW LEVEL SECURITY;
