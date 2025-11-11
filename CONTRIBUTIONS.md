# Contributing Guidelines

Thank you for your interest in contributing. This document describes how to set up the project, coding conventions, and expectations for pull requests. The goal is to keep changes predictable, easy to review, and consistent with the existing codebase.

## Project Setup

- Prerequisites: Node.js 18+
- Install dependencies: `npm install`
- Run locally: `npm run dev` (default port `3000`)
- Environment: copy `.env.example` to `.env.local` and provide values for OAuth and optional tokens. Do not commit secrets.

## Branching Strategy

Create topic branches off `main`:

- `feature/<short-name>` — new functionality
- `fix/<short-name>` — bug fixes
- `docs/<short-name>` — documentation changes
- `chore/<short-name>` — tooling and maintenance

## Commit Messages

Use Conventional Commits. Examples:

- `feat(report): add signal breakdown grid`
- `fix(api): handle missing username with 400 response`
- `docs(readme): clarify OAuth configuration`
- `chore(deps): bump next to 15.1.0`

Prefixes: `feat`, `fix`, `docs`, `chore`, `refactor`, `perf`, `test`, `ci`.

## Pull Requests

Before opening a PR:

- Ensure `npm run lint` passes.
- If the change touches API behavior, update or add endpoint documentation in the README.
- If the change affects UI, include a brief description and screenshots or a short clip.
- Keep commits focused; prefer small, cohesive changes over large mixed diffs.

PR description checklist:

- What changed and why.
- Any breaking changes or migration notes.
- Security or permission implications (especially for GitHub OAuth/PAT usage).

## Coding Standards

- TypeScript: strict mode is enabled. Avoid `any`. Prefer explicit types and interfaces.
- Imports: use the path alias `@/*` configured in `tsconfig.json` where appropriate.
- Error Handling: return consistent `NextResponse.json` payloads with clear messages and status codes.
- Logging: use targeted logs during development; do not log secrets or token values.
- Secrets: never expose tokens to client components; keep OAuth/PAT use server-side.
- Style: Tailwind CSS utility classes are preferred for styling; leverage `components/ui` wrappers for primitives.

## API Design

- Place new endpoints under `app/api/<feature>/route.ts` using the App Router conventions.
- Use `lib/github-service.ts` for calling GitHub; do not reimplement raw fetches.
- Validate inputs early and return explicit 400 errors for missing/invalid fields.
- Consider rate limits and retries when calling external APIs.

## UI Conventions

- Build new views under `components/` and keep them client/server boundaries explicit (`'use client'` for client components).
- Favor composable components; avoid adding ad‑hoc styles when a wrapper exists in `components/ui`.
- Keep copy concise and neutral; match the tone of the product.

## State Management

- Use the centralized Zustand store (`lib/store.ts`) for cross‑view state.
- Keep store updates atomic and predictable; prefer specific setters over broad mutations.

## Testing & CI

- A formal test runner is not configured. Contributions that introduce tests are welcome.
  - Place tests under `tests/` and choose an appropriate runner (e.g., Vitest or Jest).
  - Keep tests focused and deterministic.
- CI workflow templates are available in `lib/content-generators.ts`. If adding CI, place workflows under `.github/workflows/`.

## Security & Permissions

- OAuth tokens are stored in an httpOnly cookie (`gh_token`); treat them as sensitive.
- For server-side PATs, set `GITHUB_TOKEN` in the environment with appropriate scopes.
- Required scopes:
  - Classic PAT: `repo`
  - Fine‑grained: Contents (Read & write), Pull requests (Read & write).

## Documentation

- Update `README.md` when adding features, endpoints, or configuration options.
- Keep examples minimal and reproducible.

## Issue Reporting

- Use clear, reproducible steps.
- Provide configuration details if the issue relates to OAuth or tokens.
- Include logs without secrets.

## Release & Versioning

- The project does not publish releases. Keep `main` deployable; avoid breaking changes without migration notes.

## License

- No license file is present. Do not add license headers unless maintainers approve.
