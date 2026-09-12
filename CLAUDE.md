# Claude Code Instructions

- Use British English in documentation and comments.
- Prefer simple, maintainable solutions over unnecessary abstraction.
- Do not commit secrets or credentials.
- Keep environment-specific values in .env.
- Update documentation when behaviour or setup changes.
## Frontend Development Handoff

Frontend design and frontend implementation should normally be handed off to Cursor.

Claude Code should focus on:

* architecture
* backend logic
* APIs
* database work
* integrations
* tests
* deployment and configuration
* technical planning

Claude Code should not build or substantially redesign frontend interfaces unless the requested change is genuinely minor.

A minor frontend change means something small and obvious, such as:

* changing text
* changing spacing
* changing a simple style value
* fixing a small layout issue
* making a very small existing-component adjustment

Anything involving new screens, substantial component work, layout design, interaction design, responsive behaviour, visual hierarchy, or frontend architecture must be handed off to Cursor.

For frontend work, create or update:

`FRONTEND_HANDOFF.md`

in the project root.

The handoff should give Cursor enough information to implement the frontend without needing to infer backend behaviour. Include, where relevant:

* required pages and screens
* user flows
* component requirements
* states and edge cases
* validation rules
* API endpoints and expected payloads
* database-derived data the interface needs
* authentication and permissions behaviour
* loading, empty and error states
* responsive requirements
* any design constraints from the project scope

Do not prescribe unnecessary visual details unless they are explicitly defined in the scope. Cursor owns the frontend design decisions unless the scope states otherwise.

Keep `FRONTEND_HANDOFF.md` current whenever backend or API changes affect the frontend.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
