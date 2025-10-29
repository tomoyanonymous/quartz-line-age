#!/usr/bin/env node

/**
 * Standalone demo of the line age calculation
 * This demonstrates the core functionality without needing Quartz
 */

import { calculateColor, getLineAges } from './dist/index.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Demo: Calculate colors for different ages
console.log('\n=== Color Gradient Demo ===\n');
console.log('Age (days) -> Color');
console.log('-------------------');

const ages = [0, 30, 60, 90, 120, 180, 240, 300, 365, 400];
ages.forEach(age => {
  const color = calculateColor(age);
  console.log(`${age.toString().padStart(3)} days   -> ${color}`);
});

// Demo: Get line ages for this file
console.log('\n=== Git Blame Demo ===\n');
console.log('Analyzing this file (demo.js)...\n');

try {
  const thisFile = join(__dirname, 'demo.js');
  const lineAges = getLineAges(thisFile);
  
  if (lineAges.size > 0) {
    console.log(`Found ${lineAges.size} lines with git blame data:`);
    lineAges.forEach((age, lineNum) => {
      const color = calculateColor(age);
      const ageStr = age < 1 ? '<1 day' : `${Math.round(age)} days`;
      console.log(`  Line ${lineNum}: ${ageStr.padEnd(10)} -> ${color}`);
    });
  } else {
    console.log('No git blame data available (file may not be committed yet)');
  }
} catch (error) {
  console.error('Error:', error.message);
}

console.log('\n=== Visual Preview ===\n');
console.log('Open example.html in your browser to see the line age bars in action!\n');
