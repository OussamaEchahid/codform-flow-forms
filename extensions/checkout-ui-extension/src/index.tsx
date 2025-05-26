
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

  useBuyerJourneyIntercept(({ canRender, apply }) => {
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

  const renderField = (field) => {
    if (field.type === 'form-title') {
      const titleText = field.content || field.label || '';
      const titleStyle = field.style || {};
      const textColor = titleStyle.color || '#000000';
      
      return (
        <Text 
          key={field.id}
          size="large"
          emphasis="bold"
          appearance="base"
        >
          {titleText}
        </Text>
      );
    }

    if (field.type === 'text' || field.type === 'email' || field.type === 'phone') {
      return (
        <BlockStack key={field.id}>
          <Text>{field.label}</Text>
          <input
            type="text"
            defaultValue={formData[field.id] || ''}
            onChange={e => handleChange(field.id, e.target.value)}
          />
        </BlockStack>
      );
    }

    if (field.type === 'textarea') {
      return (
        <BlockStack key={field.id}>
          <Text>{field.label}</Text>
          <textarea
            defaultValue={formData[field.id] || ''}
            onChange={e => handleChange(field.id, e.target.value)}
          />
        </BlockStack>
      );
    }

    if (field.type === 'checkbox') {
      return (
        <BlockStack key={field.id}>
          <label>
            <input
              type="checkbox"
              value={formData[field.id] || false}
              onChange={e => handleChange(field.id, e.target.checked)}
            />
            {field.label}
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
