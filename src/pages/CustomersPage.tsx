import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatNaira } from '@/lib/currency';
import { ArrowLeft, Search, Trash2, Phone, User, CreditCard } from 'lucide-react';
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

interface Customer {
  phone_number: string;
  customer_name: string;
  total_transactions: number;
  total_spent: number;
  cashback_balance: number;
  created_at: string;
  updated_at: string;
}

const CustomersPage = () => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomer = async (phoneNumber: string) => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('phone_number', phoneNumber);

      if (error) throw error;

      setCustomers(customers.filter(c => c.phone_number !== phoneNumber));
      setSelectedCustomer(null);
      
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete customer",
        variant: "destructive",
      });
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone_number.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">Loading customers...</div>
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
                <h1 className="text-xl font-bold">Customer Management</h1>
                <p className="text-sm text-muted-foreground">View and manage customer records</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Customer List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>All Customers ({filteredCustomers.length})</CardTitle>
                <CardDescription>
                  Search and manage customer records
                </CardDescription>
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or phone number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredCustomers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'No customers found matching your search.' : 'No customers registered yet.'}
                    </div>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <div
                        key={customer.phone_number}
                        className={`p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                          selectedCustomer?.phone_number === customer.phone_number ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{customer.customer_name}</h3>
                            <p className="text-sm text-muted-foreground">{customer.phone_number}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{formatNaira(customer.total_spent)}</div>
                            <div className="text-xs text-muted-foreground">
                              {customer.total_transactions} transactions
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

          {/* Customer Details */}
          <div>
            {selectedCustomer ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Customer Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Name</label>
                    <div className="font-medium">{selectedCustomer.customer_name}</div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      Phone Number
                    </label>
                    <div className="font-medium">{selectedCustomer.phone_number}</div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-muted-foreground">Total Transactions</label>
                    <div className="font-medium">{selectedCustomer.total_transactions}</div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-muted-foreground">Total Spent</label>
                    <div className="font-medium text-green-600">{formatNaira(selectedCustomer.total_spent)}</div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-muted-foreground flex items-center gap-1">
                      <CreditCard className="h-3 w-3" />
                      Cashback Balance
                    </label>
                    <div className="font-medium text-blue-600">{formatNaira(selectedCustomer.cashback_balance)}</div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-muted-foreground">Customer Since</label>
                    <div className="font-medium">
                      {new Date(selectedCustomer.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {/* Delete Customer */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="w-full">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Customer
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Customer</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete <strong>{selectedCustomer.customer_name}</strong>? 
                          This will permanently remove all customer data and transaction history. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteCustomer(selectedCustomer.phone_number)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Delete Customer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
                  Select a customer to view details
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomersPage;