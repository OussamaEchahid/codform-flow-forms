import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingUp, ShoppingCart, ShoppingBag } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useI18n } from '@/lib/i18n';

interface UsageQuotaCardProps {
  ordersUsed: number;
  ordersLimit: number | null;
  abandonedUsed: number;
  abandonedLimit: number | null;
  planType: string;
  onUpgrade?: () => void;
}

export const UsageQuotaCard: React.FC<UsageQuotaCardProps> = ({
  ordersUsed,
  ordersLimit,
  abandonedUsed,
  abandonedLimit,
  planType,
  onUpgrade
}) => {
  const { t, language } = useI18n();
  const ordersPercentage = ordersLimit ? (ordersUsed / ordersLimit) * 100 : 0;
  const abandonedPercentage = abandonedLimit ? (abandonedUsed / abandonedLimit) * 100 : 0;

  const isOrdersNearLimit = ordersPercentage >= 80;
  const isOrdersOverLimit = ordersPercentage >= 100;
  const isAbandonedNearLimit = abandonedPercentage >= 80;
  const isAbandonedOverLimit = abandonedPercentage >= 100;

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {t('usageStatistics')} - {planType}
        </CardTitle>
        <CardDescription>
          {t('currentMonthUsage')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* تحذيرات الحدود */}
        {(isOrdersOverLimit || isAbandonedOverLimit) && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="font-medium mb-2">{t('limitExceeded')}</div>
              <div className="text-sm space-y-1">
                {isOrdersOverLimit && <div>• {t('monthlyOrdersExceeded')}</div>}
                {isAbandonedOverLimit && <div>• {t('abandonedCartsExceeded')}</div>}
                <div className="mt-2">
                  <strong>{t('upgradeRequired')}</strong>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {(isOrdersNearLimit || isAbandonedNearLimit) && !isOrdersOverLimit && !isAbandonedOverLimit && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <div className="font-medium mb-2">{t('nearingLimit')}</div>
              <div className="text-sm">
                {t('nearingLimitDesc')}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* إحصائيات الطلبات */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-blue-500" />
              <span className="font-medium">{t('monthlyOrders')}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {ordersUsed} / {ordersLimit || "∞"}
            </div>
          </div>
          {ordersLimit && (
            <div className="space-y-2">
              <Progress 
                value={Math.min(ordersPercentage, 100)} 
                className="h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{Math.round(ordersPercentage)}% {t('used')}</span>
                <span>{Math.max(0, ordersLimit - ordersUsed)} {t('remaining')}</span>
              </div>
            </div>
          )}
        </div>

        {/* إحصائيات السلال المهجورة */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-orange-500" />
              <span className="font-medium">{t('abandonedCarts')}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {abandonedUsed} / {abandonedLimit || "∞"}
            </div>
          </div>
          {abandonedLimit && (
            <div className="space-y-2">
              <Progress 
                value={Math.min(abandonedPercentage, 100)} 
                className="h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{Math.round(abandonedPercentage)}% {t('used')}</span>
                <span>{Math.max(0, abandonedLimit - abandonedUsed)} {t('remaining')}</span>
              </div>
            </div>
          )}
        </div>

        {/* زر الترقية */}
        {planType === 'free' && (isOrdersNearLimit || isAbandonedNearLimit || isOrdersOverLimit || isAbandonedOverLimit) && (
            <Button 
              onClick={onUpgrade}
              className="w-full"
              variant={isOrdersOverLimit || isAbandonedOverLimit ? "default" : "outline"}
            >
              {t('upgradeNow')}
            </Button>
        )}

        {/* معلومات الخطة */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div>{t('currentPlanText')}: <strong>{planType}</strong></div>
          {planType === 'free' && (
            <div>• 70 {t('monthlyOrdersShort')} • 30 {t('abandonedCartsShort')}</div>
          )}
          {planType === 'basic' && (
            <div>• 1000 {t('monthlyOrdersShort')} • 30 {t('abandonedCartsShort')}</div>
          )}
          {(planType === 'premium' || planType === 'unlimited') && (
            <div>• {t('unlimitedOrders')} • {t('unlimitedAbandoned')}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};