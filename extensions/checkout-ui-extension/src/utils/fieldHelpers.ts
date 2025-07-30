import { iconMap } from '../constants/iconMap';

// Icon helper function for checkout UI
export const getIconForField = (field: any) => {
  if (!field.icon || field.icon === 'none') return null;
  
  const showIcon = field.style?.showIcon !== false && field.style?.showIconInPreview !== false;
  
  if (!showIcon) return null;
  
  return iconMap[field.icon as keyof typeof iconMap] || '•';
};