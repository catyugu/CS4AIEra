import { isExecutableFence, parseCellMeta } from "../content-model/mdx-scan";

/**
 * Wrap executable fenced code in a `<CodeLab>` element.
 *
 * DESIGN.md section 7 makes the fence info string the authoring syntax for an
 * executable cell, so the compiler has to turn that fence into the interactive
 * component. Doing it in the mdast phase, before syntax highlighting, means the
 * cell is never highlighted and never rendered twice: the static code path and
 * the interactive path are the same fence, decided once.
 *
 * The fence is *wrapped*, not replaced, so it stays a code block: the shiki pass
 * still highlights it and `<CodeLab>` renders it as its fallback. A reader
 * without JavaScript sees a highlighted code block, not a blank cell.
 *
 * The cell source also travels as an attribute, because Reset and the editor
 * need the author's exact text rather than the rendered markup.
 */

interface CodeNode {
  type: string;
  lang?: string | null;
  meta?: string | null;
  value: string;
}

interface NodeContext {
  wrapNode(node: unknown, newNode: unknown): void;
  report(opts: { message: string; node?: unknown; severity?: "error" | "warning" | "info" }): void;
}

export function codelabCells() {
  return {
    name: "cs4ai:codelab-cells",
    code(node: CodeNode, ctx: NodeContext): void {
      if (node.type !== "code") return;
      const meta = node.meta ?? "";
      if (!isExecutableFence(meta)) return;

      const language = node.lang ?? "";
      if (language !== "python" && language !== "sql") {
        ctx.report({
          message: `executable cells must be \`\`\`python or \`\`\`sql, found \`\`\`${language || "(none)"}`,
          node,
          severity: "error",
        });
        return;
      }

      const { meta: parsed, problems } = parseCellMeta(meta);
      for (const problem of problems) {
        ctx.report({ message: problem, node, severity: "error" });
      }
      if (!parsed.id) {
        ctx.report({ message: "executable cell requires an id", node, severity: "error" });
        return;
      }

      const attributes: { type: string; name: string; value: string }[] = [
        { type: "mdxJsxAttribute", name: "id", value: parsed.id },
        { type: "mdxJsxAttribute", name: "language", value: language },
        { type: "mdxJsxAttribute", name: "source", value: node.value },
      ];
      if (parsed.session) {
        attributes.push({ type: "mdxJsxAttribute", name: "session", value: parsed.session });
      }
      if (parsed.fixture) {
        attributes.push({ type: "mdxJsxAttribute", name: "fixture", value: parsed.fixture });
      }
      if (parsed.timeoutMs !== undefined) {
        attributes.push({ type: "mdxJsxAttribute", name: "timeoutMs", value: String(parsed.timeoutMs) });
      }
      if (parsed.packages.length > 0) {
        attributes.push({ type: "mdxJsxAttribute", name: "packages", value: parsed.packages.join(",") });
      }
      if (parsed.editable === false) {
        attributes.push({ type: "mdxJsxAttribute", name: "editable", value: "false" });
      }

      ctx.wrapNode(node, {
        type: "mdxJsxFlowElement",
        name: "CodeLab",
        attributes,
        children: [],
      });
    },
  };
}
