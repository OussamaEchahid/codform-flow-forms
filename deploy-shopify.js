#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Find the root directory where shopify.app.toml exists
function findRootDirectory() {
  let currentDir = process.cwd();
  
  // Check if shopify.app.toml exists in current directory
  if (fs.existsSync(path.join(currentDir, 'shopify.app.toml'))) {
    return currentDir;
  }
  
  // Check if it exists in parent directory (for cases where script is run from a subdirectory)
  const parentDir = path.resolve(currentDir, '..');
  if (fs.existsSync(path.join(parentDir, 'shopify.app.toml'))) {
    return parentDir;
  }
  
  // Look for the file in subdirectories (one level deep)
  try {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subdirPath = path.join(currentDir, entry.name);
        if (fs.existsSync(path.join(subdirPath, 'shopify.app.toml'))) {
          return subdirPath;
        }
      }
    }
  } catch (err) {
    console.error('Error searching subdirectories:', err.message);
  }
  
  console.log('Could not find shopify.app.toml in the current directory or immediate subdirectories.');
  console.log('Please run this script from the root directory of your Shopify app project.');
  process.exit(1);
}

// Validate extension files
function validateExtensions(rootDir) {
  console.log('Validating extensions structure...');
  
  // Try to run the validation script if it exists
  const validationScript = path.join(rootDir, 'validate-shopify-extensions.js');
  if (fs.existsSync(validationScript)) {
    try {
      console.log('Running validation script...');
      execSync(`node ${validationScript}`, { stdio: 'inherit' });
    } catch (err) {
      console.error('Validation script found issues:', err.message);
      console.log('Please fix the configuration issues before deploying.');
      process.exit(1);
    }
    return;
  }
  
  // Basic validation if the script doesn't exist
  console.log('No validation script found. Performing basic validation...');
  
  // Check if the app has the extensions section in shopify.app.toml
  const appConfigPath = path.join(rootDir, 'shopify.app.toml');
  if (fs.existsSync(appConfigPath)) {
    const appConfig = fs.readFileSync(appConfigPath, 'utf8');
    if (!appConfig.includes('[[extensions]]')) {
      console.warn('⚠️ Warning: Missing [[extensions]] section in shopify.app.toml');
      console.warn('This might cause the "Expected array, received object" error');
    }
  }
  
  // Validate theme extension
  const themeExtPath = path.join(rootDir, 'extensions', 'theme-extension-codform', 'shopify.extension.toml');
  if (fs.existsSync(themeExtPath)) {
    console.log('✓ Found theme extension: theme-extension-codform');
  }
  
  // Validate UI extension
  const uiExtPath = path.join(rootDir, 'extensions', 'admin-action-extension', 'shopify.extension.toml');
  if (fs.existsSync(uiExtPath)) {
    console.log('✓ Found UI extension: admin-action-extension');
  }
  
  console.log('Extension validation complete');
}

// Main function
function main() {
  try {
    // First check if path was provided as an argument
    const args = process.argv.slice(2);
    let rootDir;
    let command = 'deploy';
    let skipOptimize = false;
    let forceOptimize = false;
    
    // Check for --path argument
    const pathArgIndex = args.findIndex(arg => arg === '--path' || arg === '-p');
    if (pathArgIndex !== -1 && args.length > pathArgIndex + 1) {
      rootDir = path.resolve(args[pathArgIndex + 1]);
      // Remove path arguments from args
      args.splice(pathArgIndex, 2);
    } else {
      // Auto-detect path
      rootDir = findRootDirectory();
    }
    
    // Check for --skip-optimize argument
    const skipOptimizeIndex = args.findIndex(arg => arg === '--skip-optimize');
    if (skipOptimizeIndex !== -1) {
      skipOptimize = true;
      args.splice(skipOptimizeIndex, 1);
    }
    
    // Check for --force-optimize argument
    const forceOptimizeIndex = args.findIndex(arg => arg === '--force-optimize');
    if (forceOptimizeIndex !== -1) {
      forceOptimize = true;
      args.splice(forceOptimizeIndex, 1);
    }
    
    // Check if the app config file exists in the detected directory
    if (!fs.existsSync(path.join(rootDir, 'shopify.app.toml'))) {
      console.error(`Error: shopify.app.toml not found in ${rootDir}`);
      process.exit(1);
    }
    
    console.log(`Found Shopify app root at: ${rootDir}`);
    
    // Get command from arguments or use default
    if (args.length > 0) {
      command = args[0];
    }
    
    // Build the complete command with any additional arguments
    let shopifyCommand;
    const additionalArgs = args.slice(1).join(' ');
    
    // Validate extensions before deployment
    if (command === 'deploy' || command === 'deploy-extensions') {
      validateExtensions(rootDir);
      
      // Optimize JS files if needed and not skipped
      if (!skipOptimize) {
        optimizeThemeJs(rootDir, forceOptimize);
      }
    }
    
    // Execute the appropriate Shopify command
    switch(command) {
      case 'build':
        console.log('Building Shopify app...');
        shopifyCommand = `shopify app build ${additionalArgs}`;
        break;
        
      case 'deploy':
        console.log('Deploying Shopify app...');
        shopifyCommand = `shopify app deploy ${additionalArgs}`;
        break;
      
      case 'deploy-extensions':
        console.log('Deploying Shopify extensions...');
        shopifyCommand = `shopify app deploy --only-extensions ${additionalArgs}`;
        break;
        
      case 'dev':
        console.log('Starting Shopify app in development mode...');
        shopifyCommand = `shopify app dev ${additionalArgs}`;
        break;
        
      case 'info':
        console.log('Getting app information...');
        shopifyCommand = `shopify app info ${additionalArgs}`;
        break;
      
      case 'env':
        console.log('Showing environment information...');
        shopifyCommand = `shopify app env ${additionalArgs}`;
        break;
      
      case 'validate':
        console.log('Validating extension structure without deployment...');
        validateExtensions(rootDir);
        console.log('Validation complete - fix any warnings before deploying');
        return;
        
      case 'optimize':
        console.log('Optimizing theme JS files...');
        optimizeThemeJs(rootDir, true);
        return;
        
      default:
        // Pass through any other commands directly to Shopify CLI
        console.log(`Executing command: shopify app ${command} ${additionalArgs}`);
        shopifyCommand = `shopify app ${command} ${additionalArgs}`;
    }
    
    // Execute the command
    console.log(`Executing in directory: ${rootDir}`);
    console.log(`Running: ${shopifyCommand}`);
    execSync(shopifyCommand, { 
      cwd: rootDir, 
      stdio: 'inherit'
    });
    
    console.log('Command executed successfully!');
  } catch (error) {
    console.error('Error executing command:', error.message);
    process.exit(1);
  }
}

// Optimize JS if needed
function optimizeThemeJs(rootDir, force = false) {
  const jsFilePath = path.join(rootDir, 'extensions', 'theme-extension-codform', 'assets', 'codform.js');
  
  if (!fs.existsSync(jsFilePath)) {
    console.log('No codform.js file found to optimize');
    return;
  }
  
  const stats = fs.statSync(jsFilePath);
  const fileSizeInBytes = stats.size;
  
  if (fileSizeInBytes > 10000 || force) {
    console.log(`codform.js size is ${fileSizeInBytes} bytes, running optimization...`);
    try {
      // Run the optimization script
      require('./optimize-theme-js');
    } catch (error) {
      console.error('Error running optimization script:', error.message);
    }
  } else {
    console.log(`codform.js size is ${fileSizeInBytes} bytes (within limits), skipping optimization`);
  }
}

// Run the main function
main();
