import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Store, ArrowRight } from 'lucide-react';

const NoStoreConnected: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 text-center shadow-elegant">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/20 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-2xl font-bold mb-2">
            مرحباً بك في CODmagnet
          </h1>
          <p className="text-muted-foreground text-lg">
            تم إنشاء حسابك بنجاح، لكن لا يوجد متجر Shopify مرتبط بعد
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Store className="w-6 h-6 text-primary" />
            <h2 className="text-lg font-semibold">لماذا أحتاج إلى ربط متجر؟</h2>
          </div>
          <ul className="text-right space-y-3 text-muted-foreground">
            <li className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
              <span>إنشاء نماذج الدفع عند الاستلام المخصصة</span>
            </li>
            <li className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
              <span>ربط النماذج بمنتجاتك تلقائياً</span>
            </li>
            <li className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
              <span>متابعة الطلبات والإحصائيات</span>
            </li>
            <li className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
              <span>إدارة العروض والخصومات</span>
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            للحصول على أفضل تجربة، يُرجى ربط متجر Shopify الخاص بك
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => navigate('/shopify')}
              className="bg-primary hover:bg-primary/90"
              size="lg"
            >
              <Store className="w-4 h-4 mr-2" />
              ربط متجر Shopify
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => navigate('/profile')}
              size="lg"
            >
              إعداد الملف الشخصي
            </Button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground">
            لديك متجر Shopify بالفعل؟ 
            <Button 
              variant="link" 
              className="text-xs p-0 h-auto font-normal"
              onClick={() => window.open('https://apps.shopify.com', '_blank')}
            >
              حمّل التطبيق من متجر التطبيقات
            </Button>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default NoStoreConnected;