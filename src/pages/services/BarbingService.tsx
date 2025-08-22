import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useCustomer } from '@/hooks/useCustomer';
import { useTransaction } from '@/hooks/useTransaction';
import { useServiceForm, BaseFormData } from '@/hooks/useServiceForm';
import { formatNaira } from '@/lib/currency';
import { BARBING_SERVICES } from '@/lib/services';
import { ReceiptData } from '@/components/ui/receipt';
import { Scissors } from 'lucide-react';
import { ServiceLayout } from '@/components/shared/ServiceLayout';
import { CustomerInfoSection } from '@/components/shared/CustomerInfoSection';
import { PaymentSection } from '@/components/shared/PaymentSection';
import { TransactionComplete } from '@/components/shared/TransactionComplete';

interface BarbingFormData extends BaseFormData {
  serviceType: string;
}

const initialFormData: BarbingFormData = {
  customerPhone: '',
  customerName: '',
  serviceType: '',
  paymentMode: '',
  additionalNotes: '',
};

const BarbingService = () => {
  const { isAuthenticated } = useAuth();
  const { formData, updateField, resetForm, isValid } = useServiceForm(initialFormData);
  const { customer, canUseCashback } = useCustomer(formData.customerPhone);
  const { processTransaction, loading } = useTransaction();
  
  const [servicePrice, setServicePrice] = React.useState(0);
  const [showReceipt, setShowReceipt] = React.useState(false);
  const [receiptData, setReceiptData] = React.useState<ReceiptData | null>(null);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    if (formData.serviceType) {
      const service = BARBING_SERVICES.find(s => s.value === formData.serviceType);
      setServicePrice(service?.price || 0);
    }
  }, [formData.serviceType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid() || !formData.serviceType) {
      return;
    }

    if (formData.paymentMode === 'cashback' && !canUseCashback(servicePrice)) {
      return;
    }

    const serviceDetails = {
      serviceType: BARBING_SERVICES.find(s => s.value === formData.serviceType)?.label,
      price: servicePrice
    };

    const result = await processTransaction({
      customerPhone: formData.customerPhone,
      customerName: formData.customerName,
      serviceCategory: 'Barbing Services',
      serviceDetails,
      totalAmount: servicePrice,
      paymentMode: formData.paymentMode,
      additionalNotes: formData.additionalNotes,
    }, customer);

    if (result.success && result.receiptData) {
      setReceiptData(result.receiptData);
      setShowReceipt(true);
      handleNewTransaction();
    }
  };

  const handleNewTransaction = () => {
    resetForm();
    setServicePrice(0);
  };

  return (
    <ServiceLayout
      title="Barbing Services"
      description="Create new barbing transaction"
      icon={Scissors}
      iconColor="bg-gradient-to-br from-blue-500 to-blue-600"
    >
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
            <CustomerInfoSection
              phoneNumber={formData.customerPhone}
              customerName={formData.customerName}
              customer={customer}
              onPhoneChange={(phone) => updateField('customerPhone', phone)}
              onNameChange={(name) => updateField('customerName', name)}
              loading={loading}
            />

            {/* Service Details */}
            <Card>
              <CardHeader>
                <CardTitle>Service Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="serviceType">Service Type *</Label>
                    <Select 
                      value={formData.serviceType} 
                      onValueChange={(value) => updateField('serviceType', value)}
                      disabled={loading}
                    >
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
              </CardContent>
            </Card>

            {/* Payment Information */}
            <PaymentSection
              paymentMode={formData.paymentMode}
              additionalNotes={formData.additionalNotes}
              totalAmount={servicePrice}
              customer={customer}
              canUseCashback={canUseCashback(servicePrice)}
              onPaymentModeChange={(mode) => updateField('paymentMode', mode)}
              onNotesChange={(notes) => updateField('additionalNotes', notes)}
              loading={loading}
            />

            {/* Submit */}
            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={loading || !isValid() || !formData.serviceType}
            >
              {loading ? 'Processing...' : 'Complete Transaction'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Transaction Complete Dialog */}
      <TransactionComplete
        open={showReceipt}
        onOpenChange={setShowReceipt}
        receiptData={receiptData}
        onNewTransaction={() => {
          setShowReceipt(false);
          handleNewTransaction();
        }}
      />
    </ServiceLayout>
  );
};

export default BarbingService;