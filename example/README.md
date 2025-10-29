# Quartz Line Age Example

This directory contains a working example demonstrating the `quartz-line-age` plugin.

## Quick Start with Real Quartz

To use this example with a real Quartz installation:

1. **Clone Quartz** (if you haven't already):
   ```bash
   git clone https://github.com/jackyzha0/quartz.git my-quartz-site
   cd my-quartz-site
   npm install
   ```

2. **Install the line-age plugin**:
   ```bash
   npm install quartz-line-age
   ```
   
   Or for local development:
   ```bash
   npm install /path/to/quartz-line-age
   ```

3. **Copy the example content**:
   ```bash
   cp -r /path/to/quartz-line-age/example/content/* content/
   ```

4. **Update your `quartz.config.ts`**:
   ```typescript
   import { QuartzConfig } from "./quartz/cfg"
   import * as Plugin from "./quartz/plugins"
   import { LineAge } from "quartz-line-age"

   const config: QuartzConfig = {
     plugins: {
       transformers: [
         Plugin.FrontMatter(),
         Plugin.CreatedModifiedDate({
           priority: ["frontmatter", "filesystem"],
         }),
         Plugin.SyntaxHighlighting(),
         Plugin.ObsidianFlavoredMarkdown(),
         Plugin.GitHubFlavoredMarkdown(),
         Plugin.TableOfContents(),
         Plugin.CrawlLinks(),
         Plugin.Description(),
         Plugin.Latex(),
         
         // Add LineAge plugin
         LineAge({
           enabled: true,
           maxAgeDays: 365,
           freshColor: { r: 34, g: 197, b: 94 },
           oldColor: { r: 156, g: 163, b: 175 },
         }),
       ],
       // ... rest of config
     },
   }
   ```

5. **Build and view**:
   ```bash
   npx quartz build --serve
   ```

## Using the Standalone Demo

For a quick demonstration without Quartz, use the standalone test:

```bash
cd /path/to/quartz-line-age
npm run build
node example/demo.js
```

This will process the example markdown files and show the transformation results.

## What to Expect

When you build the site with the plugin enabled, you'll see:

1. **Colored bars** on the left side of each line
2. **Green bars** for recently updated content (0-90 days)
3. **Yellow/orange bars** for moderately aged content (90-270 days)
4. **Gray bars** for older content (270+ days)

The colors use a power function gradient (x^(1/2.3)) to make recent changes more visually prominent.

## Example Content

The `content/` directory contains sample markdown files that demonstrate:

- Basic markdown formatting
- Code blocks
- Lists and nested elements
- Multiple sections with different ages

## Configuration Options

- `enabled` (boolean): Enable/disable the plugin
- `maxAgeDays` (number): Maximum age in days for the gradient (default: 365)
- `freshColor` (RGBColor): RGB color for newest lines (default: green-500)
- `oldColor` (RGBColor): RGB color for oldest lines (default: gray-400)

## Advanced Usage

You can also use the two plugins separately for more control:

```typescript
import { LineAgePre, LineAgePost } from "quartz-line-age"

transformers: [
  // Early in the pipeline
  LineAgePre({ enabled: true }),
  
  // ... other markdown transformers
  Plugin.FrontMatter(),
  Plugin.ObsidianFlavoredMarkdown(),
  // ...
  
  // After HTML conversion
  LineAgePost({
    enabled: true,
    maxAgeDays: 365,
    freshColor: { r: 34, g: 197, b: 94 },
    oldColor: { r: 156, g: 163, b: 175 },
  }),
]
```

## Troubleshooting

### No colored bars appearing

- Make sure the content files are tracked in git
- Commit some changes to create git history
- Check that git blame works: `git blame content/index.md`

### Colors look wrong

- Adjust `freshColor` and `oldColor` in the configuration
- Try different `maxAgeDays` values to change the gradient

### Build errors

- Ensure you've built the plugin: `npm run build` in the plugin directory
- Check that all dependencies are installed
- Verify the import path matches your setup

## More Information

- [Plugin Documentation](../README.md)
- [Quartz Documentation](https://quartz.jzhao.xyz/)
- [GitHub Repository](https://github.com/tomoyanonymous/quartz-line-age)
