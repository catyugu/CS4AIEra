/**
 * Code-cell UI: editor, Run/Stop/Reset, and typed output rendering.
 *
 * Loaded only by lesson pages that contain executable cells (DESIGN.md section
 * 19), and it creates the editor and the Pyodide runtime lazily so a reader who
 * never runs anything downloads neither.
 *
 * All output goes through DOM text nodes. Runtime output is untrusted, so it is
 * never parsed as HTML (DESIGN.md section 13).
 */

import { DEFAULT_CELL_TIMEOUT_MS, DEFAULT_MAX_RESULT_ROWS } from "../content-model/runtime-config";
import { LessonRuntime, RunCancelled, type CellRunResult } from "../runtime/client";
import type { RuntimeError, RuntimeValue, SqlCell } from "../runtime/protocol";

interface CellConfig {
  id: string;
  language: "python" | "sql";
  source: string;
  session?: string;
  fixture?: string;
  fixtureUrl?: string;
  timeoutMs?: number;
  packages?: string[];
  editable: boolean;
}

let runtime: LessonRuntime | undefined;

function getRuntime(): LessonRuntime {
  runtime ??= new LessonRuntime({ defaultTimeoutMs: DEFAULT_CELL_TIMEOUT_MS });
  return runtime;
}

/** Cells on this page, so Stop can tell the reader what it discarded. */
const cells = new Map<string, Cell>();

class Cell {
  readonly root: HTMLElement;
  readonly config: CellConfig;
  readonly #code: HTMLElement;
  readonly #output: HTMLElement;
  readonly #status: HTMLElement;
  readonly #runButton: HTMLButtonElement;
  readonly #stopButton: HTMLButtonElement;

  #editor?: EditorHandle;
  #modified = false;
  #running = false;

  constructor(root: HTMLElement) {
    this.root = root;
    this.config = readConfig(root);
    this.#code = must(root.querySelector("[data-cell-code]"));
    this.#output = must(root.querySelector("[data-cell-output]"));
    this.#status = must(root.querySelector("[data-cell-status]"));
    this.#runButton = must(root.querySelector('[data-action="run"]'));
    this.#stopButton = must(root.querySelector('[data-action="stop"]'));

    this.#runButton.addEventListener("click", () => void this.run());
    this.#stopButton.addEventListener("click", () => this.stop());
    root.querySelector('[data-action="reset-code"]')?.addEventListener("click", () => void this.resetCode());
    root.querySelector('[data-action="reset-state"]')?.addEventListener("click", () => void this.resetState());

    // Editing is created on demand: a reader who only reads pays nothing.
    this.#code.addEventListener("click", () => void this.#ensureEditor());
  }

