import { z } from "zod";

/**
 * Authoring schemas.
 *
 * Objects are strict: an unknown frontmatter key is a build error rather than a
 * silently ignored field. Typos in metadata are otherwise invisible until a
 * feature mysteriously does nothing.
 */

const slugSchema = z
  .string()
  .regex(
    /^\/[a-z0-9]+(?:[/-][a-z0-9]+)*$/,
    "slug must start with '/', use lowercase words separated by '-' or '/', and have no trailing slash",
  );

const idSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/, "id must be lowercase dot/dash-separated words");

export const lessonFrontmatterSchema = z.strictObject({
  id: idSchema,
  slug: slugSchema,
  order: z.number().int(),
  title: z.string().min(1),
  status: z.enum(["draft", "review", "published", "archived"]),
  prerequisites: z.array(idSchema).default([]),
  allow_draft_prerequisites: z.array(idSchema).default([]),
  objectives: z.array(z.string().min(1)).default([]),
  terms: z.array(idSchema).default([]),
  estimated_reading_minutes: z.number().int().positive().optional(),
});

export const sectionSchema = z.strictObject({
  id: idSchema,
  label: z.string().min(1),
  order: z.number().int(),
  summary: z.string().min(1).optional(),
  status: z.enum(["draft", "active", "archived"]),
});

export const glossaryFrontmatterSchema = z.strictObject({
  id: idSchema,
  term: z.string().min(1),
  english: z.string().min(1).optional(),
  aliases: z.array(z.string().min(1)).default([]),
  domains: z.array(idSchema).default([]),
  short: z.string().min(1),
  related: z.array(idSchema).default([]),
});

export const labSchema = z.strictObject({
  id: idSchema,
  engine: z.literal("sqlite"),
  source: z.string().min(1),
  reset: z.literal("recreate").default("recreate"),
  max_result_rows: z.number().int().positive().default(200),
});

export type LessonFrontmatter = z.infer<typeof lessonFrontmatterSchema>;
export type SectionFrontmatter = z.infer<typeof sectionSchema>;
export type GlossaryFrontmatter = z.infer<typeof glossaryFrontmatterSchema>;
export type LabFrontmatter = z.infer<typeof labSchema>;

/** Render a zod error as one compact line per problem. */
export function formatZodError(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
    return `${path}: ${issue.message}`;
  });
}
