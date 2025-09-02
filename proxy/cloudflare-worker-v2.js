/**
 * Cloudflare Worker v2 - OAuth Proxy for CODMagnet
 * Route: codmagnet.com/auth/*
 * يتعامل مع جميع طلبات OAuth
 */

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  console.log('🔄 Worker triggered for:', url.pathname)
  
  // التحقق من المسار - أي شيء يبدأ بـ /auth/
  if (url.pathname.startsWith('/auth/')) {
    return handleAuthRequest(request)
  }
  
  // أي مسار آخر - إعادة توجيه للصفحة الرئيسية
  return Response.redirect('https://codmagnet.com', 302)
}

async function handleAuthRequest(request) {
  try {
    const url = new URL(request.url)
    console.log('🎯 Auth request received:', url.pathname)
    console.log('📋 Query params:', url.search)
    
    // بناء URL الهدف
    let targetUrl
    
    if (url.pathname === '/auth/google/callback') {
      // Google OAuth callback
      targetUrl = new URL('https://trlklwixfeaexhydzaue.supabase.co/functions/v1/google-oauth-callback')
    } else {
      // أي auth endpoint آخر - توجيه عام لـ Supabase
      const endpoint = url.pathname.replace('/auth/', '')
      targetUrl = new URL(`https://trlklwixfeaexhydzaue.supabase.co/functions/v1/${endpoint}`)
    }
    
    // نسخ جميع معاملات الاستعلام
    url.searchParams.forEach((value, key) => {
      targetUrl.searchParams.append(key, value)
    })
    
    console.log('🚀 Redirecting to:', targetUrl.toString())
    
    // إعادة التوجيه
    return Response.redirect(targetUrl.toString(), 302)
    
  } catch (error) {
    console.error('❌ Auth Proxy Error:', error.message)
    
    // في حالة الخطأ
    const errorUrl = `https://codmagnet.com/orders/channels?error=${encodeURIComponent(error.message)}`
    return Response.redirect(errorUrl, 302)
  }
}