  async run(): Promise<void> {
    if (this.#running) return;
    // Without an editor the "current content" is the author's source, so Run
    // does not need one: a reader who only runs never pays for the editor.
    const source = this.#editor?.getSource() ?? this.config.source;

    this.#running = true;
    this.#setBusy(true);
    this.#clearOutput();
    this.#setStatus("运行中…");

    const stream = document.createElement("pre");
    stream.className = "cell-stream";
    this.#output.append(stream);

    try {
      const result = await this.#execute(source, (text) => {
        stream.append(document.createTextNode(text));
      });
      this.#renderResult(result);
      this.#setStatus(result.error ? "出错" : `完成 · ${formatDuration(result.elapsedMs)}`, result.error ? "error" : "ok");
    } catch (error) {
      if (error instanceof RunCancelled) {
        this.#reportCancelled(error);
      } else {
        this.#setStatus("运行失败", "error");
        this.#appendError({ kind: "internal", message: (error as Error).message });
      }
    } finally {
      this.#running = false;
      this.#setBusy(false);
    }
  }

  stop(): void {
    if (!this.#running) return;
    getRuntime().stop();
  }

  /**
   * Say what ended the run, and what it cost.
   *
   * Terminating the worker discards every named session on the page, so the
   * reader is told rather than left to discover it in a later cell.
   */
  #reportCancelled(reason: RunCancelled): void {
    const head =
      reason.reason === "timeout"
        ? `已超时（上限 ${formatDuration(reason.timeoutMs ?? 0)}）`
        : "已停止";
    const discarded = [...cells.values()].some((cell) => cell.config.session !== undefined)
      ? "；运行时已重启，具名 session 的状态已丢弃"
      : "；运行时已重启";
    this.#setStatus(head + discarded, "stopped");
  }

  async resetCode(): Promise<void> {
    const editor = await this.#ensureEditor();
    editor?.setSource(this.config.source);
    this.#modified = false;
    this.#renderModified();
    this.#clearOutput();
    this.#setStatus("已恢复作者源码");
  }

  async resetState(): Promise<void> {
    if (this.config.session === undefined) return;
    this.#clearOutput();
    try {
      await getRuntime().resetSession(this.config.session);
      this.#setStatus(`session「${this.config.session}」已重建`);
    } catch (error) {
      this.#setStatus("重置失败", "error");
      this.#appendError({ kind: "internal", message: (error as Error).message });
    }
  }

  // -------------------------------------------------------------------------

  #execute(source: string, onChunk: (text: string) => void) {
    const options = { onChunk, timeoutMs: this.config.timeoutMs };
    if (this.config.language === "sql") {
      const fixtureUrl = this.#fixtureUrl();
      if (!fixtureUrl) throw new Error("SQL cell has no fixture");
      return getRuntime().runSql(
        {
          cellId: this.config.id,
          source,
          session: this.config.session,
          fixtureUrl,
          maxResultRows: DEFAULT_MAX_RESULT_ROWS,
        },
        options,
      );
    }
    return getRuntime().runPython(
      {
        cellId: this.config.id,
        source,
        session: this.config.session,
        packages: this.config.packages,
      },
      options,
    );
  }

  /**
   * The fixture this cell runs against.
   *
   * A cell that continues a session declares no fixture of its own, but still
   * needs one: after a Stop or a timeout the worker is gone and the connection
   * has to be rebuilt. The declaring cell is found on this page, which is the
   * scope sessions live in anyway.
   */
  #fixtureUrl(): string | undefined {
    if (this.config.fixtureUrl) return this.config.fixtureUrl;
    if (!this.config.session) return undefined;
    for (const cell of cells.values()) {
      if (cell.config.session === this.config.session && cell.config.fixtureUrl) {
        return cell.config.fixtureUrl;
      }
    }
    return undefined;
  }

  async #ensureEditor(): Promise<EditorHandle | undefined> {
    if (this.#editor) return this.#editor;
    this.#setStatus("正在加载编辑器…");
    const { createEditor } = await import("./editor");
    const handle = createEditor(this.#code, this.config.language, this.config.source, (modified) => {
      this.#modified = modified;
      this.#renderModified();
    });
    if (!this.config.editable) handle.setReadOnly(true);
    this.#editor = handle;
    this.root.classList.add("has-editor");
    this.#renderModified();
    this.#setStatus("");
    return handle;
  }

  #renderModified(): void {
    this.root.classList.toggle("is-modified", this.#modified);
    const badge = this.root.querySelector("[data-cell-modified]");
    if (badge) badge.textContent = this.#modified ? "已修改" : "";
  }

  #setBusy(busy: boolean): void {
    this.#runButton.disabled = busy;
    this.#stopButton.disabled = !busy;
    this.root.classList.toggle("is-running", busy);
  }

  #setStatus(text: string, kind: "ok" | "error" | "stopped" | "none" = "none"): void {
    this.#status.textContent = text;
    this.#status.dataset.kind = kind;
  }

  #clearOutput(): void {
    this.#output.replaceChildren();
  }

  #renderResult(result: CellRunResult): void {
    this.#clearOutput();
    if (result.stdout) this.#output.append(pre(result.stdout, "cell-stdout"));
    if (result.stderr) this.#output.append(pre(result.stderr, "cell-stderr"));
    for (const value of result.values) {
      const node = renderValue(value);
      if (node) this.#output.append(node);
    }
    if (result.truncated) {
      this.#output.append(note("输出已截断；完整输出超出上限。"));
    }
    if (result.error) this.#appendError(result.error);
  }

  #appendError(error: RuntimeError): void {
    const box = document.createElement("div");
    box.className = "cell-error";
    box.append(pre(error.detail || error.message, "cell-traceback"));
    this.#output.append(box);
  }
}

