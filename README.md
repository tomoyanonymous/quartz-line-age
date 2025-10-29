# Quartz Line Age

A Quartz plugin that displays line authoring age visualization, similar to the Obsidian Git plugin's [Line Authoring](https://publish.obsidian.md/git-doc/Line+Authoring) feature.

## Features

- 🎨 Visual line age indicators with color gradients
- 🟢 Green bars for recently updated lines
- ⚪ Gradually fades to gray over 1 year
- 🔍 Uses git blame to determine line ages
- ⚡ Lightweight and performant

## Preview

![Line Age Visualization Demo](https://github.com/user-attachments/assets/efdeae97-0c97-47da-a47b-a9ed261ec553)

Each line in your code or content will have a small colored bar on the left side:
- **Green** (rgb(34, 197, 94)) - Just updated (fresh)
- **Gray** (rgb(156, 163, 175)) - Over 1 year old (stale)

The color smoothly transitions between these two states based on the age of the line.

## Installation

For Quartz v4:

```bash
npm install quartz-line-age
```

## Usage

The plugin uses a two-stage approach to add line age visualization:
1. **LineAgePre** - Runs before markdown processing and inserts metadata markers
2. **LineAgePost** - Runs after HTML conversion and transforms markers into styled elements

### Simple Usage (Combined Plugin)

Add the plugin to your `quartz.config.ts`:

```typescript
import { QuartzConfig } from "./quartz/cfg"
import { LineAge } from "quartz-line-age"

const config: QuartzConfig = {
  plugins: {
    transformers: [
      // ... other transformers (before LineAge)
      LineAge({
        enabled: true,      // Enable/disable the plugin
        maxAgeDays: 365,    // Maximum age in days for gradient (default: 365)
        freshColor: { r: 34, g: 197, b: 94 },   // Color for newest lines (default: green-500)
        oldColor: { r: 156, g: 163, b: 175 },   // Color for oldest lines (default: gray-400)
      }),
      // ... other transformers (after LineAge)
    ],
  },
}

export default config
```

### Advanced Usage (Separate Plugins)

For more control over the transformation stages, you can use `LineAgePre` and `LineAgePost` separately:

```typescript
import { QuartzConfig } from "./quartz/cfg"
import { LineAgePre, LineAgePost } from "quartz-line-age"

const config: QuartzConfig = {
  plugins: {
    transformers: [
      // Run LineAgePre early in the transformation pipeline
      LineAgePre({ enabled: true }),
      
      // ... other markdown transformers
      Plugin.FrontMatter(),
      Plugin.GitHubFlavoredMarkdown(),
      // ...
      
      // Run LineAgePost after HTML conversion
      LineAgePost({
        enabled: true,
        maxAgeDays: 365,
        freshColor: { r: 34, g: 197, b: 94 },
        oldColor: { r: 156, g: 163, b: 175 },
      }),
    ],
  },
}

export default config
```

### Options

- `enabled` (boolean, default: `true`) - Enable or disable the line age visualization
- `maxAgeDays` (number, default: `365`) - Maximum age in days for the color gradient. Lines older than this will show as completely gray.
- `freshColor` (RGBColor, default: `{ r: 34, g: 197, b: 94 }`) - RGB color for the newest/freshest lines (default is green-500)
- `oldColor` (RGBColor, default: `{ r: 156, g: 163, b: 175 }`) - RGB color for the oldest/stale lines (default is gray-400)

### Color Customization Examples

```typescript
// Blue to red gradient
LineAge({
  freshColor: { r: 59, g: 130, b: 246 },   // blue-500
  oldColor: { r: 239, g: 68, b: 68 },      // red-500
})

// Purple to yellow gradient
LineAge({
  freshColor: { r: 168, g: 85, b: 247 },   // purple-500
  oldColor: { r: 234, g: 179, b: 8 },      // yellow-500
})

// Custom monochrome (dark to light)
LineAge({
  freshColor: { r: 17, g: 24, b: 39 },     // slate-900
  oldColor: { r: 226, g: 232, b: 240 },    // slate-200
})
```

## Styling

Include the CSS in your Quartz theme or add it to your custom CSS:

```css
@import "quartz-line-age/dist/line-age.css";
```

Or import the CSS file directly in your Quartz configuration.

### Customization

You can customize the appearance by overriding the CSS classes:

```css
.line-age-bar {
  width: 6px;           /* Adjust bar width */
  border-radius: 3px;   /* Adjust corner radius */
}

.line-age-wrapper:hover .line-age-bar {
  width: 8px;           /* Adjust hover width */
}
```

## How It Works

1. The plugin uses `git blame` to determine when each line was last modified
2. It calculates the age of each line in days
3. Based on the age, it computes a color between green (fresh) and gray (old)
4. A small colored bar is added to the left of each line

The color calculation formula:
```
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

## License

MIT

## Credits

Inspired by the [Obsidian Git plugin's Line Authoring feature](https://publish.obsidian.md/git-doc/Line+Authoring).