import { describe, expect, it } from 'vitest';
import { calculateRoomScore, toLetterGrade } from './teacher.utils';

describe('teacher score utilities', () => {
  it('combines completion, efficiency, code quality, and attempt penalty into a 100-point score', () => {
    expect(
      calculateRoomScore({
        didComplete: true,
        movesUsed: 6,
        parMoves: 6,
        blocksUsed: 6,
        codeBudget: 6,
        failuresBeforeSuccess: 0,
      }),
    ).toEqual({
      score: 100,
      letterGrade: 'A',
    });
  });

  it('drops the score when the student needs extra moves, extra blocks, and retries', () => {
    expect(
      calculateRoomScore({
        didComplete: true,
        movesUsed: 10,
        parMoves: 5,
        blocksUsed: 9,
        codeBudget: 6,
        failuresBeforeSuccess: 3,
      }),
    ).toEqual({
      score: 68,
      letterGrade: 'D',
    });
  });

  it('returns a failing grade for incomplete attempts', () => {
    expect(
      calculateRoomScore({
        didComplete: false,
        movesUsed: 0,
        parMoves: 5,
        blocksUsed: 0,
        codeBudget: 5,
        failuresBeforeSuccess: 1,
      }),
    ).toEqual({
      score: 0,
      letterGrade: 'F',
    });
  });

  it('maps aggregate scores to letter grades', () => {
    expect(toLetterGrade(92)).toBe('A');
    expect(toLetterGrade(84)).toBe('B');
    expect(toLetterGrade(75)).toBe('C');
    expect(toLetterGrade(63)).toBe('D');
    expect(toLetterGrade(58)).toBe('F');
    expect(toLetterGrade(null)).toBeNull();
  });
});
