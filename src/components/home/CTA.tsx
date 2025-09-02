import React from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

const CTA = () => {
  const { t } = useI18n();
  
  return (
    <section className="bg-gradient-to-br from-codform-purple to-codform-dark-purple py-16 text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">{t('ctaTitle')}</h2>
          <p className="text-xl mb-8 text-white/90">{t('ctaDescription')}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button className="bg-white text-codform-dark-purple hover:bg-gray-100">
              {t('ctaStartFree')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;