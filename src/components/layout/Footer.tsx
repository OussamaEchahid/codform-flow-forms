import React from 'react';
import { useI18n } from '@/lib/i18n';

const Footer = () => {
  const { t } = useI18n();
  
  return (
    <footer className="bg-gray-50 pt-12 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="col-span-1 md:col-span-1">
            <div className="text-2xl font-bold text-codform-purple mb-4">
              <span>COD</span>
              <span className="text-codform-dark-purple">Magnet</span>
            </div>
            <p className="text-gray-600 mb-4 text-right">
              {t('footerDescription')}
            </p>
          </div>
          
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4 text-right">{t('quickLinks')}</h3>
            <ul className="space-y-2 text-right">
              <li><a href="#features" className="text-gray-600 hover:text-codform-purple">{t('features')}</a></li>
              <li><a href="#templates" className="text-gray-600 hover:text-codform-purple">{t('templates')}</a></li>
              <li><a href="#pricing" className="text-gray-600 hover:text-codform-purple">{t('pricing')}</a></li>
            </ul>
          </div>
          
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4 text-right">{t('support')}</h3>
            <ul className="space-y-2 text-right">
              <li><a href="/support" className="text-gray-600 hover:text-codform-purple">{t('support')}</a></li>
              <li><a href="/privacy" className="text-gray-600 hover:text-codform-purple">{t('privacyPolicy')}</a></li>
              <li><a href="/terms" className="text-gray-600 hover:text-codform-purple">{t('termsAndConditions')}</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-12 pt-6">
          <p className="text-gray-500 text-center">© {new Date().getFullYear()} CODMAGNET. {t('allRightsReserved')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;