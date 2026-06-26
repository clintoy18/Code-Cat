export interface IPaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface IPaginatedResult<T> {
  items: T[];
  pagination: IPaginationMeta;
}

export interface IPaginationQuery {
  page?: number;
  pageSize?: number;
}
