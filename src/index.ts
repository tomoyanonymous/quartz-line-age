import { spawnSync } from "child_process";
import * as path from "path";
import { BuildCtx, QuartzTransformerPlugin } from "./quartz-types";
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
    // Run git blame with porcelain format for easier parsing
    // Using spawnSync with array args to avoid command injection
    const result = spawnSync("git", ["blame", "--porcelain", "--", filePath], {
      encoding: "utf-8",
      cwd: repositoryRoot,
    });

    if (result.error || result.status !== 0) {
      console.warn(`Failed to get git blame for ${filePath}:`, result.stderr);
      return lineAges;
    }

    const lines = result.stdout.split("\n");
    let currentLine = 1;
    let commitTime = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Commit time line
      if (line.startsWith("committer-time ")) {
        const parts = line.split(" ");
        if (parts.length >= 2) {
          const parsed = parseInt(parts[1], 10);
          if (!isNaN(parsed)) {
            commitTime = parsed;
          }
        }
      }

      // Tab character indicates the actual content line
      if (line.startsWith("\t")) {
        if (commitTime > 0) {
          const ageSeconds = Date.now() / 1000 - commitTime;
          const ageDays = ageSeconds / (60 * 60 * 24);
          lineAges.set(currentLine, ageDays);
        }
        currentLine++;
        commitTime = 0;
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
        
        // Add marker at the end of the line
        return `${line}{{-line:${lineNumber}-}}`;
      });

      return markedLines.join("\n");
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
            if (lineAges.size === 0) return;

            // Regular expression to match line markers: {{-line:N-}}
            const lineMarkerRegex = /\{\{-line:(\d+)-\}\}/g;

            // Visit all text nodes and process line markers
            visit(tree, "text", (node: Text, index, parent) => {
              if (!parent || index === undefined) return;

              const text = node.value;
              const matches = Array.from(text.matchAll(lineMarkerRegex));

              if (matches.length === 0) return;

              // Split the text by line markers and create new nodes
              const newNodes: (Element | Text)[] = [];
              let lastIndex = 0;

              for (const match of matches) {
                const lineNumber = parseInt(match[1], 10);
                const markerStart = match.index!;
                const markerEnd = markerStart + match[0].length;

                // Get the content BEFORE the marker (from last position to marker start)
                // This is the content for this line, since markers are now at line END
                const content = text.substring(lastIndex, markerStart);

                // Get age for this line
                const ageDays = lineAges.get(lineNumber) || 0;
                const color = calculateColor(
                  ageDays,
                  opts.maxAgeDays,
                  opts.freshColor,
                  opts.oldColor
                );

                // Create a wrapper div with line-age styling
                if (content.trim()) {
                  const wrapper: Element = {
                    type: "element",
                    tagName: "div",
                    properties: {
                      className: ["line-age-container"],
                      "data-line-age": ageDays.toFixed(1),
                    },
                    children: [
                      {
                        type: "element",
                        tagName: "span",
                        properties: {
                          className: ["line-age-bar"],
                          style: `background-color: ${color};`,
                        },
                        children: [],
                      },
                      {
                        type: "text",
                        value: content,
                      },
                    ],
                  };

                  newNodes.push(wrapper);
                }

                // Move past the marker to the next content
                lastIndex = markerEnd;
              }

              // Add any remaining text after the last marker
              if (lastIndex < text.length) {
                const remainingText = text.substring(lastIndex);
                if (remainingText.trim()) {
                  newNodes.push({
                    type: "text",
                    value: remainingText,
                  });
                }
              }

              // Replace the text node with the new structure
              if (newNodes.length > 0) {
                parent.children.splice(index, 1, ...newNodes);
              }
            });
          };
        },
      ];
    },
  };
};

/**
 * Combined plugin for backward compatibility
 * Uses the two-stage approach internally
 */
export const LineAge: QuartzTransformerPlugin<Partial<LineAgeOptions>> = (
  userOpts?
) => {
  const prePlug = LineAgePre(userOpts);
  const postPlug = LineAgePost(userOpts);

  return {
    name: "LineAge",
    textTransform: prePlug.textTransform,
    htmlPlugins: postPlug.htmlPlugins,
  };
};

export default LineAge;

// Export individual plugins and utility functions
export { calculateColor, getLineAges };
