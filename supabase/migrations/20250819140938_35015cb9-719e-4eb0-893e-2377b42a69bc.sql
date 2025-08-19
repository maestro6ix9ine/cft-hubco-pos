-- Create admin table for authentication
CREATE TABLE public.admin (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security for admin
ALTER TABLE public.admin ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admin operations
CREATE POLICY "Admin can manage admin records" 
ON public.admin 
FOR ALL 
USING (true);

-- Create customers table
CREATE TABLE public.customers (
  phone_number TEXT NOT NULL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  total_spent DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_transactions INTEGER NOT NULL DEFAULT 0,
  cashback_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security for customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create policy for customers
CREATE POLICY "Customers are viewable by everyone" 
ON public.customers 
FOR ALL 
USING (true);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  service_category TEXT NOT NULL,
  service_details JSONB NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_mode TEXT NOT NULL,
  cashback_earned DECIMAL(10,2) NOT NULL DEFAULT 0,
  cashback_used DECIMAL(10,2) NOT NULL DEFAULT 0,
  additional_notes TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (customer_phone) REFERENCES public.customers(phone_number)
);

-- Enable Row Level Security for transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create policy for transactions
CREATE POLICY "Transactions are viewable by everyone" 
ON public.transactions 
FOR ALL 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create function to generate receipt numbers
CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS TEXT 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
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
$$;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_admin_updated_at
  BEFORE UPDATE ON public.admin
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default admin user (username: admin, password: admin123)
INSERT INTO public.admin (username, password_hash) 
VALUES ('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');