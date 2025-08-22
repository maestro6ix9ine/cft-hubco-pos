import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Customer {
  phone_number: string;
  customer_name: string;
  total_transactions: number;
  total_spent: number;
  cashback_balance: number;
  created_at: string;
  updated_at: string;
}

export const useCustomer = (phoneNumber: string) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomer = async () => {
    if (phoneNumber.length < 10) {
      setCustomer(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone_number', phoneNumber)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setCustomer(data);
    } catch (err) {
      console.error('Error fetching customer:', err);
      setError('Failed to fetch customer');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [phoneNumber]);

  const canUseCashback = (amount: number) => {
    return customer && customer.cashback_balance >= amount && amount > 0;
  };

  const refreshCustomer = () => {
    fetchCustomer();
  };

  return {
    customer,
    loading,
    error,
    canUseCashback,
    refreshCustomer,
  };
};