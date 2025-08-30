import React from 'react';
import { Button } from "@/components/ui/button";
import { MessageCircle, ArrowLeft, Shield, Headphones, Star } from "lucide-react";

interface PricingFooterProps {
  language: string;
  onContactClick: () => void;
  onDashboardClick: () => void;
}

export const PricingFooter: React.FC<PricingFooterProps> = ({
  language,
  onContactClick,
  onDashboardClick
}) => {
  return (
    <div className="mt-16 space-y-8">
      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="text-center p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
          <Shield className="h-8 w-8 text-primary mx-auto mb-4" />
          <h3 className="font-semibold mb-2">
            {language === 'ar' ? 'أمان موثوق' : 'Trusted Security'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {language === 'ar' ? 'حماية متقدمة لبياناتك' : 'Advanced protection for your data'}
          </p>
        </div>
        
        <div className="text-center p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
          <Headphones className="h-8 w-8 text-primary mx-auto mb-4" />
          <h3 className="font-semibold mb-2">
            {language === 'ar' ? 'دعم متواصل' : '24/7 Support'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {language === 'ar' ? 'فريق الدعم متاح دائماً' : 'Our support team is always available'}
          </p>
        </div>
        
        <div className="text-center p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
          <Star className="h-8 w-8 text-primary mx-auto mb-4" />
          <h3 className="font-semibold mb-2">
            {language === 'ar' ? 'ميزات حصرية' : 'Premium Features'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {language === 'ar' ? 'احصل على أحدث المميزات' : 'Get access to latest features'}
          </p>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center bg-gradient-to-r from-muted/50 to-muted/30 rounded-2xl p-8 border">
        <h3 className="text-2xl font-bold mb-4">
          {language === 'ar' ? 'لديك أسئلة؟' : 'Have Questions?'}
        </h3>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          {language === 'ar'
            ? 'فريقنا المتخصص هنا لمساعدتك في اختيار الخطة المناسبة لاحتياجاتك'
            : 'Our expert team is here to help you choose the perfect plan for your business needs'
          }
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button 
            size="lg" 
            onClick={onContactClick}
            className="gap-2"
          >
            <MessageCircle className="h-5 w-5" />
            {language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            onClick={onDashboardClick}
            className="gap-2"
          >
            <ArrowLeft className="h-5 w-5" />
            {language === 'ar' ? 'العودة للوحة التحكم' : 'Back to Dashboard'}
          </Button>
        </div>
      </div>
    </div>
  );
};