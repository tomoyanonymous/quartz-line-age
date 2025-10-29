# Quartz Line Age

A Quartz plugin that displays line authoring age visualization, similar to the Obsidian Git plugin's [Line Authoring](https://publish.obsidian.md/git-doc/Line+Authoring) feature.

## Features

- 🎨 Visual line age indicators with color gradients
- 🟢 Green bars for recently updated lines
- ⚪ Gradually fades to gray over 1 year
- 🔍 Uses git blame to determine line ages
- ⚡ Lightweight and performant

## Preview

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

Add the plugin to your `quartz.config.ts`:

```typescript
import { QuartzConfig } from "./quartz/cfg"
import { LineAge } from "quartz-line-age"

const config: QuartzConfig = {
  plugins: {
    transformers: [
      // ... other transformers
      LineAge({
        enabled: true,      // Enable/disable the plugin
        maxAgeDays: 365,    // Maximum age in days for gradient (default: 365)
      }),
    ],
  },
}

export default config
```

### Options

- `enabled` (boolean, default: `true`) - Enable or disable the line age visualization
- `maxAgeDays` (number, default: `365`) - Maximum age in days for the color gradient. Lines older than this will show as completely gray.

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

## Example

See [example.html](./example.html) for a standalone demonstration of the line age visualization.

Open it in your browser to see how the colored bars look in action.

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

# Test (when tests are added)
npm test
```

## License

MIT

## Credits

Inspired by the [Obsidian Git plugin's Line Authoring feature](https://publish.obsidian.md/git-doc/Line+Authoring).