import React, { useEffect, useState } from 'react';
import { checkSpamProtection, handleBlockedUser } from '@/utils/spam-protection';
import { useI18n } from '@/lib/i18n';
import { AlertTriangle, Shield } from 'lucide-react';

interface SpamProtectionWrapperProps {
  children: React.ReactNode;
  shopId?: string;
  enabled?: boolean;
  showProtectionStatus?: boolean;
  onBlocked?: () => void;
  onAllowed?: () => void;
}

interface ProtectionStatus {
  isChecking: boolean;
  isBlocked: boolean;
  isAllowed: boolean;
  error?: string;
  redirectUrl?: string;
  reason?: string;
}

const SpamProtectionWrapper: React.FC<SpamProtectionWrapperProps> = ({
  children,
  shopId,
  enabled = true,
  showProtectionStatus = false,
  onBlocked,
  onAllowed
}) => {
  const { language } = useI18n();
  const [protectionStatus, setProtectionStatus] = useState<ProtectionStatus>({
    isChecking: true,
    isBlocked: false,
    isAllowed: false
  });

  useEffect(() => {
    if (!enabled) {
      setProtectionStatus({
        isChecking: false,
        isBlocked: false,
        isAllowed: true
      });
      onAllowed?.();
      return;
    }

    checkUserAccess();
  }, [enabled, shopId]);

  const checkUserAccess = async () => {
    try {
      setProtectionStatus(prev => ({ ...prev, isChecking: true }));

      const protection = await checkSpamProtection(shopId);

      if (protection.shouldBlock) {
        setProtectionStatus({
          isChecking: false,
          isBlocked: true,
          isAllowed: false,
          redirectUrl: protection.redirectUrl,
          reason: protection.reason
        });

        // استدعاء callback الحظر
        onBlocked?.();

        // معالجة المستخدم المحظور
        handleBlockedUser({
          isBlocked: true,
          redirectUrl: protection.redirectUrl,
          reason: protection.reason
        });
      } else {
        setProtectionStatus({
          isChecking: false,
          isBlocked: false,
          isAllowed: true
        });

        // استدعاء callback السماح
        onAllowed?.();
      }
    } catch (error) {
      console.error('Error checking spam protection:', error);
      
      setProtectionStatus({
        isChecking: false,
        isBlocked: false,
        isAllowed: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // في حالة الخطأ، نسمح بالوصول
      onAllowed?.();
    }
  };

  // إذا كان التحقق جارياً
  if (protectionStatus.isChecking) {
    return (
      <div className="flex items-center justify-center p-8">
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
  if (protectionStatus.isBlocked) {
    return (
      <div className="flex items-center justify-center p-8">
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
          {protectionStatus.reason && (
            <p className="text-sm text-muted-foreground">
              {language === 'ar' ? 'السبب: ' : 'Reason: '}
              {protectionStatus.reason}
            </p>
          )}
        </div>
      </div>
    );
  }

  // إذا كان هناك خطأ ولكن نسمح بالوصول
  if (protectionStatus.error && showProtectionStatus) {
    return (
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">
              {language === 'ar' 
                ? 'تحذير: لا يمكن التحقق من حماية البريد العشوائي'
                : 'Warning: Unable to verify spam protection'
              }
            </span>
          </div>
        </div>
        {children}
      </div>
    );
  }

  // إذا كان المستخدم مسموحاً
  return (
    <div className="space-y-4">
      {showProtectionStatus && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
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

export default SpamProtectionWrapper;
