---
name: codecat-review
description: Review Code Cat gameplay and curriculum changes with emphasis on loop mechanics, world progression gating, and engine/UI/content alignment. Use when auditing changes in `apps/web/src/features/game`, `apps/web/src/pages/player`, or curriculum world files, when deciding whether the Loops world is complete enough to unlock the next world, or when performing a repo-specific code review for bugs, regressions, and missing tests.
---

# Codecat Review

## Review Workflow

Review with findings first. Prioritize bugs, behavioral regressions, missing tests, and mismatches between runtime behavior, parser behavior, UI affordances, and curriculum data.

Read [references/loops-review-checklist.md](references/loops-review-checklist.md) when the change touches loops, progression gating, or world readiness.

## Core Standards

- Treat the Loops world as incomplete until all three mechanics exist end-to-end:
  - multi-line loop bodies
  - while loops
  - nested loops
- Do not mark loops complete if support exists only in types, only in parser syntax, or only in UI copy.
- Require alignment across:
  - engine types and runtime execution
  - code parser and serializer
  - block-mode UI and code-mode UI
  - authored puzzle data
  - progression gating
  - tests
- Keep the next worlds scaffolded until the loop completion criteria are met in shipping behavior, not roadmap text.

## Review Focus

### Engine

Inspect loop data shapes, execution rules, recursion, and safety limits. Look for infinite loop risks, malformed nested structures, incorrect visited-path tracking, and status/log inconsistencies.

### Parser And Serialization

Verify code mode can parse and round-trip the supported syntax. Reject implementations where block mode can create structures that code mode cannot represent, or vice versa.

### Gameplay UI

Check whether the player can actually create, inspect, edit, and understand the loop constructs exposed by the runtime. Treat placeholder copy or static labels as non-functional.

### Curriculum And Gating

Confirm the world data matches the implemented mechanics. A world should only be `playable` when the required mechanics are actually shipped. If loops are incomplete, `functions`, `state`, and `strategy` must remain scaffolded.

### Tests

Expect targeted coverage for new runtime behavior, parsing rules, and any complex UI path used to build loop structures.

## Permission Guidance

Repo files cannot disable Codex escalation prompts. If repeated safe commands are needed, suggest persistent prefix approvals when the platform supports them. Do not claim that this skill can auto-accept approvals.

