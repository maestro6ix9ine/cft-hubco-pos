import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatNaira } from '@/lib/currency';
import { Receipt, ReceiptData } from '@/components/ui/receipt';
import { ArrowLeft, Search, FileText, Trash2, Eye, Calendar, Filter } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Transaction {
  id: string;
  receipt_number: string;
  customer_name: string;
  customer_phone: string;
  service_category: string;
  service_details: any;
  total_amount: number;
  payment_mode: string;
  cashback_used: number;
  cashback_earned: number;
  transaction_date: string;
  additional_notes?: string;
  created_at: string;
}

const ReportsPage = () => {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState('');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearAllTransactions = async () => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .gte('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) throw error;

      // Reset customer transaction counts and spent amounts
      await supabase
        .from('customers')
        .update({ 
          total_transactions: 0, 
          total_spent: 0,
          cashback_balance: 0 
        })
        .gte('phone_number', '');

      setTransactions([]);
      setShowPasswordDialog(false);
      setPassword('');
      
      toast({
        title: "Success",
        description: "All transaction history cleared successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear transaction history",
        variant: "destructive",
      });
    }
  };

  const handleClearTransactions = async () => {
    if (!password.trim()) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    // Verify user is authenticated
    if (!user?.email) {
      toast({
        title: "Authentication Required",
        description: "Please log in to perform this action",
        variant: "destructive",
      });
      return;
    }

    // Simple password verification - validates against user's email for basic auth
    // In production, this should be a proper admin role check
    if (password.trim().toLowerCase() !== user.email.toLowerCase()) {
      toast({
        title: "Invalid Email",
        description: "Please enter your correct account email to confirm",
        variant: "destructive",
      });
      return;
    }

    await clearAllTransactions();
  };

  const getFilteredTransactions = () => {
    let filtered = transactions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.customer_phone.includes(searchTerm) ||
        transaction.receipt_number.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Service filter
    if (serviceFilter !== 'all') {
      filtered = filtered.filter(transaction =>
        transaction.service_category === serviceFilter
      );
    }

    // Date filter
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate = new Date();

      switch (dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      filtered = filtered.filter(transaction =>
        new Date(transaction.transaction_date) >= startDate
      );
    }

    return filtered;
  };

  const getTotalStats = () => {
    const filtered = getFilteredTransactions();
    return {
      totalTransactions: filtered.length,
      totalRevenue: filtered.reduce((sum, t) => sum + t.total_amount, 0),
      totalCashback: filtered.reduce((sum, t) => sum + t.cashback_earned, 0),
    };
  };

  const convertToReceiptData = (transaction: Transaction): ReceiptData => ({
    receiptNumber: transaction.receipt_number,
    customerName: transaction.customer_name,
    customerPhone: transaction.customer_phone,
    serviceCategory: transaction.service_category,
    serviceDetails: transaction.service_details,
    totalAmount: transaction.total_amount,
    paymentMode: transaction.payment_mode,
    cashbackUsed: transaction.cashback_used,
    cashbackEarned: transaction.cashback_earned,
    transactionDate: transaction.transaction_date,
    additionalNotes: transaction.additional_notes,
  });

  const filteredTransactions = getFilteredTransactions();
  const stats = getTotalStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold">Reports & Transaction History</h1>
                <p className="text-sm text-muted-foreground">View and manage transaction records</p>
              </div>
            </div>
            
            {/* Clear All Transactions */}
            <AlertDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All History
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear All Transaction History</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will permanently delete ALL transaction history and reset customer balances. 
                    Enter your account email address to confirm this action.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="my-4">
                  <Input
                    type="email"
                    placeholder="Enter your account email address"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => {setPassword(''); setShowPasswordDialog(false);}}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearTransactions}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Clear All History
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Summary Stats */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.totalTransactions}</div>
              <p className="text-sm text-muted-foreground">Filtered results</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{formatNaira(stats.totalRevenue)}</div>
              <p className="text-sm text-muted-foreground">From filtered transactions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Cashback Given</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{formatNaira(stats.totalCashback)}</div>
              <p className="text-sm text-muted-foreground">Total earned by customers</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Transaction List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Transaction History ({filteredTransactions.length})
                </CardTitle>
                <CardDescription>
                  Search and filter transaction records (105-year retention)
                </CardDescription>
                
                {/* Filters */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={serviceFilter} onValueChange={setServiceFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Services</SelectItem>
                      <SelectItem value="Barbing Services">Barbing Services</SelectItem>
                      <SelectItem value="Charging Hub">Charging Hub</SelectItem>
                      <SelectItem value="Computer Services">Computer Services</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">Last 7 Days</SelectItem>
                      <SelectItem value="month">Last 30 Days</SelectItem>
                      <SelectItem value="year">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredTransactions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No transactions found matching your filters.
                    </div>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className={`p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                          selectedTransaction?.id === transaction.id ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => setSelectedTransaction(transaction)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{transaction.receipt_number}</h3>
                            <p className="text-sm text-muted-foreground">
                              {transaction.customer_name} • {transaction.service_category}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(transaction.transaction_date).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{formatNaira(transaction.total_amount)}</div>
                            <div className="text-xs text-muted-foreground">
                              {transaction.payment_mode}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction Details / Receipt */}
          <div>
            {selectedTransaction ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Transaction Details
                  </CardTitle>
                  <CardDescription>
                    Receipt #{selectedTransaction.receipt_number}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Receipt data={convertToReceiptData(selectedTransaction)} />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
                  Select a transaction to view receipt
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReportsPage;