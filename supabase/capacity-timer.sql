-- Add max capacity to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS max_capacity INTEGER DEFAULT NULL;

-- Add expiration timer to registrations
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT NULL;

-- Create an index for quick seat calculation
CREATE INDEX IF NOT EXISTS idx_registrations_expires_at ON public.registrations(expires_at);
