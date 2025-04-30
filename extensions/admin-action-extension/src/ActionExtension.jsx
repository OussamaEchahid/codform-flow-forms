
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
  const [blockId, setBlockId] = useState('');
  
  // Get the product ID from the data
  const productId = data?.product?.id;
  
  // Load forms and settings when the component mounts
  useEffect(() => {
    if (isModalOpen) {
      loadForms();
      loadSettings();
    }
  }, [isModalOpen]);
  
  // Generate a random blockId if not set
  useEffect(() => {
    if (isModalOpen && !blockId) {
      setBlockId(`codform-${Math.random().toString(36).substring(2, 8)}`);
    }
  }, [isModalOpen, blockId]);
  
  // Load forms from the CODFORM API
  const loadForms = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Replace with your actual API endpoint
      const response = await fetch('https://codform-flow-forms.lovable.app/api/forms', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`فشل في تحميل النماذج: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Forms loaded:', data);
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
      if (!productId) {
        console.warn('No product ID available');
        return;
      }
      
      const settings = await storage.read(`codform_settings_${productId}`);
      console.log('Loaded settings:', settings);
      
      if (settings) {
        setSelectedForm(settings.formId || '');
        setIsEnabled(settings.enabled || false);
        setBlockId(settings.blockId || `codform-${Math.random().toString(36).substring(2, 8)}`);
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
      
      const settings = {
        formId: selectedForm,
        enabled: isEnabled,
        productId: productId,
        blockId: blockId,
        updatedAt: new Date().toISOString()
      };
      
      console.log('Saving settings:', settings);
      await storage.write(`codform_settings_${productId}`, settings);
      
      // Notify the app about the change via API
      try {
        const notifyResponse = await fetch('https://codform-flow-forms.lovable.app/api/shopify/product-settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          mode: 'cors',
          body: JSON.stringify({
            productId: productId,
            formId: selectedForm,
            enabled: isEnabled,
            blockId: blockId
          }),
        });
        
        if (!notifyResponse.ok) {
          console.warn('Failed to notify app about settings change, but settings were saved locally');
        } else {
          console.log('App notified successfully about settings change');
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
  
  // Handle block ID change
  const handleBlockIdChange = (value) => {
    setBlockId(value);
  };
  
  // Generate a new random block ID
  const generateBlockId = () => {
    setBlockId(`codform-${Math.random().toString(36).substring(2, 8)}`);
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
              <>
                <Select
                  label="اختر النموذج"
                  options={forms.map(form => ({
                    label: form.title || 'نموذج بدون عنوان',
                    value: form.id,
                  }))}
                  value={selectedForm}
                  onChange={handleFormChange}
                  disabled={isLoading}
                />
                
                <BlockStack spacing="tight">
                  <Text>معرف كتلة النموذج (Block ID)</Text>
                  <InlineStack blockAlignment="center">
                    <TextField
                      label=""
                      value={blockId}
                      onChange={handleBlockIdChange}
                      helpText="معرف فريد لتتبع هذا النموذج في المتجر"
                    />
                    <Button
                      onPress={generateBlockId}
                    >
                      توليد
                    </Button>
                  </InlineStack>
                </BlockStack>
              </>
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
            
            <BlockStack>
              <Text>ملاحظة هامة:</Text>
              <Text>بعد حفظ الإعدادات، يجب عليك التأكد من إضافة كتلة "نموذج الدفع عند الاستلام" إلى قالب المنتج في محرر الموضوعات الخاص بك.</Text>
            </BlockStack>
          </BlockStack>
        </Modal>
      )}
    </>
  );
}
