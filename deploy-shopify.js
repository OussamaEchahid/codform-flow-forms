
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
  
  console.log('Could not find shopify.app.toml in the current directory.');
  console.log('Please run this script from the root directory of your Shopify app project.');
  process.exit(1);
}

// Main function
function main() {
  try {
    const rootDir = findRootDirectory();
    console.log(`Found Shopify app root at: ${rootDir}`);
    
    // Get command line arguments to determine what to run
    const args = process.argv.slice(2);
    const command = args[0] || 'deploy';
    
    // Execute the appropriate Shopify command
    switch(command) {
      case 'build':
        console.log('Building Shopify app...');
        execSync('shopify app build', { 
          cwd: rootDir, 
          stdio: 'inherit' 
        });
        break;
        
      case 'deploy':
        console.log('Deploying Shopify app...');
        execSync('shopify app deploy', { 
          cwd: rootDir, 
          stdio: 'inherit' 
        });
        break;
        
      case 'dev':
        console.log('Starting Shopify app in development mode...');
        execSync('shopify app dev', { 
          cwd: rootDir, 
          stdio: 'inherit' 
        });
        break;
        
      default:
        console.log(`Unknown command: ${command}`);
        console.log('Available commands: build, deploy, dev');
        process.exit(1);
    }
    
    console.log('Command executed successfully!');
  } catch (error) {
    console.error('Error executing command:', error.message);
    process.exit(1);
  }
}

// Run the main function
main();
