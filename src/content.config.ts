import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";

import { glossaryFrontmatterSchema, lessonFrontmatterSchema } from "./content-model/schema";

/**
 * Renderable content collections.
 *
 * The authoring schemas live in `content-model/schema.ts` and are reused here,
 * so frontmatter has exactly one definition. `content-model/load.ts` walks the
 * same files to build the course model the validator and navigation use; this
 * config exists so Astro can render the MDX bodies.
 *
 * Entry ids are the authoring `id` values, not file paths: identity is stable
 * across file moves (doc/DESIGN.md, 内容模型).
 */
export const collections = {
  lessons: defineCollection({
    loader: glob({
      pattern: "**/*.mdx",
      base: "./content/curriculum",
      generateId: ({ data }) => String(data.id),
    }),
    schema: lessonFrontmatterSchema,
  }),
  glossary: defineCollection({
    loader: glob({
      pattern: "*.mdx",
      base: "./content/glossary",
      generateId: ({ data }) => String(data.id),
    }),
    schema: glossaryFrontmatterSchema,
  }),
};
