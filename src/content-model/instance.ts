import path from "node:path";

import { loadCourseModel } from "./load";
import { validateContent } from "./validate";
import type { CourseModel } from "./types";

/**
 * Build-time access to the validated course model.
 *
 * Pages and MDX components need the model (navigation, glossary lookups) and
 * must never render an invalid tree, so loading and validation are bundled
 * here. The Astro integration fails the build for the same reason; this is the
 * guard for code paths that render without going through that hook.
 *
 * The result is cached for the life of a build. In dev it is re-read on every
 * call so an edited lesson shows up without restarting the server.
 */
let pending: Promise<CourseModel> | undefined;

export function getCourseModel(): Promise<CourseModel> {
  if (import.meta.env.DEV) return load();
  pending ??= load();
  return pending;
}

async function load(): Promise<CourseModel> {
  const contentRoot = path.resolve(process.cwd(), "content");
  const { model, issues } = await loadCourseModel(contentRoot);
  const errors = [...issues, ...validateContent(model)].filter((issue) => issue.severity === "error");
  if (errors.length > 0) {
    const lines = errors.map((issue) => `${issue.file ?? "-"}: [${issue.rule}] ${issue.message}`);
    throw new Error(`content validation failed with ${errors.length} error(s):\n${lines.join("\n")}`);
  }
  return model;
}
