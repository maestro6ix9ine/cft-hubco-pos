import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatNaira } from '@/lib/currency';
import { PAYMENT_MODES, PRINT_SERVICES, COPY_SERVICES, SCAN_SERVICES, BINDING_SERVICES, LAMINATION_SERVICES, calculateCashback } from '@/lib/services';
import { Receipt, ReceiptData } from '@/components/ui/receipt';
import { ArrowLeft, Monitor, CreditCard, Calculator } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  type?: string;
}

const ComputerService = () => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    customerPhone: '',
    customerName: '',
    paymentMode: '',
    additionalNotes: '',
  });
  
  const [customer, setCustomer] = useState<any>(null);
  const [selectedServices, setSelectedServices] = useState<ServiceItem[]>([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(false);

  // Service state
  const [printServices, setPrintServices] = useState({
    bw: { enabled: false, pages: 0 },
    color: { enabled: false, pages: 0 },
  });
  
  const [copyServices, setCopyServices] = useState({
    bw_single: { enabled: false, pages: 0 },
    bw_double: { enabled: false, pages: 0 },
    color_single: { enabled: false, pages: 0 },
    color_double: { enabled: false, pages: 0 },
  });
  
  const [scanServices, setScanServices] = useState({
    standard: { enabled: false, pages: 0 },
  });
  
  const [bindingServices, setBindingServices] = useState({
    comb: { enabled: false, pages: 0 },
    wire: { enabled: false, pages: 0 },
  });
  
  const [laminationServices, setLaminationServices] = useState({
    a4: { enabled: false, quantity: 0 },
    a3: { enabled: false, quantity: 0 },
  });

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    if (formData.customerPhone.length >= 10) {
      fetchCustomer();
    } else {
      setCustomer(null);
    }
  }, [formData.customerPhone]);

  useEffect(() => {
    calculateServices();
  }, [printServices, copyServices, scanServices, bindingServices, laminationServices]);

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

  const calculateServices = () => {
    const services: ServiceItem[] = [];

    // Printing services
    if (printServices.bw.enabled && printServices.bw.pages > 0) {
      services.push({
        id: 'print_bw',
        name: `B&W Printing (${printServices.bw.pages} pages)`,
        price: printServices.bw.pages * PRINT_SERVICES.BW.pricePerPage,
        quantity: printServices.bw.pages,
        type: 'printing'
      });
    }
    
    if (printServices.color.enabled && printServices.color.pages > 0) {
      services.push({
        id: 'print_color',
        name: `Color Printing (${printServices.color.pages} pages)`,
        price: printServices.color.pages * PRINT_SERVICES.COLOR.pricePerPage,
        quantity: printServices.color.pages,
        type: 'printing'
      });
    }

    // Copying services
    Object.entries(copyServices).forEach(([key, service]) => {
      if (service.enabled && service.pages > 0) {
        const serviceInfo = COPY_SERVICES[key.toUpperCase() as keyof typeof COPY_SERVICES];
        services.push({
          id: `copy_${key}`,
          name: `${serviceInfo.label} (${service.pages} pages)`,
          price: service.pages * serviceInfo.pricePerPage,
          quantity: service.pages,
          type: 'copying'
        });
      }
    });

    // Scanning services
    if (scanServices.standard.enabled && scanServices.standard.pages > 0) {
      services.push({
        id: 'scan_standard',
        name: `Scanning (${scanServices.standard.pages} pages)`,
        price: scanServices.standard.pages * SCAN_SERVICES.STANDARD.pricePerPage,
        quantity: scanServices.standard.pages,
        type: 'scanning'
      });
    }

    // Binding services
    Object.entries(bindingServices).forEach(([key, service]) => {
      if (service.enabled && service.pages > 0) {
        const serviceInfo = BINDING_SERVICES[key.toUpperCase() as keyof typeof BINDING_SERVICES];
        services.push({
          id: `binding_${key}`,
          name: `${serviceInfo.label} (${service.pages} pages)`,
          price: serviceInfo.basePrice + (service.pages * 2), // Base price + page cost
          quantity: service.pages,
          type: 'binding'
        });
      }
    });

    // Lamination services
    Object.entries(laminationServices).forEach(([key, service]) => {
      if (service.enabled && service.quantity > 0) {
        const serviceInfo = LAMINATION_SERVICES[key.toUpperCase() as keyof typeof LAMINATION_SERVICES];
        services.push({
          id: `lamination_${key}`,
          name: `${serviceInfo.label} (${service.quantity} items)`,
          price: service.quantity * serviceInfo.price,
          quantity: service.quantity,
          type: 'lamination'
        });
      }
    });

    setSelectedServices(services);
  };

  const totalPrice = selectedServices.reduce((sum, service) => sum + service.price, 0);

  const canUseCashback = () => {
    return customer && customer.cashback_balance >= totalPrice && totalPrice > 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.customerPhone || !formData.customerName || !formData.paymentMode) {
        throw new Error('Please fill in all required fields');
      }

      if (selectedServices.length === 0) {
        throw new Error('Please select at least one service');
      }

      if (formData.paymentMode === 'cashback' && !canUseCashback()) {
        throw new Error('Insufficient cashback balance or invalid payment mode');
      }

      const actualAmountPaid = formData.paymentMode === 'cashback' ? 0 : totalPrice;
      const cashbackUsed = formData.paymentMode === 'cashback' ? totalPrice : 0;
      const cashbackEarned = formData.paymentMode === 'cashback' ? 0 : calculateCashback(totalPrice);

      // Generate receipt number
      const { data: receiptNum, error: receiptError } = await supabase
        .rpc('generate_receipt_number');
      
      if (receiptError) throw receiptError;

      const serviceDetails = {
        services: selectedServices.map(service => ({
          name: service.name,
          price: service.price,
          quantity: service.quantity,
          type: service.type
        })),
        totalServices: selectedServices.length
      };

      // Create or update customer
      const { error: customerError } = await supabase
        .from('customers')
        .upsert({
          phone_number: formData.customerPhone,
          customer_name: formData.customerName,
          total_transactions: (customer?.total_transactions || 0) + 1,
          total_spent: (customer?.total_spent || 0) + totalPrice,
          cashback_balance: (customer?.cashback_balance || 0) - cashbackUsed + cashbackEarned,
        });

      if (customerError) throw customerError;

      // Create transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          receipt_number: receiptNum,
          customer_name: formData.customerName,
          customer_phone: formData.customerPhone,
          service_category: 'Computer Services',
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
        serviceCategory: 'Computer Services',
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
        paymentMode: '',
        additionalNotes: '',
      });
      setCustomer(null);
      setSelectedServices([]);
      
      // Reset service states
      setPrintServices({ bw: { enabled: false, pages: 0 }, color: { enabled: false, pages: 0 } });
      setCopyServices({
        bw_single: { enabled: false, pages: 0 },
        bw_double: { enabled: false, pages: 0 },
        color_single: { enabled: false, pages: 0 },
        color_double: { enabled: false, pages: 0 },
      });
      setScanServices({ standard: { enabled: false, pages: 0 } });
      setBindingServices({ comb: { enabled: false, pages: 0 }, wire: { enabled: false, pages: 0 } });
      setLaminationServices({ a4: { enabled: false, quantity: 0 }, a3: { enabled: false, quantity: 0 } });

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
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
                <Monitor className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Computer Services</h1>
                <p className="text-sm text-muted-foreground">Create new computer service transaction</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Customer Information & Services */}
              <div className="lg:col-span-2 space-y-8">
                {/* Customer Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                  </CardContent>
                </Card>

                {/* Service Selection */}
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Printing Services */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Printing Services</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="print_bw"
                            checked={printServices.bw.enabled}
                            onCheckedChange={(checked) => 
                              setPrintServices(prev => ({ 
                                ...prev, 
                                bw: { ...prev.bw, enabled: !!checked } 
                              }))
                            }
                          />
                          <Label htmlFor="print_bw" className="flex-1">
                            B&W ({formatNaira(PRINT_SERVICES.BW.pricePerPage)}/page)
                          </Label>
                          {printServices.bw.enabled && (
                            <Input
                              type="number"
                              min="1"
                              value={printServices.bw.pages || ''}
                              onChange={(e) => 
                                setPrintServices(prev => ({ 
                                  ...prev, 
                                  bw: { ...prev.bw, pages: parseInt(e.target.value) || 0 } 
                                }))
                              }
                              className="w-20"
                              placeholder="Pages"
                            />
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="print_color"
                            checked={printServices.color.enabled}
                            onCheckedChange={(checked) => 
                              setPrintServices(prev => ({ 
                                ...prev, 
                                color: { ...prev.color, enabled: !!checked } 
                              }))
                            }
                          />
                          <Label htmlFor="print_color" className="flex-1">
                            Color ({formatNaira(PRINT_SERVICES.COLOR.pricePerPage)}/page)
                          </Label>
                          {printServices.color.enabled && (
                            <Input
                              type="number"
                              min="1"
                              value={printServices.color.pages || ''}
                              onChange={(e) => 
                                setPrintServices(prev => ({ 
                                  ...prev, 
                                  color: { ...prev.color, pages: parseInt(e.target.value) || 0 } 
                                }))
                              }
                              className="w-20"
                              placeholder="Pages"
                            />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Copying Services */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Copying Services</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        {Object.entries(COPY_SERVICES).map(([key, service]) => {
                          const serviceKey = key.toLowerCase() as keyof typeof copyServices;
                          return (
                            <div key={key} className="flex items-center space-x-2">
                              <Checkbox
                                id={`copy_${serviceKey}`}
                                checked={copyServices[serviceKey].enabled}
                                onCheckedChange={(checked) => 
                                  setCopyServices(prev => ({ 
                                    ...prev, 
                                    [serviceKey]: { ...prev[serviceKey], enabled: !!checked } 
                                  }))
                                }
                              />
                              <Label htmlFor={`copy_${serviceKey}`} className="flex-1 text-sm">
                                {service.label} ({formatNaira(service.pricePerPage)}/page)
                              </Label>
                              {copyServices[serviceKey].enabled && (
                                <Input
                                  type="number"
                                  min="1"
                                  value={copyServices[serviceKey].pages || ''}
                                  onChange={(e) => 
                                    setCopyServices(prev => ({ 
                                      ...prev, 
                                      [serviceKey]: { ...prev[serviceKey], pages: parseInt(e.target.value) || 0 } 
                                    }))
                                  }
                                  className="w-20"
                                  placeholder="Pages"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Scanning Services */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Scanning Services</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="scan_standard"
                          checked={scanServices.standard.enabled}
                          onCheckedChange={(checked) => 
                            setScanServices(prev => ({ 
                              ...prev, 
                              standard: { ...prev.standard, enabled: !!checked } 
                            }))
                          }
                        />
                        <Label htmlFor="scan_standard" className="flex-1">
                          Standard Scan ({formatNaira(SCAN_SERVICES.STANDARD.pricePerPage)}/page)
                        </Label>
                        {scanServices.standard.enabled && (
                          <Input
                            type="number"
                            min="1"
                            value={scanServices.standard.pages || ''}
                            onChange={(e) => 
                              setScanServices(prev => ({ 
                                ...prev, 
                                standard: { ...prev.standard, pages: parseInt(e.target.value) || 0 } 
                              }))
                            }
                            className="w-20"
                            placeholder="Pages"
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Binding & Lamination */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Binding & Lamination</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Binding */}
                      <div className="space-y-3">
                        <h4 className="font-medium">Binding Services</h4>
                        {Object.entries(BINDING_SERVICES).map(([key, service]) => {
                          const serviceKey = key.toLowerCase() as keyof typeof bindingServices;
                          return (
                            <div key={key} className="flex items-center space-x-2">
                              <Checkbox
                                id={`binding_${serviceKey}`}
                                checked={bindingServices[serviceKey].enabled}
                                onCheckedChange={(checked) => 
                                  setBindingServices(prev => ({ 
                                    ...prev, 
                                    [serviceKey]: { ...prev[serviceKey], enabled: !!checked } 
                                  }))
                                }
                              />
                              <Label htmlFor={`binding_${serviceKey}`} className="flex-1 text-sm">
                                {service.label} ({formatNaira(service.basePrice)} + ₦2/page)
                              </Label>
                              {bindingServices[serviceKey].enabled && (
                                <Input
                                  type="number"
                                  min="1"
                                  value={bindingServices[serviceKey].pages || ''}
                                  onChange={(e) => 
                                    setBindingServices(prev => ({ 
                                      ...prev, 
                                      [serviceKey]: { ...prev[serviceKey], pages: parseInt(e.target.value) || 0 } 
                                    }))
                                  }
                                  className="w-20"
                                  placeholder="Pages"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Lamination */}
                      <div className="space-y-3 pt-4 border-t">
                        <h4 className="font-medium">Lamination</h4>
                        {Object.entries(LAMINATION_SERVICES).map(([key, service]) => {
                          const serviceKey = key.toLowerCase() as keyof typeof laminationServices;
                          return (
                            <div key={key} className="flex items-center space-x-2">
                              <Checkbox
                                id={`lamination_${serviceKey}`}
                                checked={laminationServices[serviceKey].enabled}
                                onCheckedChange={(checked) => 
                                  setLaminationServices(prev => ({ 
                                    ...prev, 
                                    [serviceKey]: { ...prev[serviceKey], enabled: !!checked } 
                                  }))
                                }
                              />
                              <Label htmlFor={`lamination_${serviceKey}`} className="flex-1 text-sm">
                                {service.label} ({formatNaira(service.price)}/item)
                              </Label>
                              {laminationServices[serviceKey].enabled && (
                                <Input
                                  type="number"
                                  min="1"
                                  value={laminationServices[serviceKey].quantity || ''}
                                  onChange={(e) => 
                                    setLaminationServices(prev => ({ 
                                      ...prev, 
                                      [serviceKey]: { ...prev[serviceKey], quantity: parseInt(e.target.value) || 0 } 
                                    }))
                                  }
                                  className="w-20"
                                  placeholder="Qty"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Additional Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={formData.additionalNotes}
                      onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                      placeholder="Any additional notes or special instructions"
                      rows={3}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary & Payment */}
              <div className="space-y-6">
                {/* Order Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Order Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedServices.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-4">
                          No services selected
                        </div>
                      ) : (
                        <>
                          {selectedServices.map((service) => (
                            <div key={service.id} className="flex justify-between text-sm">
                              <span className="flex-1">{service.name}</span>
                              <span className="font-medium">{formatNaira(service.price)}</span>
                            </div>
                          ))}
                          <div className="border-t pt-3">
                            <div className="flex justify-between font-bold">
                              <span>Total:</span>
                              <span>{formatNaira(totalPrice)}</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Payment */}
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                          Insufficient cashback balance
                        </div>
                      )}
                    </div>

                    {/* Cashback Information */}
                    {totalPrice > 0 && formData.paymentMode !== 'cashback' && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">
                            Cashback to be earned: {formatNaira(calculateCashback(totalPrice))} (5%)
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Submit */}
                    <Button 
                      type="submit" 
                      className="w-full" 
                      size="lg"
                      disabled={loading || !formData.customerPhone || !formData.customerName || !formData.paymentMode || selectedServices.length === 0}
                    >
                      {loading ? 'Processing...' : `Complete Transaction - ${formatNaira(totalPrice)}`}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
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

export default ComputerService;