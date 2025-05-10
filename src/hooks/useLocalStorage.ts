
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  // استخدام وظيفة لتحديد القيمة الأولية
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      // الحصول على العنصر من التخزين المحلي
      const item = window.localStorage.getItem(key);
      // تحليل العنصر المخزن أو إرجاع القيمة الأولية
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // إذا كان هناك خطأ، أرجع القيمة الأولية
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // الرجوع إلى مرجع التخزين المحلي الذي تم تحديده
  const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
    try {
      // السماح بالقيمة كدالة مثل setState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      // حفظ الحالة
      setStoredValue(valueToStore);
      
      // حفظ في التخزين المحلي
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      // توثيق الأخطاء فقط ولكن لا تتوقف
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  // تحديث التخزين المحلي إذا تغير المفتاح
  useEffect(() => {
    const savedItem = localStorage.getItem(key);
    if (savedItem) {
      try {
        setStoredValue(JSON.parse(savedItem));
      } catch (error) {
        console.error(`Error parsing localStorage item "${key}":`, error);
      }
    }
  }, [key]);

  return [storedValue, setValue];
}
