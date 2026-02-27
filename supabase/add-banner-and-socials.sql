-- Add new columns for the requested features

-- 1. Banner image URL
ALTER TABLE events ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- 2. Social Media Links
ALTER TABLE events ADD COLUMN IF NOT EXISTS whatsapp_link TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS instagram_link TEXT;

-- Update the RLS if necessary, though public users can already SELECT these as long as they are on the events table.
