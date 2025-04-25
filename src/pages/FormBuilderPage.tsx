
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, Plus, Save, Trash, Copy, Edit } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useFormTemplates, FormData } from '@/lib/hooks/useFormTemplates';
import { toast } from 'sonner';
import FormPreview from '@/components/form/FormPreview';

const FormBuilderPage = () => {
  const { formId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'editor'>(formId ? 'editor' : 'dashboard');
  const [currentForm, setCurrentForm] = useState<FormData | null>(null);
  
  const {
    forms,
    isLoading,
    fetchForms,
    saveForm,
  } = useFormTemplates();
  
  // Form builder state
  const [formElements, setFormElements] = useState<Array<{
    type: string;
    id: string;
    label: string;
    required?: boolean;
    placeholder?: string;
  }>>([
    { type: 'title', id: 'title-1', label: 'Fill the form for cash on delivery' },
    { type: 'text', id: 'name-1', label: 'Full name', required: true, placeholder: 'Full name' },
    { type: 'phone', id: 'phone-1', label: 'Phone number', required: true, placeholder: 'Phone number' },
    { type: 'text', id: 'city-1', label: 'City', required: true, placeholder: 'City' },
    { type: 'textarea', id: 'address-1', label: 'Address', required: true, placeholder: 'address' },
    { type: 'cart-items', id: 'cart-1', label: 'Product item' },
    { type: 'submit', id: 'submit-1', label: 'Buy with Cash on Delivery' }
  ]);
  
  const [selectedElementIndex, setSelectedElementIndex] = useState<number | null>(null);
  
  const handleSave = () => {
    toast.success('تم حفظ النموذج بنجاح');
  };
  
  // Available elements to add
  const availableElements = [
    { type: 'whatsapp', label: 'WhatsApp Button', icon: '📱' },
    { type: 'image', label: 'Image', icon: '🖼️' },
    { type: 'title', label: 'Title', icon: 'T' },
    { type: 'text/html', label: 'Text/Html', icon: '📄' },
    { type: 'cart-items', label: 'Cart items', icon: '🛒' },
    { type: 'cart-summary', label: 'Cart Sammury', icon: '📋' },
    { type: 'text', label: 'Text Input', icon: '✍️' },
    { type: 'textarea', label: 'Multi-line Input', icon: '📝' },
    { type: 'radio', label: 'Single Choice', icon: '⭕' },
    { type: 'checkbox', label: 'Multiple Choices', icon: '☑️' },
    { type: 'shipping', label: 'Shipping', icon: '🚚' },
    { type: 'countdown', label: 'CountDown', icon: '⏱️' }
  ];
  
  const addElement = (type: string) => {
    const newElement = {
      type,
      id: `${type}-${Date.now()}`,
      label: `New ${type}`,
      placeholder: `Enter ${type}`
    };
    
    setFormElements([...formElements, newElement]);
  };
  
  if (!user) {
    return <div className="text-center py-8">يرجى تسجيل الدخول للوصول إلى منشئ النماذج</div>;
  }
  
  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              Dashboard
            </Button>
            <div className="h-4 w-[1px] bg-gray-300"></div>
            <div className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full flex items-center gap-2">
              <span>Form as popup</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline">Guide</Button>
            <Button variant="outline">Forms Templates</Button>
            <Button className="flex items-center gap-2">
              <Save size={18} />
              Save
            </Button>
          </div>
        </div>
        
        {/* Form Builder */}
        <div className="grid grid-cols-12 min-h-[calc(100vh-64px)]">
          {/* Elements Panel */}
          <div className="col-span-2 border-r bg-white p-4">
            <h3 className="font-medium text-lg mb-4">Elements To Add</h3>
            
            <div className="space-y-2">
              {availableElements.map((element) => (
                <div 
                  key={element.type}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 border rounded-md cursor-pointer"
                >
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="p-1" 
                    onClick={() => addElement(element.type)}
                  >
                    <Plus size={16} />
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <span>{element.label}</span>
                    <span className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded">
                      {element.icon}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Form Editor */}
          <div className="col-span-6 bg-gray-50 p-6">
            <h2 className="text-xl font-semibold mb-6">Edit & Order Form Elements</h2>
            
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-md border">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Global form styling</h3>
                  <Button variant="ghost" size="sm">
                    <ChevronDown size={16} />
                  </Button>
                </div>
              </div>
              
              {formElements.map((element, index) => (
                <div 
                  key={element.id}
                  className={`bg-white p-4 rounded-md border ${selectedElementIndex === index ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => setSelectedElementIndex(index)}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="text-red-500 p-1">
                          <Trash size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-blue-500 p-1">
                          <Copy size={16} />
                        </Button>
                        <span className="border-r h-4 mx-2"></span>
                        <span className="font-medium">{element.label} configuration</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="bg-green-100 text-green-700 rounded-full p-1 h-8 w-8"
                      >
                        <Copy size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="bg-purple-100 text-purple-700 rounded-full p-1 h-8 w-8"
                      >
                        <Edit size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Preview */}
          <div className="col-span-4 border-l bg-white p-6">
            <h3 className="text-lg font-medium mb-4">Live Preview</h3>
            
            <div className="border rounded-lg p-4 bg-gray-50">
              <FormPreview 
                formTitle="Fill the form for cash on delivery"
                currentStep={1}
                totalSteps={1}
              >
                <div className="space-y-4">
                  <div className="form-control text-right">
                    <label className="form-label">
                      Full name
                      <span className="text-red-500 mr-1">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Full name"
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-control text-right">
                    <label className="form-label">
                      Phone number
                      <span className="text-red-500 mr-1">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Phone number"
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-control text-right">
                    <label className="form-label">
                      City
                      <span className="text-red-500 mr-1">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="City"
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-control text-right">
                    <label className="form-label">
                      Address
                      <span className="text-red-500 mr-1">*</span>
                    </label>
                    <textarea
                      placeholder="address"
                      className="form-input h-24"
                    />
                  </div>
                </div>
              </FormPreview>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FormBuilderPage;
