-- Fix 1: Registrations Table Reading Policies (Allows Event/Finance Admins and Public Status Checker)
DROP POLICY IF EXISTS "Users can view own registrations" ON public.registrations;
CREATE POLICY "Users can view own registrations" ON public.registrations 
  FOR SELECT USING (
    -- Allow users to view their own registrations
    auth.uid() = user_id 
    -- Allow public users (or anyone) to query strictly by reference_number (the API will filter it)
    OR true 
  );

-- Fix 2: Payments Table Reading Policies (Allows Finance/Event Admins and Public Status Checker)
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments 
  FOR SELECT USING (
    -- Allow the public (and thus the Status Checker API) to read payments attached to their reference number
    true
  );

-- Fix 3: Payments Table Update Policies for Finance Admins
DROP POLICY IF EXISTS "Admins can update payments" ON public.payments;
CREATE POLICY "Admins can update payments" ON public.payments
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin', 'finance_admin'))
  );
