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
   * الحصول على عنوان IP الحالي للمستخدم
   */
  async getCurrentUserIP(): Promise<string | null> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Error getting current IP:', error);
      return null;
    }
  }

  /**
   * التحقق من حظر عنوان IP
   */
  async checkIPBlocked(ipAddress: string, shopId?: string): Promise<BlockedIPCheck> {
    try {
      const targetShopId = shopId || getActiveShopId();

      // استخدام fetch مباشرة مع URL parameters
      const url = new URL('https://trlklwixfeaexhydzaue.supabase.co/functions/v1/spam-protection');
      url.searchParams.set('action', 'check');
      url.searchParams.set('ip', ipAddress);
      if (targetShopId) {
        url.searchParams.set('shop_id', targetShopId);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
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

      const url = new URL('https://trlklwixfeaexhydzaue.supabase.co/functions/v1/spam-protection');
      url.searchParams.set('action', 'list');
      url.searchParams.set('shop_id', targetShopId);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
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

      const url = new URL('https://trlklwixfeaexhydzaue.supabase.co/functions/v1/spam-protection');
      url.searchParams.set('action', 'add');

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ip_address: request.ip_address,
          shop_id: targetShopId,
          reason: request.reason,
          redirect_url: request.redirect_url
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

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
      const url = new URL('https://trlklwixfeaexhydzaue.supabase.co/functions/v1/spam-protection');
      url.searchParams.set('action', 'remove');

      const response = await fetch(url.toString(), {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          blocked_id: blockedId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

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
      const url = new URL('https://trlklwixfeaexhydzaue.supabase.co/functions/v1/spam-protection');
      url.searchParams.set('action', 'update');

      const response = await fetch(url.toString(), {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          blocked_id: request.blocked_id,
          reason: request.reason,
          redirect_url: request.redirect_url,
          is_active: request.is_active
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

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
