-- MASTER SETUP SCRIPT
-- Runs all schema definitions and migrations in order.
-- Run this in the Supabase SQL Editor to set up the entire project.

-- ==========================================
-- 1. CORE SCHEMA (schema.sql)
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums (using DO blocks to prevent errors if they exist)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'participant');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE registration_status AS ENUM ('pending_approval', 'approved', 'rejected', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('unpaid', 'pending_verification', 'verified', 'rejected', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('registered', 'attended', 'absent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'participant',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Handle New User Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'participant')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Events Table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  location TEXT,
  banner_url TEXT,
  max_capacity INTEGER,
  requires_approval BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Registrations Table
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  event_id UUID REFERENCES public.events(id) NOT NULL,
  status registration_status DEFAULT 'approved',
  ticket_qr_uuid UUID DEFAULT uuid_generate_v4() NOT NULL,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  UNIQUE(user_id, event_id)
);

-- Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID REFERENCES public.registrations(id) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  transaction_reference TEXT,
  proof_url TEXT,
  status payment_status DEFAULT 'pending_verification',
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Certificate Templates
CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id),
  name TEXT NOT NULL,
  background_url TEXT,
  layout_config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Certificates Generated
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID REFERENCES public.registrations(id),
  template_id UUID REFERENCES public.certificate_templates(id),
  unique_code TEXT UNIQUE NOT NULL,
  file_url TEXT,
  issued_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Setup
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Safe to re-run, dropping if exists usually cleaner but IF NOT EXISTS logic for policies is verbose in standard SQL, so we use DO blocks or simple overrides)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Public events are viewable by everyone" ON public.events;
CREATE POLICY "Public events are viewable by everyone" ON public.events FOR SELECT USING (is_published = true OR auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "Admins can insert events" ON public.events;
CREATE POLICY "Admins can insert events" ON public.events FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "Admins can update events" ON public.events;
CREATE POLICY "Admins can update events" ON public.events FOR UPDATE USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "Users can view own registrations" ON public.registrations;
CREATE POLICY "Users can view own registrations" ON public.registrations FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "Users can register" ON public.registrations;
CREATE POLICY "Users can register" ON public.registrations FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ==========================================
-- 2. MIGRATIONS (supabase_migration.sql)
-- ==========================================

-- Update User Roles
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'event_admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'finance_admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'content_admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'moderator';

-- Approval Enums
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

-- Approval Requests Table
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

ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own requests" ON public.approval_requests;
CREATE POLICY "Users can view own requests" ON public.approval_requests FOR SELECT USING (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Admins can view all requests" ON public.approval_requests;
CREATE POLICY "Admins can view all requests" ON public.approval_requests FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

DROP POLICY IF EXISTS "Admins can update requests" ON public.approval_requests;
CREATE POLICY "Admins can update requests" ON public.approval_requests FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

DROP POLICY IF EXISTS "Authenticated users can create requests" ON public.approval_requests;
CREATE POLICY "Authenticated users can create requests" ON public.approval_requests FOR INSERT WITH CHECK (auth.uid() = requester_id);

-- Update Events Table Columns
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'General';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS registration_start TIMESTAMPTZ;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS registration_end TIMESTAMPTZ;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS fees DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS coordinators JSONB DEFAULT '[]'::jsonb;

-- Update Enums
DO $$ BEGIN
    ALTER TYPE registration_status ADD VALUE 'expired';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update Payments Table
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS receipt_url TEXT;

-- Update Certificate Templates
ALTER TABLE public.certificate_templates ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;


-- ==========================================
-- 3. SCENARIO MIGRATION (scenario_migration.sql)
-- ==========================================

DO $$ BEGIN
    CREATE TYPE event_status AS ENUM ('draft', 'pending_approval', 'published', 'rejected', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS status event_status DEFAULT 'draft';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS payment_deadline TIMESTAMPTZ;

-- Migrate data
UPDATE public.events 
SET status = CASE 
    WHEN is_published = TRUE THEN 'published'::event_status 
    ELSE 'draft'::event_status 
END;
