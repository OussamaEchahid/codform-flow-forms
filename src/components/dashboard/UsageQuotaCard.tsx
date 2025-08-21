import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingUp, ShoppingCart, ShoppingBag } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
          إحصائيات الاستخدام - {planType}
        </CardTitle>
        <CardDescription>
          استخدامك الحالي من الخطة لهذا الشهر
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* تحذيرات الحدود */}
        {(isOrdersOverLimit || isAbandonedOverLimit) && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="font-medium mb-2">تم تجاوز الحد المسموح!</div>
              <div className="text-sm space-y-1">
                {isOrdersOverLimit && <div>• تم تجاوز حد الطلبات الشهرية</div>}
                {isAbandonedOverLimit && <div>• تم تجاوز حد السلال المهجورة</div>}
                <div className="mt-2">
                  <strong>يرجى الترقية لخطة أعلى لمواصلة استقبال الطلبات.</strong>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {(isOrdersNearLimit || isAbandonedNearLimit) && !isOrdersOverLimit && !isAbandonedOverLimit && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <div className="font-medium mb-2">اقتراب من الحد المسموح!</div>
              <div className="text-sm">
                أنت تقترب من حد الاستخدام الشهري. فكر في الترقية لتجنب انقطاع الخدمة.
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* إحصائيات الطلبات */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-blue-500" />
              <span className="font-medium">الطلبات الشهرية</span>
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
                <span>{Math.round(ordersPercentage)}% مستخدم</span>
                <span>{Math.max(0, ordersLimit - ordersUsed)} متبقي</span>
              </div>
            </div>
          )}
        </div>

        {/* إحصائيات السلال المهجورة */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-orange-500" />
              <span className="font-medium">السلال المهجورة</span>
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
                <span>{Math.round(abandonedPercentage)}% مستخدم</span>
                <span>{Math.max(0, abandonedLimit - abandonedUsed)} متبقي</span>
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
              ترقية الخطة الآن
            </Button>
        )}

        {/* معلومات الخطة */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div>الخطة الحالية: <strong>{planType}</strong></div>
          {planType === 'free' && (
            <div>• 70 طلب شهرياً • 30 سلة مهجورة</div>
          )}
          {planType === 'basic' && (
            <div>• 1000 طلب شهرياً • 30 سلة مهجورة</div>
          )}
          {(planType === 'premium' || planType === 'unlimited') && (
            <div>• طلبات غير محدودة • سلال مهجورة غير محدودة</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};