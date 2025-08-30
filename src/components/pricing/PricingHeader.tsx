import React from 'react';

interface PricingHeaderProps {
  language: string;
}

export const PricingHeader: React.FC<PricingHeaderProps> = ({ language }) => {
  return (
    <div className="text-center mb-12 max-w-4xl mx-auto">
      <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
        <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
        {language === 'ar' ? 'خطط الاشتراك' : 'Pricing Plans'}
      </div>
      
      <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
        {language === 'ar' ? 'ابدأ رحلتك معنا' : 'Start Your Journey'}
      </h1>
      
      <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
        {language === 'ar'
          ? 'اختر الخطة المناسبة لاحتياجاتك. ابدأ مجاناً ثم قم بالترقية عندما تحتاج إلى مزيد من الميزات'
          : 'Choose the perfect plan for your needs. Start free, then upgrade when you need more features and capabilities'}
      </p>
      
      <div className="flex items-center justify-center gap-2 mt-6 text-sm text-muted-foreground">
        <span>✨</span>
        <span>{language === 'ar' ? 'جميع الخطط تشمل دعم 24/7' : 'All plans include 24/7 support'}</span>
        <span>✨</span>
      </div>
    </div>
  );
};