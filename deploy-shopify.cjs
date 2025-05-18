
// Deploy script for Shopify app

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
  
  // Check if the app has the extensions section in shopify.app.toml
  const appConfigPath = path.join(rootDir, 'shopify.app.toml');
  if (fs.existsSync(appConfigPath)) {
    const appConfig = fs.readFileSync(appConfigPath, 'utf8');
    if (!appConfig.includes('[[extensions]]')) {
      console.warn('⚠️ Warning: Missing [[extensions]] section or using incorrect format in shopify.app.toml');
      console.warn('This might cause the "Expected array, received object" error');
    } else {
      console.log('✓ Found extensions configuration in correct array format');
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
    
    // Check for extension_points vs. extensions.targeting
    const uiExtConfig = fs.readFileSync(uiExtPath, 'utf8');
    if (!uiExtConfig.includes('[extension_points]') && uiExtConfig.includes('[[extensions.targeting]]')) {
      console.warn('⚠️ Warning: UI extension is using [[extensions.targeting]] which may be outdated');
      console.warn('Consider updating to [extension_points] format');
    }
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
    
    // Check if the app config file exists in the detected directory
    if (!fs.existsSync(path.join(rootDir, 'shopify.app.toml'))) {
      console.error(`Error: shopify.app.toml not found in ${rootDir}`);
      process.exit(1);
    }
    
    console.log(`Found Shopify app root at: ${rootDir}`);
    
    // Get command from remaining arguments
    if (args.length > 0) {
      command = args[0];
    }
    
    // Build the complete command with any additional arguments
    let shopifyCommand;
    const additionalArgs = args.slice(1).join(' ');
    
    // Validate extensions before deployment
    if (command === 'deploy' || command === 'deploy-extensions') {
      validateExtensions(rootDir);
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
        shopifyCommand = `shopify app deploy ${additionalArgs}`;
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

// Run the main function
main();
