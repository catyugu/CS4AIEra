/**
 * CodeMirror editor for a code cell.
 *
 * Deliberately built from individual extensions rather than `basicSetup`: the
 * reader's source must not be altered by the tooling, so there is no
 * auto-closing of brackets and no completion that could rewrite a lesson's
 * example (DESIGN.md section 3).
 */

import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { python } from "@codemirror/lang-python";
import { sql } from "@codemirror/lang-sql";
import { bracketMatching, indentOnInput, syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
import { Compartment, EditorState, type Extension } from "@codemirror/state";
import { EditorView, drawSelection, highlightActiveLine, keymap, lineNumbers } from "@codemirror/view";

export interface EditorHandle {
  getSource(): string;
  setSource(source: string): void;
  setReadOnly(readOnly: boolean): void;
}

export function createEditor(
  host: HTMLElement,
  language: "python" | "sql",
  source: string,
  onModify: (modified: boolean) => void,
): EditorHandle {
  const original = source;
  const readOnly = new Compartment();
  const view = new EditorView({
    parent: host,
    state: EditorState.create({
      doc: source,
      extensions: [
        ...extensions(language, (doc) => onModify(doc !== original)),
        readOnly.of(EditorState.readOnly.of(false)),
      ],
    }),
  });
  // The static fallback is a plain <pre>; swap it out now that the editor owns
  // the area, so the source is never on screen twice.
  host.replaceChildren(view.dom);

  return {
    getSource: () => view.state.doc.toString(),
    setSource: (next: string) => {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: next } });
      onModify(next !== original);
    },
    setReadOnly: (isReadOnly: boolean) => {
      view.dispatch({ effects: readOnly.reconfigure(EditorState.readOnly.of(isReadOnly)) });
    },
  };
}

function extensions(language: "python" | "sql", onDocChange: (doc: string) => void): Extension[] {
  return [
    lineNumbers(),
    history(),
    drawSelection(),
    indentOnInput(),
    bracketMatching(),
    highlightActiveLine(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
    language === "sql" ? sql() : python(),
    EditorView.lineWrapping,
    EditorView.updateListener.of((update) => {
      if (update.docChanged) onDocChange(update.state.doc.toString());
    }),
  ];
}
