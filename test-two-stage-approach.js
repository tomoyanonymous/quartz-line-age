// Test the two-stage approach: LineAgePre and LineAgePost
import { LineAgePre, LineAgePost } from './dist/index.js';
import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeStringify from 'rehype-stringify';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Testing two-stage approach (LineAgePre + LineAgePost)...\n');

// Sample markdown content
const inputMarkdown = `# Hello World

This is a test document.
It has multiple lines.

## Code Example

Some text here.`;

console.log('Original Markdown:');
console.log(inputMarkdown);
console.log('\n' + '='.repeat(50) + '\n');

// Mock context and file
const mockCtx = {
  argv: {
    directory: __dirname
  }
};

const mockFile = {
  data: {
    filePath: __dirname + '/test-file.md',
    slug: 'test-file'
  }
};

async function testTwoStageApproach() {
  try {
    // Stage 1: Apply LineAgePre (text transformation)
    const prePlug = LineAgePre({
      enabled: true
    });

    const transformedMarkdown = prePlug.textTransform(mockCtx, inputMarkdown);
    
    console.log('After LineAgePre (with markers):');
    console.log(transformedMarkdown);
    console.log('\n' + '='.repeat(50) + '\n');

    // Check if markers were inserted
    if (!transformedMarkdown.includes('{{-line:')) {
      console.log('✗ LineAgePre failed to insert markers');
      return false;
    }
    console.log('✓ LineAgePre inserted line markers successfully');

    // Stage 2: Process through markdown -> HTML with LineAgePost
    const postPlug = LineAgePost({
      enabled: true,
      maxAgeDays: 365,
    });

    const htmlPlugins = postPlug.htmlPlugins(mockCtx);

    const processor = unified()
      .use(remarkParse)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(htmlPlugins[0])
      .use(rehypeStringify, { allowDangerousHtml: true });

    const result = await processor.process({
      value: transformedMarkdown,
      data: mockFile.data
    });
    
    const outputHtml = String(result);
    
    console.log('After LineAgePost (HTML output):');
    console.log(outputHtml);
    console.log('\n' + '='.repeat(50) + '\n');

    // Check if the output contains line-age elements
    if (outputHtml.includes('line-age-bar')) {
      console.log('✓ LineAgePost created line-age bars successfully');
      
      // Check if markers are removed
      if (!outputHtml.includes('{{-line:')) {
        console.log('✓ Line markers were removed/processed');
      } else {
        console.log('⚠ Line markers still present in output');
      }
      
      // Check if colors are applied
      if (outputHtml.includes('background-color: rgb(')) {
        console.log('✓ Color styling applied');
      }
      
      // Check that line-age-container is NOT present (removed)
      if (!outputHtml.includes('line-age-container')) {
        console.log('✓ No line-age-container wrapper (as expected)');
      }
      
      return true;
    } else {
      console.log('✗ LineAgePost failed to create proper structure');
      return false;
    }
    
  } catch (error) {
    console.error('Error during test:', error);
    return false;
  }
}

testTwoStageApproach().then(success => {
  if (success) {
    console.log('\n✓ Two-stage approach test passed!');
    process.exit(0);
  } else {
    console.log('\n✗ Two-stage approach test failed!');
    process.exit(1);
  }
});
