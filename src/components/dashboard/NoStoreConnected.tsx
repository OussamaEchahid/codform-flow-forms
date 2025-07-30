import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Store, ArrowRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const NoStoreConnected: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useI18n();

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 text-center shadow-elegant">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/20 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {t('welcomeToCODmagnet')}
          </h1>
          <p className="text-muted-foreground text-lg">
            {t('accountCreatedSuccessfully')}
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Store className="w-6 h-6 text-primary" />
            <h2 className="text-lg font-semibold">{t('whyConnectStore')}</h2>
          </div>
          <ul className={`space-y-3 text-muted-foreground ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            <li className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
              <span>{t('createCustomCODForms')}</span>
            </li>
            <li className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
              <span>{t('linkFormsToProducts')}</span>
            </li>
            <li className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
              <span>{t('trackOrdersAndStats')}</span>
            </li>
            <li className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
              <span>{t('manageOffersAndDiscounts')}</span>
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('connectShopifyForBestExperience')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => navigate('/shopify')}
              className="bg-primary hover:bg-primary/90"
              size="lg"
            >
              <Store className="w-4 h-4 mr-2" />
              {t('connectShopifyStore')}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => navigate('/profile')}
              size="lg"
            >
              {t('setupProfile')}
            </Button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {t('alreadyHaveShopifyStore')}
            <Button 
              variant="link" 
              className="text-xs p-0 h-auto font-normal"
              onClick={() => window.open('https://apps.shopify.com', '_blank')}
            >
              {t('downloadFromAppStore')}
            </Button>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default NoStoreConnected;