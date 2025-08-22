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
    <Card className="border-0 shadow-md bg-gradient-to-br from-slate-50 via-purple-50 to-primary/5">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-purple-600">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              {t('usageStatistics')}
            </span>
          </div>
          <div className="text-sm font-normal text-muted-foreground capitalize">
            {planType}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {/* تحذيرات مدمجة وأصغر */}
        {(isOrdersOverLimit || isAbandonedOverLimit) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-700 text-sm font-medium">
              <AlertTriangle className="h-4 w-4" />
              {t('limitExceeded')} - {t('upgradeRequired')}
            </div>
          </div>
        )}

        {(isOrdersNearLimit || isAbandonedNearLimit) && !isOrdersOverLimit && !isAbandonedOverLimit && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-yellow-700 text-sm font-medium">
              <AlertTriangle className="h-4 w-4" />
              {t('nearingLimit')}
            </div>
          </div>
        )}

        {/* إحصائيات مدمجة في شبكة */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* إحصائيات الطلبات */}
          <div className="bg-white/50 rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-blue-100">
                  <ShoppingCart className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <span className="text-sm font-medium">{t('monthlyOrders')}</span>
              </div>
              <div className="text-lg font-bold text-blue-600">
                {ordersUsed}
              </div>
            </div>
            {ordersLimit && (
              <div className="space-y-1">
                <Progress
                  value={Math.min(ordersPercentage, 100)}
                  className="h-1.5"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{Math.round(ordersPercentage)}%</span>
                  <span>/ {ordersLimit}</span>
                </div>
              </div>
            )}
          </div>

          {/* إحصائيات السلال المهجورة */}
          <div className="bg-white/50 rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-orange-100">
                  <ShoppingBag className="h-3.5 w-3.5 text-orange-600" />
                </div>
                <span className="text-sm font-medium">{t('abandonedCarts')}</span>
              </div>
              <div className="text-lg font-bold text-orange-600">
                {abandonedUsed}
              </div>
            </div>
            {abandonedLimit && (
              <div className="space-y-1">
                <Progress
                  value={Math.min(abandonedPercentage, 100)}
                  className="h-1.5"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{Math.round(abandonedPercentage)}%</span>
                  <span>/ {abandonedLimit}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* زر الترقية مدمج */}
        {planType === 'free' && (isOrdersNearLimit || isAbandonedNearLimit || isOrdersOverLimit || isAbandonedOverLimit) && (
          <div className="flex items-center justify-between bg-gradient-to-r from-primary/10 to-purple-600/10 rounded-lg p-3 border border-primary/20">
            <div className="text-sm">
              <div className="font-medium text-primary">{t('upgradeRequired')}</div>
              <div className="text-xs text-muted-foreground">احصل على حدود أعلى</div>
            </div>
            <Button
              onClick={onUpgrade}
              size="sm"
              className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
            >
              {t('upgradeNow')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};