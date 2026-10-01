import {
  RUNTIME_PROTOCOL_VERSION,
  type RuntimeError,
  type RuntimeRequest,
  type RuntimeResponse,
  type RuntimeValue,
} from "./protocol";

/**
 * Lesson runtime client (DESIGN.md sections 8.1 and 11).
 *
 * Owns the worker's lifecycle: created on the first Run so a lesson page pays
 * nothing until the reader asks for it, terminated on Stop so a runaway program
 * is always stoppable, and recreated on the next Run. Requests are serialized —
 * one cell runs at a time, in the order the reader asked for.
 *
 * This module knows nothing about the DOM; the UI subscribes to chunks and
 * renders them.
 */

export interface CellRunResult {
  stdout: string;
  stderr: string;
  values: RuntimeValue[];
  error?: RuntimeError;
  elapsedMs: number;
  /** True when the worker capped captured output for this run. */
  truncated: boolean;
}

export interface RunOptions {
  /** Called as output arrives, so the page can stream instead of waiting. */
  onChunk?: (stream: "stdout" | "stderr", chunk: string) => void;
  timeoutMs?: number;
}

/** Why a run ended early. The UI owns the wording, so this stays machine-readable. */
export type CancelReason = "stopped" | "timeout";

/** Raised when a run ends because the reader pressed Stop or it timed out. */
export class RunCancelled extends Error {
  constructor(
    readonly reason: CancelReason,
    /** The limit that was exceeded, for `timeout`. */
    readonly timeoutMs?: number,
  ) {
    super(reason);
    this.name = "RunCancelled";
  }
}

export class LessonRuntime {
  #worker?: Worker;
  #ready?: Promise<void>;
  #queue: Promise<unknown> = Promise.resolve();
  #running = false;
  /** Rejects the in-flight run when the worker is torn down under it. */
  #abort?: (error: RunCancelled) => void;

  constructor(private readonly options: { defaultTimeoutMs: number; workerFactory?: () => Worker }) {}

  get isRunning(): boolean {
    return this.#running;
  }

