
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Settings, Trash } from 'lucide-react';
import FormPreview from './FormPreview';

// Define the form field types
interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'checkbox' | 'radio' | 'textarea';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[]; // For select, checkbox, radio
}

// Define the form step type
interface FormStep {
  id: string;
  title: string;
  fields: FormField[];
}

const FormBuilder: React.FC = () => {
  // Sample initial form data
  const [formTitle, setFormTitle] = useState('نموذج طلب منتج');
  const [formDescription, setFormDescription] = useState('يرجى تعبئة النموذج التالي لطلب المنتج والدفع عند الاستلام');
  const [currentPreviewStep, setCurrentPreviewStep] = useState(1);
  
  // Sample form steps
  const [formSteps, setFormSteps] = useState<FormStep[]>([
    {
      id: '1',
      title: 'معلومات العميل',
      fields: [
        {
          id: '1',
          type: 'text',
          label: 'الاسم الكامل',
          placeholder: 'أدخل الاسم الكامل',
          required: true
        },
        {
          id: '2',
          type: 'email',
          label: 'البريد الإلكتروني',
          placeholder: 'example@mail.com',
          required: true
        },
        {
          id: '3',
          type: 'phone',
          label: 'رقم الهاتف',
          placeholder: '05xxxxxxxx',
          required: true
        }
      ]
    },
    {
      id: '2',
      title: 'عنوان التوصيل',
      fields: [
        {
          id: '4',
          type: 'text',
          label: 'المدينة',
          placeholder: 'أدخل المدينة',
          required: true
        },
        {
          id: '5',
          type: 'text',
          label: 'الحي',
          placeholder: 'أدخل الحي',
          required: true
        },
        {
          id: '6',
          type: 'textarea',
          label: 'العنوان التفصيلي',
          placeholder: 'أدخل العنوان التفصيلي',
          required: true
        }
      ]
    },
    {
      id: '3',
      title: 'تفاصيل المنتج',
      fields: [
        {
          id: '7',
          type: 'select',
          label: 'اللون',
          options: ['أحمر', 'أزرق', 'أسود', 'أبيض'],
          required: true
        },
        {
          id: '8',
          type: 'select',
          label: 'الحجم',
          options: ['صغير', 'متوسط', 'كبير'],
          required: true
        },
        {
          id: '9',
          type: 'textarea',
          label: 'ملاحظات إضافية',
          placeholder: 'أدخل أي ملاحظات إضافية تتعلق بالطلب',
          required: false
        }
      ]
    }
  ]);
  
  // Current selected step for editing
  const [currentEditStep, setCurrentEditStep] = useState(0);
  
  const addNewStep = () => {
    const newStep = {
      id: (formSteps.length + 1).toString(),
      title: `خطوة جديدة ${formSteps.length + 1}`,
      fields: []
    };
    setFormSteps([...formSteps, newStep]);
    setCurrentEditStep(formSteps.length);
  };
  
  const renderPreviewFields = (fields: FormField[]) => {
    return (
      <div className="space-y-4">
        {fields.map(field => (
          <div key={field.id} className="form-control text-right">
            <label className="form-label">
              {field.label}
              {field.required && <span className="text-red-500 mr-1">*</span>}
            </label>
            
            {field.type === 'text' || field.type === 'email' || field.type === 'phone' ? (
              <input
                type={field.type === 'email' ? 'email' : 'text'}
                placeholder={field.placeholder}
                className="form-input"
                disabled
              />
            ) : field.type === 'textarea' ? (
              <textarea
                placeholder={field.placeholder}
                className="form-input h-24"
                disabled
              />
            ) : field.type === 'select' ? (
              <select className="form-select" disabled>
                <option value="">-- اختر --</option>
                {field.options?.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            ) : field.type === 'checkbox' ? (
              <div className="space-y-2">
                {field.options?.map(option => (
                  <div key={option} className="flex items-center space-x-2 rtl:space-x-reverse">
                    <input
                      type="checkbox"
                      id={`check-${option}`}
                      className="form-checkbox"
                      disabled
                    />
                    <label htmlFor={`check-${option}`}>{option}</label>
                  </div>
                ))}
              </div>
            ) : field.type === 'radio' ? (
              <div className="space-y-2">
                {field.options?.map(option => (
                  <div key={option} className="flex items-center space-x-2 rtl:space-x-reverse">
                    <input
                      type="radio"
                      id={`radio-${option}`}
                      name={`radio-${field.id}`}
                      className="form-radio"
                      disabled
                    />
                    <label htmlFor={`radio-${option}`}>{option}</label>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    );
  };
  
  const renderPreviewNavigation = () => {
    return (
      <div className="mt-6 flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentPreviewStep(prev => Math.max(prev - 1, 1))}
          disabled={currentPreviewStep === 1}
        >
          السابق
        </Button>
        
        {currentPreviewStep < formSteps.length ? (
          <Button
            onClick={() => setCurrentPreviewStep(prev => Math.min(prev + 1, formSteps.length))}
          >
            التالي
          </Button>
        ) : (
          <Button>
            إرسال الطلب
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Form Builder Panel */}
      <div className="lg:col-span-7 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-right">منشئ النموذج</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="steps">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="steps">الخطوات</TabsTrigger>
                <TabsTrigger value="settings">الإعدادات</TabsTrigger>
                <TabsTrigger value="design">التصميم</TabsTrigger>
              </TabsList>
              
              <TabsContent value="steps" className="mt-6">
                <div className="space-y-4">
                  {formSteps.map((step, index) => (
                    <div 
                      key={step.id} 
                      className={cn(
                        "p-4 border rounded-lg cursor-pointer transition-all",
                        currentEditStep === index 
                          ? "border-codform-purple bg-codform-light-purple" 
                          : "border-gray-200 hover:border-gray-300"
                      )}
                      onClick={() => setCurrentEditStep(index)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Settings size={16} className="text-gray-500 mr-2" />
                          <Trash size={16} className="text-gray-500" />
                        </div>
                        <div className="text-right">
                          <h3 className="font-medium">{step.title}</h3>
                          <p className="text-sm text-gray-500">{step.fields.length} حقول</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Button 
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={addNewStep}
                  >
                    <Plus size={16} />
                    إضافة خطوة جديدة
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="settings" className="mt-6">
                <div className="space-y-4 text-right">
                  <div className="form-control">
                    <label className="form-label">عنوان النموذج</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="form-label">وصف النموذج</label>
                    <textarea 
                      className="form-input h-24" 
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                    ></textarea>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="design" className="mt-6">
                <div className="text-center text-gray-500 py-8">
                  <p>خيارات التصميم ستكون متاحة قريبًا</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Form Preview Panel */}
      <div className="lg:col-span-5">
        <div className="sticky top-6">
          <h3 className="text-lg font-medium mb-4 text-right">معاينة النموذج</h3>
          <FormPreview 
            formTitle={formTitle}
            formDescription={formDescription}
            currentStep={currentPreviewStep}
            totalSteps={formSteps.length}
          >
            {currentPreviewStep <= formSteps.length && (
              <>
                {renderPreviewFields(formSteps[currentPreviewStep - 1].fields)}
                {renderPreviewNavigation()}
              </>
            )}
          </FormPreview>
        </div>
      </div>
    </div>
  );
};

export default FormBuilder;
