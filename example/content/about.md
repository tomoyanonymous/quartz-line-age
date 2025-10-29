---
title: About This Demo
date: 2024-02-01
---

# About This Demo

This is an example site demonstrating the `quartz-line-age` plugin.

## Purpose

The purpose of this demo is to show how the line age visualization works in a real Quartz site. Each line in this markdown file will have a colored bar indicating when it was last modified.

## Technical Details

The plugin operates in two stages:

1. **Pre-processing**: Inserts `{{-line:N-}}` markers into the markdown source
2. **Post-processing**: Transforms markers into `<div class="line-age-container">` elements

## Color Coding

The color gradient is calculated using a power function:

```
age_ratio = (age_in_days / max_age_days) ^ (1/2.3)
color = interpolate(fresh_color, old_color, age_ratio)
```

This formula is inspired by the Obsidian Git plugin's line authoring feature.

## Default Colors

- **Fresh (Green)**: rgb(34, 197, 94) - tailwind green-500
- **Old (Gray)**: rgb(156, 163, 175) - tailwind gray-400

## Benefits

Using this plugin helps you:

- Identify outdated content that needs updating
- See which parts of your documentation are actively maintained
- Understand the age distribution of your content at a glance

## Try It Out

Edit this file, commit the changes, and rebuild the site to see the line age bars update!

## Custom Configuration

You can customize the colors and age threshold:

```typescript
LineAge({
  enabled: true,
  maxAgeDays: 180,  // 6 months instead of 1 year
  freshColor: { r: 59, g: 130, b: 246 },  // blue-500
  oldColor: { r: 239, g: 68, b: 68 },     // red-500
})
```
