/**
 * Browser runtime protocol (doc/DESIGN.md, 浏览器执行模型).
 *
 * The UI thread and the worker exchange only these messages. There is no
 * untyped object passing: every field below is either consumed by the worker or
 * rendered, so a change here is a change to a documented contract.
 *
 * One request produces one `ready`/`done` pair at most, zero or more streamed
 * `stdout`/`stderr` chunks, zero or more `result` messages (a SQL cell can
 * contain several statements), and at most one `error`.
 */

/** Bumped when a message shape changes; the client refuses a mismatched worker. */
export const RUNTIME_PROTOCOL_VERSION = 1;

export interface RunPythonRequest {
  type: "run-python";
  requestId: string;
  cellId: string;
  source: string;
  /** Absent means the cell runs against a fresh namespace. */
  session?: string;
  packages: string[];
}

export interface RunSqlRequest {
  type: "run-sql";
  requestId: string;
  cellId: string;
  source: string;
  session?: string;
  /** URL of the fixture to replay into a fresh connection. */
  fixtureUrl: string;
  maxResultRows: number;
}

export interface InitRequest {
  type: "init";
  requestId: string;
}

export interface ResetSessionRequest {
  type: "reset-session";
  requestId: string;
  session: string;
}

export type RuntimeRequest = InitRequest | RunPythonRequest | RunSqlRequest | ResetSessionRequest;

/** A single SQL result cell, tagged so the UI can tell NULL from "NULL". */
export type SqlCell =
  | { kind: "null" }
  | { kind: "integer"; value: number }
  | { kind: "real"; value: number }
  | { kind: "text"; value: string }
  | { kind: "blob"; bytes: number };

/**
 * A typed runtime value (doc/DESIGN.md, 浏览器执行模型). Never HTML: the UI decides how
 * to render, and text is inserted as text.
 *
 * `image` is not part of the baseline yet; the worker does not emit it.
 */
export type RuntimeValue =
  | { kind: "text"; text: string }
  | {
      kind: "table";
      columns: string[];
      rows: SqlCell[][];
      truncated: boolean;
    }
  | { kind: "affected"; rows: number; statement: string }
  | { kind: "none" };

export interface RuntimeError {
  kind: "syntax" | "runtime" | "unavailable" | "internal";
  /** One-line summary, safe to render as text. */
  message: string;
  /** Traceback or statement context, when there is any. */
  detail?: string;
}

export type RuntimeResponse =
  | { type: "ready"; requestId: string; protocolVersion: number; pyodideVersion: string }
  | { type: "stdout"; requestId: string; chunk: string; truncated?: boolean }
  | { type: "stderr"; requestId: string; chunk: string; truncated?: boolean }
  | { type: "result"; requestId: string; value: RuntimeValue }
  | { type: "error"; requestId: string; error: RuntimeError }
  | { type: "done"; requestId: string; elapsedMs: number };
