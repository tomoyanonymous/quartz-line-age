import { LineAgePre, LineAgeMid } from './dist/index.js';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';

// Test case: A code block with markers at end of lines
const markdown = `# Test

\`\`\`javascript
const x = 1;
const y = 2;
function test() {
  return x + y;
}
\`\`\`
`;

console.log('=== Testing End-of-Line Marker Removal ===\n');

const mockCtx = { argv: { directory: process.cwd() } };
const prePlug = LineAgePre({ enabled: true });
const markedMarkdown = prePlug.textTransform(mockCtx, markdown);

console.log('After LineAgePre:');
console.log(markedMarkdown);
console.log('\n' + '='.repeat(60) + '\n');

// Parse to AST
const processor = unified().use(remarkParse);
const tree = processor.parse(markedMarkdown);

console.log('Code block value BEFORE LineAgeMid:');
visit(tree, 'code', (node) => {
  console.log(JSON.stringify(node.value, null, 2));
});
console.log('\n' + '='.repeat(60) + '\n');

// Apply LineAgeMid
const midPlug = LineAgeMid();
const markdownPlugins = midPlug.markdownPlugins ? midPlug.markdownPlugins() : [];
const midProcessor = unified()
  .use(remarkParse)
  .use(markdownPlugins[0]);

const midTree = midProcessor.parse(markedMarkdown);
midProcessor.runSync(midTree);

console.log('Code block value AFTER LineAgeMid:');
visit(midTree, 'code', (node) => {
  console.log(JSON.stringify(node.value, null, 2));
  
  // Check if any markers remain
  if (node.value.includes('<!-- line:')) {
    console.log('\n⚠️  WARNING: Markers still present in code block!');
  } else {
    console.log('\n✓ Code block is clean');
  }
});
