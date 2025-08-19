import { supabase } from '@/integrations/supabase/client';
import { getActiveShopId } from '@/utils/shop-utils';

export interface BlockedIP {
  id: string;
  ip_address: string;
  shop_id: string;
  user_id?: string;
  reason?: string;
  redirect_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlockedIPCheck {
  is_blocked: boolean;
  redirect_url?: string;
  reason?: string;
}

export interface AddBlockedIPRequest {
  ip_address: string;
  reason?: string;
  redirect_url?: string;
}

export interface UpdateBlockedIPRequest {
  blocked_id: string;
  reason?: string;
  redirect_url?: string;
  is_active?: boolean;
}

class SpamProtectionService {
  private static instance: SpamProtectionService;

  public static getInstance(): SpamProtectionService {
    if (!SpamProtectionService.instance) {
      SpamProtectionService.instance = new SpamProtectionService();
    }
    return SpamProtectionService.instance;
  }

  /**
   * التحقق من حظر عنوان IP
   */
  async checkIPBlocked(ipAddress: string, shopId?: string): Promise<BlockedIPCheck> {
    try {
      const targetShopId = shopId || getActiveShopId();
      
      const { data, error } = await supabase.functions.invoke('spam-protection', {
        method: 'GET',
        body: null,
        headers: {
          'Content-Type': 'application/json'
        }
      }, {
        query: {
          action: 'check',
          ip: ipAddress,
          shop_id: targetShopId
        }
      });

      if (error) {
        console.error('Error checking IP block:', error);
        throw new Error('فشل في التحقق من حالة حظر عنوان IP');
      }

      return data as BlockedIPCheck;
    } catch (error) {
      console.error('SpamProtectionService.checkIPBlocked error:', error);
      throw error;
    }
  }

  /**
   * جلب قائمة عناوين IP المحظورة
   */
  async getBlockedIPs(shopId?: string): Promise<BlockedIP[]> {
    try {
      const targetShopId = shopId || getActiveShopId();
      
      if (!targetShopId) {
        throw new Error('لم يتم العثور على متجر نشط');
      }

      const { data, error } = await supabase.functions.invoke('spam-protection', {
        method: 'GET',
        body: null,
        headers: {
          'Content-Type': 'application/json'
        }
      }, {
        query: {
          action: 'list',
          shop_id: targetShopId
        }
      });

      if (error) {
        console.error('Error fetching blocked IPs:', error);
        throw new Error('فشل في جلب قائمة عناوين IP المحظورة');
      }

      return data.blocked_ips || [];
    } catch (error) {
      console.error('SpamProtectionService.getBlockedIPs error:', error);
      throw error;
    }
  }

  /**
   * إضافة عنوان IP إلى قائمة الحظر
   */
  async addBlockedIP(request: AddBlockedIPRequest, shopId?: string): Promise<string> {
    try {
      const targetShopId = shopId || getActiveShopId();
      
      if (!targetShopId) {
        throw new Error('لم يتم العثور على متجر نشط');
      }

      // التحقق من صحة عنوان IP
      if (!this.isValidIPAddress(request.ip_address)) {
        throw new Error('عنوان IP غير صحيح');
      }

      const { data, error } = await supabase.functions.invoke('spam-protection', {
        method: 'POST',
        body: {
          ip_address: request.ip_address,
          shop_id: targetShopId,
          reason: request.reason,
          redirect_url: request.redirect_url
        },
        headers: {
          'Content-Type': 'application/json'
        }
      }, {
        query: {
          action: 'add'
        }
      });

      if (error) {
        console.error('Error adding blocked IP:', error);
        throw new Error('فشل في إضافة عنوان IP إلى قائمة الحظر');
      }

      if (!data.success) {
        throw new Error(data.error || 'فشل في إضافة عنوان IP');
      }

      return data.blocked_id;
    } catch (error) {
      console.error('SpamProtectionService.addBlockedIP error:', error);
      throw error;
    }
  }

  /**
   * إزالة عنوان IP من قائمة الحظر
   */
  async removeBlockedIP(blockedId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('spam-protection', {
        method: 'DELETE',
        body: {
          blocked_id: blockedId
        },
        headers: {
          'Content-Type': 'application/json'
        }
      }, {
        query: {
          action: 'remove'
        }
      });

      if (error) {
        console.error('Error removing blocked IP:', error);
        throw new Error('فشل في إزالة عنوان IP من قائمة الحظر');
      }

      if (!data.success) {
        throw new Error(data.error || 'فشل في إزالة عنوان IP');
      }

      return true;
    } catch (error) {
      console.error('SpamProtectionService.removeBlockedIP error:', error);
      throw error;
    }
  }

  /**
   * تحديث عنوان IP محظور
   */
  async updateBlockedIP(request: UpdateBlockedIPRequest): Promise<BlockedIP> {
    try {
      const { data, error } = await supabase.functions.invoke('spam-protection', {
        method: 'PUT',
        body: {
          blocked_id: request.blocked_id,
          reason: request.reason,
          redirect_url: request.redirect_url,
          is_active: request.is_active
        },
        headers: {
          'Content-Type': 'application/json'
        }
      }, {
        query: {
          action: 'update'
        }
      });

      if (error) {
        console.error('Error updating blocked IP:', error);
        throw new Error('فشل في تحديث عنوان IP المحظور');
      }

      if (!data.success) {
        throw new Error(data.error || 'فشل في تحديث عنوان IP');
      }

      return data.blocked_ip;
    } catch (error) {
      console.error('SpamProtectionService.updateBlockedIP error:', error);
      throw error;
    }
  }

  /**
   * التحقق من صحة عنوان IP
   */
  private isValidIPAddress(ip: string): boolean {
    // IPv4 validation
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    
    // IPv6 validation (basic)
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  /**
   * الحصول على عنوان IP الحالي للمستخدم
   */
  async getCurrentUserIP(): Promise<string | null> {
    try {
      // محاولة الحصول على IP من خدمة خارجية
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || null;
    } catch (error) {
      console.error('Error getting current user IP:', error);
      return null;
    }
  }

  /**
   * التحقق من حظر المستخدم الحالي
   */
  async checkCurrentUserBlocked(shopId?: string): Promise<BlockedIPCheck> {
    try {
      const userIP = await this.getCurrentUserIP();
      if (!userIP) {
        return { is_blocked: false };
      }

      return await this.checkIPBlocked(userIP, shopId);
    } catch (error) {
      console.error('Error checking current user block status:', error);
      return { is_blocked: false };
    }
  }
}

export const spamProtectionService = SpamProtectionService.getInstance();
