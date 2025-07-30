import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageIcon, Clock, Wrench } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import AppSidebar from '@/components/layout/AppSidebar';

const LandingPages = () => {
  const { language, t } = useI18n();

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <AppSidebar />
      
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <ImageIcon className="h-8 w-8 text-primary" />
              {t('landingPagesTitle')}
            </h1>
          </div>

          <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="py-12">
              <div className="text-center space-y-6">
                <div className="mx-auto w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center">
                  <Wrench className="h-12 w-12 text-primary" />
                </div>
                
                <div className="space-y-3">
                  <h2 className="text-2xl font-bold text-primary">
                    {t('comingSoon')}
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-md mx-auto">
                    {t('workInProgress')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LandingPages;