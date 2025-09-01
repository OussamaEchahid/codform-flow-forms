import React from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { ShoppingBag } from 'lucide-react';
import FormCarousel from './FormCarousel';

const EnhancedHero: React.FC = () => {
  const { language } = useI18n();

  const t = {
    title1: language === 'ar' ? 'بِناء نماذج الدفع' : 'Build Payment Forms',
    title2: language === 'ar' ? 'نقداً عند الاستلام' : 'Cash on Delivery',
    subtitle:
      language === 'ar'
        ? 'تطبيق متكامل لنماذج الدفع وصفحات الهبوط — تحكم كامل وسهولة في الإعداد'
        : 'The complete app for COD forms & landing pages — full control and easy setup',
    install: language === 'ar' ? 'تثبيت على Shopify' : 'Install on Shopify',
    domain: language === 'ar' ? 'codmagnet.com' : 'codmagnet.com',
  };

  return (
    <section className="bg-gradient-to-br from-codform-light-purple to-white py-14">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-10">
          {/* Text column */}
          <div className={`${language === 'ar' ? 'lg:order-2 text-right' : 'lg:order-1 text-left'}`}>
            <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight">
              <span className="block bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">{t.title1}</span>
              <span className="block bg-gradient-to-r from-emerald-500 to-green-600 bg-clip-text text-transparent mt-2">{t.title2}</span>
            </h1>
            <p className="text-gray-600 mt-4 text-lg">
              {t.subtitle}
            </p>

            <div className={`mt-8 flex items-center gap-4 ${language === 'ar' ? 'justify-start lg:justify-end' : 'justify-start'}`}>
              {/* Single CTA button */}
              <Button className="px-6 py-5 rounded-2xl text-base shadow-xl" asChild>
                <a href="/shopify" className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  <span>{t.install}</span>
                </a>
              </Button>

              {/* Domain badge */}
              <span className="px-4 py-2 rounded-xl border bg-white/70 backdrop-blur text-gray-700 text-sm">
                {t.domain}
              </span>
            </div>

            {/* Feature chips */}
            <div className="mt-8 flex flex-wrap gap-2 text-sm text-gray-700">
              <span className="px-4 py-2 rounded-full bg-white border">Google Sheet sync</span>
              <span className="px-4 py-2 rounded-full bg-white border">Drag & Drop</span>
              <span className="px-4 py-2 rounded-full bg-white border">Abandoned orders control</span>
              <span className="px-4 py-2 rounded-full bg-white border">Customizable</span>
            </div>
          </div>

          {/* Carousel column */}
          <div className={`${language === 'ar' ? 'lg:order-1' : 'lg:order-2'}`}>
            <FormCarousel />
          </div>
        </div>
      </div>
    </section>
  );
};

export default EnhancedHero;

