# Quartz Line Age Plugin

A [Quartz](https://quartz.jzhao.xyz/) plugin that displays line authoring age visualization, inspired from the [Telomere feature in Cosense(Scrapbox)](https://scrapbox.io/shokai/%E3%83%86%E3%83%AD%E3%83%A1%E3%82%A2) and Obsidian Git plugin's [Line Authoring](https://publish.obsidian.md/git-doc/Line+Authoring) feature.

## Preview

See **<https://garden.matsuuratomoya.com>** .

## Installation

In your quartz directory,

```bash
npm install quartz-line-age
```

## Usage

The plugin is separated into 3 stages

1. **LineAgePre** - Runs before markdown processing and inserts metadata markers
1. **LineAgeMid** - Runs after toc is generated, and removed unnecessary html comments from them.
1. **LineAgePost** - Runs after HTML conversion and transforms markers into styled elements

### Usage

You need to add `LineAgePre`, `LineAgeMid` and `LineAgePost` plugins separately.

`LineAgePre` should be added as a first plugin, `LineAgeMid` should be placed right after `Plugin.Toc()`, `LineAgePost` should be added right after markdown processor.

```typescript
import { QuartzConfig } from "./quartz/cfg";
import { LineAgePre, LineAgeMid, LineAgePost } from "quartz-line-age";

const config: QuartzConfig = {
  plugins: {
    transformers: [
      LineAgePre(),
      //... ,
      Plugin.TableOfContents(),
      LineAgeMid(),
      Plugin.FrontMatter(),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      //... ,
      LineAgePost({
        maxAgeDays: 365,
        freshColor: { r: 34, g: 197, b: 94 },
        oldColor: { r: 156, g: 163, b: 175 },
      }),
      // ...
    ],
  },
};

export default config;
```

### Options

- `enabled` (boolean, default: `true`) - Enable or disable the line age visualization
- `maxAgeDays` (number, default: `365`) - Maximum age in days for the color gradient. Lines older than this will show as completely gray.
- `freshColor` (RGBColor, default: `{ r: 34, g: 197, b: 94 }`) - RGB color for the newest/freshest lines (default is green-500)
- `oldColor` (RGBColor, default: `{ r: 156, g: 163, b: 175 }`) - RGB color for the oldest/stale lines (default is gray-400)


## Styling

Include the CSS in your Quartz theme or add it to custom SCSS:

```scss
@use "quartz-line-age/dist/line-age.css";
```


### Customization

You can customize the appearance by overriding the CSS classes:

```css
.line-age-bar {
  width: 6px; /* Adjust bar width */
  border-radius: 3px; /* Adjust corner radius */
}

.line-age-wrapper:hover .line-age-bar {
  width: 8px; /* Adjust hover width */
}
```

## How It Works

1. The plugin uses `git blame` to determine when each line was last modified
2. It calculates the age of each line in days
3. Based on the age, it computes a color between green (fresh) and gray (old)
4. A small colored bar is added to the left of each line

The color calculation formula:

```js
age_ratio = min(age_in_days / max_age_days, 1.0)
color = interpolate(green, gray, age_ratio)
```

## Examples

### Standalone Demo

See [example.html](./example.html) for a standalone demonstration of the line age visualization.

You can open it directly in your browser:

```bash
# Serve the example locally
python3 -m http.server 8080
# Then open http://localhost:8080/example.html
```

### Command Line Demo

Run the included demo script to see the color calculations:

```bash
node demo.js
```

This will show:

- Color gradient for different ages (0-365+ days)
- Git blame analysis of the demo file itself
- Color values for each line

### Integration Test

Test the git blame integration on real files:

```bash
node test-integration.js
```

This demonstrates the actual git integration working on committed files.

### Integration Example

See [example-usage.js](./example-usage.js) for a complete example of how to integrate this plugin with your Quartz configuration.

## Requirements

- Quartz v4.x
- Git repository (for blame information)
- Node.js 16+

## Development

```bash
# Install dependencies
npm install

# Build the plugin
npm run build

# Run tests
node test-integration.js
node test-path-handling.js
node demo.js
```

