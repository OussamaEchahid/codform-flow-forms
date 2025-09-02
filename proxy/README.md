# CODMagnet Google OAuth Proxy

Cloudflare Worker لحل مشكلة Google OAuth callback verification.

## المشكلة
Google يتطلب domain verification للـ OAuth callbacks، وهذا يسبب تحذيرات للمستخدمين.

## الحل
استخدام Cloudflare Worker كـ proxy يستقبل OAuth callbacks ويعيد توجيهها إلى Supabase function.

## الإعداد

### 1. إنشاء Cloudflare Worker
```bash
# في Cloudflare Dashboard
1. اذهب إلى Workers & Pages
2. أنشئ Worker جديد باسم "codmagnet-oauth-proxy" 
3. انسخ محتوى cloudflare-worker.js
```

### 2. إعداد Custom Domain (الحل المُحدث)

#### الخيار الأول: استخدام Subdomain (مُوصى به)
```bash
# في Cloudflare DNS
1. أضف CNAME record:
   Name: auth
   Target: little-mud-1110.codmagnet.workers.dev
   
# في Worker Settings > Triggers  
2. أضف Custom Domain: auth.codmagnet.com
```

#### الخيار الثاني: استخدام Route Pattern
```bash
# في Worker Settings > Triggers
1. أضف Route: codmagnet.com/auth/*
2. Zone: codmagnet.com
```

### 3. تحديث Google OAuth Settings
```bash
# في Google Cloud Console
Authorized redirect URIs:
- https://auth.codmagnet.com/auth/google/callback  # للـ subdomain
# أو
- https://codmagnet.com/auth/google/callback       # للـ route pattern
```

### 4. تحديث Supabase Auth Settings
```bash
# في Supabase Dashboard > Authentication > URL Configuration
Site URL: https://codmagnet.com
Redirect URLs: 
- https://auth.codmagnet.com/auth/google/callback  # للـ subdomain
# أو  
- https://codmagnet.com/auth/google/callback       # للـ route pattern
```

## حل مشكلة DNS Conflict

إذا واجهت خطأ "already has externally managed DNS records":

### الحل 1: استخدام Subdomain
```bash
# أضف CNAME record في Cloudflare DNS:
Name: auth
Target: little-mud-1110.codmagnet.workers.dev
Proxy status: Proxied (🧡)
```

### الحل 2: استخدام Route Pattern
```bash
# في Worker Triggers:
Route: codmagnet.com/auth/*
Zone: codmagnet.com
```

## الاختبار
```bash
# للـ subdomain
curl https://auth.codmagnet.com/health

# للـ route pattern  
curl https://codmagnet.com/auth/health
```

## المسارات
- `/auth/google/callback` - OAuth callback proxy
- `/auth/error` - صفحة خطأ مخصصة
- `/health` - فحص صحة الخدمة

## ملاحظات مهمة
- استخدم الـ subdomain إذا كان لديك سجلات DNS خارجية
- Route pattern يعمل فقط للمسارات المحددة
- تأكد من تحديث Google OAuth settings بعد التغيير
