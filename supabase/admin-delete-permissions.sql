-- Allow Admins and Super Admins to perform hard deletes for event cleanup
-- Run this in the Supabase SQL Editor

-- 1. Events
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;
CREATE POLICY "Admins can delete events" ON public.events 
FOR DELETE USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')));

-- 2. Registrations
DROP POLICY IF EXISTS "Admins can delete registrations" ON public.registrations;
CREATE POLICY "Admins can delete registrations" ON public.registrations 
FOR DELETE USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')));

-- 3. Payments
DROP POLICY IF EXISTS "Admins can delete payments" ON public.payments;
CREATE POLICY "Admins can delete payments" ON public.payments 
FOR DELETE USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')));

-- 4. Attendance
-- Ensure RLS is enabled first just in case
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can delete attendance" ON public.attendance;
CREATE POLICY "Admins can delete attendance" ON public.attendance 
FOR DELETE USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')));

-- 5. Certificate Templates
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can delete certificate_templates" ON public.certificate_templates;
CREATE POLICY "Admins can delete certificate_templates" ON public.certificate_templates 
FOR DELETE USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')));

-- 6. Certificates
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can delete certificates" ON public.certificates;
CREATE POLICY "Admins can delete certificates" ON public.certificates 
FOR DELETE USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')));

-- 7. Approval Requests
-- Ensure RLS is enabled
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can delete approval_requests" ON public.approval_requests;
CREATE POLICY "Admins can delete approval_requests" ON public.approval_requests 
FOR DELETE USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')));

-- Ensure other standard policies aren't missing if we just enabled RLS for them
-- Attendance Read
DROP POLICY IF EXISTS "Admins can read attendance" ON public.attendance;
CREATE POLICY "Admins can read attendance" ON public.attendance FOR SELECT USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')));
-- Approval Requests Read
DROP POLICY IF EXISTS "Admins can read approval_requests" ON public.approval_requests;
CREATE POLICY "Admins can read approval_requests" ON public.approval_requests FOR SELECT USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')));
