import { NextApiRequest, NextApiResponse } from 'next';
import { shopifySupabase } from '@/lib/shopify/supabase-client';

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

    // التحقق من حالة الحظر - أولاً للمتجر المحدد، ثم للحظر العام
    let blockResult = null;
    let error = null;

    // البحث في المتجر المحدد أولاً
    const { data: shopSpecificResult, error: shopError } = await shopifySupabase.rpc('is_ip_blocked', {
      p_ip_address: ip,
      p_shop_id: shop_domain
    });

    if (!shopError && shopSpecificResult && Array.isArray(shopSpecificResult) && shopSpecificResult[0]?.is_blocked) {
      blockResult = shopSpecificResult;
    } else {
      // البحث في الحظر العام (default)
      const { data: globalResult, error: globalError } = await shopifySupabase.rpc('is_ip_blocked', {
        p_ip_address: ip,
        p_shop_id: 'default'
      });

      blockResult = globalResult;
      error = globalError;
    }

    if (error) {
      console.error('Database error:', error);
      // في حالة خطأ قاعدة البيانات، السماح بالوصول (fail-safe)
      return res.status(200).json({
        is_blocked: false,
        error: 'Database error',
        checked_at: new Date().toISOString()
      });
    }

    // إرجاع النتيجة
    const result = Array.isArray(blockResult) ? blockResult[0] : blockResult;

    if (result && result.is_blocked) {
      res.status(200).json({
        is_blocked: true,
        reason: result.reason || 'IP address is blocked',
        redirect_url: result.redirect_url || 'https://codmagnet.com/blocked',
        shop_domain: shop_domain,
        checked_at: new Date().toISOString()
      });
    } else {
      res.status(200).json({
        is_blocked: false,
        shop_domain: shop_domain,
        checked_at: new Date().toISOString()
      });
    }

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
