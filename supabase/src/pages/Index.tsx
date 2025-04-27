
import React from 'react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/home/Hero';
import Features from '@/components/home/Features';
import Templates from '@/components/home/Templates';
import Pricing from '@/components/home/Pricing';
import CTA from '@/components/home/CTA';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div dir="rtl" className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <Templates />
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto bg-codform-light-purple rounded-lg p-8">
            <div className="flex flex-col lg:flex-row-reverse items-center">
              <div className="lg:w-1/2 mb-6 lg:mb-0">
                <h2 className="text-2xl font-bold mb-4 text-right">جرب منشئ النماذج الآن</h2>
                <p className="text-gray-700 mb-6 text-right">
                  صمم نموذج الدفع عند الاستلام الخاص بك باستخدام منشئ النماذج السهل والمرن
                </p>
                <div className="flex justify-end">
                  <Button asChild>
                    <Link to="/form-builder">ابدأ في تصميم النموذج</Link>
                  </Button>
                </div>
              </div>
              <div className="lg:w-1/2 lg:pl-10">
                <div className="bg-white rounded-lg shadow-lg p-4">
                  <img 
                    src="https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=800&q=80" 
                    alt="منشئ النماذج" 
                    className="rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
};

export default Index;
