import { createRequire } from "node:module";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";

import { isPinnedPackage, PINNED_PACKAGES } from "./runtime-config";
import type { CourseModel, GlossaryEntry, Issue, Lesson, Section } from "./types";

/**
 * Build-time content validation (DESIGN.md section 17).
 *
 * Every check here is a hard error unless it is explicitly a warning. The
 * distinction matters: a broken reference must stop the build, while an
 * editorial smell such as an unused glossary term must not.
 *
 * All checks run on every invocation; nothing short-circuits, so one build
 * surfaces every problem in the content tree.
 */
export function validateContent(model: CourseModel): Issue[] {
  const issues: Issue[] = [];

  checkUniqueIds(model, issues);
  checkUniqueSlugs(model, issues);
  checkSiblingOrder(model, issues);
  checkPrerequisites(model, issues);
  checkCells(model, issues);
  checkReferences(model, issues);
  checkAnchors(model, issues);
  checkGlossary(model, issues);
  checkFixtures(model, issues);
  checkAssets(model, issues);
  checkEditorialWarnings(model, issues);

  return issues;
}

function error(issues: Issue[], rule: string, message: string, file?: string, line?: number): void {
  issues.push({ rule, severity: "error", message, file, line });
}

function warn(issues: Issue[], rule: string, message: string, file?: string, line?: number): void {
  issues.push({ rule, severity: "warning", message, file, line });
}

function reportDuplicates<T extends { id: string; file: string }>(
  items: T[],
  kind: string,
  rule: string,
  issues: Issue[],
): void {
  const seen = new Map<string, T>();
  for (const item of items) {
    const previous = seen.get(item.id);
    if (previous) {
      error(
        issues,
        rule,
        `duplicate ${kind} id '${item.id}' (already declared in ${previous.file})`,
        item.file,
      );
      continue;
    }
    seen.set(item.id, item);
  }
}

function checkUniqueIds(model: CourseModel, issues: Issue[]): void {
  reportDuplicates(model.lessons, "lesson", "duplicate-lesson-id", issues);
  reportDuplicates(model.sections, "section", "duplicate-section-id", issues);
  reportDuplicates(model.glossary, "glossary", "duplicate-glossary-id", issues);
  reportDuplicates(model.labs, "lab", "duplicate-lab-id", issues);
}

function checkUniqueSlugs(model: CourseModel, issues: Issue[]): void {
  const seen = new Map<string, Lesson>();
  for (const lesson of model.lessons) {
    const previous = seen.get(lesson.slug);
    if (previous) {
      error(
        issues,
        "duplicate-slug",
        `slug '${lesson.slug}' is also used by lesson '${previous.id}'`,
        lesson.file,
      );
      continue;
    }
    seen.set(lesson.slug, lesson);
  }
}

function checkSiblingOrder(model: CourseModel, issues: Issue[]): void {
  const bySection = new Map<string, Lesson[]>();
  for (const lesson of model.lessons) {
    const bucket = bySection.get(lesson.sectionId);
    if (bucket) bucket.push(lesson);
    else bySection.set(lesson.sectionId, [lesson]);
  }
  for (const lessons of bySection.values()) {
    reportDuplicateOrder(lessons, "lesson", "duplicate-lesson-order", issues);
  }

  const byParent = new Map<string, Section[]>();
  for (const section of model.sections) {
    const key = section.parentId ?? "(root)";
    const bucket = byParent.get(key);
    if (bucket) bucket.push(section);
    else byParent.set(key, [section]);
  }
  for (const sections of byParent.values()) {
    reportDuplicateOrder(sections, "section", "duplicate-section-order", issues);
  }
}

function reportDuplicateOrder(
  items: { id: string; order: number; file: string }[],
  kind: string,
  rule: string,
  issues: Issue[],
): void {
  const byOrder = new Map<number, string>();
  for (const item of items) {
    const previous = byOrder.get(item.order);
    if (previous !== undefined) {
      error(
        issues,
        rule,
        `${kind} '${item.id}' and '${previous}' share order ${item.order}; navigation order would be ambiguous`,
        item.file,
      );
      continue;
    }
    byOrder.set(item.order, item.id);
  }
}

