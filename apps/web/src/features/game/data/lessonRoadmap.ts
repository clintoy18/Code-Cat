import type { IPuzzleDefinition, LessonTopic } from '@/features/game/engine';

export type CurriculumStatus = 'playable' | 'scaffolded';

export interface ICurriculumWorld {
  id: string;
  order: number;
  title: string;
  shortLabel: string;
  focus: LessonTopic[];
  description: string;
  studentOutcome: string;
  agentOwner: string;
  status: CurriculumStatus;
  currentMechanics: string[];
  futureMechanics: string[];
  puzzles: IPuzzleDefinition[];
}

export const flattenWorldPuzzles = (worlds: ICurriculumWorld[]) => worlds.flatMap((world) => world.puzzles);

export const getRoadmapStats = (worlds: ICurriculumWorld[]) => {
  const playableWorlds = worlds.filter((world) => world.status === 'playable');
  const scaffoldedWorlds = worlds.filter((world) => world.status === 'scaffolded');

  return {
    totalWorlds: worlds.length,
    playableWorlds: playableWorlds.length,
    scaffoldedWorlds: scaffoldedWorlds.length,
    totalPuzzles: flattenWorldPuzzles(worlds).length,
  };
};
