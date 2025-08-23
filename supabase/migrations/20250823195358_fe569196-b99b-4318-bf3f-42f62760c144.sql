-- Fix function search paths for security
-- Update existing functions to use immutable search_path

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Update generate_receipt_number function  
CREATE OR REPLACE FUNCTION public.generate_receipt_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_date_str TEXT;
  next_number INTEGER;
  receipt_num TEXT;
BEGIN
  current_date_str := to_char(CURRENT_DATE, 'YYYYMMDD');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_number FROM 12) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.transactions
  WHERE receipt_number LIKE 'CFT' || current_date_str || '%';
  
  receipt_num := 'CFT' || current_date_str || LPAD(next_number::TEXT, 3, '0');
  
  RETURN receipt_num;
END;
$function$;

-- Update calculate_cashback function
CREATE OR REPLACE FUNCTION public.calculate_cashback(amount numeric)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- 5% cashback calculation
  RETURN ROUND(amount * 0.05, 2);
END;
$function$;

-- Update is_valid_phone function
CREATE OR REPLACE FUNCTION public.is_valid_phone(phone text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Basic Nigerian phone number validation (11 digits starting with 0)
  RETURN phone ~ '^0[789][01]\d{8}$' OR phone ~ '^\+234[789][01]\d{8}$';
END;
$function$;

-- Update prevent_user_signup function
CREATE OR REPLACE FUNCTION public.prevent_user_signup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if there are any existing users (admin should already exist)
  -- If users exist, prevent any new signups
  IF EXISTS (SELECT 1 FROM auth.users LIMIT 1) THEN
    RAISE EXCEPTION 'New user registrations are disabled. Only admin access is allowed.';
  END IF;
  
  -- Allow the first user (admin) to be created
  RETURN NEW;
END;
$function$;