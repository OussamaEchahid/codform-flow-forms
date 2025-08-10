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

export default function Terms() {
  useEffect(() => {
    setSeo('الشروط والأحكام | COD Magnet', 'الشروط والأحكام لاستخدام COD Magnet', window.location.href);
  }, []);

  return (
    <main className="container mx-auto px-4 py-12">
      <article className="prose max-w-3xl mx-auto">
        <h1>الشروط والأحكام</h1>
        <section>
          <p>
            باستخدامك للتطبيق فإنك توافق على الشروط التالية، بما في ذلك سياسة الخصوصية وسياسة الاستخدام المقبول.
          </p>
        </section>
      </article>
    </main>
  );
}
