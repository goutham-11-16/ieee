-- Migration for Admin Approval System

-- 1. Update User Roles
-- Note: You cannot easily remove enum values in Postgres, but you can add them.
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'event_admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'finance_admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'content_admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'moderator';

-- 2. Create Approval Enums
DO $$ BEGIN
    CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE approval_action_type AS ENUM (
        'PUBLISH_EVENT',
        'LOCK_TEMPLATE',
        'GENERATE_CERTIFICATES',
        'FINALIZE_ATTENDANCE',
        'EXTEND_DEADLINE',
        'DELETE_DATA'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Create Approval Requests Table
CREATE TABLE IF NOT EXISTS public.approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID REFERENCES public.profiles(id) NOT NULL,
    approver_id UUID REFERENCES public.profiles(id),
    action_type approval_action_type NOT NULL,
    entity_table TEXT NOT NULL,
    entity_id UUID NOT NULL,
    new_data JSONB,
    status approval_status DEFAULT 'pending',
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

-- 5. Policies for Approval Requests
-- Requester can view their own requests
CREATE POLICY "Users can view own requests" ON public.approval_requests
    FOR SELECT USING (auth.uid() = requester_id);

-- Admins and Super Admins can view all requests
CREATE POLICY "Admins can view all requests" ON public.approval_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Admins and Super Admins can update requests (Approve/Reject)
CREATE POLICY "Admins can update requests" ON public.approval_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Authenticated users (Admins types) can insert requests
CREATE POLICY "Authenticated users can create requests" ON public.approval_requests
    FOR INSERT WITH CHECK (auth.uid() = requester_id);

-- 6. Update Events Table for Advanced Registration
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'General',
ADD COLUMN IF NOT EXISTS registration_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS registration_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS fees DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS coordinators JSONB DEFAULT '[]'::jsonb;

-- 7. Update Registration Status Enum
-- Postgres doesn't support 'ADD VALUE IF NOT EXISTS' natively for enums in all versions/contexts easily without a block.
DO $$ BEGIN
    ALTER TYPE registration_status ADD VALUE 'expired';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 8. Update Payments Table
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS receipt_url TEXT;

-- 9. Update Certificate Templates Table
ALTER TABLE public.certificate_templates
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;
