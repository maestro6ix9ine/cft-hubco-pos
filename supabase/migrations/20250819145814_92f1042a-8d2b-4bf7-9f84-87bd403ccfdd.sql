-- Disable public signups by creating a trigger that prevents new user insertions
-- This will block any signup attempts at the database level
CREATE OR REPLACE FUNCTION public.prevent_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there are any existing users (admin should already exist)
  -- If users exist, prevent any new signups
  IF EXISTS (SELECT 1 FROM auth.users LIMIT 1) THEN
    RAISE EXCEPTION 'New user registrations are disabled. Only admin access is allowed.';
  END IF;
  
  -- Allow the first user (admin) to be created
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent new user signups
DROP TRIGGER IF EXISTS prevent_signup_trigger ON auth.users;
CREATE TRIGGER prevent_signup_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_user_signup();

-- Also secure the customers and transactions tables with proper RLS policies
-- Update customers table RLS policy to require authentication
DROP POLICY IF EXISTS "Allow public read access" ON public.customers;
CREATE POLICY "Only authenticated admin can access customers"
ON public.customers
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Update transactions table RLS policy to require authentication  
DROP POLICY IF EXISTS "Allow public read access" ON public.transactions;
CREATE POLICY "Only authenticated admin can access transactions"
ON public.transactions
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL);