-- Add UPDATE_DATA to approval_action_type enum (this fixes the Event Admin edit failure)
ALTER TYPE approval_action_type ADD VALUE IF NOT EXISTS 'UPDATE_DATA';

-- Add attendance sessions support to events (this fixes the Create Event error)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS attendance_sessions JSONB DEFAULT '[]'::jsonb;

-- Add session_name to attendance table to track which session a scan belongs to
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS session_name TEXT DEFAULT 'Default Scan';

-- Force Supabase's API cache (PostgREST) to reload so it sees the new columns immediately
NOTIFY pgrst, 'reload schema';

-- Add Payment QR Code URL to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS payment_qr_url TEXT;

-- Create storage bucket for event assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('event_assets', 'event_assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to event assets
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'event_assets' );

-- Allow admins to insert/update event assets
CREATE POLICY "Admin Upload Access" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (
    bucket_id = 'event_assets' AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'event_admin'))
);

