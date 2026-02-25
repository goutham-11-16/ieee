-- Create event_assets bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('event_assets', 'event_assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'event_assets' );

-- Allow authenticated users to insert
CREATE POLICY "Auth Insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'event_assets' );

-- Allow authenticated users to update
CREATE POLICY "Auth Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'event_assets' );