function checkPrerequisites(model: CourseModel, issues: Issue[]): void {
  const byId = new Map(model.lessons.map((lesson) => [lesson.id, lesson]));
  const edges = new Map<string, string[]>();

  for (const lesson of model.lessons) {
    const resolved: string[] = [];
    for (const prerequisiteId of lesson.prerequisites) {
      const target = byId.get(prerequisiteId);
      if (!target) {
        error(
          issues,
          "unresolved-prerequisite",
          `prerequisite '${prerequisiteId}' does not resolve to a lesson`,
          lesson.file,
        );
        continue;
      }
      resolved.push(prerequisiteId);
      if (lesson.status === "published" && target.status !== "published") {
        if (!lesson.allowDraftPrerequisites.includes(prerequisiteId)) {
          error(
            issues,
            "published-lesson-needs-draft",
            `published lesson depends on '${prerequisiteId}', which is '${target.status}'; publish it or list it in allow_draft_prerequisites`,
            lesson.file,
          );
        }
      }
    }
    edges.set(lesson.id, resolved);
  }

  for (const cycle of findCycles(edges)) {
    const first = byId.get(cycle[0]!);
    error(
      issues,
      "prerequisite-cycle",
      `prerequisite cycle: ${cycle.join(" -> ")}`,
      first?.file,
    );
  }
}

/** Return every cycle in a directed graph, each as a closed id path. */
function findCycles(edges: Map<string, string[]>): string[][] {
  const cycles: string[][] = [];
  const state = new Map<string, "visiting" | "done">();
  const stack: string[] = [];
  const seenCycles = new Set<string>();

  const visit = (node: string): void => {
    state.set(node, "visiting");
    stack.push(node);
    for (const next of edges.get(node) ?? []) {
      if (!edges.has(next)) continue;
      const nextState = state.get(next);
      if (nextState === "visiting") {
        const start = stack.indexOf(next);
        const cycle = [...stack.slice(start), next];
        const key = [...cycle].sort().join("|");
        if (!seenCycles.has(key)) {
          seenCycles.add(key);
          cycles.push(cycle);
        }
        continue;
      }
      if (nextState === undefined) visit(next);
    }
    stack.pop();
    state.set(node, "done");
  };

  for (const node of edges.keys()) {
    if (state.get(node) === undefined) visit(node);
  }
  return cycles;
}

function checkCells(model: CourseModel, issues: Issue[]): void {
  for (const lesson of model.lessons) {
    const seenCellIds = new Map<string, number>();
    const sessionFixtures = new Map<string, string>();

    for (const cell of lesson.cells) {
      const previousLine = seenCellIds.get(cell.id);
      if (previousLine !== undefined) {
        error(
          issues,
          "duplicate-cell-id",
          `cell id '${cell.id}' is already used at line ${previousLine} of this lesson`,
          lesson.file,
          cell.line,
        );
      } else {
        seenCellIds.set(cell.id, cell.line);
      }

      for (const packageName of cell.packages) {
        if (!isPinnedPackage(packageName)) {
          const known = Object.keys(PINNED_PACKAGES).join(", ");
          error(
            issues,
            "unpinned-package",
            `package '${packageName}' is not in the pinned distribution (available: ${known})`,
            lesson.file,
            cell.line,
          );
        }
      }

      if (cell.language === "python" && cell.fixture !== undefined) {
        error(issues, "fixture-on-python-cell", `fixture is only meaningful on SQL cells`, lesson.file, cell.line);
      }

      if (cell.language === "sql") {
        if (cell.fixture !== undefined) {
          if (cell.session !== undefined) {
            const existing = sessionFixtures.get(cell.session);
            if (existing !== undefined && existing !== cell.fixture) {
              error(
                issues,
                "session-fixture-conflict",
                `session '${cell.session}' already loaded fixture '${existing}'`,
                lesson.file,
                cell.line,
              );
            } else {
              sessionFixtures.set(cell.session, cell.fixture);
            }
          }
        } else if (cell.session === undefined || !sessionFixtures.has(cell.session)) {
          error(
            issues,
            "sql-cell-without-fixture",
            `SQL cell needs fixture="<lab id>", or a named session that already loaded one`,
            lesson.file,
            cell.line,
          );
        }
      }
    }
  }
}

