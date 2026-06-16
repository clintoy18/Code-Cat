import {
  createRepeatBlockTemplate,
  createWhileBlockTemplate,
  formatConditionToken,
  parseConditionToken,
  type IBlockTemplate,
  type IConditionalBlockTemplate,
  type IProgramBlock,
  type IPuzzleDefinition,
} from './GameEngine';

export interface IProgramParseResult {
  success: boolean;
  blocks: IBlockTemplate[];
  errors: string[];
}

interface IParseState {
  actionBlocks: Map<string, IBlockTemplate>;
  canRepeat: boolean;
  canWhile: boolean;
  errors: string[];
  lines: string[];
  lineIndex: number;
  whileConditions: Set<string>;
}

const normalizeCodeLine = (value: string) =>
  value
    .trim()
    .replace(/;+$/g, '')
    .replace(/\s+/g, '')
    .toLowerCase();

const getIndent = (depth: number) => '  '.repeat(depth);

const serializeBlock = (block: IBlockTemplate | IProgramBlock, depth: number): string[] => {
  const indent = getIndent(depth);

  if (block.kind === 'MOVE' || block.kind === 'CONDITIONAL') {
    return [`${indent}${block.label}`];
  }

  if (block.kind === 'REPEAT') {
    return [
      `${indent}repeat(${block.repeatCount}) {`,
      ...block.loopBody.flatMap((entry) => serializeBlock(entry, depth + 1)),
      `${indent}}`,
    ];
  }

  return [
    `${indent}while (${formatConditionToken(block.condition)}) {`,
    ...block.loopBody.flatMap((entry) => serializeBlock(entry, depth + 1)),
    `${indent}}`,
  ];
};

const parseInlineActionBlock = (value: string, parseState: IParseState, lineNumber: number) => {
  const block = parseState.actionBlocks.get(normalizeCodeLine(value));

  if (!block) {
    parseState.errors.push(`Line ${lineNumber}: "${value}" is not available in this puzzle.`);
    return null;
  }

  return block;
};

