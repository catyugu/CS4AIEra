import { describe, expect, it, vi } from "vitest";

import { LessonRuntime, RunCancelled } from "../src/runtime/client";
import { RUNTIME_PROTOCOL_VERSION, type RuntimeRequest, type RuntimeResponse } from "../src/runtime/protocol";

/**
 * A stand-in for the Pyodide worker.
 *
 * What the client owes its callers is a lifecycle, not an interpreter: runs are
 * serialized, a torn-down worker is never reused, and the reason a run ended
 * reaches the caller intact. Those are the parts a browser test cannot pin down
 * deterministically, and the parts that broke while this was being built.
 */
class FakeWorker {
  readonly posted: RuntimeRequest[] = [];
  terminated = false;
  /** Answers a request. An array sends several messages; nothing means silence. */
  respond: ((request: RuntimeRequest) => RuntimeResponse | RuntimeResponse[] | undefined) | undefined;

  readonly #listeners = new Set<(event: MessageEvent<RuntimeResponse>) => void>();
  readonly #errorListeners = new Set<(event: ErrorEvent) => void>();

  addEventListener(type: string, listener: unknown): void {
    if (type === "message") this.#listeners.add(listener as (event: MessageEvent<RuntimeResponse>) => void);
    if (type === "error") this.#errorListeners.add(listener as (event: ErrorEvent) => void);
  }

  removeEventListener(type: string, listener: unknown): void {
    if (type === "message") this.#listeners.delete(listener as (event: MessageEvent<RuntimeResponse>) => void);
    if (type === "error") this.#errorListeners.delete(listener as (event: ErrorEvent) => void);
  }

  postMessage(request: RuntimeRequest): void {
    this.posted.push(request);
    const response = this.respond?.(request);
    if (response === undefined) return;
    // Deliver asynchronously, the way a real worker does.
    for (const message of Array.isArray(response) ? response : [response]) {
      setTimeout(() => this.emit(message), 0);
    }
  }

