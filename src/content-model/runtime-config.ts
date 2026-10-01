/**
 * Pinned browser runtime configuration.
 *
 * The Pyodide distribution is pinned, and every package an executable cell may
 * declare is pinned to the exact version shipped inside that distribution.
 * Both facts come from the distribution's own lock file:
 *
 *   https://cdn.jsdelivr.net/pyodide/v<PYODIDE_VERSION>/full/pyodide-lock.json
 *
 * Reproducibility beats package count: a cell may only `packages="..."` a name
 * listed here. `sqlite3` is deliberately absent because it is part of the
 * Python standard library in this distribution, not a loadable package.
 *
 * When the distribution is upgraded, re-derive this table from the new lock
 * file and re-check version-sensitive lessons.
 */
export const PYODIDE_VERSION = "314.0.7";

/** Python version provided by the pinned distribution (from the lock file info block). */
export const PYODIDE_PYTHON_VERSION = "3.14";

/** Package name to the version shipped by the pinned distribution. */
export const PINNED_PACKAGES: Readonly<Record<string, string>> = Object.freeze({
  numpy: "2.4.6",
  pandas: "3.0.2",
  matplotlib: "3.10.8",
  scipy: "1.18.0",
  sympy: "1.14.0",
  networkx: "3.6.1",
});

export function isPinnedPackage(name: string): boolean {
  return Object.hasOwn(PINNED_PACKAGES, name);
}

/** Conservative default hard timeout for a single cell execution. */
export const DEFAULT_CELL_TIMEOUT_MS = 10_000;

/** Cap on captured stdout/stderr per cell, in bytes. */
export const MAX_OUTPUT_BYTES = 64 * 1024;

/** Default cap on rendered SQL result rows; labs may lower it. */
export const DEFAULT_MAX_RESULT_ROWS = 200;
