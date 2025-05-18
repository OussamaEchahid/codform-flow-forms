
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

// Add enhanced function for title field styling to ensure it's displayed correctly
minifiedContent = `
// Critical: Function to ensure title fields display properly
function ensureTitleFieldsDisplay() {
  console.log('Ensuring title fields display properly');
  const titleFields = document.querySelectorAll('.codform-title-field');
  if (!titleFields || titleFields.length === 0) {
    console.log('No title fields found');
    return;
  }
  
  console.log('Found', titleFields.length, 'title fields to style');
  
  titleFields.forEach(field => {
    try {
      const container = field.querySelector('.codform-title-container');
      if (!container) {
        console.log('No container found in field', field.id);
        return;
      }
      
      // Get data attributes
      const bgColor = field.getAttribute('data-bg-color') || '#9b87f5';
      const titleColor = field.getAttribute('data-title-color') || '#ffffff';
      const alignment = field.getAttribute('data-title-align') || 'left';
      const direction = field.getAttribute('data-direction') || 'ltr';
      const fontSize = field.getAttribute('data-font-size') || '24px';
      const fontWeight = field.getAttribute('data-font-weight') || 'bold';
      const descFontSize = field.getAttribute('data-desc-font-size') || '14px';
      const descColor = field.getAttribute('data-desc-color') || 'rgba(255, 255, 255, 0.9)';
      const showTitle = field.getAttribute('data-show-title') === 'true';
      const showDesc = field.getAttribute('data-show-description') === 'true';
      
      // Log for debugging
      console.log('Title field styling:', {
        id: field.id,
        bgColor,
        titleColor,
        alignment,
        direction,
        fontSize,
        showTitle,
        showDesc
      });
      
      // Force background color with !important
      container.style.setProperty('background-color', bgColor, 'important');
      container.style.setProperty('padding', '16px', 'important');
      container.style.setProperty('border-radius', '8px', 'important');
      container.style.setProperty('width', '100%', 'important');
      container.style.setProperty('box-sizing', 'border-box', 'important');
      container.style.setProperty('margin-bottom', '16px', 'important');
      container.style.setProperty('text-align', alignment, 'important');
      container.style.setProperty('direction', direction, 'important');
      
      // Style the title element
      const title = container.querySelector('h3');
      if (title) {
        title.style.setProperty('color', titleColor, 'important');
        title.style.setProperty('font-size', fontSize, 'important');
        title.style.setProperty('font-weight', fontWeight, 'important');
        title.style.setProperty('text-align', alignment, 'important');
        title.style.setProperty('margin', '0', 'important');
        title.style.setProperty('padding', '0', 'important');
        title.style.setProperty('line-height', '1.3', 'important');
        title.style.setProperty('display', showTitle ? 'block' : 'none', 'important');
        title.style.setProperty('direction', direction, 'important');
      }
      
      // Style the description element
      const desc = container.querySelector('.codform-title-description');
      if (desc) {
        desc.style.setProperty('color', descColor, 'important');
        desc.style.setProperty('font-size', descFontSize, 'important');
        desc.style.setProperty('opacity', '0.9', 'important');
        desc.style.setProperty('margin', '6px 0 0 0', 'important');
        desc.style.setProperty('padding', '0', 'important');
        desc.style.setProperty('text-align', alignment, 'important');
        desc.style.setProperty('line-height', '1.5', 'important');
        desc.style.setProperty('direction', direction, 'important');
        desc.style.setProperty('display', showDesc ? 'block' : 'none', 'important');
      }
    } catch (error) {
      console.error('Error styling title field:', error);
    }
  });
}

// Use MutationObserver to ensure styles are applied even when DOM changes
function setupTitleFieldObserver() {
  console.log('Setting up title field observer');
  
  const observer = new MutationObserver((mutations) => {
    let needsUpdate = false;
    
    mutations.forEach(mutation => {
      if (
        mutation.type === 'childList' || 
        mutation.type === 'attributes' ||
        (mutation.target && 
         (mutation.target.classList && mutation.target.classList.contains('codform-title-field') ||
          mutation.target.closest && mutation.target.closest('.codform-title-field'))
        )
      ) {
        needsUpdate = true;
      }
    });
    
    if (needsUpdate) {
      console.log('DOM changed, updating title fields');
      ensureTitleFieldsDisplay();
    }
  });
  
  // Start observing the document for DOM changes
  observer.observe(document.body, { 
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class', 'data-bg-color', 'data-title-align', 'data-direction'] 
  });
  
  // Initial run
  ensureTitleFieldsDisplay();
}

// Helper function to convert rem to pixels
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

// Run after DOM is loaded and setup observer
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing title field styling');
  ensureTitleFieldsDisplay();
  setupTitleFieldObserver();
  
  // Also re-run periodically for the first few seconds as a fallback
  const interval = setInterval(() => {
    console.log('Periodic title fields update');
    ensureTitleFieldsDisplay();
  }, 500);
  
  setTimeout(() => {
    console.log('Clearing periodic update interval');
    clearInterval(interval);
  }, 5000);
});

` + minifiedContent;

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