function checkReferences(model: CourseModel, issues: Issue[]): void {
  const lessonIds = new Set(model.lessons.map((lesson) => lesson.id));
  const sectionIds = new Set(model.sections.map((section) => section.id));
  const termIds = new Set(model.glossary.map((entry) => entry.id));
  const labIds = new Set(model.labs.map((lab) => lab.id));

  for (const lesson of model.lessons) {
    for (const termId of lesson.terms) {
      if (!termIds.has(termId)) {
        error(issues, "unresolved-term", `term '${termId}' has no glossary entry`, lesson.file);
      }
    }
    for (const reference of lesson.references) {
      switch (reference.kind) {
        case "term":
          if (!termIds.has(reference.target)) {
            error(issues, "unresolved-term", `<Term id="${reference.target}"> has no glossary entry`, lesson.file, reference.line);
          }
          break;
        case "crossref":
          if (!lessonIds.has(reference.target) && !sectionIds.has(reference.target)) {
            error(
              issues,
              "unresolved-crossref",
              `<CrossRef id="${reference.target}"> resolves to neither a lesson nor a section`,
              lesson.file,
              reference.line,
            );
          }
          break;
        case "labref":
          if (!labIds.has(reference.target)) {
            error(issues, "unresolved-labref", `<LabRef id="${reference.target}"> has no lab fixture`, lesson.file, reference.line);
          }
          break;
        case "figure":
          break;
      }
    }
  }
}

function checkAnchors(model: CourseModel, issues: Issue[]): void {
  for (const lesson of model.lessons) {
    const seen = new Map<string, number>();
    for (const heading of lesson.headings) {
      const previous = seen.get(heading.anchor);
      if (previous !== undefined) {
        error(
          issues,
          "duplicate-anchor",
          `heading '${heading.text}' produces anchor '#${heading.anchor}', already used at line ${previous}`,
          lesson.file,
          heading.line,
        );
        continue;
      }
      seen.set(heading.anchor, heading.line);
    }
  }
}

function checkGlossary(model: CourseModel, issues: Issue[]): void {
  const byId = new Map(model.glossary.map((entry) => [entry.id, entry]));
  for (const entry of model.glossary) {
    for (const relatedId of entry.related) {
      if (!byId.has(relatedId)) {
        error(issues, "unresolved-related-term", `related term '${relatedId}' has no glossary entry`, entry.file);
      }
    }
    if (entry.related.includes(entry.id)) {
      error(issues, "self-related-term", `glossary entry '${entry.id}' lists itself as related`, entry.file);
    }
  }

  const byTermText = new Map<string, GlossaryEntry>();
  for (const entry of model.glossary) {
    for (const label of [entry.term, entry.english, ...entry.aliases]) {
      if (label === undefined) continue;
      const key = label.trim().toLowerCase();
      if (key.length === 0) continue;
      const previous = byTermText.get(key);
      if (previous && previous.id !== entry.id) {
        error(
          issues,
          "ambiguous-term-label",
          `'${label}' is claimed by both '${previous.id}' and '${entry.id}'`,
          entry.file,
        );
        continue;
      }
      byTermText.set(key, entry);
    }
  }
}

function checkFixtures(model: CourseModel, issues: Issue[]): void {
  const labsById = new Map(model.labs.map((lab) => [lab.id, lab]));
  for (const lesson of model.lessons) {
    for (const cell of lesson.cells) {
      if (cell.fixture === undefined) continue;
      if (!labsById.has(cell.fixture)) {
        error(issues, "unresolved-fixture", `fixture '${cell.fixture}' has no lab`, lesson.file, cell.line);
      }
    }
  }

  if (model.labs.length > 0 && !canInitializeFixtures()) {
    warn(
      issues,
      "fixture-check-skipped",
      `this runtime has no node:sqlite, so fixtures were only checked for existence, not replayed`,
    );
  }

  for (const lab of model.labs) {
    const sourcePath = path.resolve(model.root, lab.dir, lab.source);
    if (!isFile(sourcePath)) {
      error(issues, "missing-fixture-file", `fixture source '${lab.source}' does not exist`, lab.file);
      continue;
    }
    const failure = initializeFixture(sourcePath);
    if (failure !== undefined) {
      error(issues, "fixture-init-failed", `fixture '${lab.source}' failed to initialize: ${failure}`, lab.file);
    }
  }
}

