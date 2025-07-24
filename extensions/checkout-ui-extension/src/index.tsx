import React from 'react';
import {
  reactExtension,
  BlockStack,
  Text,
  Button,
  useSettings,
  useApplyCartLinesChange,
  useBuyerJourneyIntercept,
  useCartLines,
} from '@shopify/ui-extensions-react/checkout';

export default reactExtension(
  'purchase.checkout.block.render',
  () => <Extension />
);

function Extension() {
  const { form_id, api_url } = useSettings();
  const cartLines = useCartLines();
  const applyCartLinesChange = useApplyCartLinesChange();
  const [formData, setFormData] = React.useState({});
  const [showForm, setShowForm] = React.useState(false);
  const [formConfig, setFormConfig] = React.useState(null);

  React.useEffect(() => {
    if (form_id && api_url) {
      fetch(`${api_url}/api/forms/${form_id}`)
        .then(response => response.json())
        .then(data => {
          setFormConfig(data);
        })
        .catch(error => {
          console.error('Error fetching form config:', error);
        });
    }
  }, [form_id, api_url]);

  useBuyerJourneyIntercept(({ canRender, apply покупательJourneyChange }) => {
    if (!formConfig) {
      return;
    }

    if (showForm) {
      canRender(false);
    }
  });

  const handleSubmit = () => {
    if (!formConfig) {
      return;
    }

    const lineItems = cartLines.map(line => ({
      id: line.id,
      quantity: line.quantity,
    }));

    fetch(`${api_url}/api/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        formId: form_id,
        formData: { ...formData, lineItems },
      }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setShowForm(false);
          applyCartLinesChange({
            type: 'updateCartLines',
            cartLines: cartLines.map(line => ({
              id: line.id,
              attributes: {
                ...line.attributes,
                form_submitted: 'true',
              },
            })),
          });
        }
      })
      .catch(error => {
        console.error('Error submitting form:', error);
      });
  };

  const handleChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  // Icon helper function for checkout UI
  const getIconForField = (field) => {
    if (!field.icon || field.icon === 'none') return null;
    
    const iconColor = field.style?.iconColor || '#9CA3AF';
    const showIcon = field.style?.showIcon !== false && field.style?.showIconInPreview !== false;
    
    if (!showIcon) return null;
    
    // Map ALL available icons to emoji symbols for checkout UI
    const iconMap = {
      // Basic icons
      user: '👤',
      phone: '📱', 
      mail: '📧',
      email: '📧',
      'map-pin': '📍',
      
      // New featured icons
      home: '🏠',
      heart: '❤️',
      star: '⭐',
      'shopping-cart': '🛒',
      gift: '🎁',
      calendar: '📅',
      clock: '⏰',
      'message-circle': '💬',
      
      // Shape icons
      diamond: '💎',
      circle: '⭕',
      square: '⬜',
      triangle: '🔺',
      hexagon: '⬣',
      target: '🎯',
      
      // Action icons
      settings: '⚙️',
      check: '✅',
      x: '❌',
      plus: '➕',
      minus: '➖',
      edit: '✏️',
      trash: '🗑️',
      search: '🔍',
      eye: '👁️',
      'eye-off': '🙈',
      info: 'ℹ️',
      'alert-triangle': '⚠️',
      download: '⬇️',
      upload: '⬆️',
      link: '🔗',
      'external-link': '↗️',
      refresh: '🔄',
      copy: '📋',
      file: '📄',
      folder: '📁',
      image: '🖼️'
    };
    
    return iconMap[field.icon] || '•';
  };

  const renderField = (field) => {
    if (field.type === 'form-title') {
      return (
        <Text 
          key={field.id}
          size="large"
          emphasis="bold"
          appearance="base"
        >
          {field.content || field.label || 'عنوان النموذج'}
        </Text>
      );
    }

    if (field.type === 'text' || field.type === 'email' || field.type === 'phone') {
      const icon = getIconForField(field);
      const showLabel = field.style?.showLabel !== false;
      
      return (
        <BlockStack key={field.id}>
          {showLabel && <Text>{icon ? `${icon} ${field.label}` : field.label}</Text>}
          <input
            type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
            placeholder={field.placeholder || field.label}
            defaultValue={formData[field.id] || ''}
            onChange={e => handleChange(field.id, e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '16px',
              width: '100%',
              boxSizing: 'border-box'
            }}
          />
        </BlockStack>
      );
    }

    if (field.type === 'textarea') {
      const showLabel = field.style?.showLabel !== false;
      
      return (
        <BlockStack key={field.id}>
          {showLabel && <Text>{field.label}</Text>}
          <textarea
            placeholder={field.placeholder || field.label}
            defaultValue={formData[field.id] || ''}
            onChange={e => handleChange(field.id, e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '16px',
              width: '100%',
              minHeight: '80px',
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
          />
        </BlockStack>
      );
    }

    if (field.type === 'checkbox') {
      return (
        <BlockStack key={field.id}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={formData[field.id] || false}
              onChange={e => handleChange(field.id, e.target.checked)}
            />
            <Text>{field.label}</Text>
          </label>
        </BlockStack>
      );
    }

    return null;
  };

  if (!formConfig) {
    return <Text>Loading...</Text>;
  }

  if (!showForm) {
    return (
      <Button onClick={() => setShowForm(true)}>
        Fill Form
      </Button>
    );
  }

  return (
    <BlockStack>
      {formConfig.data[0].fields.map(renderField)}
      <Button onClick={handleSubmit}>Submit</Button>
    </BlockStack>
  );
}
