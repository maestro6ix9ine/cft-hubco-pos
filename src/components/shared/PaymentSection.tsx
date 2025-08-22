import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatNaira } from '@/lib/currency';
import { calculateCashback, PAYMENT_MODES } from '@/lib/services';
import { CreditCard } from 'lucide-react';

interface Customer {
  cashback_balance: number;
}

interface PaymentSectionProps {
  paymentMode: string;
  additionalNotes: string;
  totalAmount: number;
  customer: Customer | null;
  canUseCashback: boolean;
  onPaymentModeChange: (mode: string) => void;
  onNotesChange: (notes: string) => void;
  loading?: boolean;
}

export const PaymentSection: React.FC<PaymentSectionProps> = ({
  paymentMode,
  additionalNotes,
  totalAmount,
  customer,
  canUseCashback,
  onPaymentModeChange,
  onNotesChange,
  loading = false,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="paymentMode">Payment Mode *</Label>
          <Select 
            value={paymentMode} 
            onValueChange={onPaymentModeChange}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select payment mode" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_MODES.map((mode) => (
                <SelectItem 
                  key={mode.value} 
                  value={mode.value}
                  disabled={mode.value === 'cashback' && !canUseCashback}
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
          {paymentMode === 'cashback' && !canUseCashback && (
            <div className="text-xs text-red-600 mt-1">
              Insufficient cashback balance or customer not found
            </div>
          )}
        </div>

        {/* Cashback Information */}
        {totalAmount > 0 && paymentMode !== 'cashback' && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Cashback to be earned: {formatNaira(calculateCashback(totalAmount))} (5%)
              </span>
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="additionalNotes">Additional Notes (Optional)</Label>
          <Textarea
            id="additionalNotes"
            value={additionalNotes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Any additional notes or special instructions"
            rows={3}
            disabled={loading}
          />
        </div>
      </CardContent>
    </Card>
  );
};