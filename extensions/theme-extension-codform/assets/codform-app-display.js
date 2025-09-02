// 🎯 عرض معلومات التطبيق بشكل جميل - CODMagnet App Display
(function() {
  'use strict';

  // 🎨 الألوان البنفسجية
  const COLORS = {
    primary: '#8B5CF6',      // بنفسجي أساسي
    secondary: '#A78BFA',    // بنفسجي فاتح
    accent: '#C4B5FD',       // بنفسجي ناعم
    dark: '#6D28D9',         // بنفسجي غامق
    light: '#EDE9FE',        // بنفسجي شاحب
    white: '#FFFFFF',
    black: '#1F2937'
  };

  // 🎯 معلومات التطبيق
  const APP_INFO = {
    name: 'CODMagnet',
    version: 'v2.1.0',
    environment: 'Production',
    url: 'https://apps.shopify.com/codform-1',
    shopUrl: 'https://astrem.myshopify.com'
  };

  // 🎨 أنماط العرض الجميل
  const DISPLAY_STYLES = {
    container: `
      background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.dark} 100%);
      color: ${COLORS.white};
      padding: 12px 20px;
      border-radius: 8px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 14px;
      font-weight: bold;
      text-shadow: 0 1px 2px rgba(0,0,0,0.3);
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
      margin: 8px 0;
      border: 2px solid ${COLORS.accent};
    `,
    
    appName: `
      color: ${COLORS.white};
      font-size: 16px;
      font-weight: bold;
      text-decoration: none;
      margin-right: 12px;
    `,
    
    version: `
      background: ${COLORS.accent};
      color: ${COLORS.dark};
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      margin: 0 8px;
    `,
    
    environment: `
      background: ${COLORS.secondary};
      color: ${COLORS.white};
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      margin: 0 4px;
    `,
    
    link: `
      color: ${COLORS.light};
      text-decoration: none;
      font-weight: 600;
      border-bottom: 1px dotted ${COLORS.light};
      transition: all 0.2s ease;
      margin-left: 12px;
    `,
    
    linkHover: `
      color: ${COLORS.white};
      border-bottom: 1px solid ${COLORS.white};
    `
  };

  // 🎯 دالة عرض معلومات التطبيق
  function displayAppInfo() {
    const timestamp = new Date().toLocaleTimeString('ar-SA', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // العرض الأساسي مثل الصورة
    console.log(
      `%c🎯 ${APP_INFO.name} %c${APP_INFO.version} %c${APP_INFO.environment} %c[${timestamp}]`,
      DISPLAY_STYLES.container,
      DISPLAY_STYLES.version,
      DISPLAY_STYLES.environment,
      'color: #A78BFA; font-weight: normal;'
    );

    // عرض الرابط
    console.log(
      `%c🔗 ${APP_INFO.url}`,
      `color: ${COLORS.primary}; font-weight: bold; font-size: 13px; text-decoration: underline;`
    );

    // معلومات إضافية
    console.log(
      `%c🏪 متجر: ${APP_INFO.shopUrl}`,
      `color: ${COLORS.secondary}; font-weight: 600; font-size: 12px;`
    );
  }

  // 🎨 عرض رسالة ترحيب بسيطة
  function showWelcome() {
    const welcomeStyle = `
      background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.dark} 100%);
      color: ${COLORS.white};
      padding: 16px 24px;
      border-radius: 10px;
      font-size: 15px;
      font-weight: bold;
      text-align: center;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
      box-shadow: 0 4px 16px rgba(139, 92, 246, 0.4);
      margin: 10px 0;
      border: 2px solid ${COLORS.accent};
    `;
    
    console.log(
      `%c✨ ${APP_INFO.name} ${APP_INFO.version} - جاهز للعمل ✨`,
      welcomeStyle
    );
  }

  // 🎯 دالة عرض معلومات مبسطة (مثل الصورة تماماً)
  function displaySimpleInfo() {
    // عرض بسيط مثل الصورة
    console.group(
      `%c🎯 ${APP_INFO.name} %c${APP_INFO.version} %c${APP_INFO.environment}`,
      `background: ${COLORS.primary}; color: white; padding: 6px 12px; border-radius: 6px; font-weight: bold;`,
      `background: ${COLORS.accent}; color: ${COLORS.dark}; padding: 2px 8px; border-radius: 10px; font-size: 11px; margin-left: 8px;`,
      `background: ${COLORS.secondary}; color: white; padding: 2px 8px; border-radius: 10px; font-size: 11px; margin-left: 4px;`
    );
    
    console.log(`%c🔗 ${APP_INFO.url}`, `color: ${COLORS.primary}; font-weight: bold; text-decoration: underline;`);
    console.log(`%c🏪 ${APP_INFO.shopUrl}`, `color: ${COLORS.secondary}; font-weight: 600;`);
    
    console.groupEnd();
  }

  // 🚀 تشغيل العرض
  function initialize() {
    // عرض رسالة الترحيب
    showWelcome();
    
    // عرض معلومات التطبيق (مثل الصورة)
    displaySimpleInfo();
    
    // إتاحة الدوال للاستخدام
    window.AppDisplay = {
      show: displaySimpleInfo,
      info: displayAppInfo,
      welcome: showWelcome
    };
  }

  // تشغيل النظام عند تحميل الصفحة
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

})();
