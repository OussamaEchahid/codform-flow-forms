console.log('🚀 FILE LOADING - OAuthGoogleCallback.tsx');

import { useEffect, useState } from 'react';

console.log('🚀 IMPORTS LOADED');

export default function OAuthGoogleCallback() {
  console.log('🚀 COMPONENT FUNCTION CALLED');
  
  const [message, setMessage] = useState('Processing...');
  
  // Log immediately on component creation
  console.log('🔍 URL:', window.location.href);
  
  // Check for success immediately
  if (window.location.href.includes('success=1')) {
    console.log('✅ SUCCESS FOUND IN URL');
    setTimeout(() => {
      window.close();
    }, 1000);
    return <div className="p-6 text-center">✅ تم الربط بنجاح!</div>;
  }
  
  console.log('❌ NO SUCCESS FOUND');
  
  return (
    <div className="p-6 text-center">
      <p>Missing authorization code.</p>
    </div>
  );
}