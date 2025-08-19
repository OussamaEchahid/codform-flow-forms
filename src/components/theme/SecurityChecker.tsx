import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import BlockedPage from '@/pages/BlockedPage';

interface SecurityCheckerProps {
  shopId: string;
  children: React.ReactNode;
}

interface SecurityCheckResult {
  blocked: boolean;
  reason?: string;
  redirect_url?: string;
  block_type?: 'ip' | 'country';
  visitor_country?: string;
  visitor_country_code?: string;
  visitor_ip?: string;
}

const SecurityChecker: React.FC<SecurityCheckerProps> = ({ shopId, children }) => {
  const [securityCheck, setSecurityCheck] = useState<SecurityCheckResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSecurity();
  }, [shopId]);

  // إخفاء المحتوى عند الحظر
  useEffect(() => {
    if (securityCheck?.blocked) {
      // إخفاء جميع عناصر الصفحة
      const style = document.createElement('style');
      style.textContent = `
        body > *:not([data-security-overlay]) {
          display: none !important;
        }
        body {
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
        }
      `;
      style.setAttribute('data-security-style', 'true');
      document.head.appendChild(style);
      
      return () => {
        const securityStyle = document.querySelector('[data-security-style]');
        if (securityStyle) {
          securityStyle.remove();
        }
      };
    }
  }, [securityCheck?.blocked]);

  const checkSecurity = async () => {
    try {
      // الحصول على عنوان IP الخاص بالزائر
      const visitorIP = await getVisitorIP();
      
      if (!visitorIP || !shopId) {
        setLoading(false);
        return;
      }

      // فحص الأمان
      const { data, error } = await supabase.functions.invoke('store-security-check', {
        body: {
          shop_id: shopId,
          visitor_ip: visitorIP,
          user_agent: navigator.userAgent,
          referer: document.referrer || window.location.href
        }
      });

      if (error) {
        console.error('Security check error:', error);
        // في حالة الخطأ، لا نحظر المستخدم
        setSecurityCheck({ blocked: false });
      } else {
        setSecurityCheck(data);
      }

    } catch (error) {
      console.error('Security check failed:', error);
      // في حالة فشل الفحص، لا نحظر المستخدم لتجنب حظر غير مقصود
      setSecurityCheck({ blocked: false });
    } finally {
      setLoading(false);
    }
  };

  const getVisitorIP = async (): Promise<string | null> => {
    try {
      // استخدام خدمة مجانية للحصول على IP
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Failed to get visitor IP:', error);
      return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">جاري التحقق من الأمان...</p>
        </div>
      </div>
    );
  }

  if (securityCheck?.blocked) {
    return (
      <div 
        data-security-overlay="true"
        className="fixed inset-0 z-[9999]"
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 999999,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <BlockedPage
          reason={securityCheck.reason}
          blockType={securityCheck.block_type}
          redirectUrl={securityCheck.redirect_url}
          visitorCountry={securityCheck.visitor_country}
          visitorIP={securityCheck.visitor_ip}
        />
      </div>
    );
  }

  return <>{children}</>;
};

export default SecurityChecker;