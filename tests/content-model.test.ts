import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { stringify as toYaml } from "yaml";

import { loadCourseModel, splitFrontmatter } from "../src/content-model/load";
import { parseCellMeta, scanMdx } from "../src/content-model/mdx-scan";
import { validateContent } from "../src/content-model/validate";
import type { Issue } from "../src/content-model/types";

const tempRoots: string[] = [];

afterAll(async () => {
  await Promise.all(tempRoots.map((root) => rm(root, { recursive: true, force: true })));
});

async function validateTree(files: Record<string, string>) {
  const root = await mkdtemp(path.join(tmpdir(), "cs4ai-content-"));
  tempRoots.push(root);
  for (const [relative, contents] of Object.entries(files)) {
    const full = path.join(root, relative);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, contents, "utf8");
  }
  const { model, issues: loadIssues } = await loadCourseModel(path.join(root, "content"));
  const issues = [...loadIssues, ...validateContent(model)];
  return { model, issues };
}

const mdx = (frontmatter: Record<string, unknown>, body = ""): string =>
  `---\n${toYaml(frontmatter)}---\n${body}`;

const sectionYaml = (frontmatter: Record<string, unknown>): string => toYaml(frontmatter);

const labYaml = (id: string, source = "seed.sql"): string =>
  toYaml({ id, engine: "sqlite", source, reset: "recreate", max_result_rows: 200 });

function baseTree(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    "content/curriculum/_section.yaml": sectionYaml({ id: "root", label: "课程", order: 0, status: "active" }),
    "content/curriculum/topic/_section.yaml": sectionYaml({ id: "topic", label: "主题", order: 10, status: "active" }),
    "content/curriculum/topic/lesson.mdx": mdx(
      {
        id: "topic.lesson",
        slug: "/topic/lesson",
        order: 10,
        title: "课时",
        status: "published",
        objectives: ["说明某事"],
      },
      "```python run id=\"topic.lesson.cell\"\nprint(1)\n```\n",
    ),
    ...overrides,
  };
}

const rules = (issues: Issue[]): string[] => [...new Set(issues.map((issue) => issue.rule))].sort();

const messagesFor = (issues: Issue[], rule: string): string[] =>
  issues.filter((issue) => issue.rule === rule).map((issue) => issue.message);

describe("frontmatter and body scanning", () => {
  it("splits a leading YAML block from the body", () => {
    const split = splitFrontmatter("---\nid: a.b\n---\n\nbody text\n");
    expect(split?.frontmatter.trim()).toBe("id: a.b");
    expect(split?.body.trim()).toBe("body text");
    expect(splitFrontmatter("# no frontmatter\n")).toBeUndefined();
  });

  it("turns a run fence into a cell and leaves plain fences static", async () => {
    const { model } = await validateTree(
      baseTree({
        "content/curriculum/topic/lesson.mdx": mdx(
          {
            id: "topic.lesson",
            slug: "/topic/lesson",
            order: 10,
            title: "课时",
            status: "published",
            objectives: ["说明某事"],
          },
          [
            "```python run id=\"a\" timeout=2500 packages=\"numpy\"",
            "print(1)",
            "```",
            "",
            "```python",
            "print(2)",
            "```",
          ].join("\n"),
        ),
      }),
    );
    const lesson = model.lessons.find((entry) => entry.id === "topic.lesson")!;
    expect(lesson.cells).toHaveLength(1);
    expect(lesson.cells[0]).toMatchObject({
      id: "a",
      language: "python",
      timeoutMs: 2500,
      packages: ["numpy"],
      editable: true,
      outputMode: "auto",
    });
    expect(lesson.cells[0]!.source).toBe("print(1)");
    expect(lesson.staticBlocks).toHaveLength(1);
  });

  it("does not read authoring references out of fenced code", () => {
    const scan = scanMdx("```python\nvalue = <Term id=\"not-a-reference\">\n```\n\n<Term id=\"real\">x</Term>\n");
    expect(scan.references.map((reference) => reference.target)).toEqual(["real"]);
  });

  it("rejects unknown frontmatter keys instead of ignoring them", async () => {
    const { issues } = await validateTree(
      baseTree({
        "content/curriculum/topic/lesson.mdx": mdx({
          id: "topic.lesson",
          slug: "/topic/lesson",
          order: 10,
          title: "课时",
          status: "published",
          objectives: ["说明某事"],
          estimated_reading_minute: 30,
        }),
      }),
    );
    expect(rules(issues)).toContain("invalid-lesson-metadata");
  });
});

