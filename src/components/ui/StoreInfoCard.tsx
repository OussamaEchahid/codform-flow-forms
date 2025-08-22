import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Store, Crown, CheckCircle, Globe, Mail } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface StoreInfoCardProps {
  storeName?: string;
  storeUrl?: string;
  userEmail?: string;
  planType?: string;
  planStatus?: 'active' | 'inactive' | 'pending';
  isConnected?: boolean;
  className?: string;
}

const StoreInfoCard: React.FC<StoreInfoCardProps> = ({
  storeName,
  storeUrl,
  userEmail,
  planType = 'free',
  planStatus = 'active',
  isConnected = false,
  className
}) => {
  const { language } = useI18n();

  // تنظيف اسم المتجر
  const cleanStoreName = storeName?.replace('.myshopify.com', '') || 'Unknown Store';
  
  // تحديد لون الخطة متناسق مع ألوان المشروع
  const getPlanColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'premium': return 'bg-gradient-to-r from-purple-600 to-purple-700';
      case 'basic': return 'bg-gradient-to-r from-primary to-purple-600';
      case 'free': return 'bg-gradient-to-r from-gray-500 to-gray-600';
      default: return 'bg-gradient-to-r from-primary to-purple-600';
    }
  };

  // تحديد نص الخطة
  const getPlanText = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'premium': return language === 'ar' ? 'بريميوم' : 'Premium';
      case 'basic': return language === 'ar' ? 'أساسية' : 'Basic';
      case 'free': return language === 'ar' ? 'مجانية' : 'Free';
      default: return language === 'ar' ? 'غير معروف' : 'Unknown';
    }
  };

  // تحديد حالة الاتصال - إصلاح مشكلة عدم إظهار الاتصال الصحيح
  const getConnectionStatus = () => {
    // إذا كان هناك اسم متجر صحيح، فهو متصل
    const hasValidStore = storeName && storeName.includes('.myshopify.com');

    if (!hasValidStore) return { text: language === 'ar' ? 'غير متصل' : 'Disconnected', color: 'bg-red-500' };
    if (planStatus === 'active' || hasValidStore) return { text: language === 'ar' ? 'نشط ومتصل' : 'Active & Connected', color: 'bg-green-500' };
    if (planStatus === 'pending') return { text: language === 'ar' ? 'في الانتظار' : 'Pending', color: 'bg-yellow-500' };
    return { text: language === 'ar' ? 'متصل' : 'Connected', color: 'bg-green-500' };
  };

  const connectionStatus = getConnectionStatus();

  return (
    <Card className={cn("relative overflow-hidden border-0 shadow-lg", className)}>
      {/* خلفية متدرجة متناسقة مع ألوان المشروع */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-purple-50 to-primary/10" />
      
      {/* محتوى البطاقة */}
      <CardContent className="relative p-6">
        <div className="flex items-center justify-between">
          {/* معلومات المتجر */}
          <div className="flex items-center gap-4">
            {/* أفاتار المتجر */}
            <div className="relative">
              <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
                <AvatarFallback className={cn("text-white text-xl font-bold", getPlanColor(planType))}>
                  {cleanStoreName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* مؤشر الاتصال */}
              <div className={cn("absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white", connectionStatus.color)} />
            </div>

            {/* تفاصيل المتجر */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">{cleanStoreName}</h2>
                {isConnected && <CheckCircle className="h-5 w-5 text-green-500" />}
              </div>
              
              {/* رابط المتجر */}
              {storeUrl && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Globe className="h-4 w-4" />
                  <span className="truncate max-w-[200px]">{storeUrl}</span>
                </div>
              )}
              
              {/* البريد الإلكتروني */}
              {userEmail && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span className="truncate max-w-[200px]">{userEmail}</span>
                </div>
              )}
            </div>
          </div>

          {/* معلومات الخطة والحالة */}
          <div className="text-right space-y-3">
            {/* شارة الخطة */}
            <div className="flex justify-end">
              <Badge className={cn("text-white font-semibold px-4 py-2 text-sm", getPlanColor(planType))}>
                <Crown className="h-4 w-4 mr-1" />
                {getPlanText(planType)}
              </Badge>
            </div>
            
            {/* حالة الاتصال */}
            <div className="flex justify-end">
              <Badge variant="outline" className={cn("border-0 text-white font-medium", connectionStatus.color)}>
                <Store className="h-3 w-3 mr-1" />
                {connectionStatus.text}
              </Badge>
            </div>
            

          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StoreInfoCard;
