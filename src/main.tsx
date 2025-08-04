
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/form-builder.css'
import { CurrencyService } from './lib/services/CurrencyService'

// تهيئة CurrencyService عند بدء التطبيق
CurrencyService.initialize();

// جعل CurrencyService متاحاً عالمياً لملفات شوبيفاي
declare global {
  interface Window {
    CurrencyService: typeof CurrencyService;
  }
}
window.CurrencyService = CurrencyService;

createRoot(document.getElementById("root")!).render(<App />);
