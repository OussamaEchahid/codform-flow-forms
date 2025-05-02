
import { useState, useCallback } from 'react';
import { FormData } from '@/lib/hooks/form/types';

/**
 * Hook for managing form cache
 */
export const useFormCache = () => {
  const [formCache, setFormCache] = useState<Record<string, FormData>>({});

  const updateFormInCache = useCallback((form: FormData) => {
    setFormCache(prev => ({ ...prev, [form.id]: form }));
  }, []);

  const removeFormFromCache = useCallback((formId: string) => {
    setFormCache(prev => {
      const newCache = { ...prev };
      delete newCache[formId];
      return newCache;
    });
  }, []);

  const clearFormCache = useCallback(() => {
    console.log("useFormCache: Clearing form cache");
    setFormCache({});
    return Promise.resolve();
  }, []);

  return {
    formCache,
    updateFormInCache,
    removeFormFromCache,
    clearFormCache
  };
};
