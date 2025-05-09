
import React from 'react';
import { useParams } from 'react-router-dom';

const Submissions: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">طلبات النموذج</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="mb-4">رقم النموذج: {formId}</p>
        <p>هنا يمكنك رؤية جميع الطلبات المقدمة لهذا النموذج.</p>
      </div>
    </div>
  );
};

export default Submissions;
