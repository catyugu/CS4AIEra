/**
 * Content model types.
 *
 * These describe the compiled, validated shape of the course tree. Authoring
 * source (MDX frontmatter, `_section.yaml`, `lab.yaml`) is parsed into these
 * structures by `load.ts` and checked by `validate.ts`.
 *
 * Identity is carried by stable `id` fields, never by file paths. Paths appear
 * only as provenance for diagnostics.
 */

export type LessonStatus = "draft" | "review" | "published" | "archived";
export type SectionStatus = "draft" | "active" | "archived";
export type CellLanguage = "python" | "sql";

/** A fenced code block that carries no `run` flag. Rendered as static code. */
export interface StaticCodeBlock {
  language: string;
  source: string;
  /** 1-based line number of the opening fence. */
  line: number;
}

/** A fenced code block explicitly marked executable by its info string. */
export interface ExecutableCell {
  id: string;
  language: CellLanguage;
  source: string;
  /** 1-based line number of the opening fence. */
  line: number;
  /** Absent means the cell runs in an isolated namespace. */
  session?: string;
  timeoutMs?: number;
  packages: string[];
  /** SQL lab fixture id; SQL cells only. */
  fixture?: string;
  editable: boolean;
  /** Optional documentation snapshot of expected output. Never used for grading. */
  expectedOutput?: string;
}

export interface Heading {
  level: number;
  text: string;
  anchor: string;
  line: number;
}

export type ReferenceKind = "term" | "crossref" | "labref" | "figure";

/** An explicit authoring reference found in lesson body text. */
export interface ContentReference {
  kind: ReferenceKind;
  /** Target id for term/crossref/labref; asset path for figure. */
  target: string;
  line: number;
}

export interface Lesson {
  id: string;
  slug: string;
  order: number;
  title: string;
  status: LessonStatus;
  objectives: string[];
  estimatedReadingMinutes?: number;
  /** Owning section id. */
  sectionId: string;
  /** Repo-relative path, for diagnostics only. */
  file: string;
  cells: ExecutableCell[];
  staticBlocks: StaticCodeBlock[];
  headings: Heading[];
  references: ContentReference[];
}

export interface Section {
  id: string;
  label: string;
  order: number;
  summary?: string;
  status: SectionStatus;
  parentId: string | null;
  file: string;
}

export interface GlossaryEntry {
  id: string;
  term: string;
  english?: string;
  aliases: string[];
  domains: string[];
  /** One-or-two-sentence definition shown in the quick-definition popover. */
  short: string;
  related: string[];
  file: string;
  /** Lesson ids that explicitly reference this term. */
  usedBy: string[];
}

export interface LabFixture {
  id: string;
  engine: "sqlite";
  /** Fixture file name relative to the lab directory. */
  source: string;
  reset: "recreate";
  maxResultRows: number;
  /** Lab directory, repo-relative, for diagnostics only. */
  dir: string;
  file: string;
  /** Lesson ids referencing this fixture. */
  usedBy: string[];
}

export interface CourseModel {
  root: string;
  sections: Section[];
  lessons: Lesson[];
  glossary: GlossaryEntry[];
  labs: LabFixture[];
}

export type IssueSeverity = "error" | "warning";

export interface Issue {
  /** Stable rule identifier, e.g. `duplicate-lesson-id`. */
  rule: string;
  severity: IssueSeverity;
  message: string;
  file?: string;
  line?: number;
}
