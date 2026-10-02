import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { parse as parseYaml } from "yaml";

import { formatZodError, glossaryFrontmatterSchema, labSchema, lessonFrontmatterSchema, sectionSchema } from "./schema";
import { isExecutableFence, parseCellMeta, scanMdx, toExecutableCell, toStaticBlock } from "./mdx-scan";
import { countTokens } from "./tokens";
import type { CourseModel, GlossaryEntry, Issue, LabFixture, Lesson, Section } from "./types";

/**
 * Filesystem loader for the course tree.
 *
 * The loader is tolerant: a malformed file produces an issue and is skipped
 * rather than aborting the walk, so a single build reports every content
 * problem instead of the first one. Callers decide what to do with the issues
 * (`scripts/validate-content.ts` fails the build on errors).
 */

export interface LoadResult {
  model: CourseModel;
  issues: Issue[];
}

const LESSON_EXTENSION = ".mdx";

export async function loadCourseModel(contentRoot: string): Promise<LoadResult> {
  const root = path.resolve(contentRoot);
  const issues: Issue[] = [];

  const sections: Section[] = [];
  const lessons: Lesson[] = [];
  const glossary: GlossaryEntry[] = [];
  const labs: LabFixture[] = [];

  const curriculumRoot = path.join(root, "curriculum");
  await loadSection(curriculumRoot, null, sections, lessons, issues, root);

  await loadGlossary(path.join(root, "glossary"), glossary, issues, root);
  await loadLabs(path.join(root, "labs"), labs, issues, root);

  const model: CourseModel = { root, sections, lessons, glossary, labs };
  attachUsage(model);
  return { model, issues };
}

async function loadSection(
  dir: string,
  parentId: string | null,
  sections: Section[],
  lessons: Lesson[],
  issues: Issue[],
  root: string,
): Promise<void> {
  if (!(await isDirectory(dir))) return;
  const relativeDir = toRepoPath(root, dir);

  const metaFile = path.join(dir, "_section.yaml");
  const meta = await readFrontmatterYaml(metaFile, issues, root);
  if (meta === undefined) {
    issues.push({
      rule: "missing-section-metadata",
      severity: "error",
      message: `section directory has no _section.yaml`,
      file: relativeDir,
    });
    return;
  }

  const parsed = sectionSchema.safeParse(meta);
  if (!parsed.success) {
    for (const message of formatZodError(parsed.error)) {
      issues.push({
        rule: "invalid-section-metadata",
        severity: "error",
        message,
        file: toRepoPath(root, metaFile),
      });
    }
    return;
  }

  const section: Section = {
    id: parsed.data.id,
    label: parsed.data.label,
    order: parsed.data.order,
    summary: parsed.data.summary,
    status: parsed.data.status,
    parentId,
    file: toRepoPath(root, metaFile),
  };
  sections.push(section);

  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await loadSection(full, section.id, sections, lessons, issues, root);
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith(LESSON_EXTENSION)) continue;
    if (entry.name.startsWith("_")) continue;
    await loadLesson(full, section.id, lessons, issues, root);
  }
}

async function loadLesson(
  file: string,
  sectionId: string,
  lessons: Lesson[],
  issues: Issue[],
  root: string,
): Promise<void> {
  const relativeFile = toRepoPath(root, file);
  const text = await readFile(file, "utf8");
  const split = splitFrontmatter(text);
  if (split === undefined) {
    issues.push({
      rule: "missing-frontmatter",
      severity: "error",
      message: "lesson has no YAML frontmatter block",
      file: relativeFile,
    });
    return;
  }

  let raw: unknown;
  try {
    raw = parseYaml(split.frontmatter);
  } catch (error) {
    issues.push({
      rule: "invalid-frontmatter",
      severity: "error",
      message: `frontmatter is not valid YAML: ${(error as Error).message}`,
      file: relativeFile,
    });
    return;
  }

  const parsed = lessonFrontmatterSchema.safeParse(raw);
  if (!parsed.success) {
    for (const message of formatZodError(parsed.error)) {
      issues.push({ rule: "invalid-lesson-metadata", severity: "error", message, file: relativeFile });
    }
    return;
  }

  const scan = scanMdx(split.body);
  const cells = [];
  const staticBlocks = [];

  for (const fence of scan.fences) {
    if (!isExecutableFence(fence.meta)) {
      staticBlocks.push(toStaticBlock(fence));
      continue;
    }
    const language = fence.language;
    if (language !== "python" && language !== "sql") {
      issues.push({
        rule: "invalid-cell-language",
        severity: "error",
        message: `executable cells must be \`\`\`python or \`\`\`sql, found \`\`\`${language || "(none)"}`,
        file: relativeFile,
        line: fence.line,
      });
      continue;
    }
    const { meta, problems } = parseCellMeta(fence.meta);
    for (const problem of problems) {
      issues.push({ rule: "invalid-cell-option", severity: "error", message: problem, file: relativeFile, line: fence.line });
    }
    if (meta.id === undefined || meta.id.length === 0) {
      issues.push({
        rule: "missing-cell-id",
        severity: "error",
        message: "executable cell requires an id",
        file: relativeFile,
        line: fence.line,
      });
      continue;
    }
    cells.push(toExecutableCell(fence, meta, language));
  }

  lessons.push({
    id: parsed.data.id,
    slug: parsed.data.slug,
    order: parsed.data.order,
    title: parsed.data.title,
    status: parsed.data.status,
    objectives: parsed.data.objectives,
    tokens: countTokens(split.body),
    sectionId,
    file: relativeFile,
    cells,
    staticBlocks,
    headings: scan.headings,
    references: scan.references,
  });
}