  runPython(
    request: { cellId: string; source: string; session?: string; packages?: string[] },
    options: RunOptions = {},
  ): Promise<CellRunResult> {
    return this.#enqueue(
      {
        type: "run-python",
        requestId: nextRequestId(),
        cellId: request.cellId,
        source: request.source,
        session: request.session,
        packages: request.packages ?? [],
      },
      options,
    );
  }

  runSql(
    request: { cellId: string; source: string; session?: string; fixtureUrl: string; maxResultRows: number },
    options: RunOptions = {},
  ): Promise<CellRunResult> {
    return this.#enqueue(
      {
        type: "run-sql",
        requestId: nextRequestId(),
        cellId: request.cellId,
        source: request.source,
        session: request.session,
        fixtureUrl: request.fixtureUrl,
        maxResultRows: request.maxResultRows,
      },
      options,
    );
  }

  /** Rebuild one named session: its namespace and its SQL connection. */
  resetSession(session: string): Promise<CellRunResult> {
    return this.#enqueue({ type: "reset-session", requestId: nextRequestId(), session }, {});
  }

  /**
   * Cancel whatever is running by terminating the worker.
   *
   * This is the reliable baseline (DESIGN.md section 11): cooperative
   * cancellation cannot stop every Python workload, and a page that cannot stop
   * a `while True:` is unusable. Named sessions live in the worker, so this
   * discards them too — the UI says so.
   */
  stop(): void {
    const abort = this.#abort;
    this.#terminate();
    abort?.(new RunCancelled("stopped"));
  }

  // -------------------------------------------------------------------------

  /**
   * Drop the worker without notifying the run.
   *
   * Separate from {@link stop} because a run can end for reasons the caller has
   * to be able to tell apart: Stop, and the timeout below. Going through `stop`
   * would report both as "stopped".
   */
  #terminate(): void {
    if (!this.#worker) return;
    this.#worker.terminate();
    this.#worker = undefined;
    this.#ready = undefined;
  }

  #enqueue(request: RuntimeRequest, options: RunOptions): Promise<CellRunResult> {
    const run = this.#queue.then(() => this.#execute(request, options));
    // Keep the chain alive after a failure so one bad cell cannot wedge the
    // queue; the failure is still reported to the caller.
    this.#queue = run.catch(() => undefined);
    return run;
  }

  #execute(request: RuntimeRequest, options: RunOptions): Promise<CellRunResult> {
    const timeoutMs = options.timeoutMs ?? this.options.defaultTimeoutMs;
    let worker: Worker | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;

    return new Promise<CellRunResult>((resolve, reject) => {
      const result: CellRunResult = { stdout: "", stderr: "", values: [], elapsedMs: 0, truncated: false };
      let settled = false;

      const settle = (outcome: () => void): void => {
        if (settled) return;
        settled = true;
        if (timer !== undefined) clearTimeout(timer);
        this.#running = false;
        this.#abort = undefined;
        worker?.removeEventListener("message", onMessage);
        worker?.removeEventListener("error", onError);
        outcome();
      };

      const onMessage = (event: MessageEvent<RuntimeResponse>): void => {
        const message = event.data;
        if (message.requestId !== request.requestId) return;
        switch (message.type) {
          case "stdout":
            result.stdout += message.chunk;
            result.truncated ||= message.truncated === true;
            options.onChunk?.("stdout", message.chunk);
            break;
          case "stderr":
            result.stderr += message.chunk;
            result.truncated ||= message.truncated === true;
            options.onChunk?.("stderr", message.chunk);
            break;
          case "result":
            result.values.push(message.value);
            break;
          case "error":
            result.error = message.error;
            break;
          case "done":
            result.elapsedMs = message.elapsedMs;
            settle(() => resolve(result));
            break;
          case "ready":
            break;
        }
      };

      const onError = (event: ErrorEvent): void => {
        settle(() => reject(new Error(event.message || "the runtime worker failed")));
      };

      // The run counts as running, and is cancellable, from here — including
      // while the interpreter is still loading. A reader on a slow link must be
      // able to give up without reloading the page.
      this.#running = true;
      this.#abort = (error) => settle(() => reject(error));

      this.#ensureWorker().then(
        (ready) => {
          // Stop or the timeout can land while the worker was starting.
          if (settled) return;
          worker = ready;
          worker.addEventListener("message", onMessage);
          worker.addEventListener("error", onError);
          // The limit starts when the cell does, not when the interpreter does:
          // loading the runtime is a fixed cost, not the cell's.
          timer =
            timeoutMs > 0
              ? setTimeout(() => {
                  // A hard timeout cannot ask the worker to stop politely, so it
                  // is terminated exactly like Stop (DESIGN.md section 12).
                  const abort = this.#abort;
                  this.#terminate();
                  abort?.(new RunCancelled("timeout", timeoutMs));
                }, timeoutMs)
              : undefined;
          worker.postMessage(request);
        },
        (error: unknown) => settle(() => reject(error)),
      );
    });
  }

  #ensureWorker(): Promise<Worker> {
    if (!this.#worker) {
      this.#worker = this.options.workerFactory?.() ?? defaultWorkerFactory();
    }
    if (!this.#ready) {
      const worker = this.#worker;
      this.#ready = new Promise<void>((resolve, reject) => {
        const requestId = nextRequestId();
        // A worker that never becomes ready must not wedge the page: drop it so
        // the next Run starts a fresh one instead of failing forever.
        const fail = (error: Error): void => {
          if (this.#worker === worker) {
            this.#worker = undefined;
            this.#ready = undefined;
          }
          reject(error);
        };
        const onMessage = (event: MessageEvent<RuntimeResponse>): void => {
          const message = event.data;
          if (message.requestId !== requestId) return;
          if (message.type === "error") {
            // The worker reports a failed start (missing or unloadable runtime)
            // as a message, not as an event. Without this the handshake would
            // never settle and the run would hang with no explanation.
            worker.removeEventListener("message", onMessage);
            worker.removeEventListener("error", onError);
            worker.terminate();
            fail(new Error(message.error.detail || message.error.message));
            return;
          }
          if (message.type !== "ready") return;
          worker.removeEventListener("message", onMessage);
          worker.removeEventListener("error", onError);
          if (message.protocolVersion !== RUNTIME_PROTOCOL_VERSION) {
            worker.terminate();
            fail(
              new Error(
                `runtime protocol ${message.protocolVersion} does not match this page's ${RUNTIME_PROTOCOL_VERSION}`,
              ),
            );
            return;
          }
          resolve();
        };
        const onError = (event: ErrorEvent): void => {
          worker.removeEventListener("message", onMessage);
          worker.removeEventListener("error", onError);
          fail(new Error(event.message || "the runtime worker failed to start"));
        };
        worker.addEventListener("message", onMessage);
        worker.addEventListener("error", onError);
        worker.postMessage({ type: "init", requestId } satisfies RuntimeRequest);
      });
    }
    return this.#ready.then(() => this.#worker!);
  }
}

let requestCounter = 0;

function nextRequestId(): string {
  requestCounter += 1;
  return `req-${requestCounter}`;
}

function defaultWorkerFactory(): Worker {
  return new Worker(new URL("../workers/pyodide.worker.ts", import.meta.url), {
    type: "module",
    name: "cs4ai-pyodide",
  });
}
