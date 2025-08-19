import { spamProtectionService, BlockedIPCheck } from '@/services/SpamProtectionService';

/**
 * التحقق من حظر عنوان IP قبل إرسال النموذج
 */
export async function checkSpamProtection(shopId?: string): Promise<{
  isBlocked: boolean;
  redirectUrl?: string;
  reason?: string;
  shouldBlock: boolean;
}> {
  try {
    // محاولة الحصول على عنوان IP الحالي
    const userIP = await getCurrentUserIP();
    
    if (!userIP) {
      // إذا لم نتمكن من الحصول على IP، نسمح بالمرور
      return {
        isBlocked: false,
        shouldBlock: false
      };
    }

    // التحقق من حظر IP
    const blockCheck: BlockedIPCheck = await spamProtectionService.checkIPBlocked(userIP, shopId);
    
    return {
      isBlocked: blockCheck.is_blocked,
      redirectUrl: blockCheck.redirect_url,
      reason: blockCheck.reason,
      shouldBlock: blockCheck.is_blocked
    };
  } catch (error) {
    console.error('Error checking spam protection:', error);
    // في حالة الخطأ، نسمح بالمرور لتجنب منع المستخدمين الشرعيين
    return {
      isBlocked: false,
      shouldBlock: false
    };
  }
}

/**
 * الحصول على عنوان IP الحالي للمستخدم
 */
async function getCurrentUserIP(): Promise<string | null> {
  try {
    // محاولة الحصول على IP من خدمات مختلفة
    const services = [
      'https://api.ipify.org?format=json',
      'https://ipapi.co/json/',
      'https://httpbin.org/ip'
    ];

    for (const service of services) {
      try {
        const response = await fetch(service, { 
          timeout: 5000,
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // استخراج IP من استجابات مختلفة
          const ip = data.ip || data.origin || data.query;
          
          if (ip && isValidIP(ip)) {
            return ip;
          }
        }
      } catch (serviceError) {
        console.warn(`Failed to get IP from ${service}:`, serviceError);
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting current user IP:', error);
    return null;
  }
}

/**
 * التحقق من صحة عنوان IP
 */
function isValidIP(ip: string): boolean {
  // IPv4 validation
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  
  // IPv6 validation (basic)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * معالجة المستخدم المحظور
 */
export function handleBlockedUser(blockInfo: {
  isBlocked: boolean;
  redirectUrl?: string;
  reason?: string;
}): void {
  if (!blockInfo.isBlocked) {
    return;
  }

  // إذا كان هناك رابط إعادة توجيه، استخدمه
  if (blockInfo.redirectUrl) {
    try {
      window.location.href = blockInfo.redirectUrl;
      return;
    } catch (error) {
      console.error('Error redirecting blocked user:', error);
    }
  }

  // إذا لم يكن هناك رابط إعادة توجيه، عرض رسالة
  showBlockedMessage(blockInfo.reason);
}

/**
 * عرض رسالة الحظر
 */
function showBlockedMessage(reason?: string): void {
  // إنشاء عنصر رسالة الحظر
  const blockedMessage = document.createElement('div');
  blockedMessage.id = 'spam-protection-blocked-message';
  blockedMessage.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    font-family: Arial, sans-serif;
    text-align: center;
    padding: 20px;
  `;

  const content = `
    <div style="max-width: 500px;">
      <div style="font-size: 48px; margin-bottom: 20px;">🚫</div>
      <h1 style="font-size: 24px; margin-bottom: 16px; color: #ff4444;">
        Access Blocked / تم حظر الوصول
      </h1>
      <p style="font-size: 16px; margin-bottom: 20px; line-height: 1.5;">
        Your access has been restricted. Please contact the site administrator if you believe this is an error.
      </p>
      <p style="font-size: 16px; margin-bottom: 20px; line-height: 1.5; direction: rtl;">
        تم تقييد وصولك. يرجى الاتصال بمدير الموقع إذا كنت تعتقد أن هذا خطأ.
      </p>
      ${reason ? `
        <p style="font-size: 14px; color: #cccccc; margin-top: 20px;">
          Reason / السبب: ${reason}
        </p>
      ` : ''}
    </div>
  `;

  blockedMessage.innerHTML = content;

  // إضافة الرسالة إلى الصفحة
  document.body.appendChild(blockedMessage);

  // منع التفاعل مع الصفحة
  document.body.style.overflow = 'hidden';
}

/**
 * إزالة رسالة الحظر (للاختبار)
 */
export function removeBlockedMessage(): void {
  const message = document.getElementById('spam-protection-blocked-message');
  if (message) {
    message.remove();
    document.body.style.overflow = '';
  }
}

/**
 * تطبيق حماية البريد العشوائي على النموذج
 */
export async function applySpamProtectionToForm(
  formElement: HTMLFormElement, 
  shopId?: string
): Promise<boolean> {
  try {
    const protection = await checkSpamProtection(shopId);
    
    if (protection.shouldBlock) {
      // منع إرسال النموذج
      formElement.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleBlockedUser(protection);
      }, { capture: true });

      return false; // النموذج محظور
    }

    return true; // النموذج مسموح
  } catch (error) {
    console.error('Error applying spam protection to form:', error);
    return true; // في حالة الخطأ، نسمح بالمرور
  }
}

/**
 * تطبيق حماية البريد العشوائي على الصفحة بالكامل
 */
export async function applyPageSpamProtection(shopId?: string): Promise<void> {
  try {
    const protection = await checkSpamProtection(shopId);
    
    if (protection.shouldBlock) {
      // حظر الصفحة بالكامل
      handleBlockedUser(protection);
    }
  } catch (error) {
    console.error('Error applying page spam protection:', error);
  }
}

/**
 * تهيئة حماية البريد العشوائي تلقائياً
 */
export function initializeSpamProtection(options: {
  shopId?: string;
  protectForms?: boolean;
  protectPage?: boolean;
} = {}): void {
  const { shopId, protectForms = true, protectPage = false } = options;

  // حماية الصفحة إذا كانت مطلوبة
  if (protectPage) {
    applyPageSpamProtection(shopId);
  }

  // حماية النماذج إذا كانت مطلوبة
  if (protectForms) {
    // تطبيق الحماية على النماذج الموجودة
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      applySpamProtectionToForm(form as HTMLFormElement, shopId);
    });

    // مراقبة النماذج الجديدة
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // التحقق من النماذج الجديدة
            if (element.tagName === 'FORM') {
              applySpamProtectionToForm(element as HTMLFormElement, shopId);
            }
            
            // التحقق من النماذج داخل العناصر الجديدة
            const forms = element.querySelectorAll('form');
            forms.forEach(form => {
              applySpamProtectionToForm(form as HTMLFormElement, shopId);
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}
