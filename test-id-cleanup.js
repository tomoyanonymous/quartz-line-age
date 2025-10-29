import { LineAgePost } from './dist/index.js';
import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeStringify from 'rehype-stringify';

// Simulate HTML that already has IDs with comment markers
// This is what would happen if IDs were generated before our plugin runs
const htmlWithBadIds = `<h1 id="hello-world<!-- line:1 -->">Hello World<!-- line:1 --></h1>
<!-- line:2 -->
<h2 id="section-one<!-- line:3 -->">Section One<!-- line:3 --></h2>
<p>Content here<!-- line:4 --></p>
<a href="#hello-world<!-- line:1 -->">Link to Hello</a>`;

console.log('HTML before cleanup:');
console.log(htmlWithBadIds);
console.log();

const mockCtx = { argv: { directory: process.cwd() } };
const mockFile = { data: { filePath: process.cwd() + '/test.md', slug: 'test' } };

const postPlug = LineAgePost({ enabled: true, maxAgeDays: 365 });
const htmlPlugins = postPlug.htmlPlugins(mockCtx);

const processor = unified()
  .use(rehypeParse, { fragment: true })
  .use(htmlPlugins[0])
  .use(rehypeStringify);

processor.process({ value: htmlWithBadIds, data: mockFile.data }).then(result => {
  const html = String(result);
  console.log('HTML after cleanup:');
  console.log(html);
  console.log();
  
  // Check if markers are in IDs or hrefs
  const hasMarkerInId = html.match(/id="[^"]*<!--[^"]*"/);
  const hasMarkerInHref = html.match(/href="[^"]*<!--[^"]*"/);
  
  console.log('✓ Checks:');
  console.log('  Has marker in ID:', !!hasMarkerInId, hasMarkerInId ? '✗' : '✓');
  console.log('  Has marker in href:', !!hasMarkerInHref, hasMarkerInHref ? '✗' : '✓');
  console.log('  Comments converted to spans:', html.includes('line-age-bar') ? '✓' : '✗');
});
