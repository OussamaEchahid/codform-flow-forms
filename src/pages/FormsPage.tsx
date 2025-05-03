
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
import ShopifyDebugger from '@/components/debug/ShopifyDebugger';

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
  const [showDebugger, setShowDebugger] = useState(false);

  // Check URL for debug mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug') === 'true') {
      setShowDebugger(true);
      // Remove the parameter from URL without reloading
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  // Check for pending sync data periodically
  useEffect(() => {
    const checkPending = () => {
      const pending = checkPendingData();
      setPendingSync(pending);
    };
    
    // Check at start
    checkPending();
    
    // Set interval to check periodically
    const intervalId = setInterval(checkPending, 30000);
    
    return () => clearInterval(intervalId);
  }, [checkPendingData]);
  
  // Try to sync automatically when connection is restored
  useEffect(() => {
    if (networkStatus === 'online' && pendingSync.hasPending) {
      const attemptSync = async () => {
        try {
          await syncPendingData();
          // Update pending sync state
          const newPendingState = checkPendingData();
          setPendingSync(newPendingState);
          
          // Reload the list if forms were synced
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

  // Load forms when page loads with better error handling
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
    
    // Set up auto-retry if initial load fails
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    if (error && retryCount < 3 && !initialLoadAttempted) {
      retryTimer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 3000); // Retry after 3 seconds
    }
    
    return () => {
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [fetchForms, retryCount, error, initialLoadAttempted]);

  // Handle manual refresh with visual feedback
  const handleRefresh = useCallback(() => {
    console.log('FormsPage: Manual refresh requested');
    setIsManualRefresh(true);
    
    // Reset any error state and increment retry counter
    setRetryCount(prevCount => prevCount + 1);
    
    // Try to fetch forms again
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
  
  // Handle manual sync of pending data
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
        
        // Update forms list
        fetchForms();
        
        // Update pending sync state
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

  // Handle form selection
  const handleSelectForm = (formId: string) => {
    navigate(`/form-builder/${formId}`);
  };

  // Handle creating new form
  const handleCreateNew = () => {
    navigate('/form-builder/new');
  };

  // Debug mode toggle
  const toggleDebugMode = () => {
    setShowDebugger(prev => !prev);
  };

  return (
    <div className="container mx-auto p-6">
      {/* Shopify Connection Banner (if needed) */}
      <ShopifyConnectionBanner />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {language === 'ar' ? 'النماذج' : 'Forms'}
        </h1>
        <div className="flex gap-2">
          {/* Connection status */}
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
          
          {/* Sync button for pending data */}
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
                <RefreshCw className="h-4 w-4" />
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

      {/* Show offline state */}
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
      
      {/* Add debug button (small and subtle) */}
      <div className="fixed bottom-4 left-4">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs opacity-50 hover:opacity-100"
          onClick={toggleDebugMode}
        >
          {language === 'ar' ? 'وضع التصحيح' : 'Debug Mode'}
        </Button>
      </div>
      
      {/* Add Shopify Debugger */}
      {showDebugger && <ShopifyDebugger />}
    </div>
  );
};

export default FormsPage;
