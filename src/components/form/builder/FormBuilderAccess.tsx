
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

interface FormBuilderAccessProps {
  enableBypass: () => void;
}

const FormBuilderAccess: React.FC<FormBuilderAccessProps> = ({ enableBypass }) => {
  const navigate = useNavigate();
  const { language } = useI18n();
  
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="max-w-md w-full p-6 bg-white rounded shadow-md">
        <div className="text-center py-4">
          <h2 className="text-xl font-bold mb-4">
            {language === 'ar' 
              ? 'الوصول مقيد' 
              : 'Access Restricted'}
          </h2>
          <p className="mb-6">
            {language === 'ar' 
              ? 'يرجى تسجيل الدخول أو الاتصال بمتجر Shopify للوصول إلى منشئ النماذج' 
              : 'Please login or connect a Shopify store to access the form builder'}
          </p>
          
          <div className="flex flex-col space-y-2">
            <Button 
              onClick={() => navigate('/shopify')}
              className="w-full"
            >
              {language === 'ar' ? 'الاتصال بمتجر Shopify' : 'Connect Shopify Store'}
            </Button>
            
            <Button
              variant="outline"
              onClick={enableBypass}
              className="w-full"
            >
              {language === 'ar' ? 'متابعة على أي حال' : 'Continue Anyway'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormBuilderAccess;
