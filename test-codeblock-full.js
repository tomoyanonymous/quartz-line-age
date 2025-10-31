import { LineAgePre, LineAgePost } from './dist/index.js';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeParse from 'rehype-parse';
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
`;

console.log('=== Full pipeline test ===\n');

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
  console.log('Final HTML after LineAgePost:');
  console.log(finalHtml);
  console.log();
  
  // Check if markers are in code blocks
  const codeBlocksMatch = finalHtml.match(/<code[^>]*>[\s\S]*?<\/code>/g);
  console.log('Code blocks found:', codeBlocksMatch ? codeBlocksMatch.length : 0);
  if (codeBlocksMatch) {
    codeBlocksMatch.forEach((block, i) => {
      console.log(`\nCode block ${i+1}:`);
      console.log(block);
      if (block.includes('line:')) {
        console.log('  ❌ PROBLEM: Contains line markers!');
      } else {
        console.log('  ✓ Clean - no markers');
      }
    });
  }
  
  // Check headings
  const headingsMatch = finalHtml.match(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/g);
  console.log('\n\nHeadings found:', headingsMatch ? headingsMatch.length : 0);
  if (headingsMatch) {
    headingsMatch.forEach((heading, i) => {
      console.log(`\nHeading ${i+1}:`);
      console.log(heading);
      if (heading.includes('line:')) {
        console.log('  ❌ PROBLEM: Contains line markers!');
      } else {
        console.log('  ✓ Clean - no markers');
      }
    });
  }
});
