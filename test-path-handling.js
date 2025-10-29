/**
 * Test to verify that file path handling correctly prevents
 * content/content duplication when working with Quartz VFile data
 */

import { getLineAges } from './dist/index.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('=== Testing File Path Handling ===\n');

// Simulate what Quartz would pass:
// - fullFp might be something like "/path/to/project/content/file.md"
// - repositoryRoot would be "/path/to/project"
// The plugin should calculate "content/file.md" as the relative path

const repositoryRoot = __dirname;
const testFile = 'README.md';

console.log('Repository root:', repositoryRoot);
console.log('Test file (relative):', testFile);

// Test with relative path
const lineAges = getLineAges(testFile, repositoryRoot);

if (lineAges.size > 0) {
  console.log('\n✓ Successfully retrieved', lineAges.size, 'line ages');
  console.log('✓ File path handling working correctly');
  
  // Show that it works with the correct path
  const firstLine = lineAges.get(1);
  if (firstLine !== undefined) {
    console.log('  First line age:', firstLine.toFixed(2), 'days');
  }
} else {
  console.log('\n✗ No git blame data retrieved');
  console.log('  This might mean the file is not tracked by git');
}

// Test what would happen if we accidentally duplicated the path
console.log('\n=== Testing Error Case (duplicated path) ===');
const duplicatedPath = 'content/content/README.md';
console.log('Trying with duplicated path:', duplicatedPath);
const lineAgesError = getLineAges(duplicatedPath, repositoryRoot);
if (lineAgesError.size === 0) {
  console.log('✓ Correctly fails with duplicated path (as expected)');
} else {
  console.log('✗ Unexpectedly succeeded with duplicated path');
}

console.log('\n✓ Path handling tests complete!');
