import React, { useEffect } from 'react';

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
  useEffect(() => {
    setSeo('سياسة الخصوصية | COD Magnet', 'سياسة الخصوصية لتطبيق COD Magnet وطرق حماية بيانات العملاء', window.location.href);
  }, []);

  return (
    <main className="container mx-auto px-4 py-12">
      <article className="prose max-w-3xl mx-auto">
        <h1>سياسة الخصوصية</h1>
        <section>
          <p>
            نلتزم بحماية خصوصيتك. لا نقوم بتخزين أي بيانات حساسة دون موافقتك، ويتم تشفير جميع الاتصالات.
            يمكن طلب حذف البيانات أو تصديرها وفق سياسة GDPR.
          </p>
        </section>
        <section>
          <h2>البيانات التي نجمعها</h2>
          <p>بيانات الطلب الأساسية اللازمة لإتمام عملية الدفع عند الاستلام فقط.</p>
        </section>
        <section>
          <h2>كيفية الاستخدام</h2>
          <p>تُستخدم البيانات لتحسين تجربة الطلب وإدارة الطلبات، ولا تُباع لأي طرف ثالث.</p>
        </section>
      </article>
    </main>
  );
}
