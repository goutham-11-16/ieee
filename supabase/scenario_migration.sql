-- Migration for End-to-End Scenario Support

-- 1. Create Event Status Enum
DO $$ BEGIN
    CREATE TYPE event_status AS ENUM ('draft', 'pending_approval', 'published', 'rejected', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add Columns to Events
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS status event_status DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS payment_deadline TIMESTAMPTZ;

-- 3. Migrate Existing Data
-- If is_published is true, set status to 'published', else 'draft'
UPDATE public.events 
SET status = CASE 
    WHEN is_published = TRUE THEN 'published'::event_status 
    ELSE 'draft'::event_status 
END;

-- 4. Update Policies to use Status
-- (Optional: You can keep is_published for backward compatibility or switch strictly to status)
-- For now, we sync them. 

-- 5. Add Function to Request Template Lock
-- We will handle this in the approval_requests table logic (already created)
