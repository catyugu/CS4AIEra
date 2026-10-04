/**
 * Pyodide worker (doc/DESIGN.md, 浏览器执行模型).
 *
 * One worker per lesson page, created lazily on the first Run. The interpreter
 * and every cell run here, off the UI thread, so a slow or runaway program
 * cannot freeze the page. Stop is implemented by terminating this worker
 * (doc/DESIGN.md, 浏览器执行模型): a hard cancel that always works beats cooperative
 * cancellation that some workloads cannot honour.
 *
 * The worker is deliberately dumb about scheduling — it handles one request at
 * a time and reports what happened. The client serializes requests and owns all
 * lifecycle decisions.
 */

import runtimeSource from "../runtime/python-runtime.py?raw";
import { RUNTIME_PROTOCOL_VERSION, type RuntimeRequest, type RuntimeResponse, type RuntimeValue } from "../runtime/protocol";
import { PYODIDE_VERSION } from "../content-model/runtime-config";

/** The slice of the Pyodide API this worker uses, spelled out explicitly. */
interface Pyodide {
  runPython(code: string, options?: { filename?: string }): unknown;
  loadPackage(names: string | string[]): Promise<void>;
  globals: { get(name: string): unknown };
  setStdout(options: { write(buffer: Uint8Array): number }): void;
  setStderr(options: { write(buffer: Uint8Array): number }): void;
}

/** The Python entry point as seen from JS: a plain object in, a JSON string out. */
type HandleFn = (request: Record<string, unknown>) => Promise<string>;

const INDEX_URL = new URL("/pyodide/", self.location.origin).href;
const MAX_OUTPUT_BYTES = 64 * 1024;

const decoder = new TextDecoder();
let currentRequestId = "";

function post(message: RuntimeResponse): void {
  self.postMessage(message);
}

// ---------------------------------------------------------------------------
// Output capture (doc/DESIGN.md, 浏览器执行模型)
// ---------------------------------------------------------------------------

/**
 * Caps captured output per cell. The worker keeps counting after the cap so a
 * program that prints forever still finishes rather than blocking, but only the
 * first `MAX_OUTPUT_BYTES` reach the page.
 */
class OutputCapture {
  #bytes = 0;
  #capped = false;

  constructor(private readonly stream: "stdout" | "stderr") {}

  reset(): void {
    this.#bytes = 0;
    this.#capped = false;
  }

  writer(): { write(buffer: Uint8Array): number } {
    return {
      write: (buffer: Uint8Array): number => {
        if (this.#capped) return buffer.length;
        const room = MAX_OUTPUT_BYTES - this.#bytes;
        if (buffer.length > room) {
          this.#bytes = MAX_OUTPUT_BYTES;
          this.#capped = true;
          this.#emit(decoder.decode(buffer.subarray(0, Math.max(0, room))));
          this.#emit(`\n[output truncated at ${MAX_OUTPUT_BYTES} bytes]\n`, true);
          return buffer.length;
        }
        this.#bytes += buffer.length;
        this.#emit(decoder.decode(buffer, { stream: true }));
        return buffer.length;
      },
    };
  }

  #emit(chunk: string, truncated = false): void {
    if (!chunk) return;
    post(
      truncated
        ? { type: this.stream, requestId: currentRequestId, chunk, truncated: true }
        : { type: this.stream, requestId: currentRequestId, chunk },
    );
  }
}

const stdout = new OutputCapture("stdout");
const stderr = new OutputCapture("stderr");

// ---------------------------------------------------------------------------
// Interpreter lifecycle
// ---------------------------------------------------------------------------

let instance: Pyodide | undefined;
let loading: Promise<HandleFn> | undefined;

async function load(): Promise<HandleFn> {
  loading ??= (async () => {
    const { loadPyodide } = (await import(/* @vite-ignore */ `${INDEX_URL}pyodide.mjs`)) as {
      loadPyodide: (options: { indexURL: string }) => Promise<Pyodide>;
    };
    const pyodide = await loadPyodide({ indexURL: INDEX_URL });
    pyodide.setStdout(stdout.writer());
    pyodide.setStderr(stderr.writer());
    // The helpers live in their own module namespace. Cells never execute
    // there, so a cell can neither read nor shadow them (doc/DESIGN.md, 浏览器执行模型). Only
    // the single entry point is exposed to JS.
    pyodide.runPython(BOOTSTRAP, { filename: "cs4ai_bootstrap.py" });
    instance = pyodide;
    return pyodide.globals.get("__cs4ai_handle") as HandleFn;
  })();
  return loading;
}

const BOOTSTRAP = `import sys, types
_module = types.ModuleType("cs4ai_runtime")
_module.__file__ = "cs4ai_runtime.py"
exec(${JSON.stringify(runtimeSource)}, _module.__dict__)
sys.modules["cs4ai_runtime"] = _module
__cs4ai_handle = _module.handle
`;

/** Fetch a SQL fixture once per worker; sessions replay it from the cached text. */
const fixtures = new Map<string, string>();

async function fixtureSql(url: string): Promise<string> {
  const cached = fixtures.get(url);
  if (cached !== undefined) return cached;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`fixture ${url} returned ${response.status} ${response.statusText}`);
  const sql = await response.text();
  fixtures.set(url, sql);
  return sql;
}

// ---------------------------------------------------------------------------
// Request handling
// ---------------------------------------------------------------------------

self.addEventListener("message", (event: MessageEvent<RuntimeRequest>) => {
  void handleRequest(event.data);
});

async function handleRequest(request: RuntimeRequest): Promise<void> {
  currentRequestId = request.requestId;
  stdout.reset();
  stderr.reset();
  const started = performance.now();

  try {
    const run = await load();

    switch (request.type) {
      case "init":
        post({
          type: "ready",
          requestId: request.requestId,
          protocolVersion: RUNTIME_PROTOCOL_VERSION,
          pyodideVersion: PYODIDE_VERSION,
        });
        return;

      case "run-python":
        if (request.packages.length > 0) {
          // Names are pinned by the build, so this loads a wheel from the
          // self-hosted distribution rather than fetching arbitrary code.
          await instance!.loadPackage(request.packages);
        }
        emit(await run({ type: "run-python", source: request.source, session: request.session ?? null }));
        return;

      case "run-sql":
        emit(
          await run({
            type: "run-sql",
            source: request.source,
            session: request.session ?? null,
            fixtureSql: await fixtureSql(request.fixtureUrl),
            maxRows: request.maxResultRows,
          }),
        );
        return;

      case "reset-session":
        emit(await run({ type: "reset-session", session: request.session }));
        return;
    }
  } catch (error) {
    post({
      type: "error",
      requestId: currentRequestId,
      error: { kind: "internal", message: (error as Error).message, detail: (error as Error).stack },
    });
  } finally {
    post({ type: "done", requestId: currentRequestId, elapsedMs: performance.now() - started });
  }
}

// ---------------------------------------------------------------------------
// Result decoding
// ---------------------------------------------------------------------------

function emit(raw: string): void {
  const payload = JSON.parse(raw) as {
    results?: RuntimeValue[];
    error?: { kind: string; message: string; detail?: string } | null;
  };

  // A SQL cell can contain several statements, so its payload carries a list.
  for (const value of payload.results ?? []) {
    post({ type: "result", requestId: currentRequestId, value });
  }

  if (payload.error) {
    post({
      type: "error",
      requestId: currentRequestId,
      error: {
        kind: payload.error.kind === "syntax" ? "syntax" : "runtime",
        message: payload.error.message,
        detail: payload.error.detail,
      },
    });
  }
}
