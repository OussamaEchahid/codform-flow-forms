
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
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { FormData, useFormTemplates } from '@/lib/hooks/useFormTemplates';
import { Edit, MoreVertical, Trash, Eye, EyeOff, AlertCircle, Search, Filter, List, Grid } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

interface FormListProps {
  forms: FormData[];
  isLoading: boolean;
  onSelectForm: (formId: string) => void;
  onRefresh?: () => Promise<void>;
  instanceId?: string;
}

const FormList: React.FC<FormListProps> = ({ 
  forms, 
  isLoading, 
  onSelectForm,
  onRefresh,
  instanceId = 'form-list' 
}) => {
  const [formToDelete, setFormToDelete] = useState<string | null>(null);
  const { publishForm, deleteForm } = useFormTemplates();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'status'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [localForms, setLocalForms] = useState<FormData[]>(forms);
  
  // Track if component is mounted to prevent state updates after unmounting
  const isMounted = useRef(true);
  
  // Generate a stable instance ID that doesn't change on re-renders
  const stableId = useRef(`${instanceId}-${Math.random().toString(36).substring(2, 8)}`);
  
  // Update local forms when props change
  useEffect(() => {
    if (isMounted.current) {
      setLocalForms(forms);
    }
  }, [forms]);
  
  // On unmount, set mounted ref to false
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handlePublishToggle = async (formId: string, currentStatus: boolean) => {
    if (!formId) {
      console.error(`[${stableId.current}] Cannot toggle publish: Invalid form ID`);
      return;
    }
    
    try {
      await publishForm(formId, !currentStatus);
      
      // Update local state to reflect the change
      if (isMounted.current) {
        setFormToDelete(null); // Clear any pending delete
        setLocalForms(prevForms => 
          prevForms.map(form => 
            form.id === formId 
              ? { ...form, is_published: !currentStatus, isPublished: !currentStatus } 
              : form
          )
        );
      }
      
      toast.success(currentStatus 
        ? 'تم إلغاء نشر النموذج بنجاح' 
        : 'تم نشر النموذج بنجاح'
      );
    } catch (error) {
      console.error(`[${stableId.current}] Error toggling form publish status:`, error);
      toast.error("فشل في تغيير حالة النشر");
    }
  };

  const handleDelete = async () => {
    if (formToDelete) {
      try {
        await deleteForm(formToDelete);
        
        if (isMounted.current) {
          // Update local state immediately after successful deletion
          setLocalForms(prevForms => prevForms.filter(form => form.id !== formToDelete));
          setFormToDelete(null);
        }
        
        toast.success('تم حذف النموذج بنجاح');
        
        // Call the refresh callback if provided
        if (onRefresh) {
          await onRefresh();
        }
      } catch (error) {
        console.error(`[${stableId.current}] Error deleting form:`, error);
        toast.error("فشل في حذف النموذج");
      }
    }
  };

  // Filter and sort forms
  const filteredAndSortedForms = localForms
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
      } else {
        // Default: sort by date
        const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 
                      a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 
                      b.created_at ? new Date(b.created_at).getTime() : 0;
        return sortDirection === 'asc'
          ? dateA - dateB
          : dateB - dateA;
      }
    });

  // Display loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-lg font-medium">جاري تحميل النماذج...</p>
      </div>
    );
  }

  // Display empty state
  if (filteredAndSortedForms.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <div className="flex flex-col items-center gap-2">
          <AlertCircle className="h-10 w-10 text-gray-400" />
          <h3 className="text-lg font-medium mt-2">لا توجد نماذج</h3>
          <p className="text-gray-500">
            لم يتم العثور على أي نماذج. يمكنك إنشاء نموذج جديد لبدء الاستخدام.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Search and filter bar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="بحث في النماذج..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Filter className="h-4 w-4" />
                فرز
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy('date')}>
                حسب التاريخ {sortBy === 'date' && '✓'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('title')}>
                حسب العنوان {sortBy === 'title' && '✓'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('status')}>
                حسب الحالة {sortBy === 'status' && '✓'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}>
                {sortDirection === 'asc' ? 'تنازلي ↓' : 'تصاعدي ↑'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? (
              <List className="h-4 w-4" />
            ) : (
              <Grid className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Forms Grid/List */}
      <div className={viewMode === 'grid' 
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" 
        : "space-y-4"
      }>
        {filteredAndSortedForms.map((form) => (
          <Card key={form.id} className={viewMode === 'list' ? "flex flex-row" : ""}>
            <div className={viewMode === 'list' ? "flex-grow" : ""}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg break-words line-clamp-1">
                      {form.title || 'نموذج بدون عنوان'}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {form.updated_at
                        ? `تم التحديث ${formatDistanceToNow(new Date(form.updated_at), {
                            addSuffix: true,
                            locale: ar
                          })}`
                        : form.created_at
                          ? `تم الإنشاء ${formatDistanceToNow(new Date(form.created_at), {
                              addSuffix: true,
                              locale: ar
                            })}`
                          : 'تاريخ غير معروف'
                      }
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onSelectForm(form.id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        تعديل
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePublishToggle(
                        form.id, 
                        !!(form.is_published || form.isPublished)
                      )}>
                        {(form.is_published || form.isPublished) ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            إلغاء النشر
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            نشر
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600" 
                        onClick={() => setFormToDelete(form.id)}
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm line-clamp-2">
                  {form.description || 'لا يوجد وصف'}
                </p>
              </CardContent>
            </div>
            
            <CardFooter className={`${viewMode === 'list' ? "flex-shrink-0 my-auto ml-2" : ""} flex justify-between`}>
              <Badge variant={(form.is_published || form.isPublished) ? "default" : "outline"}>
                {(form.is_published || form.isPublished) ? 'منشور' : 'غير منشور'}
              </Badge>
              <Button 
                size="sm" 
                onClick={() => onSelectForm(form.id)}
              >
                تعديل
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!formToDelete} onOpenChange={(open) => !open && setFormToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذا النموذج؟</AlertDialogTitle>
            <AlertDialogDescription>
              هذا الإجراء لا يمكن التراجع عنه. سيؤدي إلى حذف النموذج بشكل دائم وجميع البيانات المرتبطة به.
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
    </>
  );
};

export default FormList;
