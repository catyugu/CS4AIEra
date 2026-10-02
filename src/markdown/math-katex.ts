import katex from "katex";

/**
 * Render `$...$` and `$$...$$` with KaTeX at build time.
 *
 * The processor's `features.math` parses math into the nodes remark-math
 * produces: `<code class="language-math math-inline">` inside a paragraph, and
 * `<pre><code class="language-math math-display">` as a block. This plugin
 * replaces both with KaTeX's static HTML plus MathML, so a page carries no math
 * runtime, no client script and no third-party request; the stylesheet and its
 * fonts come from the bundled `katex` package (see `src/styles/global.css`).
 *
 * `throwOnError` and `strict` are deliberately not relaxed: a formula KaTeX
 * cannot parse is a content error and has to fail the build instead of
 * rendering as error-colored text in a lesson.
 */

interface MathNode {
  type: string;
  value: string;
}

interface NodeContext {
  replaceNode(node: unknown, replacement: unknown): void;
}

function renderMath(node: MathNode, ctx: NodeContext, displayMode: boolean): void {
  const html = katex.renderToString(node.value, {
    displayMode,
    throwOnError: true,
    strict: "error",
    output: "htmlAndMathml",
  });
  ctx.replaceNode(node, { raw: html, mdxExpressions: false });
}

export function mathKatex() {
  return {
    name: "cs4ai:math-katex",
    math(node: MathNode, ctx: NodeContext): void {
      renderMath(node, ctx, true);
    },
    inlineMath(node: MathNode, ctx: NodeContext): void {
      renderMath(node, ctx, false);
    },
  };
}
