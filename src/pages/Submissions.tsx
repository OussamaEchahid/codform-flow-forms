
import React from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';

const Submissions = () => {
  const { formId } = useParams<{ formId: string }>();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">طلبات النموذج</h1>
      <Card className="p-6">
        <p>معرف النموذج: {formId}</p>
        <div className="mt-4">
          {/* Submissions list will go here */}
          <p>قائمة الطلبات ستظهر هنا</p>
        </div>
      </Card>
    </div>
  );
};

export default Submissions;
