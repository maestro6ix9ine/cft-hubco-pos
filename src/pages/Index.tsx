import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Scissors, Zap, Monitor, Shield, Users, FileText } from 'lucide-react';
const Index = () => {
  const features = [{
    icon: Scissors,
    title: 'Barbing Services',
    description: 'Professional haircut transactions with automated pricing'
  }, {
    icon: Zap,
    title: 'Charging Hub',
    description: 'Device charging services with flexible port management'
  }, {
    icon: Monitor,
    title: 'Computer Services',
    description: 'Printing, scanning, binding and lamination services'
  }, {
    icon: Users,
    title: 'Customer Management',
    description: 'Track customers with cashback rewards system'
  }, {
    icon: FileText,
    title: 'Receipt Generation',
    description: 'Thermal printer compatible receipts with download option'
  }, {
    icon: Shield,
    title: 'Admin Security',
    description: 'Secure admin access with comprehensive reporting'
  }];
  return <div className="min-h-screen bg-gradient-hero">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <img 
          src="/lovable-uploads/9365bccb-e434-4674-8f9b-2b175584ce26.png" 
          alt="C.F.T. Hub & Co. Logo" 
          className="h-48 w-48 mx-auto mb-8"
        />
        
        <h1 className="mb-6 text-4xl font-bold text-primary-foreground md:text-6xl">
          C.F.T. Hub & Co.
        </h1>
        
        <p className="mb-8 text-xl text-primary-foreground/90 md:text-2xl max-w-3xl mx-auto">
          Complete Point of Sale System for Barbing, Charging & Computer Services
        </p>
        
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link to="/login">
            <Button size="xl" variant="hero" className="w-full sm:w-auto">
              Admin Login
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 pb-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => <Card key={index} className="bg-card/95 backdrop-blur">
              <CardHeader>
                
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>)}
        </div>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-primary-foreground/70">
        <p>&copy; 2025 C.F.T. Hub & Co. All rights reserved.</p>
      </footer>
    </div>;
};
export default Index;