describe("identity and references", () => {
  it("reports duplicate lesson ids and duplicate slugs", async () => {
    const lessonFrontmatter = {
      id: "topic.lesson",
      slug: "/topic/lesson",
      order: 10,
      title: "课时",
      status: "published",
      objectives: ["说明某事"],
    };
    const { issues } = await validateTree(
      baseTree({
        "content/curriculum/topic/copy.mdx": mdx(lessonFrontmatter),
      }),
    );
    expect(rules(issues)).toContain("duplicate-lesson-id");
    expect(rules(issues)).toContain("duplicate-slug");
  });

  it("reports prerequisites that do not resolve", async () => {
    const { issues } = await validateTree(
      baseTree({
        "content/curriculum/topic/lesson.mdx": mdx({
          id: "topic.lesson",
          slug: "/topic/lesson",
          order: 10,
          title: "课时",
          status: "published",
          objectives: ["说明某事"],
          prerequisites: ["topic.missing"],
        }),
      }),
    );
    expect(messagesFor(issues, "unresolved-prerequisite")[0]).toContain("topic.missing");
  });

  it("detects a prerequisite cycle", async () => {
    const { issues } = await validateTree(
      baseTree({
        "content/curriculum/topic/a.mdx": mdx({
          id: "topic.a",
          slug: "/topic/a",
          order: 10,
          title: "A",
          status: "published",
          objectives: ["x"],
          prerequisites: ["topic.b"],
        }),
        "content/curriculum/topic/b.mdx": mdx({
          id: "topic.b",
          slug: "/topic/b",
          order: 20,
          title: "B",
          status: "published",
          objectives: ["x"],
          prerequisites: ["topic.a"],
        }),
      }),
    );
    expect(messagesFor(issues, "prerequisite-cycle")[0]).toContain("topic.a -> topic.b -> topic.a");
  });

  it("stops a published lesson from depending on an unpublished one unless it opts in", async () => {
    const draft = mdx({
      id: "topic.draft",
      slug: "/topic/draft",
      order: 20,
      title: "草稿",
      status: "draft",
      objectives: ["x"],
    });
    const depend = (extra: Record<string, unknown>) =>
      mdx({
        id: "topic.lesson",
        slug: "/topic/lesson",
        order: 10,
        title: "课时",
        status: "published",
        objectives: ["说明某事"],
        prerequisites: ["topic.draft"],
        ...extra,
      });

    const blocked = await validateTree(
      baseTree({ "content/curriculum/topic/draft.mdx": draft, "content/curriculum/topic/lesson.mdx": depend({}) }),
    );
    expect(rules(blocked.issues)).toContain("published-lesson-needs-draft");

    const allowed = await validateTree(
      baseTree({
        "content/curriculum/topic/draft.mdx": draft,
        "content/curriculum/topic/lesson.mdx": depend({ allow_draft_prerequisites: ["topic.draft"] }),
      }),
    );
    expect(rules(allowed.issues)).not.toContain("published-lesson-needs-draft");
  });

  it("reports authoring references that do not resolve", async () => {
    const { issues } = await validateTree(
      baseTree({
        "content/curriculum/topic/lesson.mdx": mdx(
          {
            id: "topic.lesson",
            slug: "/topic/lesson",
            order: 10,
            title: "课时",
            status: "published",
            objectives: ["说明某事"],
            terms: ["missing-term"],
          },
          [
            "```python run id=\"topic.lesson.cell\"",
            "print(1)",
            "```",
            "",
            "<Term id=\"ghost\">x</Term>",
            "<CrossRef id=\"topic.nowhere\" />",
            "<LabRef id=\"lab.nowhere\" />",
          ].join("\n"),
        ),
      }),
    );
    expect(rules(issues)).toEqual(
      expect.arrayContaining(["unresolved-term", "unresolved-crossref", "unresolved-labref"]),
    );
  });

  it("reports headings that collide into one anchor", async () => {
    const { issues } = await validateTree(
      baseTree({
        "content/curriculum/topic/lesson.mdx": mdx(
          {
            id: "topic.lesson",
            slug: "/topic/lesson",
            order: 10,
            title: "课时",
            status: "published",
            objectives: ["说明某事"],
          },
          "## State\n\n## state\n",
        ),
      }),
    );
    expect(messagesFor(issues, "duplicate-anchor")[0]).toContain("#state");
  });
});

