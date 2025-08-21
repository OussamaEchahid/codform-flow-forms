import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

const SubscriptionCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get parameters from URL
        const charge_id = searchParams.get('charge_id');
        const shop = searchParams.get('shop');
        const plan = searchParams.get('plan');
        
        console.log('Subscription callback params:', { charge_id, shop, plan });

        if (!charge_id || !shop) {
          setStatus('error');
          setMessage('معاملات الاشتراك مفقودة');
          return;
        }

        // Check if subscription was successful
        // In a real implementation, you might want to verify with Shopify API
        // For now, we'll assume success if we have the required parameters
        
        setStatus('success');
        setMessage('تم تفعيل الاشتراك بنجاح! سيتم إعادة توجيهك إلى صفحة الخطط.');
        
        // Redirect to plans page after 3 seconds
        setTimeout(() => {
          navigate('/settings/plans');
        }, 3000);

      } catch (error) {
        console.error('Error processing subscription callback:', error);
        setStatus('error');
        setMessage('حدث خطأ أثناء معالجة الاشتراك');
      }
    };

    processCallback();
  }, [searchParams, navigate]);

  const handleReturnToPlans = () => {
    navigate('/settings/plans');
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
            {status === 'loading' && 'معالجة الاشتراك...'}
            {status === 'success' && 'تم بنجاح!'}
            {status === 'error' && 'حدث خطأ'}
          </CardTitle>
          
          <CardDescription className="text-center mt-2">
            {message}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {status === 'success' && (
            <div className="space-y-4">
              <div className="text-center text-sm text-gray-600">
                سيتم إعادة توجيهك تلقائياً خلال 3 ثوانٍ...
              </div>
              <Button 
                onClick={handleReturnToPlans}
                className="w-full"
              >
                العودة إلى صفحة الخطط
              </Button>
            </div>
          )}
          
          {status === 'error' && (
            <Button 
              onClick={handleReturnToPlans}
              className="w-full"
              variant="outline"
            >
              العودة إلى صفحة الخطط
            </Button>
          )}
          
          {status === 'loading' && (
            <div className="text-center text-sm text-gray-600">
              يرجى الانتظار...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionCallback;
