-- Add Certificate Jobs and Exceptions tables

-- Enable UUID extension if not already done
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Certificate Generation Jobs table
CREATE TABLE IF NOT EXISTS public.certificate_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    started_by UUID NOT NULL REFERENCES public.profiles(id),
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    total_eligible INTEGER DEFAULT 0,
    total_exceptions INTEGER DEFAULT 0,
    total_generated INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Note: We add a policy so admins can view jobs
ALTER TABLE public.certificate_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage certificate jobs"
ON public.certificate_jobs FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin', 'content_admin', 'event_admin')))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin', 'content_admin', 'event_admin')));


-- Certificate Exceptions table
CREATE TABLE IF NOT EXISTS public.certificate_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.certificate_jobs(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
    participant_name TEXT NOT NULL,
    reason TEXT NOT NULL, -- e.g., 'Paid but Absent', 'Attended but Unpaid'
    status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'resolved_generated', 'resolved_rejected')),
    resolved_by UUID REFERENCES public.profiles(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Note: We add a policy so admins can view exceptions
ALTER TABLE public.certificate_exceptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage certificate exceptions"
ON public.certificate_exceptions FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin', 'content_admin', 'event_admin')))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin', 'content_admin', 'event_admin')));
