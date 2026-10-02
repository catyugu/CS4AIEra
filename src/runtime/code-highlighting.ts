/** One parser and token vocabulary for build-time code and the lazy editor. */
import { python } from "@codemirror/lang-python";
import { sql } from "@codemirror/lang-sql";
import { highlightTree, tags, tagHighlighter } from "@lezer/highlight";

export function codeLanguage(language: "python" | "sql") {
  return language === "sql" ? sql() : python();
}

export const codeHighlighter = tagHighlighter([
  { tag: tags.keyword, class: "code-keyword" },
  { tag: [tags.string, tags.special(tags.string)], class: "code-string" },
  { tag: [tags.number, tags.bool, tags.null], class: "code-literal" },
  { tag: tags.comment, class: "code-comment" },
  { tag: tags.definition(tags.variableName), class: "code-definition" },
  { tag: [tags.typeName, tags.className], class: "code-type" },
  { tag: tags.operator, class: "code-operator" },
]);

export interface CodeToken {
  text: string;
  classes?: string;
}

/** Return text, never HTML: Astro escapes the source when rendering spans. */
export function highlightCode(source: string, language: "python" | "sql"): CodeToken[] {
  const tokens: CodeToken[] = [];
  let cursor = 0;
  highlightTree(codeLanguage(language).language.parser.parse(source), codeHighlighter, (from, to, classes) => {
    if (from > cursor) tokens.push({ text: source.slice(cursor, from) });
    tokens.push({ text: source.slice(from, to), classes });
    cursor = to;
  });
  if (cursor < source.length) tokens.push({ text: source.slice(cursor) });
  return tokens;
}
