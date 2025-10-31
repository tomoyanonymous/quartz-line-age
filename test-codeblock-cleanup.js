import { LineAgePre, LineAgePost } from './dist/index.js';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeRaw from 'rehype-raw';

// Test markdown with various code blocks
const markdownWithCodeBlocks = `# Test Document

Regular text with a line.

\`\`\`javascript
function hello() {
  console.log("Hello, world!");
  return true;
}
\`\`\`

Another paragraph.

\`\`\`python
def greet(name):
    print(f"Hello, {name}!")
    return None
\`\`\`

Inline code: \`const x = 5;\`

\`\`\`typescript
interface User {
  name: string;
  age: number;
}
\`\`\`
`;

console.log('=== Code Block Cleanup Test ===\n');

// Step 1: Apply LineAgePre
const mockCtx = { argv: { directory: process.cwd() } };
const prePlug = LineAgePre({ enabled: true });
const markedMarkdown = prePlug.textTransform(mockCtx, markdownWithCodeBlocks);

// Step 2: Convert to HTML with LineAgePost
const mockFile = { data: { filePath: process.cwd() + '/test.md', slug: 'test' } };

const postPlug = LineAgePost({ enabled: true, maxAgeDays: 365 });
const htmlPlugins = postPlug.htmlPlugins(mockCtx);

const processor = unified()
  .use(remarkParse)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(htmlPlugins[0])
  .use(rehypeStringify);

processor.process({ value: markedMarkdown, data: mockFile.data }).then(result => {
  const finalHtml = String(result);
  
  console.log('Final HTML output:\n');
  console.log(finalHtml);
  console.log('\n' + '='.repeat(60) + '\n');
  
  let allPassed = true;
  
  // Test 1: Check code blocks
  const codeBlocksMatch = finalHtml.match(/<code[^>]*>[\s\S]*?<\/code>/g);
  console.log('Test 1: Code Blocks');
  console.log(`  Found ${codeBlocksMatch ? codeBlocksMatch.length : 0} code blocks`);
  
  if (codeBlocksMatch) {
    let hasMarker = false;
    codeBlocksMatch.forEach((block, i) => {
      if (block.includes('line:') || block.includes('&#x3C;!--') || block.includes('&lt;!--')) {
        console.log(`  ❌ Code block ${i+1} contains line markers!`);
        console.log(`     ${block.substring(0, 100)}...`);
        hasMarker = true;
        allPassed = false;
      }
    });
    if (!hasMarker) {
      console.log('  ✓ All code blocks are clean');
    }
  }
  
  // Test 2: Check headings
  const headingsMatch = finalHtml.match(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/g);
  console.log('\nTest 2: Headings');
  console.log(`  Found ${headingsMatch ? headingsMatch.length : 0} headings`);
  
  if (headingsMatch) {
    let hasMarker = false;
    headingsMatch.forEach((heading, i) => {
      if (heading.includes('line:') || heading.includes('<!--')) {
        console.log(`  ❌ Heading ${i+1} contains line markers!`);
        console.log(`     ${heading}`);
        hasMarker = true;
        allPassed = false;
      }
    });
    if (!hasMarker) {
      console.log('  ✓ All headings are clean');
    }
  }
  
  // Test 3: Check inline code
  const inlineCodeMatch = finalHtml.match(/<code>[\s\S]*?<\/code>/g);
  console.log('\nTest 3: Inline Code');
  console.log(`  Found ${inlineCodeMatch ? inlineCodeMatch.length : 0} inline code elements`);
  
  if (inlineCodeMatch) {
    let hasMarker = false;
    inlineCodeMatch.forEach((code, i) => {
      if (code.includes('line:') || code.includes('&#x3C;!--') || code.includes('&lt;!--')) {
        console.log(`  ❌ Inline code ${i+1} contains line markers!`);
        console.log(`     ${code}`);
        hasMarker = true;
        allPassed = false;
      }
    });
    if (!hasMarker) {
      console.log('  ✓ All inline code is clean');
    }
  }
  
  // Test 4: Check that regular comments are properly processed
  const regularComments = finalHtml.match(/<!-- line:\d+ -->/g);
  console.log('\nTest 4: Regular HTML Comments');
  if (regularComments && regularComments.length > 0) {
    console.log(`  ⚠️  Found ${regularComments.length} unprocessed HTML comments`);
    console.log('  (These should be converted to line-age-bar spans or removed)');
    // This is not necessarily an error if git blame data is not available
  } else {
    console.log('  ✓ No unprocessed HTML comments found');
  }
  
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('\n✓ All tests passed!');
  } else {
    console.log('\n✗ Some tests failed!');
    process.exit(1);
  }
});
