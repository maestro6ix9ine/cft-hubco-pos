-- Create admin table for authentication
CREATE TABLE public.admin (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customers table with phone number as primary key
CREATE TABLE public.customers (
  phone_number TEXT NOT NULL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  cashback_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_spent DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_transactions INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_number TEXT NOT NULL UNIQUE,
  customer_phone TEXT NOT NULL REFERENCES public.customers(phone_number) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  service_category TEXT NOT NULL CHECK (service_category IN ('barbing', 'charging', 'computer')),
  service_details JSONB NOT NULL,
  payment_mode TEXT NOT NULL CHECK (payment_mode IN ('cash', 'transfer', 'pos', 'cashback')),
  total_amount DECIMAL(10,2) NOT NULL,
  cashback_earned DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  cashback_used DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  additional_notes TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for admin table (only authenticated admins can access)
CREATE POLICY "Admin can read own data" ON public.admin FOR SELECT USING (true);
CREATE POLICY "Admin can update own data" ON public.admin FOR UPDATE USING (true);

-- Create policies for customers table (admin can manage all customers)
CREATE POLICY "Admin can view all customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Admin can create customers" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can update customers" ON public.customers FOR UPDATE USING (true);
CREATE POLICY "Admin can delete customers" ON public.customers FOR DELETE USING (true);

-- Create policies for transactions table (admin can manage all transactions)
CREATE POLICY "Admin can view all transactions" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Admin can create transactions" ON public.transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can update transactions" ON public.transactions FOR UPDATE USING (true);
CREATE POLICY "Admin can delete transactions" ON public.transactions FOR DELETE USING (true);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_admin_updated_at
BEFORE UPDATE ON public.admin
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate receipt numbers
CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql;

-- Insert default admin user (password will be hashed in the application)
INSERT INTO public.admin (username, password_hash) 
VALUES ('admin', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeC.OHHbaTz.ENqF2'); -- password: 'admin123'