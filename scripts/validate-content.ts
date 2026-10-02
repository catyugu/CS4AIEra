/**
 * Content validation entry point.
 *
 *   npm run validate [content-root]
 *
 * Exits non-zero when any issue is an error. Warnings are printed but do not
 * fail the build; they cover editorial smells such as an unused glossary term.
 */
import path from "node:path";

import { loadCourseModel } from "../src/content-model/load";
import { validateContent } from "../src/content-model/validate";
import type { Issue } from "../src/content-model/types";

const contentRoot = path.resolve(process.argv[2] ?? "content");

const { model, issues: loadIssues } = await loadCourseModel(contentRoot);
const issues = [...loadIssues, ...validateContent(model)];

const errors = issues.filter((issue) => issue.severity === "error");
const warnings = issues.filter((issue) => issue.severity === "warning");

for (const issue of sortIssues(issues)) {
  const location = issue.file ? `${issue.file}${issue.line ? `:${issue.line}` : ""}` : "-";
  const tag = issue.severity === "error" ? "error" : "warn ";
  console.log(`${tag} ${location}  [${issue.rule}] ${issue.message}`);
}

console.log("");
console.log(
  `content: ${model.sections.length} sections, ${model.lessons.length} lessons, ` +
    `${model.glossary.length} terms, ${model.labs.length} labs`,
);
console.log(`issues: ${errors.length} errors, ${warnings.length} warnings`);

if (errors.length > 0) {
  process.exitCode = 1;
}

function sortIssues(list: Issue[]): Issue[] {
  return [...list].sort((a, b) => {
    const fileA = a.file ?? "";
    const fileB = b.file ?? "";
    if (fileA !== fileB) return fileA < fileB ? -1 : 1;
    return (a.line ?? 0) - (b.line ?? 0);
  });
}
