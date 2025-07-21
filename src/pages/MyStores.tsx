import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Plus, Settings } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import ShopifyStoresManager from '@/components/shopify/ShopifyStoresManager';

const MyStores = () => {
  const { language } = useI18n();

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {language === 'ar' ? 'متاجري' : 'My Stores'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'ar' 
            ? 'إدارة المتاجر المرتبطة بحسابك'
            : 'Manage your connected stores'
          }
        </p>
      </div>

      <ShopifyStoresManager />
    </div>
  );
};

export default MyStores;