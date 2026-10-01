import { slugifyHeading } from "../content-model/mdx-scan";

/**
 * Assign heading `id` attributes with the same slug function the content
 * validator uses (`slugifyHeading`).
 *
 * Astro's default pipeline slugs headings with `github-slugger`, which
 * de-duplicates collisions by appending `-1`, `-2`, ... Our validator instead
 * treats a duplicate heading anchor as a build error, so the two rules would
 * silently disagree: the build would pass while the rendered page carried
 * suffixed anchors no author wrote and no cross-reference can target.
 *
 * This plugin runs before the built-in heading-id plugin, which reuses an
 * existing string `id`, so the documented rule is the rule that ships.
 */

interface HeadingNode {
  tagName?: string;
  properties?: Record<string, unknown>;
}

interface HeadingContext {
  setProperty(node: unknown, key: string, value: unknown): void;
  textContent(node: unknown): string;
}

export function headingAnchors() {
  return {
    name: "cs4ai:heading-anchors",
    element: {
      filter: ["h1", "h2", "h3", "h4", "h5", "h6"],
      visit(node: HeadingNode, ctx: HeadingContext): void {
        if (typeof node.properties?.id === "string") return;
        ctx.setProperty(node, "id", slugifyHeading(ctx.textContent(node)));
      },
    },
  };
}
