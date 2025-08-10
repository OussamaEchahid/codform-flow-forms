import React from 'react';
import { Button } from '@/components/ui/button';
const Footer = () => {
  return <footer className="bg-gray-50 pt-12 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <div className="text-2xl font-bold text-codform-purple mb-4">
              <span>COD</span>
              <span className="text-codform-dark-purple">Magnet</span>
            </div>
            <p className="text-gray-600 mb-4 text-right">
              منصة نماذج متخصصة للدفع عند الاستلام (Cash on Delivery) مصممة خصيصًا للتكامل مع متاجر Shopify.
            </p>
          </div>
          
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4 text-right">روابط سريعة</h3>
            <ul className="space-y-2 text-right">
              <li><a href="#features" className="text-gray-600 hover:text-codform-purple">المميزات</a></li>
              <li><a href="#templates" className="text-gray-600 hover:text-codform-purple">القوالب</a></li>
              <li><a href="#pricing" className="text-gray-600 hover:text-codform-purple">الأسعار</a></li>
            </ul>
          </div>
          
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4 text-right">الدعم</h3>
            <ul className="space-y-2 text-right">
              <li><a href="/support" className="text-gray-600 hover:text-codform-purple">الدعم</a></li>
              <li><a href="/privacy" className="text-gray-600 hover:text-codform-purple">سياسة الخصوصية</a></li>
              <li><a href="/terms" className="text-gray-600 hover:text-codform-purple">الشروط والأحكام</a></li>
            </ul>
          </div>
          
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4 text-right">النشرة البريدية</h3>
            <p className="text-gray-600 mb-4 text-right">اشترك للحصول على آخر التحديثات</p>
            <div className="flex rtl:flex-row-reverse">
              <input type="email" placeholder="البريد الإلكتروني" className="px-4 py-2 border border-gray-300 rounded-r-md rtl:rounded-r-none rtl:rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary/50 flex-grow" />
              <Button className="rounded-l-md rtl:rounded-l-none rtl:rounded-r-md">اشتراك</Button>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-12 pt-6">
          <p className="text-gray-500 text-center">© {new Date().getFullYear()} CODMAGNET. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>;
};
export default Footer;