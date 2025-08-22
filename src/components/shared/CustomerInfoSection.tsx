import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatNaira } from '@/lib/currency';

interface Customer {
  phone_number: string;
  customer_name: string;
  total_transactions: number;
  total_spent: number;
  cashback_balance: number;
}

interface CustomerInfoSectionProps {
  phoneNumber: string;
  customerName: string;
  customer: Customer | null;
  onPhoneChange: (phone: string) => void;
  onNameChange: (name: string) => void;
  loading?: boolean;
}

export const CustomerInfoSection: React.FC<CustomerInfoSectionProps> = ({
  phoneNumber,
  customerName,
  customer,
  onPhoneChange,
  onNameChange,
  loading = false,
}) => {
  return (
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
              value={phoneNumber}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="Enter phone number"
              required
              disabled={loading}
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
              value={customerName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Enter customer name"
              required
              disabled={loading}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};