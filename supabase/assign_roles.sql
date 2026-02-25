-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Confirm Emails (so you can login immediately)
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email IN (
  'super_admin@test.com', 
  'event_admin@test.com', 
  'finance_admin@test.com', 
  'moderator@test.com', 
  'participant@test.com'
);

-- 2. Grant Roles
UPDATE public.profiles SET role = 'super_admin' WHERE email = 'super_admin@test.com';
UPDATE public.profiles SET role = 'event_admin' WHERE email = 'event_admin@test.com';
UPDATE public.profiles SET role = 'finance_admin' WHERE email = 'finance_admin@test.com';
UPDATE public.profiles SET role = 'moderator' WHERE email = 'moderator@test.com';
-- 'participant@test.com' is already a participant by default
