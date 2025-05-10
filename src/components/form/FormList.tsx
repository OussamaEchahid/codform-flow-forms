
import { useState, useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';

interface FormListProps {
  forms: FormData[];
  isLoading: boolean;
  onSelectForm: (formId: string) => void;
  maxAttempts?: number;
  onRefresh?: () => void; // Added refresh callback prop
}

const FormList: React.FC<FormListProps> = ({ 
  forms, 
  isLoading, 
  onSelectForm,
  maxAttempts = 1, // Default to just 1 attempt to avoid multiple retries
  onRefresh  // Added refresh callback
}) => {
  const [formToDelete, setFormToDelete] = useState<string | null>(null);
  const { publishForm, deleteForm } = useFormTemplates();
  const [hasError, setHasError] = useState<boolean>(false);
  const [processedForms, setProcessedForms] = useState<FormData[]>([]);
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [processingComplete, setProcessingComplete] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  // Timer to prevent infinite processing
  useEffect(() => {
    // Set a timeout to force complete processing after 5 seconds
    const timeoutId = setTimeout(() => {
      if (!processingComplete) {
        console.log('FormList: Forcing processing completion after timeout');
        setProcessingComplete(true);
      }
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(timeoutId);
  }, [processingComplete]);
  
  // Process and validate forms data whenever it changes, with improved safety
  useEffect(() => {
    // Don't process if we've reached max attempts or already completed processing
    if (attemptCount >= maxAttempts || processingComplete) {
      return;
    }
    
    console.log(`FormList: Processing attempt ${attemptCount + 1} of ${maxAttempts}`);
    setAttemptCount(prev => prev + 1);
    
    // Only process if we have forms data to process
    if (!forms || !Array.isArray(forms)) {
      console.log('FormList: No valid forms data received');
      setProcessedForms([]);
      setProcessingComplete(true);
      return;
    }
    
    try {
      // Filter out invalid forms and deduplicate
      const validForms = forms.filter(form => 
        form && typeof form === 'object' && form.id && typeof form.id === 'string'
      );
      
      // Remove duplicates
      const uniqueFormIds = new Set();
      const uniqueForms = validForms.filter(form => {
        if (uniqueFormIds.has(form.id)) return false;
        uniqueFormIds.add(form.id);
        return true;
      });
      
      console.log(`FormList: Processed ${uniqueForms.length} unique, valid forms`);
      setProcessedForms(uniqueForms);
      setProcessingComplete(true);
    } catch (error) {
      console.error('FormList: Error processing forms data:', error);
      setHasError(true);
      setProcessingComplete(true);
      toast.error('حدث خطأ في معالجة بيانات النماذج');
    }
  }, [forms, attemptCount, maxAttempts, processingComplete]);

  const handlePublishToggle = async (formId: string, currentStatus: boolean) => {
    if (!formId) {
      console.error("Cannot toggle publish: Invalid form ID");
      return;
    }
    
    try {
      await publishForm(formId, !currentStatus);
    } catch (error) {
      console.error("Error toggling form publish status:", error);
      toast.error("فشل في تغيير حالة النشر");
    }
  };

  const handleDelete = async () => {
    if (formToDelete) {
      try {
        await deleteForm(formToDelete);
        setFormToDelete(null);
      } catch (error) {
        console.error("Error deleting form:", error);
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
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  // Forced timeout - show error if isLoading has been true for too long
  const [loadingTimeout, setLoadingTimeout] = useState<boolean>(false);
  
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        setLoadingTimeout(true);
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
  if (!Array.isArray(processedForms) || processedForms.length === 0) {
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
      <div className="flex justify-end">
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
            <div className={`h-2 ${form.is_published ? 'bg-green-500' : 'bg-gray-300'}`}></div>
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
                    <DropdownMenuItem onClick={() => handlePublishToggle(form.id, form.is_published || false)}>
                      {form.is_published ? (
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
                <Badge variant={form.is_published ? "success" : "secondary"}>
                  {form.is_published ? 'منشور' : 'مسودة'}
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