// ---------------------------------------------------------------------------
// Output rendering (DESIGN.md sections 9.4 and 10)
// ---------------------------------------------------------------------------

function renderValue(value: RuntimeValue): Node | undefined {
  switch (value.kind) {
    case "text":
      return pre(value.text, "cell-value");
    case "repr":
      return value.text === "None" ? undefined : pre(value.text, "cell-value");
    case "table":
      return renderTable(value.columns, value.rows, value.truncated);
    case "affected":
      return note(`${value.rows} 行受影响 · ${value.statement}`);
    case "none":
      return undefined;
  }
}

/**
 * NULL is marked in text, not only in colour, so the distinction survives a
 * screen reader and a monochrome display (DESIGN.md sections 9.4 and 20).
 */
function renderCell(cell: SqlCell): Node {
  switch (cell.kind) {
    case "null": {
      const span = document.createElement("span");
      span.className = "cell-null";
      span.textContent = "NULL";
      return span;
    }
    case "blob": {
      const span = document.createElement("span");
      span.className = "cell-blob";
      span.textContent = `<${cell.bytes} 字节>`;
      return span;
    }
    case "text": {
      const span = document.createElement("span");
      span.className = "cell-text";
      span.textContent = cell.value;
      return span;
    }
    default: {
      const span = document.createElement("span");
      span.className = "cell-number";
      span.textContent = String(cell.value);
      return span;
    }
  }
}

function renderTable(columns: string[], rows: SqlCell[][], truncated: boolean): Node {
  const figure = document.createElement("figure");
  figure.className = "cell-table";

  const table = document.createElement("table");
  const head = document.createElement("thead");
  const headRow = document.createElement("tr");
  for (const column of columns) {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = column;
    headRow.append(th);
  }
  head.append(headRow);
  table.append(head);

  const body = document.createElement("tbody");
  for (const row of rows) {
    const tr = document.createElement("tr");
    for (const cell of row) {
      const td = document.createElement("td");
      td.append(renderCell(cell));
      tr.append(td);
    }
    body.append(tr);
  }
  table.append(body);
  figure.append(table);

  if (rows.length === 0) figure.append(note("没有匹配的行。"));
  if (truncated) figure.append(note(`仅显示前 ${rows.length} 行。`));
  return figure;
}

function pre(text: string, className: string): HTMLPreElement {
  const element = document.createElement("pre");
  element.className = className;
  element.textContent = text;
  return element;
}

function note(text: string): HTMLParagraphElement {
  const element = document.createElement("p");
  element.className = "cell-note";
  element.textContent = text;
  return element;
}

function formatDuration(ms: number): string {
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`;
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

interface EditorHandle {
  getSource(): string;
  setSource(source: string): void;
  setReadOnly(readOnly: boolean): void;
}

function readConfig(root: HTMLElement): CellConfig {
  const language = root.dataset.language === "sql" ? "sql" : "python";
  return {
    id: root.dataset.cellId ?? "",
    language,
    source: root.dataset.source ?? "",
    session: root.dataset.session || undefined,
    fixture: root.dataset.fixture || undefined,
    fixtureUrl: root.dataset.fixtureUrl || undefined,
    timeoutMs: root.dataset.timeoutMs ? Number(root.dataset.timeoutMs) : undefined,
    packages: root.dataset.packages ? root.dataset.packages.split(",").filter(Boolean) : [],
    editable: root.dataset.editable !== "false",
  };
}

function must<T extends Element>(element: T | null): T {
  if (!element) throw new Error("code cell is missing part of its markup");
  return element;
}

for (const root of document.querySelectorAll<HTMLElement>("[data-codelab]")) {
  cells.set(root.dataset.cellId ?? "", new Cell(root));
}

export {};
