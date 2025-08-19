-- Fix function search path security warnings
CREATE OR REPLACE FUNCTION public.calculate_cashback(amount numeric)
RETURNS numeric 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- 5% cashback calculation
  RETURN ROUND(amount * 0.05, 2);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_valid_phone(phone text)
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Basic Nigerian phone number validation (11 digits starting with 0)
  RETURN phone ~ '^0[789][01]\d{8}$' OR phone ~ '^\+234[789][01]\d{8}$';
END;
$$;