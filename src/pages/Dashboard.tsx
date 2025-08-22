import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Scissors, Zap, Monitor, FileText, LogOut, Users } from 'lucide-react';

const Dashboard = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [todayStats, setTodayStats] = useState({
    revenue: 0,
    count: 0
  });
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [loading, setLoading] = useState(true);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  const fetchTodayTransactions = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('transactions')
      .select('total_amount')
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`);
    
    if (error) {
      console.error('Error fetching today transactions:', error);
      return { revenue: 0, count: 0 };
    }
    
    const count = data?.length || 0;
    const revenue = data?.reduce((sum, transaction) => sum + (transaction.total_amount || 0), 0) || 0;
    return { revenue, count };
  };
  const fetchTotalCustomers = async () => {
    const { count, error } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error fetching customers count:', error);
      return 0;
    }
    return count || 0;
  };
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [todayData, customersCount] = await Promise.all([fetchTodayTransactions(), fetchTotalCustomers()]);
      setTodayStats(todayData);
      setTotalCustomers(customersCount);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadDashboardData();
  }, []);
  const services = [
    {
      id: 'barbing',
      title: 'Barbing Services',
      description: 'Haircut transactions and styling services',
      icon: Scissors,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      route: '/services/barbing'
    },
    {
      id: 'charging',
      title: 'Charging Hub',
      description: 'Device charging and power services',
      icon: Zap,
      color: 'bg-gradient-to-br from-yellow-500 to-orange-500',
      route: '/services/charging'
    },
    {
      id: 'computer',
      title: 'Computer Services',
      description: 'Printing, scanning, binding & lamination',
      icon: Monitor,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      route: '/services/computer'
    }
  ];
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/23b84302-c8a3-4405-9e1b-e26fb7b0de40.png" 
                alt="C.F.T. Hub & Co. Logo" 
                className="h-32 w-32"
              />
              <div>
                <h1 className="text-xl font-bold">C.F.T. Hub & Co.</h1>
                <p className="text-sm text-muted-foreground">Point of Sale System</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/customers')}>
                <Users className="mr-2 h-4 w-4" />
                Customers
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/reports')}>
                <FileText className="mr-2 h-4 w-4" />
                Reports
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Service Dashboard</h2>
          <p className="text-muted-foreground">Select a service to create new transactions</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map(service => (
            <Card 
              key={service.id} 
              className="cursor-pointer transition-all hover:scale-105 hover:shadow-strong" 
              onClick={() => navigate(service.route)}
            >
              <CardHeader className="pb-4">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${service.color} mb-4`}>
                  <service.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">{service.title}</CardTitle>
                <CardDescription>{service.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="hero">
                  Start Transaction
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Today's Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-3xl font-bold text-muted-foreground">Loading...</div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-primary">₦{todayStats.revenue.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground">{todayStats.count} transactions</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Customers</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-3xl font-bold text-muted-foreground">Loading...</div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-primary">{totalCustomers}</div>
                  <p className="text-sm text-muted-foreground">Registered customers</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};
export default Dashboard;