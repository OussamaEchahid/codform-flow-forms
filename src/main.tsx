
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/form-builder.css'

// تأكد من وجود العنصر الجذر قبل التحميل
document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById("root");
  
  if (rootElement) {
    createRoot(rootElement).render(<App />);
  } else {
    console.error("لم يتم العثور على عنصر الجذر #root");
  }
});
