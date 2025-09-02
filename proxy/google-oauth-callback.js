/**
 * Google OAuth Callback Proxy for CODMagnet
 * Node.js/Express version
 */

const express = require('express');
const cors = require('cors');
const app = express();

// تمكين CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Google OAuth Callback Proxy
app.get('/auth/google/callback', async (req, res) => {
  try {
    console.log('🔄 CODMagnet OAuth Proxy: Received callback from Google');
    console.log('📋 Query params:', req.query);
    
    // التحقق من وجود المعاملات المطلوبة
    if (!req.query.code && !req.query.error) {
      throw new Error('Missing required OAuth parameters');
    }
    
    // بناء URL الهدف
    const targetUrl = new URL('https://trlklwixfeaexhydzaue.supabase.co/functions/v1/google-oauth-callback');
    
    // إضافة جميع معاملات الاستعلام
    Object.keys(req.query).forEach(key => {
      targetUrl.searchParams.append(key, req.query[key]);
    });
    
    console.log('🎯 Redirecting to:', targetUrl.toString());
    
    // إعادة التوجيه
    res.redirect(302, targetUrl.toString());
    
  } catch (error) {
    console.error('❌ CODMagnet OAuth Proxy Error:', error.message);
    
    // إعادة توجيه إلى صفحة خطأ
    const errorUrl = `https://codmagnet.com/auth/error?message=${encodeURIComponent(error.message)}`;
    res.redirect(302, errorUrl);
  }
});

// صفحة خطأ بسيطة
app.get('/auth/error', (req, res) => {
  const message = req.query.message || 'Unknown error occurred';
  res.send(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>خطأ في المصادقة - CODMagnet</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; padding: 50px; }
        .error { color: #e74c3c; margin: 20px 0; }
        .retry { background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <h1>خطأ في المصادقة</h1>
      <p class="error">${message}</p>
      <a href="https://codmagnet.com" class="retry">العودة للصفحة الرئيسية</a>
    </body>
    </html>
  `);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'CODMagnet OAuth Proxy' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 CODMagnet OAuth Proxy running on port ${PORT}`);
});

module.exports = app;
