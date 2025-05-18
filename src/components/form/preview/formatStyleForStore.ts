
/**
 * وظائف مساعدة لضمان توافق الأنماط بين المعاينة والمتجر
 * هذه الوظائف تعالج الاختلافات بين React CSS وأنماط JavaScript العادية المستخدمة في المتجر
 */

import { FormField, FormFieldStyle } from '@/lib/form-utils';

/**
 * تحويل قيم حجم الخط من rem إلى px للتوافق مع المتجر
 */
export const normalizeFontSize = (fontSize: string | undefined): string => {
  if (!fontSize) return '';
  
  // تحويل rem إلى px
  if (fontSize.includes('rem')) {
    const remValue = parseFloat(fontSize);
    return `${remValue * 16}px`;
  }
  
  // إضافة وحدة px إذا كان الإدخال رقمي فقط
  if (!isNaN(parseFloat(fontSize)) && !fontSize.match(/[a-z%]/i)) {
    return `${fontSize}px`;
  }
  
  return fontSize;
};

/**
 * تحويل الألوان إلى صيغة hex كاملة
 */
export const normalizeColor = (color: string | undefined): string => {
  if (!color) return '';
  
  // تحويل #rgb إلى #rrggbb
  if (color.startsWith('#') && color.length === 4) {
    const r = color[1];
    const g = color[2];
    const b = color[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  
  return color;
};

/**
 * تحويل أنماط عنوان النموذج إلى تنسيق متوافق مع المتجر
 */
export const formatTitleFieldStyle = (style: FormFieldStyle = {}): Record<string, string> => {
  return {
    backgroundColor: `${normalizeColor(style.backgroundColor || '#9b87f5')} !important`,
    color: `${normalizeColor(style.color || '#ffffff')} !important`,
    fontSize: `${normalizeFontSize(style.fontSize || '24px')} !important`,
    fontWeight: `${style.fontWeight || 'bold'} !important`,
    textAlign: 'center !important',
    display: 'block !important',
    width: '100% !important',
    'description-color': `${normalizeColor(style.descriptionColor || '#ffffff')} !important`,
    'description-fontSize': `${normalizeFontSize(style.descriptionFontSize || '14px')} !important`,
  };
};

/**
 * تحويل أنماط زر الإرسال إلى تنسيق متوافق مع المتجر
 */
export const formatSubmitButtonStyle = (style: FormFieldStyle = {}): Record<string, string> => {
  return {
    backgroundColor: `${normalizeColor(style.backgroundColor || '#9b87f5')} !important`,
    color: `${normalizeColor(style.color || '#ffffff')} !important`,
    fontSize: `${normalizeFontSize(style.fontSize || '18px')} !important`,
    fontWeight: `${style.fontWeight || '600'} !important`,
    borderRadius: `${style.borderRadius || '8px'} !important`,
    borderColor: `${normalizeColor(style.borderColor || 'transparent')} !important`,
    borderWidth: `${style.borderWidth || '0px'} !important`,
    paddingTop: `${style.paddingY || '14px'} !important`,
    paddingBottom: `${style.paddingY || '14px'} !important`,
    paddingLeft: `${style.paddingX || '24px'} !important`,
    paddingRight: `${style.paddingX || '24px'} !important`,
    width: style.fullWidth === false ? 'auto !important' : '100% !important',
    display: 'flex !important',
    alignItems: 'center !important',
    justifyContent: 'center !important',
    textAlign: 'center !important',
    animation: style.animation ? style.animationType || 'pulse' : 'none',
    'icon-position': style.iconPosition || 'left',
    'show-icon': style.showIcon ? 'true' : 'false',
    icon: style.icon || 'shopping-cart'
  };
};

/**
 * إضافة سمات البيانات المناسبة لضمان التقاط القيم بواسطة JavaScript المتجر
 */
export const getTitleFieldDataAttributes = (field: FormField): Record<string, string> => {
  const style = field.style || {};
  
  return {
    'data-field-type': field.type,
    'data-title-color': normalizeColor(style.color || '#ffffff'),
    'data-title-font-size': normalizeFontSize(style.fontSize || '24px'),
    'data-title-font-weight': style.fontWeight || 'bold',
    'data-description-color': normalizeColor(style.descriptionColor || '#ffffff'),
    'data-description-font-size': normalizeFontSize(style.descriptionFontSize || '14px'),
    'data-bg-color': normalizeColor(style.backgroundColor || '#9b87f5'),
    'data-title-align': 'center',
    'data-has-bg': 'true'
  };
};

/**
 * إضافة سمات البيانات المناسبة لزر الإرسال
 */
export const getSubmitButtonDataAttributes = (field: FormField): Record<string, string> => {
  const style = field.style || {};
  
  return {
    'data-field-type': field.type,
    'data-button-color': normalizeColor(style.color || '#ffffff'),
    'data-button-bg-color': normalizeColor(style.backgroundColor || '#9b87f5'),
    'data-button-font-size': normalizeFontSize(style.fontSize || '18px'),
    'data-button-font-weight': style.fontWeight || '600',
    'data-button-border-radius': style.borderRadius || '8px',
    'data-animation-type': style.animationType || 'none',
    'data-has-animation': style.animation ? 'true' : 'false',
    'data-icon-position': style.iconPosition || 'left',
    'data-has-icon': style.showIcon ? 'true' : 'false',
    'data-button-icon': style.icon || 'shopping-cart',
    'data-button-padding-y': style.paddingY || '14px',
    'data-button-padding-x': style.paddingX || '24px'
  };
};
