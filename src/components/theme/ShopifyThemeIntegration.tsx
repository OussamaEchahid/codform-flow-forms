import React, { useEffect } from 'react';
import SecurityChecker from './SecurityChecker';

interface ShopifyThemeIntegrationProps {
  shopId: string;
  enabled?: boolean;
  children?: React.ReactNode;
}

const ShopifyThemeIntegration: React.FC<ShopifyThemeIntegrationProps> = ({ 
  shopId, 
  enabled = true,
  children 
}) => {
  useEffect(() => {
    if (!enabled || !shopId) return;

    // إضافة سكريبت الأمان إلى الثيم
    const securityScript = document.createElement('script');
    securityScript.id = 'codform-security-script';
    securityScript.innerHTML = `
      // نظام الأمان المتقدم لـ CodForm
      (function() {
        const SHOP_ID = '${shopId}';
        const SECURITY_CHECK_URL = 'https://trlklwixfeaexhydzaue.supabase.co/functions/v1/store-security-check';
        
        // فحص الأمان عند تحميل الصفحة
        async function checkSecurity() {
          try {
            const visitorIP = await getVisitorIP();
            
            const response = await fetch(SECURITY_CHECK_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M'
              },
              body: JSON.stringify({
                shop_id: SHOP_ID,
                visitor_ip: visitorIP,
                user_agent: navigator.userAgent,
                referer: document.referrer || window.location.href
              })
            });
            
            const result = await response.json();
            
            if (result.blocked) {
              // إذا تم حظر المستخدم، توجيهه إلى الصفحة المحددة
              if (result.redirect_url) {
                window.location.href = result.redirect_url;
              } else {
                // إنشاء صفحة حظر مبسطة
                document.body.innerHTML = createBlockedPageHTML(result);
              }
            }
            
          } catch (error) {
            console.error('Security check failed:', error);
            // في حالة الخطأ، لا نحظر المستخدم
          }
        }
        
        // الحصول على عنوان IP
        async function getVisitorIP() {
          try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
          } catch (error) {
            console.error('Failed to get IP:', error);
            return null;
          }
        }
        
        // إنشاء صفحة الحظر
        function createBlockedPageHTML(blockInfo) {
          return \`
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>تم حظر الوصول</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  min-height: 100vh;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  padding: 20px;
                  color: #333;
                }
                .container {
                  background: white;
                  border-radius: 20px;
                  padding: 40px;
                  max-width: 600px;
                  text-align: center;
                  box-shadow: 0 20px 50px rgba(0,0,0,0.3);
                }
                .icon {
                  width: 80px;
                  height: 80px;
                  background: #ff4757;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  margin: 0 auto 30px;
                  font-size: 40px;
                  color: white;
                }
                h1 { color: #ff4757; margin-bottom: 20px; }
                .reason { 
                  background: #f1f2f6; 
                  padding: 20px; 
                  border-radius: 10px; 
                  margin: 20px 0;
                  border-left: 4px solid #ff4757;
                }
                .info {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 20px;
                  margin: 20px 0;
                }
                .info-item {
                  background: #f8f9fa;
                  padding: 15px;
                  border-radius: 8px;
                }
                .btn {
                  background: #5352ed;
                  color: white;
                  padding: 15px 30px;
                  border: none;
                  border-radius: 10px;
                  font-size: 16px;
                  cursor: pointer;
                  margin: 10px;
                }
                .btn:hover { background: #3742fa; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="icon">🛡️</div>
                <h1>تم حظر الوصول</h1>
                <p>عذراً، لا يمكنك الوصول إلى هذا المتجر في الوقت الحالي</p>
                
                <div class="reason">
                  <strong>السبب:</strong> \${blockInfo.reason || 'تم حظر الوصول من موقعك'}
                </div>
                
                <div class="info">
                  <div class="info-item">
                    <strong>نوع الحظر:</strong><br>
                    \${blockInfo.block_type === 'country' ? 'حظر جغرافي' : 'حظر عنوان IP'}
                  </div>
                  <div class="info-item">
                    <strong>الوقت:</strong><br>
                    \${new Date().toLocaleString('ar-SA')}
                  </div>
                </div>
                
                <p style="margin: 20px 0; color: #666;">
                  إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع إدارة المتجر
                </p>
                
                <button class="btn" onclick="window.location.reload()">إعادة المحاولة</button>
                \${blockInfo.redirect_url ? \`<button class="btn" onclick="window.location.href='\${blockInfo.redirect_url}'">الانتقال إلى صفحة أخرى</button>\` : ''}
              </div>
            </body>
            </html>
          \`;
        }
        
        // تشغيل فحص الأمان
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', checkSecurity);
        } else {
          checkSecurity();
        }
        
      })();
    `;

    // التحقق من وجود سكريپت مماثل وإزالته
    const existingScript = document.getElementById('codform-security-script');
    if (existingScript) {
      existingScript.remove();
    }

    // إضافة السكريپت الجديد
    document.head.appendChild(securityScript);

    // تنظيف عند إزالة المكون
    return () => {
      const scriptToRemove = document.getElementById('codform-security-script');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [shopId, enabled]);

  if (!enabled || !shopId) {
    return <>{children}</>;
  }

  // استخدام SecurityChecker للتطبيقات الداخلية
  return (
    <SecurityChecker shopId={shopId}>
      {children}
    </SecurityChecker>
  );
};

export default ShopifyThemeIntegration;