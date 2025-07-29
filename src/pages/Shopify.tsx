
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

const Shopify = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-slate-800">
            🏪 اتصال المتجر
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="space-y-4">
            <p className="text-slate-600 leading-relaxed">
              يجب عليك فتح هذا التطبيق من داخل لوحة تحكم متجرك في Shopify
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm font-medium">
                📍 كيفية الوصول:
              </p>
              <p className="text-blue-700 text-xs mt-1">
                Shopify Admin → Apps → اسم التطبيق
              </p>
            </div>
          </div>
          
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.open('https://admin.shopify.com', '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            فتح Shopify Admin
          </Button>
          
          <p className="text-xs text-slate-500">
            بعد فتح التطبيق من داخل المتجر، ستتمكن من الوصول لجميع الميزات
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Shopify;
