
import React from 'react';
import { useParams } from 'react-router-dom';

const Submissions = () => {
  const { formId } = useParams();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">عمليات الإرسال</h1>
      <p>معرف النموذج: {formId}</p>
      
      <div className="mt-6">
        {/* سيتم إضافة جدول عمليات الإرسال هنا */}
        <p className="text-gray-500">قريباً سيتم إضافة جدول عرض عمليات الإرسال...</p>
      </div>
    </div>
  );
};

export default Submissions;
