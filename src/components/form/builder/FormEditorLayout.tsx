
import React, { useState } from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog } from '@/components/ui/dialog';
import { PointerSensor, KeyboardSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { FormStyle } from '@/hooks/useFormEditor';

// Import our component parts
import FormHeader from './FormHeader';
import FormStyleEditor from './FormStyleEditor';
import FormTemplatesDialog from '../FormTemplatesDialog';
import FormPreviewPanel from './FormPreviewPanel';
import FieldEditor from '../FieldEditor';
import ShopifyIntegration from './ShopifyIntegration';
import FormMetadataEditor from './FormMetadataEditor';
import FormEditorElements from './FormEditorElements';
import FormEditorCanvas from './FormEditorCanvas';

interface FormEditorLayoutProps {
  // Form data
  formId?: string;
  formTitle: string;
  formDescription: string;
  formElements: FormField[];
  formStyle: FormStyle;
  submitButtonText: string;
  
  // State
  refreshKey: number;
  selectedElementIndex: number | null;
  isSaving: boolean;
  isPublished: boolean;
  isPublishing: boolean;
  currentPreviewStep: number;
  
  // Element handlers
  onSelectElement: (index: number) => void;
  onAddElement: (type: string) => void;
  onEditElement: (index: number) => void;
  onDeleteElement: (index: number) => void;
  onDuplicateElement: (index: number) => void;
  onUpdateElement: (field: FormField) => void;
  onDragEnd: (event: DragEndEvent) => void;
  
  // Form metadata handlers
  onUpdateMeta: (field: 'title' | 'description' | 'submitButtonText', value: string) => void;
  onStyleChange: (key: string, value: string) => void;
  
  // Actions
  onSave: () => Promise<void>;
  onPublish: () => Promise<void>;
  onShopifyIntegration: (settings: any) => Promise<void>;
}

const FormEditorLayout: React.FC<FormEditorLayoutProps> = ({
  formId,
  formTitle,
  formDescription,
  formElements,
  formStyle,
  submitButtonText,
  refreshKey,
  selectedElementIndex,
  isSaving,
  isPublished,
  isPublishing,
  currentPreviewStep,
  onSelectElement,
  onAddElement,
  onEditElement,
  onDeleteElement,
  onDuplicateElement,
  onUpdateElement,
  onDragEnd,
  onUpdateMeta,
  onStyleChange,
  onSave,
  onPublish,
  onShopifyIntegration,
}) => {
  const { language } = useI18n();
  
  // Local UI state
  const [isStyleDialogOpen, setIsStyleDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isFieldEditorOpen, setIsFieldEditorOpen] = useState(false);
  const [currentEditingField, setCurrentEditingField] = useState<FormField | null>(null);
  const [activeTab, setActiveTab] = useState<string>("editor");

  // Configure DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Available element types
  const availableElements = [
    { type: 'whatsapp', label: language === 'ar' ? 'زر واتساب' : 'WhatsApp Button', icon: '📱' },
    { type: 'image', label: language === 'ar' ? 'صورة' : 'Image', icon: '🖼️' },
    { type: 'title', label: language === 'ar' ? 'عنوان' : 'Title', icon: 'T' },
    { type: 'text/html', label: language === 'ar' ? 'نص/HTML' : 'Text/Html', icon: '📄' },
    { type: 'cart-items', label: language === 'ar' ? 'عناصر السلة' : 'Cart items', icon: '🛒' },
    { type: 'cart-summary', label: language === 'ar' ? 'ملخص السلة' : 'Cart Summary', icon: '📋' },
    { type: 'text', label: language === 'ar' ? 'حقل نص' : 'Text Input', icon: '✍️' },
    { type: 'textarea', label: language === 'ar' ? 'حقل نص متعدد الأسطر' : 'Multi-line Input', icon: '📝' },
    { type: 'radio', label: language === 'ar' ? 'خيار واحد' : 'Single Choice', icon: '⭕' },
    { type: 'checkbox', label: language === 'ar' ? 'خيارات متعددة' : 'Multiple Choices', icon: '☑️' },
    { type: 'shipping', label: language === 'ar' ? 'الشحن' : 'Shipping', icon: '🚚' },
    { type: 'countdown', label: language === 'ar' ? 'عد تنازلي' : 'CountDown', icon: '⏱️' }
  ];

  // Field editor handlers
  const handleEditField = (index: number) => {
    const field = formElements[index];
    setCurrentEditingField(field);
    setIsFieldEditorOpen(true);
  };

  const handleSaveField = (updatedField: FormField) => {
    onUpdateElement(updatedField);
    setIsFieldEditorOpen(false);
    setCurrentEditingField(null);
  };

  // Template handling
  const handleSelectTemplate = (templateId: number) => {
    // Template selection logic would go here
    setIsTemplateDialogOpen(false);
  };

  // Style handling
  const handleSaveStyle = () => {
    setIsStyleDialogOpen(false);
  };

  return (
    <main className="flex-1 overflow-auto">
      <FormHeader 
        onSave={onSave}
        onPublish={onPublish}
        onStyleOpen={() => setIsStyleDialogOpen(true)}
        onTemplateOpen={() => setIsTemplateDialogOpen(true)}
        isSaving={isSaving}
        isPublishing={isPublishing}
        isPublished={isPublished}
      />
      
      <div className="grid grid-cols-12 min-h-[calc(100vh-64px)]">
        <FormEditorElements 
          availableElements={availableElements}
          onAddElement={onAddElement}
        />
        
        <div className="col-span-6 bg-gray-50 p-6">
          <h2 className={`text-xl font-semibold mb-6 ${language === 'ar' ? 'text-right' : ''}`}>
            {language === 'ar' ? 'تحرير وترتيب عناصر النموذج' : 'Edit & Order Form Elements'}
          </h2>
          
          <FormMetadataEditor 
            title={formTitle}
            description={formDescription}
            submitButtonText={submitButtonText}
            onUpdateMeta={onUpdateMeta}
          />
          
          <FormEditorCanvas 
            elements={formElements}
            selectedElementIndex={selectedElementIndex}
            onSelectElement={onSelectElement}
            onEditElement={handleEditField}
            onDeleteElement={onDeleteElement}
            onDuplicateElement={onDuplicateElement}
            onDragEnd={onDragEnd}
          />
        </div>
        
        <div className="col-span-4 border-l bg-white p-6">
          <FormPreviewPanel
            formTitle={formTitle}
            formDescription={formDescription}
            currentStep={currentPreviewStep}
            totalSteps={1}
            formStyle={formStyle}
            fields={formElements}
            onPreviousStep={() => {}}
            onNextStep={() => {}}
            refreshKey={refreshKey}
            submitButtonText={submitButtonText}
          />
        </div>
      </div>
      
      {/* Dialogs */}
      <FormStyleEditor
        isOpen={isStyleDialogOpen}
        onOpenChange={setIsStyleDialogOpen}
        formStyle={formStyle}
        onStyleChange={onStyleChange}
        onSave={handleSaveStyle}
      />

      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <FormTemplatesDialog 
          open={isTemplateDialogOpen}
          onSelect={handleSelectTemplate} 
          onClose={() => setIsTemplateDialogOpen(false)}
        />
      </Dialog>

      {isFieldEditorOpen && currentEditingField && (
        <FieldEditor
          field={currentEditingField}
          onSave={handleSaveField}
          onClose={() => setIsFieldEditorOpen(false)}
        />
      )}

      {formId && (
        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full mb-4">
              <TabsTrigger value="editor">
                {language === 'ar' ? 'محرر النموذج' : 'Form Editor'}
              </TabsTrigger>
              <TabsTrigger value="shopify">
                {language === 'ar' ? 'تكامل Shopify' : 'Shopify Integration'}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="shopify" className="py-4">
              <ShopifyIntegration
                formId={formId}
                onSave={onShopifyIntegration}
                isSyncing={false}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </main>
  );
};

export default FormEditorLayout;
