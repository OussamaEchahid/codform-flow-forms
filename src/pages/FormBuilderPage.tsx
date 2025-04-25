
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import FormBuilder from '@/components/form/FormBuilder';

const FormBuilderPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="mb-8 text-right">
          <h1 className="text-3xl font-bold">منشئ النماذج</h1>
          <p className="text-gray-600">قم بإنشاء وتخصيص نماذج الطلب الخاصة بك للدفع عند الاستلام</p>
        </div>
        <FormBuilder />
      </div>
      <Footer />
    </div>
  );
};

export default FormBuilderPage;
