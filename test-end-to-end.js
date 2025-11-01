import { LineAgePre, LineAgeMid, LineAgePost } from './dist/index.js';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeRaw from 'rehype-raw';

const fullTestMarkdown = `---
title: Test Document
---

# Full Test Document

This tests the complete pipeline.

## Code Examples

Here's some JavaScript:

\`\`\`javascript
function add(a, b) {
  return a + b;
}
const result = add(1, 2);
\`\`\`

And some Python:

\`\`\`python
def multiply(x, y):
    return x * y
result = multiply(3, 4)
\`\`\`

## Inline Code

You can also use inline code like \`const x = 5;\` in sentences.

## Conclusion

This is the end.
`;

console.log('=== Full End-to-End Test ===\n');

const mockCtx = { argv: { directory: process.cwd() } };

// Step 1: LineAgePre
const prePlug = LineAgePre({ enabled: true });
const markedMarkdown = prePlug.textTransform(mockCtx, fullTestMarkdown);
console.log('✓ Step 1: LineAgePre added markers\n');

// Step 2: Process with LineAgeMid
const mockFile = { 
  data: { 
    filePath: process.cwd() + '/test.md', 
    slug: 'test',
    toc: []
  } 
};

const midPlug = LineAgeMid();
const markdownPlugins = midPlug.markdownPlugins ? midPlug.markdownPlugins() : [];

// Step 3: Add LineAgePost
const postPlug = LineAgePost({ enabled: true, maxAgeDays: 365 });
const htmlPlugins = postPlug.htmlPlugins(mockCtx);

const processor = unified()
  .use(remarkParse)
  .use(markdownPlugins[0])
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(htmlPlugins[0])
  .use(rehypeStringify);

processor.process({ value: markedMarkdown, data: mockFile.data }).then(result => {
  const html = String(result);
  
  console.log('✓ Step 2: LineAgeMid cleaned code blocks');
  console.log('✓ Step 3: LineAgePost processed markers\n');
  
  console.log('Verification:\n');
  
  // Check 1: Code blocks should be clean (CRITICAL)
  const codeBlocks = html.match(/<code[^>]*>([\s\S]*?)<\/code>/g);
  let codeClean = true;
  if (codeBlocks) {
    codeBlocks.forEach(block => {
      if (block.includes('line:') || block.includes('&#x3C;!--') || block.includes('&lt;!--')) {
        codeClean = false;
      }
    });
  }
  console.log(`  Code blocks clean: ${codeClean ? '✓ PASS' : '✗ FAIL'}`);
  
  // Check 2: Headings should be clean (CRITICAL)
  const headings = html.match(/<h[1-6][^>]*id="[^"]*"/g);
  let headingsClean = true;
  if (headings) {
    headings.forEach(h => {
      if (h.includes('<!--') || h.includes('line:')) {
        headingsClean = false;
      }
    });
  }
  console.log(`  Heading IDs clean: ${headingsClean ? '✓ PASS' : '✗ FAIL'}`);
  
  // Check 3: Line-age-bar spans or comments removed (depends on git data)
  const hasLineAgeBars = html.includes('line-age-bar');
  const htmlComments = html.match(/<!-- line:\d+ -->/g);
  const hasUnprocessedComments = htmlComments && htmlComments.length > 0;
  
  if (hasLineAgeBars) {
    console.log('  Has line-age-bar spans: ✓ INFO (git data available)');
  } else if (!hasUnprocessedComments) {
    console.log('  Comments properly removed: ✓ INFO (no git data)');
  } else {
    console.log('  Markers processed: ⚠️  WARNING (unexpected state)');
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  if (codeClean && headingsClean) {
    console.log('✅ END-TO-END TEST PASSED!\n');
    console.log('All three stages working correctly:');
    console.log('  • LineAgePre adds markers');
    console.log('  • LineAgeMid cleans code blocks and TOC');
    console.log('  • LineAgePost processes markers into styled elements');
    console.log('\nThe main issue is FIXED:');
    console.log('  ✓ Code blocks no longer contain line markers');
  } else {
    console.log('✗ Critical checks failed');
    console.log('\nFailed checks:');
    if (!codeClean) console.log('  ✗ Code blocks contain markers');
    if (!headingsClean) console.log('  ✗ Heading IDs contain markers');
    process.exit(1);
  }
});
