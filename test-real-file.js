import { LineAgePre, LineAgePost } from './dist/index.js';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeRaw from 'rehype-raw';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Use the actual README.md file
const filePath = resolve(process.cwd(), 'README.md');
const markdown = readFileSync(filePath, 'utf-8');

console.log('=== Testing with README.md (has git history) ===\n');
console.log('Processing', filePath);

// Step 1: Apply LineAgePre
const mockCtx = { argv: { directory: process.cwd() } };
const prePlug = LineAgePre({ enabled: true });
const markedMarkdown = prePlug.textTransform(mockCtx, markdown);

// Step 2: Convert to HTML with LineAgePost
const mockFile = { data: { filePath: filePath, slug: 'README' } };

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
  
  // Check for line-age-bar spans (should be present with git data)
  const lineAgeBars = finalHtml.match(/<span class="line-age-bar"/g);
  console.log('\n✓ Line age bars found:', lineAgeBars ? lineAgeBars.length : 0);
  
  // Check code blocks
  const codeBlocksMatch = finalHtml.match(/<code[^>]*>[\s\S]*?<\/code>/g);
  console.log('✓ Code blocks found:', codeBlocksMatch ? codeBlocksMatch.length : 0);
  
  let allClean = true;
  if (codeBlocksMatch) {
    codeBlocksMatch.forEach((block, i) => {
      if (block.includes('line:') || block.includes('&#x3C;!--') || block.includes('&lt;!--')) {
        console.log(`  ❌ Code block ${i+1} contains line markers!`);
        allClean = false;
      }
    });
  }
  
  if (allClean) {
    console.log('✓ All code blocks are clean (no line markers)');
  }
  
  // Check that regular text has line age bars (not inside code blocks)
  const hasLineAgeBars = lineAgeBars && lineAgeBars.length > 0;
  console.log('✓ Git blame data applied:', hasLineAgeBars ? 'YES' : 'NO');
  
  if (hasLineAgeBars && allClean) {
    console.log('\n✓ All checks passed! Line markers are properly removed from code blocks.');
  }
});
