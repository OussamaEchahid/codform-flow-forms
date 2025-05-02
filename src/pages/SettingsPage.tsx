
import React from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShopifyConnectionManager } from '@/components/shopify/ShopifyConnectionManager';

const SettingsPage = () => {
  const { user, shopifyConnected, shop } = useAuth();
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            {user ? (
              <div>
                <p className="mb-2"><strong>User ID:</strong> {user.id}</p>
                {user.email && <p><strong>Email:</strong> {user.email}</p>}
              </div>
            ) : (
              <p>Not logged in</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Shopify Connection</CardTitle>
          </CardHeader>
          <CardContent>
            <ShopifyConnectionManager variant="panel" showStatus={true} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
