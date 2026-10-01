import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { AstroIntegration } from "astro";
import type { Plugin } from "vite";

import { loadCourseModel } from "../content-model/load";

/**
 * Serve SQL lab fixtures at stable URLs (DESIGN.md section 9.2).
 *
 * A fixture is addressed by its lab id — `/labs/<lab-id>/<source>` — not by its
 * path under `content/`, so reorganizing the content tree cannot break a lesson
 * that already ships. Nothing is copied into `public/`: the dev server answers
 * these URLs from the content tree, and the build emits exactly the files the
 * model declares, which keeps generated output out of hand-edited locations.
 */
export function labAssets(): AstroIntegration {
  return {
    name: "cs4ai:lab-assets",
    hooks: {
      "astro:config:setup": ({ updateConfig, config }) => {
        const contentRoot = path.join(fileURLToPath(config.root), "content");
        updateConfig({ vite: { plugins: [labAssetsPlugin(contentRoot)] } });
      },
    },
  };
}

const URL_PREFIX = "/labs/";

function labAssetsPlugin(contentRoot: string): Plugin {
  const fixtures = new Map<string, Buffer>();
  let loaded: Promise<void> | undefined;

  const ensureLoaded = (): Promise<void> => {
    loaded ??= (async () => {
      const { model, issues } = await loadCourseModel(contentRoot);
      if (issues.some((issue) => issue.severity === "error")) {
        throw new Error("lab assets cannot be served while the content tree has errors");
      }
      for (const lab of model.labs) {
        const source = path.resolve(model.root, lab.dir, lab.source);
        fixtures.set(`${URL_PREFIX}${lab.id}/${lab.source}`, await readFile(source));
      }
    })();
    return loaded;
  };

  return {
    name: "cs4ai:lab-assets",

    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const url = request.url;
        if (!url?.startsWith(URL_PREFIX)) return next();
        void (async () => {
          await ensureLoaded();
          const key = decodeURIComponent(url.split("?")[0]!);
          const fixture = fixtures.get(key);
          if (!fixture) return next();
          response.setHeader("Content-Type", "text/plain; charset=utf-8");
          response.setHeader("Cache-Control", "no-store");
          response.end(fixture);
        })();
      });
    },

    async generateBundle() {
      await ensureLoaded();
      for (const [url, source] of fixtures) {
        this.emitFile({ type: "asset", fileName: url.slice(1), source });
      }
    },
  };
}
