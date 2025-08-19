-- Fix critical security vulnerabilities
-- Drop the unused admin table since we're using Supabase Auth
DROP TABLE IF EXISTS public.admin;

-- Update RLS policies to require authentication
DROP POLICY IF EXISTS "Customers are viewable by everyone" ON public.customers;
DROP POLICY IF EXISTS "Transactions are viewable by everyone" ON public.transactions;

-- Create secure RLS policies that require authentication
CREATE POLICY "Authenticated users can manage customers" 
ON public.customers 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated users can manage transactions" 
ON public.transactions 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Add server-side validation functions for business logic
CREATE OR REPLACE FUNCTION public.calculate_cashback(amount numeric)
RETURNS numeric AS $$
BEGIN
  -- 5% cashback calculation
  RETURN ROUND(amount * 0.05, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to validate phone numbers
CREATE OR REPLACE FUNCTION public.is_valid_phone(phone text)
RETURNS boolean AS $$
BEGIN
  -- Basic Nigerian phone number validation (11 digits starting with 0)
  RETURN phone ~ '^0[789][01]\d{8}$' OR phone ~ '^\+234[789][01]\d{8}$';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add constraint to ensure valid phone numbers
ALTER TABLE public.customers 
ADD CONSTRAINT valid_phone_number 
CHECK (public.is_valid_phone(phone_number));