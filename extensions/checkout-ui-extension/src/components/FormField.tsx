import React from 'react';
import { BlockStack, Text } from '@shopify/ui-extensions-react/checkout';
import { getIconForField } from '../utils/fieldHelpers';

interface FormFieldProps {
  field: any;
  formData: any;
  handleChange: (fieldId: string, value: any) => void;
}

export const FormField: React.FC<FormFieldProps> = ({ field, formData, handleChange }) => {
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

  if (field.type === 'countdown') {
    const fieldStyle = field.style || {};
    const title = field.label || 'Remaining on offer';
    const backgroundColor = fieldStyle.backgroundColor || '#9b87f5';
    const titleColor = fieldStyle.titleColor || '#ffffff';
    const counterColor = fieldStyle.counterColor || '#9b87f5';
    
    return (
      <BlockStack key={field.id}>
        <div 
          style={{
            background: backgroundColor,
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            marginBottom: '16px'
          }}
        >
          <Text emphasis="bold" style={{ color: titleColor, marginBottom: '12px' }}>
            {title}
          </Text>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            {['Days', 'Hrs', 'Mins', 'Secs'].map((label, index) => (
              <div key={label} style={{
                backgroundColor: 'rgba(255,255,255,0.9)',
                borderRadius: '8px',
                padding: '8px',
                minWidth: '60px',
                textAlign: 'center'
              }}>
                <div style={{ 
                  color: counterColor, 
                  fontSize: '20px', 
                  fontWeight: 'bold' 
                }}>
                  {index === 0 ? '02' : index === 1 ? '23' : index === 2 ? '59' : '05'}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </BlockStack>
    );
  }

  return null;
};