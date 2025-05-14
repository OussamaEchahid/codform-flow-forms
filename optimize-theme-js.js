
#!/usr/bin/env node

/**
 * JavaScript optimization script for Shopify theme extensions
 * This script minifies and optimizes JavaScript files for use in Shopify themes
 */

console.log('Optimizing JavaScript files for Shopify theme...');

const fs = require('fs');
const path = require('path');

// Configuration
const themeExtensionDir = path.join(__dirname, 'extensions', 'theme-extension-codform');
const assetsDir = path.join(themeExtensionDir, 'assets');
const jsInputFile = path.join(assetsDir, 'codform-core.js');
const jsOutputFile = path.join(assetsDir, 'codform.js');

// Check if directories exist
if (!fs.existsSync(themeExtensionDir)) {
  console.error(`Error: Theme extension directory not found at ${themeExtensionDir}`);
  process.exit(1);
}

if (!fs.existsSync(assetsDir)) {
  console.log(`Creating assets directory at ${assetsDir}`);
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Simple optimization (for now just copies the file)
// In the future this can be expanded to properly minify and bundle the JS
try {
  // Read the input file
  if (fs.existsSync(jsInputFile)) {
    const jsContent = fs.readFileSync(jsInputFile, 'utf8');
    
    // Write to the output file
    fs.writeFileSync(jsOutputFile, jsContent);
    console.log(`Optimized JavaScript written to ${jsOutputFile}`);
  } else {
    console.error(`Error: Input JavaScript file not found at ${jsInputFile}`);
    process.exit(1);
  }
  
  // Copy CSS file
  const cssInputFile = path.join(assetsDir, 'codform-styles.css');
  const cssOutputFile = path.join(assetsDir, 'codform.css');
  
  if (fs.existsSync(cssInputFile)) {
    const cssContent = fs.readFileSync(cssInputFile, 'utf8');
    fs.writeFileSync(cssOutputFile, cssContent);
    console.log(`CSS file copied to ${cssOutputFile}`);
  } else {
    console.error(`Error: Input CSS file not found at ${cssInputFile}`);
  }
  
  console.log('JavaScript optimization completed successfully!');
} catch (error) {
  console.error('Error during JavaScript optimization:', error.message);
  process.exit(1);
}
