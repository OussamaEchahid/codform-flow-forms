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

export default function Privacy() {
  const { language, setLanguage, isRTL } = useI18n();

  const text = language === 'ar' ? {
    title: 'سياسة الخصوصية',
    seoTitle: 'سياسة الخصوصية | COD Magnet',
    seoDesc: 'سياسة الخصوصية لتطبيق CODMagnet - إدارة نماذج الدفع عند الاستلام والـ Upsells مع حماية بيانات العملاء.',
    updated: 'آخر تحديث: 26 أغسطس 2025',
    intro: 'في CODMagnet نحترم خصوصيتك ونلتزم بحماية بياناتك. تم تصميم تطبيقنا لمساعدة تجار Shopify على إنشاء نماذج الدفع عند الاستلام (COD) وإضافة العروض (Upsells) واسترجاع السلات المهجورة وتتبع الأحداث — مع جمع أقل قدر ممكن من البيانات اللازمة لتشغيل الخدمة.',
    collectTitle: 'البيانات التي نجمعها',
    collectItems: [
      'بيانات الطلب الأساسية: الاسم، رقم الهاتف، العنوان، تفاصيل المنتج والكمية — بحسب الحقول التي يحددها التاجر في النموذج.',
      'بيانات المتجر والمنتجات المرتبطة بالنماذج لتفعيل الميزات مثل عروض الكمية وUpsells.',
      'معلومات تقنية واستخدامية أساسية لتحسين الأداء ومنع إساءة الاستخدام (مثل عنوان IP العام، نوع المتصفح، صفحات الزيارة).',
      'أحداث القياس والتسويق عند تفعيل التتبع (Google Analytics, Facebook, TikTok).',
      'بيانات السلات المهجورة إذا فعّل التاجر هذه الميزة لاسترجاع الطلبات.'
    ],
    useTitle: 'كيفية استخدامنا للبيانات',
    useItems: [
      'إنشاء وإدارة طلبات الدفع عند الاستلام وربطها بمنتجات Shopify.',
      'تخصيص النماذج والعروض وتتبّع الأداء والتقارير.',
      'استرجاع السلات المهجورة وتحسين تجربة الشراء.',
      'الامتثال للالتزامات القانونية والاستجابة لطلبات الدعم.'
    ],
    legalTitle: 'الأساس القانوني للمعالجة',
    legalText: 'نعالج البيانات وفق أحد الأسس القانونية التالية: تنفيذ العقد مع التاجر؛ المصلحة المشروعة لتحسين الخدمة ومنع الاحتيال؛ أو الموافقة الصريحة عندما يتطلب ذلك (مثل التتبّع التسويقي في بعض المناطق).',
    cookiesTitle: 'ملفات تعريف الارتباط والتتبّع',
    cookiesText: 'قد نستخدم ملفات تعريف الارتباط وتقنيات مشابهة لتشغيل الميزات الأساسية وتحليلات الاستخدام. وعند تفعيل المقتطفات (Google/Meta/TikTok)، قد تُعالج هذه الجهات بيانات وفق سياساتها. يمكنك إدارة التتبع من إعدادات التطبيق أو متصفحك.',
    shareTitle: 'مشاركة البيانات',
    shareText: 'لا نبيع بياناتك. قد نشارك بيانات محدودة مع مزودي خدمة بالنيابة عنّا (الاستضافة، قواعد البيانات، التحليلات) بما يقتضيه تشغيل التطبيق، مع التزامهم باتفاقيات حماية البيانات.',
    retentionTitle: 'الاحتفاظ بالبيانات',
    retentionText: 'نحتفظ بالبيانات طالما كان ذلك ضرورياً لتقديم الخدمة ولأغراض قانونية/محاسبية. يمكن للتاجر طلب حذف أو تصدير البيانات وفق القوانين المعمول بها.',
    securityTitle: 'الأمان',
    securityText: 'نعتمد ممارسات أمان مناسبة لحماية البيانات، بما في ذلك التشفير أثناء النقل. رغم ذلك لا توجد وسيلة نقل/تخزين إلكتروني آمنة تماماً.',
    rightsTitle: 'حقوقك',
    rightsText: 'بحسب ولايتك القانونية، قد تملك حقوق الوصول، التصحيح، الحذف، الاعتراض، تقييد المعالجة، وقابلية النقل. لطلب ذلك يُرجى التواصل معنا أو عبر التاجر إن كنت عميلاً لمتجر.',
    transfersTitle: 'النقل عبر الحدود',
    transfersText: 'قد تُنقل البيانات إلى خوادم خارج بلدك. نتخذ إجراءات مناسبة لضمان حماية البيانات عند هذا النقل.',
    childrenTitle: 'خصوصية الأطفال',
    childrenText: 'لا يستهدف التطبيق الأطفال دون 13/16 عاماً (حسب الولاية).',
    changesTitle: 'تغييرات على هذه السياسة',
    changesText: 'قد نُحدّث هذه السياسة من وقت لآخر. سننشر النسخة المحدثة مع تاريخ السريان.',
    contactTitle: 'التواصل',
    contactText: 'للاستفسارات أو طلبات الخصوصية: support@codmagnet.com'
  } : {
    title: 'Privacy Policy',
    seoTitle: 'Privacy Policy | COD Magnet',
    seoDesc: 'CODMagnet Privacy Policy — COD forms, Upsells, Abandoned carts, and analytics with customer data protection.',
    updated: 'Last updated: Aug 26, 2025',
    intro: 'At CODMagnet, we respect your privacy and are committed to protecting your data. Our app helps Shopify merchants create cash‑on‑delivery (COD) forms, add Upsells & Quantity Offers, recover abandoned carts, and track events — while collecting only the minimum data necessary to operate the service.',
    collectTitle: 'Data We Collect',
    collectItems: [
      'Order basics: name, phone, address, product details and quantities — based on the fields the merchant configures in the form.',
      'Store and product metadata linked to forms to enable features like quantity offers and upsells.',
      'Basic technical and usage information to improve performance and prevent abuse (e.g., public IP, browser type, visited pages).',
      'Marketing and analytics events when tracking is enabled (Google Analytics, Facebook, TikTok).',
      'Abandoned cart data if the merchant enables recovery features.'
    ],
    useTitle: 'How We Use Data',
    useItems: [
      'Create and manage COD orders and link them to Shopify products.',
      'Customize forms and offers, track performance, and generate reports.',
      'Recover abandoned carts and improve the buying experience.',
      'Comply with legal obligations and respond to support requests.'
    ],
    legalTitle: 'Legal Basis',
    legalText: 'We process data under one or more legal bases: contract performance with the merchant; legitimate interests to improve the service and prevent fraud; or explicit consent where required (e.g., marketing trackers in certain regions).',
    cookiesTitle: 'Cookies and Tracking',
    cookiesText: 'We may use cookies and similar technologies for essential features and usage analytics. When Google/Meta/TikTok snippets are enabled, those providers may process data under their own policies. You can manage tracking from the app settings or your browser.',
    shareTitle: 'Data Sharing',
    shareText: 'We do not sell your data. We may share limited data with service providers acting on our behalf (hosting, database, analytics) as needed to run the app, under data protection agreements.',
    retentionTitle: 'Data Retention',
    retentionText: 'We retain data as long as necessary to provide the service and for legal/accounting obligations. Merchants can request deletion or export in accordance with applicable laws.',
    securityTitle: 'Security',
    securityText: 'We apply appropriate security practices to protect data, including encryption in transit. However, no method of electronic transmission or storage is 100% secure.',
    rightsTitle: 'Your Rights',
    rightsText: 'Depending on your jurisdiction, you may have rights to access, rectify, delete, object, restrict processing, and data portability. To exercise these rights, contact us or the merchant if you are a store customer.',
    transfersTitle: 'International Transfers',
    transfersText: 'Data may be transferred to servers outside your country. We take appropriate measures to protect data during such transfers.',
    childrenTitle: "Children's Privacy",
    childrenText: 'Our app is not directed to children under 13/16 (depending on jurisdiction).',
    changesTitle: 'Changes to this Policy',
    changesText: 'We may update this policy from time to time. We will post the updated version with its effective date.',
    contactTitle: 'Contact',
    contactText: 'For privacy inquiries or requests: support@codmagnet.com'
  };

  useEffect(() => {
    setSeo(text.seoTitle, text.seoDesc, window.location.href);
  }, [language]);

  return (
    <main className="min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Language Toggle */}
      <div className="container mx-auto px-4 pt-6 flex justify-end">
        <div className="inline-flex rounded-full border bg-white shadow-sm overflow-hidden">
          <button
            onClick={() => setLanguage('en')}
            className={`px-4 py-1.5 text-sm transition ${language==='en' ? 'bg-codform-purple text-white' : 'text-gray-700 hover:bg-codform-light-purple/60'}`}
          >EN</button>
          <button
            onClick={() => setLanguage('ar')}
            className={`px-4 py-1.5 text-sm transition border-l ${language==='ar' ? 'bg-codform-purple text-white' : 'text-gray-700 hover:bg-codform-light-purple/60'}`}
          >AR</button>
        </div>
      </div>

      {/* Hero */}
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

      {/* Content Card */}
      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-3xl mx-auto bg-white border rounded-2xl shadow-sm p-6 sm:p-8">
          <article className="space-y-8 text-gray-700">
            <p className="leading-7">{text.intro}</p>

            <section>
              <h2 className="text-xl font-semibold text-codform-dark-purple mb-3">{text.collectTitle}</h2>
              <ul className="list-disc pl-6 space-y-1">
                {text.collectItems.map((item, i) => (<li key={i}>{item}</li>))}
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-codform-dark-purple mb-3">{text.useTitle}</h2>
              <ul className="list-disc pl-6 space-y-1">
                {text.useItems.map((item, i) => (<li key={i}>{item}</li>))}
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-codform-dark-purple mb-2">{text.legalTitle}</h2>
              <p>{text.legalText}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-codform-dark-purple mb-2">{text.cookiesTitle}</h2>
              <p>{text.cookiesText}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-codform-dark-purple mb-2">{text.shareTitle}</h2>
              <p>{text.shareText}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-codform-dark-purple mb-2">{text.retentionTitle}</h2>
              <p>{text.retentionText}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-codform-dark-purple mb-2">{text.securityTitle}</h2>
              <p>{text.securityText}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-codform-dark-purple mb-2">{text.rightsTitle}</h2>
              <p>{text.rightsText}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-codform-dark-purple mb-2">{text.transfersTitle}</h2>
              <p>{text.transfersText}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-codform-dark-purple mb-2">{text.childrenTitle}</h2>
              <p>{text.childrenText}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-codform-dark-purple mb-2">{text.changesTitle}</h2>
              <p>{text.changesText}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-codform-dark-purple mb-2">{text.contactTitle}</h2>
              <p>{text.contactText}</p>
            </section>
          </article>
        </div>
      </section>
    </main>
  );
}
