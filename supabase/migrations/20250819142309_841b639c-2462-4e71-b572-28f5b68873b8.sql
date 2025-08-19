-- Update customers table to use phone_number as primary key
DROP TABLE IF EXISTS public.customers CASCADE;

CREATE TABLE public.customers (
  phone_number TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  total_transactions INTEGER NOT NULL DEFAULT 0,
  total_spent NUMERIC NOT NULL DEFAULT 0,
  cashback_balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create policy for customers
CREATE POLICY "Customers are viewable by everyone" 
ON public.customers 
FOR ALL 
USING (true);

-- Update transactions table to reference new customers primary key
ALTER TABLE public.transactions 
DROP CONSTRAINT IF EXISTS transactions_customer_phone_fkey;

ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_customer_phone_fkey 
FOREIGN KEY (customer_phone) REFERENCES public.customers(phone_number) ON DELETE CASCADE;

-- Create updated_at trigger for customers
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();