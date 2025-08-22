import React, { useEffect, useState } from 'react';
import { subscriptionService } from '@/lib/subscription-service';

export const SubscriptionDebug = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const checkSubscription = async () => {
      console.log('🔥 DEBUG: Starting subscription check...');
      
      try {
        // التحقق من Supabase client أولاً
        const { supabase } = await import('@/integrations/supabase/client');
        console.log('🔥 DEBUG: Supabase client loaded');
        
        // التحقق من حالة المصادقة
        const { data: { user } } = await supabase.auth.getUser();
        console.log('🔥 DEBUG: Current user:', user);
        
        // استعلام مباشر لقاعدة البيانات
        const { data: directData, error: directError } = await supabase
          .from('shop_subscriptions')
          .select('*')
          .eq('shop_domain', 'kooblk.myshopify.com')
          .limit(1);
          
        console.log('🔥 DEBUG: Direct DB query result:', { directData, directError });
        
        if (directError) {
          setDebugInfo({ error: `DB Error: ${directError.message}` });
          return;
        }
        
        if (directData && directData.length > 0) {
          setDebugInfo(directData[0]);
        } else {
          // جرب بدون filter
          const { data: allData, error: allError } = await supabase
            .from('shop_subscriptions')
            .select('*')
            .limit(5);
            
          console.log('🔥 DEBUG: All subscriptions:', { allData, allError });
          setDebugInfo({ 
            error: 'No subscription found for kooblk.myshopify.com', 
            allSubscriptions: allData?.length || 0,
            user: user?.id || 'anonymous'
          });
        }
        
      } catch (error) {
        console.error('🔥 DEBUG: Error:', error);
        setDebugInfo({ error: String(error) });
      }
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
        debugInfo.error ? (
          <div>
            <p style={{color: 'yellow'}}>ERROR: {debugInfo.error}</p>
            {debugInfo.allSubscriptions && <p>Total subs: {debugInfo.allSubscriptions}</p>}
            {debugInfo.user && <p>User: {debugInfo.user}</p>}
          </div>
        ) : (
          <div>
            <p>✅ Plan: {debugInfo.plan_type}</p>
            <p>✅ Status: {debugInfo.status}</p>
            <p>✅ Shop: {debugInfo.shop_domain}</p>
            <p>✅ Price: ${debugInfo.price_amount}</p>
          </div>
        )
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};