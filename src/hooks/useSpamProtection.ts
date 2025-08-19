import { useState, useEffect, useCallback } from 'react';
import { checkSpamProtection, handleBlockedUser } from '@/utils/spam-protection';
import { spamProtectionService, BlockedIP } from '@/services/SpamProtectionService';
import { getActiveShopId } from '@/utils/shop-utils';

interface SpamProtectionState {
  isChecking: boolean;
  isBlocked: boolean;
  isAllowed: boolean;
  redirectUrl?: string;
  reason?: string;
  error?: string;
}

interface UseSpamProtectionOptions {
  shopId?: string;
  enabled?: boolean;
  autoCheck?: boolean;
}

interface UseSpamProtectionReturn {
  // حالة الحماية
  protectionState: SpamProtectionState;
  
  // وظائف التحقق
  checkProtection: () => Promise<void>;
  resetProtection: () => void;
  
  // إدارة عناوين IP المحظورة
  blockedIPs: BlockedIP[];
  loadBlockedIPs: () => Promise<void>;
  addBlockedIP: (ip: string, reason?: string, redirectUrl?: string) => Promise<void>;
  removeBlockedIP: (blockedId: string) => Promise<void>;
  
  // حالة التحميل
  isLoadingIPs: boolean;
  isAddingIP: boolean;
  isRemovingIP: boolean;
}

export function useSpamProtection(options: UseSpamProtectionOptions = {}): UseSpamProtectionReturn {
  const { shopId, enabled = true, autoCheck = true } = options;
  
  const [protectionState, setProtectionState] = useState<SpamProtectionState>({
    isChecking: false,
    isBlocked: false,
    isAllowed: false
  });

  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [isLoadingIPs, setIsLoadingIPs] = useState(false);
  const [isAddingIP, setIsAddingIP] = useState(false);
  const [isRemovingIP, setIsRemovingIP] = useState(false);

  // التحقق من حماية البريد العشوائي
  const checkProtection = useCallback(async () => {
    if (!enabled) {
      setProtectionState({
        isChecking: false,
        isBlocked: false,
        isAllowed: true
      });
      return;
    }

    try {
      setProtectionState(prev => ({ ...prev, isChecking: true, error: undefined }));

      const targetShopId = shopId || getActiveShopId();
      const protection = await checkSpamProtection(targetShopId);

      if (protection.shouldBlock) {
        setProtectionState({
          isChecking: false,
          isBlocked: true,
          isAllowed: false,
          redirectUrl: protection.redirectUrl,
          reason: protection.reason
        });

        // معالجة المستخدم المحظور
        handleBlockedUser({
          isBlocked: true,
          redirectUrl: protection.redirectUrl,
          reason: protection.reason
        });
      } else {
        setProtectionState({
          isChecking: false,
          isBlocked: false,
          isAllowed: true
        });
      }
    } catch (error) {
      console.error('Error checking spam protection:', error);
      
      setProtectionState({
        isChecking: false,
        isBlocked: false,
        isAllowed: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [enabled, shopId]);

  // إعادة تعيين حالة الحماية
  const resetProtection = useCallback(() => {
    setProtectionState({
      isChecking: false,
      isBlocked: false,
      isAllowed: false
    });
  }, []);

  // تحميل قائمة عناوين IP المحظورة
  const loadBlockedIPs = useCallback(async () => {
    try {
      setIsLoadingIPs(true);
      const targetShopId = shopId || getActiveShopId();
      
      if (!targetShopId) {
        throw new Error('No active shop found');
      }

      const ips = await spamProtectionService.getBlockedIPs(targetShopId);
      setBlockedIPs(ips);
    } catch (error) {
      console.error('Error loading blocked IPs:', error);
      throw error;
    } finally {
      setIsLoadingIPs(false);
    }
  }, [shopId]);

  // إضافة عنوان IP إلى قائمة الحظر
  const addBlockedIP = useCallback(async (ip: string, reason?: string, redirectUrl?: string) => {
    try {
      setIsAddingIP(true);
      
      await spamProtectionService.addBlockedIP({
        ip_address: ip,
        reason,
        redirect_url: redirectUrl
      }, shopId);

      // إعادة تحميل القائمة
      await loadBlockedIPs();
    } catch (error) {
      console.error('Error adding blocked IP:', error);
      throw error;
    } finally {
      setIsAddingIP(false);
    }
  }, [shopId, loadBlockedIPs]);

  // إزالة عنوان IP من قائمة الحظر
  const removeBlockedIP = useCallback(async (blockedId: string) => {
    try {
      setIsRemovingIP(true);
      
      await spamProtectionService.removeBlockedIP(blockedId);

      // إعادة تحميل القائمة
      await loadBlockedIPs();
    } catch (error) {
      console.error('Error removing blocked IP:', error);
      throw error;
    } finally {
      setIsRemovingIP(false);
    }
  }, [loadBlockedIPs]);

  // التحقق التلقائي عند التحميل
  useEffect(() => {
    if (autoCheck) {
      checkProtection();
    }
  }, [autoCheck, checkProtection]);

  return {
    protectionState,
    checkProtection,
    resetProtection,
    blockedIPs,
    loadBlockedIPs,
    addBlockedIP,
    removeBlockedIP,
    isLoadingIPs,
    isAddingIP,
    isRemovingIP
  };
}

// Hook مبسط للتحقق من الحظر فقط
export function useSpamCheck(shopId?: string) {
  const [isBlocked, setIsBlocked] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkSpam = useCallback(async () => {
    try {
      setIsChecking(true);
      const protection = await checkSpamProtection(shopId);
      setIsBlocked(protection.shouldBlock);
      
      if (protection.shouldBlock) {
        handleBlockedUser({
          isBlocked: true,
          redirectUrl: protection.redirectUrl,
          reason: protection.reason
        });
      }
    } catch (error) {
      console.error('Error checking spam:', error);
      setIsBlocked(false); // في حالة الخطأ، نسمح بالوصول
    } finally {
      setIsChecking(false);
    }
  }, [shopId]);

  useEffect(() => {
    checkSpam();
  }, [checkSpam]);

  return {
    isBlocked,
    isChecking,
    checkSpam
  };
}

/**
 * Hook للتحقق من الحماية عند تحميل الصفحة
 */
export function useSpamProtectionGuard(shopId?: string) {
  useEffect(() => {
    const initProtection = async () => {
      try {
        const protection = await checkSpamProtection(shopId);

        if (protection.shouldBlock) {
          handleBlockedUser({
            isBlocked: true,
            redirectUrl: protection.redirectUrl,
            reason: protection.reason
          });
        }
      } catch (error) {
        console.error('Error initializing spam protection:', error);
      }
    };

    // تأخير قصير للسماح للصفحة بالتحميل
    const timer = setTimeout(initProtection, 1000);

    return () => clearTimeout(timer);
  }, [shopId]);
}
