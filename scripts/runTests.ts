// scripts/runTests.ts
// Comprehensive Test Suite Runner for XPLORA

import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';

function findTestFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findTestFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.test.ts') || entry.name.endsWith('.spec.ts'))) {
      results.push(fullPath);
    }
  }
  return results;
}

async function main() {
  console.log('================================================================');
  console.log('🚀 XPLORA AUTOMATED TEST SUITE RUNNER');
  console.log('================================================================\n');

  const testsDir = path.join(process.cwd(), '__tests__');
  const testFiles = findTestFiles(testsDir);

  if (testFiles.length === 0) {
    console.log('No test files found in __tests__ directory.');
    process.exit(0);
  }

  console.log(`Discovered ${testFiles.length} test suite(s):\n`);
  for (const file of testFiles) {
    const rel = path.relative(process.cwd(), file);
    console.log(` • ${rel}`);
  }
  console.log('\n----------------------------------------------------------------\n');

  let passedSuites = 0;
  let failedSuites = 0;

  for (const file of testFiles) {
    const rel = path.relative(process.cwd(), file);
    console.log(`Running: ${rel}...`);

    const result = spawnSync('npx', ['tsx', file], {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env },
    });

    if (result.status === 0) {
      passedSuites++;
      console.log(`✅ PASSED: ${rel}\n`);
    } else {
      failedSuites++;
      console.error(`❌ FAILED: ${rel} (Exit code: ${result.status})\n`);
    }
  }

  console.log('================================================================');
  console.log(`📊 TEST EXECUTION SUMMARY:`);
  console.log(`   Total Suites : ${testFiles.length}`);
  console.log(`   Passed       : ${passedSuites}`);
  console.log(`   Failed       : ${failedSuites}`);
  console.log('================================================================\n');

  if (failedSuites > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
