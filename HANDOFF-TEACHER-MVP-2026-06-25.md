# Teacher MVP Handoff

## Scope Locked In

- `custom rooms`: yes
- `custom worlds`: no for MVP
- `existing world assignment`: yes
- `manual student selection from existing accounts`: yes
- `assignment scheduling`: `startAt` + `dueAt`
- `scoring`: internal 100-point score mapped to letter grade
- `score components`:
  - completion
  - efficiency vs par
  - code quality vs code budget
  - retry penalty
- `student visibility target`: assigned rooms plus official base worlds
- `versioning`: custom rooms version on publish/save

## What Is Already Done

### Backend

- Added new Prisma schema models in [apps/api/prisma/schema.prisma](/abs/path/C:/Users/Juliet/codecat/apps/api/prisma/schema.prisma):
  - `Classroom`
  - `ClassroomEnrollment`
  - `TeacherRoomVersion`
  - `ClassroomAssignment`
  - `StudentAssignmentProgress`
  - enums `RoomLifecycleStatus`, `AssignmentTargetType`
- Added shared teacher types in [packages/shared/src/types/teacher.ts](/abs/path/C:/Users/Juliet/codecat/packages/shared/src/types/teacher.ts) and exported them from [packages/shared/src/types/index.ts](/abs/path/C:/Users/Juliet/codecat/packages/shared/src/types/index.ts).
- Rebuilt teacher module:
  - [apps/api/src/modules/teacher/teacher.schema.ts](/abs/path/C:/Users/Juliet/codecat/apps/api/src/modules/teacher/teacher.schema.ts)
  - [apps/api/src/modules/teacher/teacher.controller.ts](/abs/path/C:/Users/Juliet/codecat/apps/api/src/modules/teacher/teacher.controller.ts)
  - [apps/api/src/modules/teacher/teacher.routes.ts](/abs/path/C:/Users/Juliet/codecat/apps/api/src/modules/teacher/teacher.routes.ts)
  - [apps/api/src/modules/teacher/teacher.service.ts](/abs/path/C:/Users/Juliet/codecat/apps/api/src/modules/teacher/teacher.service.ts)
- Added teacher utility layer and unit tests:
  - [apps/api/src/modules/teacher/teacher.utils.ts](/abs/path/C:/Users/Juliet/codecat/apps/api/src/modules/teacher/teacher.utils.ts)
  - [apps/api/src/modules/teacher/teacher.utils.test.ts](/abs/path/C:/Users/Juliet/codecat/apps/api/src/modules/teacher/teacher.utils.test.ts)
- Expanded progress module for student assignment tracking:
  - [apps/api/src/modules/progress/progress.schema.ts](/abs/path/C:/Users/Juliet/codecat/apps/api/src/modules/progress/progress.schema.ts)
  - [apps/api/src/modules/progress/progress.controller.ts](/abs/path/C:/Users/Juliet/codecat/apps/api/src/modules/progress/progress.controller.ts)
  - [apps/api/src/modules/progress/progress.routes.ts](/abs/path/C:/Users/Juliet/codecat/apps/api/src/modules/progress/progress.routes.ts)
  - [apps/api/src/modules/progress/progress.service.ts](/abs/path/C:/Users/Juliet/codecat/apps/api/src/modules/progress/progress.service.ts)
- `api` TypeScript check passes.

### Frontend

- Added teacher API/query layer in [apps/web/src/features/teacher/api.ts](/abs/path/C:/Users/Juliet/codecat/apps/web/src/features/teacher/api.ts).
- Added teacher content adapter in [apps/web/src/features/teacher/content.ts](/abs/path/C:/Users/Juliet/codecat/apps/web/src/features/teacher/content.ts).
- Exported the feature in [apps/web/src/features/teacher/index.ts](/abs/path/C:/Users/Juliet/codecat/apps/web/src/features/teacher/index.ts).
- Replaced teacher placeholders with MVP-oriented pages:
  - [apps/web/src/pages/teacher/Dashboard.tsx](/abs/path/C:/Users/Juliet/codecat/apps/web/src/pages/teacher/Dashboard.tsx)
  - [apps/web/src/pages/teacher/Students.tsx](/abs/path/C:/Users/Juliet/codecat/apps/web/src/pages/teacher/Students.tsx)
  - [apps/web/src/pages/teacher/Lessons.tsx](/abs/path/C:/Users/Juliet/codecat/apps/web/src/pages/teacher/Lessons.tsx)
  - [apps/web/src/pages/teacher/Progress.tsx](/abs/path/C:/Users/Juliet/codecat/apps/web/src/pages/teacher/Progress.tsx)
- Updated teacher navigation:
  - [apps/web/src/components/layout/Sidebar.tsx](/abs/path/C:/Users/Juliet/codecat/apps/web/src/components/layout/Sidebar.tsx)
  - [apps/web/src/router/AppRouter.tsx](/abs/path/C:/Users/Juliet/codecat/apps/web/src/router/AppRouter.tsx)
  - [apps/web/src/pages/teacher/index.ts](/abs/path/C:/Users/Juliet/codecat/apps/web/src/pages/teacher/index.ts)
