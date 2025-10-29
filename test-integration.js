// Test the line age functionality with actual git data
import { getLineAges, calculateColor } from './dist/index.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Testing line age detection on README.md...\n');

const lineAges = getLineAges(join(__dirname, 'README.md'));

if (lineAges.size > 0) {
  console.log(`✓ Successfully retrieved ${lineAges.size} line ages`);
  
  // Sample some lines
  const samples = [1, 5, 10, 20, 30];
  console.log('\nSample lines:');
  samples.forEach(lineNum => {
    if (lineAges.has(lineNum)) {
      const age = lineAges.get(lineNum);
      const color = calculateColor(age);
      console.log(`  Line ${lineNum}: ${age.toFixed(1)} days old -> ${color}`);
    }
  });
  
  // Stats
  const ages = Array.from(lineAges.values());
  const avgAge = ages.reduce((a, b) => a + b, 0) / ages.length;
  const maxAge = Math.max(...ages);
  const minAge = Math.min(...ages);
  
  console.log('\nStatistics:');
  console.log(`  Average age: ${avgAge.toFixed(1)} days`);
  console.log(`  Oldest line: ${maxAge.toFixed(1)} days`);
  console.log(`  Newest line: ${minAge.toFixed(1)} days`);
  
  console.log('\n✓ All tests passed!');
} else {
  console.log('✗ No git blame data available');
}
