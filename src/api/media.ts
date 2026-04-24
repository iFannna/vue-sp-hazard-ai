import { request, type PageResult } from './http';

export interface MediaUploadParams {
  file: File;
  batchId?: number;
  sourceId?: number;
  orgUnitId?: number;
  siteId?: number;
  deviceCode?: string;
}

export interface MediaUploadVO {
  id: number;
  mediaNo: string;
  sourceId?: number;
  siteId?: number;
  deviceCode?: string;
  fileName: string;
  fileUrl: string;
  thumbUrl: string | null;
  fileType: string;
  fileSuffix: string;
  fileSize: number;
  width: number;
  height: number;
  qualityStatus: string;
  cleanStatus: string;
  createdAt?: string;
}

export function uploadMedia(params: MediaUploadParams) {
  const formData = new FormData();
  formData.append('file', params.file);
  appendOptional(formData, 'batchId', params.batchId);
  appendOptional(formData, 'sourceId', params.sourceId);
  appendOptional(formData, 'orgUnitId', params.orgUnitId);
  appendOptional(formData, 'siteId', params.siteId);
  appendOptional(formData, 'deviceCode', params.deviceCode);

  return request<MediaUploadVO>('/api/media/upload', {
    method: 'POST',
    body: formData,
  });
}

export function listMedia(keyword?: string, limit = 50) {
  const query = new URLSearchParams();
  if (keyword) {
    query.set('keyword', keyword);
  }
  query.set('limit', String(limit));
  return request<MediaUploadVO[]>(`/api/media?${query.toString()}`);
}

export function listMediaPage(params: { keyword?: string; pageNum?: number; pageSize?: number }) {
  const query = new URLSearchParams();
  if (params.keyword) {
    query.set('keyword', params.keyword);
  }
  query.set('pageNum', String(params.pageNum || 1));
  query.set('pageSize', String(params.pageSize || 10));
  return request<PageResult<MediaUploadVO>>(`/api/media/page?${query.toString()}`);
}

export function deleteMedia(id: number) {
  return request<void>(`/api/media/${id}`, {
    method: 'DELETE',
  });
}

function appendOptional(formData: FormData, key: string, value: string | number | undefined) {
  if (value !== undefined && value !== '') {
    formData.append(key, String(value));
  }
}
