-- Fix security warning: Set search_path for functions to be immutable
DROP FUNCTION IF EXISTS public.update_updated_at_column();
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