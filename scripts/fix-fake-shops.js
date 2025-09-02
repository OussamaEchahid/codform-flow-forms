#!/usr/bin/env node

/**
 * 🔧 سكريبت لإصلاح جميع المتاجر الوهمية في الكود
 * Script to fix all fake shop references in the codebase
 */

const fs = require('fs');
const path = require('path');

// المتاجر الوهمية المحظورة
const FAKE_SHOPS = [
  'default.myshopify.com',
  'default-shop.myshopify.com',
  'test.myshopify.com',
  'demo.myshopify.com',
  'example.myshopify.com'
];

// المتجر الحقيقي للاستبدال
const REAL_SHOP = 'astrem.myshopify.com';

// الملفات المستثناة من التعديل
const EXCLUDED_FILES = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'migrations' // نتجنب تعديل migrations لأنها تاريخية
];

/**
 * فحص إذا كان المسار مستثنى
 */
function isExcluded(filePath) {
  return EXCLUDED_FILES.some(excluded => filePath.includes(excluded));
}

/**
 * فحص إذا كان الملف يحتوي على متاجر وهمية
 */
function containsFakeShops(content) {
  return FAKE_SHOPS.some(fakeShop => content.includes(fakeShop));
}

/**
 * استبدال المتاجر الوهمية بالمتجر الحقيقي
 */
function replaceFakeShops(content) {
  let updatedContent = content;
  let hasChanges = false;

  FAKE_SHOPS.forEach(fakeShop => {
    if (updatedContent.includes(fakeShop)) {
      console.log(`  🔄 Replacing ${fakeShop} with ${REAL_SHOP}`);
      updatedContent = updatedContent.replace(new RegExp(fakeShop, 'g'), REAL_SHOP);
      hasChanges = true;
    }
  });

  return { content: updatedContent, hasChanges };
}

/**
 * معالجة ملف واحد
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (!containsFakeShops(content)) {
      return false; // لا توجد تغييرات
    }

    console.log(`📝 Processing: ${filePath}`);
    const { content: updatedContent, hasChanges } = replaceFakeShops(content);

    if (hasChanges) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

/**
 * معالجة مجلد بشكل تكراري
 */
function processDirectory(dirPath) {
  let totalFiles = 0;
  let updatedFiles = 0;

  function walkDirectory(currentPath) {
    const items = fs.readdirSync(currentPath);

    items.forEach(item => {
      const itemPath = path.join(currentPath, item);
      
      if (isExcluded(itemPath)) {
        return;
      }

      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        walkDirectory(itemPath);
      } else if (stat.isFile()) {
        // معالجة الملفات النصية فقط
        const ext = path.extname(item).toLowerCase();
        const textExtensions = ['.js', '.ts', '.tsx', '.jsx', '.vue', '.json', '.sql', '.md', '.txt', '.yml', '.yaml'];
        
        if (textExtensions.includes(ext)) {
          totalFiles++;
          if (processFile(itemPath)) {
            updatedFiles++;
          }
        }
      }
    });
  }

  walkDirectory(dirPath);
  return { totalFiles, updatedFiles };
}

/**
 * الدالة الرئيسية
 */
function main() {
  console.log('🔧 Starting fake shop cleanup...');
  console.log(`📋 Looking for: ${FAKE_SHOPS.join(', ')}`);
  console.log(`🎯 Replacing with: ${REAL_SHOP}`);
  console.log('');

  const startTime = Date.now();
  const { totalFiles, updatedFiles } = processDirectory(process.cwd());
  const endTime = Date.now();

  console.log('');
  console.log('📊 Summary:');
  console.log(`   📁 Total files scanned: ${totalFiles}`);
  console.log(`   ✅ Files updated: ${updatedFiles}`);
  console.log(`   ⏱️  Time taken: ${endTime - startTime}ms`);
  
  if (updatedFiles > 0) {
    console.log('');
    console.log('🎉 Fake shop cleanup completed successfully!');
    console.log('⚠️  Please review the changes and test your application.');
  } else {
    console.log('');
    console.log('✨ No fake shops found. Your codebase is clean!');
  }
}

// تشغيل السكريبت
if (require.main === module) {
  main();
}

module.exports = {
  processFile,
  processDirectory,
  replaceFakeShops,
  containsFakeShops,
  FAKE_SHOPS,
  REAL_SHOP
};
