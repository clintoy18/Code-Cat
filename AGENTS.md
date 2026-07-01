# Repository Guidelines

## Project Structure & Module Organization

`codecat` is a `pnpm` monorepo. `apps/web` contains the React + Vite frontend, with pages in `src/pages`, feature modules in `src/features`, shared components in `src/components`, routing in `src/router`, and tests near the code. `apps/api` contains the Express + Prisma backend, with domain modules under `src/modules`, middleware in `src/middleware`, and schema/seed files in `prisma/`. Shared types and constants live in `packages/shared/src`, while `packages/config` holds shared ESLint, Prettier, and Tailwind config.

## Build, Test, and Development Commands

Use Node `20.x` and `pnpm`.

- `pnpm install`: install workspace dependencies.
- `pnpm dev`: run web and API in parallel for local development.
- `pnpm build`: build all workspace packages.
- `pnpm test`: run Vitest across the repo.
- `pnpm lint`: run ESLint where configured.
- `pnpm typecheck`: run TypeScript checks across all workspaces.
- `pnpm db:push`: sync Prisma schema to the database.
- `pnpm db:seed`: seed demo data for the API.

## Coding Style & Naming Conventions

Prettier enforces 2-space indentation, single quotes, semicolons, and trailing commas. ESLint extends Airbnb TypeScript rules. Prefer `import type` when applicable. Use PascalCase for React components such as `AdminLayout.tsx`, camelCase for variables and functions, and keep backend files grouped by domain naming like `teacher.service.ts`, `teacher.routes.ts`, and `teacher.schema.ts`. Prefer aliases like `@` and `@shared` over deep relative imports.

## Testing Guidelines

Vitest is the test runner for both apps. Frontend tests use `jsdom` and Testing Library; backend tests run in Node. Name tests `*.test.ts` or `*.test.tsx` and keep them close to the code they verify. Run `pnpm test` before opening a PR, and add targeted tests for new UI, routes, and shared logic.

## Commit & Pull Request Guidelines

Use short, imperative commit subjects, for example `Add admin user CRUD` or `Fix classroom assignment pagination`. Keep commits focused and include related Prisma or seed changes in the same commit. PRs should include a brief summary, linked issue when relevant, screenshots for UI work, and notes for schema, environment, or migration changes.

## Security & Configuration Tips

Copy environment values from `.env.example` into local app `.env` files. Do not commit secrets. When changing Prisma models, include the schema update and document whether reseeding or resetting data is required.
