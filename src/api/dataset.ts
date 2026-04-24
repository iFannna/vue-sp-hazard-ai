import { request, type PageResult } from './http';

export interface DatasetVersionVO {
  id: number;
  versionCode: string;
  versionName: string;
  sampleCount: number;
  trainCount: number;
  valCount: number;
  testCount: number;
  frozenFlag: number;
  description?: string;
  statusText?: string;
  currentVersion?: boolean;
  createdAt: string;
}

export interface DatasetItemVO {
  id: number;
  mediaId: number;
  mediaNo: string;
  fileName: string;
  fileUrl: string;
  itemStatus: string;
  createdAt: string;
}

export function listDatasetVersions() {
  return request<DatasetVersionVO[]>('/api/datasets/versions');
}

export function createDatasetVersion() {
  return request<void>('/api/datasets/versions', {
    method: 'POST',
  });
}

export function updateDatasetVersionStatus(id: number, status: string) {
  return request<void>(`/api/datasets/versions/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function listDatasetItems(keyword?: string) {
  const query = keyword ? `?keyword=${encodeURIComponent(keyword)}` : '';
  return request<DatasetItemVO[]>(`/api/datasets/items${query}`);
}

export function listDatasetItemPage(params: { keyword?: string; pageNum?: number; pageSize?: number }) {
  const query = new URLSearchParams();
  if (params.keyword) {
    query.set('keyword', params.keyword);
  }
  query.set('pageNum', String(params.pageNum || 1));
  query.set('pageSize', String(params.pageSize || 10));
  return request<PageResult<DatasetItemVO>>(`/api/datasets/items/page?${query.toString()}`);
}

export function addDatasetItem(params: { mediaId: number }) {
  return request<void>('/api/datasets/items', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export function removeDatasetItemApi(id: number) {
  return request<void>(`/api/datasets/items/${id}`, {
    method: 'DELETE',
  });
}
