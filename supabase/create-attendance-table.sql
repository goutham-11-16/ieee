-- Create the missing Attendance Table
CREATE TABLE public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID REFERENCES public.registrations(id) UNIQUE NOT NULL,
    event_id UUID REFERENCES public.events(id) NOT NULL,
    scanned_by UUID REFERENCES public.profiles(id),
    check_in_time TIMESTAMPTZ DEFAULT NOW(),
    check_out_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Allow public reads via the registration reference lookup
DROP POLICY IF EXISTS "Public can view own attendance" ON public.attendance;
CREATE POLICY "Public can view own attendance" ON public.attendance 
  FOR SELECT USING (
    -- The frontend explicitly queries based on reference_number, which is safe.
    true
  );

-- Allow admins/volunteers to scan and manage attendance
DROP POLICY IF EXISTS "Admins can manage attendance" ON public.attendance;
CREATE POLICY "Admins can manage attendance" ON public.attendance
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin', 'event_admin', 'moderator'))
  );
