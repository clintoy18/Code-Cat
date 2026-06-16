import type { IBlockTemplate, IProgramBlock, IPuzzleDefinition } from './GameEngine';

export interface IProgramParseResult {
  success: boolean;
  blocks: IBlockTemplate[];
  errors: string[];
}

const normalizeCodeLine = (value: string) =>
  value
    .trim()
    .replace(/;+$/g, '')
    .replace(/\s+/g, '')
    .toLowerCase();

export const serializeProgramToCode = (program: IProgramBlock[]) => program.map((block) => block.label).join('\n');

export const parseProgramCode = (source: string, puzzle: IPuzzleDefinition): IProgramParseResult => {
  const availableBlocks = new Map(
    puzzle.availableBlocks.map((block) => [normalizeCodeLine(block.label), block] as const),
  );
  const lines = source.split(/\r?\n/);
  const blocks: IBlockTemplate[] = [];
  const errors: string[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      return;
    }

    const block = availableBlocks.get(normalizeCodeLine(trimmed));

    if (!block) {
      errors.push(`Line ${index + 1}: "${trimmed}" is not available in this puzzle.`);
      return;
    }

    blocks.push(block);
  });

  if (!blocks.length) {
    errors.push('Add at least one command before applying code mode.');
  }

  return {
    success: errors.length === 0,
    blocks,
    errors,
  };
};
