import React, { useEffect } from 'react';
import { useI18n } from '@/lib/i18n';

const setSeo = (title: string, description: string, canonical: string) => {
  document.title = title;
  const metaDesc = document.querySelector('meta[name="description"]') || document.createElement('meta');
  metaDesc.setAttribute('name', 'description');
  metaDesc.setAttribute('content', description);
  document.head.appendChild(metaDesc);

  const linkCanonical = document.querySelector('link[rel="canonical"]') || document.createElement('link');
  linkCanonical.setAttribute('rel', 'canonical');
  linkCanonical.setAttribute('href', canonical);
  document.head.appendChild(linkCanonical);
};

export default function Support() {
  const { language, setLanguage, isRTL } = useI18n();

  const text = language === 'ar' ? {
    title: 'الدعم والمساعدة',
    seoTitle: 'الدعم | COD Magnet',
    seoDesc: 'صفحة الدعم والمساعدة لتطبيق CODMagnet.' ,
    updated: 'آخر تحديث: 26 أغسطس 2025',
    intro: 'نحن هنا لمساعدتك في إعداد وتفعيل CODMagnet على متجر Shopify، ومعالجة أي مشاكل أو استفسارات.',
    channelsTitle: 'قنوات التواصل',
    email: 'البريد الإلكتروني: support@codmagnet.com',
    docs: 'مركز المساعدة: وثائق وإرشادات الاستخدام (قريباً).',
    slaTitle: 'زمن الاستجابة',
    slaText: 'عادة نرد خلال 24-48 ساعة عمل. للأولويات العالية نعمل على تسريع الاستجابة قدر الإمكان.',
  } : {
    title: 'Support',
    seoTitle: 'Support | COD Magnet',
    seoDesc: 'Support and help for CODMagnet.' ,
    updated: 'Last updated: Aug 26, 2025',
    intro: 'We are here to help you set up and activate CODMagnet on your Shopify store and address any issues or questions.',
    channelsTitle: 'Contact Channels',
    email: 'Email: support@codmagnet.com',
    docs: 'Help Center: docs and guides (coming soon).',
    slaTitle: 'Response Time',
    slaText: 'We typically respond within 24–48 business hours. High-priority issues are expedited when possible.',
  };

  useEffect(() => {
    setSeo(text.seoTitle, text.seoDesc, window.location.href);
  }, [language]);

  return (
    <main className="min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 pt-6 flex justify-end">
        <div className="inline-flex rounded-full border bg-white shadow-sm overflow-hidden">
          <button onClick={() => setLanguage('en')} className={`px-4 py-1.5 text-sm transition ${language==='en' ? 'bg-codform-purple text-white' : 'text-gray-700 hover:bg-codform-light-purple/60'}`}>EN</button>
          <button onClick={() => setLanguage('ar')} className={`px-4 py-1.5 text-sm transition border-l ${language==='ar' ? 'bg-codform-purple text-white' : 'text-gray-700 hover:bg-codform-light-purple/60'}`}>AR</button>
        </div>
      </div>

      <section className="bg-gradient-to-b from-codform-light-purple/50 to-white">
        <div className="container mx-auto px-4 py-10 sm:py-14">
          <div className="max-w-3xl mx-auto text-center">
            <div className="mb-2">
              <span className="inline-block text-2xl font-extrabold tracking-widest bg-gradient-to-r from-codform-purple to-codform-dark-purple bg-clip-text text-transparent">CODMAGNET</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-codform-dark-gray">{text.title}</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-2">{text.updated}</p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-3xl mx-auto bg-white border rounded-2xl shadow-sm p-6 sm:p-8">
          <article className="space-y-8 text-gray-700">
            <p className="leading-7">{text.intro}</p>

            <section>
              <h2 className="text-xl font-semibold text-codform-dark-purple mb-3">{text.channelsTitle}</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>{text.email}</li>
                <li>{text.docs}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-codform-dark-purple mb-3">{text.slaTitle}</h2>
              <p>{text.slaText}</p>
            </section>
          </article>
        </div>
      </section>
    </main>
  );
}