- Started assignment-session runtime separation in [apps/web/src/store/gameStore.ts](/abs/path/C:/Users/Juliet/codecat/apps/web/src/store/gameStore.ts) and [apps/web/src/hooks/useGame.ts](/abs/path/C:/Users/Juliet/codecat/apps/web/src/hooks/useGame.ts).

## What Is Not Done Yet

### Highest Priority

1. Finish student assignment gameplay integration.
   - `Gameplay.tsx` still does not consume `assignmentId` query params.
   - `LevelSelect.tsx` still does not render the classroom assignment feed.
   - no runtime submission to `POST /progress/rooms` yet.
2. Run `web` typecheck and fix all compile errors.
   - this has not been run yet after the new teacher pages and store changes.
3. Add at least targeted web tests for:
   - teacher dashboard rendering
   - classroom manager basic flow shape
   - level select assignment section once added

### Likely Frontend Breakpoints

- `useGame` mocks in existing tests will probably need new fields:
  - `officialPuzzles`
  - `sessionMode`
  - `activeAssignmentId`
  - `completedAssignmentPuzzleIds`
  - `startOfficialSession`
  - `startAssignmentSession`
- `MainMenu.tsx` and `LevelSelect.tsx` still assume the active store puzzle set is the official set.
- `Gameplay.tsx` likely needs a session bootstrap path:
  - official mode: `startOfficialSession(routePuzzleId)`
  - assignment mode: fetch assignment detail, resolve manifest to puzzles, then `startAssignmentSession(...)`

## Recommended Next Steps

1. Run `pnpm.cmd --filter web typecheck`.
2. Fix compile errors in the new teacher pages and query layer.
3. Update [apps/web/src/pages/player/LevelSelect.tsx](/abs/path/C:/Users/Juliet/codecat/apps/web/src/pages/player/LevelSelect.tsx):
   - call `startOfficialSession()` on mount
   - fetch `useStudentAssignmentsQuery()`
   - render assigned classroom section above official worlds
   - navigate assigned rooms with `?assignmentId=...`
4. Update [apps/web/src/pages/player/Gameplay.tsx](/abs/path/C:/Users/Juliet/codecat/apps/web/src/pages/player/Gameplay.tsx):
   - read `assignmentId` from search params
   - fetch `useStudentAssignmentQuery(assignmentId)`
   - resolve assignment manifest into `IPuzzleDefinition[]`
   - call `startAssignmentSession`
   - submit every run result with `useCreateAssignmentRoomProgressMutation()`
5. Re-run:
   - `pnpm.cmd --filter web typecheck`
   - `pnpm.cmd --filter api typecheck`
   - `pnpm.cmd --filter web test`
   - `pnpm.cmd --filter api test`

## Important Notes

- Prisma client generation hit a locked Windows query engine binary.
- Working workaround used successfully:
  - `pnpm.cmd --filter api exec prisma generate --no-engine`
- If a full Prisma engine regenerate is needed later, likely stop any running Node/Prisma processes first.
- `api` typecheck currently passes after the schema/client refresh.
- No migration/db push has been run yet in this session.

## Current Working Tree

- Many uncommitted changes are present across API, shared types, and web.
- Nothing has been committed from this teacher MVP work yet.

## Files Added This Session

- [packages/shared/src/types/teacher.ts](/abs/path/C:/Users/Juliet/codecat/packages/shared/src/types/teacher.ts)
- [apps/api/src/modules/teacher/teacher.utils.ts](/abs/path/C:/Users/Juliet/codecat/apps/api/src/modules/teacher/teacher.utils.ts)
- [apps/api/src/modules/teacher/teacher.utils.test.ts](/abs/path/C:/Users/Juliet/codecat/apps/api/src/modules/teacher/teacher.utils.test.ts)
- [apps/web/src/features/teacher/api.ts](/abs/path/C:/Users/Juliet/codecat/apps/web/src/features/teacher/api.ts)
- [apps/web/src/features/teacher/content.ts](/abs/path/C:/Users/Juliet/codecat/apps/web/src/features/teacher/content.ts)
- [apps/web/src/features/teacher/index.ts](/abs/path/C:/Users/Juliet/codecat/apps/web/src/features/teacher/index.ts)
- [apps/web/src/pages/teacher/Progress.tsx](/abs/path/C:/Users/Juliet/codecat/apps/web/src/pages/teacher/Progress.tsx)

## Safe Resume Point

- Start from `web typecheck`.
- Do not touch the backend schema/service layer unless the web uncovers contract issues.
- Keep the current product boundary:
  - no custom worlds
  - no invite flow
  - no teacher approval workflow
  - no student-side open classroom browsing
