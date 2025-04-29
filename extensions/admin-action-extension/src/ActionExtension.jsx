
import {
  Button,
  Text,
  BlockStack,
  Modal,
  Select,
  TextField,
  InlineStack,
  Checkbox,
  useApi,
  reactExtension,
} from '@shopify/ui-extensions-react/admin';
import { useState, useEffect } from 'react';

// The target used here must match the target used in the extension's shopify.extension.toml file
export default reactExtension(
  'admin.product-details.action.render',
  () => <Extension />,
);

function Extension() {
  const { close, data, i18n, storage } = useApi();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState('');
  const [forms, setForms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [error, setError] = useState(null);
  
  // Get the product ID from the data
  const productId = data?.product?.id;
  
  // Load forms and settings when the component mounts
  useEffect(() => {
    loadForms();
    loadSettings();
  }, []);
  
  // Load forms from the CODFORM API
  const loadForms = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Replace with your actual API endpoint
      const response = await fetch('https://codform-flow-forms.lovable.app/api/forms');
      if (!response.ok) {
        throw new Error(`فشل في تحميل النماذج: ${response.status}`);
      }
      const data = await response.json();
      setForms(data);
    } catch (error) {
      console.error('Error loading forms:', error);
      setError(error.message || 'فشل في تحميل النماذج');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load settings from storage
  const loadSettings = async () => {
    try {
      const settings = await storage.read(`codform_settings_${productId}`);
      if (settings) {
        setSelectedForm(settings.formId || '');
        setIsEnabled(settings.enabled || false);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };
  
  // Save settings to storage
  const saveSettings = async () => {
    try {
      if (!productId) {
        throw new Error('لم يتم العثور على معرف المنتج');
      }
      
      await storage.write(`codform_settings_${productId}`, {
        formId: selectedForm,
        enabled: isEnabled,
        productId: productId,
        updatedAt: new Date().toISOString()
      });
      
      // Notify the app about the change via API
      try {
        const notifyResponse = await fetch('https://codform-flow-forms.lovable.app/api/shopify/product-settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId: productId,
            formId: selectedForm,
            enabled: isEnabled,
          }),
        });
        
        if (!notifyResponse.ok) {
          console.warn('Failed to notify app about settings change, but settings were saved locally');
        }
      } catch (notifyError) {
        console.warn('Error notifying app:', notifyError);
        // Continue anyway as the local settings were saved
      }
      
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert(`فشل في حفظ الإعدادات: ${error.message}`);
    }
  };
  
  // Open the modal
  const handleClick = () => {
    setIsModalOpen(true);
  };
  
  // Close the modal
  const handleClose = () => {
    setIsModalOpen(false);
  };
  
  // Handle form selection
  const handleFormChange = (value) => {
    setSelectedForm(value);
  };
  
  // Handle enable/disable checkbox
  const handleEnableChange = (value) => {
    setIsEnabled(value);
  };
  
  return (
    <>
      <Button
        title="Configure CODFORM"
        onPress={handleClick}
        primary
      >
        إعداد نموذج الدفع عند الاستلام
      </Button>
      
      {isModalOpen && (
        <Modal
          title="إعداد نموذج الدفع عند الاستلام"
          onClose={handleClose}
          primaryAction={{
            content: 'حفظ',
            onAction: saveSettings,
          }}
          secondaryActions={[
            {
              content: 'إلغاء',
              onAction: handleClose,
            },
          ]}
        >
          <BlockStack spacing="loose">
            <Text>قم بتكوين نموذج الدفع عند الاستلام لهذا المنتج</Text>
            
            <Checkbox
              label="تفعيل نموذج الدفع عند الاستلام"
              checked={isEnabled}
              onChange={handleEnableChange}
            />
            
            {isEnabled && (
              <Select
                label="اختر النموذج"
                options={forms.map(form => ({
                  label: form.title,
                  value: form.id,
                }))}
                value={selectedForm}
                onChange={handleFormChange}
                disabled={isLoading}
              />
            )}
            
            {isLoading && (
              <Text>جاري تحميل النماذج...</Text>
            )}
            
            {error && (
              <Text appearance="critical">{error}</Text>
            )}
            
            {isEnabled && forms.length === 0 && !isLoading && !error && (
              <Text>لا توجد نماذج متاحة. يرجى إنشاء نموذج أولاً.</Text>
            )}
            
            <InlineStack spacing="loose">
              <Button
                onPress={() => {
                  // Open CODFORM dashboard in a new tab
                  window.open('https://codform-flow-forms.lovable.app/dashboard', '_blank');
                }}
              >
                إدارة النماذج
              </Button>
              
              <Button
                onPress={loadForms}
                loading={isLoading}
              >
                تحديث النماذج
              </Button>
            </InlineStack>
          </BlockStack>
        </Modal>
      )}
    </>
  );
}
