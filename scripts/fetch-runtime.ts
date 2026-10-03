/**
 * Fetch the pinned Pyodide distribution into `public/pyodide/`.
 *
 *   npm run setup:runtime            # core interpreter only (~13 MB)
 *   npm run setup:runtime --packages # plus every pinned package wheel
 *
 * The runtime is self-hosted so a build is reproducible and the deployed site
 * never depends on a public CDN (doc/DESIGN.md, 技术基线 and 关键设计决策). The files are
 * third-party build output, so they are not committed: this script is what
 * makes them reproducible.
 *
 * Every file is checked against a hash recorded here, not against whatever the
 * network happened to return. A mismatch is a hard failure — a silently
 * different interpreter is exactly the kind of change that would make a lesson
 * behave differently in front of a reader.
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { PINNED_PACKAGES, PYODIDE_VERSION } from "../src/content-model/runtime-config";

const BASE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full`;
const OUTPUT_DIR = path.resolve(process.cwd(), "public", "pyodide");

/** Core files the interpreter loads at startup, with the sha256 we pin. */
const CORE_FILES: Record<string, string> = {
  "pyodide.mjs": "6f1d60f7bf529beb300f0f47983c921d3982363640ba20af0e38efdddbc66109",
  "pyodide.asm.mjs": "f7cdc8ece80678ceb712f8e65ebe6d3a83203a180c399865f49612a051693635",
  "pyodide.asm.wasm": "cc36e3cab04fdfc9a63ff13eb52eae2b911bf46c025cc7b281f394bd3de1d5e6",
  "python_stdlib.zip": "fa1957e5777068fc4f7437f96d860ae2fbe9c19732ba06c84e004ec16dd7dd7a",
  "pyodide-lock.json": "5dc2fc119108bc148c7457dc86e7675b5c87e1cafd420b9c34c1eaef7b36c010",
};

const withPackages = process.argv.includes("--packages");

await mkdir(OUTPUT_DIR, { recursive: true });

let downloaded = 0;
let reused = 0;

for (const [name, expected] of Object.entries(CORE_FILES)) {
  if (await fetchVerified(name, expected)) downloaded += 1;
  else reused += 1;
}

if (withPackages) {
  const lock = JSON.parse(await readFile(path.join(OUTPUT_DIR, "pyodide-lock.json"), "utf8")) as {
    packages: Record<string, { file_name: string; sha256: string }>;
  };
  for (const name of Object.keys(PINNED_PACKAGES)) {
    const entry = lock.packages[name];
    if (!entry) throw new Error(`pinned package '${name}' is not in the Pyodide ${PYODIDE_VERSION} lock file`);
    if (await fetchVerified(entry.file_name, entry.sha256)) downloaded += 1;
    else reused += 1;
  }
}

console.log(
  `pyodide ${PYODIDE_VERSION}: ${downloaded} downloaded, ${reused} already current, into public/pyodide/`,
);

/** Download `name` unless the local copy already matches `expected`. */
async function fetchVerified(name: string, expected: string): Promise<boolean> {
  const target = path.join(OUTPUT_DIR, name);
  if ((await hashOf(target)) === expected) return false;

  const response = await fetch(`${BASE_URL}/${name}`);
  if (!response.ok) throw new Error(`${name}: ${response.status} ${response.statusText}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const actual = createHash("sha256").update(bytes).digest("hex");
  if (actual !== expected) {
    throw new Error(`${name}: sha256 ${actual} does not match the pinned ${expected}`);
  }
  await writeFile(target, bytes);
  return true;
}

async function hashOf(file: string): Promise<string | undefined> {
  try {
    return createHash("sha256").update(await readFile(file)).digest("hex");
  } catch {
    return undefined;
  }
}