describe("executable cells", () => {
  it("parses cell options and reports malformed ones", () => {
    const ok = parseCellMeta('run id="a" session="s" timeout=1500 packages="numpy, pandas" output=table editable=false');
    expect(ok.problems).toEqual([]);
    expect(ok.meta).toMatchObject({
      run: true,
      id: "a",
      session: "s",
      timeoutMs: 1500,
      packages: ["numpy", "pandas"],
      outputMode: "table",
      editable: false,
    });

    const bad = parseCellMeta('run id="a" timeout=soon output=chart session="isolated" colour="red"');
    expect(bad.problems).toEqual(
      expect.arrayContaining([
        "timeout must be a positive integer number of milliseconds",
        "output must be auto, text or table",
        'session="isolated" is the default; omit it',
        "unknown cell option 'colour'",
      ]),
    );
  });

  it("requires an id and unique ids within a lesson", async () => {
    const { issues } = await validateTree(
      baseTree({
        "content/curriculum/topic/lesson.mdx": mdx(
          {
            id: "topic.lesson",
            slug: "/topic/lesson",
            order: 10,
            title: "课时",
            status: "published",
            objectives: ["说明某事"],
          },
          ["```python run", "print(1)", "```", "```python run id=\"dup\"", "print(2)", "```", "```python run id=\"dup\"", "print(3)", "```"].join(
            "\n",
          ),
        ),
      }),
    );
    expect(rules(issues)).toContain("missing-cell-id");
    expect(messagesFor(issues, "duplicate-cell-id")[0]).toContain("'dup'");
  });

  it("rejects packages outside the pinned distribution", async () => {
    const { issues } = await validateTree(
      baseTree({
        "content/curriculum/topic/lesson.mdx": mdx(
          {
            id: "topic.lesson",
            slug: "/topic/lesson",
            order: 10,
            title: "课时",
            status: "published",
            objectives: ["说明某事"],
          },
          "```python run id=\"a\" packages=\"numpy,torch\"\nprint(1)\n```\n",
        ),
      }),
    );
    expect(messagesFor(issues, "unpinned-package")[0]).toContain("torch");
  });

  it("requires a fixture for SQL cells, except within a session that already loaded one", async () => {
    const lesson = (body: string) =>
      mdx(
        {
          id: "topic.lesson",
          slug: "/topic/lesson",
          order: 10,
          title: "课时",
          status: "published",
          objectives: ["说明某事"],
        },
        body,
      );
    const files = (body: string) =>
      baseTree({
        "content/curriculum/topic/lesson.mdx": lesson(body),
        "content/labs/orders/lab.yaml": labYaml("lab.orders"),
        "content/labs/orders/seed.sql": "CREATE TABLE t (a INTEGER);\n",
      });

    const missing = await validateTree(files('```sql run id="a"\nSELECT 1;\n```\n'));
    expect(rules(missing.issues)).toContain("sql-cell-without-fixture");

    const sessioned = await validateTree(
      files(
        [
          "```sql run id=\"a\" session=\"s\" fixture=\"lab.orders\"",
          "SELECT 1;",
          "```",
          "```sql run id=\"b\" session=\"s\"",
          "SELECT 2;",
          "```",
        ].join("\n"),
      ),
    );
    expect(rules(sessioned.issues)).not.toContain("sql-cell-without-fixture");
    expect(rules(sessioned.issues)).not.toContain("session-fixture-conflict");

    const conflicting = await validateTree(
      files(
        [
          "```sql run id=\"a\" session=\"s\" fixture=\"lab.orders\"",
          "SELECT 1;",
          "```",
          "```sql run id=\"b\" session=\"s\" fixture=\"lab.other\"",
          "SELECT 2;",
          "```",
        ].join("\n"),
      ),
    );
    expect(rules(conflicting.issues)).toContain("session-fixture-conflict");
  });

  it("rejects a fixture on a Python cell", async () => {
    const { issues } = await validateTree(
      baseTree({
        "content/curriculum/topic/lesson.mdx": mdx(
          {
            id: "topic.lesson",
            slug: "/topic/lesson",
            order: 10,
            title: "课时",
            status: "published",
            objectives: ["说明某事"],
          },
          '```python run id="a" fixture="lab.orders"\nprint(1)\n```\n',
        ),
      }),
    );
    expect(rules(issues)).toContain("fixture-on-python-cell");
  });
});