async function loadGlossary(dir: string, glossary: GlossaryEntry[], issues: Issue[], root: string): Promise<void> {
  if (!(await isDirectory(dir))) return;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(LESSON_EXTENSION) || entry.name.startsWith("_")) continue;
    const file = path.join(dir, entry.name);
    const relativeFile = toRepoPath(root, file);
    const text = await readFile(file, "utf8");
    const split = splitFrontmatter(text);
    if (split === undefined) {
      issues.push({
        rule: "missing-frontmatter",
        severity: "error",
        message: "glossary entry has no YAML frontmatter block",
        file: relativeFile,
      });
      continue;
    }
    let raw: unknown;
    try {
      raw = parseYaml(split.frontmatter);
    } catch (error) {
      issues.push({
        rule: "invalid-frontmatter",
        severity: "error",
        message: `frontmatter is not valid YAML: ${(error as Error).message}`,
        file: relativeFile,
      });
      continue;
    }
    const parsed = glossaryFrontmatterSchema.safeParse(raw);
    if (!parsed.success) {
      for (const message of formatZodError(parsed.error)) {
        issues.push({ rule: "invalid-glossary-metadata", severity: "error", message, file: relativeFile });
      }
      continue;
    }
    glossary.push({
      id: parsed.data.id,
      term: parsed.data.term,
      english: parsed.data.english,
      aliases: parsed.data.aliases,
      domains: parsed.data.domains,
      short: parsed.data.short,
      related: parsed.data.related,
      file: relativeFile,
      usedBy: [],
    });
  }
}

async function loadLabs(dir: string, labs: LabFixture[], issues: Issue[], root: string): Promise<void> {
  if (!(await isDirectory(dir))) return;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const labDir = path.join(dir, entry.name);
    const labFile = path.join(labDir, "lab.yaml");
    const raw = await readFrontmatterYaml(labFile, issues, root, "lab.yaml is missing");
    if (raw === undefined) continue;
    const parsed = labSchema.safeParse(raw);
    if (!parsed.success) {
      for (const message of formatZodError(parsed.error)) {
        issues.push({ rule: "invalid-lab-metadata", severity: "error", message, file: toRepoPath(root, labFile) });
      }
      continue;
    }
    labs.push({
      id: parsed.data.id,
      engine: parsed.data.engine,
      source: parsed.data.source,
      reset: parsed.data.reset,
      maxResultRows: parsed.data.max_result_rows,
      dir: toRepoPath(root, labDir),
      file: toRepoPath(root, labFile),
      usedBy: [],
    });
  }
}

/** Record which lessons reference each term and fixture. */
function attachUsage(model: CourseModel): void {
  const byTerm = new Map(model.glossary.map((entry) => [entry.id, entry]));
  const byLab = new Map(model.labs.map((lab) => [lab.id, lab]));
  for (const lesson of model.lessons) {
    const terms = new Set<string>();
    for (const reference of lesson.references) {
      if (reference.kind === "term") terms.add(reference.target);
    }
    for (const termId of terms) {
      const entry = byTerm.get(termId);
      if (entry) entry.usedBy.push(lesson.id);
    }
    for (const cell of lesson.cells) {
      if (cell.fixture === undefined) continue;
      const lab = byLab.get(cell.fixture);
      if (lab) lab.usedBy.push(lesson.id);
    }
  }
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

export interface FrontmatterSplit {
  frontmatter: string;
  body: string;
}

/** Split a leading `---` delimited YAML block from the document body. */
export function splitFrontmatter(text: string): FrontmatterSplit | undefined {
  const normalized = text.replace(/^\uFEFF/, "");
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(normalized);
  if (!match) return undefined;
  return { frontmatter: match[1]!, body: normalized.slice(match[0].length) };
}

async function readFrontmatterYaml(
  file: string,
  issues: Issue[],
  root: string,
  missingMessage = "no _section.yaml",
): Promise<unknown> {
  if (!(await isFile(file))) {
    issues.push({
      rule: "missing-metadata-file",
      severity: "error",
      message: `${path.basename(file)} not found: ${missingMessage}`,
      file: toRepoPath(root, path.dirname(file)),
    });
    return undefined;
  }
  const text = await readFile(file, "utf8");
  try {
    return parseYaml(text);
  } catch (error) {
    issues.push({
      rule: "invalid-yaml",
      severity: "error",
      message: `${path.basename(file)} is not valid YAML: ${(error as Error).message}`,
      file: toRepoPath(root, file),
    });
    return undefined;
  }
}

export function toRepoPath(root: string, target: string): string {
  return path.relative(root, target).split(path.sep).join("/") || ".";
}

async function isDirectory(target: string): Promise<boolean> {
  try {
    return (await stat(target)).isDirectory();
  } catch {
    return false;
  }
}

async function isFile(target: string): Promise<boolean> {
  try {
    return (await stat(target)).isFile();
  } catch {
    return false;
  }
}
