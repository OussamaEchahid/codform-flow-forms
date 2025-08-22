import React, { useEffect, useState } from 'react';
import { subscriptionService } from '@/lib/subscription-service';

export const SubscriptionDebug = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const checkSubscription = async () => {
      console.log('🔥 DEBUG: Starting subscription check...');
      
      // التحقق مباشرة من متجرك
      const subscription = await subscriptionService.getSubscription('kooblk.myshopify.com');
      console.log('🔥 DEBUG: Direct subscription result:', subscription);
      
      setDebugInfo(subscription);
    };
    
    checkSubscription();
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'red',
      color: 'white',
      padding: '10px',
      zIndex: 9999,
      fontSize: '12px',
      maxWidth: '300px'
    }}>
      <h4>🔥 SUBSCRIPTION DEBUG</h4>
      {debugInfo ? (
        <div>
          <p>Plan: {debugInfo.plan_type}</p>
          <p>Status: {debugInfo.status}</p>
          <p>Shop: {debugInfo.shop_domain}</p>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};