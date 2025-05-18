
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

// Ensure createTitleField function correctly applies styles
if (minifiedContent.includes('function createTitleField')) {
  console.log('Enhancing title field styling...');

  // Make sure the container element gets explicit styling
  minifiedContent = minifiedContent.replace(
    /(container\.style\.backgroundColor\s*=\s*[^;]+);/g,
    '$1 + " !important";'
  );

  // Make sure title element gets explicit styling including font size in pixels
  minifiedContent = minifiedContent.replace(
    /(title\.style\.color\s*=\s*[^;]+);/g,
    '$1 + " !important";'
  );
  
  minifiedContent = minifiedContent.replace(
    /(title\.style\.fontSize\s*=\s*[^;]+);/g,
    'title.style.fontSize = remToPxExact(field.style.fontSize || "24px") + " !important";'
  );
  
  // Add font weight with !important
  minifiedContent = minifiedContent.replace(
    /(title\.style\.fontWeight\s*=\s*[^;]+);/g,
    '$1 + " !important";'
  );
}

// Add the remToPxExact function if it doesn't exist
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
