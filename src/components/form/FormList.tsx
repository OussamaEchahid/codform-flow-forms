
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
import { Edit, MoreVertical, Trash, Eye, EyeOff, AlertCircle, RefreshCw, Search, Filter, List, Grid } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { normalizeFormData, enhanceFormData } from '@/lib/form-utils/standardizeFormData';
import { Input } from '@/components/ui/input';

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
  maxAttempts = 20,
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
  const [showRawData, setShowRawData] = useState<boolean>(false);
  const [rejectedForms, setRejectedForms] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'status'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Track if component is mounted to prevent state updates after unmounting
  const isMounted = useRef(true);
  
  // On unmount, set mounted ref to false
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  console.log(`[${instanceId}] FormList render with ${forms?.length || 0} forms:`, forms);
  
  // Timer to prevent infinite processing - 3 seconds for faster fallback
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!processingComplete && isMounted.current) {
        console.log(`[${instanceId}] FormList: Forcing processing completion after timeout`);
        
        // Always show something - if we have raw forms but processing is timing out, just show them
        if (forms && forms.length > 0) {
          console.log(`[${instanceId}] FormList: Using raw form data as fallback`);
          setProcessedForms(forms);
        }
        
        setProcessingComplete(true);
      }
    }, 3000); // 3 second timeout
    
    return () => clearTimeout(timeoutId);
  }, [processingComplete, instanceId, forms]);
  
  // Process form data with simplified approach
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
      // Handle null/undefined forms data with clear logging
      if (!forms) {
        console.log(`[${instanceId}] FormList: No forms data received`);
        setProcessedForms([]);
        setProcessingComplete(true);
        return;
      }
      
      // Convert to array if object was passed
      const formsArray = Array.isArray(forms) ? forms : (forms ? [forms] : []);
      console.log(`[${instanceId}] FormList: Processing ${formsArray.length} forms`);
      
      // SIMPLIFIED: If showing raw data, just enhance forms and return them
      if (showRawData) {
        console.log(`[${instanceId}] FormList: Showing raw forms data (${formsArray.length} forms)`);
        const enhancedForms = formsArray.map(form => enhanceFormData(form));
        setProcessedForms(enhancedForms);
        setProcessingComplete(true);
        setHasError(false);
        return;
      }
      
      // Track rejected forms for better debugging
      const rejected: any[] = [];
      
      // SIMPLIFIED: More lenient validation - only reject forms without any ID
      const validForms = formsArray.filter(form => {
        if (!form) {
          rejected.push({ form, reason: 'Form is null or undefined' });
          return false;
        }
        
        // Fix forms missing ID
        if (!form.id) {
          console.log(`[${instanceId}] FormList: Form missing ID, trying to fix:`, form);
          
          // If the form has another unique identifier, use that
          if (form._id) {
            form.id = form._id;
            return true;
          }
          
          console.log(`[${instanceId}] FormList: Rejecting form due to missing ID`);
          rejected.push({ form, reason: 'Missing ID' });
          return false;
        }
        
        // Accept all forms that have an ID
        return true;
      });
      
      // Store rejected forms for debugging
      setRejectedForms(rejected);
      
      console.log(`[${instanceId}] FormList: Processed ${validForms.length} valid forms out of ${formsArray.length}`);
      
      // If no valid forms found after multiple attempts but we have raw forms,
      // show the raw forms as a fallback
      if (validForms.length === 0 && attemptCount >= maxAttempts / 2 && formsArray.length > 0) {
        console.log(`[${instanceId}] FormList: No valid forms processed after ${attemptCount} attempts. Using enhanced raw forms as fallback.`);
        const enhancedForms = formsArray.map(form => enhanceFormData(form));
        setProcessedForms(enhancedForms);
        setProcessingComplete(true);
        return;
      }
      
      // Enhance valid forms with any missing data
      const enhancedForms = validForms.map(form => enhanceFormData(form));
      
      // Remove duplicates by ID
      const uniqueForms = Array.from(
        new Map(enhancedForms.map(form => [form.id, form])).values()
      );
      
      console.log(`[${instanceId}] FormList: Final processed forms: ${uniqueForms.length}`);
      setProcessedForms(uniqueForms);
      setProcessingComplete(true);
      
    } catch (error) {
      console.error(`[${instanceId}] FormList: Error processing forms data:`, error);
      if (isMounted.current) {
        // IMPROVED: Better fallback - if processing fails but we have raw forms data, use that
        if (forms && forms.length > 0) {
          console.log(`[${instanceId}] FormList: Processing failed but using enhanced raw forms as fallback`);
          try {
            const enhancedForms = forms.map(form => enhanceFormData(form));
            setProcessedForms(enhancedForms);
          } catch (enhanceError) {
            console.error(`[${instanceId}] FormList: Error enhancing forms:`, enhanceError);
            setProcessedForms(forms);
          }
          setProcessingComplete(true);
        } else {
          setHasError(true);
          setProcessingComplete(true);
          toast.error('حدث خطأ في معالجة بيانات النماذج');
        }
      }
    }
  }, [forms, attemptCount, maxAttempts, processingComplete, instanceId, showRawData]);

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
            ? { ...form, isPublished: !currentStatus, is_published: !currentStatus } 
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
  
  // Toggle showing raw data - with clearer messaging
  const toggleRawData = () => {
    const newState = !showRawData;
    setShowRawData(newState);
    toast.info(newState ? 'عرض البيانات الخام' : 'عرض البيانات المعالجة');
    
    // Reset processing to force forms to be processed again
    setProcessingComplete(false);
    setAttemptCount(0);
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

  // Debug function to show rejected forms information
  const showRejectedFormsInfo = () => {
    if (rejectedForms.length > 0) {
      console.log(`[${instanceId}] Rejected forms (${rejectedForms.length}):`, rejectedForms);
      toast.info(`${rejectedForms.length} نماذج مرفوضة. تفاصيل في وحدة التحكم.`);
    } else {
      toast.info('لا توجد نماذج مرفوضة');
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
  
  // Filter and sort forms
  const filteredAndSortedForms = processedForms
    .filter(form => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        (form.title?.toLowerCase().includes(searchLower)) ||
        (form.description?.toLowerCase().includes(searchLower))
      );
    })
    .sort((a, b) => {
      if (sortBy === 'title') {
        const titleA = a.title || '';
        const titleB = b.title || '';
        return sortDirection === 'asc' 
          ? titleA.localeCompare(titleB)
          : titleB.localeCompare(titleA);
      } else if (sortBy === 'status') {
        const statusA = a.is_published || a.isPublished ? 1 : 0;
        const statusB = b.is_published || b.isPublished ? 1 : 0;
        return sortDirection === 'asc'
          ? statusA - statusB
          : statusB - statusA;
      } else { // date
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return sortDirection === 'asc'
          ? dateA - dateB
          : dateB - dateA;
      }
    });
  
  // Toggle sort direction
  const toggleSort = (sorter: 'date' | 'title' | 'status') => {
    if (sortBy === sorter) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(sorter);
      setSortDirection('desc');
    }
  };
  
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
          <div className="flex justify-center space-x-2 rtl:space-x-reverse mt-4">
            {!isLoading && (
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
            )}
            
            {/* Show raw data even when no processed forms */}
            {forms && forms.length > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={toggleRawData}
              >
                <Search className="mr-2 h-4 w-4" />
                {showRawData ? 'عرض البيانات المعالجة' : 'عرض البيانات الخام'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show forms list with improved UI
  return (
    <div className="space-y-4">
      {/* Search and filters bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search input */}
          <div className="flex-1">
            <Input
              placeholder="بحث عن نموذج..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
              dir="rtl"
            />
          </div>
          
          {/* View mode toggles */}
          <div className="flex gap-2">
            <Button 
              variant={viewMode === 'grid' ? "default" : "outline"} 
              size="icon"
              onClick={() => setViewMode('grid')}
              title="عرض شبكي"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? "default" : "outline"} 
              size="icon"
              onClick={() => setViewMode('list')}
              title="عرض قائمة"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Sorting options */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleSort('date')}
              className={sortBy === 'date' ? 'bg-gray-100' : ''}
            >
              التاريخ {sortBy === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleSort('title')}
              className={sortBy === 'title' ? 'bg-gray-100' : ''}
            >
              العنوان {sortBy === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleSort('status')}
              className={sortBy === 'status' ? 'bg-gray-100' : ''}
            >
              الحالة {sortBy === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
            </Button>
          </div>
        </div>
        
        {/* Additional controls */}
        <div className="flex flex-wrap justify-between items-center mt-4">
          <p className="text-sm text-gray-500">
            عدد النماذج: {filteredAndSortedForms.length}
            {rejectedForms.length > 0 && (
              <span className="text-amber-600 mr-2 rtl:ml-2">
                ({rejectedForms.length} نماذج مرفوضة)
              </span>
            )}
          </p>
          <div className="flex flex-wrap space-x-2 rtl:space-x-reverse">
            <Button 
              variant="outline" 
              size="sm"
              onClick={toggleRawData}
              className={showRawData ? "bg-blue-50" : ""}
            >
              <Search className="mr-2 h-4 w-4" />
              {showRawData ? 'عرض البيانات المعالجة' : 'عرض البيانات الخام'}
            </Button>
            {rejectedForms.length > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={showRejectedFormsInfo}
                className="bg-amber-50"
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                عرض النماذج المرفوضة
              </Button>
            )}
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
        </div>
      </div>
      
      {/* Grid or list display based on viewMode */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedForms.map((form) => (
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
      ) : (
        <div className="space-y-3">
          {filteredAndSortedForms.map((form) => (
            <div key={form.id} className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className={`w-2 md:w-auto md:h-auto ${(form.is_published || form.isPublished) ? 'bg-green-500' : 'bg-gray-300'} md:w-1.5`}></div>
                <div className="flex-1 p-4">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-medium text-lg">{form.title || "بدون عنوان"}</h3>
                      <p className="text-sm text-gray-600 line-clamp-1 max-w-lg">{form.description || 'لا يوجد وصف'}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={(form.is_published || form.isPublished) ? "success" : "secondary"}>
                        {(form.is_published || form.isPublished) ? 'منشور' : 'مسودة'}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {form.created_at ? 
                          formatDistanceToNow(new Date(form.created_at), { addSuffix: true, locale: ar }) : 
                          'تاريخ غير محدد'
                        }
                      </span>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => 
                            handlePublishToggle(form.id, form.is_published || form.isPublished || false)
                          }
                        >
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
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => onSelectForm(form.id)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          تعديل
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => setFormToDelete(form.id)}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          حذف
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
