import { describe, expect, it } from "vitest";
import { highlightCode } from "../src/runtime/code-highlighting";

describe("code cell highlighting", () => {
  it.each([
    ["python", 'def example(x):\n\treturn "<script>&" + str(x + 1)\n# 注释\n'],
    ["sql", "SELECT name, NULL FROM items WHERE id >= 1; -- 注释\n"],
  ] as const)("preserves every character in %s and emits shared token classes", (language, source) => {
    const tokens = highlightCode(source, language);
    expect(tokens.map(token => token.text).join("")).toBe(source);
    expect(tokens.some(token => token.classes === "code-keyword")).toBe(true);
    expect(tokens.some(token => token.classes === "code-comment")).toBe(true);
    expect(tokens.some(token => token.classes === "code-literal")).toBe(true);
  });

  it.each(["", "\n\n", "  \t  "])("preserves blank source %j", source => {
    expect(highlightCode(source, "python").map(token => token.text).join("")).toBe(source);
  });
});
