import { access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { AstroIntegration } from "astro";

import { loadCourseModel } from "../content-model/load";
import { PYODIDE_VERSION } from "../content-model/runtime-config";

/**
 * Fail the build when a lesson declares executable cells but the self-hosted
 * runtime is not present.
 *
 * The runtime is third-party build output, so it is not committed (doc/DESIGN.md,
 * 技术基线 and 关键设计决策). That makes "the assets were never fetched" a real way to
 * ship a site whose every cell fails in front of a reader, and no content check
 * would catch it. Failing here turns a late, silent failure into an immediate
 * one that names the command to run.
 *
 * A course with no executable cells needs no runtime, so the check is skipped.
 */
export function runtimeAssets(): AstroIntegration {
  let projectRoot = process.cwd();

  return {
    name: "cs4ai:runtime-assets",
    hooks: {
      "astro:config:done": ({ config }) => {
        projectRoot = fileURLToPath(config.root);
      },
      "astro:build:start": async () => {
        const { model } = await loadCourseModel(path.join(projectRoot, "content"));
        const cells = model.lessons.reduce((total, lesson) => total + lesson.cells.length, 0);
        if (cells === 0) return;

        const entry = path.join(projectRoot, "public", "pyodide", "pyodide.mjs");
        try {
          await access(entry);
        } catch {
          throw new Error(
            `${cells} executable cell(s) are declared but public/pyodide/ is missing; ` +
              `run \`npm run setup:runtime\` (Pyodide ${PYODIDE_VERSION}) before building`,
          );
        }
      },
    },
  };
}
