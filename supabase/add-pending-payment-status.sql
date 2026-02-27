-- Add pending_payment to registration_status enum
DO $$ BEGIN
    ALTER TYPE registration_status ADD VALUE 'pending_payment';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
