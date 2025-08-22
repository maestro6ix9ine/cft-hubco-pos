import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { calculateCashback } from '@/lib/services';
import { ReceiptData } from '@/components/ui/receipt';

interface TransactionData {
  customerPhone: string;
  customerName: string;
  serviceCategory: string;
  serviceDetails: any;
  totalAmount: number;
  paymentMode: string;
  additionalNotes?: string;
}

interface Customer {
  phone_number: string;
  customer_name: string;
  total_transactions: number;
  total_spent: number;
  cashback_balance: number;
}

export const useTransaction = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const processTransaction = async (
    transactionData: TransactionData,
    customer: Customer | null
  ): Promise<{ success: boolean; receiptData?: ReceiptData; error?: string }> => {
    setLoading(true);

    try {
      const {
        customerPhone,
        customerName,
        serviceCategory,
        serviceDetails,
        totalAmount,
        paymentMode,
        additionalNotes,
      } = transactionData;

      // Validation
      if (!customerPhone || !customerName || !serviceCategory || !paymentMode) {
        throw new Error('Please fill in all required fields');
      }

      if (totalAmount <= 0) {
        throw new Error('Please select at least one service');
      }

      const actualAmountPaid = paymentMode === 'cashback' ? 0 : totalAmount;
      const cashbackUsed = paymentMode === 'cashback' ? totalAmount : 0;
      const cashbackEarned = paymentMode === 'cashback' ? 0 : calculateCashback(totalAmount);

      // Generate receipt number
      const { data: receiptNum, error: receiptError } = await supabase
        .rpc('generate_receipt_number');
      
      if (receiptError) throw receiptError;

      // Create or update customer
      const customerUpsertData: any = {
        phone_number: customerPhone,
        total_transactions: (customer?.total_transactions || 0) + 1,
        total_spent: (customer?.total_spent || 0) + totalAmount,
        cashback_balance: (customer?.cashback_balance || 0) - cashbackUsed + cashbackEarned,
      };

      // Only update name if this is a new customer
      if (!customer) {
        customerUpsertData.customer_name = customerName;
      }

      const { error: customerError } = await supabase
        .from('customers')
        .upsert(customerUpsertData);

      if (customerError) throw customerError;

      // Create transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          receipt_number: receiptNum,
          customer_name: customerName,
          customer_phone: customerPhone,
          service_category: serviceCategory,
          service_details: serviceDetails,
          total_amount: actualAmountPaid,
          payment_mode: paymentMode,
          cashback_used: cashbackUsed,
          cashback_earned: cashbackEarned,
          additional_notes: additionalNotes || null,
        });

      if (transactionError) throw transactionError;

      // Prepare receipt data
      const receiptData: ReceiptData = {
        receiptNumber: receiptNum,
        customerName,
        customerPhone,
        serviceCategory,
        serviceDetails,
        totalAmount: actualAmountPaid,
        paymentMode,
        cashbackUsed,
        cashbackEarned,
        transactionDate: new Date().toISOString(),
        additionalNotes,
      };

      toast({
        title: "Transaction Completed",
        description: `Receipt ${receiptNum} generated successfully`,
      });

      return { success: true, receiptData };

    } catch (error: any) {
      const errorMessage = error.message || 'Transaction failed';
      toast({
        title: "Transaction Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    processTransaction,
    loading,
  };
};