const parseStatements = (parseState: IParseState, insideBlock: boolean) => {
  const blocks: IBlockTemplate[] = [];

  while (parseState.lineIndex < parseState.lines.length) {
    const lineNumber = parseState.lineIndex + 1;
    const trimmed = parseState.lines[parseState.lineIndex].trim();
    parseState.lineIndex += 1;

    if (!trimmed) {
      continue;
    }

    if (trimmed === '}') {
      if (insideBlock) {
        return blocks;
      }

      parseState.errors.push(`Line ${lineNumber}: unexpected closing brace.`);
      continue;
    }

    const repeatOpenMatch = trimmed.match(/^repeat\((\d+)\)\s*\{$/i);

    if (repeatOpenMatch) {
      if (!parseState.canRepeat) {
        parseState.errors.push(`Line ${lineNumber}: repeat loops are not available in this puzzle.`);
        continue;
      }

      const repeatCount = Number(repeatOpenMatch[1]);

      if (!Number.isInteger(repeatCount) || repeatCount < 2 || repeatCount > 9) {
        parseState.errors.push(`Line ${lineNumber}: repeat count must be between 2 and 9.`);
        continue;
      }

      const loopBody = parseStatements(parseState, true);

      if (!loopBody.length) {
        parseState.errors.push(`Line ${lineNumber}: repeat loop bodies must contain at least one command.`);
        continue;
      }

      blocks.push(createRepeatBlockTemplate(repeatCount, loopBody));
      continue;
    }

    const whileOpenMatch = trimmed.match(/^while\s*\(\s*([^)]+?)\s*\)\s*\{$/i);

    if (whileOpenMatch) {
      if (!parseState.canWhile) {
        parseState.errors.push(`Line ${lineNumber}: while loops are not available in this puzzle.`);
        continue;
      }

      const condition = parseConditionToken(whileOpenMatch[1]);

      if (!condition || !parseState.whileConditions.has(condition)) {
        parseState.errors.push(`Line ${lineNumber}: "${whileOpenMatch[1]}" is not a valid loop condition in this puzzle.`);
        continue;
      }

      const loopBody = parseStatements(parseState, true);

      if (!loopBody.length) {
        parseState.errors.push(`Line ${lineNumber}: while loop bodies must contain at least one command.`);
        continue;
      }

      blocks.push(createWhileBlockTemplate(condition, loopBody));
      continue;
    }

    const repeatInlineMatch = trimmed.match(/^repeat\((\d+)\)\s+(.+)$/i);

    if (repeatInlineMatch) {
      if (!parseState.canRepeat) {
        parseState.errors.push(`Line ${lineNumber}: repeat loops are not available in this puzzle.`);
        continue;
      }

      const repeatCount = Number(repeatInlineMatch[1]);

      if (!Number.isInteger(repeatCount) || repeatCount < 2 || repeatCount > 9) {
        parseState.errors.push(`Line ${lineNumber}: repeat count must be between 2 and 9.`);
        continue;
      }

      const loopBodyBlock = parseInlineActionBlock(repeatInlineMatch[2].trim(), parseState, lineNumber);

      if (!loopBodyBlock) {
        continue;
      }

      blocks.push(createRepeatBlockTemplate(repeatCount, [loopBodyBlock]));
      continue;
    }

    const whileInlineMatch = trimmed.match(/^while\s*\(\s*([^)]+?)\s*\)\s+(.+)$/i);

    if (whileInlineMatch) {
      if (!parseState.canWhile) {
        parseState.errors.push(`Line ${lineNumber}: while loops are not available in this puzzle.`);
        continue;
      }

      const condition = parseConditionToken(whileInlineMatch[1]);

      if (!condition || !parseState.whileConditions.has(condition)) {
        parseState.errors.push(`Line ${lineNumber}: "${whileInlineMatch[1]}" is not a valid loop condition in this puzzle.`);
        continue;
      }

      const loopBodyBlock = parseInlineActionBlock(whileInlineMatch[2].trim(), parseState, lineNumber);

      if (!loopBodyBlock) {
        continue;
      }

      blocks.push(createWhileBlockTemplate(condition, [loopBodyBlock]));
      continue;
    }

    const block = parseState.actionBlocks.get(normalizeCodeLine(trimmed));

    if (!block) {
      parseState.errors.push(`Line ${lineNumber}: "${trimmed}" is not available in this puzzle.`);
      continue;
    }

    blocks.push(block);
  }

  if (insideBlock) {
    parseState.errors.push('Missing closing brace for loop body.');
  }

  return blocks;
};

export const serializeProgramToCode = (program: IProgramBlock[]) =>
  program.flatMap((block) => serializeBlock(block, 0)).join('\n');

export const parseProgramCode = (source: string, puzzle: IPuzzleDefinition): IProgramParseResult => {
  const actionBlocks = puzzle.availableBlocks
    .filter((block) => block.kind === 'MOVE' || block.kind === 'CONDITIONAL')
    .map((block) => [normalizeCodeLine(block.label), block] as const);
  const whileConditions = new Set(
    puzzle.availableBlocks
      .filter((block): block is IConditionalBlockTemplate => block.kind === 'CONDITIONAL')
      .map((block) => block.condition),
  );
  const parseState: IParseState = {
    actionBlocks: new Map(actionBlocks),
    canRepeat: puzzle.availableBlocks.some((block) => block.kind === 'REPEAT'),
    canWhile: puzzle.availableBlocks.some((block) => block.kind === 'WHILE'),
    errors: [],
    lines: source.split(/\r?\n/),
    lineIndex: 0,
    whileConditions,
  };

  const blocks = parseStatements(parseState, false);

  if (!blocks.length) {
    parseState.errors.push('Add at least one command before applying code mode.');
  }

  return {
    success: parseState.errors.length === 0,
    blocks,
    errors: parseState.errors,
  };
};
