import { LineAgePre, LineAgeMid, LineAgePost } from './dist/index.js';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeRaw from 'rehype-raw';

const markdownWithCode = `# Test

\`\`\`javascript
function hello() {
  console.log("test");
}
\`\`\`
`;

console.log('=== Testing with LineAgeMid ===\n');

const mockCtx = { argv: { directory: process.cwd() } };
const prePlug = LineAgePre({ enabled: true });
const markedMarkdown = prePlug.textTransform(mockCtx, markdownWithCode);

const mockFile = { data: { filePath: process.cwd() + '/test.md', slug: 'test', toc: [] } };

// Get LineAgeMid plugin
const midPlug = LineAgeMid();
const markdownPlugins = midPlug.markdownPlugins ? midPlug.markdownPlugins() : [];

// Process with LineAgeMid
const processor = unified()
  .use(remarkParse)
  .use(markdownPlugins[0])
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeStringify);

processor.process({ value: markedMarkdown, data: mockFile.data }).then(result => {
  const html = String(result);
  
  console.log('After markdown processing with LineAgeMid:');
  console.log(html);
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Check if markers are still in code blocks
  if (html.includes('line:') && html.includes('<code')) {
    console.log('⚠️  Line markers STILL found in code blocks!');
    
    const codeMatch = html.match(/<code[^>]*>[\s\S]*?<\/code>/g);
    if (codeMatch) {
      codeMatch.forEach((block, i) => {
        if (block.includes('line:')) {
          console.log(`\nCode block ${i+1}:`);
          console.log(block);
        }
      });
    }
  } else {
    console.log('✓ No line markers in code blocks!');
  }
});
