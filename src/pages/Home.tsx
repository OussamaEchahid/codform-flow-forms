
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Home = () => {
  return (
    <div className="container mx-auto py-12">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-6">مرحبًا بك في CODFORM</h1>
        <p className="text-xl mb-8">منصة النماذج والمبيعات المتكاملة لتجارتك الإلكترونية</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button asChild size="lg">
            <Link to="/dashboard">لوحة التحكم</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/shopify">ربط متجر Shopify</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;
