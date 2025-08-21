import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Check, Crown, Star } from 'lucide-react';

interface PlanFeature {
  name: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  currency: string;
  interval: string;
  features: PlanFeature[];
  popular?: boolean;
  current?: boolean;
}

const PlansSettings = () => {
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [loading, setLoading] = useState(false);
  const [shopDomain, setShopDomain] = useState<string>('');

  const plans: Plan[] = [
    {
      id: 'free',
      name: 'Free Plan',
      nameAr: 'الخطة المجانية',
      price: 0,
      currency: 'USD',
      interval: 'forever',
      features: [
        { name: 'Up to 50 form submissions', included: true },
        { name: 'Basic form builder', included: true },
        { name: 'Email notifications', included: true },
        { name: 'Basic analytics', included: false },
        { name: 'Advanced integrations', included: false },
        { name: 'Priority support', included: false }
      ]
    },
    {
      id: 'basic',
      name: 'Basic Plan',
      nameAr: 'الخطة الأساسية',
      price: 11.85,
      currency: 'USD',
      interval: 'month',
      popular: true,
      features: [
        { name: 'Unlimited form submissions', included: true },
        { name: 'Advanced form builder', included: true },
        { name: 'Email notifications', included: true },
        { name: 'Basic analytics', included: true },
        { name: 'Shopify integration', included: true },
        { name: 'Priority support', included: false }
      ]
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      nameAr: 'الخطة المتقدمة',
      price: 22.85,
      currency: 'USD',
      interval: 'month',
      features: [
        { name: 'Everything in Basic', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'Custom integrations', included: true },
        { name: 'White-label options', included: true },
        { name: 'Priority support', included: true },
        { name: 'Custom development', included: true }
      ]
    }
  ];

  useEffect(() => {
    // Get shop domain from localStorage or auth context
    const shop = localStorage.getItem('shopify_store') || '';
    console.log('🏪 Shop domain from localStorage:', shop);

    // Try alternative keys if first one is empty
    if (!shop) {
      const altShop = localStorage.getItem('active_store') || localStorage.getItem('shopify_domain') || '';
      console.log('🔄 Trying alternative shop domain:', altShop);
      setShopDomain(altShop);
      fetchCurrentPlan(altShop);
    } else {
      setShopDomain(shop);
      fetchCurrentPlan(shop);
    }
  }, []);

  const fetchCurrentPlan = async (shop: string) => {
    if (!shop) return;
    
    try {
      // For now, use localStorage to store plan info until shop_subscriptions table is created
      const savedPlan = localStorage.getItem(`plan_${shop}`) || 'free';
      setCurrentPlan(savedPlan);
    } catch (error) {
      console.log('No current plan found, defaulting to free');
    }
  };

  const handlePlanChange = async (planId: string) => {
    console.log('🚀 Plan change clicked!', { planId, shopDomain });

    if (!shopDomain) {
      console.error('❌ Shop domain is empty:', shopDomain);
      toast.error('Shop domain not found');
      return;
    }

    console.log('✅ Starting plan change process...');
    setLoading(true);

    try {
      console.log('📡 Calling change-plan function with:', { shop: shopDomain, planId });

      const response = await supabase.functions.invoke('change-plan', {
        body: {
          shop: shopDomain,
          planId: planId
        }
      });

      console.log('📥 Response received:', response);

      if (response.error) {
        throw response.error;
      }

      const result = response.data;

      if (result.success) {
        if (planId === 'free') {
          toast.success('Successfully switched to free plan');
          setCurrentPlan(planId);
          localStorage.setItem(`plan_${shopDomain}`, planId);
        } else {
          // Save plan selection locally before redirect
          localStorage.setItem(`plan_${shopDomain}`, planId);
          // Redirect to Shopify billing confirmation
          if (result.url) {
            window.location.href = result.url;
          } else {
            toast.error('Failed to create billing subscription');
          }
        }
      } else {
        toast.error(result.error || 'Failed to change plan');
      }
    } catch (error) {
      console.error('Error changing plan:', error);
      toast.error('Failed to change plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Subscription Plans</h1>
        <h2 className="text-xl text-muted-foreground mb-4">خطط الاشتراك</h2>
        <p className="text-muted-foreground">
          Choose the plan that best fits your business needs
        </p>
        <p className="text-sm text-muted-foreground">
          اختر الخطة التي تناسب احتياجات عملك
        </p>
        {shopDomain && (
          <p className="text-xs text-blue-600 mt-2">
            🏪 Shop: {shopDomain} | Current Plan: {currentPlan}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative ${plan.popular ? 'ring-2 ring-primary' : ''} ${
              currentPlan === plan.id ? 'ring-2 ring-green-500' : ''
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-3 py-1">
                  <Star className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}
            
            {currentPlan === plan.id && (
              <div className="absolute -top-3 right-4">
                <Badge className="bg-green-500 text-white px-3 py-1">
                  <Check className="w-3 h-3 mr-1" />
                  Current Plan
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center mb-2">
                {plan.id === 'premium' && <Crown className="w-6 h-6 text-yellow-500 mr-2" />}
                <CardTitle className="text-xl">{plan.name}</CardTitle>
              </div>
              <CardDescription className="text-sm mb-2">{plan.nameAr}</CardDescription>
              <div className="text-3xl font-bold">
                ${plan.price}
                {plan.price > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">
                    /{plan.interval}
                  </span>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center text-sm">
                    {feature.included ? (
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 mr-2 flex-shrink-0" />
                    )}
                    <span className={!feature.included ? 'text-muted-foreground line-through' : ''}>
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                className="w-full mt-6"
                variant={currentPlan === plan.id ? 'outline' : 'default'}
                onClick={() => {
                  console.log('🖱️ Button clicked for plan:', plan.id);
                  handlePlanChange(plan.id);
                }}
                disabled={loading || currentPlan === plan.id}
              >
                {loading ? (
                  'Processing...'
                ) : currentPlan === plan.id ? (
                  'Current Plan'
                ) : plan.price === 0 ? (
                  'Switch to Free'
                ) : (
                  `Upgrade to ${plan.name}`
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Important Notes:</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Plans are billed monthly through Shopify</li>
          <li>• You can change or cancel your plan at any time</li>
          <li>• Upgrades take effect immediately</li>
          <li>• Downgrades take effect at the next billing cycle</li>
        </ul>
      </div>
    </div>
  );
};

export default PlansSettings;