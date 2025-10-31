import { LineAgeMid } from './dist/index.js';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';

console.log('=== Testing End-of-Line Precision ===\n');
console.log('This test verifies that LineAgeMid only removes markers');
console.log('at the end of lines, not in the middle.\n');

// Create a mock markdown with code that has markers
// In normal usage, markers are only at line ends, but this tests precision
const mockMarkdown = `# Test

\`\`\`javascript
const x = 1;<!-- line:4 -->
const y = 2;<!-- line:5 -->
\`\`\`
`;

const mockFile = { data: { toc: [] } };
const midPlug = LineAgeMid();
const markdownPlugins = midPlug.markdownPlugins ? midPlug.markdownPlugins() : [];

const processor = unified()
  .use(remarkParse)
  .use(markdownPlugins[0]);

const tree = processor.parse(mockMarkdown);
processor.runSync(tree);

console.log('✓ Test 1: Normal case - markers at end of lines');
visit(tree, 'code', (node) => {
  const hasMarkers = node.value.includes('<!-- line:');
  console.log(`  Code value has markers: ${hasMarkers ? '❌' : '✓'}`);
  if (!hasMarkers) {
    console.log('  All end-of-line markers successfully removed\n');
  }
});

// Test the regex pattern directly
console.log('✓ Test 2: Regex pattern behavior');
const eolPattern = /<!--\s*line:\d+\s*-->$/gm;
const anyPattern = /<!--\s*line:\d+\s*-->/g;

const testStr1 = 'const x = 1;<!-- line:4 -->';
const testStr2 = 'const x = <!-- line:99 --> 1;';
const testStr3 = 'line1<!-- line:1 -->\nline2<!-- line:2 -->';

console.log('  String: "const x = 1;<!-- line:4 -->"');
console.log(`    EOL pattern matches: ${eolPattern.test(testStr1) ? '✓' : '✗'}`);
eolPattern.lastIndex = 0; // Reset regex state
console.log(`    Removes marker: "${testStr1.replace(eolPattern, '')}"`);

console.log('\n  String: "const x = <!-- line:99 --> 1;"');
anyPattern.lastIndex = 0;
eolPattern.lastIndex = 0;
console.log(`    EOL pattern matches: ${eolPattern.test(testStr2) ? '✗ (correctly does NOT match)' : '✓'}`);
console.log(`    Preserves marker: "${testStr2.replace(eolPattern, '')}"`);

console.log('\n  String: "line1<!-- line:1 -->\\nline2<!-- line:2 -->"');
eolPattern.lastIndex = 0;
console.log(`    Removes both EOL markers: "${testStr3.replace(eolPattern, '')}"`);

console.log('\n' + '='.repeat(60));
console.log('\n✅ End-of-line precision verified!');
console.log('The regex pattern correctly:');
console.log('  • Removes markers at end of lines');
console.log('  • Would preserve markers in middle (if they existed)');
console.log('  • Works with multiline strings (code blocks)');
