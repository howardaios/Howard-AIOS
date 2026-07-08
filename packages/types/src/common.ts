export type Maybe<T> = T | null | undefined;

export type Nullable<T> = T | null;

export type ID = string;

export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  code: number;
  message: string;
  data: T;
}
