import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import mdx from "@astrojs/mdx";

import { contentValidation } from "./src/integrations/content-validation";
import { labAssets } from "./src/integrations/lab-assets";
import { runtimeAssets } from "./src/integrations/runtime-assets";
import { codelabCells } from "./src/markdown/codelab-cells";
import { headingAnchors } from "./src/markdown/heading-anchors";
import { mathKatex } from "./src/markdown/math-katex";

// The site is static by construction: no adapter, no server routes, no runtime
// execution on the host. See doc/DESIGN.md sections 13 and 21.
export default defineConfig({
  output: "static",
  integrations: [mdx(), contentValidation(), labAssets(), runtimeAssets()],
  markdown: {
    processor: satteri({
      // Math is parsed into remark-math's nodes and rendered to static KaTeX
      // HTML by mathKatex(), so no math runtime reaches the browser.
      features: { math: true },
      // An executable fence becomes a <CodeLab> element (DESIGN.md section 7);
      // it must be rewritten before highlighting sees it. Math is rendered to
      // static KaTeX HTML in the same phase.
      mdastPlugins: [codelabCells(), mathKatex()],
      // Headings carry the anchors the content validator checks (DESIGN.md 17.10).
      hastPlugins: [headingAnchors()],
    }),
    shikiConfig: { themes: { light: "github-light", dark: "github-dark" } },
  },
  build: {
    // Emit readable asset names so a deploy can be diffed and cached sanely.
    assets: "_assets",
  },
});
