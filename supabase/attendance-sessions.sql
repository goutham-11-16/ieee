-- Add attendance sessions support to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS attendance_sessions JSONB DEFAULT '[]'::jsonb;

-- Add session_name to attendance table to track which session a scan belongs to
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS session_name TEXT DEFAULT 'Default Scan';
