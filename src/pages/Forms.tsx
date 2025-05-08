
import React from 'react';
import { Navigate } from 'react-router-dom';

// إعادة توجيه المستخدم للصفحة الجديدة FormsPage
const Forms = () => {
  return <Navigate to="/forms" replace />;
};

export default Forms;
