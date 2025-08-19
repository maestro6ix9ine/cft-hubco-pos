import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatNaira } from '@/lib/currency';
import { BARBING_SERVICES, PAYMENT_MODES, calculateCashback } from '@/lib/services';
import { Receipt, ReceiptData } from '@/components/ui/receipt';
import { validatePhoneNumber, validateCustomerName, sanitizeInput, transactionRateLimiter } from '@/lib/validation';
import { ArrowLeft, Scissors, CreditCard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const BarbingService = () => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    customerPhone: '',
    customerName: '',
    serviceType: '',
    paymentMode: '',
    additionalNotes: '',
  });
  
  const [customer, setCustomer] = useState<any>(null);
  const [servicePrice, setServicePrice] = useState(0);
  const [cashbackToUse, setCashbackToUse] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    if (formData.serviceType) {
      const service = BARBING_SERVICES.find(s => s.value === formData.serviceType);
      setServicePrice(service?.price || 0);
    }
  }, [formData.serviceType]);

  useEffect(() => {
    if (formData.customerPhone.length >= 10) {
      fetchCustomer();
    } else {
      setCustomer(null);
    }
  }, [formData.customerPhone]);

  const fetchCustomer = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone_number', formData.customerPhone)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setCustomer(data);
    } catch (error) {
      console.error('Error fetching customer:', error);
    }
  };

  const canUseCashback = () => {
    return customer && customer.cashback_balance >= servicePrice;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.customerPhone || !formData.customerName || !formData.serviceType || !formData.paymentMode) {
        throw new Error('Please fill in all required fields');
      }

      if (formData.paymentMode === 'cashback' && !canUseCashback()) {
        throw new Error('Insufficient cashback balance or invalid payment mode');
      }

      const actualAmountPaid = formData.paymentMode === 'cashback' ? 0 : servicePrice;
      const cashbackUsed = formData.paymentMode === 'cashback' ? servicePrice : 0;
      const cashbackEarned = formData.paymentMode === 'cashback' ? 0 : calculateCashback(servicePrice);

      // Generate receipt number
      const { data: receiptNum, error: receiptError } = await supabase
        .rpc('generate_receipt_number');
      
      if (receiptError) throw receiptError;

      const serviceDetails = {
        serviceType: BARBING_SERVICES.find(s => s.value === formData.serviceType)?.label,
        price: servicePrice
      };

      // Create or update customer - preserve existing name if customer exists
      let customerUpsertData: any = {
        phone_number: formData.customerPhone,
        total_transactions: (customer?.total_transactions || 0) + 1,
        total_spent: (customer?.total_spent || 0) + servicePrice,
        cashback_balance: (customer?.cashback_balance || 0) - cashbackUsed + cashbackEarned,
      };

      // Only update name if this is a new customer
      if (!customer) {
        customerUpsertData.customer_name = formData.customerName;
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
          customer_name: formData.customerName,
          customer_phone: formData.customerPhone,
          service_category: 'Barbing Services',
          service_details: serviceDetails,
          total_amount: actualAmountPaid,
          payment_mode: formData.paymentMode,
          cashback_used: cashbackUsed,
          cashback_earned: cashbackEarned,
          additional_notes: formData.additionalNotes || null,
        });

      if (transactionError) throw transactionError;

      // Prepare receipt data
      const receipt: ReceiptData = {
        receiptNumber: receiptNum,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        serviceCategory: 'Barbing Services',
        serviceDetails,
        totalAmount: actualAmountPaid,
        paymentMode: formData.paymentMode,
        cashbackUsed,
        cashbackEarned,
        transactionDate: new Date().toISOString(),
        additionalNotes: formData.additionalNotes,
      };

      setReceiptData(receipt);
      setShowReceipt(true);

      toast({
        title: "Transaction Completed",
        description: `Receipt ${receiptNum} generated successfully`,
      });

      // Reset form
      setFormData({
        customerPhone: '',
        customerName: '',
        serviceType: '',
        paymentMode: '',
        additionalNotes: '',
      });
      setCustomer(null);
      setServicePrice(0);
      setCashbackToUse(0);

    } catch (error: any) {
      toast({
        title: "Transaction Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                <Scissors className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Barbing Services</h1>
                <p className="text-sm text-muted-foreground">Create new barbing transaction</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>New Barbing Transaction</CardTitle>
              <CardDescription>
                Fill in the customer and service details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Customer Information</h3>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="customerPhone">Phone Number (Customer ID) *</Label>
                      <Input
                        id="customerPhone"
                        type="tel"
                        value={formData.customerPhone}
                        onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                        placeholder="Enter phone number"
                        required
                      />
                      {customer && (
                        <div className="text-xs text-green-600 mt-1">
                          Existing customer • Cashback: {formatNaira(customer.cashback_balance)}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="customerName">Customer Name *</Label>
                      <Input
                        id="customerName"
                        value={formData.customerName}
                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        placeholder="Enter customer name"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Service Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Service Details</h3>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="serviceType">Service Type *</Label>
                      <Select value={formData.serviceType} onValueChange={(value) => setFormData({ ...formData, serviceType: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select service type" />
                        </SelectTrigger>
                        <SelectContent>
                          {BARBING_SERVICES.map((service) => (
                            <SelectItem key={service.value} value={service.value}>
                              {service.label} - {formatNaira(service.price)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="price">Price</Label>
                      <Input
                        id="price"
                        value={formatNaira(servicePrice)}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Payment Information</h3>
                  
                  <div>
                    <Label htmlFor="paymentMode">Payment Mode *</Label>
                    <Select value={formData.paymentMode} onValueChange={(value) => setFormData({ ...formData, paymentMode: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment mode" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_MODES.map((mode) => (
                          <SelectItem 
                            key={mode.value} 
                            value={mode.value}
                            disabled={mode.value === 'cashback' && !canUseCashback()}
                          >
                            {mode.label}
                            {mode.value === 'cashback' && customer && (
                              <span className="text-xs text-muted-foreground ml-2">
                                (Available: {formatNaira(customer.cashback_balance)})
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.paymentMode === 'cashback' && !canUseCashback() && (
                      <div className="text-xs text-red-600 mt-1">
                        Insufficient cashback balance or customer not found
                      </div>
                    )}
                  </div>

                  {/* Cashback Information */}
                  {servicePrice > 0 && formData.paymentMode !== 'cashback' && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          Cashback to be earned: {formatNaira(calculateCashback(servicePrice))} (5%)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Notes */}
                <div>
                  <Label htmlFor="additionalNotes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="additionalNotes"
                    value={formData.additionalNotes}
                    onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                    placeholder="Any additional notes or special instructions"
                    rows={3}
                  />
                </div>

                {/* Submit */}
                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={loading || !formData.customerPhone || !formData.customerName || !formData.serviceType || !formData.paymentMode}
                >
                  {loading ? 'Processing...' : 'Complete Transaction'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Transaction Complete</DialogTitle>
            <DialogDescription>
              Receipt generated successfully
            </DialogDescription>
          </DialogHeader>
          {receiptData && (
            <Receipt data={receiptData} />
          )}
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowReceipt(false)}
              className="flex-1"
            >
              New Transaction
            </Button>
            <Button
              onClick={() => {
                setShowReceipt(false);
                navigate('/dashboard');
              }}
              className="flex-1"
            >
              Complete & Return to Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BarbingService;