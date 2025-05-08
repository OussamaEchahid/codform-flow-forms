
import React, { useState, useCallback } from 'react';
import { Plus, Copy, Edit, Trash2, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import ShopifyConnectionStatus from '@/components/form/builder/ShopifyConnectionStatus';
import { useShopifyConnection } from '@/lib/shopify/ShopifyConnectionProvider';
import { supabase } from '@/integrations/supabase/client';

interface FormsPageProps {
  shopId?: string | null;
}

const FormsPage: React.FC<FormsPageProps> = ({ shopId }) => {
  const { language } = useI18n();
  const [forms, setForms] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newFormName, setNewFormName] = useState('');
  const [editFormName, setEditFormName] = useState('');
  const [importData, setImportData] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Simplified sync states with the centralized connection
  const [syncState, setSyncState] = useState({
    isSyncing: false,
    syncStatus: null as string | null,
    isResyncing: false,
    resyncProgress: 0,
    resyncError: null as string | null,
  });
  
  // Use the centralized Shopify connection
  const { isConnected, shopDomain } = useShopifyConnection();
  const navigate = useNavigate();

  const handleCreateForm = useCallback(async () => {
    if (!newFormName.trim()) {
      toast.error(language === 'ar' ? 'يرجى إدخال اسم للنموذج' : 'Please enter a form name');
      return;
    }

    setIsSaving(true);
    
    try {
      // Use the shopDomain from our central connection
      const currentShopId = shopDomain;
      
      if (!currentShopId) {
        throw new Error(language === 'ar' ? 'لم يتم العثور على متجر متصل' : 'No connected shop found');
      }

      const formData = {
        title: newFormName,
        description: '',
        data: {
          steps: [
            {
              id: uuidv4(),
              title: language === 'ar' ? 'الخطوة الأولى' : 'First Step',
              fields: []
            }
          ],
          settings: {
            direction: language === 'ar' ? 'rtl' : 'ltr',
            theme: 'light',
            primaryColor: '#4F46E5',
            borderRadius: 'medium',
            showStepIndicator: true
          }
        },
        shop_id: currentShopId,
        is_published: false
      };

      const { data, error: saveError } = await supabase
        .from('forms')
        .insert(formData)
        .select()
        .single();

      if (saveError) {
        throw saveError;
      }

      toast.success(language === 'ar' ? 'تم إنشاء النموذج بنجاح' : 'Form created successfully');
      setForms(prev => [...prev, data]);
      setIsCreating(false);
      setNewFormName('');
      
    } catch (err) {
      console.error('Error creating form:', err);
      toast.error(language === 'ar' ? 'حدث خطأ أثناء إنشاء النموذج' : 'Error creating form');
    } finally {
      setIsSaving(false);
    }
  }, [newFormName, language, shopDomain]);

  const loadForms = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use the shopDomain from our central connection
      const currentShopId = shopDomain;
      
      if (!currentShopId) {
        setForms([]);
        setError(language === 'ar' ? 'لم يتم العثور على متجر متصل' : 'No connected shop found');
        return;
      }
      
      // Load forms for the current shop
      const { data, error: loadError } = await supabase
        .from('forms')
        .select('*')
        .eq('shop_id', currentShopId)
        .order('created_at', { ascending: false });
      
      if (loadError) {
        throw loadError;
      }
      
      setForms(data || []);
      setError(null);
      
    } catch (err) {
      console.error('Error loading forms:', err);
      setError(language === 'ar' ? 'حدث خطأ أثناء تحميل النماذج' : 'Error loading forms');
      setForms([]);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, language, shopDomain]);

  React.useEffect(() => {
    if (isConnected && shopDomain) {
      loadForms();
    } else {
      setForms([]);
      setError(language === 'ar' ? 'لم يتم العثور على متجر متصل' : 'No connected shop found');
      setIsLoading(false);
    }
  }, [isConnected, shopDomain, loadForms, language]);

  const handleEditForm = (form: any) => {
    navigate(`/form-builder/${form.id}`);
  };

  const handleDeleteForm = async (form: any) => {
    if (!window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا النموذج؟' : 'Are you sure you want to delete this form?')) {
      return;
    }

    setIsDeleting(true);
    setSelectedForm(form);

    try {
      const { error: deleteError } = await supabase
        .from('forms')
        .delete()
        .eq('id', form.id);

      if (deleteError) {
        throw deleteError;
      }

      setForms(forms.filter(f => f.id !== form.id));
      toast.success(language === 'ar' ? 'تم حذف النموذج بنجاح' : 'Form deleted successfully');
    } catch (err) {
      console.error('Error deleting form:', err);
      toast.error(language === 'ar' ? 'حدث خطأ أثناء حذف النموذج' : 'Error deleting form');
    } finally {
      setIsDeleting(false);
      setSelectedForm(null);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {language === 'ar' ? 'النماذج' : 'Forms'}
          </h1>
          <p className="text-gray-500">
            {language === 'ar' ? 'إدارة نماذج متجرك' : 'Manage your store forms'}
          </p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <ShopifyConnectionStatus />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button 
              className="bg-primary flex items-center gap-2"
              disabled={!isConnected || !shopDomain}
            >
              <Plus size={16} />
              {language === 'ar' ? 'إنشاء نموذج جديد' : 'Create New Form'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {language === 'ar' ? 'إنشاء نموذج جديد' : 'Create New Form'}
              </DialogTitle>
              <DialogDescription>
                {language === 'ar' ? 'أدخل اسمًا للنموذج الجديد' : 'Enter a name for your new form'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  {language === 'ar' ? 'اسم النموذج' : 'Form Name'}
                </Label>
                <Input
                  id="name"
                  placeholder={language === 'ar' ? 'أدخل اسم النموذج' : 'Enter form name'}
                  value={newFormName}
                  onChange={(e) => setNewFormName(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  setNewFormName('');
                }}
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                onClick={handleCreateForm}
                disabled={isSaving || !newFormName.trim()}
              >
                {isSaving ? (
                  language === 'ar' ? 'جارٍ الإنشاء...' : 'Creating...'
                ) : (
                  language === 'ar' ? 'إنشاء' : 'Create'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {language === 'ar' ? 'خطأ' : 'Error'}
          </AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-2">{language === 'ar' ? 'جارٍ التحميل...' : 'Loading...'}</p>
          </div>
        </div>
      ) : forms.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{language === 'ar' ? 'اسم النموذج' : 'Form Name'}</TableHead>
                <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                <TableHead>{language === 'ar' ? 'تاريخ الإنشاء' : 'Created Date'}</TableHead>
                <TableHead className="text-right">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forms.map((form) => (
                <TableRow key={form.id}>
                  <TableCell className="font-medium">{form.title}</TableCell>
                  <TableCell>
                    {form.is_published ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {language === 'ar' ? 'منشور' : 'Published'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        {language === 'ar' ? 'مسودة' : 'Draft'}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(form.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">
                            {language === 'ar' ? 'فتح القائمة' : 'Open menu'}
                          </span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>
                          {language === 'ar' ? 'الإجراءات' : 'Actions'}
                        </DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditForm(form)}>
                          <Edit className="mr-2 h-4 w-4" />
                          {language === 'ar' ? 'تحرير' : 'Edit'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteForm(form)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          {language === 'ar' ? 'حذف' : 'Delete'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
              <AlertCircle className="h-6 w-6" />
            </div>
          </div>
          <h3 className="text-lg font-medium mb-2">
            {language === 'ar' ? 'لا توجد نماذج حالياً' : 'No Forms Yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {language === 'ar'
              ? 'أنشئ نموذجًا جديدًا للبدء في جمع المعلومات من عملائك'
              : 'Create a new form to start collecting information from your customers'}
          </p>
          <Button
            className="bg-primary"
            onClick={() => setIsCreating(true)}
            disabled={!isConnected || !shopDomain}
          >
            <Plus className="mr-2 h-4 w-4" />
            {language === 'ar' ? 'إنشاء نموذج جديد' : 'Create New Form'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default FormsPage;
