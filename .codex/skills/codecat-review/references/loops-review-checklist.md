# Loops Review Checklist

## Key Files

- `apps/web/src/features/game/engine/GameEngine.ts`
- `apps/web/src/features/game/engine/codeMode.ts`
- `apps/web/src/pages/player/Gameplay.tsx`
- `apps/web/src/features/game/data/worlds/loopsWorld.ts`
- `apps/web/src/features/game/data/curriculumRoadmap.ts`
- `apps/web/src/pages/player/LevelSelect.tsx`

## Done Criteria For World 3

Loops are not complete until all three capabilities are implemented in real gameplay:

1. Multi-line loop bodies
2. While loops
3. Nested loops

Each capability must exist across all layers below.

## Layer Checklist

### Engine

- Loop structures can represent lists of child blocks, not just one child action.
- While loops have explicit conditions.
- Nested loop execution is supported recursively.
- Execution has a safety cap that fails clearly on non-terminating loops.
- Logs remain understandable for nested and repeated execution.
- Visited tiles and success/error status remain correct.

### Parser And Serializer

- Code mode accepts loop bodies, not only `repeat(n) oneCommand`.
- While loop syntax is supported.
- Nested loop syntax is supported.
- Serialization can round-trip the structures it parses.
- Invalid nesting and malformed braces are reported clearly.

### Gameplay UI

- Block mode can build multi-step loop bodies.
- Block mode can create while loops.
- Nested loops can be authored or at least edited safely if code mode introduces them.
- Program display remains readable for nested structures.

### Curriculum

- `loopsWorld.ts` contains puzzles that actually require the new mechanics.
- `currentMechanics` reflects shipped behavior only.
- `futureMechanics` no longer lists a mechanic once it is implemented.

### Progression Gating

- `curriculumRoadmap.ts` only promotes later worlds if loop scope is genuinely complete.
- `LevelSelect.tsx` and related copy do not claim more than the runtime supports.

### Tests

- Engine tests for multi-line repeat, while loop termination, and nested loop execution.
- Parser tests for valid and invalid loop syntax.
- UI tests for loop authoring paths if the UI becomes structurally complex.

## Review Output Expectations

- List findings first, ordered by severity.
- Cite concrete files and line numbers.
- Call out whether the change is:
  - runtime complete
  - UI complete
  - curriculum complete
  - ready to unlock the next world
- If any of those are false, say that Loops world should remain incomplete.

