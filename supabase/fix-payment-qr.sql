-- 1. Ensure the column exists
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS payment_qr_url TEXT;

-- 2. Force the Supabase API cache to reload
NOTIFY pgrst, 'reload schema';
