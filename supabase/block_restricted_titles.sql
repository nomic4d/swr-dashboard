-- Block restricted titles at database level
-- Add new keywords to both lists below as needed
-- Run this in Supabase SQL editor

-- 1. Delete existing restricted entries
DELETE FROM events WHERE LOWER(TRIM(title)) IN ('available', 'meeting', 'traveling', 'vew');

-- 2. Add check constraint to prevent future inserts/updates
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_title_not_restricted;
ALTER TABLE events ADD CONSTRAINT events_title_not_restricted
  CHECK (LOWER(TRIM(title)) NOT IN ('available', 'meeting', 'traveling', 'vew'));

-- 3. (Optional) Trigger to clean up whitespace + lower before check
CREATE OR REPLACE FUNCTION block_restricted_titles()
RETURNS trigger AS $$
BEGIN
  IF LOWER(TRIM(NEW.title)) IN ('available', 'meeting', 'traveling', 'vew') THEN
    RAISE EXCEPTION 'Title "%" is restricted and cannot be used', NEW.title;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_block_restricted_titles ON events;
CREATE TRIGGER trg_block_restricted_titles
  BEFORE INSERT OR UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION block_restricted_titles();
