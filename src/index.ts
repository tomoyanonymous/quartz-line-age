import { spawnSync } from "child_process";
import * as path from "path";
import { BuildCtx, QuartzTransformerPlugin, TocEntry } from "./quartz-types";
import { visit } from "unist-util-visit";
import { Element, Root as HtmlRoot, Text } from "hast";
import { Root as MdastRoot } from "mdast";
// import { BuildCtx } from "@jackyzha0/quartz/quartz/util/ctx"
// import { QuartzTransformerPlugin} from "@jackyzha0/quartz/quartz/plugins/types"

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface LineAgeOptions {
  /**
   * Maximum age in days for the color gradient (default: 365 days = 1 year)
   */
  maxAgeDays?: number;
  /**
   * Show the line age bars (default: true)
   */
  enabled?: boolean;
  /**
   * Color for fresh/newest lines (default: rgb(34, 197, 94) - green-500)
   */
  freshColor?: RGBColor;
  /**
   * Color for old/stale lines (default: rgb(156, 163, 175) - gray-400)
   */
  oldColor?: RGBColor;
}

/**
 * Calculate color based on age in days
 * Inspired by Obsidian Git's line authoring implementation
 * Uses a power function to make recent changes more pronounced
 *
 * @param ageDays - Age of the line in days
 * @param maxAgeDays - Maximum age for the gradient (default: 365)
 * @param freshColor - Color for fresh/newest lines (default: green-500)
 * @param oldColor - Color for old/stale lines (default: gray-400)
 * @returns CSS color string (rgb)
 */
