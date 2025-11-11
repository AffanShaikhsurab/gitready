# GitReady

GitReady is a Next.js application that analyzes a GitHub profile and repositories, scores signal strength, and suggests focused improvements. It can generate professional README content, starter tests, and a CI workflow for a repository, and—when authenticated—open a pull request with the changes.

## Overview

- Profile analysis uses the GitHub REST API to derive signals (README presence, tests, CI workflows, commit activity) for non‑fork repositories.
- When a Google Generative AI API key is provided, analysis uses Gemini; otherwise a deterministic mock analysis is returned.
- The report view presents an overall score and tier, highlights issues, and offers actionable follow‑ups.
- Content generation produces ready‑to‑use templates for READMEs, basic tests, and GitHub Actions CI.
- GitHub OAuth enables automatically creating a branch or fork and opening a PR with generated changes.

## Tech Stack

- Next.js 15 (App Router), React 19
- TypeScript (strict), Tailwind CSS 4
- Radix UI primitives and custom UI wrappers
- Zustand for client state management
- GitHub REST API (server-side)
- Google Generative AI (Gemini) via `@google/generative-ai`

## Getting Started

### Prerequisites

- Node.js 18+
- A GitHub OAuth app (for signing in and opening PRs)
- Optional: a Personal Access Token (PAT) for server-side operations

### Installation

```bash
git clone https://github.com/<your-username>/gitready.git
cd gitready
npm install
```

### Environment Configuration

Copy `.env.example` to `.env.local` and fill in values:

```bash
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
# For local development, this should match your dev server
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/callback/github
# Base site URL used for callback redirect validation; set to your app origin
NEXTAUTH_URL=http://localhost:3000
```

Optional for server-side operations without OAuth:

- `GITHUB_TOKEN` (classic repo scope or fine‑grained with Contents and Pull requests). This is read server-side only by `lib/github-service.ts`.

### Development

```bash
npm run dev
# Visit http://localhost:3000
```

### Production

```bash
npm run build
npm start
```

Ensure `GITHUB_CALLBACK_URL` and `NEXTAUTH_URL` are set to your production origin.

## Usage

### App Flow

1. Enter a GitHub username (or profile URL) and choose the target role and seniority.
2. The analyzer fetches public non‑fork repositories and computes signals.
3. Review the report, then use the actions to:
   - Generate a README for a selected repository
   - Generate language‑appropriate starter tests
   - Generate a GitHub Actions CI workflow
4. Sign in with GitHub to enable auto‑PR creation. Without OAuth, you may configure `GITHUB_TOKEN` for server‑side operations.

### Authentication Endpoints

- `GET /api/auth/github/login` — Redirects to GitHub OAuth authorize.
  - Query params: `scope` (space‑delimited, default `public_repo user:email workflow`), `returnTo`.
- `GET /api/auth/callback/github` — Handles OAuth callback; stores token as `gh_token` httpOnly cookie.
- `GET /api/auth/status` — Returns `{ authenticated: boolean }` based on `gh_token`.

### Analysis API

- `POST /api/analyze`
  - Body: `{ "username": string, "role": string, "seniority": string }`
  - Returns: `{ userData, repos, analysis }` including score, tier, signals, issues, and actions.

Example:

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"username":"octocat","role":"Frontend","seniority":"Junior"}'
```

### Content Generation API

- `POST /api/generate/readme`
  - Body: `{ "owner": string, "repo": string, "language"?: string }`
  - Returns: `{ content }` (README text).

### Apply Changes API (auto PR)

- `POST /api/apply`
  - Body: `{ "owner": string, "repo": string, "action": "readme"|"tests"|"ci", "language"?: string }`
  - Behavior:
    - Attempts to create a branch on the upstream; if not permitted, forks to the authenticated user.
    - Creates or updates the generated file on the branch.
    - Opens a pull request to the upstream default branch with a clear commit message.
  - Authentication:
    - Prefers the `gh_token` cookie set via OAuth.
    - Falls back to the server-side `GITHUB_TOKEN` if present.

Required scopes for tokens:

- Classic token: `repo`
- Fine‑grained token: Contents (Read & write), Pull requests (Read & write), and access to the target repositories.

## Project Structure

```
app/                   # Next.js App Router, pages and API routes
  api/                 # Analysis, apply, auth, generate endpoints
components/            # UI and views (landing, analyzing, report)
components/ui/         # Primitive UI wrappers (Radix + Tailwind)
lib/                   # Core services and utilities
  ai-service.ts        # Gemini-backed analysis with mock fallback
  github-service.ts    # GitHub REST API client (server-side)
  content-generators.ts# README/tests/CI template generators
  store.ts             # Zustand store and types
public/                # Static assets
```

## Design Notes

- Analysis only considers non‑fork repositories to avoid noise.
- Readme/Test/CI detection is heuristic based on common paths and GitHub API listing.
- `github-service.ts` uses guarded retries and a minimal rate‑limit cache.
- Tokens are only read and used server-side; never expose tokens to the client.

## Troubleshooting

- OAuth not configured: verify `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL`, and `NEXTAUTH_URL`.
- Permission errors (403) on apply: ensure the token has the scopes listed above.
- Missing Gemini key: analysis falls back to a mock profile analysis.

## Acknowledgments

- GitHub REST API
- Google Generative AI (Gemini)
