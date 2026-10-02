import { encode } from "gpt-tokenizer/encoding/o200k_base";

/**
 * Token count of a lesson body.
 *
 * The number tells a reader how much of a model's context the article occupies,
 * so it comes from a real BPE vocabulary rather than a character estimate: the
 * corpus is largely Chinese, where a `characters / 4` rule is wrong by an order
 * of magnitude. `o200k_base` is the vocabulary of the current GPT-4o/5 and
 * o-series families, the ranks ship inside the package, and encoding is
 * deterministic, so the build stays offline and reproducible.
 */

export function countTokens(text: string): number {
  return encode(text).length;
}
