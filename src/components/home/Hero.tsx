
import React from 'react';
import { Button } from '@/components/ui/button';

const Hero = () => {
  return (
    <section className="bg-gradient-to-br from-codform-light-purple to-white py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row-reverse items-center">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <div className="text-right">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                أنشئ نماذج الدفع عند الاستلام بسهولة
              </h1>
              <p className="text-xl text-gray-700 mb-8">
                منصة متكاملة لإنشاء نماذج مخصصة للدفع عند الاستلام تتكامل مع متاجر Shopify بكل سهولة
              </p>
              <div className="flex justify-end space-x-4 rtl:space-x-reverse">
                <Button variant="outline">معرفة المزيد</Button>
                <Button>ابدأ الآن مجانًا</Button>
              </div>
            </div>
          </div>
          
          <div className="md:w-1/2">
            <div className="bg-white rounded-lg shadow-xl p-6 transform rotate-1 md:rotate-2">
              <div className="h-2 bg-gray-100 rounded-t mb-4">
                <div className="h-full w-3/5 bg-gradient-to-r from-codform-purple to-codform-dark-purple rounded-tl"></div>
              </div>
              <div className="space-y-4 text-right">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                    placeholder="أدخل الاسم الكامل"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                    placeholder="05xxxxxxxx"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المدينة</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
                    <option value="">اختر المدينة</option>
                    <option value="riyadh">الرياض</option>
                    <option value="jeddah">جدة</option>
                    <option value="dammam">الدمام</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
