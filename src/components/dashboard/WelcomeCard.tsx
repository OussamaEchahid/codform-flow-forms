
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { ShoppingCart, Settings, Store } from 'lucide-react';

interface WelcomeCardProps {
  userName?: string;
}

const WelcomeCard: React.FC<WelcomeCardProps> = ({ userName }) => {
  const { language, t } = useI18n();
  const navigate = useNavigate();
  const { shopifyConnected, shop, shops } = useAuth();
  
  return (
    <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-none shadow-sm">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">
              {t('welcomeToDashboard')}
            </h2>
            <p className="text-gray-600">
              {shopifyConnected && shop
                ? `${t('connectedToStore')}: ${shop}`
                : t('setupShopifyStore')}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {shops && shops.length > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/shopify-stores')}
                className="flex items-center gap-1"
              >
                <Store className="h-4 w-4 mr-1" />
                {t('manageStores')}
                <span className="inline-flex items-center justify-center rounded-full bg-purple-100 text-purple-800 px-2 py-1 text-xs ml-1">
                  {shops.length}
                </span>
              </Button>
            )}
            
            <Button 
              variant={shopifyConnected ? "outline" : "default"}
              size="sm"
              onClick={() => navigate('/shopify')}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {shopifyConnected ? t('shopifySettings') : t('connectToShopify')}
            </Button>
            
            <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
              <Settings className="h-4 w-4 mr-2" />
              {t('settings')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WelcomeCard;
