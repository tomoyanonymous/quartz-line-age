---
title: Welcome to Line Age Demo
date: 2024-01-15
---

# Welcome to the Line Age Demo

This is a demonstration of the `quartz-line-age` plugin for Quartz.

## What is Line Age?

Line age visualization shows when each line in your content was last modified, using git blame data.

## Features

The plugin provides:

1. **Two-stage transformation** - Processes content before and after markdown conversion
2. **Git integration** - Uses git blame to determine line ages
3. **Customizable colors** - Configure gradient colors to match your theme
4. **Power function gradient** - Uses x^(1/2.3) for more pronounced recent changes

## How It Works

### Stage 1: LineAgePre

Before markdown processing, the plugin inserts metadata markers at the beginning of each line.

### Stage 2: LineAgePost

After HTML conversion, markers are transformed into styled elements with colored bars indicating line age.

## Installation

```bash
npm install quartz-line-age
```

## Configuration

Add to your `quartz.config.ts`:

```typescript
import { LineAge } from "quartz-line-age"

export default {
  plugins: {
    transformers: [
      LineAge({
        enabled: true,
        maxAgeDays: 365,
        freshColor: { r: 34, g: 197, b: 94 },
        oldColor: { r: 156, g: 163, b: 175 },
      }),
    ],
  },
}
```

## Example Content

This paragraph was written recently and should have a green bar.

This paragraph is a bit older and might show a different color.

Here's some content that was added later in the document's history.

### Code Blocks

The plugin also works with code blocks:

```javascript
function calculateAge(commitTime) {
  const now = Date.now() / 1000;
  const ageSeconds = now - commitTime;
  return ageSeconds / (60 * 60 * 24);
}
```

### Lists

It works with lists too:

- First item added initially
- Second item added later  
- Third item added most recently

## Color Gradient

The visualization uses a power function for the color gradient:

```
normalized_age = min(age_days, max_age_days) / max_age_days
adjusted_age = normalized_age ^ (1/2.3)
color = interpolate(fresh_color, old_color, adjusted_age)
```

This makes recent changes more visually prominent than linear interpolation would.

## Benefits

Using this plugin helps you:

- Identify outdated content that needs updating
- See which parts of your documentation are actively maintained
- Understand the age distribution of your content at a glance
- Track content freshness over time

## More Information

For more details, check out the [GitHub repository](https://github.com/tomoyanonymous/quartz-line-age).

---

*Last updated: January 2024*
