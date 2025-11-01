import { LineAgePre, LineAgeMid, LineAgePost } from './dist/index.js';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeRaw from 'rehype-raw';

// Test markdown with various code block types
const testMarkdown = `# Code Block Marker Removal Test

Regular text before code.

\`\`\`javascript
function example() {
  const x = 1;
  return x + 1;
}
\`\`\`

Text between code blocks.

\`\`\`python
def hello():
    print("world")
    return True
\`\`\`

Inline code: \`const y = 2;\`

\`\`\`typescript
interface Config {
  name: string;
  value: number;
}
\`\`\`

Final paragraph.
`;

console.log('=== Test: Line Marker Removal from Code Blocks ===\n');
console.log('This test verifies that LineAgeMid removes <!-- line:X --> markers');
console.log('from inside code blocks in the markdown tree.\n');

const mockCtx = { argv: { directory: process.cwd() } };

// Step 1: Apply LineAgePre
console.log('Step 1: Applying LineAgePre to add markers...');
const prePlug = LineAgePre({ enabled: true });
const markedMarkdown = prePlug.textTransform(mockCtx, testMarkdown);
console.log('✓ Markers added to all lines\n');

// Step 2: Process with LineAgeMid
console.log('Step 2: Processing with LineAgeMid to clean code blocks...');
const mockFile = { 
  data: { 
    filePath: process.cwd() + '/test.md', 
    slug: 'test',
    toc: []
  } 
};

const midPlug = LineAgeMid();
const markdownPlugins = midPlug.markdownPlugins ? midPlug.markdownPlugins() : [];

const processor = unified()
  .use(remarkParse)
  .use(markdownPlugins[0])
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeStringify);

processor.process({ value: markedMarkdown, data: mockFile.data }).then(result => {
  const html = String(result);
  
  console.log('✓ Markdown processed with LineAgeMid\n');
  
  console.log('Step 3: Verifying results...\n');
  
  // Extract all code blocks
  const codeBlocks = html.match(/<code[^>]*>([\s\S]*?)<\/code>/g);
  
  if (!codeBlocks) {
    console.log('✗ ERROR: No code blocks found!');
    process.exit(1);
  }
  
  console.log(`Found ${codeBlocks.length} code block(s)\n`);
  
  let allClean = true;
  let errorCount = 0;
  
  codeBlocks.forEach((block, i) => {
    const blockNum = i + 1;
    
    // Check for any form of line marker (escaped or not)
    const hasEscapedMarker = block.includes('&#x3C;!-- line:') || 
                             block.includes('&lt;!-- line:');
    const hasUnescapedMarker = block.includes('<!-- line:');
    
    if (hasEscapedMarker || hasUnescapedMarker) {
      console.log(`❌ Code block ${blockNum}: CONTAINS LINE MARKERS`);
      console.log(`   ${block.substring(0, 100)}...`);
      allClean = false;
      errorCount++;
    } else {
      console.log(`✓ Code block ${blockNum}: Clean`);
    }
  });
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  if (allClean) {
    console.log('✅ SUCCESS! All code blocks are clean.');
    console.log(`   ${codeBlocks.length} code block(s) verified - no line markers found.\n`);
    console.log('The issue is fixed: LineAgeMid successfully removes markers');
    console.log('from code blocks before they are converted to HTML.');
  } else {
    console.log(`✗ FAILURE! ${errorCount} code block(s) still contain markers.\n`);
    console.log('Full HTML output:');
    console.log(html);
    process.exit(1);
  }
});
