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

export default function Terms() {
  const { language, setLanguage, isRTL } = useI18n();

  const text = language === 'ar' ? {
    title: 'الشروط والأحكام',
    seoTitle: 'الشروط والأحكام | COD Magnet',
    seoDesc: 'الشروط والأحكام الخاصة باستخدام CODMagnet.' ,
    updated: 'آخر تحديث: 26 أغسطس 2025',
    intro: 'باستخدامك تطبيق CODMagnet فإنك توافق على الشروط التالية التي تنظّم استخدامك للخدمة وقد يتم تحديثها من وقت لآخر.',
    licenseTitle: 'الترخيص والاستخدام',
    licenseText: 'يُمنح لك ترخيص محدود وغير حصري لاستخدام التطبيق بما يتوافق مع هذه الشروط وقوانين Shopify وسياساته.',
    paymentTitle: 'الخطط والدفع',
    paymentText: 'قد تتطلب بعض الميزات اشتراكاً مدفوعاً.قد تُطبّق شروط إضافية على عمليات الدفع والاشتراكات.',
    acceptableUseTitle: 'الاستخدام المقبول',
    acceptableUseText: 'لا يجوز إساءة استخدام الخدمة أو محاولة التحايل على أنظمة الأمان، أو استخدام التطبيق بشكل ينتهك القوانين أو حقوق الآخرين.',
    terminationTitle: 'الإنهاء',
    terminationText: 'يجوز لنا تعليق أو إنهاء الوصول للتطبيق عند انتهاك الشروط أو إساءة الاستخدام.',
    liabilityTitle: 'المسؤولية',
    liabilityText: 'يتم تقديم الخدمة كما هي ضمن الحدود التي يسمح بها القانون دون أي ضمانات صريحة أو ضمنية.',
    contactTitle: 'التواصل',
    contactText: 'للاستفسارات: support@codmagnet.com'
  } : {
    title: 'Terms & Conditions',
    seoTitle: 'Terms & Conditions | COD Magnet',
    seoDesc: 'The terms and conditions for using CODMagnet.',
    updated: 'Last updated: Aug 26, 2025',
    intro: 'By using CODMagnet, you agree to the following terms that govern your use of the service and may be updated from time to time.',
    licenseTitle: 'License & Use',
    licenseText: 'You are granted a limited, non-exclusive license to use the app in accordance with these terms and Shopify’s policies.',
    paymentTitle: 'Plans & Payments',
    paymentText: 'Some features may require a paid subscription. Additional terms may apply to billing and subscriptions.',
    acceptableUseTitle: 'Acceptable Use',
    acceptableUseText: 'You must not misuse the service, attempt to bypass security, or use the app in ways that violate laws or the rights of others.',
    terminationTitle: 'Termination',
    terminationText: 'We may suspend or terminate access for violations of these terms or abusive behavior.',
    liabilityTitle: 'Liability',
    liabilityText: 'The service is provided “as is” to the extent permitted by law, without warranties of any kind.',
    contactTitle: 'Contact',
    contactText: 'For inquiries: support@codmagnet.com'
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
              <h2 className="text-xl font-semibold text-codform-dark-purple mb-3">{text.licenseTitle}</h2>
              <p>{text.licenseText}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-codform-dark-purple mb-3">{text.paymentTitle}</h2>
              <p>{text.paymentText}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-codform-dark-purple mb-3">{text.acceptableUseTitle}</h2>
              <p>{text.acceptableUseText}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-codform-dark-purple mb-3">{text.terminationTitle}</h2>
              <p>{text.terminationText}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-codform-dark-purple mb-3">{text.liabilityTitle}</h2>
              <p>{text.liabilityText}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-codform-dark-purple mb-3">{text.contactTitle}</h2>
              <p>{text.contactText}</p>
            </section>
          </article>
        </div>
      </section>
    </main>
  );
}
