import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/form-builder.css'
import './lib/perf/disableConsoleInProd'
import { initWebVitals } from './lib/perf/webVitals'
import { CurrencyService } from './lib/services/CurrencyService'

// Start measuring Web Vitals early
initWebVitals();

// تهيئة CurrencyService عند بدء التطبيق
CurrencyService.initialize().then(() => {
  console.log('✅ CurrencyService initialized successfully');
}).catch(error => {
  console.error('❌ Error initializing CurrencyService:', error);
});

// جعل CurrencyService متاحاً عالمياً لملفات شوبيفاي
declare global {
  interface Window {
    CurrencyService: typeof CurrencyService;
    CurrencyServiceStorage: {
      getDisplaySettings: () => any;
      getCustomRates: () => Record<string, any>;
    };
  }
}

// التأكد من أن CurrencyService متاح في النافذة العالمية
window.CurrencyService = CurrencyService;

// تصدير localStorage للـ Shopify Extensions
window.CurrencyServiceStorage = {
  getDisplaySettings: () => {
    try {
      const saved = localStorage.getItem('codform_currency_display_settings');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  },
  getCustomRates: () => {
    try {
      const saved = localStorage.getItem('codform_custom_currency_rates');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  }
};

// إعادة تهيئة CurrencyService عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
  if (window.CurrencyService && typeof window.CurrencyService.initialize === 'function') {
    window.CurrencyService.initialize();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
