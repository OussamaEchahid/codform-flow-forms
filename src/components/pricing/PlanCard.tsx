import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star, Zap } from "lucide-react";
import { type PlanId } from '@/lib/billing/plans';

interface PlanCardProps {
  plan: {
    id: string;
    name: string;
    price: number;
    currency: string;
    period: string;
    popular: boolean;
    features: string[];
    limits: {
      orders: number | null;
      abandoned: number | null;
    };
  };
  planSubtitle: string;
  isCurrentPlan: boolean;
  isUpgrading: boolean;
  onUpgrade: () => void;
  language: string;
  subscription?: any;
}

const iconForPlan: Record<PlanId, React.ComponentType<any>> = {
  free: Star,
  basic: Zap,
  premium: Crown,
};

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  planSubtitle,
  isCurrentPlan,
  isUpgrading,
  onUpgrade,
  language,
  subscription
}) => {
  const Icon = iconForPlan[plan.id as PlanId];
  
  const getCardStyle = () => {
    if (plan.popular) {
      return "relative overflow-hidden border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg hover:shadow-xl transition-all duration-300 scale-105";
    }
    return "relative overflow-hidden border border-border bg-card hover:shadow-lg transition-all duration-300 hover:scale-[1.02]";
  };

  const getPriceColor = () => {
    if (plan.id === 'free') return "text-emerald-600";
    if (plan.id === 'basic') return "text-primary";
    if (plan.id === 'premium') return "text-primary";
    return "text-foreground";
  };

  const getButtonVariant = () => {
    if (isCurrentPlan) return 'secondary';
    if (plan.popular) return 'default';
    return 'outline';
  };

  return (
    <Card className={getCardStyle()}>
      {plan.popular && (
        <div className="absolute -top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary-light to-primary"></div>
      )}
      
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <Badge className="bg-primary text-primary-foreground px-4 py-1.5 shadow-lg">
            <Star className="h-4 w-4 mr-1 fill-current" />
            {language === 'ar' ? 'الأكثر شعبية' : 'Most Popular'}
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-4 pt-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className={`p-3 rounded-full ${plan.popular ? 'bg-primary text-primary-foreground' : 'bg-muted text-primary'}`}>
            <Icon size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-bold">{plan.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{planSubtitle}</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-baseline justify-center gap-1">
            <span className={`text-5xl font-bold ${getPriceColor()}`}>
              ${plan.price}
            </span>
            <span className="text-muted-foreground font-medium">
              /{language === 'ar' ? 'شهر' : 'month'}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 px-6 pb-8">
        {/* Monthly Limits */}
        <div className="bg-muted/50 rounded-xl p-4 border">
          <h4 className="font-semibold mb-3 text-center">
            {language === 'ar' ? 'الحدود الشهرية' : 'Monthly Limits'}
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-center">
              <div className="font-bold text-lg">
                {plan.limits.orders ? plan.limits.orders.toLocaleString() : '∞'}
              </div>
              <div className="text-muted-foreground">
                {language === 'ar' ? 'طلبات' : 'Orders'}
              </div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg">
                {plan.limits.abandoned ? plan.limits.abandoned.toLocaleString() : '∞'}
              </div>
              <div className="text-muted-foreground">
                {language === 'ar' ? 'سلال مهجورة' : 'Abandoned'}
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-3">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <Check className="h-4 w-4 text-emerald-600" />
              </div>
              <span className="text-sm leading-relaxed">{feature}</span>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="pt-4">
          <Button
            className={`w-full h-12 text-base font-semibold ${
              plan.popular ? 'shadow-lg hover:shadow-xl' : ''
            }`}
            disabled={isUpgrading || isCurrentPlan}
            variant={getButtonVariant()}
            onClick={onUpgrade}
          >
            {isCurrentPlan
              ? (subscription?.status === 'pending'
                  ? (language === 'ar' ? 'قيد التفعيل...' : 'Activating...')
                  : (language === 'ar' ? 'الخطة الحالية' : 'Current Plan'))
              : (isUpgrading
                  ? (language === 'ar' ? 'جاري الترقية...' : 'Upgrading...')
                  : (plan.id === 'free' 
                      ? (language === 'ar' ? 'ابدأ مجاناً' : 'Get Started')
                      : (language === 'ar' ? 'ترقية للخطة' : 'Upgrade to Basic')))}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};