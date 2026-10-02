/**
 * Term popover placement (DESIGN.md section 14).
 *
 * CSS anchors the tip to the term and reveals it on hover or focus, so the
 * popover exists and is keyboard reachable without script. What CSS cannot
 * express is keeping an inline-anchored box inside the viewport: a term near
 * the right edge would push the page into horizontal scroll, and one near the
 * bottom would open below the fold. This measures the tip on the term the
 * reader is on and shifts it back by the overflow.
 *
 * Loaded only by pages that contain a term reference. Nothing here touches the
 * runtime or Pyodide.
 */

/** Gap kept between the tip and the viewport edge. */
const EDGE_GAP_PX = 8;

/** Vertical offset below the term; matches `top` in the stylesheet. */
const BELOW_TERM_GAP_PX = 8;

function place(ref: HTMLElement): void {
  const tip = ref.querySelector<HTMLElement>(".term-tip");
  if (!tip) return;

  // Measure from the stylesheet's own position, so a repeat visit starts clean.
  tip.style.left = "0px";
  tip.style.top = "";
  const tipBox = tip.getBoundingClientRect();
  // Zero width means the tip is still hidden: focus arrived without :focus-visible.
  if (tipBox.width === 0) return;

  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = document.documentElement.clientHeight;

  const overflowRight = tipBox.right - (viewportWidth - EDGE_GAP_PX);
  if (overflowRight > 0) tip.style.left = `${-overflowRight}px`;

  // No room below the term: open the tip above it instead.
  const overflowBottom = tipBox.bottom - (viewportHeight - EDGE_GAP_PX);
  if (overflowBottom > 0) tip.style.top = `${-(tipBox.height + BELOW_TERM_GAP_PX)}px`;
}

function onEnter(event: Event): void {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const ref = target.closest<HTMLElement>(".term-ref");
  // The tip is inside the reference, so moving onto the tip would re-measure it.
  if (!ref || target.closest(".term-tip")) return;
  place(ref);
}

document.addEventListener("pointerover", onEnter);
document.addEventListener("focusin", onEnter);

export {};
