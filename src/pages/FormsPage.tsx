
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlusCircle, RefreshCcw, AlertCircle, Wifi, WifiOff, CloudOff } from 'lucide-react';
import { useFormFetch } from '@/lib/hooks/form/useFormFetch';
import FormList from '@/components/form/FormList';
import { useI18n } from '@/lib/i18n';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import ShopifyConnectionBanner from '@/components/form/ShopifyConnectionBanner';

const FormsPage = () => {
  const { language } = useI18n();
  const navigate = useNavigate();
  const { forms, isLoading, error, fetchForms, networkStatus, checkPendingData, syncPendingData } = useFormFetch();
  const [retryCount, setRetryCount] = useState(0);
  const [isManualRefresh, setIsManualRefresh] = useState(false);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [initialLoadAttempted, setInitialLoadAttempted] = useState(false);
  const [pendingSync, setPendingSync] = useState<{hasPending: boolean, pendingCount: number}>({
    hasPending: false,
    pendingCount: 0
  });

  // Comprobar periódicamente datos pendientes de sincronización
  useEffect(() => {
    const checkPending = () => {
      const pending = checkPendingData();
      setPendingSync(pending);
    };
    
    // Comprobar al inicio
    checkPending();
    
    // Establecer intervalo para comprobar periódicamente
    const intervalId = setInterval(checkPending, 30000);
    
    return () => clearInterval(intervalId);
  }, [checkPendingData]);
  
  // Intentar sincronizar automáticamente cuando se recupera la conexión
  useEffect(() => {
    if (networkStatus === 'online' && pendingSync.hasPending) {
      const attemptSync = async () => {
        try {
          await syncPendingData();
          // Actualizar estado de sincronización pendiente
          const newPendingState = checkPendingData();
          setPendingSync(newPendingState);
          
          // Recargar la lista si se sincronizaron formularios
          if (newPendingState.pendingCount < pendingSync.pendingCount) {
            fetchForms();
          }
        } catch (e) {
          console.error('Error in auto-sync:', e);
        }
      };
      
      attemptSync();
    }
  }, [networkStatus, pendingSync.hasPending, syncPendingData, checkPendingData, fetchForms, pendingSync.pendingCount]);

  // Cargar formularios al cargar la página con mejor manejo de errores
  useEffect(() => {
    console.log('FormsPage: Loading forms... Attempt:', retryCount);
    
    const loadForms = async () => {
      try {
        await fetchForms();
        setHasInitiallyLoaded(true);
      } catch (err) {
        console.error('Error in FormsPage useEffect:', err);
      } finally {
        setInitialLoadAttempted(true);
      }
    };
    
    loadForms();
    
    // Configurar un reintento automático si la carga inicial falla
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    if (error && retryCount < 3 && !initialLoadAttempted) {
      retryTimer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 3000); // Reintentar después de 3 segundos
    }
    
    return () => {
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [fetchForms, retryCount, error, initialLoadAttempted]);

  // Manejar actualización manual con retroalimentación visual
  const handleRefresh = useCallback(() => {
    console.log('FormsPage: Manual refresh requested');
    setIsManualRefresh(true);
    
    // Restablecer cualquier estado de error e incrementar contador de reintentos
    setRetryCount(prevCount => prevCount + 1);
    
    // Intentar obtener formularios nuevamente
    fetchForms()
      .then(() => {
        if (!error) {
          toast.success(language === 'ar' ? 'تم تحديث النماذج بنجاح' : 'Forms refreshed successfully');
        }
      })
      .catch(err => {
        console.error('Manual refresh error:', err);
        toast.error(language === 'ar' ? 'حدث خطأ أثناء تحديث النماذج' : 'Error refreshing forms');
      })
      .finally(() => {
        setIsManualRefresh(false);
      });
  }, [fetchForms, language, error]);
  
  // Manejar sincronización manual de datos pendientes
  const handleSyncPending = async () => {
    if (!pendingSync.hasPending) return;
    
    try {
      toast.info(language === 'ar' 
        ? 'جاري مزامنة البيانات المحلية...' 
        : 'Syncing local data...');
      
      const result = await syncPendingData();
      
      if (result) {
        toast.success(language === 'ar' 
          ? 'تمت مزامنة البيانات المحلية بنجاح' 
          : 'Local data synced successfully');
        
        // Actualizar lista de formularios
        fetchForms();
        
        // Actualizar estado de sincronización pendiente
        setPendingSync(checkPendingData());
      } else {
        toast.error(language === 'ar' 
          ? 'فشلت مزامنة بعض البيانات المحلية' 
          : 'Failed to sync some local data');
      }
    } catch (e) {
      console.error('Error syncing pending data:', e);
      toast.error(language === 'ar' 
        ? 'حدث خطأ أثناء محاولة المزامنة' 
        : 'Error attempting to sync');
    }
  };

  // Manejar selección de formulario
  const handleSelectForm = (formId: string) => {
    navigate(`/form-builder/${formId}`);
  };

  // Manejar creación de nuevo formulario
  const handleCreateNew = () => {
    navigate('/form-builder/new');
  };

  // Registro de depuración
  console.log('FormsPage render state:', { 
    isLoading, 
    formsCount: forms?.length || 0, 
    hasError: !!error,
    hasInitiallyLoaded,
    initialLoadAttempted,
    networkStatus,
    pendingSync
  });

  return (
    <div className="container mx-auto p-6">
      {/* Shopify Connection Banner (si es necesario) */}
      <ShopifyConnectionBanner />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {language === 'ar' ? 'النماذج' : 'Forms'}
        </h1>
        <div className="flex gap-2">
          {/* Estado de conexión */}
          <div className={`px-3 py-1 rounded-full flex items-center gap-1 text-sm ${
            networkStatus === 'online' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-amber-100 text-amber-700'
          }`}>
            {networkStatus === 'online' ? (
              <>
                <Wifi className="h-3 w-3" />
                {language === 'ar' ? 'متصل' : 'Online'}
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                {language === 'ar' ? 'غير متصل' : 'Offline'}
              </>
            )}
          </div>
          
          {/* Botón de sincronización para datos pendientes */}
          {pendingSync.hasPending && (
            <Button 
              variant="outline" 
              onClick={handleSyncPending}
              className="flex items-center gap-2 bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
              disabled={networkStatus !== 'online'}
            >
              <CloudOff className="h-4 w-4" />
              {language === 'ar' 
                ? `مزامنة (${pendingSync.pendingCount})` 
                : `Sync (${pendingSync.pendingCount})`}
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={isLoading && isManualRefresh}
            className="flex items-center gap-2"
          >
            {isManualRefresh ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-current rounded-full border-t-transparent"></div>
                {language === 'ar' ? 'جاري التحديث...' : 'Refreshing...'}
              </>
            ) : (
              <>
                <RefreshCcw className="h-4 w-4" />
                {language === 'ar' ? 'تحديث' : 'Refresh'}
              </>
            )}
          </Button>
          
          <Button onClick={handleCreateNew} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            {language === 'ar' ? 'إنشاء نموذج جديد' : 'Create New Form'}
          </Button>
        </div>
      </div>

      {/* Mostrar estado offline */}
      {networkStatus === 'offline' && (
        <Alert variant="default" className="mb-4 bg-amber-50 border-amber-200">
          <WifiOff className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700">
            {language === 'ar' 
              ? 'أنت حالياً غير متصل بالإنترنت. يتم عرض البيانات المحفوظة محلياً. ستتم مزامنة أي تغييرات عندما تستعيد الاتصال.' 
              : 'You are currently offline. Showing locally saved data. Any changes will be synced when you reconnect.'}
          </AlertDescription>
        </Alert>
      )}
      
      {error && networkStatus === 'online' && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {language === 'ar' 
              ? `حدث خطأ أثناء جلب النماذج. يمكنك إنشاء نموذج جديد أو إعادة المحاولة.` 
              : `Error fetching forms. You can create a new form or retry.`}
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <FormList 
          forms={forms || []} 
          isLoading={(isLoading && !hasInitiallyLoaded) || (!initialLoadAttempted && retryCount < 3)} 
          onSelectForm={handleSelectForm} 
          hasError={!!error && networkStatus === 'online'}
          onRefresh={handleRefresh}
          isOffline={networkStatus === 'offline'}
        />
      </div>
    </div>
  );
};

export default FormsPage;