function calculateColor(
  ageDays: number,
  maxAgeDays: number = 365,
  freshColor: RGBColor = { r: 34, g: 197, b: 94 },
  oldColor: RGBColor = { r: 156, g: 163, b: 175 }
): string {
  // Clamp age to max: 0 <= x <= 1, where larger x means older
  const normalizedAge = Math.min(ageDays, maxAgeDays) / maxAgeDays;

  // Use power function (n-th root) to make recent changes more pronounced
  // This matches the Obsidian Git approach: x^(1/2.3)
  // This means the color changes more rapidly for recent commits
  const adjustedAge = Math.pow(normalizedAge, 1 / 2.3);

  const r = Math.round(
    freshColor.r + (oldColor.r - freshColor.r) * adjustedAge
  );
  const g = Math.round(
    freshColor.g + (oldColor.g - freshColor.g) * adjustedAge
  );
  const b = Math.round(
    freshColor.b + (oldColor.b - freshColor.b) * adjustedAge
  );

  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Get git blame information for a file
 * @param filePath - Path to the file (relative to repository root)
 * @param repositoryRoot - Root directory of the repository
 * @returns Map of line numbers to age in days
 */
function getLineAges(
  filePath: string,
  repositoryRoot: string
): Map<number, number> {
  const lineAges = new Map<number, number>();

  try {
    // Use --line-porcelain for detailed, machine-readable output per line
    const result = spawnSync(
      "git",
      ["blame", "--line-porcelain", "--", filePath],
      {
        encoding: "utf-8",
        cwd: repositoryRoot,
      }
    );

    if (result.error || result.status !== 0) {
      console.warn(`Failed to get git blame for ${filePath}:`, result.stderr);
      return lineAges;
    }

    const blameOutput = result.stdout;
    const blameLines = blameOutput.split("\n");

    let currentLineInfo: { commitTime?: number; finalLine?: number } = {};
    const lineInfoRegex = /^([a-f0-9]{40})\s\d+\s(\d+)/;

    for (let i = 0; i < blameLines.length; i++) {
      const line = blameLines[i];
      const match = line.match(lineInfoRegex);

      if (match) {
        // Start of a new line's blame info
        if (currentLineInfo.commitTime && currentLineInfo.finalLine) {
          const ageSeconds = Date.now() / 1000 - currentLineInfo.commitTime;
          const ageDays = ageSeconds / (60 * 60 * 24);
          lineAges.set(currentLineInfo.finalLine, ageDays);
        }

        currentLineInfo = {
          finalLine: parseInt(match[2], 10),
        };
      } else if (line.startsWith("committer-time ") && currentLineInfo) {
        currentLineInfo.commitTime = parseInt(line.split(" ")[1], 10);
      } else if (
        line.startsWith("\t") &&
        currentLineInfo.commitTime &&
        currentLineInfo.finalLine
      ) {
        // This is the content line, finalize the info for this line
        const ageSeconds = Date.now() / 1000 - currentLineInfo.commitTime;
        const ageDays = ageSeconds / (60 * 60 * 24);
        lineAges.set(currentLineInfo.finalLine, ageDays);
        currentLineInfo = {}; // Reset for the next block
      }
    }
  } catch (error) {
    console.warn(`Failed to get git blame for ${filePath}:`, error);
  }

  return lineAges;
}

/**
 * LineAgePre - Pre-processes markdown before it's converted to HTML
 * Inserts line age metadata markers at the end of each line
 * Format: {{-line:N-}} where N is the line number
 * Skips frontmatter blocks (content between --- delimiters at the start)
 */
export const LineAgePre: QuartzTransformerPlugin<Partial<LineAgeOptions>> = (
  userOpts?
) => {
  const opts = {
    enabled: true,
    ...userOpts,
  };

  return {
    name: "LineAgePre",
    textTransform(ctx: BuildCtx, src: string) {
      if (!opts.enabled) return src;

      // Split source into lines
      const lines = src.split("\n");

      // Detect frontmatter
      let inFrontmatter = false;
      let frontmatterEnded = false;
      let frontmatterLineCount = 0;

      // Check if document starts with frontmatter
      if (lines[0] && lines[0].trim() === "---") {
        inFrontmatter = true;
      }

      // Insert line number markers at the end of each line
      const markedLines = lines.map((line, index) => {
        const lineNumber = index + 1;

        // Handle frontmatter detection
        if (inFrontmatter) {
          frontmatterLineCount++;
          // Check for closing --- (must be after the opening ---)
          if (frontmatterLineCount > 1 && line.trim() === "---") {
            inFrontmatter = false;
            frontmatterEnded = true;
          }
          // Don't add markers to frontmatter lines
          return line;
        }

        // Don't add markers to code fence lines (```language or just ```)
        // This prevents markers from interfering with code block language identifiers
        if (line.trimStart().startsWith("```")) {
          return line;
        }

        // Add marker as HTML comment at the end of the line
        // HTML comments are preserved through markdown processing but not rendered
        return `${line}<!-- line:${lineNumber} -->`;
      });

      return markedLines.join("\n");
    },
  };
};

/**
 * LineAgePre - Post-processes markdown, especially table of contents
 * Removes unused comments in toc slug and texts
 */

export const LineAgeMid: QuartzTransformerPlugin<
  Partial<LineAgeOptions>
> = () => {
  const opts = {};
  // Regular expression to match comment markers in attributes
  const commentMarkerPattern = /<!--\s*line:\d+\s*-->/g;
  const slugMarkerPattern = /---\s*line\d+\s*---/g;

  return {
    name: "LineAgeMid",
    markdownPlugins() {
      return [
        () => {
          return (tree: any, file: any) =>{
            let toc = file.data.toc;
            if (!toc) return;
            toc.forEach((entry: TocEntry) => {
              entry.slug = entry.slug.replace(slugMarkerPattern, "");
              entry.text = entry.text.replace(commentMarkerPattern, "");
            });
          }
        },
      ];
    },
  };
};

/**
 * LineAgePost - Post-processes HTML after markdown conversion
 * Finds line markers and wraps content in divs with proper styling
 */
export const LineAgePost: QuartzTransformerPlugin<Partial<LineAgeOptions>> = (
  userOpts?
) => {
  const opts = {
    enabled: true,
    maxAgeDays: 365,
    freshColor: { r: 34, g: 197, b: 94 },
    oldColor: { r: 156, g: 163, b: 175 },
    ...userOpts,
  };

  return {
    name: "LineAgePost",
    htmlPlugins(ctx: BuildCtx) {
      return [
        () => {
          return (tree: HtmlRoot, file: any) => {
            if (!opts.enabled) return;

            // Get the file path from VFile data
            const fullFp = file.data?.filePath;
            if (!fullFp) return;

            // Calculate relative path from repository root
            const repositoryRoot = ctx.argv.directory;
            const relativePath = path.relative(repositoryRoot, fullFp);

            // Get line ages from git blame
            const lineAges = getLineAges(relativePath, repositoryRoot);

            // Regular expression to match line number in comment: line:N
            const lineMarkerRegex = /^\s*line:(\d+)\s*$/;

            // Regular expression to match comment markers in attributes
            const commentMarkerPattern = /<!--\s*line:\d+\s*-->/g;

            // First pass: Clean up any HTML comment markers in heading IDs and anchor hrefs
            // These may have been generated during markdown processing before our plugin ran
            visit(tree, "element", (node: Element) => {
              // Clean up heading IDs
              if (node.tagName && node.tagName.match(/^h[1-6]$/)) {
                if (node.properties && node.properties.id) {
                  const id = String(node.properties.id);
                  if (id.includes("<!--")) {
                    node.properties.id = id
                      .replace(commentMarkerPattern, "")
                      .trim();
                  }
                }
              }

              // Clean up anchor hrefs
              if (
                node.tagName === "a" &&
                node.properties &&
                node.properties.href
              ) {
                const href = String(node.properties.href);
                if (href.includes("<!--")) {
                  node.properties.href = href
                    .replace(commentMarkerPattern, "")
                    .trim();
                }
              }
            });

            // Second pass: Replace comment nodes with line-age-bar spans or remove them
            visit(tree, "comment", (node: any, index, parent) => {
              if (!parent || index === undefined) return;

              const match = node.value.match(lineMarkerRegex);
              if (!match) return;

              const lineNumber = parseInt(match[1], 10);

              // Get age for this line
              const ageDays = lineAges.get(lineNumber);

              if (ageDays !== undefined && lineAges.size > 0) {
                // We have git blame data - create a line-age-bar span
                const color = calculateColor(
                  ageDays,
                  opts.maxAgeDays,
                  opts.freshColor,
                  opts.oldColor
                );

                const lineAgeBar: Element = {
                  type: "element",
                  tagName: "span",
                  properties: {
                    className: ["line-age-bar"],
                    style: `background-color: ${color};`,
                    "data-line-age": ageDays.toFixed(1),
                  },
                  children: [],
                };

                // Replace the comment node with the line-age-bar span
                parent.children[index] = lineAgeBar;
              } else {
                // No git blame data - just remove the comment marker
                parent.children.splice(index, 1);
              }
            });
          };
        },
      ];
    },
  };
};

// Export individual plugins and utility functions
export { calculateColor, getLineAges };
