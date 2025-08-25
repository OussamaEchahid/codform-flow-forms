#!/usr/bin/env node

/**
 * سكريبت لتحديث معدلات التحويل الموحدة في جميع أنحاء النظام
 * Script to update unified exchange rates across the entire system
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// المعدلات الموحدة - مصدر الحقيقة الوحيد
const UNIFIED_RATES = {
  // العملات الرئيسية
  'USD': 1.0000, 'EUR': 0.9200, 'GBP': 0.7900, 'JPY': 149.0000, 'CNY': 7.2400,
  'INR': 83.0000, 'RUB': 92.5000, 'AUD': 1.5700, 'CAD': 1.4300, 'CHF': 0.8900,
  'HKD': 7.8000, 'SGD': 1.3500, 'KRW': 1345.0000, 'NZD': 1.6900,
  
  // عملات الشرق الأوسط
  'SAR': 3.7500, 'AED': 3.6700, 'QAR': 3.6400, 'KWD': 0.3100, 'BHD': 0.3800,
  'OMR': 0.3800, 'EGP': 30.8500, 'JOD': 0.7100, 'ILS': 3.6700, 'IRR': 42100.0000,
  'IQD': 1310.0000, 'TRY': 34.1500, 'LBP': 89500.0000, 'SYP': 13000.0000, 'YER': 250.0000,
  
  // عملات أفريقيا
  'MAD': 10.5000, 'XOF': 655.9600, 'XAF': 655.9600, 'NGN': 1675.0000, 'ZAR': 18.4500,
  'KES': 130.5000, 'GHS': 15.8500, 'ETB': 125.5000, 'TZS': 2515.0000, 'UGX': 3785.0000,
  'ZMW': 27.8500, 'RWF': 1385.0000,
  
  // عملات آسيا
  'IDR': 15850.0000, 'PKR': 280.0000, 'BDT': 110.0000, 'LKR': 300.0000, 'NPR': 133.0000,
  'BTN': 83.0000, 'MMK': 2100.0000, 'KHR': 4100.0000, 'LAK': 20000.0000, 'VND': 24000.0000,
  'THB': 36.0000, 'MYR': 4.7000, 'PHP': 56.0000,
  
  // عملات أمريكا اللاتينية
  'MXN': 20.1500, 'BRL': 6.0500, 'ARS': 1005.5000, 'CLP': 975.2000, 'COP': 4285.5000,
  'PEN': 3.7500, 'VES': 36500000.0000, 'UYU': 40.2500
};

// الملفات التي تحتاج تحديث
const FILES_TO_UPDATE = [
  {
    path: 'supabase/functions/currency-settings/index.ts',
    pattern: /const UNIFIED_EXCHANGE_RATES = \{[^}]+\}/s,
    replacement: generateRatesObject('UNIFIED_EXCHANGE_RATES')
  },
  {
    path: 'supabase/functions/ultimate-currency-api/index.ts',
    pattern: /const UNIFIED_DEFAULT_RATES = \{[^}]+\}/s,
    replacement: generateRatesObject('UNIFIED_DEFAULT_RATES')
  },
  {
    path: 'extensions/theme-extension-codform/assets/codform-ultimate-currency.js',
    pattern: /const UNIFIED_EXCHANGE_RATES = \{[^}]+\}/s,
    replacement: generateRatesObject('UNIFIED_EXCHANGE_RATES')
  },
  {
    path: 'extensions/theme-extension-codform/assets/codform-currency-rates.js',
    pattern: /window\.CodformCurrencyRates = \{[^}]+\}/s,
    replacement: generateRatesObject('window.CodformCurrencyRates')
  },
  {
    path: 'extensions/theme-extension-codform/assets/codform-smart-currency-system.js',
    pattern: /const UNIFIED_EXCHANGE_RATES = \{[^}]+\}/s,
    replacement: generateRatesObject('UNIFIED_EXCHANGE_RATES')
  }
];

/**
 * توليد كود JavaScript/TypeScript للمعدلات
 */
