import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/components/layout/AuthProvider';
import { useI18n } from '@/lib/i18n';
import { useSimpleShopify } from '@/hooks/useSimpleShopify';
import { supabase } from '@/integrations/supabase/client';
import AppSidebar from '@/components/layout/AppSidebar';
import WelcomeCard from '@/components/dashboard/WelcomeCard';
import NoStoreConnected from '@/components/dashboard/NoStoreConnected';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useI18n();
  const [searchParams] = useSearchParams();
  const [userHasStores, setUserHasStores] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // استخدام النظام المبسط
  const { activeStore, isConnected } = useSimpleShopify();

  // فحص المتاجر عند تحميل الصفحة
  useEffect(() => {
    const checkStores = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      console.log('✅ Dashboard loaded for user:', user.email);
      
      try {
        // فحص المتاجر المربوطة
        const response = await supabase.functions.invoke('store-link-manager', {
          body: {
            action: 'get_stores',
            userId: user.id
          }
        });

        if (response.data?.stores) {
          const storesList = response.data.stores;
          console.log('📦 User stores:', storesList);
          setUserHasStores(storesList.length > 0);
        } else {
          setUserHasStores(false);
        }
      } catch (error) {
        console.error('❌ Error checking stores:', error);
        setUserHasStores(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkStores();
  }, [user]);

  // عرض شاشة التحميل
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحقق من المتاجر...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <AppSidebar />
      
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-right">
            {t('dashboard')}
          </h1>
          
          {userHasStores === false ? (
            <NoStoreConnected />
          ) : (
            <WelcomeCard />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;