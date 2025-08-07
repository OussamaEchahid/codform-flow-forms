#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 نشر امتداد الثيم...');

try {
  // البحث عن مجلد المشروع
  const rootDir = process.cwd();
  console.log('📂 مجلد المشروع:', rootDir);
  
  // نشر الامتداد
  execSync('shopify app deploy', {
    cwd: rootDir,
    stdio: 'inherit'
  });
  
  console.log('✅ تم نشر الامتداد بنجاح!');
  
} catch (error) {
  console.error('❌ خطأ في النشر:', error.message);
  process.exit(1);
}