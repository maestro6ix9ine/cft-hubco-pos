-- Fix security warning: Drop triggers first, then recreate function with proper security
DROP TRIGGER IF EXISTS update_admin_updated_at ON public.admin;
DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.generate_receipt_number();

-- Recreate functions with proper security settings
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
  receipt_num TEXT;
BEGIN
  -- Get the next sequential number
  SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_number FROM 9) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.transactions
  WHERE receipt_number LIKE 'CFT-RCP-%';
  
  -- Format as CFT-RCP-XXXXXX
  receipt_num := 'CFT-RCP-' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN receipt_num;
END;
$$;

-- Recreate the triggers
CREATE TRIGGER update_admin_updated_at
BEFORE UPDATE ON public.admin
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();