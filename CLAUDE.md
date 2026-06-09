# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project context

Read **[PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)** first — it is the single, always-current
reference for this project's architecture (frontend, backend, design-system), how to run the
stack, the API endpoints, and the non-negotiable design rules. It exists so you don't have to
re-read the whole codebase each session.

## ⚠️ Keep PROJECT_CONTEXT.md updated

**After every change to the code, update `PROJECT_CONTEXT.md` to match.** It must always
reflect the current state of the repo. Whenever you (or anyone) change:

- an API endpoint, route, request/response shape, or business rule → update the Backend section
- a JS module's role, a page, or the build setup → update the Frontend section
- a design token, brand rule, or design-system structure → update the Design system section
- a DB table, run command, service, port, or env var → update the relevant section

Also bump the **"Last updated"** date at the top of the file. Treat this update as part of the
change itself, not an optional follow-up — a stale context file is worse than none.
