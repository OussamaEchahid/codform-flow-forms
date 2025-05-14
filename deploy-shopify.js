
#!/usr/bin/env node

/**
 * Shopify Theme Extension deployment script
 * This script deploys the theme extension files to the Shopify theme
 * with improved error handling and cache busting
 */

console.log('Starting Shopify theme extension deployment...');

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const extensionsDir = path.join(__dirname, 'extensions');
const themeExtension = 'theme-extension-codform';
const themeExtensionDir = path.join(extensionsDir, themeExtension);

// Parse command line arguments for cache busting
const args = process.argv.slice(2);
let cacheBustParam = '';
args.forEach(arg => {
  if (arg.startsWith('--cache-bust=')) {
    cacheBustParam = arg.split('=')[1];
  }
});

// Check if theme extension directory exists
if (!fs.existsSync(themeExtensionDir)) {
  console.error(`Error: Theme extension directory '${themeExtension}' not found in ${extensionsDir}`);
  process.exit(1);
}

// Add cache busting to JavaScript files if needed
if (cacheBustParam) {
  console.log(`Adding cache busting parameter: ${cacheBustParam}`);
  try {
    const assetsDir = path.join(themeExtensionDir, 'assets');
    const files = fs.readdirSync(assetsDir);
    
    files.forEach(file => {
      if (file.endsWith('.js')) {
        const filePath = path.join(assetsDir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Add cache busting comment to help invalidate browser cache
        const cacheBustComment = `/* Cache bust: ${cacheBustParam} */\n`;
        content = cacheBustComment + content;
        
        fs.writeFileSync(filePath, content);
        console.log(`Added cache busting to ${file}`);
      }
    });
  } catch (error) {
    console.warn('Warning: Could not add cache busting parameters:', error.message);
  }
}

// Optimize and prepare JavaScript files
try {
  console.log('Optimizing JavaScript files...');
  execSync('node optimize-theme-js.js', { stdio: 'inherit' });
} catch (error) {
  console.error('Error optimizing JavaScript files:', error.message);
  process.exit(1);
}

// Verify extension configuration before deployment
try {
  console.log('Verifying extension configuration...');
  const tomlPath = path.join(themeExtensionDir, 'shopify.extension.toml');
  const tomlContent = fs.readFileSync(tomlPath, 'utf8');
  
  if (!tomlContent.includes('codform-core = "assets/codform-core.js"')) {
    console.warn('Warning: codform-core.js is not properly registered in shopify.extension.toml');
  }

  if (!tomlContent.includes('codform-styles = "assets/codform-styles.css"')) {
    console.warn('Warning: codform-styles.css is not properly registered in shopify.extension.toml');
  }
} catch (error) {
  console.warn('Warning: Could not verify extension configuration:', error.message);
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

// Clear Shopify theme cache
try {
  console.log('Attempting to clear Shopify theme cache...');
  execSync(`cd ${themeExtensionDir} && shopify theme dev --reset`, { stdio: 'inherit' });
} catch (error) {
  console.warn('Warning: Could not clear Shopify theme cache:', error.message);
  console.log('You may need to manually clear your store theme cache.');
}

console.log('Deployment completed successfully!');
