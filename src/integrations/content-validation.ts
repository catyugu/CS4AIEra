import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";

import { loadCourseModel } from "../content-model/load";
import { validateContent } from "../content-model/validate";
import type { Issue } from "../content-model/types";

/**
 * Fail the Astro build on content errors.
 *
 * Validation is a first-class build step, not a lint task someone remembers to
 * run: broken ids and dangling references must stop the build that would
 * otherwise publish them.
 *
 * Warnings are printed but do not fail the build.
 */
export function contentValidation(): AstroIntegration {
  let projectRoot = process.cwd();

  return {
    name: "cs4ai:content-validation",
    hooks: {
      "astro:config:done": ({ config }) => {
        projectRoot = fileURLToPath(config.root);
      },
      "astro:build:start": async () => {
        const contentRoot = path.join(projectRoot, "content");
        const { model, issues: loadIssues } = await loadCourseModel(contentRoot);
        const issues = [...loadIssues, ...validateContent(model)];
        const errors = issues.filter((issue) => issue.severity === "error");

        for (const issue of issues) {
          console.log(`${issue.severity === "error" ? "error" : "warn "} ${formatIssue(issue)}`);
        }
        console.log(
          `content: ${model.sections.length} sections, ${model.lessons.length} lessons, ` +
            `${model.glossary.length} terms, ${model.labs.length} labs`,
        );

        if (errors.length > 0) {
          throw new Error(
            `content validation failed with ${errors.length} error(s); fix them before building`,
          );
        }
      },
    },
  };
}

function formatIssue(issue: Issue): string {
  const location = issue.file ? `${issue.file}${issue.line ? `:${issue.line}` : ""}` : "-";
  return `${location}  [${issue.rule}] ${issue.message}`;
}
