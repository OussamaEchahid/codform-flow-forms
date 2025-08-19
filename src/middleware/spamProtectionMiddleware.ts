import { spamProtectionService } from '@/services/SpamProtectionService';
import { getActiveShopId } from '@/utils/shop-utils';

/**
 * Middleware للتحقق من حماية البريد العشوائي
 */
export class SpamProtectionMiddleware {
  private static instance: SpamProtectionMiddleware;
  private checkedIPs = new Set<string>();
  private checkInterval = 5 * 60 * 1000; // 5 دقائق

  public static getInstance(): SpamProtectionMiddleware {
    if (!SpamProtectionMiddleware.instance) {
      SpamProtectionMiddleware.instance = new SpamProtectionMiddleware();
    }
    return SpamProtectionMiddleware.instance;
  }

  /**
   * التحقق من حماية البريد العشوائي للمستخدم الحالي
   */
  async checkCurrentUser(): Promise<{
    isBlocked: boolean;
    redirectUrl?: string;
    reason?: string;
  }> {
    try {
      const shopId = getActiveShopId();
      if (!shopId) {
        return { isBlocked: false };
      }

      // الحصول على IP الحالي
      const userIP = await spamProtectionService.getCurrentUserIP();
      if (!userIP) {
        return { isBlocked: false };
      }

      // تجنب الفحص المتكرر لنفس IP
      const cacheKey = `${shopId}-${userIP}`;
      if (this.checkedIPs.has(cacheKey)) {
        return { isBlocked: false };
      }

      // التحقق من الحظر
      const result = await spamProtectionService.checkIPBlocked(userIP, shopId);
      
      if (result.is_blocked) {
        return {
          isBlocked: true,
          redirectUrl: result.redirect_url,
          reason: result.reason
        };
      }

      // إضافة IP إلى cache لتجنب الفحص المتكرر
      this.checkedIPs.add(cacheKey);
      
      // إزالة من cache بعد فترة
      setTimeout(() => {
        this.checkedIPs.delete(cacheKey);
      }, this.checkInterval);

      return { isBlocked: false };
    } catch (error) {
      console.error('Error in spam protection check:', error);
      return { isBlocked: false };
    }
  }

  /**
   * تطبيق الحماية - حظر المستخدم إذا كان محظوراً
   */
  async applyProtection(): Promise<void> {
    const result = await this.checkCurrentUser();
    
    if (result.isBlocked) {
      this.blockUser(result.redirectUrl, result.reason);
    }
  }

  /**
   * حظر المستخدم وإعادة توجيهه
   */
  private blockUser(redirectUrl?: string, reason?: string): void {
    // إنشاء صفحة الحظر
    const blockedPage = this.createBlockedPage(reason, redirectUrl);
    
    // استبدال محتوى الصفحة
    document.body.innerHTML = blockedPage;
    
    // منع التنقل
    this.preventNavigation();
    
    // إعادة التوجيه إذا كان هناك رابط
    if (redirectUrl) {
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 3000);
    }
  }

  /**
   * إنشاء صفحة الحظر
   */
  private createBlockedPage(reason?: string, redirectUrl?: string): string {
    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تم حظر الوصول</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          }
          .container {
            text-align: center;
            max-width: 500px;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          }
          .icon {
            font-size: 4rem;
            margin-bottom: 1rem;
          }
          h1 {
            font-size: 2rem;
            margin-bottom: 1rem;
            color: #ff6b6b;
          }
          p {
            font-size: 1.1rem;
            line-height: 1.6;
            margin-bottom: 1rem;
            opacity: 0.9;
          }
          .reason {
            background: rgba(255, 255, 255, 0.2);
            padding: 1rem;
            border-radius: 10px;
            margin: 1rem 0;
            font-weight: bold;
          }
          .redirect-info {
            background: rgba(76, 175, 80, 0.3);
            padding: 1rem;
            border-radius: 10px;
            margin-top: 1rem;
          }
          .countdown {
            font-size: 1.2rem;
            font-weight: bold;
            color: #4CAF50;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">🚫</div>
          <h1>تم حظر الوصول</h1>
          <p>عذراً، لا يمكنك الوصول إلى هذا الموقع من عنوان IP الخاص بك.</p>
          
          ${reason ? `
            <div class="reason">
              <strong>سبب الحظر:</strong><br>
              ${reason}
            </div>
          ` : ''}
          
          ${redirectUrl ? `
            <div class="redirect-info">
              <p>سيتم إعادة توجيهك تلقائياً خلال <span class="countdown" id="countdown">3</span> ثوانٍ...</p>
            </div>
            <script>
              let count = 3;
              const countdownEl = document.getElementById('countdown');
              const timer = setInterval(() => {
                count--;
                countdownEl.textContent = count;
                if (count <= 0) {
                  clearInterval(timer);
                  window.location.href = '${redirectUrl}';
                }
              }, 1000);
            </script>
          ` : ''}
          
          <p style="margin-top: 2rem; font-size: 0.9rem; opacity: 0.7;">
            إذا كنت تعتقد أن هذا خطأ، يرجى الاتصال بإدارة الموقع.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * منع التنقل والعودة
   */
  private preventNavigation(): void {
    // منع الرجوع للخلف
    history.pushState(null, '', location.href);
    window.addEventListener('popstate', () => {
      history.pushState(null, '', location.href);
    });

    // منع F5 و Ctrl+R
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
        e.preventDefault();
      }
    });

    // منع النقر بالزر الأيمن
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }
}

// إنشاء instance واحد للاستخدام
export const spamProtectionMiddleware = SpamProtectionMiddleware.getInstance();