  emit(message: RuntimeResponse): void {
    for (const listener of this.#listeners) listener({ data: message } as MessageEvent<RuntimeResponse>);
  }

  fail(message: string): void {
    for (const listener of this.#errorListeners) listener({ message } as ErrorEvent);
  }

  terminate(): void {
    this.terminated = true;
    this.#listeners.clear();
    this.#errorListeners.clear();
  }

  asWorker(): Worker {
    return this as unknown as Worker;
  }
}

function ready(request: RuntimeRequest, protocolVersion = RUNTIME_PROTOCOL_VERSION): RuntimeResponse {
  return { type: "ready", requestId: request.requestId, protocolVersion, pyodideVersion: "0.0.0-test" };
}

function done(request: RuntimeRequest, elapsedMs: number): RuntimeResponse {
  return { type: "done", requestId: request.requestId, elapsedMs };
}

/** A worker that completes every run. */
function workingWorker(elapsedMs = 5): FakeWorker {
  const worker = new FakeWorker();
  worker.respond = (request) =>
    request.type === "init" ? ready(request) : request.type === "run-python" ? done(request, elapsedMs) : undefined;
  return worker;
}

function runtimeOver(factory: () => Worker, defaultTimeoutMs = 1000): LessonRuntime {
  return new LessonRuntime({ defaultTimeoutMs, workerFactory: factory });
}

describe("LessonRuntime worker lifecycle", () => {
  it("starts no worker until the first run", async () => {
    const factory = vi.fn(() => workingWorker().asWorker());
    const runtime = runtimeOver(factory);
    expect(factory).not.toHaveBeenCalled();
    await runtime.runPython({ cellId: "c", source: "1" });
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("handshakes once and reuses the worker for later runs", async () => {
    const worker = workingWorker();
    const runtime = runtimeOver(() => worker.asWorker());
    await runtime.runPython({ cellId: "a", source: "1" });
    await runtime.runPython({ cellId: "b", source: "2" });
    expect(worker.posted.filter((request) => request.type === "init")).toHaveLength(1);
    expect(worker.posted.filter((request) => request.type === "run-python")).toHaveLength(2);
  });

  it("refuses a worker speaking a different protocol version", async () => {
    const worker = new FakeWorker();
    worker.respond = (request) => ready(request, RUNTIME_PROTOCOL_VERSION + 1);
    const runtime = runtimeOver(() => worker.asWorker());
    await expect(runtime.runPython({ cellId: "a", source: "1" })).rejects.toThrow(/protocol/);
    expect(worker.terminated).toBe(true);
  });

  it("lets a later run retry after the worker failed to start", async () => {
    const workers: FakeWorker[] = [];
    const runtime = runtimeOver(() => {
      const index = workers.length;
      const worker = new FakeWorker();
      // The first worker never becomes ready; every later one does.
      worker.respond = (request) => {
        if (request.type === "init") return index === 0 ? undefined : ready(request);
        return request.type === "run-python" ? done(request, 1) : undefined;
      };
      workers.push(worker);
      return worker.asWorker();
    });
    const run = runtime.runPython({ cellId: "a", source: "1" });
    await vi.waitFor(() => expect(workers).toHaveLength(1));
    workers[0]!.fail("boom");
    await expect(run).rejects.toThrow(/boom/);
    await expect(runtime.runPython({ cellId: "b", source: "1" })).resolves.toMatchObject({ elapsedMs: 1 });
    expect(workers).toHaveLength(2);
  });

  it("serializes runs instead of interleaving them", async () => {
    const order: string[] = [];
    const worker = new FakeWorker();
    worker.respond = (request) => {
      if (request.type === "init") return ready(request);
      if (request.type === "run-python") {
        order.push(`start:${request.cellId}`);
        return done(request, 1);
      }
      return undefined;
    };
    const runtime = runtimeOver(() => worker.asWorker(), 5000);
    await Promise.all([
      runtime.runPython({ cellId: "first", source: "1" }).then(() => order.push("end:first")),
      runtime.runPython({ cellId: "second", source: "2" }).then(() => order.push("end:second")),
    ]);
    expect(order).toEqual(["start:first", "end:first", "start:second", "end:second"]);
  });

  it("keeps the queue alive after a cell raised", async () => {
    const worker = new FakeWorker();
    worker.respond = (request) => {
      if (request.type === "init") return ready(request);
      if (request.type === "run-python") {
        return request.source === "raise"
          ? [
              {
                type: "error",
                requestId: request.requestId,
                error: { kind: "runtime", message: "ZeroDivisionError" },
              },
              done(request, 1),
            ]
          : done(request, 2);
      }
      return undefined;
    };
    const runtime = runtimeOver(() => worker.asWorker());

    const failed = await runtime.runPython({ cellId: "a", source: "raise" });
    expect(failed.error?.message).toBe("ZeroDivisionError");
    await expect(runtime.runPython({ cellId: "b", source: "1" })).resolves.toMatchObject({ elapsedMs: 2 });
  });

  it("reports Stop as a stop and recreates the worker for the next run", async () => {
    let finishRuns = false;
    const workers: FakeWorker[] = [];
    const runtime = runtimeOver(() => {
      const worker = new FakeWorker();
      worker.respond = (request) => {
        if (request.type === "init") return ready(request);
        // A worker that never answers run-python leaves the run in flight.
        return request.type === "run-python" && finishRuns ? done(request, 2) : undefined;
      };
      workers.push(worker);
      return worker.asWorker();
    }, 60_000);

    const run = runtime.runPython({ cellId: "a", source: "while True: pass" });
    await vi.waitFor(() => expect(runtime.isRunning).toBe(true));
    runtime.stop();

    const error = await run.catch((thrown: unknown) => thrown);
    expect(error).toBeInstanceOf(RunCancelled);
    expect((error as RunCancelled).reason).toBe("stopped");
    expect(workers[0]!.terminated).toBe(true);
    expect(runtime.isRunning).toBe(false);

    finishRuns = true;
    await expect(runtime.runPython({ cellId: "b", source: "1" })).resolves.toMatchObject({ elapsedMs: 2 });
    expect(workers).toHaveLength(2);
  });

  it("reports a timeout as a timeout, not as a stop", async () => {
    const workers: FakeWorker[] = [];
    const runtime = runtimeOver(() => {
      const worker = new FakeWorker();
      worker.respond = (request) => (request.type === "init" ? ready(request) : undefined);
      workers.push(worker);
      return worker.asWorker();
    }, 60_000);

    const error = await runtime
      .runPython({ cellId: "a", source: "while True: pass" }, { timeoutMs: 20 })
      .catch((thrown: unknown) => thrown);
    expect(error).toBeInstanceOf(RunCancelled);
    expect((error as RunCancelled).reason).toBe("timeout");
    expect((error as RunCancelled).timeoutMs).toBe(20);
    expect(workers[0]!.terminated).toBe(true);
  });

  it("streams chunks as they arrive and keeps stdout and stderr apart", async () => {
    const worker = new FakeWorker();
    worker.respond = (request) => {
      if (request.type === "init") return ready(request);
      if (request.type === "run-python") {
        return [
          { type: "stdout", requestId: request.requestId, chunk: "a\n" },
          { type: "stderr", requestId: request.requestId, chunk: "warn\n" },
          { type: "stdout", requestId: request.requestId, chunk: "b\n" },
          { type: "result", requestId: request.requestId, value: { kind: "text", text: "42" } },
          done(request, 3),
        ];
      }
      return undefined;
    };
    const runtime = runtimeOver(() => worker.asWorker());

    const streamed: string[] = [];
    const result = await runtime.runPython(
      { cellId: "a", source: "1" },
      { onChunk: (stream, chunk) => streamed.push(`${stream}:${chunk.trim()}`) },
    );

    expect(streamed).toEqual(["stdout:a", "stderr:warn", "stdout:b"]);
    expect(result.stdout).toBe("a\nb\n");
    expect(result.stderr).toBe("warn\n");
    expect(result.values).toEqual([{ kind: "text", text: "42" }]);
    expect(result.elapsedMs).toBe(3);
  });

  it("fails the run when the interpreter reports it could not start", async () => {
    const worker = new FakeWorker();
    // A worker that cannot load its runtime answers `init` with an error message
    // rather than an error event, so the handshake has to read both.
    worker.respond = (request) => ({
      type: "error",
      requestId: request.requestId,
      error: { kind: "internal", message: "Failed to fetch pyodide.asm.wasm" },
    });
    const runtime = runtimeOver(() => worker.asWorker());
    await expect(runtime.runPython({ cellId: "a", source: "1" })).rejects.toThrow(/pyodide\.asm\.wasm/);
    expect(worker.terminated).toBe(true);
  });

  it("lets Stop end a run that is still loading the interpreter", async () => {
    const workers: FakeWorker[] = [];
    const runtime = runtimeOver(() => {
      // A worker that accepts `init` but never answers it: the run is stuck in
      // the handshake, which is exactly the slow-load case.
      const worker = new FakeWorker();
      workers.push(worker);
      return worker.asWorker();
    }, 60_000);

    const run = runtime.runPython({ cellId: "a", source: "1" });
    // Cancellable immediately, without waiting for the interpreter.
    await vi.waitFor(() => expect(runtime.isRunning).toBe(true));
    runtime.stop();

    const error = await run.catch((thrown: unknown) => thrown);
    expect(error).toBeInstanceOf(RunCancelled);
    expect((error as RunCancelled).reason).toBe("stopped");
    expect(workers[0]!.terminated).toBe(true);
  });

  it("ignores messages addressed to another request", async () => {
    const worker = new FakeWorker();
    worker.respond = (request) =>
      request.type === "init"
        ? ready(request)
        : [
            { type: "stdout", requestId: "req-does-not-exist", chunk: "stray\n" },
            done(request, 4),
          ];
    const runtime = runtimeOver(() => worker.asWorker());
    const result = await runtime.runPython({ cellId: "a", source: "1" });
    expect(result.stdout).toBe("");
    expect(result.elapsedMs).toBe(4);
  });
});
