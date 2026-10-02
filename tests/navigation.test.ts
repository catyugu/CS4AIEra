import { describe, expect, it } from "vitest";

import { createSatteriMarkdownProcessor } from "@astrojs/markdown-satteri";

import { headingAnchors } from "../src/markdown/heading-anchors";
import {
  buildCourseTree,
  buildToc,
  isVisibleLesson,
  isVisibleSection,
  lessonNeighbors,
  readingOrder,
  sectionPathIds,
  sectionTrail,
  topLevelSectionIds,
} from "../src/content-model/navigation";
import type { CourseModel, Lesson, Section } from "../src/content-model/types";

function section(id: string, parentId: string | null, order: number, overrides: Partial<Section> = {}): Section {
  return {
    id,
    label: id,
    order,
    status: "active",
    parentId,
    file: `curriculum/${id}/_section.yaml`,
    ...overrides,
  };
}

function lesson(id: string, sectionId: string, order: number, overrides: Partial<Lesson> = {}): Lesson {
  return {
    id,
    slug: `/${id.replace(/\./g, "/")}`,
    order,
    title: id,
    status: "published",
    objectives: ["objective"],
    tokens: 0,
    sectionId,
    file: `curriculum/${sectionId}/${id}.mdx`,
    cells: [],
    staticBlocks: [],
    headings: [],
    references: [],
    ...overrides,
  };
}

function course(sections: Section[], lessons: Lesson[]): CourseModel {
  return { root: "/content", sections, lessons, glossary: [], labs: [] };
}

/** root > python > advanced, root > databases. */
function nestedCourse(): CourseModel {
  return course(
    [
      section("root", null, 0),
      section("databases", "root", 20),
      section("python", "root", 10),
      section("advanced", "python", 10),
    ],
    [
      lesson("python.b", "python", 20),
      lesson("python.a", "python", 10),
      lesson("advanced.a", "advanced", 10),
      lesson("databases.a", "databases", 10),
    ],
  );
}

describe("course tree", () => {
  it("nests by parent and orders sections and lessons by their own order", () => {
    const tree = buildCourseTree(nestedCourse());
    expect(tree.map((node) => node.section.id)).toEqual(["root"]);
    const root = tree[0]!;
    expect(root.depth).toBe(0);
    expect(root.lessons).toEqual([]);
    expect(root.children.map((node) => node.section.id)).toEqual(["python", "databases"]);

    const python = root.children[0]!;
    expect(python.depth).toBe(1);
    expect(python.lessons.map((entry) => entry.id)).toEqual(["python.a", "python.b"]);
    expect(python.children.map((node) => node.section.id)).toEqual(["advanced"]);
  });

  it("reads a section's own lessons before descending into its subsections", () => {
    const order = readingOrder(buildCourseTree(nestedCourse())).map((entry) => entry.id);
    expect(order).toEqual(["python.a", "python.b", "advanced.a", "databases.a"]);
  });

  it("moves to the neighbouring lesson and stops at the ends", () => {
    const order = readingOrder(buildCourseTree(nestedCourse()));
    expect(lessonNeighbors(order, "python.a")).toEqual({ previous: undefined, next: order[1] });
    expect(lessonNeighbors(order, "advanced.a")).toEqual({ previous: order[1], next: order[3] });
    expect(lessonNeighbors(order, "databases.a").next).toBeUndefined();
    expect(lessonNeighbors(order, "nope")).toEqual({});
  });
});

describe("visibility", () => {
  it("routes published lessons in active sections, and nothing else", () => {
    const model = course(
      [section("root", null, 0), section("draft-section", "root", 10, { status: "draft" }), section("old", "root", 20, { status: "archived" })],
      [
        lesson("published.lesson", "root", 10),
        lesson("draft.lesson", "root", 20, { status: "draft" }),
        lesson("review.lesson", "root", 30, { status: "review" }),
        lesson("archived.lesson", "root", 40, { status: "archived" }),
        lesson("hidden.lesson", "draft-section", 10),
        lesson("gone.lesson", "old", 10),
      ],
    );

    expect(readingOrder(buildCourseTree(model)).map((entry) => entry.id)).toEqual(["published.lesson"]);
    expect(readingOrder(buildCourseTree(model, { includeUnpublished: true })).map((entry) => entry.id)).toEqual([
      "published.lesson",
      "draft.lesson",
      "review.lesson",
      "hidden.lesson",
    ]);
  });

  it("keeps archived content out even when unpublished content is included", () => {
    expect(isVisibleLesson({ status: "archived" }, true)).toBe(false);
    expect(isVisibleSection({ status: "archived" }, true)).toBe(false);
    expect(isVisibleLesson({ status: "draft" }, true)).toBe(true);
    expect(isVisibleLesson({ status: "draft" }, false)).toBe(false);
    expect(isVisibleSection({ status: "draft" }, true)).toBe(true);
  });
});

describe("section trails", () => {
  const model = nestedCourse();

  it("walks from the root down to the section", () => {
    expect(sectionTrail(model, "advanced").map((entry) => entry.id)).toEqual(["root", "python", "advanced"]);
    expect(sectionTrail(model, "databases").map((entry) => entry.id)).toEqual(["root", "databases"]);
  });

  it("collects the branch a lesson lives on", () => {
    expect([...sectionPathIds(model, "advanced")]).toEqual(["root", "python", "advanced"]);
  });

  it("collects the top level only, for a page with no current lesson", () => {
    expect([...topLevelSectionIds(buildCourseTree(model))]).toEqual(["root"]);
  });
});

describe("table of contents", () => {
  const headings = [
    { depth: 1, slug: "title", text: "标题" },
    { depth: 2, slug: "a", text: "A" },
    { depth: 3, slug: "a-b", text: "A/B" },
    { depth: 4, slug: "deep", text: "D" },
  ];

  it("lists the section and subsection headings", () => {
    expect(buildToc(headings).map((entry) => entry.slug)).toEqual(["a", "a-b"]);
  });

  it("honours a different depth limit", () => {
    expect(buildToc(headings, 4).map((entry) => entry.slug)).toEqual(["a", "a-b", "deep"]);
  });
});

describe("heading anchors", () => {
  it("emits the same anchor the content validator checks", async () => {
    const renderer = await createSatteriMarkdownProcessor({
      hastPlugins: [headingAnchors()],
      syntaxHighlight: false,
    });
    const result = await renderer.render("## 模型：名称、对象、绑定\n\n## Setup and `teardown`\n", {});

    expect(result.code).toContain('id="模型名称对象绑定"');
    expect(result.code).toContain('id="setup-and-teardown"');
    expect(result.metadata.headings.map((heading) => heading.slug)).toEqual([
      "模型名称对象绑定",
      "setup-and-teardown",
    ]);
  });
});
