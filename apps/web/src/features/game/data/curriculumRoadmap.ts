import { flattenWorldPuzzles } from '@/features/game/data/lessonRoadmap';
import {
  decisionsWorld,
  foundationsWorld,
  functionsWorld,
  loopsWorld,
  stateWorld,
  strategyWorld,
} from '@/features/game/data/worlds';

export const curriculumWorlds = [
  foundationsWorld,
  decisionsWorld,
  loopsWorld,
  functionsWorld,
  stateWorld,
  strategyWorld,
].sort((left, right) => left.order - right.order);

export const playableWorlds = curriculumWorlds.filter((world) => world.status === 'playable');

export const starterPuzzles = flattenWorldPuzzles(playableWorlds);
