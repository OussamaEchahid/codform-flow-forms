import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { useI18n } from '@/lib/i18n';

const SubscriptionSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useI18n();

  useEffect(() => {
    const shop = searchParams.get('shop');
    const plan = searchParams.get('plan');

    console.log('✅ Subscription success callback:', { shop, plan });

    // Send success message to parent window with multiple attempts
    if (window.opener) {
      const sendMessage = () => {
        console.log('📤 Sending subscription success message:', { plan, shop });
        window.opener.postMessage({
          type: 'SUBSCRIPTION_SUCCESS',
          plan: plan || 'unknown',
          shop: shop || 'unknown'
        }, '*');
      };

      // Send message immediately
      sendMessage();

      // Send message again after 500ms to ensure it's received
      setTimeout(sendMessage, 500);

      // Send message again after 1000ms as final attempt
      setTimeout(sendMessage, 1000);

      // Close popup after longer delay to ensure message is processed
      setTimeout(() => {
        console.log('🔒 Closing popup window');
        window.close();
      }, 2500);
    } else {
      // If not in popup, redirect to plans page
      setTimeout(() => {
        navigate('/settings/plans');
      }, 2000);
    }
  }, [searchParams, navigate]);

  const getPlanName = (planId: string) => {
    const planNames = {
      'basic': language === 'ar' ? 'الأساسية' : 'Basic',
      'premium': language === 'ar' ? 'المتقدمة' : 'Premium',
      'free': language === 'ar' ? 'المجانية' : 'Free'
    };
    return planNames[planId as keyof typeof planNames] || planId;
  };

  const plan = searchParams.get('plan');

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-green-700">
            {language === 'ar' ? 'تم بنجاح!' : 'Success!'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-lg">
            {language === 'ar' ? 
              `تم تفعيل اشتراك ${plan ? getPlanName(plan) : ''} بنجاح!` : 
              `${plan ? getPlanName(plan) : ''} subscription activated successfully!`
            }
          </p>
          
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm text-green-700">
              {window.opener ? 
                (language === 'ar' ? 'سيتم إغلاق النافذة تلقائياً...' : 'Window will close automatically...') :
                (language === 'ar' ? 'سيتم إعادة توجيهك تلقائياً...' : 'Redirecting automatically...')
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionSuccess;
