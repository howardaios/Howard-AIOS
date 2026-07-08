import type { ApiResponse, Paginated } from './common';

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface HealthResponse {
  status: HealthStatus;
  service: string;
  version: string;
  uptime: number;
}

export interface ListQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export type ListResponse<T> = ApiResponse<Paginated<T>>;
