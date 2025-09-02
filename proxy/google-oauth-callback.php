<?php
/**
 * Google OAuth Callback Proxy for CODMagnet
 * يعيد توجيه طلبات Google OAuth إلى Supabase function
 * مع الحفاظ على جميع المعاملات والحالة
 */

// تمكين CORS للطلبات من جميع النطاقات
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// التعامل مع طلبات OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // الحصول على جميع معاملات الاستعلام من Google
    $queryParams = $_GET;
    
    // التحقق من وجود المعاملات المطلوبة
    if (!isset($queryParams['code']) && !isset($queryParams['error'])) {
        throw new Exception('Missing required OAuth parameters');
    }
    
    // بناء URL الهدف (Supabase function)
    $targetUrl = 'https://trlklwixfeaexhydzaue.supabase.co/functions/v1/google-oauth-callback';
    
    // إضافة جميع معاملات الاستعلام
    if (!empty($queryParams)) {
        $targetUrl .= '?' . http_build_query($queryParams);
    }
    
    // تسجيل العملية للمراقبة
    error_log("CODMagnet OAuth Proxy: Redirecting to " . $targetUrl);
    
    // إعادة التوجيه مع الحفاظ على جميع المعاملات
    header('Location: ' . $targetUrl, true, 302);
    exit();
    
} catch (Exception $e) {
    // في حالة الخطأ، إعادة توجيه إلى صفحة خطأ مخصصة
    error_log("CODMagnet OAuth Proxy Error: " . $e->getMessage());
    
    $errorUrl = 'https://codmagnet.com/auth/error?message=' . urlencode($e->getMessage());
    header('Location: ' . $errorUrl, true, 302);
    exit();
}
?>
