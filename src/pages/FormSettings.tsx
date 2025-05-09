
import React from 'react';
import { useParams } from 'react-router-dom';

const FormSettings = () => {
  const { formId } = useParams();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">إعدادات النموذج</h1>
      <p>معرف النموذج: {formId}</p>
      
      <div className="mt-6">
        {/* سيتم إضافة إعدادات النموذج هنا */}
        <p className="text-gray-500">قريباً سيتم إضافة الإعدادات المفصلة للنموذج...</p>
      </div>
    </div>
  );
};

export default FormSettings;
