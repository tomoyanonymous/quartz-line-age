/**
 * Example usage of the quartz-line-age plugin
 * 
 * This shows how to integrate the plugin with Quartz
 */

// In your quartz.config.ts file:

import { QuartzConfig } from "./quartz/cfg"
import { Plugin } from "./quartz/plugins/types"
import { LineAge } from "quartz-line-age"

export default {
  configuration: {
    // ... your other config
  },
  plugins: {
    transformers: [
      // ... other transformer plugins
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
      
      // Add the LineAge plugin
      LineAge({
        enabled: true,      // Enable the plugin
        maxAgeDays: 365,    // Lines older than 1 year will be fully gray
      }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.NotFoundPage(),
    ],
  },
} satisfies QuartzConfig

// Don't forget to import the CSS in your theme or custom styles:
// @import "quartz-line-age/dist/line-age.css";
