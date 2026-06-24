import { describe, expect, it } from 'vitest';
import {
  curriculumWorlds,
  playableWorlds,
  starterPuzzles,
} from './curriculumRoadmap';

describe('curriculum roadmap gating', () => {
  it('includes World 5 in the playable roadmap and starter puzzle list', () => {
    expect(curriculumWorlds.map((world) => world.id)).toContain('state');
    expect(playableWorlds.map((world) => world.id)).toContain('state');
    expect(starterPuzzles.map((puzzle) => puzzle.id)).toContain('signal-lane');
    expect(starterPuzzles.map((puzzle) => puzzle.id)).toContain(
      'checkpoint-cache',
    );
  });

  it('keeps future World 5 puzzles out of the starter progression path', () => {
    expect(starterPuzzles.map((puzzle) => puzzle.id)).not.toContain(
      'memory-ribbon',
    );
  });

  it('includes World 6 in the playable roadmap and starter puzzle list', () => {
    expect(curriculumWorlds.map((world) => world.id)).toContain('strategy');
    expect(playableWorlds.map((world) => world.id)).toContain('strategy');
    expect(starterPuzzles.map((puzzle) => puzzle.id)).toContain(
      'perimeter-plan',
    );
    expect(starterPuzzles.map((puzzle) => puzzle.id)).toContain(
      'false-shortcut',
    );
  });

  it('keeps future World 6 puzzles out of the starter progression path', () => {
    expect(starterPuzzles.map((puzzle) => puzzle.id)).not.toContain(
      'switchback-budget',
    );
  });
});
