
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
  'Style', 'Title', 'Field', 'Animation'
];
const consolePattern = new RegExp(
  `console\\.log\\(['"]((?!${preservedConsolePatterns.join('|')}).*?)['"](.*?)\\);?`, 'g'
);
optimizedContent = optimizedContent.replace(consolePattern, '');

// Extremely careful with whitespace - preserve ALL functional whitespace
// Only compress very obvious extra spaces
let minifiedContent = optimizedContent
  .replace(/\s{2,}/g, ' ') // Multiple spaces to single space
  .replace(/\s*{\s*/g, ' { ') // Space around braces
  .replace(/\s*}\s*/g, ' } ')
  .replace(/\s*:\s*/g, ': ')
  .replace(/\s*;\s*/g, '; ')
  .replace(/\s*,\s*/g, ', ');

// Restore any essential styling CSS properties that might have been mangled
const styleProperties = [
  'color', 'backgroundColor', 'fontSize', 'fontFamily', 'fontWeight', 
  'textAlign', 'borderRadius', 'margin', 'padding', 'lineHeight',
  'opacity', 'boxSizing', 'display', 'width', 'height'
];

// Ensure style properties have proper spacing
styleProperties.forEach(prop => {
  const regex = new RegExp(`([a-z0-9])${prop}:`, 'g');
  minifiedContent = minifiedContent.replace(regex, `$1; ${prop}:`);
});

// Make sure that !important stays attached to the property value
minifiedContent = minifiedContent.replace(/;\s*!/g, ' !');

// Preserve all important style properties with !important
minifiedContent = minifiedContent.replace(/(backgroundColor|color|fontSize|fontWeight|textAlign):(.*?);/g, '$1:$2 !important;');

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
