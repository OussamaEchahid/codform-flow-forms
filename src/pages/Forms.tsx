
import React from 'react';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import FormBuilderDashboard from '@/components/form/builder/FormBuilderDashboard';

const Forms = () => {
  const { user } = useAuth();
  const { language } = useI18n();

  if (!user) {
    return <div className="text-center py-8">{language === 'ar' ? 'يرجى تسجيل الدخول للوصول إلى قسم النماذج' : 'Please login to access forms'}</div>;
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      <FormBuilderDashboard />
    </div>
  );
};

export default Forms;
