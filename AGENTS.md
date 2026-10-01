# AGENTS.md

## Project mission

This repository implements a content-first, self-hostable Web course for professional self-learners studying computer science in the AI era.

The product is **not an LMS**. There are no accounts, progress records, grades, cohorts, instructor dashboards, or server-side code execution.

## Non-negotiable constraints

1. Content is the primary product. Application code exists to present, navigate, validate, search, and execute content examples.
2. The site must remain deployable as static assets behind an ordinary Web server/CDN. Do not introduce a mandatory application backend without an explicit architecture decision.
3. User-authored or user-modified lesson code must never execute on our server.
4. Python and SQL execution runs in the browser in a Web Worker using a pinned, self-hosted Pyodide distribution.
5. SQL execution uses SQLite inside Pyodide for the baseline implementation. Authors may provide `seed.sql` and/or a prebuilt `.sqlite3` fixture.
6. Executable examples must have a Reset action. A runaway program must be stoppable by terminating and recreating the worker; do not rely on cross-origin isolation being available.
7. Course structure is a version-controlled tree. Stable content IDs must not depend on file paths so content can be reorganized without breaking references.
8. Definitions and glossary references are explicit authoring constructs. Do not auto-link terms by naive string matching.
9. No feature may require login, cloud state, analytics, telemetry, or third-party network access to function.
10. Prefer primary specifications, standards, language documentation, and reproducible demonstrations over folklore.

## Baseline technology choices

Unless an accepted design change says otherwise:

- Astro + TypeScript for the site and build pipeline.
- MDX for lessons.
- Small React islands only where rich client interaction is justified.
- CodeMirror 6 for editable code cells.
- Pyodide in a dedicated Web Worker for Python and SQLite-backed SQL.
- Static full-text search generated at build time.
- Vitest for pure TypeScript tests and Playwright for browser/runtime integration tests.
- `bun` as the JavaScript package manager and script runner. `tsx` and `vitest` still execute under Node, because SQL fixture validation and the test suite use `node:sqlite`, which Bun does not implement.

Do not replace these technologies merely because another library is fashionable. A replacement must reduce complexity or satisfy a concrete unmet requirement.

## Content contracts

Every lesson must have a stable ID, title, order, declared prerequisites, learning objectives, and status. References to lessons, glossary terms, figures, datasets, and labs must resolve at build time.

Executable examples must be deterministic unless nondeterminism is itself the topic. Seed random sources when practical. Do not depend on public APIs, mutable remote resources, current time, or hidden server state.

A code block is executable only when explicitly marked. Ordinary fenced code remains static.

## Runtime contracts

- Lazy-load Pyodide. A page with no executable cells must not download it.
- Run Pyodide off the main UI thread.
- Serialize execution within a page runtime unless a later design explicitly introduces safe parallelism.
- Default cells to isolated state. State sharing must be explicit through a named session.
- Capture stdout, stderr, final expression/result, structured SQL tables, and errors separately.
- Cap rendered output and result-row counts to protect the page.
- Treat the runtime as a convenience isolation boundary, not as a security sandbox. Never place secrets or privileged APIs in the page.
- Use a restrictive Content Security Policy and self-host runtime assets.

## Engineering rules

- Type public interfaces and worker messages explicitly.
- Prefer small modules with explicit data flow over global stores.
- Keep build-time content validation strict; fail the build on broken IDs, references, duplicate slugs, invalid fixtures, or prerequisite cycles.
- Preserve accessible keyboard operation for navigation, glossary popovers, editors, Run/Stop/Reset controls, and output.
- Avoid hydration for static prose.
- Do not add client state persistence unless the requirement explicitly needs it.
- Keep URLs human-readable and stable.

## Git and change discipline

- Changes to content schema, runtime protocol, routing, or glossary semantics require corresponding documentation changes in `doc/DESIGN.md`.
- New authoring conventions require corresponding changes in `doc/CONTENT_GUIDE.md`.
- Never silently migrate content semantics. Provide a migration script when schema changes affect more than a few files.
- Keep generated files out of hand-edited source locations.
- CI should validate content, type-check, run unit tests, build the site, and run a small browser/Pyodide smoke-test suite.

## Definition of done

A change is done only when:

1. it preserves the static/no-account/no-server-execution architecture;
2. relevant content and links validate;
3. keyboard and narrow-screen behavior are acceptable;
4. executable cells can Run, Stop, and Reset correctly when affected;
5. browser console and worker console are clean in normal use;
6. tests and documentation are updated.
