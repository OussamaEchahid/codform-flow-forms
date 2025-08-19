import { NextApiRequest, NextApiResponse } from 'next';
import { spamProtectionService } from '@/services/SpamProtectionService';

/**
 * API endpoint للتحقق من حماية البريد العشوائي
 * يستخدم من قبل Shopify Extension
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // السماح بـ CORS للطلبات من Shopify
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // التعامل مع preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ip, shop_domain, source } = req.body;

    // التحقق من البيانات المطلوبة
    if (!ip || !shop_domain) {
      return res.status(400).json({ 
        error: 'Missing required fields: ip and shop_domain' 
      });
    }

    // التحقق من أن الطلب من Shopify Extension
    if (source !== 'shopify_extension') {
      return res.status(403).json({ 
        error: 'Unauthorized source' 
      });
    }

    // البحث عن shop_id من domain
    const shopId = await getShopIdFromDomain(shop_domain);
    if (!shopId) {
      return res.status(404).json({ 
        error: 'Shop not found' 
      });
    }

    // التحقق من حالة الحظر
    const result = await spamProtectionService.checkIPBlocked(ip, shopId);

    // إرجاع النتيجة
    res.status(200).json({
      is_blocked: result.is_blocked,
      reason: result.reason,
      redirect_url: result.redirect_url,
      shop_domain: shop_domain,
      checked_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in spam-check API:', error);
    
    // في حالة الخطأ، السماح بالوصول (fail-safe)
    res.status(200).json({
      is_blocked: false,
      error: 'Internal server error',
      checked_at: new Date().toISOString()
    });
  }
}

/**
 * الحصول على shop_id من domain
 */
async function getShopIdFromDomain(domain: string): Promise<string | null> {
  try {
    // إزالة .myshopify.com من النهاية
    const shopName = domain.replace('.myshopify.com', '');
    
    // البحث في قاعدة البيانات عن المتجر
    const { data, error } = await spamProtectionService.supabase
      .from('shops')
      .select('id')
      .eq('shop_domain', shopName)
      .single();

    if (error || !data) {
      console.error('Shop not found:', domain, error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Error getting shop ID:', error);
    return null;
  }
}
