
// Validate Shopify extensions structure
const fs = require('fs');
const path = require('path');

function validateExtensionsConfig() {
  console.log('Validating Shopify app and extensions configuration...');
  
  try {
    // Check app config
    const appConfigPath = path.resolve('./shopify.app.toml');
    if (!fs.existsSync(appConfigPath)) {
      console.error('❌ shopify.app.toml not found');
      return false;
    }
    
    const appConfig = fs.readFileSync(appConfigPath, 'utf8');
    
    // Check extensions format
    if (!appConfig.includes('[[extensions]]')) {
      console.warn('⚠️ Warning: extensions section may not be formatted correctly');
      console.warn('   Should use [[extensions]] array format instead of [extensions] object format');
      
      // Give detailed fix instructions
      console.log('\nTo fix extensions format in shopify.app.toml, use this format:');
      console.log(`
[[extensions]]
type = "theme_app_extension"
handle = "theme-extension-codform"

[[extensions]]
type = "ui_extension" 
handle = "admin-action-extension"
`);
      return false;
    }
    
    // Check theme extension
    const themeExtPath = path.resolve('./extensions/theme-extension-codform/shopify.extension.toml');
    if (!fs.existsSync(themeExtPath)) {
      console.warn('⚠️ Warning: theme-extension-codform configuration not found');
      return false;
    }
    
    // Check UI extension
    const uiExtPath = path.resolve('./extensions/admin-action-extension/shopify.extension.toml');
    if (!fs.existsSync(uiExtPath)) {
      console.warn('⚠️ Warning: admin-action-extension configuration not found');
      return false;
    }
    
    console.log('✅ Shopify app and extensions configuration looks valid');
    return true;
  } catch (error) {
    console.error('❌ Error validating extensions:', error.message);
    return false;
  }
}

// Run the validation
validateExtensionsConfig();

// Export for use in other scripts
module.exports = { validateExtensionsConfig };
