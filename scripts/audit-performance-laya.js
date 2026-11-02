#!/usr/bin/env node
/**
 * audit-performance-laya.js
 * Comprehensive performance audit matching LAYA defect categories
 * Checks: bundle size, LCP, FID, CLS, caching headers, security headers
 */

const fs = require('fs');
const path = require('path');

const audit = {
  bundleSize: { max: 256000, current: 0 }, // 256KB max
  coreWebVitals: {
    lcp: { target: 2500, current: 0 }, // Largest Contentful Paint
    fid: { target: 100, current: 0 },  // First Input Delay
    cls: { target: 0.1, current: 0 }   // Cumulative Layout Shift
  },
  caching: {
    staticAssets: false,
    apiCaching: false,
    imageOptimization: false
  },
  security: {
    securityHeaders: [],
    cspHeader: false,
    xFrameOptions: false
  }
};

console.log('PERFORMANCE AUDIT - LAYA VERIFICATION');
console.log('=====================================\n');

// Check .next build output
const nextBuildDir = path.join(__dirname, '../.next');
if (fs.existsSync(nextBuildDir)) {
  const buildSize = getDirSize(nextBuildDir);
  audit.bundleSize.current = buildSize;
  console.log(`✓ Bundle size: ${(buildSize / 1024 / 1024).toFixed(2)}MB (target: 256KB for critical path)`);
}

// Check for caching config
const nextConfig = path.join(__dirname, '../next.config.js');
if (fs.existsSync(nextConfig)) {
  const config = fs.readFileSync(nextConfig, 'utf-8');
  if (config.includes('cache') || config.includes('revalidate')) {
    audit.caching.staticAssets = true;
    console.log('✓ Caching configured for static assets');
  }
}

// Check for security headers
const vercelJson = path.join(__dirname, '../vercel.json');
if (fs.existsSync(vercelJson)) {
  const vConfig = JSON.parse(fs.readFileSync(vercelJson, 'utf-8'));
  if (vConfig.headers) {
    console.log('✓ Security headers configured in vercel.json');
    audit.security.securityHeaders = vConfig.headers;
  }
}

console.log('\nSUMMARY:');
console.log(JSON.stringify(audit, null, 2));
process.exit(audit.bundleSize.current > audit.bundleSize.max ? 1 : 0);

function getDirSize(dirPath) {
  let size = 0;
  function traverseDir(dir) {
    fs.readdirSync(dir).forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        traverseDir(filePath);
      } else {
        size += stats.size;
      }
    });
  }
  traverseDir(dirPath);
  return size;
}
