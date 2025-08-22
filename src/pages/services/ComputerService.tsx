import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { useCustomer } from '@/hooks/useCustomer';
import { useTransaction } from '@/hooks/useTransaction';
import { useServiceForm, BaseFormData } from '@/hooks/useServiceForm';
import { formatNaira } from '@/lib/currency';
import { 
  PRINT_SERVICES, 
  COPY_SERVICES, 
  SCAN_SERVICES, 
  BINDING_SERVICES, 
  LAMINATION_SERVICES 
} from '@/lib/services';
import { ReceiptData } from '@/components/ui/receipt';
import { Monitor, Calculator } from 'lucide-react';
import { ServiceLayout } from '@/components/shared/ServiceLayout';
import { CustomerInfoSection } from '@/components/shared/CustomerInfoSection';
import { PaymentSection } from '@/components/shared/PaymentSection';
import { TransactionComplete } from '@/components/shared/TransactionComplete';

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  type?: string;
}

interface ComputerFormData extends BaseFormData {
  // Print services
  printBW: { enabled: boolean; pages: number };
  printColor: { enabled: boolean; pages: number };
  
  // Copy services
  copyBWSingle: { enabled: boolean; pages: number };
  copyBWDouble: { enabled: boolean; pages: number };
  copyColorSingle: { enabled: boolean; pages: number };
  copyColorDouble: { enabled: boolean; pages: number };
  
  // Scan services
  scanStandard: { enabled: boolean; pages: number };
  
  // Binding services
  bindingComb: { enabled: boolean; pages: number };
  bindingWire: { enabled: boolean; pages: number };
  
  // Lamination services
  laminationA4: { enabled: boolean; quantity: number };
  laminationA3: { enabled: boolean; quantity: number };
}

const initialFormData: ComputerFormData = {
  customerPhone: '',
  customerName: '',
  paymentMode: '',
  additionalNotes: '',
  
  printBW: { enabled: false, pages: 0 },
  printColor: { enabled: false, pages: 0 },
  
  copyBWSingle: { enabled: false, pages: 0 },
  copyBWDouble: { enabled: false, pages: 0 },
  copyColorSingle: { enabled: false, pages: 0 },
  copyColorDouble: { enabled: false, pages: 0 },
  
  scanStandard: { enabled: false, pages: 0 },
  
  bindingComb: { enabled: false, pages: 0 },
  bindingWire: { enabled: false, pages: 0 },
  
  laminationA4: { enabled: false, quantity: 0 },
  laminationA3: { enabled: false, quantity: 0 },
};

