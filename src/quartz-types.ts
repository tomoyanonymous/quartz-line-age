/**
 * Type definitions compatible with @jackyzha0/quartz
 * 
 * These types are defined locally to avoid build issues when importing
 * from the Quartz package (which includes JSX files). They match the
 * interfaces from quartz/plugins/types.ts and quartz/util/ctx.ts
 * 
 * When used within a Quartz installation, the actual types from Quartz
 * should be used instead by importing:
 *   import { QuartzTransformerPlugin } from "@jackyzha0/quartz/quartz/plugins/types"
 *   import { BuildCtx } from "@jackyzha0/quartz/quartz/util/ctx"
 */

import { PluggableList } from "unified"

export interface BuildCtx {
  argv: {
    directory: string
    [key: string]: any
  }
  [key: string]: any
}

export type QuartzTransformerPlugin<Options = any> = (
  opts?: Options,
) => QuartzTransformerPluginInstance

export interface QuartzTransformerPluginInstance {
  name: string
  textTransform?: (ctx: BuildCtx, src: string) => string
  markdownPlugins?: (ctx: BuildCtx) => PluggableList
  htmlPlugins?: (ctx: BuildCtx) => PluggableList
  externalResources?: (ctx: BuildCtx) => any
}
export interface TocEntry {
  depth: number
  text: string
  slug: string // this is just the anchor (#some-slug), not the canonical slug
}