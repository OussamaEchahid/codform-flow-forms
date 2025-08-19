import React, { useEffect, useRef } from 'react';
import { useSpamCheck } from '@/hooks/useSpamProtection';
import { applySpamProtectionToForm } from '@/utils/spam-protection';
import { useI18n } from '@/lib/i18n';
import { Shield, AlertTriangle } from 'lucide-react';

interface FormWithSpamProtectionProps {
  children: React.ReactNode;
  shopId?: string;
  enabled?: boolean;
  showStatus?: boolean;
  onBlocked?: () => void;
  onAllowed?: () => void;
  className?: string;
}

const FormWithSpamProtection: React.FC<FormWithSpamProtectionProps> = ({
  children,
  shopId,
  enabled = true,
  showStatus = false,
  onBlocked,
  onAllowed,
  className = ''
}) => {
  const { language } = useI18n();
  const { isBlocked, isChecking } = useSpamCheck(enabled ? shopId : undefined);
  const formRef = useRef<HTMLDivElement>(null);
  const protectionApplied = useRef(false);

  // تطبيق حماية البريد العشوائي على النماذج
  useEffect(() => {
    if (!enabled || protectionApplied.current || !formRef.current) return;

    const applyProtection = async () => {
      try {
        const forms = formRef.current?.querySelectorAll('form');
        if (forms && forms.length > 0) {
          for (const form of forms) {
            await applySpamProtectionToForm(form as HTMLFormElement, shopId);
          }
          protectionApplied.current = true;
        }
      } catch (error) {
        console.error('Error applying spam protection:', error);
      }
    };

    // تطبيق الحماية فوراً
    applyProtection();

    // مراقبة النماذج الجديدة
    const observer = new MutationObserver(() => {
      applyProtection();
    });

    observer.observe(formRef.current, {
      childList: true,
      subtree: true
    });

    return () => {
      observer.disconnect();
    };
  }, [enabled, shopId]);

  // استدعاء callbacks
  useEffect(() => {
    if (isBlocked === true) {
      onBlocked?.();
    } else if (isBlocked === false) {
      onAllowed?.();
    }
  }, [isBlocked, onBlocked, onAllowed]);

  // إذا كان التحقق جارياً
  if (enabled && isChecking) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'جاري التحقق من الأمان...' : 'Checking security...'}
          </p>
        </div>
      </div>
    );
  }

  // إذا كان المستخدم محظوراً
  if (enabled && isBlocked) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center space-y-4 max-w-md">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold text-red-600">
            {language === 'ar' ? 'تم حظر الوصول' : 'Access Blocked'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'ar' 
              ? 'تم تقييد وصولك. يرجى الاتصال بمدير الموقع إذا كنت تعتقد أن هذا خطأ.'
              : 'Your access has been restricted. Please contact the site administrator if you believe this is an error.'
            }
          </p>
        </div>
      </div>
    );
  }

  // عرض النموذج مع الحماية
  return (
    <div ref={formRef} className={className}>
      {showStatus && enabled && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-800">
            <Shield className="h-4 w-4" />
            <span className="text-sm">
              {language === 'ar' 
                ? 'حماية البريد العشوائي نشطة'
                : 'Spam protection active'
              }
            </span>
          </div>
        </div>
      )}
      {children}
    </div>
  );
};

export default FormWithSpamProtection;
