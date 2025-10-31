import { LineAgePre, LineAgePost } from './dist/index.js';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeRaw from 'rehype-raw';

// Test horizontal rules with proper spacing
const markdownWithHRVariants = `# Horizontal Rule Test

Paragraph before first rule.

---

Paragraph after first rule.

***

Paragraph after asterisks rule.

___

Paragraph after underscores rule.

- - -

Paragraph after spaced hyphens.

* * *

Final text.
`;

console.log('=== Testing Horizontal Rules with Proper Spacing ===\n');

// Step 1: Apply LineAgePre
const mockCtx = { argv: { directory: process.cwd() } };
const prePlug = LineAgePre({ enabled: true });
const markedMarkdown = prePlug.textTransform(mockCtx, markdownWithHRVariants);

// Step 2: Convert to HTML
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
  
  // Check for <hr> tags
  const hrMatches = finalHtml.match(/<hr>/g);
  console.log('Expected: 5 horizontal rules');
  console.log('Found:', hrMatches ? hrMatches.length : 0, '<hr> tags');
  
  if (hrMatches && hrMatches.length === 5) {
    console.log('\n✓ All horizontal rules properly rendered!');
  } else {
    console.log('\n❌ Issue detected');
    console.log('\nHTML output:');
    console.log(finalHtml);
  }
});
