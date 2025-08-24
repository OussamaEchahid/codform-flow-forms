import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/home/Hero';
import Features from '@/components/home/Features';
import Templates from '@/components/home/Templates';
import Pricing from '@/components/home/Pricing';
import CTA from '@/components/home/CTA';
import { Link } from 'react-router-dom';
import { fixShopifyConnectionState } from '@/utils/fix-shopify-state';
import ShopifyAutoConnector from '@/components/shopify/ShopifyAutoConnector';
import { parseShopifyParams } from '@/utils/shopify-helpers';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';
import { shopifyStores } from '@/lib/shopify/supabase-client';
import { toast } from '@/hooks/use-toast';
const Index = () => {
  const navigate = useNavigate();
  const [isProcessingShopify, setIsProcessingShopify] = useState(false);
  useEffect(() => {
    console.log('🏠 Index page loaded - Homepage should display');
    const handleShopifyConnection = async () => {
      const {
        shopDomain,
        isShopifyRequest
      } = parseShopifyParams();
      console.log('🔍 Index page - Shopify params:', {
        shopDomain,
        isShopifyRequest
      });

      // فقط إذا كان هناك طلب Shopify صريح
      if (shopDomain && isShopifyRequest) {
        console.log('🔔 Shopify request detected, processing...');
        setIsProcessingShopify(true);
        try {
          // فحص إذا كان المتجر موجود مسبقاً
          const {
            data: existingStore
          } = await shopifyStores().select('*').eq('shop', shopDomain).maybeSingle();
          if (existingStore && existingStore.access_token) {
            // المتجر موجود ومتصل - اذهب مباشرة للوحة التحكم
            console.log('✅ Store already connected, going to dashboard');
            shopifyConnectionManager.setActiveStore(shopDomain);
            toast({
              title: "تم الاتصال بنجاح",
              description: `تم الاتصال بمتجر ${shopDomain}`
            });

            // تنظيف URL ثم الانتقال للوحة التحكم
            window.history.replaceState({}, '', '/');
            navigate('/dashboard');
            return;
          }

          // المتجر جديد أو غير متصل - سيعرض ShopifyAutoConnector نافذة الحوار
          console.log('🔔 New store detected, will show dialog');
        } catch (error) {
          console.error('❌ Error checking store:', error);
          toast({
            title: "خطأ في التحقق من المتجر",
            description: "حدث خطأ أثناء التحقق من حالة المتجر",
            variant: "destructive"
          });
        } finally {
          setIsProcessingShopify(false);
        }
      } else {
        console.log('🏠 No Shopify request - showing homepage');
      }
    };
    handleShopifyConnection();
  }, [navigate]);
  const handleShopifyConnected = (shop: string) => {
    console.log('🎉 Shop connected:', shop);
    toast({
      title: "تم الاتصال بنجاح",
      description: `تم الاتصال بمتجر ${shop}`
    });
    navigate('/dashboard');
  };
  return <div dir="rtl" className="min-h-screen">
      {/* Shopify Auto Connector - يعرض نافذة للمتاجر الجديدة فقط */}
      <ShopifyAutoConnector onConnected={handleShopifyConnected} />

      <Navbar />
      
      {isProcessingShopify && <div className="fixed top-0 left-0 right-0 bg-blue-500 text-white text-center py-2 z-50">
          جاري التحقق من اتصال المتجر...
        </div>}
      
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
                <div className="flex flex-col gap-3 items-end">
                  <Button asChild>
                    <Link to="/form-builder">ابدأ في تصميم النموذج</Link>
                  </Button>
                  
                  {/* زر إصلاح مشكلة الاتصال */}
                  
                </div>
              </div>
              <div className="lg:w-1/2 lg:pl-10">
                <div className="bg-white rounded-lg shadow-lg p-4">
                  <img src="https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=800&q=80" alt="منشئ النماذج" className="rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Pricing />
      <CTA />
      <Footer />
    </div>;
};
export default Index;