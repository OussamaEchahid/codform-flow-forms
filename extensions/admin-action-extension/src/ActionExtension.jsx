
import { useState, useEffect } from 'react';
import {
  extend,
  Banner,
  Text,
  Box,
  Card,
  BlockStack,
  Button,
  Select,
  InlineStack,
  ChoiceList,
  TextField,
  Spinner,
  Icon,
} from '@shopify/admin-ui-extensions-react';

// Extending the Admin UI with a custom action
extend('Playground', (root, { api, configuration }) => {
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [currentSettings, setCurrentSettings] = useState(null);
  
  // Get the product ID from the API (this is the context of the extension)
  const productId = api.getResource('Product')?.id?.replace('gid://shopify/Product/', '');
  
  // Extract the shop domain from the iframe URL
  const getShopDomain = () => {
    const hostname = window.location.hostname;
    if (hostname.includes('--')) {
      // Dev environment with format like shop-name--theme-dev.shopifypreview.com
      const shopPart = hostname.split('--')[0];
      return `${shopPart}.myshopify.com`;
    }
    // Production environment
    return hostname;
  };
  
  const shopDomain = getShopDomain();
  
  // Fetch available forms and current settings
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Get the product form settings endpoint
        const apiRoot = process.env.NODE_ENV === 'development' 
          ? 'https://your-dev-api.com' // Replace with your dev API
          : 'https://your-production-api.com'; // Replace with your production API
        
        // First check if there are existing settings for this product
        const settingsResponse = await fetch(`${apiRoot}/api/shopify/product-settings?shop=${shopDomain}&productId=${productId}`);
        const settingsData = await settingsResponse.json();
        
        if (settingsData.success && settingsData.formId) {
          setCurrentSettings(settingsData);
          setSelectedForm(settingsData.formId);
        }
        
        // Then fetch all available forms
        const formsResponse = await fetch(`${apiRoot}/api/forms?shop=${shopDomain}`);
        const formsData = await formsResponse.json();
        
        if (formsData.success && Array.isArray(formsData.forms)) {
          setForms(formsData.forms);
        } else {
          setError('لم نتمكن من جلب النماذج المتاحة');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('حدث خطأ أثناء جلب البيانات');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (productId && shopDomain) {
      fetchData();
    }
  }, [productId, shopDomain]);
  
  // Save the selected form settings
  const handleSave = async () => {
    if (!selectedForm) {
      setError('يرجى اختيار نموذج أولاً');
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      
      const apiRoot = process.env.NODE_ENV === 'development' 
        ? 'https://your-dev-api.com' // Replace with your dev API
        : 'https://your-production-api.com'; // Replace with your production API
      
      const response = await fetch(`${apiRoot}/api/shopify/product-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shop: shopDomain,
          productId: productId,
          formId: selectedForm,
          enabled: true,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsSuccess(true);
        setCurrentSettings(data);
        setTimeout(() => {
          setIsSuccess(false);
        }, 3000);
      } else {
        setError(data.error || 'حدث خطأ أثناء حفظ الإعدادات');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <Box padding="base" alignment="center">
          <Spinner size="large" />
          <Text>جاري التحميل...</Text>
        </Box>
      );
    }
    
    return (
      <BlockStack spacing="loose">
        {error && (
          <Banner status="critical">
            <Text>{error}</Text>
          </Banner>
        )}
        
        {isSuccess && (
          <Banner status="success">
            <Text>تم حفظ إعدادات النموذج بنجاح!</Text>
          </Banner>
        )}
        
        <Card>
          <BlockStack spacing="tight">
            <Text size="large">اختيار نموذج الدفع عند الاستلام</Text>
            
            <Select
              label="النموذج"
              options={forms.map(form => ({ value: form.id, label: form.title }))}
              value={selectedForm}
              onChange={setSelectedForm}
              disabled={isLoading || isSaving}
            />
            
            <InlineStack alignment="end">
              <Button
                primary
                onClick={handleSave}
                loading={isSaving}
                disabled={isLoading || isSaving || !selectedForm}
              >
                حفظ
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>
        
        {currentSettings && (
          <Card>
            <BlockStack spacing="tight">
              <Text size="medium" emphasized>
                الإعدادات الحالية
              </Text>
              <Text>
                النموذج: {forms.find(f => f.id === currentSettings.formId)?.title || currentSettings.formId}
              </Text>
              <Text>
                معرف البلوك: {currentSettings.blockId}
              </Text>
            </BlockStack>
          </Card>
        )}
        
        <Card>
          <BlockStack spacing="tight">
            <Text size="medium" emphasized>
              كيفية عرض النموذج في صفحة المنتج
            </Text>
            <Text>
              1. انتقل إلى محرر السمات الخاص بك
            </Text>
            <Text>
              2. في صفحة المنتج، أضف بلوك "نموذج الدفع عند الاستلام"
            </Text>
            <Text>
              3. إذا كنت ترغب في تخصيص المظهر، يمكنك تعديل CSS الخاص بك
            </Text>
          </BlockStack>
        </Card>
      </BlockStack>
    );
  };
  
  root.render(
    <BlockStack spacing="loose">
      {renderContent()}
    </BlockStack>
  );
});
