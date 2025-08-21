import React from 'react';
import { formatNaira } from '@/lib/currency';
import { format } from 'date-fns';

export interface ReceiptData {
  receiptNumber: string;
  customerName: string;
  customerPhone: string;
  serviceCategory: string;
  serviceDetails: any;
  totalAmount: number;
  paymentMode: string;
  cashbackUsed: number;
  cashbackEarned: number;
  transactionDate: string;
  additionalNotes?: string;
}

interface ReceiptProps {
  data: ReceiptData;
  className?: string;
}

export const Receipt = ({ data, className = '' }: ReceiptProps) => {
  const printReceipt = () => {
    window.print();
  };

  const downloadReceipt = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt ${data.receiptNumber}</title>
            <style>
              body { font-family: 'Courier New', monospace; margin: 0; padding: 20px; max-width: 58mm; }
              .receipt { background: white; }
              .header { text-align: center; margin-bottom: 15px; }
              .business-name { font-weight: bold; font-size: 16px; }
              .logo { width: 48px; height: 48px; margin: 0 auto 12px auto; object-fit: contain; }
              .line { border-bottom: 1px dashed #000; margin: 10px 0; }
              .row { display: flex; justify-content: space-between; margin: 5px 0; }
              .total { font-weight: bold; }
              .footer { text-align: center; margin-top: 15px; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            ${document.querySelector('.receipt-content')?.innerHTML || ''}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const renderServiceDetails = () => {
    if (data.serviceCategory === 'Barbing Services') {
      return (
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>Service:</span>
            <span>{data.serviceDetails.serviceType}</span>
          </div>
        </div>
      );
    }
    
    if (data.serviceCategory === 'Charging Hub') {
      return (
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>Device:</span>
            <span>{data.serviceDetails.deviceType}</span>
          </div>
          <div className="flex justify-between">
            <span>Port:</span>
            <span>{data.serviceDetails.portNumber}</span>
          </div>
        </div>
      );
    }
    
    if (data.serviceCategory === 'Computer Services') {
      return (
        <div className="space-y-1">
          {data.serviceDetails.services?.map((service: any, index: number) => (
            <div key={index} className="flex justify-between">
              <span>{service.name}:</span>
              <span>{formatNaira(service.price)}</span>
            </div>
          ))}
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className={`receipt bg-white p-4 max-w-xs mx-auto ${className}`}>
      <div className="receipt-content">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="mb-3">
            <img 
              src="/lovable-uploads/0532acf7-0b68-41b6-924d-f659c98c87a3.png" 
              alt="C.F.T. Hub & Co. Logo" 
              className="w-16 h-16 mx-auto object-contain"
            />
          </div>
          <div className="business-name text-lg font-bold">C.F.T. Hub & Co.</div>
          <div className="text-sm">Point of Sale System</div>
        </div>
        
        <div className="border-b border-dashed border-gray-400 my-3"></div>
        
        {/* Receipt Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Receipt #:</span>
            <span className="font-mono">{data.receiptNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{format(new Date(data.transactionDate), 'dd/MM/yyyy HH:mm')}</span>
          </div>
          <div className="flex justify-between">
            <span>Customer:</span>
            <span>{data.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span>Phone:</span>
            <span>{data.customerPhone}</span>
          </div>
        </div>
        
        <div className="border-b border-dashed border-gray-400 my-3"></div>
        
        {/* Service Details */}
        <div className="space-y-2 text-sm">
          <div className="font-bold">{data.serviceCategory}</div>
          {renderServiceDetails()}
          
          {data.additionalNotes && (
            <div className="mt-2">
              <div className="text-xs text-gray-600">Notes:</div>
              <div className="text-xs">{data.additionalNotes}</div>
            </div>
          )}
        </div>
        
        <div className="border-b border-dashed border-gray-400 my-3"></div>
        
        {/* Payment Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatNaira(data.totalAmount + data.cashbackUsed)}</span>
          </div>
          
          {data.cashbackUsed > 0 && (
            <div className="flex justify-between">
              <span>Cashback Used:</span>
              <span>-{formatNaira(data.cashbackUsed)}</span>
            </div>
          )}
          
          <div className="flex justify-between font-bold">
            <span>Total Paid:</span>
            <span>{formatNaira(data.totalAmount)}</span>
          </div>
          
          <div className="flex justify-between">
            <span>Payment Mode:</span>
            <span>{data.paymentMode}</span>
          </div>
          
          {data.cashbackEarned > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Cashback Earned:</span>
              <span>+{formatNaira(data.cashbackEarned)}</span>
            </div>
          )}
        </div>
        
        <div className="border-b border-dashed border-gray-400 my-3"></div>
        
        {/* Footer */}
        <div className="text-center text-xs">
          <div className="font-bold">Thank You!</div>
          <div>Visit us again soon</div>
        </div>
      </div>
      
      {/* Print/Download Buttons */}
      <div className="flex gap-2 mt-4 print:hidden">
        <button
          onClick={printReceipt}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
        >
          Print Receipt
        </button>
        <button
          onClick={downloadReceipt}
          className="flex-1 bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
        >
          Download
        </button>
      </div>
    </div>
  );
};