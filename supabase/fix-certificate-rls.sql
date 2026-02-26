-- Fix RLS Policies for certificate_templates and certificates

-- Enable RLS
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Policies for certificate_templates
-- Admins and Content Admins can manage templates
CREATE POLICY "Admins can manage certificate templates"
ON public.certificate_templates FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('super_admin', 'admin', 'content_admin', 'event_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('super_admin', 'admin', 'content_admin', 'event_admin')
  )
);

CREATE POLICY "Public can view locked certificate templates"
ON public.certificate_templates FOR SELECT
USING (is_locked = true);

-- Policies for certificates
-- Admins can manage certificates
CREATE POLICY "Admins can manage certificates"
ON public.certificates FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('super_admin', 'admin', 'content_admin', 'event_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('super_admin', 'admin', 'content_admin', 'event_admin')
  )
);

-- Users can view their own certificates (based on registration)
CREATE POLICY "Users can view their own certificates"
ON public.certificates FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.registrations
    WHERE registrations.id = certificates.registration_id
    AND registrations.user_id = auth.uid()
  )
);

-- Public can view certificates by unique code for verification
CREATE POLICY "Public can view certificates by unique code"
ON public.certificates FOR SELECT
USING (true);
