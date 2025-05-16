
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const toml = require('toml');

function validateShopifyAppConfig() {
  console.log('Validating shopify.app.toml configuration...');
  
  try {
    // قراءة ملف التكوين الرئيسي
    const configPath = path.resolve('./shopify.app.toml');
    if (!fs.existsSync(configPath)) {
      console.error('❌ Error: shopify.app.toml not found!');
      return false;
    }
    
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    // محاولة تحليل الملف للتأكد من صحة التنسيق
    try {
      const parsed = toml.parse(configContent);
      console.log('✅ shopify.app.toml is valid TOML syntax');
      
      // التحقق من قسم الامتدادات
      if (parsed.extensions) {
        if (!Array.isArray(parsed.extensions)) {
          console.error('❌ Error: "extensions" section must be an array!');
          console.log('Current value:', parsed.extensions);
          console.log('Make sure to use [[extensions]] format (double brackets) for each extension');
          return false;
        } else {
          console.log(`✅ Extensions section contains ${parsed.extensions.length} valid extensions`);
        }
      } else {
        console.log('⚠️ Warning: No extensions section found in shopify.app.toml');
      }
      
      return true;
    } catch (parseError) {
      console.error('❌ Error parsing shopify.app.toml:', parseError.message);
      
      // مساعدة إضافية للمستخدم في تحديد موقع الخطأ
      if (parseError.line && parseError.column) {
        console.log(`Error location: Line ${parseError.line}, Column ${parseError.column}`);
        
        // عرض السطر الذي يحتوي على الخطأ
        const lines = configContent.split('\n');
        if (lines[parseError.line - 1]) {
          console.log('Problematic line:');
          console.log(`${parseError.line}: ${lines[parseError.line - 1]}`);
          console.log(' '.repeat(parseError.line.toString().length + parseError.column + 1) + '^');
        }
      }
      
      return false;
    }
  } catch (error) {
    console.error('❌ Error reading shopify.app.toml:', error.message);
    return false;
  }
}

function validateExtensionConfigs() {
  console.log('\nValidating extension configuration files...');
  
  const extensionsDir = path.resolve('./extensions');
  if (!fs.existsSync(extensionsDir)) {
    console.error('❌ Error: Extensions directory not found!');
    return false;
  }
  
  let allValid = true;
  
  // قراءة محتويات دليل الامتدادات
  const extensions = fs.readdirSync(extensionsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  console.log(`Found ${extensions.length} extension directories: ${extensions.join(', ')}`);
  
  // التحقق من كل امتداد
  for (const extension of extensions) {
    const extensionPath = path.join(extensionsDir, extension);
    const configPath = path.join(extensionPath, 'shopify.extension.toml');
    
    if (!fs.existsSync(configPath)) {
      console.error(`❌ Error: Configuration file not found for extension "${extension}"`);
      allValid = false;
      continue;
    }
    
    try {
      const configContent = fs.readFileSync(configPath, 'utf8');
      
      try {
        const parsed = toml.parse(configContent);
        console.log(`✅ ${extension}/shopify.extension.toml is valid TOML syntax`);
        
        // التحقق من الحقول المطلوبة
        if (!parsed.name) {
          console.warn(`⚠️ Warning: Missing "name" field in ${extension}/shopify.extension.toml`);
        }
        
        if (!parsed.type) {
          console.warn(`⚠️ Warning: Missing "type" field in ${extension}/shopify.extension.toml`);
        }
        
        if (!parsed.handle) {
          console.warn(`⚠️ Warning: Missing "handle" field in ${extension}/shopify.extension.toml`);
        }
        
      } catch (parseError) {
        console.error(`❌ Error parsing ${extension}/shopify.extension.toml:`, parseError.message);
        
        if (parseError.line && parseError.column) {
          console.log(`Error location: Line ${parseError.line}, Column ${parseError.column}`);
          
          const lines = configContent.split('\n');
          if (lines[parseError.line - 1]) {
            console.log('Problematic line:');
            console.log(`${parseError.line}: ${lines[parseError.line - 1]}`);
            console.log(' '.repeat(parseError.line.toString().length + parseError.column + 1) + '^');
          }
        }
        
        allValid = false;
      }
    } catch (error) {
      console.error(`❌ Error reading ${extension}/shopify.extension.toml:`, error.message);
      allValid = false;
    }
  }
  
  return allValid;
}

// تشغيل التحقق
console.log('==================================================');
console.log('      SHOPIFY EXTENSION CONFIGURATION VALIDATOR   ');
console.log('==================================================');

let appConfigValid = validateShopifyAppConfig();
let extensionConfigsValid = validateExtensionConfigs();

console.log('\n==================================================');
if (appConfigValid && extensionConfigsValid) {
  console.log('✅ All configuration files are valid!');
  console.log('You can now run: npx shopify app deploy');
} else {
  console.log('❌ Some configuration files contain errors.');
  console.log('Please fix the issues before deploying.');
}
console.log('==================================================');

