
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

// Simple optimizations (in a real app, you would use a proper minifier like Terser)
console.log('Applying optimizations...');

// Remove comments
let optimizedContent = originalContent.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');

// Remove console.logs
optimizedContent = optimizedContent.replace(/console\.log\([^)]*\);?/g, '');

// Remove extra whitespace
optimizedContent = optimizedContent.replace(/\s+/g, ' ');

// Basic minification
optimizedContent = optimizedContent
  .replace(/\s*{\s*/g, '{')
  .replace(/\s*}\s*/g, '}')
  .replace(/\s*:\s*/g, ':')
  .replace(/\s*;\s*/g, ';')
  .replace(/\s*,\s*/g, ',');

const optimizedSize = Buffer.byteLength(optimizedContent, 'utf8');
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
fs.writeFileSync(jsFilePath, optimizedContent);
console.log(`Optimized file written to ${jsFilePath}`);

console.log('Optimization complete!');

// Check if still exceeds Shopify's limit
if (optimizedSize > 10000) {
  console.warn('\x1b[33m%s\x1b[0m', 'WARNING: Even after optimization, file still exceeds Shopify\'s 10KB limit');
  console.log('Consider splitting functionality or further reducing code size.');
} else {
  console.log('\x1b[32m%s\x1b[0m', 'File size is now within Shopify\'s limits. Good to go!');
}
