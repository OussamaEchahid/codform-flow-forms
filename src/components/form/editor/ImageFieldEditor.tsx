import React, { useState } from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { AlignLeft, AlignCenter, AlignRight, Upload, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSimpleShopify } from '@/hooks/useSimpleShopify';

interface ImageFieldEditorProps {
  field: FormField;
  onSave: (field: FormField) => void;
  onClose: () => void;
}

const ImageFieldEditor: React.FC<ImageFieldEditorProps> = ({ field, onSave, onClose }) => {
  const { language } = useI18n();
  const { toast } = useToast();
  const { activeStore } = useSimpleShopify();
  const [currentField, setCurrentField] = React.useState<FormField>(field);
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = (property: string, value: any) => {
    if (property.includes('.')) {
      const [parent, child] = property.split('.');
      setCurrentField({
        ...currentField,
        [parent]: {
          ...currentField[parent as keyof FormField],
          [child]: value
        }
      });
    } else {
      setCurrentField({
        ...currentField,
        [property]: value
      });
    }
  };

  const handleSaveField = () => {
    onSave(currentField);
    onClose();
  };

  const handleAlignmentChange = (alignment: 'left' | 'center' | 'right') => {
    handleChange('style.textAlign', alignment);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'حجم الملف كبير جداً (الحد الأقصى 5 ميجابايت)' : 'File size too large (max 5MB)',
        variant: 'destructive',
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يرجى اختيار ملف صورة' : 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload to Supabase Storage first
      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `images/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);

      // If we have an active store, upload to Shopify Files
      if (activeStore) {
        try {
          const { data: shopifyData, error: shopifyError } = await supabase.functions
            .invoke('upload-to-shopify-files', {
              body: {
                imageUrl: publicUrl,
                shop: activeStore,
                fileName: file.name
              }
            });

          if (shopifyError || !shopifyData.success) {
            console.warn('Failed to upload to Shopify Files, using Supabase URL:', shopifyError);
            handleChange('src', publicUrl);
          } else {
            // Use Shopify URL
            handleChange('src', shopifyData.shopifyUrl);
            toast({
              title: language === 'ar' ? 'تم الرفع بنجاح' : 'Upload Successful',
              description: language === 'ar' ? 'تم رفع الصورة إلى Shopify Files' : 'Image uploaded to Shopify Files',
            });
          }
        } catch (shopifyError) {
          console.warn('Shopify upload failed, using Supabase URL:', shopifyError);
          handleChange('src', publicUrl);
          toast({
            title: language === 'ar' ? 'تم الرفع جزئياً' : 'Partial Upload',
            description: language === 'ar' ? 'تم رفع الصورة محلياً فقط' : 'Image uploaded locally only',
          });
        }
      } else {
        // No active store, use Supabase URL
        handleChange('src', publicUrl);
        toast({
          title: language === 'ar' ? 'تم الرفع' : 'Upload Complete',
          description: language === 'ar' ? 'تم رفع الصورة' : 'Image uploaded successfully',
        });
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: language === 'ar' ? 'خطأ في الرفع' : 'Upload Error',
        description: language === 'ar' ? 'فشل في رفع الصورة' : 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const currentWidth = typeof currentField.width === 'string' ? parseInt(currentField.width) : (currentField.width || 100);
  const currentAlignment = currentField.style?.textAlign || 'center';

  return (
    <div className="space-y-4 p-4">
      <h3 className="font-medium text-lg">
        {language === 'ar' ? 'إعدادات الصورة' : 'Image Settings'}
      </h3>

      {/* Image URL */}
      <div className="space-y-2">
        <Label htmlFor="image-url">
          {language === 'ar' ? 'رابط الصورة' : 'Image URL'}
        </Label>
        <Input
          id="image-url"
          type="url"
          value={currentField.src || ''}
          onChange={(e) => handleChange('src', e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="w-full"
        />
      </div>

      {/* Upload Image */}
      <div className="space-y-2">
        <Label>
          {language === 'ar' ? 'رفع صورة' : 'Upload Image'}
        </Label>
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={isUploading}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload">
            <Button
              type="button"
              variant="outline"
              disabled={isUploading}
              className="cursor-pointer"
              asChild
            >
              <span className="flex items-center gap-2">
                {isUploading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Upload size={16} />
                )}
                {isUploading 
                  ? (language === 'ar' ? 'جارٍ الرفع...' : 'Uploading...') 
                  : (language === 'ar' ? 'اختر صورة' : 'Choose Image')
                }
              </span>
            </Button>
          </label>
        </div>
        <p className="text-xs text-gray-500">
          {language === 'ar' 
            ? 'الحد الأقصى 5 ميجابايت. سيتم رفعها إلى Shopify Files إذا كان المتجر متصلاً.'
            : 'Max 5MB. Will be uploaded to Shopify Files if store is connected.'
          }
        </p>
      </div>

      {/* Image Width Slider */}
      <div className="space-y-2">
        <Label htmlFor="image-width">
          {language === 'ar' ? `عرض الصورة (${currentWidth}%)` : `Image Width (${currentWidth}%)`}
        </Label>
        <div className="px-2">
          <Slider
            id="image-width"
            min={10}
            max={100}
            step={5}
            value={[currentWidth]}
            onValueChange={(value) => handleChange('width', value[0].toString())}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>10%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Alignment */}
      <div className="space-y-2">
        <Label>
          {language === 'ar' ? 'المحاذاة' : 'Alignment'}
        </Label>
        <div className="flex gap-2">
          <Button
            variant={currentAlignment === 'left' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleAlignmentChange('left')}
            className="flex items-center gap-1"
          >
            <AlignLeft size={16} />
            {language === 'ar' ? 'يسار' : 'Left'}
          </Button>
          <Button
            variant={currentAlignment === 'center' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleAlignmentChange('center')}
            className="flex items-center gap-1"
          >
            <AlignCenter size={16} />
            {language === 'ar' ? 'وسط' : 'Center'}
          </Button>
          <Button
            variant={currentAlignment === 'right' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleAlignmentChange('right')}
            className="flex items-center gap-1"
          >
            <AlignRight size={16} />
            {language === 'ar' ? 'يمين' : 'Right'}
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          {language === 'ar' ? 'إلغاء' : 'Cancel'}
        </Button>
        <Button onClick={handleSaveField}>
          {language === 'ar' ? 'حفظ' : 'Save'}
        </Button>
      </div>
    </div>
  );
};

export default ImageFieldEditor;