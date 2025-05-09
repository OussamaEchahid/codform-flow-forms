
import React from 'react';
import { Card } from '@/components/ui/card';

const ThemeSettings = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">إعدادات المظهر</h1>
      <Card className="p-6">
        <div className="grid gap-6">
          {/* Theme settings content will go here */}
          <p>محتوى إعدادات المظهر سيظهر هنا</p>
        </div>
      </Card>
    </div>
  );
};

export default ThemeSettings;
