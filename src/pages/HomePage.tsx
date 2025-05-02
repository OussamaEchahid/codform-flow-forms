
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const HomePage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white">
      <div className="text-center max-w-2xl mx-auto p-6">
        <h1 className="text-4xl font-bold mb-6 text-purple-900">
          CodForm - Shopify Form Builder
        </h1>
        <p className="text-xl mb-8 text-gray-600">
          Create powerful custom forms for your Shopify store. Integrate easily with your products and enhance your customer experience.
        </p>
        <div className="space-x-4">
          <Button 
            onClick={() => navigate('/forms')}
            size="lg"
            className="bg-purple-600 hover:bg-purple-700"
          >
            Get Started
          </Button>
          <Button
            onClick={() => navigate('/shopify')}
            size="lg"
            variant="outline"
          >
            Connect to Shopify
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
