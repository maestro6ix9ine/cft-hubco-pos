import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { useCustomer } from '@/hooks/useCustomer';
import { useTransaction } from '@/hooks/useTransaction';
import { useServiceForm, BaseFormData } from '@/hooks/useServiceForm';
import { formatNaira } from '@/lib/currency';
import { DEVICE_TYPES } from '@/lib/services';
import { ReceiptData } from '@/components/ui/receipt';
import { Zap } from 'lucide-react';
import { ServiceLayout } from '@/components/shared/ServiceLayout';
import { CustomerInfoSection } from '@/components/shared/CustomerInfoSection';
import { PaymentSection } from '@/components/shared/PaymentSection';
import { TransactionComplete } from '@/components/shared/TransactionComplete';

interface ChargingFormData extends BaseFormData {
  selectedDevices: string[];
  deviceDetails: { type: string; price: number }[];
  portNumber: string;
}

const initialFormData: ChargingFormData = {
  customerPhone: '',
  customerName: '',
  selectedDevices: [],
  deviceDetails: [],
  portNumber: '',
  paymentMode: '',
  additionalNotes: '',
};

const ChargingService = () => {
  const { isAuthenticated } = useAuth();
  const { formData, updateField, resetForm, isValid } = useServiceForm(initialFormData);
  const { customer, canUseCashback } = useCustomer(formData.customerPhone);
  const { processTransaction, loading } = useTransaction();
  
  const [totalPrice, setTotalPrice] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    const price = formData.deviceDetails.reduce((sum, device) => sum + device.price, 0);
    setTotalPrice(price);
  }, [formData.deviceDetails]);

  const handleDeviceToggle = (deviceValue: string) => {
    const isSelected = formData.selectedDevices.includes(deviceValue);
    const device = DEVICE_TYPES.find(d => d.value === deviceValue);
    
    if (!device) return;

    if (isSelected) {
      // Remove device
      updateField('selectedDevices', formData.selectedDevices.filter(d => d !== deviceValue));
      updateField('deviceDetails', formData.deviceDetails.filter(d => d.type !== device.label));
    } else {
      // Add device
      updateField('selectedDevices', [...formData.selectedDevices, deviceValue]);
      updateField('deviceDetails', [...formData.deviceDetails, { type: device.label, price: device.price }]);
    }
  };

  const isFormValid = () => {
    return isValid() && 
           formData.selectedDevices.length > 0 && 
           formData.portNumber;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      return;
    }

    if (formData.paymentMode === 'cashback' && !canUseCashback(totalPrice)) {
      return;
    }

    const serviceDetails = {
      selectedDevices: formData.selectedDevices,
      deviceDetails: formData.deviceDetails,
      portNumber: formData.portNumber,
      price: totalPrice
    };

    const result = await processTransaction({
      customerPhone: formData.customerPhone,
      customerName: formData.customerName.trim() || 'Unknown Customer',
      serviceCategory: 'Charging Hub',
      serviceDetails,
      totalAmount: totalPrice,
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
    setTotalPrice(0);
  };

  return (
    <ServiceLayout
      title="Charging Hub"
      description="Create new charging service transaction"
      icon={Zap}
      iconColor="bg-gradient-to-br from-yellow-500 to-orange-500"
    >
      <Card>
        <CardHeader>
          <CardTitle>New Charging Transaction</CardTitle>
          <CardDescription>
            Fill in the customer and device details
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

            {/* Device Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Device Selection</CardTitle>
                <CardDescription>Select devices to charge</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {DEVICE_TYPES.map((device) => (
                    <div key={device.value} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id={device.value}
                        checked={formData.selectedDevices.includes(device.value)}
                        onCheckedChange={() => handleDeviceToggle(device.value)}
                        disabled={loading}
                      />
                      <div className="flex-1 flex justify-between items-center">
                        <Label htmlFor={device.value} className="cursor-pointer">
                          {device.label}
                        </Label>
                        <span className="text-sm font-medium text-primary">
                          {formatNaira(device.price)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {formData.selectedDevices.length > 0 && (
                  <div>
                    <Label htmlFor="portNumber">Port Number *</Label>
                    <Select 
                      value={formData.portNumber} 
                      onValueChange={(value) => updateField('portNumber', value)}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select port number" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                          <SelectItem key={num} value={num.toString()}>
                            Port {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {totalPrice > 0 && (
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="text-lg font-semibold">
                      Total: {formatNaira(totalPrice)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Information */}
            {totalPrice > 0 && (
              <PaymentSection
                paymentMode={formData.paymentMode}
                additionalNotes={formData.additionalNotes}
                totalAmount={totalPrice}
                customer={customer}
                canUseCashback={canUseCashback(totalPrice)}
                onPaymentModeChange={(mode) => updateField('paymentMode', mode)}
                onNotesChange={(notes) => updateField('additionalNotes', notes)}
                loading={loading}
              />
            )}

            {/* Submit */}
            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={loading || !isFormValid()}
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

export default ChargingService;