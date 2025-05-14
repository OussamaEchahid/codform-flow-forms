
#!/usr/bin/env node

/**
 * Shopify Theme Extension deployment script
 * This script deploys the theme extension files to the Shopify theme
 */

console.log('Starting Shopify theme extension deployment...');

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const extensionsDir = path.join(__dirname, 'extensions');
const themeExtension = 'theme-extension-codform';
const themeExtensionDir = path.join(extensionsDir, themeExtension);

// Check if theme extension directory exists
if (!fs.existsSync(themeExtensionDir)) {
  console.error(`Error: Theme extension directory '${themeExtension}' not found in ${extensionsDir}`);
  process.exit(1);
}

// Optimize and prepare JavaScript files
try {
  console.log('Optimizing JavaScript files...');
  execSync('node optimize-theme-js.js', { stdio: 'inherit' });
} catch (error) {
  console.error('Error optimizing JavaScript files:', error.message);
  process.exit(1);
}

// Deploy theme extension
try {
  console.log(`Deploying theme extension: ${themeExtension}`);
  
  // Use Shopify CLI to push the theme extension
  execSync(`cd ${themeExtensionDir} && shopify app deploy extension`, { stdio: 'inherit' });
  
  console.log('Theme extension deployed successfully!');
} catch (error) {
  console.error('Error deploying theme extension:', error.message);
  process.exit(1);
}

console.log('Deployment completed successfully!');