describe("fixtures and assets", () => {
  it("replays a seed file and reports SQL that cannot initialize", async () => {
    const body = '```sql run id="a" fixture="lab.broken"\nSELECT 1;\n```\n';
    const { issues } = await validateTree(
      baseTree({
        "content/curriculum/topic/lesson.mdx": mdx(
          {
            id: "topic.lesson",
            slug: "/topic/lesson",
            order: 10,
            title: "课时",
            status: "published",
            objectives: ["说明某事"],
          },
          body,
        ),
        "content/labs/broken/lab.yaml": labYaml("lab.broken"),
        "content/labs/broken/seed.sql": "CREATE TABLE t (a INTEGER;\n",
      }),
    );
    expect(messagesFor(issues, "fixture-init-failed")[0]).toContain("seed.sql");
  });

  it("reports a missing fixture file and an unresolved fixture id", async () => {
    const { issues } = await validateTree(
      baseTree({
        "content/curriculum/topic/lesson.mdx": mdx(
          {
            id: "topic.lesson",
            slug: "/topic/lesson",
            order: 10,
            title: "课时",
            status: "published",
            objectives: ["说明某事"],
          },
          '```sql run id="a" fixture="lab.ghost"\nSELECT 1;\n```\n',
        ),
        "content/labs/empty/lab.yaml": labYaml("lab.empty"),
      }),
    );
    expect(rules(issues)).toContain("unresolved-fixture");
    expect(rules(issues)).toContain("missing-fixture-file");
  });

  it("requires figures to point at self-hosted assets that exist", async () => {
    const body = (src: string) =>
      [
        "```python run id=\"topic.lesson.cell\"",
        "print(1)",
        "```",
        "",
        `<Figure src="${src}" alt="x" />`,
      ].join("\n");
    const files = (src: string) =>
      baseTree({
        "content/curriculum/topic/lesson.mdx": mdx(
          {
            id: "topic.lesson",
            slug: "/topic/lesson",
            order: 10,
            title: "课时",
            status: "published",
            objectives: ["说明某事"],
          },
          body(src),
        ),
        "content/assets/figures/diagram.txt": "asset\n",
      });

    const missing = await validateTree(files("figures/absent.png"));
    expect(rules(missing.issues)).toContain("missing-asset");

    const remote = await validateTree(files("https://example.com/diagram.png"));
    expect(rules(remote.issues)).toContain("remote-asset");

    const present = await validateTree(files("figures/diagram.txt"));
    expect(rules(present.issues)).not.toContain("missing-asset");
  });
});

describe("glossary", () => {
  it("resolves related terms and rejects ambiguous labels", async () => {
    const lesson = mdx(
      {
        id: "topic.lesson",
        slug: "/topic/lesson",
        order: 10,
        title: "课时",
        status: "published",
        objectives: ["说明某事"],
        terms: ["alias", "invariant"],
      },
      "```python run id=\"topic.lesson.cell\"\nprint(1)\n```\n",
    );
    const { issues } = await validateTree(
      baseTree({
        "content/curriculum/topic/lesson.mdx": lesson,
        "content/glossary/alias.mdx": mdx({ id: "alias", term: "别名", english: "alias", short: "同一对象的多个名称", related: ["invariant", "ghost"] }),
        "content/glossary/invariant.mdx": mdx({ id: "invariant", term: "不变量", english: "alias", short: "保持成立的性质" }),
      }),
    );
    expect(messagesFor(issues, "unresolved-related-term")[0]).toContain("ghost");
    expect(messagesFor(issues, "ambiguous-term-label")[0]).toContain("alias");
  });

  it("warns about terms and labs nothing uses", async () => {
    const { issues } = await validateTree(
      baseTree({
        "content/glossary/unused.mdx": mdx({ id: "unused", term: "未使用", short: "无引用" }),
        "content/labs/spare/lab.yaml": labYaml("lab.spare"),
        "content/labs/spare/seed.sql": "CREATE TABLE t (a INTEGER);\n",
      }),
    );
    expect(rules(issues)).toContain("orphan-term");
    expect(rules(issues)).toContain("orphan-lab");
    expect(issues.filter((issue) => issue.severity === "error")).toEqual([]);
  });
});

describe("repository content", () => {
  it("validates clean", async () => {
    const { model, issues: loadIssues } = await loadCourseModel(path.resolve(process.cwd(), "content"));
    const issues = [...loadIssues, ...validateContent(model)];
    expect(issues.map((issue) => `${issue.severity} ${issue.rule} ${issue.file}: ${issue.message}`)).toEqual([]);
    expect(model.lessons.length).toBeGreaterThan(0);
  });
});
