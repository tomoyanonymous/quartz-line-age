import { spawnSync } from "child_process"
import path from "path"

// Type definitions for Quartz plugin integration
// These would be imported from Quartz in a real installation
export interface QuartzTransformerPlugin<T = any> {
  name: string
  htmlPlugins?: () => any[]
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
}

/**
 * Calculate color based on age in days
 * @param ageDays - Age of the line in days
 * @param maxAgeDays - Maximum age for the gradient (default: 365)
 * @returns CSS color string (rgb)
 */
function calculateColor(ageDays: number, maxAgeDays: number = 365): string {
  // Clamp age to max
  const normalizedAge = Math.min(ageDays, maxAgeDays) / maxAgeDays
  
  // Green (fresh) to Gray (old)
  // Fresh: rgb(34, 197, 94) - green-500
  // Old: rgb(156, 163, 175) - gray-400
  
  const freshColor = { r: 34, g: 197, b: 94 }
  const oldColor = { r: 156, g: 163, b: 175 }
  
  const r = Math.round(freshColor.r + (oldColor.r - freshColor.r) * normalizedAge)
  const g = Math.round(freshColor.g + (oldColor.g - freshColor.g) * normalizedAge)
  const b = Math.round(freshColor.b + (oldColor.b - freshColor.b) * normalizedAge)
  
  return `rgb(${r}, ${g}, ${b})`
}

/**
 * Get git blame information for a file
 * @param filePath - Path to the file
 * @returns Map of line numbers to age in days
 */
function getLineAges(filePath: string): Map<number, number> {
  const lineAges = new Map<number, number>()
  
  try {
    // Run git blame with porcelain format for easier parsing
    // Using spawnSync with array args to avoid command injection
    const result = spawnSync("git", ["blame", "--porcelain", "--", filePath], {
      encoding: "utf-8",
      cwd: path.dirname(filePath),
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
export const LineAge = (userOpts?: Partial<LineAgeOptions>): QuartzTransformerPlugin => {
  const opts = { enabled: true, maxAgeDays: 365, ...userOpts }

  return {
    name: "LineAge",
    htmlPlugins() {
      return [
        () => {
          return (tree: any, file: any) => {
            if (!opts.enabled) return

            // Get the file path from the VFile
            const filePath = file.history?.[0]
            if (!filePath) return

            // Get line ages from git blame
            const lineAges = getLineAges(filePath)
            if (lineAges.size === 0) return

            // This would integrate with Quartz's AST processing
            // The actual implementation would use unist-util-visit to traverse
            // the HTML AST and inject the line age bars
            
            // See the example.html file for the expected HTML structure
            console.log("LineAge plugin would process:", filePath)
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
