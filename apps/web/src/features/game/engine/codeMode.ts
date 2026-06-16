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
    puzzle.availableBlocks
      .filter((block) => block.kind !== 'LOOP')
      .map((block) => [normalizeCodeLine(block.label), block] as const),
  );
  const loopEnabled = puzzle.availableBlocks.some((block) => block.kind === 'LOOP');
  const lines = source.split(/\r?\n/);
  const blocks: IBlockTemplate[] = [];
  const errors: string[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      return;
    }

    const loopMatch = trimmed.match(/^repeat\((\d+)\)\s*(.+)$/i);

    if (loopMatch) {
      if (!loopEnabled) {
        errors.push(`Line ${index + 1}: loops are not available in this puzzle.`);
        return;
      }

      const repeatCount = Number(loopMatch[1]);
      const innerCode = loopMatch[2].trim().replace(/^\{\s*/, '').replace(/\s*\}$/, '');
      const loopBody = availableBlocks.get(normalizeCodeLine(innerCode));

      if (!Number.isInteger(repeatCount) || repeatCount < 2 || repeatCount > 9) {
        errors.push(`Line ${index + 1}: repeat count must be between 2 and 9.`);
        return;
      }

      if (!loopBody) {
        errors.push(`Line ${index + 1}: "${innerCode}" is not available to repeat in this puzzle.`);
        return;
      }

      blocks.push({
        key: `repeat-${index + 1}-${loopBody.key}`,
        label: `repeat(${repeatCount}) ${loopBody.label}`,
        kind: 'LOOP',
        repeatCount,
        loopBody: {
          label: loopBody.label,
          kind: loopBody.kind === 'CONDITIONAL' ? 'CONDITIONAL' : 'MOVE',
          move: loopBody.move,
          condition: loopBody.condition,
          action: loopBody.action,
        },
      });
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
