
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/form-builder.css'
import { CurrencyService } from './lib/services/CurrencyService'

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
  }
}

// التأكد من أن CurrencyService متاح في النافذة العالمية
window.CurrencyService = CurrencyService;

// إعادة تهيئة CurrencyService عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
  if (window.CurrencyService && typeof window.CurrencyService.initialize === 'function') {
    window.CurrencyService.initialize();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
