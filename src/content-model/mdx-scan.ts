import type {
  ContentReference,
  ExecutableCell,
  Heading,
  OutputMode,
  ReferenceKind,
  StaticCodeBlock,
} from "./types";

/**
 * A deliberately small text scan over lesson source.
 *
 * This is not an MDX parser. It extracts exactly the authoring constructs the
 * build must validate: fenced code blocks, headings, and the explicit reference
 * components. Fenced regions are removed before any prose is scanned, so code
 * that happens to contain `<Term ...>` is never mistaken for a reference.
 *
 * Known limitation: a fenced block nested inside another block construct is
 * treated as ordinary prose by CommonMark, but this scanner tracks fences
 * line-wise. Lessons are written in flat Markdown, and content validation is
 * the guard rail that keeps it that way.
 */

export interface MdxScan {
  fences: ScannedFence[];
  headings: Heading[];
  references: ContentReference[];
}

export interface ScannedFence {
  language: string;
  meta: string;
  source: string;
  /** 1-based line number of the opening fence. */
  line: number;
}

const FENCE_OPEN = /^(\s*)(`{3,}|~{3,})\s*([^\s`]*)\s*(.*)$/;
const ATX_HEADING = /^(#{1,6})\s+(.*?)\s*#*\s*$/;
const INLINE_CODE = /`[^`]*`/g;
const JSX_TAG = /<(Term|CrossRef|LabRef|Figure)\b([^>]*?)\/?>/g;
const JSX_ATTR = /([A-Za-z_][\w-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

const REFERENCE_KINDS: Record<string, ReferenceKind> = {
  Term: "term",
  CrossRef: "crossref",
  LabRef: "labref",
  Figure: "figure",
};

export function scanMdx(text: string): MdxScan {
  const lines = text.split(/\r?\n/);
  const fences: ScannedFence[] = [];
  const headings: Heading[] = [];
  const references: ContentReference[] = [];

  let index = 0;
  while (index < lines.length) {
    const line = lines[index]!;
    const open = FENCE_OPEN.exec(line);
    if (open) {
      const marker = open[2]!;
      const language = open[3] ?? "";
      const meta = (open[4] ?? "").trim();
      const startLine = index + 1;
      const body: string[] = [];
      let cursor = index + 1;
      let closed = false;
      while (cursor < lines.length) {
        const candidate = lines[cursor]!;
        const close = FENCE_CLOSE(candidate, marker);
        if (close) {
          closed = true;
          break;
        }
        body.push(candidate);
        cursor += 1;
      }
      if (!closed) {
        // Unterminated fence: report it as a fence running to end of file so the
        // author sees the cell rather than silently losing it.
        body.push(...lines.slice(cursor));
        cursor = lines.length;
      }
      fences.push({ language, meta, source: body.join("\n"), line: startLine });
      index = cursor + 1;
      continue;
    }

    const heading = ATX_HEADING.exec(line);
    if (heading) {
      const headingText = stripInlineMarkup(heading[2]!);
      headings.push({
        level: heading[1]!.length,
        text: headingText,
        anchor: slugifyHeading(headingText),
        line: index + 1,
      });
    }

    const prose = line.replace(INLINE_CODE, "");
    for (const match of prose.matchAll(JSX_TAG)) {
      const kind = REFERENCE_KINDS[match[1]!]!;
      const attrs = parseAttributes(match[2] ?? "");
      const target = kind === "figure" ? attrs.src : attrs.id;
      if (target === undefined) {
        // A reference with no target cannot be resolved; record it so the
        // validator can report it with a line number.
        references.push({ kind, target: "", line: index + 1 });
        continue;
      }
      references.push({ kind, target, line: index + 1 });
    }

    index += 1;
  }

  return { fences, headings, references };
}

function FENCE_CLOSE(line: string, marker: string): boolean {
  const char = marker[0]!;
  const trimmed = line.trim();
  if (trimmed.length < marker.length) return false;
  for (const c of trimmed) {
    if (c !== char) return false;
  }
  return true;
}

function parseAttributes(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const match of raw.matchAll(JSX_ATTR)) {
    attrs[match[1]!] = match[2] ?? match[3] ?? "";
  }
  return attrs;
}

function stripInlineMarkup(text: string): string {
  return text
    // Keep inline code content: the renderer puts it in the heading text, so the
    // anchor is computed from it too. Deleting it here would make the validator
    // and the rendered page disagree about what the heading says.
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_~]/g, "")
    .trim();
}

/** Anchor slug matching the heading ids the site generates. */
export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
}

// ---------------------------------------------------------------------------
// Executable cell metadata
// ---------------------------------------------------------------------------

export interface CellMeta {
  run: boolean;
  id?: string;
  session?: string;
  timeoutMs?: number;
  packages: string[];
  fixture?: string;
  editable?: boolean;
  outputMode?: OutputMode;
  expected?: string;
}

export interface CellMetaParse {
  meta: CellMeta;
  problems: string[];
}

/**
 * Parse a fence info string such as:
 *
 *   python run id="py.names.rebinding" session="iterator-demo" timeout=2000
 *
 * Problems are returned rather than thrown so every malformed cell in a lesson
 * is reported in one build, not one per fix-and-rerun cycle.
 */
export function parseCellMeta(meta: string): CellMetaParse {
  const problems: string[] = [];
  const tokens = tokenizeMeta(meta);
  const result: CellMeta = { run: false, packages: [] };
  const known = new Set([
    "run",
    "id",
    "session",
    "timeout",
    "packages",
    "fixture",
    "editable",
    "output",
    "expect",
  ]);

  for (const token of tokens) {
    if (token.key === "run") {
      if (token.value !== undefined) problems.push(`'run' takes no value`);
      result.run = true;
      continue;
    }
    if (!known.has(token.key)) {
      problems.push(`unknown cell option '${token.key}'`);
      continue;
    }
    const value = token.value ?? "";
    switch (token.key) {
      case "id":
        result.id = value;
        break;
      case "session":
        if (value === "isolated") problems.push(`session="isolated" is the default; omit it`);
        else result.session = value;
        break;
      case "timeout": {
        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed <= 0) {
          problems.push(`timeout must be a positive integer number of milliseconds`);
        } else {
          result.timeoutMs = parsed;
        }
        break;
      }
      case "packages":
        result.packages = value
          .split(",")
          .map((name) => name.trim())
          .filter((name) => name.length > 0);
        break;
      case "fixture":
        result.fixture = value;
        break;
      case "editable":
        if (value === "true") result.editable = true;
        else if (value === "false") result.editable = false;
        else problems.push(`editable must be true or false`);
        break;
      case "output":
        if (value === "auto" || value === "text" || value === "table") result.outputMode = value;
        else problems.push(`output must be auto, text or table`);
        break;
      case "expect":
        result.expected = value;
        break;
    }
  }

  return { meta: result, problems };
}

interface MetaToken {
  key: string;
  value?: string;
}

function tokenizeMeta(meta: string): MetaToken[] {
  const tokens: MetaToken[] = [];
  let index = 0;
  while (index < meta.length) {
    while (index < meta.length && /\s/.test(meta[index]!)) index += 1;
    if (index >= meta.length) break;
    let key = "";
    while (index < meta.length && /[A-Za-z0-9_-]/.test(meta[index]!)) {
      key += meta[index];
      index += 1;
    }
    if (key.length === 0) {
      // Skip an unexpected character so the scan terminates and the author gets
      // a cell-level problem instead of a hang.
      index += 1;
      continue;
    }
    let value: string | undefined;
    const equalsIndex = meta.indexOf("=", index);
    if (equalsIndex !== -1 && /^\s*=/.test(meta.slice(index, equalsIndex + 1))) {
      index = equalsIndex + 1;
      while (index < meta.length && /\s/.test(meta[index]!)) index += 1;
      const quote = meta[index];
      if (quote === '"' || quote === "'") {
        index += 1;
        let collected = "";
        while (index < meta.length && meta[index] !== quote) {
          collected += meta[index];
          index += 1;
        }
        if (index < meta.length) index += 1;
        value = collected;
      } else {
        let collected = "";
        while (index < meta.length && !/\s/.test(meta[index]!)) {
          collected += meta[index];
          index += 1;
        }
        value = collected;
      }
    }
    tokens.push(value === undefined ? { key } : { key, value });
  }
  return tokens;
}

/** True when a fence's info string marks it executable. */
export function isExecutableFence(meta: string): boolean {
  return tokenizeMeta(meta).some((token) => token.key === "run");
}

export function toStaticBlock(fence: ScannedFence): StaticCodeBlock {
  return { language: fence.language, source: fence.source, line: fence.line };
}

/** Build a cell descriptor; callers have already validated meta problems. */
export function toExecutableCell(
  fence: ScannedFence,
  meta: CellMeta,
  language: ExecutableCell["language"],
): ExecutableCell {
  return {
    id: meta.id ?? "",
    language,
    source: fence.source,
    line: fence.line,
    session: meta.session,
    timeoutMs: meta.timeoutMs,
    packages: meta.packages,
    fixture: meta.fixture,
    editable: meta.editable ?? true,
    outputMode: meta.outputMode ?? "auto",
    expectedOutput: meta.expected,
  };
}
