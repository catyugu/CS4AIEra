# AGENTS.md

## Project mission

This repository implements a content-first, self-hostable introductory Web course for non-specialist self-learners studying computer science in the AI era. It assumes no prior programming or CS knowledge; explanations build the models readers need to judge software designs and AI-assisted changes.

The product is **not an LMS**. There are no accounts, progress records, grades, cohorts, instructor dashboards, or server-side code execution.

## Non-negotiable constraints

1. Content is the primary product. Application code exists to present, navigate, validate, search, and execute content examples.
2. The site must remain deployable as static assets behind an ordinary Web server/CDN. Do not introduce a mandatory application backend without an explicit architecture decision.
3. User-authored or user-modified lesson code must never execute on our server.
4. Python and SQL execution runs in the browser in a Web Worker using a pinned, self-hosted Pyodide distribution.
5. Executable examples must be resettable, and a runaway program must be stoppable. Do not rely on cross-origin isolation being available.
6. Course structure is a version-controlled tree. Stable content IDs must not depend on file paths.
7. Definitions and glossary references are explicit authoring constructs. Do not auto-link terms by naive string matching.
8. No feature may require login, cloud state, analytics, telemetry, or third-party network access to function.
9. Prefer primary specifications, standards, language documentation, and reproducible demonstrations over folklore.
10. A code block is executable only when explicitly marked. Executable examples are deterministic unless nondeterminism is itself the topic.

## Document ownership

One normative fact has exactly one home. Link to it instead of restating it.

| Question | Home |
| --- | --- |
| What is invariant about this repository, and how is a change verified? | this file |
| How are the product and its runtime built, and why? | `doc/DESIGN.md` |
| How is a lesson written? | `doc/CONTENT_GUIDE.md` |
| What is taught, in what order, and why? | `doc/CURRICULUM.md` |
| Which lessons exist, in what order, and what is published? | `_section.yaml` and lesson frontmatter |
| What metadata, cell options and references are legal? | `src/content-model/schema.ts`, the markdown pipeline, the content validator |
| What changed, and when? | Git history |

Documents hold decisions and intent; code, schema, frontmatter and tests hold the precise current facts; Git holds history. Adding a lesson, moving or splitting a section, changing a cell option or advancing publication state must not require editing any of these documents. Where a document and the repository disagree about a current fact, the repository is right and the document is a defect — with one exception: `doc/CURRICULUM.md` states design intent and may describe a module's direction before its lessons reach that shape.

Baseline technology choices are in `doc/DESIGN.md` (技术基线). Do not replace them merely because another library is fashionable; a replacement must reduce complexity or satisfy a concrete unmet requirement.

## Engineering rules

- Type public interfaces and worker messages explicitly.
- Prefer small modules with explicit data flow over global stores.
- Keep build-time content validation strict; fail the build on broken IDs, references, duplicate slugs, or invalid fixtures.
- Preserve accessible keyboard operation for navigation, glossary popovers, editors, Run/Stop/Reset controls, and output.
- Do not add client state persistence unless the requirement explicitly needs it.
- Keep URLs human-readable and stable, and keep generated files out of hand-edited source locations.

## Change discipline

- A change to the architecture — the content model, the browser execution model, routing or the term system's semantics — updates `doc/DESIGN.md`. Implementing an existing design decision does not. A new authoring convention updates `doc/CONTENT_GUIDE.md`. A change to what is taught, or to a module's boundaries, updates `doc/CURRICULUM.md`. Reference another document by name, never by section number.
- Never silently migrate content semantics. Provide a migration script when a schema change touches more than a few files.
- Never restate a current fact in a document. An ID, an order, a status, a field list or a message shape has one home, and it is the file or the code that the build already reads.

## Verification

Run both commands before reporting a change as done:

```text
npm run check    content validation, type check, unit tests
npm run build    static build
```

A change is done only when:

1. it preserves the static, no-account, no-server-execution architecture;
2. keyboard and narrow-screen behavior are acceptable;
3. affected cells can Run, Stop and Reset correctly in a browser;
4. browser and worker consoles are clean in normal use;
5. no document was edited merely to mirror a change in content, metadata or code (see Document ownership).
