
import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { FormData, useFormTemplates } from '@/lib/hooks/useFormTemplates';
import { Edit, MoreVertical, Trash, Eye, EyeOff, AlertCircle, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface FormListProps {
  forms: FormData[];
  isLoading: boolean;
  onSelectForm: (formId: string) => void;
  maxAttempts?: number;
  onRefresh?: () => Promise<void>;
  instanceId?: string;
}

const FormList: React.FC<FormListProps> = ({ 
  forms, 
  isLoading, 
  onSelectForm,
  maxAttempts = 10, // Increased from 7 to 10
  onRefresh,
  instanceId = 'form-list' 
}) => {
  const [formToDelete, setFormToDelete] = useState<string | null>(null);
  const { publishForm, deleteForm } = useFormTemplates();
  const [hasError, setHasError] = useState<boolean>(false);
  const [processedForms, setProcessedForms] = useState<FormData[]>([]);
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [processingComplete, setProcessingComplete] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  // Track if component is mounted to prevent state updates after unmounting
  const isMounted = useRef(true);
  
  // On unmount, set mounted ref to false
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  console.log(`[${instanceId}] FormList render with forms:`, forms);
  
  // Timer to prevent infinite processing
  useEffect(() => {
    // Set a timeout to force complete processing after 5 seconds
    const timeoutId = setTimeout(() => {
      if (!processingComplete && isMounted.current) {
        console.log(`[${instanceId}] FormList: Forcing processing completion after timeout`);
        setProcessingComplete(true);
      }
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(timeoutId);
  }, [processingComplete, instanceId]);
  
  // CRITICAL FIX: Improved form data processing and validation
  useEffect(() => {
    // Don't process if we've reached max attempts or already completed processing
    if (attemptCount >= maxAttempts || processingComplete) {
      return;
    }
    
    console.log(`[${instanceId}] FormList: Processing attempt ${attemptCount + 1} of ${maxAttempts}`);
    
    // Simple guard against state updates on unmounted component
    if (!isMounted.current) return;
    
    setAttemptCount(prev => prev + 1);
    
    try {
      // IMPROVED: Better handling of forms data
      if (!forms) {
        console.log(`[${instanceId}] FormList: No forms data received`);
        setProcessedForms([]);
        setProcessingComplete(true);
        return;
      }
      
      // Convert to array if object was passed
      const formsArray = Array.isArray(forms) ? forms : (forms ? [forms] : []);
      
      console.log(`[${instanceId}] FormList: Processing forms data:`, 
        formsArray.map(form => ({ 
          id: form?.id, 
          title: form?.title,
          valid: Boolean(form && form.id)
        }))
      );
      
      // CRITICAL FIX: More robust validation and transformation of form data
      const validForms = formsArray
        .filter(form => form && typeof form === 'object')
        .map(form => {
          // Ensure we have all required fields with fallbacks
          return {
            id: form.id || '',
            title: form.title || 'بدون عنوان',
            description: form.description || '',
            // Handle different property names for published status
            is_published: form.is_published !== undefined ? form.is_published : 
                         form.isPublished !== undefined ? form.isPublished : false,
            isPublished: form.is_published !== undefined ? form.is_published : 
                        form.isPublished !== undefined ? form.isPublished : false,
            created_at: form.created_at || new Date().toISOString(),
            // Add any other required fields with fallbacks
            shop_id: form.shop_id || '',
            data: form.data || {}
          };
        })
        .filter(form => form.id); // Final filter to ensure we have an ID
      
      if (validForms.length === 0 && attemptCount < maxAttempts - 1) {
        console.log(`[${instanceId}] FormList: No valid forms found, will retry. Attempt ${attemptCount + 1} of ${maxAttempts}`);
        
        // Schedule an immediate retry with backoff
        const retryDelay = Math.min(attemptCount * 300, 2000);
        const retryTimeout = setTimeout(() => {
          if (isMounted.current) {
            console.log(`[${instanceId}] FormList: Retrying processing after ${retryDelay}ms`);
            setProcessingComplete(false);
          }
        }, retryDelay);
        
        return () => clearTimeout(retryTimeout);
      }
      
      console.log(`[${instanceId}] FormList: Found ${validForms.length} valid forms`);
      
      // Remove duplicates by ID
      const uniqueForms = Array.from(
        new Map(validForms.map(form => [form.id, form])).values()
      );
      
      console.log(`[${instanceId}] FormList: Final processed forms: ${uniqueForms.length}`);
      setProcessedForms(uniqueForms);
      setProcessingComplete(true);
    } catch (error) {
      console.error(`[${instanceId}] FormList: Error processing forms data:`, error);
      if (isMounted.current) {
        setHasError(true);
        setProcessingComplete(true);
        toast.error('حدث خطأ في معالجة بيانات النماذج');
      }
    }
  }, [forms, attemptCount, maxAttempts, processingComplete, instanceId]);

  const handlePublishToggle = async (formId: string, currentStatus: boolean) => {
    if (!formId) {
      console.error(`[${instanceId}] Cannot toggle publish: Invalid form ID`);
      return;
    }
    
    try {
      await publishForm(formId, !currentStatus);
      
      // Update local state to reflect the change
      if (isMounted.current) {
        setProcessedForms(prev => prev.map(form => 
          form.id === formId 
            ? { ...form, is_published: !currentStatus, isPublished: !currentStatus } 
            : form
        ));
      }
      
      toast.success(currentStatus 
        ? 'تم إلغاء نشر النموذج بنجاح' 
        : 'تم نشر النموذج بنجاح'
      );
    } catch (error) {
      console.error(`[${instanceId}] Error toggling form publish status:`, error);
      toast.error("فشل في تغيير حالة النشر");
    }
  };

  const handleDelete = async () => {
    if (formToDelete) {
      try {
        await deleteForm(formToDelete);
        if (isMounted.current) {
          setFormToDelete(null);
          setProcessedForms(prev => prev.filter(form => form.id !== formToDelete));
        }
        toast.success('تم حذف النموذج بنجاح');
      } catch (error) {
        console.error(`[${instanceId}] Error deleting form:`, error);
        toast.error("فشل في حذف النموذج");
      }
    }
  };
  
  // Handle manual refresh when user clicks the refresh button
  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
        toast.success('تم تحديث قائمة النماذج');
      } catch (error) {
        console.error(`[${instanceId}] Error refreshing forms:`, error);
        toast.error('فشل في تحديث النماذج');
      } finally {
        if (isMounted.current) {
          setIsRefreshing(false);
        }
      }
    }
  };

  // Forced timeout - show error if isLoading has been true for too long
  const [loadingTimeout, setLoadingTimeout] = useState<boolean>(false);
  
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        if (isMounted.current) {
          setLoadingTimeout(true);
        }
      }, 10000); // 10 second timeout
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [isLoading]);
  
  // Show loading timeout error
  if (loadingTimeout) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex flex-col space-y-4">
          <span>استغرق تحميل النماذج وقتًا طويلاً. يرجى تحديث الصفحة والمحاولة مرة أخرى.</span>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-fit self-start"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                جارٍ التحديث...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                تحديث النماذج
              </>
            )}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Show loading state
  if (isLoading && !processingComplete) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show error state
  if (hasError) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex flex-col space-y-4">
          <span>حدث خطأ أثناء تحميل النماذج. يرجى تحديث الصفحة أو المحاولة لاحقًا.</span>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-fit self-start"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                جارٍ التحديث...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                إعادة المحاولة
              </>
            )}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Show empty state - either no forms array or empty array
  if (!processedForms.length) {
    return (
      <Card className="bg-gray-50 border-dashed">
        <CardContent className="pt-6 text-center">
          <p className="text-gray-500 mb-4">لا توجد نماذج متاحة</p>
          <p className="text-sm text-gray-400">انقر على زر "إنشاء نموذج جديد" لإضافة نموذج</p>
          {!isLoading && (
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جارٍ التحديث...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  تحديث القائمة
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Show forms list
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">
          عدد النماذج: {processedForms.length}
        </p>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              جارٍ التحديث...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              تحديث القائمة
            </>
          )}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {processedForms.map((form) => (
          <Card key={form.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <div className={`h-2 ${(form.is_published || form.isPublished) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg truncate">{form.title || "بدون عنوان"}</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onSelectForm(form.id)}>
                      <Edit className="mr-2 h-4 w-4" />
                      <span>تعديل</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => 
                      handlePublishToggle(form.id, form.is_published || form.isPublished || false)
                    }>
                      {(form.is_published || form.isPublished) ? (
                        <>
                          <EyeOff className="mr-2 h-4 w-4" />
                          <span>إلغاء النشر</span>
                        </>
                      ) : (
                        <>
                          <Eye className="mr-2 h-4 w-4" />
                          <span>نشر</span>
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setFormToDelete(form.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      <span>حذف</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-2">
                <Badge variant={(form.is_published || form.isPublished) ? "success" : "secondary"}>
                  {(form.is_published || form.isPublished) ? 'منشور' : 'مسودة'}
                </Badge>
                <span className="text-xs text-gray-500 rtl:text-left">
                  {form.created_at ? 
                    formatDistanceToNow(new Date(form.created_at), { addSuffix: true, locale: ar }) : 
                    'تاريخ غير محدد'
                  }
                </span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{form.description || 'لا يوجد وصف'}</p>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button 
                variant="default" 
                onClick={() => onSelectForm(form.id)}
                className="w-full"
              >
                عرض وتعديل
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!formToDelete} onOpenChange={(open) => !open && setFormToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف النموذج؟</AlertDialogTitle>
            <AlertDialogDescription>
              لا يمكن التراجع عن هذا الإجراء. سيتم حذف النموذج بشكل دائم وإزالة جميع البيانات المرتبطة به.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FormList;
