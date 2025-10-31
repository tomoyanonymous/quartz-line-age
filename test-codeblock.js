import { LineAgePre, LineAgePost } from './dist/index.js';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeRaw from 'rehype-raw';

// Test markdown with code blocks
const markdownWithCodeBlocks = `# Test Document

Some text before the code block.

\`\`\`javascript
function hello() {
  console.log("Hello, world!");
}
\`\`\`

Some text after the code block.

\`\`\`python
def greet():
    print("Hello from Python!")
\`\`\`
`;

console.log('=== Testing code blocks with line markers ===\n');
console.log('Original markdown:');
console.log(markdownWithCodeBlocks);
console.log();

// Step 1: Apply LineAgePre
const mockCtx = { argv: { directory: process.cwd() } };
const prePlug = LineAgePre({ enabled: true });
const markedMarkdown = prePlug.textTransform(mockCtx, markdownWithCodeBlocks);

console.log('After LineAgePre (with markers):');
console.log(markedMarkdown);
console.log();

// Step 2: Convert to HTML
const mockFile = { data: { filePath: process.cwd() + '/test.md', slug: 'test' } };

const processor = unified()
  .use(remarkParse)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeStringify);

processor.process(markedMarkdown).then(result => {
  const htmlBeforePost = String(result);
  console.log('HTML before LineAgePost:');
  console.log(htmlBeforePost);
  console.log();
  
  // Check if markers are in code blocks
  const codeBlocksMatch = htmlBeforePost.match(/<code[^>]*>[\s\S]*?<\/code>/g);
  console.log('Code blocks found:', codeBlocksMatch ? codeBlocksMatch.length : 0);
  if (codeBlocksMatch) {
    codeBlocksMatch.forEach((block, i) => {
      console.log(`\nCode block ${i+1}:`);
      console.log(block);
      if (block.includes('<!-- line:')) {
        console.log('  ⚠️ Contains line markers!');
      }
    });
  }
});
