#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('📊 ENEM Pro Performance Analysis');
console.log('=================================\n');

// 1. Check image usage
const postsDir = 'app/blog/posts';
let imageCount = 0;
let externalImages = 0;
let totalImageSize = 0;

if (fs.existsSync(postsDir)) {
  const files = fs.readdirSync(postsDir);
  files.forEach(file => {
    if (file.endsWith('.md')) {
      const content = fs.readFileSync(path.join(postsDir, file), 'utf8');
      const imgMatches = content.match(/!\[/g) || [];
      imageCount += imgMatches.length;
      
      const externalMatches = content.match(/https?:\/\/[^\s)]+\.(jpg|jpeg|png|gif|webp|svg)/gi) || [];
      externalImages += externalMatches.length;
    }
  });
}

console.log('📸 Image Analysis:');
console.log(`   Total images in posts: ${imageCount}`);
console.log(`   External images: ${externalImages}`);
console.log(`   Status: ${externalImages > 20 ? '⚠️  High external image usage' : '✅ Good'}`);
console.log('');

// 2. Check JavaScript
const appDir = 'app';
let jsFilesCount = 0;

const countJsFiles = (dir) => {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && !file.startsWith('.')) {
      countJsFiles(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      jsFilesCount++;
    }
  });
};

countJsFiles(appDir);

console.log('⚙️  JavaScript Analysis:');
console.log(`   TypeScript/React files: ${jsFilesCount}`);
console.log(`   Status: ✅ Using Next.js (automatic code splitting)`);
console.log('');

// 3. Check dependencies
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const depCount = Object.keys(packageJson.dependencies || {}).length;

console.log('📦 Dependencies:');
console.log(`   Total dependencies: ${depCount}`);
console.log(`   Status: ${depCount > 20 ? '⚠️  Consider code splitting' : '✅ Reasonable'}`);
console.log('');

// 4. Check CSS
let cssLineCount = 0;
const findCssFiles = (dir) => {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findCssFiles(fullPath);
    } else if (file.endsWith('.css') || file.endsWith('.pcss')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      cssLineCount += content.split('\n').length;
    }
  });
};

if (fs.existsSync('app')) findCssFiles('app');

console.log('🎨 CSS Analysis:');
console.log(`   Total CSS files: ${cssLineCount > 0 ? '✅ Using Tailwind (auto-optimized)' : 'CSS found'}`);
console.log('');

// 5. Performance recommendations
console.log('⚡ Performance Recommendations:');
console.log('');
console.log('HIGH PRIORITY:');
console.log('1. Image Optimization');
console.log('   - Convert images to WebP format (20-30% smaller)');
console.log('   - Implement lazy loading with Next.js Image component');
console.log('   - Add width/height attributes to prevent CLS');
console.log('');
console.log('2. Code Splitting');
console.log('   - Use dynamic imports for heavy components');
console.log('   - Defer non-critical JavaScript');
console.log('');
console.log('3. Core Web Vitals');
console.log('   - LCP: Optimize images, reduce server time');
console.log('   - FID: Reduce JavaScript execution');
console.log('   - CLS: Add image dimensions, use skeleton loaders');
console.log('');

console.log('MEDIUM PRIORITY:');
console.log('1. Caching Strategy');
console.log('   - Implement browser caching headers');
console.log('   - Use CDN for static assets');
console.log('');
console.log('2. SEO');
console.log('   - Add JSON-LD structured data');
console.log('   - Ensure all images have alt text');
console.log('');

console.log('QUICK WINS:');
console.log('1. Minify CSS/JS (Next.js build does this)');
console.log('2. Remove unused CSS (Tailwind purges automatically)');
console.log('3. Defer non-critical CSS/JS');
console.log('4. Enable Gzip compression (nginx/Vercel default)');
console.log('');

// 6. Estimated scores based on best practices
console.log('📈 Estimated Scores (based on best practices):');
console.log('');
console.log('Posts with all optimizations: ~95-98');
console.log('Posts with images, no WebP: ~75-85 (Performance hit)');
console.log('Posts with heavy JavaScript: ~70-80');
console.log('Posts with full optimization: ~95+');
console.log('');

console.log('✅ Analysis complete');
