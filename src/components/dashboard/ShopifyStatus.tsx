import React from 'react';
import { useAuth } from '@/components/layout/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Store, CheckCircle, AlertCircle } from 'lucide-react';

export const ShopifyStatus = () => {
  const { shopifyConnected, shop } = useAuth();

  if (!shopifyConnected || !shop) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Shopify Connection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <span className="text-sm text-muted-foreground">No store connected</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5" />
          Shopify Connection
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Connected
            </Badge>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Active Store: </span>
            <span className="font-medium">{shop}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};