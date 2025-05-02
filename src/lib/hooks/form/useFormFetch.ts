
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FormData } from './types';
import { toast } from 'sonner';

export const useFormFetch = () => {
  const [forms, setForms] = useState<FormData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [fetchAttempts, setFetchAttempts] = useState<number>(0);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online');
  
  // Referencia para seguir intentos pendientes de sincronización
  const pendingSyncRef = useRef<boolean>(false);
  
  // Monitorear el estado de la conexión
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network is now online');
      setNetworkStatus('online');
      
      // Al recuperar la conexión, intentar sincronizar formularios pendientes
      if (pendingSyncRef.current) {
        syncOfflineForms();
      }
    };
    
    const handleOffline = () => {
      console.log('Network is now offline');
      setNetworkStatus('offline');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Estado inicial
    setNetworkStatus(navigator.onLine ? 'online' : 'offline');
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Debug mejorado
  const logDebug = (message: string, data?: any) => {
    console.log(`[FormFetch] ${message}`, data || '');
  };

  // Reiniciar el error después de un tiempo para permitir reintentos
  useEffect(() => {
    let errorTimer: ReturnType<typeof setTimeout> | null = null;
    
    if (error && fetchAttempts <= 3) {
      errorTimer = setTimeout(() => {
        setError('');
      }, 5000); // Limpiar error tras 5 segundos
    }
    
    return () => {
      if (errorTimer) clearTimeout(errorTimer);
    };
  }, [error, fetchAttempts]);
  
  // Sincronizar formularios guardados offline al recuperar la conexión
  const syncOfflineForms = useCallback(async () => {
    if (!navigator.onLine) {
      logDebug('Cannot sync offline forms: still offline');
      return;
    }
    
    try {
      logDebug('Checking for offline forms to sync...');
      const offlineFormsStr = localStorage.getItem('offline_forms');
      
      if (!offlineFormsStr) {
        pendingSyncRef.current = false;
        return;
      }
      
      const offlineForms = JSON.parse(offlineFormsStr);
      
      if (!Array.isArray(offlineForms) || offlineForms.length === 0) {
        pendingSyncRef.current = false;
        localStorage.removeItem('offline_forms');
        return;
      }
      
      logDebug(`Found ${offlineForms.length} offline forms to sync`);
      
      // Procesar cada formulario
      const syncPromises = offlineForms.map(async (form) => {
        try {
          const { id, pendingSave, ...formData } = form;
          
          if (!pendingSave) return null;
          
          let response;
          
          // Si es un formulario nuevo (ID temporal)
          if (id.startsWith('new-')) {
            response = await supabase
              .from('forms')
              .insert(formData)
              .select()
              .single();
          } else {
            // Actualizar formulario existente
            response = await supabase
              .from('forms')
              .update(formData)
              .eq('id', id)
              .select()
              .single();
          }
          
          if (response.error) throw response.error;
          
          return { originalId: id, newId: response.data.id, success: true };
        } catch (error) {
          console.error('Error syncing offline form:', error);
          return { originalId: form.id, error, success: false };
        }
      });
      
      // Esperar a que se completen todas las sincronizaciones
      const results = await Promise.all(syncPromises);
      const successCount = results.filter(r => r && r.success).length;
      
      if (successCount > 0) {
        toast.success(`Synchronized ${successCount} forms successfully`);
        
        // Actualizar el almacenamiento local
        const remainingForms = offlineForms.filter(form => {
          const result = results.find(r => r && r.originalId === form.id);
          return !result || !result.success;
        });
        
        if (remainingForms.length > 0) {
          localStorage.setItem('offline_forms', JSON.stringify(remainingForms));
          pendingSyncRef.current = true;
        } else {
          localStorage.removeItem('offline_forms');
          pendingSyncRef.current = false;
        }
        
        // Refrescar la lista de formularios
        fetchForms();
      }
    } catch (error) {
      logDebug('Error in syncOfflineForms:', error);
    }
  }, []);
  
  // Comprobar formularios offline pendientes en el inicio
  useEffect(() => {
    const checkOfflineForms = () => {
      try {
        const offlineFormsStr = localStorage.getItem('offline_forms');
        if (offlineFormsStr) {
          const offlineForms = JSON.parse(offlineFormsStr);
          if (Array.isArray(offlineForms) && offlineForms.some(form => form.pendingSave)) {
            pendingSyncRef.current = true;
            
            // Si estamos online, intentar sincronizar inmediatamente
            if (navigator.onLine) {
              syncOfflineForms();
            }
          }
        }
      } catch (e) {
        console.error('Error checking offline forms:', e);
      }
    };
    
    checkOfflineForms();
  }, [syncOfflineForms]);

  // Mejorado para usar caché local y manejo de error
  const fetchForms = useCallback(async () => {
    // Evitar múltiples llamadas en poco tiempo
    const now = Date.now();
    if (now - lastFetchTime < 2000 && forms.length > 0 && !error) {
      logDebug('Skipping fetch, last fetch was recent');
      return forms;
    }
    
    setIsLoading(true);
    setFetchAttempts(prev => prev + 1);
    
    try {
      logDebug('Attempting to fetch forms from Supabase...');
      
      // Si estamos offline, usar caché local
      if (!navigator.onLine) {
        throw new Error('offline');
      }
      
      // Intentar obtener datos de Supabase
      const { data, error: fetchError } = await supabase
        .from('forms')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Manejar error de Supabase
      if (fetchError) {
        throw fetchError;
      }

      // Actualizar estado con los datos obtenidos
      logDebug('Forms fetched successfully:', data);
      setForms(Array.isArray(data) ? data : []);
      setError('');
      setLastFetchTime(now);
      
      // Guardar en caché para uso offline
      try {
        localStorage.setItem('cached_forms', JSON.stringify(data));
        localStorage.setItem('forms_last_fetch', now.toString());
      } catch (cacheError) {
        logDebug('Error caching forms:', cacheError);
      }
      
      // Devolver los datos para uso inmediato
      return data || [];
    } catch (err) {
      // Manejo de error mejorado
      let usingCache = false;
      const isOffline = err instanceof Error && err.message === 'offline';
      
      const errorMessage = isOffline 
        ? 'You are offline. Using locally stored data.' 
        : (err instanceof Error ? err.message : 'حدث خطأ أثناء جلب النماذج');
        
      logDebug('Error fetching forms:', err);
      setError(errorMessage);
      
      // Intentar usar datos en caché como respaldo
      try {
        const cachedForms = localStorage.getItem('cached_forms');
        const lastFetchTimeStr = localStorage.getItem('forms_last_fetch');
        
        if (cachedForms) {
          const parsedForms = JSON.parse(cachedForms);
          logDebug('Using cached forms:', parsedForms);
          
          if (parsedForms && Array.isArray(parsedForms) && parsedForms.length > 0) {
            setForms(parsedForms);
            usingCache = true;
            
            // Mostrar toast solo una vez cuando se usa datos en caché
            if (fetchAttempts <= 1 && !isOffline) {
              toast.info('استخدام بيانات محفوظة محليًا نظرًا لمشكلة في الاتصال');
            } else if (isOffline && fetchAttempts <= 1) {
              toast.info('أنت حاليًا في وضع عدم الاتصال. يتم استخدام البيانات المخزنة محليًا.');
            }
            
            return parsedForms;
          }
        }
      } catch (cacheError) {
        logDebug('Error retrieving cached forms:', cacheError);
      }
      
      // Sin datos en caché disponibles
      if (!usingCache) {
        setForms([]);
      }
      
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [forms, lastFetchTime, error, fetchAttempts]);
  
  // Obtener un formulario por ID con manejo de error y caché mejorado
  const getFormById = async (formId: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      logDebug(`Attempting to fetch form with ID: ${formId}`);
      
      // Caso de formulario nuevo
      if (formId === 'new') {
        logDebug('Creating new form template');
        setIsLoading(false);
        return {
          id: 'new',
          title: 'نموذج جديد',
          description: '',
          data: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: '',
          is_published: false
        };
      }
      
      // Verificar formulario en caché del borrador
      try {
        const draftForm = localStorage.getItem(`form_draft_${formId}`);
        if (draftForm) {
          const parsedDraft = JSON.parse(draftForm);
          const lastModified = new Date(parsedDraft.lastModified || 0);
          const now = new Date();
          
          // Si el borrador es reciente (menos de 1 hora)
          if ((now.getTime() - lastModified.getTime()) < 3600000) {
            logDebug('Found recent draft form:', parsedDraft);
            
            // Si estamos offline, usar el borrador directamente
            if (!navigator.onLine) {
              toast.info('استخدام مسودة محلية - أنت غير متصل بالإنترنت');
              
              return {
                id: formId,
                ...parsedDraft,
                created_at: parsedDraft.created_at || new Date().toISOString(),
                updated_at: parsedDraft.lastModified || new Date().toISOString()
              };
            }
          }
        }
      } catch (draftError) {
        console.error('Error checking draft form:', draftError);
      }
      
      // Si estamos offline, intentar obtener versión en caché
      if (!navigator.onLine) {
        const cachedForm = localStorage.getItem(`form_${formId}`);
        
        if (cachedForm) {
          const parsedForm = JSON.parse(cachedForm);
          logDebug('Using cached form (offline mode):', parsedForm);
          toast.info('استخدام نسخة محفوظة من النموذج - أنت غير متصل بالإنترنت');
          return parsedForm;
        }
        
        throw new Error('You are offline and no locally cached version of this form is available.');
      }
      
      // Obtener de la base de datos
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .maybeSingle();
      
      if (formError) {
        logDebug('Error fetching form by ID:', formError);
        throw formError;
      }
      
      if (!formData) {
        throw new Error('Form not found');
      }
      
      // Guardar en caché local
      try {
        localStorage.setItem(`form_${formId}`, JSON.stringify(formData));
      } catch (cacheError) {
        logDebug('Error caching individual form:', cacheError);
      }
      
      logDebug('Form fetched successfully:', formData);
      return formData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء جلب النموذج';
      logDebug('Error fetching form by ID:', err);
      setError(errorMessage);
      
      // Intentar obtener desde caché
      try {
        const cachedForm = localStorage.getItem(`form_${formId}`);
        if (cachedForm) {
          const parsedForm = JSON.parse(cachedForm);
          logDebug('Using cached form:', parsedForm);
          toast.info('استخدام نسخة محفوظة من النموذج بسبب مشكلة في الاتصال');
          return parsedForm;
        }
      } catch (cacheError) {
        logDebug('Error retrieving cached form:', cacheError);
      }
      
      // Devolver formulario vacío si no se encuentra
      return {
        id: formId || 'new',
        title: 'نموذج جديد',
        description: '',
        data: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: '',
        is_published: false
      };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Verificar si hay conexión activa y formularios pendientes de sincronizar
  const checkPendingData = useCallback(() => {
    try {
      const offlineFormsStr = localStorage.getItem('offline_forms');
      if (offlineFormsStr) {
        const offlineForms = JSON.parse(offlineFormsStr);
        const pendingCount = Array.isArray(offlineForms) 
          ? offlineForms.filter(f => f.pendingSave).length 
          : 0;
          
        return { hasPending: pendingCount > 0, pendingCount };
      }
      return { hasPending: false, pendingCount: 0 };
    } catch (e) {
      console.error('Error checking pending forms:', e);
      return { hasPending: false, pendingCount: 0, error: e };
    }
  }, []);
  
  // Intentar sincronizar manualmente todos los datos pendientes
  const syncPendingData = useCallback(async () => {
    if (!navigator.onLine) {
      toast.error('You are currently offline. Cannot sync data.');
      return false;
    }
    
    try {
      await syncOfflineForms();
      return true;
    } catch (e) {
      console.error('Error syncing pending data:', e);
      return false;
    }
  }, [syncOfflineForms]);

  return {
    forms,
    isLoading,
    error,
    fetchForms,
    getFormById,
    networkStatus,
    checkPendingData,
    syncPendingData
  };
};