const ComputerService = () => {
  const { isAuthenticated } = useAuth();
  const { formData, updateField, resetForm, isValid } = useServiceForm(initialFormData);
  const { customer, canUseCashback } = useCustomer(formData.customerPhone);
  const { processTransaction, loading } = useTransaction();
  
  const [selectedServices, setSelectedServices] = useState<ServiceItem[]>([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Calculate services whenever form data changes
  useEffect(() => {
    const services: ServiceItem[] = [];

    // Printing services
    if (formData.printBW.enabled && formData.printBW.pages > 0) {
      services.push({
        id: 'print_bw',
        name: `B&W Printing (${formData.printBW.pages} pages)`,
        price: formData.printBW.pages * PRINT_SERVICES.BW.pricePerPage,
        quantity: formData.printBW.pages,
        type: 'printing'
      });
    }
    
    if (formData.printColor.enabled && formData.printColor.pages > 0) {
      services.push({
        id: 'print_color',
        name: `Color Printing (${formData.printColor.pages} pages)`,
        price: formData.printColor.pages * PRINT_SERVICES.COLOR.pricePerPage,
        quantity: formData.printColor.pages,
        type: 'printing'
      });
    }

    // Copy services
    if (formData.copyBWSingle.enabled && formData.copyBWSingle.pages > 0) {
      services.push({
        id: 'copy_bw_single',
        name: `B&W Single-sided (${formData.copyBWSingle.pages} pages)`,
        price: formData.copyBWSingle.pages * COPY_SERVICES.BW_SINGLE.pricePerPage,
        quantity: formData.copyBWSingle.pages,
        type: 'copying'
      });
    }

    if (formData.copyBWDouble.enabled && formData.copyBWDouble.pages > 0) {
      services.push({
        id: 'copy_bw_double',
        name: `B&W Double-sided (${formData.copyBWDouble.pages} pages)`,
        price: formData.copyBWDouble.pages * COPY_SERVICES.BW_DOUBLE.pricePerPage,
        quantity: formData.copyBWDouble.pages,
        type: 'copying'
      });
    }

    if (formData.copyColorSingle.enabled && formData.copyColorSingle.pages > 0) {
      services.push({
        id: 'copy_color_single',
        name: `Color Single-sided (${formData.copyColorSingle.pages} pages)`,
        price: formData.copyColorSingle.pages * COPY_SERVICES.COLOR_SINGLE.pricePerPage,
        quantity: formData.copyColorSingle.pages,
        type: 'copying'
      });
    }

    if (formData.copyColorDouble.enabled && formData.copyColorDouble.pages > 0) {
      services.push({
        id: 'copy_color_double',
        name: `Color Double-sided (${formData.copyColorDouble.pages} pages)`,
        price: formData.copyColorDouble.pages * COPY_SERVICES.COLOR_DOUBLE.pricePerPage,
        quantity: formData.copyColorDouble.pages,
        type: 'copying'
      });
    }

    // Scanning services
    if (formData.scanStandard.enabled && formData.scanStandard.pages > 0) {
      services.push({
        id: 'scan_standard',
        name: `Scanning (${formData.scanStandard.pages} pages)`,
        price: formData.scanStandard.pages * SCAN_SERVICES.STANDARD.pricePerPage,
        quantity: formData.scanStandard.pages,
        type: 'scanning'
      });
    }

    // Binding services
    if (formData.bindingComb.enabled && formData.bindingComb.pages > 0) {
      services.push({
        id: 'binding_comb',
        name: `Comb Binding (${formData.bindingComb.pages} pages)`,
        price: BINDING_SERVICES.COMB.basePrice + (formData.bindingComb.pages * 2),
        quantity: formData.bindingComb.pages,
        type: 'binding'
      });
    }

    if (formData.bindingWire.enabled && formData.bindingWire.pages > 0) {
      services.push({
        id: 'binding_wire',
        name: `Wire Binding (${formData.bindingWire.pages} pages)`,
        price: BINDING_SERVICES.WIRE.basePrice + (formData.bindingWire.pages * 2),
        quantity: formData.bindingWire.pages,
        type: 'binding'
      });
    }

    // Lamination services
    if (formData.laminationA4.enabled && formData.laminationA4.quantity > 0) {
      services.push({
        id: 'lamination_a4',
        name: `A4 Lamination (${formData.laminationA4.quantity} items)`,
        price: formData.laminationA4.quantity * LAMINATION_SERVICES.A4.price,
        quantity: formData.laminationA4.quantity,
        type: 'lamination'
      });
    }

    if (formData.laminationA3.enabled && formData.laminationA3.quantity > 0) {
      services.push({
        id: 'lamination_a3',
        name: `A3 Lamination (${formData.laminationA3.quantity} items)`,
        price: formData.laminationA3.quantity * LAMINATION_SERVICES.A3.price,
        quantity: formData.laminationA3.quantity,
        type: 'lamination'
      });
    }

    setSelectedServices(services);
  }, [formData]);

  const totalPrice = selectedServices.reduce((sum, service) => sum + service.price, 0);

  const isFormValid = () => {
    return isValid() && selectedServices.length > 0;
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
      services: selectedServices.map(service => ({
        name: service.name,
        price: service.price,
        quantity: service.quantity,
        type: service.type
      })),
      totalServices: selectedServices.length
    };

    const result = await processTransaction({
      customerPhone: formData.customerPhone,
      customerName: formData.customerName,
      serviceCategory: 'Computer Services',
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
    setSelectedServices([]);
  };

  const renderServiceSection = (title: string, children: React.ReactNode) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );

  const renderServiceCheckbox = (
    id: string,
    label: string,
    priceText: string,
    enabled: boolean,
    value: number,
    onEnabledChange: (enabled: boolean) => void,
    onValueChange: (value: number) => void,
    inputType: 'pages' | 'quantity' = 'pages'
  ) => (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={id}
        checked={enabled}
        onCheckedChange={onEnabledChange}
        disabled={loading}
      />
      <Label htmlFor={id} className="flex-1">
        {label} ({priceText})
      </Label>
      {enabled && (
        <Input
          type="number"
          min="1"
          value={value || ''}
          onChange={(e) => onValueChange(parseInt(e.target.value) || 0)}
          className="w-20"
          placeholder={inputType === 'pages' ? 'Pages' : 'Qty'}
          disabled={loading}
        />
      )}
    </div>
  );

  return (
    <ServiceLayout
      title="Computer Services"
      description="Create new computer service transaction"
      icon={Monitor}
      iconColor="bg-gradient-to-br from-purple-500 to-purple-600"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Services Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <CustomerInfoSection
              phoneNumber={formData.customerPhone}
              customerName={formData.customerName}
              customer={customer}
              onPhoneChange={(phone) => updateField('customerPhone', phone)}
              onNameChange={(name) => updateField('customerName', name)}
              loading={loading}
            />

            <div className="grid gap-6 md:grid-cols-2">
              {/* Printing Services */}
              {renderServiceSection(
                'Printing Services',
                <>
                  {renderServiceCheckbox(
                    'print_bw',
                    'B&W',
                    formatNaira(PRINT_SERVICES.BW.pricePerPage) + '/page',
                    formData.printBW.enabled,
                    formData.printBW.pages,
                    (enabled) => updateField('printBW', { ...formData.printBW, enabled }),
                    (pages) => updateField('printBW', { ...formData.printBW, pages })
                  )}
                  {renderServiceCheckbox(
                    'print_color',
                    'Color',
                    formatNaira(PRINT_SERVICES.COLOR.pricePerPage) + '/page',
                    formData.printColor.enabled,
                    formData.printColor.pages,
                    (enabled) => updateField('printColor', { ...formData.printColor, enabled }),
                    (pages) => updateField('printColor', { ...formData.printColor, pages })
                  )}
                </>
              )}

              {/* Copying Services */}
              {renderServiceSection(
                'Copying Services',
                <>
                  {renderServiceCheckbox(
                    'copy_bw_single',
                    'B&W Single-sided',
                    formatNaira(COPY_SERVICES.BW_SINGLE.pricePerPage) + '/page',
                    formData.copyBWSingle.enabled,
                    formData.copyBWSingle.pages,
                    (enabled) => updateField('copyBWSingle', { ...formData.copyBWSingle, enabled }),
                    (pages) => updateField('copyBWSingle', { ...formData.copyBWSingle, pages })
                  )}
                  {renderServiceCheckbox(
                    'copy_bw_double',
                    'B&W Double-sided',
                    formatNaira(COPY_SERVICES.BW_DOUBLE.pricePerPage) + '/page',
                    formData.copyBWDouble.enabled,
                    formData.copyBWDouble.pages,
                    (enabled) => updateField('copyBWDouble', { ...formData.copyBWDouble, enabled }),
                    (pages) => updateField('copyBWDouble', { ...formData.copyBWDouble, pages })
                  )}
                  {renderServiceCheckbox(
                    'copy_color_single',
                    'Color Single-sided',
                    formatNaira(COPY_SERVICES.COLOR_SINGLE.pricePerPage) + '/page',
                    formData.copyColorSingle.enabled,
                    formData.copyColorSingle.pages,
                    (enabled) => updateField('copyColorSingle', { ...formData.copyColorSingle, enabled }),
                    (pages) => updateField('copyColorSingle', { ...formData.copyColorSingle, pages })
                  )}
                  {renderServiceCheckbox(
                    'copy_color_double',
                    'Color Double-sided',
                    formatNaira(COPY_SERVICES.COLOR_DOUBLE.pricePerPage) + '/page',
                    formData.copyColorDouble.enabled,
                    formData.copyColorDouble.pages,
                    (enabled) => updateField('copyColorDouble', { ...formData.copyColorDouble, enabled }),
                    (pages) => updateField('copyColorDouble', { ...formData.copyColorDouble, pages })
                  )}
                </>
              )}

              {/* Scanning Services */}
              {renderServiceSection(
                'Scanning Services',
                renderServiceCheckbox(
                  'scan_standard',
                  'Standard Scanning',
                  formatNaira(SCAN_SERVICES.STANDARD.pricePerPage) + '/page',
                  formData.scanStandard.enabled,
                  formData.scanStandard.pages,
                  (enabled) => updateField('scanStandard', { ...formData.scanStandard, enabled }),
                  (pages) => updateField('scanStandard', { ...formData.scanStandard, pages })
                )
              )}

              {/* Binding Services */}
              {renderServiceSection(
                'Binding Services',
                <>
                  {renderServiceCheckbox(
                    'binding_comb',
                    'Comb Binding',
                    `Base: ${formatNaira(BINDING_SERVICES.COMB.basePrice)} + ₦2/page`,
                    formData.bindingComb.enabled,
                    formData.bindingComb.pages,
                    (enabled) => updateField('bindingComb', { ...formData.bindingComb, enabled }),
                    (pages) => updateField('bindingComb', { ...formData.bindingComb, pages })
                  )}
                  {renderServiceCheckbox(
                    'binding_wire',
                    'Wire Binding',
                    `Base: ${formatNaira(BINDING_SERVICES.WIRE.basePrice)} + ₦2/page`,
                    formData.bindingWire.enabled,
                    formData.bindingWire.pages,
                    (enabled) => updateField('bindingWire', { ...formData.bindingWire, enabled }),
                    (pages) => updateField('bindingWire', { ...formData.bindingWire, pages })
                  )}
                </>
              )}

              {/* Lamination Services */}
              {renderServiceSection(
                'Lamination Services',
                <>
                  {renderServiceCheckbox(
                    'lamination_a4',
                    'A4 Lamination',
                    formatNaira(LAMINATION_SERVICES.A4.price) + '/item',
                    formData.laminationA4.enabled,
                    formData.laminationA4.quantity,
                    (enabled) => updateField('laminationA4', { ...formData.laminationA4, enabled }),
                    (quantity) => updateField('laminationA4', { ...formData.laminationA4, quantity }),
                    'quantity'
                  )}
                  {renderServiceCheckbox(
                    'lamination_a3',
                    'A3 Lamination',
                    formatNaira(LAMINATION_SERVICES.A3.price) + '/item',
                    formData.laminationA3.enabled,
                    formData.laminationA3.quantity,
                    (enabled) => updateField('laminationA3', { ...formData.laminationA3, enabled }),
                    (quantity) => updateField('laminationA3', { ...formData.laminationA3, quantity }),
                    'quantity'
                  )}
                </>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedServices.map((service, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{service.name}</span>
                      <span className="font-medium">{formatNaira(service.price)}</span>
                    </div>
                  ))}
                  {selectedServices.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No services selected
                    </p>
                  )}
                  {selectedServices.length > 0 && (
                    <>
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between font-semibold">
                          <span>Total</span>
                          <span>{formatNaira(totalPrice)}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
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

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={loading || !isFormValid()}
            >
              {loading ? 'Processing...' : 'Complete Transaction'}
            </Button>
          </div>
        </div>
      </form>

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

export default ComputerService;