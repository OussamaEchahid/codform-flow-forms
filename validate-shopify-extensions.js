
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const TOML = require('toml');

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m"
};

console.log(`${colors.cyan}Validating Shopify extensions configuration...${colors.reset}`);

// Validate main shopify.app.toml file
try {
  const appConfigPath = path.join(process.cwd(), 'shopify.app.toml');
  
  if (!fs.existsSync(appConfigPath)) {
    console.error(`${colors.red}Error: shopify.app.toml file not found${colors.reset}`);
    process.exit(1);
  }
  
  const appConfigContent = fs.readFileSync(appConfigPath, 'utf8');
  
  console.log(`${colors.blue}Parsing shopify.app.toml...${colors.reset}`);
  
  // First check if extensions section is properly formatted as an array
  if (appConfigContent.includes('extensions = {')) {
    console.error(`${colors.red}Error: extensions is defined as an object, but should be an array of objects${colors.reset}`);
    console.log(`${colors.yellow}Fix: Replace 'extensions = {' with '[[extensions]]' for each extension${colors.reset}`);
    process.exit(1);
  }

  // Attempt to parse the TOML file
  let appConfig;
  try {
    appConfig = TOML.parse(appConfigContent);
    console.log(`${colors.green}✓ shopify.app.toml is valid TOML${colors.reset}`);
  } catch (e) {
    console.error(`${colors.red}Error parsing shopify.app.toml: ${e.message}${colors.reset}`);
    process.exit(1);
  }

  // Check extensions section
  if (!appConfig.extensions || !Array.isArray(appConfig.extensions)) {
    console.error(`${colors.red}Error: 'extensions' section missing or not an array${colors.reset}`);
    console.log(`${colors.yellow}Fix: Ensure extensions are defined using [[extensions]] syntax${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`${colors.green}✓ Extensions section is correctly defined as an array with ${appConfig.extensions.length} extensions${colors.reset}`);
  }

  // Validate each extension
  appConfig.extensions.forEach((ext, index) => {
    if (!ext.type) {
      console.error(`${colors.red}Error: Missing 'type' for extension at index ${index}${colors.reset}`);
    }
    if (!ext.handle) {
      console.error(`${colors.red}Error: Missing 'handle' for extension at index ${index}${colors.reset}`);
    }
  });

  // Validate individual extension TOML files
  if (appConfig.extensions && Array.isArray(appConfig.extensions)) {
    for (const ext of appConfig.extensions) {
      const extPath = path.join(process.cwd(), 'extensions', ext.handle, 'shopify.extension.toml');
      
      if (!fs.existsSync(extPath)) {
        console.warn(`${colors.yellow}Warning: Extension TOML file not found: ${extPath}${colors.reset}`);
        continue;
      }
      
      try {
        const extContent = fs.readFileSync(extPath, 'utf8');
        const extConfig = TOML.parse(extContent);
        console.log(`${colors.green}✓ Extension config valid for ${ext.handle}${colors.reset}`);
      } catch (e) {
        console.error(`${colors.red}Error parsing extension TOML for ${ext.handle}: ${e.message}${colors.reset}`);
      }
    }
  }

  console.log(`${colors.green}Validation complete!${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Unexpected error during validation: ${error.message}${colors.reset}`);
  process.exit(1);
}
