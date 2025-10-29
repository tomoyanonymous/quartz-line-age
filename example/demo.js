#!/usr/bin/env node

/**
 * Standalone demo showing the quartz-line-age plugin in action
 * This processes the example markdown files and shows the transformation
 */

import { LineAgePre, LineAgePost, getLineAges, calculateColor } from '../dist/index.js';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('═══════════════════════════════════════════════════════════');
console.log('  Quartz Line Age Plugin - Standalone Demo');
console.log('═══════════════════════════════════════════════════════════\n');

// Read example markdown file
const examplePath = join(__dirname, 'content', 'index.md');
const markdown = readFileSync(examplePath, 'utf-8');

console.log('📄 Input Markdown (first 500 chars):');
console.log('─'.repeat(60));
console.log(markdown.substring(0, 500) + '...\n');

// Stage 1: LineAgePre
console.log('🔄 Stage 1: LineAgePre - Inserting line markers...');
console.log('─'.repeat(60));

const prePlug = LineAgePre({ enabled: true });
const mockCtx = { argv: { directory: __dirname } };
const markedMarkdown = prePlug.textTransform(mockCtx, markdown);

// Show first few marked lines
const markedLines = markedMarkdown.split('\n').slice(0, 10);
console.log('First 10 lines with markers:');
markedLines.forEach((line, i) => {
  if (line.length > 80) {
    console.log(`  ${line.substring(0, 80)}...`);
  } else {
    console.log(`  ${line}`);
  }
});
console.log();

// Show git blame info
console.log('📊 Git Blame Information:');
console.log('─'.repeat(60));
const relativePath = 'content/index.md';
const lineAges = getLineAges(relativePath, __dirname);

if (lineAges.size > 0) {
  console.log(`✓ Retrieved ${lineAges.size} line ages`);
  
  // Show sample lines
  const sampleLines = [1, 5, 10, 20, 30];
  console.log('\nSample line ages:');
  sampleLines.forEach(lineNum => {
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
} else {
  console.log('⚠ No git blame data available (files may not be committed)');
}
console.log();

// Stage 2: LineAgePost
console.log('🎨 Stage 2: LineAgePost - Transforming to HTML...');
console.log('─'.repeat(60));

const postPlug = LineAgePost({
  enabled: true,
  maxAgeDays: 365,
  freshColor: { r: 34, g: 197, b: 94 },
  oldColor: { r: 156, g: 163, b: 175 },
});

const mockFile = {
  data: {
    filePath: examplePath,
    slug: 'index'
  }
};

async function processMarkdown() {
  const htmlPlugins = postPlug.htmlPlugins(mockCtx);
  
  const processor = unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(htmlPlugins[0])
    .use(rehypeStringify, { allowDangerousHtml: true });

  const result = await processor.process({
    value: markedMarkdown,
    data: mockFile.data
  });
  
  const html = String(result);
  
  // Show first part of HTML output
  console.log('HTML output (first 1000 chars):');
  console.log(html.substring(0, 1000) + '...\n');
  
  // Check for line-age elements
  const hasBars = html.includes('line-age-bar');
  const hasColors = html.includes('background-color: rgb(');
  const hasNoContainers = !html.includes('line-age-container');
  const hasNoMarkers = !html.includes('{{-line:');
  
  console.log('✓ Verification:');
  console.log(`  ${hasBars ? '✓' : '✗'} line-age-bar elements present`);
  console.log(`  ${hasColors ? '✓' : '✗'} Color styling applied`);
  console.log(`  ${hasNoContainers ? '✓' : '✗'} No line-age-container wrapper (as expected)`);
  console.log(`  ${hasNoMarkers ? '✓' : '✗'} All markers removed`);
  
  if (hasBars && hasColors && hasNoContainers && hasNoMarkers) {
    console.log('\n🎉 Transformation successful!');
  }
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Demo Complete');
  console.log('═══════════════════════════════════════════════════════════');
}

processMarkdown().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
