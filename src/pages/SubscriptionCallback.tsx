import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useLanguage } from '@/contexts/LanguageContext';
import { getShopSubscription } from '@/lib/services/subscriptionService';

const SubscriptionCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [planType, setPlanType] = useState<string>('');

  const getPlanName = (planId: string) => {
    const planNames = {
      'basic': language === 'ar' ? 'الأساسية' : 'Basic',
      'premium': language === 'ar' ? 'المتقدمة' : 'Premium',
      'free': language === 'ar' ? 'المجانية' : 'Free'
    };
    return planNames[planId as keyof typeof planNames] || planId;
  };

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get parameters from URL
        const charge_id = searchParams.get('charge_id');
        const shop = searchParams.get('shop');
        const plan = searchParams.get('plan');

        console.log('Subscription callback params:', { charge_id, shop, plan });

        if (!shop || !plan) {
          setStatus('error');
          setMessage(language === 'ar' ? 'معاملات الاشتراك مفقودة' : 'Missing subscription parameters');
          return;
        }

        setPlanType(plan);

        // Wait a moment for webhook to process
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check subscription status with retries
        let attempts = 0;
        const maxAttempts = 10;
        let subscriptionFound = false;

        while (attempts < maxAttempts && !subscriptionFound) {
          try {
            const { data: subscriptionData } = await getShopSubscription(shop);

            if (subscriptionData && subscriptionData.plan_type === plan && subscriptionData.status === 'active') {
              subscriptionFound = true;
              setStatus('success');
              setMessage(language === 'ar' ?
                `تم تفعيل اشتراك ${getPlanName(plan)} بنجاح!` :
                `${getPlanName(plan)} subscription activated successfully!`
              );

              // Close popup window and refresh parent
              if (window.opener) {
                // Send message to parent window to refresh
                window.opener.postMessage({
                  type: 'SUBSCRIPTION_SUCCESS',
                  plan: plan,
                  shop: shop
                }, '*');

                // Close popup after a short delay
                setTimeout(() => {
                  window.close();
                }, 2000);
              } else {
                // If not in popup, redirect to plans page
                setTimeout(() => {
                  navigate('/settings/plans');
                }, 3000);
              }

              break;
            }
          } catch (error) {
            console.error('Error checking subscription:', error);
          }

          attempts++;
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        }

        if (!subscriptionFound) {
          setStatus('error');
          setMessage(language === 'ar' ?
            'لم يتم العثور على الاشتراك. يرجى المحاولة مرة أخرى.' :
            'Subscription not found. Please try again.'
          );
        }

      } catch (error) {
        console.error('Subscription callback error:', error);
        setStatus('error');
        setMessage(language === 'ar' ?
          'حدث خطأ في معالجة الاشتراك' :
          'Error processing subscription'
        );
      }
    };

    processCallback();
  }, [searchParams, language, navigate]);

  const handleReturnToPlans = () => {
    if (window.opener) {
      window.close();
    } else {
      navigate('/settings/plans');
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'loading' && (
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="h-12 w-12 text-green-500" />
            )}
            {status === 'error' && (
              <XCircle className="h-12 w-12 text-red-500" />
            )}
          </div>
          
          <CardTitle className="text-2xl">
            {status === 'loading' && (language === 'ar' ? 'معالجة الاشتراك...' : 'Processing subscription...')}
            {status === 'success' && (language === 'ar' ? 'تم بنجاح!' : 'Success!')}
            {status === 'error' && (language === 'ar' ? 'حدث خطأ' : 'Error occurred')}
          </CardTitle>
          
          <CardDescription className="text-center mt-2">
            {message}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {planType && (
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <p className="text-sm text-blue-700">
                {language === 'ar' ? 'الخطة:' : 'Plan:'} <strong>{getPlanName(planType)}</strong>
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="text-center text-sm text-gray-600">
                {window.opener ?
                  (language === 'ar' ? 'سيتم إغلاق النافذة تلقائياً...' : 'Window will close automatically...') :
                  (language === 'ar' ? 'سيتم إعادة توجيهك تلقائياً خلال 3 ثوانٍ...' : 'Redirecting automatically in 3 seconds...')
                }
              </div>
              <Button
                onClick={handleReturnToPlans}
                className="w-full"
              >
                {window.opener ?
                  (language === 'ar' ? 'إغلاق' : 'Close') :
                  (language === 'ar' ? 'العودة إلى صفحة الخطط' : 'Back to Plans')
                }
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex gap-2">
              <Button
                onClick={handleRetry}
                className="flex-1"
                variant="outline"
              >
                {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
              </Button>
              <Button
                onClick={handleReturnToPlans}
                className="flex-1"
              >
                {window.opener ?
                  (language === 'ar' ? 'إغلاق' : 'Close') :
                  (language === 'ar' ? 'العودة للخطط' : 'Back to Plans')
                }
              </Button>
            </div>
          )}

          {status === 'loading' && (
            <div className="text-center text-sm text-gray-600">
              {language === 'ar' ? 'يرجى الانتظار...' : 'Please wait...'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionCallback;
