
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Validating Shopify extensions before deployment...');

// Helper function to check file size
function getFileSizeInBytes(filePath) {
  const stats = fs.statSync(filePath);
  return stats.size;
}

// Check theme extension JS file size
const themeExtensionPath = path.join(__dirname, 'extensions/theme-extension-codform');
const jsFilePath = path.join(themeExtensionPath, 'assets/codform.js');

if (fs.existsSync(jsFilePath)) {
  const fileSizeInBytes = getFileSizeInBytes(jsFilePath);
  const fileSizeInKB = fileSizeInBytes / 1024;
  
  console.log(`JS file size: ${fileSizeInBytes} bytes (${fileSizeInKB.toFixed(2)} KB)`);
  
  // Check if file exceeds Shopify's limit (10KB)
  if (fileSizeInBytes > 10000) {
    console.warn('\x1b[33m%s\x1b[0m', 'WARNING: codform.js exceeds Shopify\'s 10KB limit!');
    console.log('Consider splitting functionality or reducing code size.');
    
    // Analyze file to find potential optimizations
    console.log('\nSuggestions for optimization:');
    console.log('1. Remove console.log statements in production build');
    console.log('2. Minify the JavaScript code');
    console.log('3. Split functionality into multiple files if possible');
    console.log('4. Remove unused functions and variables');
  } else {
    console.log('\x1b[32m%s\x1b[0m', 'JS file size is within Shopify\'s limits. Good to go!');
  }
}

// Validate TOML files
console.log('\nValidating TOML files format...');
const extensionsDir = path.join(__dirname, 'extensions');
const extensionDirs = fs.readdirSync(extensionsDir).filter(file => 
  fs.statSync(path.join(extensionsDir, file)).isDirectory()
);

for (const extDir of extensionDirs) {
  const tomlPath = path.join(extensionsDir, extDir, 'shopify.extension.toml');
  
  if (fs.existsSync(tomlPath)) {
    console.log(`Checking ${extDir}/shopify.extension.toml`);
    
    try {
      // Simple validation - try to parse with eval (not ideal but works for basic checks)
      // In a real app, you would use a proper TOML parser
      const tomlContent = fs.readFileSync(tomlPath, 'utf8');
      
      // Check for common issues
      if (tomlContent.includes('"key":') || tomlContent.includes('"type":') || 
          tomlContent.includes('"label":') || tomlContent.includes('"value":')) {
        console.warn('\x1b[33m%s\x1b[0m', '  ⚠️ Warning: Found JSON-style quotes in TOML file');
        console.log('  TOML uses key = value format, not "key": value');
      } else {
        console.log('\x1b[32m%s\x1b[0m', '  ✓ TOML format looks good');
      }
    } catch (error) {
      console.error('\x1b[31m%s\x1b[0m', `  ✗ Error validating ${tomlPath}:`, error.message);
    }
  }
}

// Check for package.json files
console.log('\nChecking for package.json files...');
for (const extDir of extensionDirs) {
  const pkgPath = path.join(extensionsDir, extDir, 'package.json');
  
  if (!fs.existsSync(pkgPath)) {
    console.warn('\x1b[33m%s\x1b[0m', `Warning: ${extDir} is missing package.json file`);
  } else {
    console.log(`✓ ${extDir} has package.json file`);
  }
}

console.log('\nValidation complete! Fix any warnings before deploying.');
