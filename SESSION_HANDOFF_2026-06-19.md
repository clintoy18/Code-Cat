# Code Cat Session Handoff

Date: 2026-06-19
Repo: `C:\Users\Juliet\codecat`
Worktree: clean

## Current Product State

Code Cat is a pnpm monorepo with:

- `apps/web`: React + Vite frontend
- `apps/api`: Express + Prisma backend
- `packages/shared`: shared types/constants

The current frontend direction is:

- monochrome pixel / arcade UI
- focused gameplay layout
- world-based curriculum roadmap
- block mode + code mode in gameplay
- World 1, World 2, and World 3 loops are live

## Most Recent Completed Work

Recent commits:

- `e185bbb` `Recreate auth UI improvements`
- `cbbef1f` `Preserve active level on gameplay refresh`
- `64c8116` `fix build error on deployment`
- `1d9b163` `Add drag and drop route builder`
- `3adfadb` `add success/fail toast popup for gameplays`
- `04eea94` `reduce number of levels on each lessons`
- `689ab80` `Complete world 3 loop mechanics`

## Important Frontend State

### Auth UI

Rebuilt auth screens to match the monochrome game theme:

- `apps/web/src/features/auth/pages/LoginPage.tsx`
- `apps/web/src/features/auth/pages/RegisterPage.tsx`
- `apps/web/src/styles/index.css`

This adds:

- dedicated auth shell
- monochrome auth cards
- darker inputs
- neutral error states
- responsive stacked mobile layout

### Gameplay Refresh Fix

Refresh bug was fixed so gameplay does not jump back to level 1.

Relevant files:

- `apps/web/src/store/gameStore.ts`
- `apps/web/src/router/AppRouter.tsx`
- `apps/web/src/router/GameplayRedirect.tsx`
- `apps/web/src/pages/player/Gameplay.tsx`
- `apps/web/src/pages/player/LevelSelect.tsx`
- `apps/web/src/pages/player/MainMenu.tsx`
- `apps/web/src/components/layout/AppLayout.tsx`

Behavior now:

- gameplay route is level-specific: `/gameplay/:puzzleId`
- `/gameplay` redirects to current or next unlocked level
- current level survives page refresh

### Build / TS Cleanup Already Done

Frontend build was adjusted so TypeScript no longer emits `.js` files into `src`.

Current web build:

- `tsc -p tsconfig.json --noEmit && vite build`

Also removed deprecated `baseUrl` from tsconfigs rather than silencing it.

## Known Problems / Open Technical Debt

### 1. Pre-commit hook is broken

Commits had to use `--no-verify`.

Failure:

- ESLint cannot resolve `@codecat/config/eslint/react`
- referenced from `apps/web/.eslintrc.cjs`

This needs to be fixed before normal Husky/lint-staged flow is reliable.

### 2. Deployment setup is not fully finished

Vercel build blocker around router filename collision was fixed earlier, but deployment is not fully wrapped up.

Known state:

- frontend build script is corrected
- API still likely needs a `start` script for Render
- deployment docs/config are not fully formalized yet

Likely next deployment task:

- add API `start` script: `node dist/server.js`
- document exact Vercel + Render settings

### 3. Node version mismatch risk

Repo expects:

- Node `>=20 <21`

Local machine previously showed Node 22 in some runs. That can cause noise or deployment mismatch if not aligned.

## Curriculum / Gameplay State

Live worlds:

- World 1: Foundations
- World 2: Decisions
- World 3: Loops

Scaffolded / roadmap worlds:

- World 4: Functions
- World 5: Variables & State
- World 6: Strategy

Loop support already implemented:

- repeat loops
- while loops
- loop blocks in block mode
- loop syntax in code mode

Current limitation:

- future worlds are still content-scaffolded more than fully runtime-complete

## Best Next Work

Recommended next priorities:

1. Fix the ESLint workspace config / Husky hook issue.
2. Finish deployment setup for Vercel + Render.
3. Move gameplay forward to World 4 by implementing reusable user-defined functions.
4. Make teacher/admin UI match the same monochrome system as player/auth screens.

If choosing only one next task, the most practical is:

- fix lint / pre-commit / config health

because it affects every future change.

## Useful Commands

From repo root:

```powershell
cd C:\Users\Juliet\codecat
```

Frontend:

```powershell
npx pnpm@9.15.0 --filter web dev
npx pnpm@9.15.0 --filter web exec tsc -p tsconfig.json --noEmit
```

Backend:

```powershell
npx pnpm@9.15.0 --filter api dev
npx pnpm@9.15.0 --filter api exec tsc -p tsconfig.json --noEmit
```

Workspace:

```powershell
npx pnpm@9.15.0 install
npx pnpm@9.15.0 dev
```

## Notes For Next Session

- The repo is clean right now.
- Auth UI recreation is already committed.
- Gameplay refresh persistence is already committed.
- If a new session needs context fast, start by reading:
  - `SESSION_HANDOFF_2026-06-19.md`
  - `apps/web/src/pages/player/Gameplay.tsx`
  - `apps/web/src/store/gameStore.ts`
  - `apps/web/src/styles/index.css`
  - `apps/web/src/features/game/engine/GameEngine.ts`
