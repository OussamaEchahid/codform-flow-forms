console.log('🚀 FILE LOADING - OAuthGoogleCallback.tsx');

import { useEffect, useState } from 'react';

console.log('🚀 IMPORTS LOADED');

export default function OAuthGoogleCallback() {
  console.log('🚀 COMPONENT FUNCTION CALLED');
  
  const [message, setMessage] = useState('Processing...');
  
  // Log immediately on component creation
  console.log('🔍 Full URL:', window.location.href);
  console.log('🔍 Search params:', window.location.search);
  console.log('🔍 Hash:', window.location.hash);
  
  // Check for success in multiple ways
  const urlHasSuccess = window.location.href.includes('success=1') || window.location.href.includes('success=true');
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const error = params.get('error');
  
  console.log('🔍 URL analysis:');
  console.log('  - Has success:', urlHasSuccess);
  console.log('  - Code present:', !!code);
  console.log('  - Error:', error);
  
  if (urlHasSuccess) {
    console.log('✅ SUCCESS FOUND IN URL');
    setTimeout(() => {
      window.close();
    }, 1000);
    return <div className="p-6 text-center">✅ تم الربط بنجاح!</div>;
  }
  
  if (code && !error) {
    console.log('📝 Found authorization code, should process it');
    return <div className="p-6 text-center">معالجة كود التفويض...</div>;
  }
  
  if (error) {
    console.log('❌ OAuth Error:', error);
    return <div className="p-6 text-center">خطأ في التفويض: {error}</div>;
  }
  
  console.log('❌ NO SUCCESS OR CODE FOUND');
  
  return (
    <div className="p-6 text-center">
      <p>Missing authorization code.</p>
    </div>
  );
}