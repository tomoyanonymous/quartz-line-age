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

console.log('=== Verification Test ===\n');

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
  
  console.log('Final HTML:');
  console.log(html);
  console.log('\n' + '='.repeat(60) + '\n');
  
  // More precise checks
  const codeMatch = html.match(/<code[^>]*>([\s\S]*?)<\/code>/g);
  
  let hasMarkerInCode = false;
  if (codeMatch) {
    codeMatch.forEach((block, i) => {
      // Check for escaped or unescaped markers
      if (block.includes('&#x3C;!-- line:') || block.includes('&lt;!-- line:') || block.includes('<!-- line:')) {
        console.log(`❌ Code block ${i+1} contains escaped/unescaped markers:`);
        console.log(block);
        console.log();
        hasMarkerInCode = true;
      }
    });
  }
  
  if (!hasMarkerInCode && codeMatch && codeMatch.length > 0) {
    console.log('✓ SUCCESS! Code blocks are clean - no line markers found!');
    console.log(`  Verified ${codeMatch.length} code block(s)`);
  } else if (hasMarkerInCode) {
    console.log('✗ FAILED! Line markers still present in code blocks');
    process.exit(1);
  }
});
