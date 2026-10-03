/**
 * In-page contents marker (doc/DESIGN.md, 术语、导航与搜索).
 *
 * The list itself is static and complete without script: every heading in the
 * lesson links to its own anchor. What script adds is which of those sections
 * the reader is in, so a long lesson can be read from the margin.
 *
 * Loaded only by pages that have an in-page contents list, and it owns no state
 * beyond the current entry. Reading scroll position costs one pass over the
 * headings on a frame, which is why this is a scroll listener and not an
 * IntersectionObserver: the section being read is "the last heading that has
 * gone past", a question about order that a single ordered pass answers
 * exactly, at any scroll speed and in both directions.
 */

/** How far down the viewport a heading counts as passed, in percent. */
const BAND_PERCENT = 20;

/**
 * The fragment a link points at, decoded.
 *
 * The `href` carries the anchor percent-encoded while the emitted `id` is the
 * heading text as it stands, so the two only match after decoding.
 */
function targetId(link: HTMLAnchorElement): string {
  const raw = link.hash.slice(1);
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

const links = [...document.querySelectorAll<HTMLAnchorElement>("[data-toc] a[href^='#']")];

/** Headings to watch, in document order, deduplicated across both lists. */
const headings: HTMLElement[] = [];
for (const link of links) {
  const heading = document.getElementById(targetId(link));
  if (heading && !headings.includes(heading)) headings.push(heading);
}

if (headings.length > 0) {
  let current: string | undefined;

  const mark = (id: string | undefined): void => {
    if (id === current) return;
    current = id;
    for (const link of links) {
      // `location` is the value for a position inside the document.
      if (targetId(link) === id) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
  };

  const update = (): void => {
    const band = (window.innerHeight * BAND_PERCENT) / 100;
    let active: string | undefined;
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top > band) break;
      active = heading.id;
    }
    // Nothing marked while the reader is still in the introduction: the first
    // heading has not been reached, so no section is being read yet.
    mark(active);
  };

  let scheduled = false;
  const schedule = (): void => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      update();
    });
  };

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  update();
}

export {};
