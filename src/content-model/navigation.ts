import type { CourseModel, Lesson, LessonStatus, Section, SectionStatus } from "./types";

/**
 * Navigation over the course tree.
 *
 * These functions are pure so the ordering rules can be tested without a
 * browser or a build.
 *
 * Reading order is a depth-first walk of the tree: a section's own lessons come
 * before its subsections, and both are ordered by their `order` field. Within a
 * section, `order` is scoped to that section, which is why ordering is computed
 * per node rather than globally.
 */

export interface NavigationOptions {
  /**
   * Include `draft`/`review` lessons and `draft` sections. Set from
   * `import.meta.env.DEV` so authors can read work in progress; production
   * builds route published content only. `archived` is never visible.
   */
  includeUnpublished?: boolean;
}

export interface CourseTreeNode {
  section: Section;
  /** 0 for a top-level section. */
  depth: number;
  lessons: Lesson[];
  children: CourseTreeNode[];
}

export interface LessonNeighbors {
  previous?: Lesson;
  next?: Lesson;
}

export interface TocEntry {
  depth: number;
  slug: string;
  text: string;
}

export function isVisibleSection(section: { status: SectionStatus }, includeUnpublished: boolean): boolean {
  if (section.status === "archived") return false;
  return section.status === "active" || includeUnpublished;
}

export function isVisibleLesson(lesson: { status: LessonStatus }, includeUnpublished: boolean): boolean {
  if (lesson.status === "archived") return false;
  return lesson.status === "published" || includeUnpublished;
}

export function buildCourseTree(model: CourseModel, options: NavigationOptions = {}): CourseTreeNode[] {
  const includeUnpublished = options.includeUnpublished ?? false;

  const visibleSections = model.sections.filter((section) => isVisibleSection(section, includeUnpublished));
  const visibleLessons = model.lessons.filter((lesson) => isVisibleLesson(lesson, includeUnpublished));

  const byOrder = <T extends { order: number }>(items: T[]): T[] => [...items].sort((a, b) => a.order - b.order);

  const build = (parentId: string | null, depth: number): CourseTreeNode[] =>
    byOrder(visibleSections.filter((section) => section.parentId === parentId)).map((section) => ({
      section,
      depth,
      lessons: byOrder(visibleLessons.filter((lesson) => lesson.sectionId === section.id)),
      children: build(section.id, depth + 1),
    }));

  return build(null, 0);
}

/** Every visible lesson, in the order a reader encounters them. */
export function readingOrder(tree: CourseTreeNode[]): Lesson[] {
  return tree.flatMap((node) => [...node.lessons, ...readingOrder(node.children)]);
}

export function lessonNeighbors(order: Lesson[], lessonId: string): LessonNeighbors {
  const index = order.findIndex((lesson) => lesson.id === lessonId);
  if (index === -1) return {};
  return { previous: order[index - 1], next: order[index + 1] };
}

/** Ancestor sections from the root down to `sectionId`, inclusive. */
export function sectionTrail(model: CourseModel, sectionId: string): Section[] {
  const byId = new Map(model.sections.map((section) => [section.id, section]));
  const trail: Section[] = [];
  let current = byId.get(sectionId);
  while (current) {
    trail.unshift(current);
    current = current.parentId === null ? undefined : byId.get(current.parentId);
  }
  return trail;
}

/** Section ids from the root to `sectionId`, for expanding the current branch. */
export function sectionPathIds(model: CourseModel, sectionId: string): Set<string> {
  return new Set(sectionTrail(model, sectionId).map((section) => section.id));
}

/**
 * Section ids at the top level of the tree. A page with no current lesson opens
 * the navigation down to this level only, so nested sections stay collapsed.
 */
export function topLevelSectionIds(tree: CourseTreeNode[]): Set<string> {
  return new Set(tree.map((node) => node.section.id));
}

/**
 * Table of contents for a rendered lesson. Headings come from the render step,
 * so the anchors are the ones actually emitted.
 */
export function buildToc(headings: TocEntry[], maxDepth = 3): TocEntry[] {
  return headings.filter((heading) => heading.depth > 1 && heading.depth <= maxDepth);
}
