import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";

import { contentValidation } from "./src/integrations/content-validation";

// The site is static by construction: no adapter, no server routes, no runtime
// execution on the host. See doc/DESIGN.md sections 13 and 21.
export default defineConfig({
  output: "static",
  integrations: [mdx(), contentValidation()],
  build: {
    // Emit readable asset names so a deploy can be diffed and cached sanely.
    assets: "_assets",
  },
});
