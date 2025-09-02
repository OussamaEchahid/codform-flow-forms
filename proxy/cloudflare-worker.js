/**
 * Cloudflare Worker for Google OAuth Callback Proxy
 * الأسرع والأرخص - يعمل على شبكة Cloudflare العالمية
 *
 * Route Pattern: codmagnet.com/auth/google/callback
 * يتعامل مع جميع المسارات التي تبدأ بـ /auth/
 */

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)

  // التحقق من المسار - يجب أن يكون /auth/google/callback فقط
  if (url.pathname === '/auth/google/callback') {
    return handleGoogleCallback(request)
  }

  // أي مسار آخر - إعادة توجيه للصفحة الرئيسية
  return Response.redirect('https://codmagnet.com', 302)
}

async function handleGoogleCallback(request) {
  try {
    const url = new URL(request.url)
    console.log('🔄 CODMagnet OAuth Proxy: Received callback from Google')

    // بناء URL الهدف مباشرة
    const targetUrl = new URL('https://trlklwixfeaexhydzaue.supabase.co/functions/v1/google-oauth-callback')

    // نسخ جميع معاملات الاستعلام
    url.searchParams.forEach((value, key) => {
      targetUrl.searchParams.append(key, value)
    })

    console.log('🎯 Redirecting to:', targetUrl.toString())

    // إعادة التوجيه مع headers مناسبة
    return Response.redirect(targetUrl.toString(), 302)

  } catch (error) {
    console.error('❌ CODMagnet OAuth Proxy Error:', error.message)

    // في حالة الخطأ، إعادة توجيه لصفحة القنوات مع رسالة خطأ
    const errorUrl = `https://codmagnet.com/orders/channels?error=${encodeURIComponent(error.message)}`
    return Response.redirect(errorUrl, 302)
  }
}

async function handleError(request) {
  const url = new URL(request.url)
  const message = url.searchParams.get('message') || 'حدث خطأ غير معروف'
  
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>خطأ في المصادقة - CODMagnet</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          text-align: center;
          padding: 50px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          min-height: 100vh;
          margin: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        .container {
          background: rgba(255, 255, 255, 0.1);
          padding: 40px;
          border-radius: 15px;
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        .error {
          color: #ff6b6b;
          margin: 20px 0;
          font-size: 18px;
        }
        .retry {
          background: #4ecdc4;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 25px;
          display: inline-block;
          margin-top: 20px;
          transition: all 0.3s ease;
        }
        .retry:hover {
          background: #45b7aa;
          transform: translateY(-2px);
        }
        h1 {
          margin-bottom: 20px;
          font-size: 2.5em;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🔐 خطأ في المصادقة</h1>
        <p class="error">${message}</p>
        <p>نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى.</p>
        <a href="https://codmagnet.com" class="retry">🏠 العودة للصفحة الرئيسية</a>
      </div>
    </body>
    </html>
  `
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  })
}
