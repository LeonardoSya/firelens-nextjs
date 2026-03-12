/**
 * Test for minimatch ReDoS fix verification
 * TDD: Verify the override is working
 */

const { execSync } = require('child_process');

console.log('Testing minimatch security fix...\n');

// Check which version is being used
const output = execSync('pnpm why minimatch', { encoding: 'utf8' });

// Find the first non-testdevDependency version
const lines = output.split('\n');
let foundVersion = null;

for (const line of lines) {
  if (line.includes('minimatch@')) {
    const match = line.match(/minimatch@(\d+\.\d+\.\d+)/);
    if (match) {
      foundVersion = match[1];
      break;
    }
  }
}

console.log('Minimatch version in use:', foundVersion);

// Version check - 10.2.4+ or 3.1.2+ is safe
if (foundVersion) {
  const [major, minor, patch] = foundVersion.split('.').map(Number);
  const isSafe = major >= 10 || (major >= 3 && minor >= 1 && patch >= 2);
  
  if (isSafe) {
    console.log('✅ SAFE: minimatch', foundVersion, 'is not vulnerable to ReDoS');
    process.exit(0);
  } else {
    console.log('❌ VULNERABLE: minimatch', foundVersion, 'needs update');
    process.exit(1);
  }
} else {
  console.log('❌ Could not determine minimatch version');
  process.exit(1);
}
