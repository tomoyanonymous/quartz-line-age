import { LineAgePre, LineAgeMid, LineAgePost } from './dist/index.js';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeRaw from 'rehype-raw';

// Simulate what happens when syntax highlighting splits the marker
const markdownWithCode = `# Test

\`\`\`javascript
function hello() {
  console.log("test");
}
\`\`\`
`;

console.log('=== Testing Line Marker Cleanup in Code Blocks ===\n');

// Step 1: Apply LineAgePre
const mockCtx = { argv: { directory: process.cwd() } };
const prePlug = LineAgePre({ enabled: true });
const markedMarkdown = prePlug.textTransform(mockCtx, markdownWithCode);

console.log('After LineAgePre (marked markdown):');
console.log(markedMarkdown);
console.log('\n' + '='.repeat(60) + '\n');

// Step 2: Process through markdown (without LineAgePost to see the problem)
const mockFile = { data: { filePath: process.cwd() + '/test.md', slug: 'test', toc: [] } };

// First without LineAgeMid to see the problem
const processor1 = unified()
  .use(remarkParse)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeStringify);

processor1.process({ value: markedMarkdown, data: mockFile.data }).then(result => {
  const htmlBeforeLineAgePost = String(result);
  
  console.log('After markdown processing (before LineAgePost):');
  console.log(htmlBeforeLineAgePost);
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Check if markers are in code blocks
  if (htmlBeforeLineAgePost.includes('line:') && htmlBeforeLineAgePost.includes('<code')) {
    console.log('⚠️  Line markers found in output - these need to be cleaned up!');
    
    // Show where they are
    const codeMatch = htmlBeforeLineAgePost.match(/<code[^>]*>[\s\S]*?<\/code>/g);
    if (codeMatch) {
      codeMatch.forEach((block, i) => {
        if (block.includes('line:')) {
          console.log(`\nCode block ${i+1} contains marker:`);
          console.log(block);
        }
      });
    }
  }
});
