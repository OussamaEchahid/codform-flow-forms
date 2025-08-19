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

    // التحقق من حالة الحظر
    const { data: blockedIP, error } = await shopifySupabase
      .from('blocked_ips')
      .select('*')
      .eq('ip_address', ip)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Database error:', error);
      // في حالة خطأ قاعدة البيانات، السماح بالوصول (fail-safe)
      return res.status(200).json({
        is_blocked: false,
        error: 'Database error',
        checked_at: new Date().toISOString()
      });
    }

    // إرجاع النتيجة
    if (blockedIP) {
      res.status(200).json({
        is_blocked: true,
        reason: blockedIP.reason || 'IP address is blocked',
        redirect_url: 'https://codmagnet.com/blocked',
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
