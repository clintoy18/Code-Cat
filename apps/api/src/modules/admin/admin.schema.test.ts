import { describe, expect, it } from 'vitest';
import {
  adminPaginationQuerySchema,
  generateReportSchema,
  levelPaginationQuerySchema,
  reportPaginationQuerySchema,
} from './admin.schema';

describe('admin schema contracts', () => {
  it('coerces pagination query params into numbers', () => {
    expect(
      adminPaginationQuerySchema.parse({
        page: '2',
        pageSize: '12',
      }),
    ).toEqual({
      page: 2,
      pageSize: 12,
    });
  });

  it('accepts supported report filters and report generation payloads', () => {
    expect(
      reportPaginationQuerySchema.parse({
        page: '1',
        pageSize: '8',
        search: 'progress',
        reportType: 'PLAYER_PROGRESS',
      }),
    ).toEqual({
      page: 1,
      pageSize: 8,
      search: 'progress',
      reportType: 'PLAYER_PROGRESS',
    });

    expect(
      generateReportSchema.parse({
        reportType: 'CONTENT_USAGE',
        description: 'Tracks how often the official levels are being visited.',
      }),
    ).toEqual({
      reportType: 'CONTENT_USAGE',
      description: 'Tracks how often the official levels are being visited.',
    });
  });

  it('accepts searchable level list filters', () => {
    expect(
      levelPaginationQuerySchema.parse({
        page: '3',
        pageSize: '5',
        search: 'loop',
        difficulty: 'MEDIUM',
      }),
    ).toEqual({
      page: 3,
      pageSize: 5,
      search: 'loop',
      difficulty: 'MEDIUM',
    });
  });
});
