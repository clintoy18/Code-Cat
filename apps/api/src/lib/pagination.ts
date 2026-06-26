import type { IPaginatedResult } from '@shared/types/api';

type PaginationInput = {
  page?: number;
  pageSize?: number;
};

type PaginationOptions = {
  defaultPageSize?: number;
  maxPageSize?: number;
};

export const normalizePagination = (
  input: PaginationInput | undefined,
  options: PaginationOptions = {},
) => {
  const defaultPageSize = options.defaultPageSize ?? 20;
  const maxPageSize = options.maxPageSize ?? 100;

  const page =
    typeof input?.page === 'number' && Number.isFinite(input.page) && input.page > 0
      ? Math.floor(input.page)
      : 1;
  const rawPageSize =
    typeof input?.pageSize === 'number' &&
    Number.isFinite(input.pageSize) &&
    input.pageSize > 0
      ? Math.floor(input.pageSize)
      : defaultPageSize;
  const pageSize = Math.min(rawPageSize, maxPageSize);

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
};

export const createPaginatedResult = <T>(
  items: T[],
  totalItems: number,
  page: number,
  pageSize: number,
): IPaginatedResult<T> => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return {
    items,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};
