import { LineAgePre } from './dist/index.js';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';

const markdownWithCode = `# Test

\`\`\`javascript
function hello() {
  console.log("test");
}
\`\`\`
`;

const mockCtx = { argv: { directory: process.cwd() } };
const prePlug = LineAgePre({ enabled: true });
const markedMarkdown = prePlug.textTransform(mockCtx, markdownWithCode);

console.log('Marked markdown:');
console.log(markedMarkdown);
console.log('\n' + '='.repeat(60) + '\n');

// Parse to AST
const processor = unified().use(remarkParse);
const tree = processor.parse(markedMarkdown);

console.log('Markdown AST:\n');

// Visit all nodes and log their structure
visit(tree, (node) => {
  if (node.type === 'code') {
    console.log('Found code node:');
    console.log('  Type:', node.type);
    console.log('  Lang:', node.lang);
    console.log('  Value:', JSON.stringify(node.value));
    console.log('  Meta:', node.meta);
    console.log();
  } else if (node.type === 'html') {
    console.log('Found HTML node:');
    console.log('  Type:', node.type);
    console.log('  Value:', JSON.stringify(node.value));
    console.log();
  }
});
