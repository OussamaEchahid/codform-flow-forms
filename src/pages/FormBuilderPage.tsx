
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import FormBuilder from '@/components/form/FormBuilder';

const FormBuilderPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex-grow">
        <h1 className="text-3xl font-bold mb-8 text-right">منشئ النماذج</h1>
        <FormBuilder />
      </div>
      <Footer />
    </div>
  );
};

export default FormBuilderPage;
