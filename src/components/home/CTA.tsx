
import React from 'react';
import { Button } from '@/components/ui/button';

const CTA = () => {
  return (
    <section className="bg-gradient-to-br from-codform-purple to-codform-dark-purple py-16 text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">ابدأ في إنشاء نماذج الدفع عند الاستلام الآن</h2>
          <p className="text-xl mb-8 text-white/90">
            انضم إلى آلاف المتاجر التي تستخدم CODFORM لتسهيل عملية الدفع عند الاستلام لعملائها
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button className="bg-white text-codform-dark-purple hover:bg-gray-100">
              ابدأ مجانًا
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-white/20">
              طلب عرض توضيحي
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
