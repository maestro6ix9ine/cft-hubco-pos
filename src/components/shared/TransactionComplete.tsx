import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Receipt, ReceiptData } from '@/components/ui/receipt';

interface TransactionCompleteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptData: ReceiptData | null;
  onNewTransaction: () => void;
}

export const TransactionComplete: React.FC<TransactionCompleteProps> = ({
  open,
  onOpenChange,
  receiptData,
  onNewTransaction,
}) => {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            onClick={onNewTransaction}
            className="flex-1"
          >
            New Transaction
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              navigate('/dashboard');
            }}
            className="flex-1"
          >
            Complete & Return to Dashboard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};