function generateRatesObject(variableName) {
  const lines = [];
  lines.push(`const ${variableName} = {`);
  
  // تجميع العملات حسب المنطقة
  const regions = {
    'Major': ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'INR', 'RUB', 'AUD', 'CAD', 'CHF', 'HKD', 'SGD', 'KRW', 'NZD'],
    'Middle East': ['SAR', 'AED', 'QAR', 'KWD', 'BHD', 'OMR', 'EGP', 'JOD', 'ILS', 'IRR', 'IQD', 'TRY', 'LBP', 'SYP', 'YER'],
    'Africa': ['MAD', 'XOF', 'XAF', 'NGN', 'ZAR', 'KES', 'GHS', 'ETB', 'TZS', 'UGX', 'ZMW', 'RWF'],
    'Asia': ['IDR', 'PKR', 'BDT', 'LKR', 'NPR', 'BTN', 'MMK', 'KHR', 'LAK', 'VND', 'THB', 'MYR', 'PHP'],
    'Latin America': ['MXN', 'BRL', 'ARS', 'CLP', 'COP', 'PEN', 'VES', 'UYU']
  };

  Object.entries(regions).forEach(([regionName, currencies]) => {
    lines.push(`  // ${regionName === 'Major' ? 'العملات الرئيسية' : 
                regionName === 'Middle East' ? 'عملات الشرق الأوسط' :
                regionName === 'Africa' ? 'عملات أفريقيا' :
                regionName === 'Asia' ? 'عملات آسيا' : 'عملات أمريكا اللاتينية'}`);
    
    const currencyPairs = currencies
      .filter(code => UNIFIED_RATES[code])
      .map(code => `'${code}': ${UNIFIED_RATES[code]}`);
    
    lines.push(`  ${currencyPairs.join(', ')},`);
    lines.push('');
  });

  lines.push('};');
  return lines.join('\n');
}

/**
 * تحديث ملف واحد
 */
function updateFile(fileConfig) {
  const filePath = path.resolve(fileConfig.path);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${fileConfig.path}`);
    return false;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (fileConfig.pattern.test(content)) {
      content = content.replace(fileConfig.pattern, fileConfig.replacement);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${fileConfig.path}`);
      return true;
    } else {
      console.log(`⚠️  Pattern not found in: ${fileConfig.path}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error updating ${fileConfig.path}:`, error.message);
    return false;
  }
}

/**
 * تحديث جميع الملفات
 */
function updateAllFiles() {
  console.log('🚀 Starting unified rates update...\n');
  
  let successCount = 0;
  let totalCount = FILES_TO_UPDATE.length;

  FILES_TO_UPDATE.forEach(fileConfig => {
    if (updateFile(fileConfig)) {
      successCount++;
    }
  });

  console.log(`\n📊 Update Summary:`);
  console.log(`✅ Successfully updated: ${successCount}/${totalCount} files`);
  
  if (successCount === totalCount) {
    console.log('🎉 All files updated successfully!');
  } else {
    console.log('⚠️  Some files could not be updated. Please check manually.');
  }
}

/**
 * التحقق من تطابق المعدلات
 */
function validateRates() {
  console.log('🔍 Validating rates consistency...\n');
  
  // التحقق من أن USD = 1.0
  if (UNIFIED_RATES['USD'] !== 1.0) {
    console.error('❌ USD rate must be 1.0');
    return false;
  }

  // التحقق من أن جميع المعدلات موجبة
  for (const [code, rate] of Object.entries(UNIFIED_RATES)) {
    if (rate <= 0) {
      console.error(`❌ Invalid rate for ${code}: ${rate}`);
      return false;
    }
  }

  // التحقق من العملات الأساسية
  const requiredCurrencies = ['USD', 'EUR', 'GBP', 'SAR', 'AED', 'MAD', 'EGP'];
  for (const code of requiredCurrencies) {
    if (!UNIFIED_RATES[code]) {
      console.error(`❌ Missing required currency: ${code}`);
      return false;
    }
  }

  console.log('✅ All rates validation passed!');
  return true;
}

/**
 * عرض معلومات المعدلات
 */
function showRatesInfo() {
  console.log('📋 Unified Exchange Rates Summary:\n');
  
  const totalCurrencies = Object.keys(UNIFIED_RATES).length;
  console.log(`Total currencies: ${totalCurrencies}`);
  
  // عرض بعض المعدلات المهمة
  const importantCurrencies = ['USD', 'EUR', 'GBP', 'SAR', 'AED', 'MAD', 'EGP'];
  console.log('\nKey rates:');
  importantCurrencies.forEach(code => {
    if (UNIFIED_RATES[code]) {
      console.log(`  ${code}: ${UNIFIED_RATES[code]}`);
    }
  });
  
  console.log('\n');
}

// تشغيل السكريبت
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node update-unified-rates.js [options]

Options:
  --validate, -v    Validate rates only
  --info, -i        Show rates information
  --help, -h        Show this help message

Examples:
  node update-unified-rates.js           # Update all files
  node update-unified-rates.js --validate # Validate rates only
  node update-unified-rates.js --info     # Show rates info
`);
    return;
  }

  if (args.includes('--validate') || args.includes('-v')) {
    validateRates();
    return;
  }

  if (args.includes('--info') || args.includes('-i')) {
    showRatesInfo();
    return;
  }

  // التشغيل الافتراضي: التحقق ثم التحديث
  showRatesInfo();
  
  if (validateRates()) {
    updateAllFiles();
  } else {
    console.error('❌ Validation failed. Aborting update.');
    process.exit(1);
  }
}

// تشغيل السكريبت إذا تم استدعاؤه مباشرة
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  UNIFIED_RATES,
  updateFile,
  updateAllFiles,
  validateRates,
  generateRatesObject
};
