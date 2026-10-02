# AGENTS.md

## Project mission

This repository implements a content-first, self-hostable Web course for professional self-learners studying computer science in the AI era.

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

| Question | Document |
| --- | --- |
| What is invariant about this repository, and how is a change verified? | this file |
| How are the product and its runtime built? | `doc/DESIGN.md` |
| How is a lesson written? | `doc/CONTENT_GUIDE.md` |
| What does the course contain, in what order, and what is finished? | `doc/CURRICULUM.md` |

Baseline technology choices are in `DESIGN.md` section 3. Do not replace them merely because another library is fashionable; a replacement must reduce complexity or satisfy a concrete unmet requirement.

## Engineering rules

- Type public interfaces and worker messages explicitly.
- Prefer small modules with explicit data flow over global stores.
- Keep build-time content validation strict; fail the build on broken IDs, references, duplicate slugs, or invalid fixtures.
- Preserve accessible keyboard operation for navigation, glossary popovers, editors, Run/Stop/Reset controls, and output.
- Do not add client state persistence unless the requirement explicitly needs it.
- Keep URLs human-readable and stable, and keep generated files out of hand-edited source locations.

## Change discipline

- A change to the content schema, runtime protocol, routing or glossary semantics updates `doc/DESIGN.md`. A new authoring convention updates `doc/CONTENT_GUIDE.md`. A change to what is taught updates `doc/CURRICULUM.md`.
- Never silently migrate content semantics. Provide a migration script when a schema change touches more than a few files.
- The curriculum tables describe the repository as it is. If a table disagrees with `content/`, fix the table.

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
5. the documents listed above are updated.