function checkAssets(model: CourseModel, issues: Issue[]): void {
  const assetsRoot = path.resolve(model.root, "assets");
  for (const lesson of model.lessons) {
    const lessonDir = path.resolve(model.root, lesson.file, "..");
    for (const reference of lesson.references) {
      if (reference.kind !== "figure") continue;
      if (reference.target.length === 0) {
        error(issues, "figure-without-src", `<Figure> requires a src attribute`, lesson.file, reference.line);
        continue;
      }
      if (/^https?:\/\//.test(reference.target)) {
        error(
          issues,
          "remote-asset",
          `<Figure src="${reference.target}"> loads a remote asset; assets are self-hosted`,
          lesson.file,
          reference.line,
        );
        continue;
      }
      const candidates = [
        path.resolve(assetsRoot, reference.target),
        path.resolve(lessonDir, reference.target),
      ];
      if (!candidates.some(isFile)) {
        error(
          issues,
          "missing-asset",
          `<Figure src="${reference.target}"> does not exist under content/assets or next to the lesson`,
          lesson.file,
          reference.line,
        );
      }
    }
  }
}

function checkEditorialWarnings(model: CourseModel, issues: Issue[]): void {
  const sectionById = new Map(model.sections.map((section) => [section.id, section]));

  for (const lesson of model.lessons) {
    if (lesson.objectives.length === 0) {
      error(issues, "missing-objectives", `lesson declares no learning objectives`, lesson.file);
    }
    if (lesson.status === "published") {
      const section = sectionById.get(lesson.sectionId);
      if (section && section.status !== "active") {
        warn(
          issues,
          "lesson-in-inactive-section",
          `published lesson sits in section '${section.id}', whose status is '${section.status}'`,
          lesson.file,
        );
      }
    }
    if (lesson.cells.length === 0) {
      warn(issues, "lesson-without-cells", `lesson has no executable cells`, lesson.file);
    }
  }

  for (const entry of model.glossary) {
    if (entry.usedBy.length === 0) {
      warn(issues, "orphan-term", `glossary entry '${entry.id}' is not referenced by any lesson`, entry.file);
    }
  }

  for (const lab of model.labs) {
    if (lab.usedBy.length === 0) {
      warn(issues, "orphan-lab", `lab '${lab.id}' is not used by any lesson`, lab.file);
    }
  }

  for (const section of model.sections) {
    const hasLessons = model.lessons.some((lesson) => lesson.sectionId === section.id);
    const hasChild = model.sections.some((child) => child.parentId === section.id);
    if (!hasLessons && !hasChild) {
      warn(issues, "empty-section", `section '${section.id}' contains neither lessons nor subsections`, section.file);
    }
  }
}

// ---------------------------------------------------------------------------
// SQL fixture initialization
// ---------------------------------------------------------------------------

let sqliteModule: { DatabaseSync: new (path: string) => SqliteDatabase } | undefined | null = null;

interface SqliteDatabase {
  exec(sql: string): void;
  close(): void;
}

/**
 * Replay a `seed.sql` fixture into an in-memory SQLite database.
 *
 * Uses `node:sqlite` when the build runtime provides it. When it does not, the
 * check is skipped rather than silently passing: the caller gets a warning so
 * nobody mistakes "not checked" for "verified".
 */
function initializeFixture(sourcePath: string): string | undefined {
  const sqlite = loadSqlite();
  if (sqlite === undefined) {
    return undefined;
  }
  const sql = readFileSync(sourcePath, "utf8");
  let database: SqliteDatabase | undefined;
  try {
    database = new sqlite.DatabaseSync(":memory:");
    database.exec(sql);
    return undefined;
  } catch (failure) {
    return (failure as Error).message;
  } finally {
    database?.close();
  }
}

function loadSqlite(): { DatabaseSync: new (path: string) => SqliteDatabase } | undefined {
  if (sqliteModule !== null) return sqliteModule;
  try {
    const require = createRequire(import.meta.url);
    sqliteModule = require("node:sqlite") as { DatabaseSync: new (path: string) => SqliteDatabase };
  } catch {
    sqliteModule = undefined;
  }
  return sqliteModule;
}

/** Whether SQL fixture initialization can actually be executed on this runtime. */
export function canInitializeFixtures(): boolean {
  return loadSqlite() !== undefined;
}

function isFile(target: string): boolean {
  try {
    return statSync(target).isFile();
  } catch {
    return false;
  }
}
