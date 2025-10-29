import { spawnSync } from "child_process"
import * as path from "path"
import { QuartzTransformerPlugin, BuildCtx } from "./quartz-types"

export interface RGBColor {
  r: number
  g: number
  b: number
}

export interface LineAgeOptions {
  /**
   * Maximum age in days for the color gradient (default: 365 days = 1 year)
   */
  maxAgeDays?: number
  /**
   * Show the line age bars (default: true)
   */
  enabled?: boolean
  /**
   * Color for fresh/newest lines (default: rgb(34, 197, 94) - green-500)
   */
  freshColor?: RGBColor
  /**
   * Color for old/stale lines (default: rgb(156, 163, 175) - gray-400)
   */
  oldColor?: RGBColor
}

/**
 * Calculate color based on age in days
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
  // Clamp age to max
  const normalizedAge = Math.min(ageDays, maxAgeDays) / maxAgeDays
  
  const r = Math.round(freshColor.r + (oldColor.r - freshColor.r) * normalizedAge)
  const g = Math.round(freshColor.g + (oldColor.g - freshColor.g) * normalizedAge)
  const b = Math.round(freshColor.b + (oldColor.b - freshColor.b) * normalizedAge)
  
  return `rgb(${r}, ${g}, ${b})`
}

/**
 * Get git blame information for a file
 * @param filePath - Path to the file (relative to repository root)
 * @param repositoryRoot - Root directory of the repository
 * @returns Map of line numbers to age in days
 */
function getLineAges(filePath: string, repositoryRoot: string): Map<number, number> {
  const lineAges = new Map<number, number>()
  
  try {
    // Run git blame with porcelain format for easier parsing
    // Using spawnSync with array args to avoid command injection
    const result = spawnSync("git", ["blame", "--porcelain", "--", filePath], {
      encoding: "utf-8",
      cwd: repositoryRoot,
    })
    
    if (result.error || result.status !== 0) {
      console.warn(`Failed to get git blame for ${filePath}:`, result.stderr)
      return lineAges
    }
    
    const lines = result.stdout.split("\n")
    let currentLine = 1
    let commitTime = 0
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // Commit time line
      if (line.startsWith("committer-time ")) {
        const parts = line.split(" ")
        if (parts.length >= 2) {
          const parsed = parseInt(parts[1], 10)
          if (!isNaN(parsed)) {
            commitTime = parsed
          }
        }
      }
      
      // Tab character indicates the actual content line
      if (line.startsWith("\t")) {
        if (commitTime > 0) {
          const ageSeconds = Date.now() / 1000 - commitTime
          const ageDays = ageSeconds / (60 * 60 * 24)
          lineAges.set(currentLine, ageDays)
        }
        currentLine++
        commitTime = 0
      }
    }
  } catch (error) {
    console.warn(`Failed to get git blame for ${filePath}:`, error)
  }
  
  return lineAges
}

/**
 * Quartz plugin that adds line age visualization
 * This is a reference implementation. In actual use, it would integrate with Quartz's plugin system.
 */
export const LineAge: QuartzTransformerPlugin<Partial<LineAgeOptions>> = (userOpts?) => {
  const opts = { 
    enabled: true, 
    maxAgeDays: 365,
    freshColor: { r: 34, g: 197, b: 94 },
    oldColor: { r: 156, g: 163, b: 175 },
    ...userOpts 
  }

  return {
    name: "LineAge",
    htmlPlugins(ctx: BuildCtx) {
      return [
        () => {
          return (tree: any, file: any) => {
            if (!opts.enabled) return

            // Get the file path from VFile data
            const fullFp = file.data?.filePath
            if (!fullFp) return

            // Calculate relative path from repository root
            const repositoryRoot = ctx.argv.directory
            const relativePath = path.relative(repositoryRoot, fullFp)

            // Get line ages from git blame
            const lineAges = getLineAges(relativePath, repositoryRoot)
            if (lineAges.size === 0) return

            // This would integrate with Quartz's AST processing
            // The actual implementation would use unist-util-visit to traverse
            // the HTML AST and inject the line age bars
            
            // See the example.html file for the expected HTML structure
            console.log("LineAge plugin would process:", relativePath)
            console.log("Line ages retrieved:", lineAges.size, "lines")
          }
        },
      ]
    },
  }
}

export default LineAge

// Export utility functions for standalone use
export { calculateColor, getLineAges }
