#!/usr/bin/env tsx
/**
 * Verify A/B Testing Framework Installation
 * Checks that all components are properly installed across projects
 * 
 * Usage: npx tsx scripts/verify-ab-framework.ts
 */

import { promises as fs } from 'fs';
import path from 'path';

interface FrameworkCheckResult {
  project: string;
  components: { file: string; exists: boolean }[];
  api: { file: string; exists: boolean };
  config: { file: string; exists: boolean };
  passed: boolean;
}

const REQUIRED_FILES = {
  components: [
    'src/components/ABTestVariant.tsx',
    'src/components/MetricsDashboard.tsx',
  ],
  lib: [
    'src/lib/gtm-analytics.ts',
  ],
  config: [
    'src/config/ab-test.ts',
  ],
  api: [
    'src/app/api/metrics/ab-tests/[testId]/route.ts',
  ],
};

async function checkProject(projectPath: string, projectName: string): Promise<FrameworkCheckResult> {
  console.log(`\n🔍 Checking: ${projectName}`);
  
  const result: FrameworkCheckResult = {
    project: projectName,
    components: [],
    api: { file: '', exists: false },
    config: { file: '', exists: false },
    passed: true,
  };

  // Check component files
  for (const file of REQUIRED_FILES.components) {
    const fullPath = path.join(projectPath, file);
    try {
      await fs.access(fullPath);
      result.components.push({ file, exists: true });
      console.log(`  ✅ ${file}`);
    } catch {
      result.components.push({ file, exists: false });
      console.log(`  ❌ ${file}`);
      result.passed = false;
    }
  }

  // Check lib files
  for (const file of REQUIRED_FILES.lib) {
    const fullPath = path.join(projectPath, file);
    try {
      await fs.access(fullPath);
      console.log(`  ✅ ${file}`);
    } catch {
      console.log(`  ❌ ${file}`);
      result.passed = false;
    }
  }

  // Check config files
  for (const file of REQUIRED_FILES.config) {
    const fullPath = path.join(projectPath, file);
    try {
      await fs.access(fullPath);
      result.config.file = file;
      result.config.exists = true;
      console.log(`  ✅ ${file}`);
    } catch {
      result.config.file = file;
      result.config.exists = false;
      console.log(`  ❌ ${file}`);
      result.passed = false;
    }
  }

  // Check API endpoint
  for (const file of REQUIRED_FILES.api) {
    const fullPath = path.join(projectPath, file);
    try {
      await fs.access(fullPath);
      result.api.file = file;
      result.api.exists = true;
      console.log(`  ✅ ${file}`);
    } catch {
      result.api.file = file;
      result.api.exists = false;
      console.log(`  ❌ ${file}`);
      result.passed = false;
    }
  }

  return result;
}

async function verifyFramework() {
  console.log('═══════════════════════════════════════════');
  console.log('A/B Testing Framework Verification');
  console.log('═══════════════════════════════════════════');

  const projects = [
    { path: '/root/projetos/enem-pro', name: 'enem-pro' },
    { path: '/root/projetos/site-clicks', name: 'site-clicks' },
    { path: '/root/projetos/clube-da-escolha', name: 'clube-da-escolha' },
    { path: '/root/projetos/happy-scribes-nest', name: 'happy-scribes-nest' },
  ];

  const results: FrameworkCheckResult[] = [];

  for (const { path: projectPath, name } of projects) {
    try {
      const result = await checkProject(projectPath, name);
      results.push(result);
    } catch (error) {
      console.error(`❌ Error checking ${name}:`, error);
      results.push({
        project: name,
        components: [],
        api: { file: '', exists: false },
        config: { file: '', exists: false },
        passed: false,
      });
    }
  }

  // Summary
  console.log('\n═══════════════════════════════════════════');
  console.log('Summary');
  console.log('═══════════════════════════════════════════');

  let totalPassed = 0;
  let totalFailed = 0;

  for (const result of results) {
    if (result.passed) {
      console.log(`✅ ${result.project}: READY`);
      totalPassed++;
    } else {
      console.log(`❌ ${result.project}: MISSING FILES`);
      totalFailed++;
    }
  }

  console.log(`\n📊 Results: ${totalPassed}/${projects.length} projects ready`);

  if (totalFailed === 0) {
    console.log('\n🎉 Framework verification PASSED!');
    console.log('\nNext steps:');
    console.log('  1. Apply Supabase migrations (migrations/001_ab_testing_schema.sql)');
    console.log('  2. Set NEXT_PUBLIC_GTM_ID in .env');
    console.log('  3. Integrate ABTestVariant into blog post layouts');
    console.log('  4. Deploy to Vercel');
    return 0;
  } else {
    console.log('\n⚠️  Framework verification FAILED!');
    console.log('Please copy missing files to each project.');
    return 1;
  }
}

// Run verification
verifyFramework()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
