/**
 * CodeMirror editor for a code cell.
 *
 * Deliberately built from individual extensions rather than `basicSetup`: the
 * reader's source must not be altered by the tooling, so there is no
 * auto-closing of brackets and no completion that could rewrite a lesson's
 * example (DESIGN.md section 3).
 */

import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { bracketMatching, indentOnInput, syntaxHighlighting } from "@codemirror/language";
import { Compartment, EditorState, type Extension } from "@codemirror/state";
import { EditorView, drawSelection, keymap } from "@codemirror/view";
import { codeHighlighter, codeLanguage } from "./code-highlighting";

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
    history(),
    drawSelection(),
    indentOnInput(),
    bracketMatching(),
    syntaxHighlighting(codeHighlighter),
    keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
    codeLanguage(language),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) onDocChange(update.state.doc.toString());
    }),
  ];
}
