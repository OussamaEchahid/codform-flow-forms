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
    try {
      // Replace with your actual API endpoint
      const response = await fetch('https://codform-flow-forms.lovable.app/api/forms');
      if (!response.ok) {
        throw new Error('Failed to load forms');
      }
      const data = await response.json();
      setForms(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading forms:', error);
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
      await storage.write(`codform_settings_${productId}`, {
        formId: selectedForm,
        enabled: isEnabled,
        productId: productId,
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving settings:', error);
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
            
            {isEnabled && forms.length === 0 && !isLoading && (
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
