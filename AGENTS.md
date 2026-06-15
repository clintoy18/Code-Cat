# Repository Guidelines

## Project Structure & Module Organization
`codecat` is a `pnpm` monorepo. `apps/web` contains the React + Vite frontend, with feature code under `src/features`, shared UI in `src/components`, routes in `src/router`, and tests such as `src/components/ui/Button.test.tsx`. `apps/api` contains the Express API, organized by domain modules in `src/modules`, shared middleware in `src/middleware`, and Prisma schema/seed files in `prisma/`. `packages/shared/src` holds shared types and constants, and `packages/config` centralizes ESLint, Prettier, and Tailwind config.

## Build, Test, and Development Commands
Use Node `20.x` and `pnpm`.

- `pnpm install`: install workspace dependencies.
- `pnpm dev`: start the web and API dev servers in parallel.
- `pnpm build`: build every workspace package.
- `pnpm test`: run Vitest across the repo.
- `pnpm lint`: run ESLint in workspaces that define linting.
- `pnpm typecheck`: run TypeScript checks across the repo.
- `pnpm db:migrate`: apply Prisma migrations for `apps/api`.
- `pnpm db:seed`: seed the API database.
- `pnpm db:studio`: open Prisma Studio.

## Coding Style & Naming Conventions
Prettier enforces 2-space indentation, single quotes, semicolons, and trailing commas. ESLint extends Airbnb TypeScript rules and requires consistent `import type` usage where applicable. Use PascalCase for React components (`AdminLayout.tsx`), camelCase for functions and variables, and keep API modules grouped as `*.controller.ts`, `*.service.ts`, `*.schema.ts`, and `*.routes.ts`. Prefer the configured aliases `@` and `@shared` over deep relative imports.

## Testing Guidelines
Vitest is the test runner for all packages. The web app uses `jsdom` plus Testing Library setup from `apps/web/src/test/setup.ts`; the API uses the Node test environment. Name tests `*.test.ts` or `*.test.tsx` and keep them close to the code they cover. There is no coverage gate yet, but new UI components, API routes, and shared logic should ship with targeted tests.

## Commit & Pull Request Guidelines
This repository does not have commit history yet, so use short imperative subjects such as `Add player progress endpoint`. Keep commits focused and include migrations or seed updates with the related code. Before opening a PR, run `pnpm lint`, `pnpm typecheck`, and `pnpm test`. PRs should include a brief summary, linked issue if applicable, screenshots for UI changes, and notes for schema, seed, or environment changes.

## Security & Configuration Tips
Copy `.env.example` into `apps/api/.env` and `apps/web/.env`; never commit secrets or local `.env` files. When changing Prisma models, include the migration and mention any database reset or reseed steps in the PR.
