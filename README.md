# Craftflow Spatial Core — Frontend

Craftflow is an interactive, spatial frontend for describing, reviewing, and following the creation of automated workflows. This repository contains the browser application and its frontend contracts; workflow generation and orchestration are provided by a separately operated service.

The project is maintained as an isolated frontend workspace. Backend implementation, model credentials, and production secrets do not belong in this repository.

## What is included

- **Intent-driven workspace:** a central input surface for describing the workflow a user wants to build.
- **Spatial interface:** a lazily loaded Three.js / React Three Fiber scene with motion-aware rendering.
- **Workflow modules:** focused UI for spatial models, reference cost estimates, ambient notifications, and system metrics.
- **Factory integration:** a typed service boundary with a local mock implementation and an optional HTTP implementation.
- **Human approval flow:** job status, test-report display, clarification, version-bound approval or rejection, and recovery for unconfirmed mutations.
- **Frontend state and contracts:** Zustand stores and TypeScript types that keep UI state and the HTTP contract explicit.

The mock cost and production metrics are illustrative fixtures. They are not live quotes, billing records, or proof of actual production usage.

## Technology

- React 19 and TypeScript
- Vite 8 and Tailwind CSS 4
- Three.js, React Three Fiber, and Drei
- Framer Motion
- Zustand
- Vitest
- Cloudflare Workers static assets for the controlled delivery path

The exact dependency graph is pinned by `package-lock.json`.

## Requirements

- Node.js **22.12.0 or newer**
- npm (the version bundled with the selected Node.js release is generally sufficient)

The repository's `.nvmrc` selects the Node.js 22 line. The `engines` field in `package.json` sets the minimum supported version.

## Local development

1. Install Node.js 22.12.0 or newer.
2. Install the locked dependencies:

   ```sh
   npm ci
   ```

3. Optionally copy `.env.example` to `.env.local`. The checked-in template intentionally contains no credentials.
4. Start the Vite development server:

   ```sh
   npm run dev
   ```

When `VITE_FACTORY_MODE` is empty or set to `mock`, the frontend uses the local `MockFactoryService`. This is the default development mode and does not require the external orchestrator.

## Factory configuration

The frontend supports three service-selection outcomes:

| Configuration | Result |
| --- | --- |
| `VITE_FACTORY_MODE=` (empty) or `mock` | Local mock service |
| `VITE_FACTORY_MODE=http` and a valid `VITE_FACTORY_API_BASE_URL` | HTTP factory service |
| Unknown mode or invalid/missing URL in HTTP mode | Unavailable service; no silent fallback to mock |

For HTTP mode, set the base URL to the HTTPS origin of the separately operated factory API. Plain HTTP is accepted only for loopback development hosts. The URL must not contain embedded credentials, a query string, or a fragment.

```dotenv
VITE_FACTORY_MODE=http
VITE_FACTORY_API_BASE_URL=https://your-factory-api.example
```

The example hostname above is illustrative; replace it only with an endpoint supplied by the service operator.

**Important:** Vite exposes every `VITE_*` variable to browser-side code. These values are configuration, not secret storage. Never put API keys, passwords, access tokens, private keys, or other credentials in a `VITE_*` variable or in frontend source.

In HTTP mode, the application checks the backend OWNER session before exposing the authenticated workspace. The HTTP service uses browser credentials for its requests; session handling and authorization remain responsibilities of the backend.

## Common commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local Vite development server |
| `npm run typecheck` | Run TypeScript without emitting files |
| `npm test` | Run the Vitest suite under `src/` |
| `node --test scripts/*.test.mjs` | Run Node-based governance and release-gate tests |
| `npm run build` | Typecheck and create the production frontend build in `dist/` |
| `npm run preview` | Preview the built frontend locally |
| `npm audit --omit=dev --audit-level=high` | Audit production dependencies for high-severity issues |

The main CI workflow runs the Node-based gate tests, installs from the lockfile, typechecks, runs the frontend tests, builds the app, and audits production dependencies.

## Repository layout

| Path | Responsibility |
| --- | --- |
| `src/App.tsx` | Application composition and HTTP-mode session gate |
| `src/components/ui/` | Interactive interface modules |
| `src/components/canvas/` and `src/scenes/` | Spatial/3D rendering |
| `src/hooks/` | UI behavior and factory integration |
| `src/services/factory/` | Mock and HTTP service implementations, validation, and mapping |
| `src/store/` | Zustand application and factory state |
| `src/types/` | Shared frontend and factory contracts |
| `src/mocks/` | Local example data and mock scenarios |
| `scripts/` | E2E, governance, release, and promotion checks |
| `.github/workflows/` | CI, preview, E2E, and controlled delivery workflows |
| `docs/`, `audit/`, `evidence/` | Contracts, runbooks, audit records, and project evidence |

## Delivery model

Changes are validated through GitHub Actions. The Cloudflare test workflow uploads a version without routing production traffic. The production promotion workflow is triggered only after the main-branch Real E2E succeeds; it rebuilds the exact triggering commit and verifies the required post-merge evidence before production deployment. A separate post-deploy gate checks the deployed result.

Production deployment is intentionally automated and protected. Do not bypass the repository's review, branch, or promotion controls with a manual production deployment.

## Security and repository boundaries

- Read [SECURITY.md](SECURITY.md) before contributing or handling credentials.
- Follow [AGENTS.md](AGENTS.md) for the repository's role boundaries and human-approval rules.
- Keep local environment files private. The repository ignores `.env` and `.env.*` files except for the safe `.env.example` template.
- Do not add backend source, production credentials, personal data, customer records, cookies, or unredacted production logs.
- Audit and evidence documents can contain operational metadata such as service references, deployment identifiers, run identifiers, and environment hostnames. That metadata is not automatically an authentication secret, but it must be reviewed and minimized before changing repository visibility or distributing an archive.

## License

There is currently no `LICENSE` file in this repository. No open-source license or general permission to reuse, modify, or redistribute the code is granted by the repository contents. Do not assume that public availability, if enabled later, changes this.
