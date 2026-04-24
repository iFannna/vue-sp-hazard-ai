import { request, type PageResult } from './http';

export interface CollectBatchVO {
  id: number;
  batchNo: string;
  batchName: string;
  sourceId: number;
  sourceName: string;
  siteId?: number;
  siteName?: string;
  collector?: string;
  status: string;
  totalCount: number;
  validCount: number;
  createdAt: string;
}

export interface CollectBatchCreateParams {
  batchNo?: string;
  batchName?: string;
  sourceId?: number;
  siteId?: number;
  collector?: string;
  remark?: string;
}

export function listCollectBatches(keyword?: string) {
  const query = keyword ? `?keyword=${encodeURIComponent(keyword)}` : '';
  return request<CollectBatchVO[]>(`/api/collection/batches${query}`);
}

export function listCollectBatchPage(params: { keyword?: string; pageNum?: number; pageSize?: number }) {
  const query = new URLSearchParams();
  if (params.keyword) {
    query.set('keyword', params.keyword);
  }
  query.set('pageNum', String(params.pageNum || 1));
  query.set('pageSize', String(params.pageSize || 10));
  return request<PageResult<CollectBatchVO>>(`/api/collection/batches/page?${query.toString()}`);
}

export function createCollectBatch(params: CollectBatchCreateParams) {
  return request<CollectBatchVO>('/api/collection/batches', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export function updateCollectBatchStatus(id: number, status: string) {
  return request<void>(`/api/collection/batches/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
