-- Create the team_profiles table
CREATE TABLE IF NOT EXISTS public.team_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    bio TEXT NOT NULL,
    image_url TEXT,
    display_order INTEGER DEFAULT 0,
    github_url TEXT,
    linkedin_url TEXT,
    twitter_url TEXT,
    instagram_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.team_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view team profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'team_profiles' AND policyname = 'Public can view team profiles'
    ) THEN
        CREATE POLICY "Public can view team profiles" ON public.team_profiles
            FOR SELECT USING (true);
    END IF;
END
$$;

-- Policy: Only super_admin can insert/update/delete 
-- (This requires the profiles table and role check. For now, since the dashboard is protected at the app level, 
-- we will just allow authenticated users or service role to manage it, or implement role check)
-- Standard RLS for admins
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'team_profiles' AND policyname = 'Admins can manage team profiles'
    ) THEN
        CREATE POLICY "Admins can manage team profiles" ON public.team_profiles
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin')
                )
            );
    END IF;
END
$$;

-- Create the team_images storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('team_images', 'team_images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for team_images bucket
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public can view team images'
    ) THEN
        CREATE POLICY "Public can view team images" ON storage.objects
            FOR SELECT USING (bucket_id = 'team_images');
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Admins can manage team images'
    ) THEN
        CREATE POLICY "Admins can manage team images" ON storage.objects
            FOR ALL
            USING (
                bucket_id = 'team_images' AND
                EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin')
                )
            );
    END IF;
END
$$;
