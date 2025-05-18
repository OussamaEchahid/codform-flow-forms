
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Optimizing theme extension JavaScript...');

// Path to the JavaScript file
const jsFilePath = path.join(__dirname, 'extensions/theme-extension-codform/assets/codform.js');

if (!fs.existsSync(jsFilePath)) {
  console.error('Error: codform.js file not found');
  process.exit(1);
}

console.log('Reading original file...');
const originalContent = fs.readFileSync(jsFilePath, 'utf8');
const originalSize = Buffer.byteLength(originalContent, 'utf8');
console.log(`Original size: ${originalSize} bytes (${(originalSize / 1024).toFixed(2)} KB)`);

// Be more careful with optimizations to preserve style functionality
console.log('Applying optimizations...');

// Remove ONLY block comments, not line comments which might contain important code
let optimizedContent = originalContent.replace(/\/\*[\s\S]*?\*\//g, '');

// Preserve all console.logs related to style and important debugging
const preservedConsolePatterns = [
  'Error', 'Important', 'Critical', 'Warn', 'Debug', 
  'Style', 'Title', 'Field', 'Animation', 'Font', 'Color',
  'Background', 'Alignment', 'Direction', 'RTL', 'LTR'
];
const consolePattern = new RegExp(
  `console\\.log\\(['"]((?!${preservedConsolePatterns.join('|')}).*?)['"](.*?)\\);?`, 'g'
);
optimizedContent = optimizedContent.replace(consolePattern, '');

// CRITICAL: DO NOT COMPRESS CSS property values and !important declarations
// NO whitespace changes for any style-related code
const styleKeywords = [
  'style', 'color', 'backgroundColor', 'fontSize', 'fontFamily', 'fontWeight', 
  'textAlign', 'borderRadius', 'margin', 'padding', 'lineHeight', 
  'opacity', 'boxSizing', 'display', 'width', 'height', 'direction',
  '!important', 'px', 'rem', 'em', '%', 'vh', 'vw'
];

// Create a safe pattern that will not affect style properties
let safePattern = new RegExp(`(^|[^a-zA-Z])(${styleKeywords.join('|')})(:|\\s*=|\\(|\\)|\\{|\\}|;)`, 'g');
let markedContent = optimizedContent.replace(safePattern, '$1###$2###$3');

// Now compress whitespace carefully - only in non-style areas
let minifiedContent = markedContent
  .replace(/([^#])\s{2,}([^#])/g, '$1 $2') // Multiple spaces to single space ONLY where not marked
  .replace(/([^#])\s*{\s*([^#])/g, '$1 { $2') // Space around braces
  .replace(/([^#])\s*}\s*([^#])/g, '$1 } $2')
  .replace(/([^#])\s*:\s*([^#])/g, '$1: $2')
  .replace(/([^#])\s*;\s*([^#])/g, '$1; $2')
  .replace(/([^#])\s*,\s*([^#])/g, '$1, $2');

// Restore the markers
minifiedContent = minifiedContent.replace(/###([^#]+)###/g, '$1');

// CRITICAL: Ensure all !important stays properly attached
minifiedContent = minifiedContent.replace(/;\s*!/g, ' !');
minifiedContent = minifiedContent.replace(/\s+!important/g, ' !important');

// CRITICAL: Ensure title styling has !important tags
// These regex patterns target the title field styling functions
minifiedContent = minifiedContent.replace(
  /(color|backgroundColor|fontSize|fontWeight|textAlign|fontFamily|lineHeight|opacity|margin|padding):\s*([^;!]+)(?!important)(;|\s|\})/g, 
  '$1: $2 !important$3'
);

// Add specific code for title field styling to ensure it's displayed correctly
minifiedContent = `
// Critical: Function to ensure title fields display properly
function ensureTitleFieldsDisplay() {
  const titleFields = document.querySelectorAll('.codform-title-field');
  if (!titleFields || titleFields.length === 0) return;
  
  titleFields.forEach(field => {
    const container = field.querySelector('.codform-title-container');
    if (!container) return;
    
    // Force background color with !important
    const bgColor = field.getAttribute('data-bg-color') || '#9b87f5';
    container.style.backgroundColor = bgColor + ' !important';
    container.style.padding = '16px !important';
    container.style.borderRadius = '8px !important';
    container.style.width = '100% !important';
    container.style.boxSizing = 'border-box !important';
    container.style.marginBottom = '16px !important';
    
    // Set text alignment based on data attribute
    const alignment = field.getAttribute('data-title-align') || 'left';
    container.style.textAlign = alignment + ' !important';
    
    // Set direction based on data attribute
    const direction = field.getAttribute('data-direction') || 'ltr';
    container.style.direction = direction + ' !important';
    
    // Style the title element
    const title = container.querySelector('h3');
    if (title) {
      const color = field.getAttribute('data-title-color') || '#ffffff';
      const fontSize = field.getAttribute('data-font-size') || '24px';
      const fontWeight = field.getAttribute('data-font-weight') || 'bold';
      
      title.style.color = color + ' !important';
      title.style.fontSize = fontSize + ' !important';
      title.style.fontWeight = fontWeight + ' !important';
      title.style.textAlign = alignment + ' !important';
      title.style.margin = '0 !important';
      title.style.padding = '0 !important';
      title.style.lineHeight = '1.3 !important';
      title.style.display = 'block !important';
      title.style.direction = direction + ' !important';
    }
    
    // Style the description element
    const desc = container.querySelector('.codform-title-description');
    if (desc) {
      const descColor = field.getAttribute('data-desc-color') || '#ffffff';
      const descFontSize = field.getAttribute('data-desc-font-size') || '14px';
      
      desc.style.color = descColor + ' !important';
      desc.style.fontSize = descFontSize + ' !important';
      desc.style.opacity = '0.9 !important';
      desc.style.margin = '6px 0 0 0 !important';
      desc.style.padding = '0 !important';
      desc.style.textAlign = alignment + ' !important';
      desc.style.lineHeight = '1.5 !important';
      desc.style.direction = direction + ' !important';
    }
  });
}

// Run after DOM is loaded and periodically to ensure styles are applied
document.addEventListener('DOMContentLoaded', () => {
  ensureTitleFieldsDisplay();
  // Re-run every 300ms for the first 3 seconds to ensure styles are applied
  const interval = setInterval(ensureTitleFieldsDisplay, 300);
  setTimeout(() => clearInterval(interval), 3000);
});

` + minifiedContent;

// Ensure the remToPxExact function is included
if (!minifiedContent.includes('function remToPxExact')) {
  minifiedContent = `
function remToPxExact(value) {
  if (!value) return '16px';
  if (value.includes('rem')) {
    const remValue = parseFloat(value);
    return Math.round(remValue * 16) + 'px';
  }
  if (!value.includes('px') && !isNaN(parseFloat(value))) {
    return value + 'px';
  }
  return value;
}
` + minifiedContent;
}

const optimizedSize = Buffer.byteLength(minifiedContent, 'utf8');
console.log(`Optimized size: ${optimizedSize} bytes (${(optimizedSize / 1024).toFixed(2)} KB)`);

// Calculate reduction
const reduction = originalSize - optimizedSize;
const reductionPercent = (reduction / originalSize * 100).toFixed(2);
console.log(`Size reduction: ${reduction} bytes (${reductionPercent}%)`);

// Create backup of original file
const backupPath = jsFilePath + '.backup';
fs.writeFileSync(backupPath, originalContent);
console.log(`Original file backed up to ${backupPath}`);

// Write optimized file
fs.writeFileSync(jsFilePath, minifiedContent);
console.log(`Optimized file written to ${jsFilePath}`);

console.log('Optimization complete!');

// Check if still exceeds Shopify's limit
if (optimizedSize > 10000) {
  console.warn('\x1b[33m%s\x1b[0m', 'WARNING: Even after optimization, file still exceeds Shopify\'s 10KB limit');
  console.log('Consider splitting functionality or further reducing code size.');
} else {
  console.log('\x1b[32m%s\x1b[0m', 'File size is now within Shopify\'s limits. Good to go!');
}
