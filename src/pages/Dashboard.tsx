import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Scissors, Zap, Monitor, FileText, LogOut, Users } from 'lucide-react';

const Dashboard = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

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
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                <Scissors className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">C.F.T. Hub & Co.</h1>
                <p className="text-sm text-muted-foreground">Point of Sale System</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/customers')}
              >
                <Users className="mr-2 h-4 w-4" />
                Customers
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/reports')}
              >
                <FileText className="mr-2 h-4 w-4" />
                Reports
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
              >
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
          {services.map((service) => (
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
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Today's Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">₦0</div>
              <p className="text-sm text-muted-foreground">0 transactions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">0</div>
              <p className="text-sm text-muted-foreground">Registered customers</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Cashback Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">₦0</div>
              <p className="text-sm text-muted-foreground">Total outstanding</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;