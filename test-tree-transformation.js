// Test the tree transformation functionality
import { LineAge } from './dist/index.js';
import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeStringify from 'rehype-stringify';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Testing LineAge tree transformation...\n');

// Create a simple HTML with code block
const inputHtml = `
<html>
<body>
<pre><code>function hello() {
  console.log("Hello, World!");
}
</code></pre>
</body>
</html>
`;

// Create a mock file object
const mockFile = {
  data: {
    filePath: __dirname + '/test-file.md',
    slug: 'test-file'
  }
};

// Create a mock context
const mockCtx = {
  argv: {
    directory: __dirname
  }
};

// Create the plugin instance
const plugin = LineAge({
  enabled: true,
  maxAgeDays: 365,
  freshColor: { r: 34, g: 197, b: 94 },
  oldColor: { r: 156, g: 163, b: 175 }
});

// Get the HTML plugins
const htmlPlugins = plugin.htmlPlugins(mockCtx);

async function testTransformation() {
  try {
    // Parse the HTML
    const processor = unified()
      .use(rehypeParse, { fragment: true })
      .use(htmlPlugins[0])
      .use(rehypeStringify);

    const result = await processor.process({ value: inputHtml, data: mockFile.data });
    const outputHtml = String(result);
    
    console.log('Input HTML:');
    console.log(inputHtml);
    console.log('\nOutput HTML:');
    console.log(outputHtml);
    
    // Check if the transformation was applied
    if (outputHtml.includes('line-age-wrapper') && outputHtml.includes('line-age-bar')) {
      console.log('\n✓ Transformation applied successfully!');
      console.log('✓ Found line-age-wrapper elements');
      console.log('✓ Found line-age-bar elements');
      
      // Check if colors are included
      if (outputHtml.includes('background-color: rgb(')) {
        console.log('✓ Color styling applied');
      }
      
      return true;
    } else {
      console.log('\n✗ Transformation not applied properly');
      console.log('Expected to find line-age-wrapper and line-age-bar classes');
      return false;
    }
  } catch (error) {
    console.error('Error during transformation:', error);
    return false;
  }
}

testTransformation().then(success => {
  if (success) {
    console.log('\n✓ All tests passed!');
    process.exit(0);
  } else {
    console.log('\n✗ Tests failed!');
    process.exit(1);
  }
});
