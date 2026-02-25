-- Migration to add Event End Date and Guest Registration Number

-- 1. Add end_date to events (defaulting to date + 2 hours for existing events)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;

-- Update existing events to have an end_date 2 hours after their start date
UPDATE public.events 
SET end_date = date + interval '2 hours' 
WHERE end_date IS NULL;

-- 2. Add guest_reg_no to registrations
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS guest_reg_no TEXT;

-- (Optional) If we want to ensure guest_reg_no is unique per event, 
-- we could add a constraint, but it might be better to handle uniqueness in application logic or leave it as a reference.
-- For now, just adding the column.
