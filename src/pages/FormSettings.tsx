
import React from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';

const FormSettings = () => {
  const { formId } = useParams<{ formId: string }>();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">إعدادات النموذج</h1>
      <Card className="p-6">
        <p>معرف النموذج: {formId}</p>
        <div className="grid gap-6 mt-4">
          {/* Form settings content will go here */}
          <p>محتوى إعدادات النموذج سيظهر هنا</p>
        </div>
      </Card>
    </div>
  );
};

export default FormSettings;
