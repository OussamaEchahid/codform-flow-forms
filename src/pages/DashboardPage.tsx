
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { shopifyConnected, shop } = useAuth();
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Forms</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Create and manage your forms</p>
            <Button onClick={() => navigate('/forms')}>
              View Forms
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">View and export form submissions</p>
            <Button onClick={() => navigate('/submissions')}>
              View Submissions
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Shopify</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              {shopifyConnected 
                ? `Connected to ${shop}` 
                : 'Connect your Shopify store'}
            </p>
            <Button onClick={() => navigate('/shopify')}>
              {shopifyConnected ? 'Manage Connection' : 'Connect to Shopify'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
