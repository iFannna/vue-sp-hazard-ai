import { request, type PageResult } from './http';

export interface HazardTypeVO {
  id: number;
  typeCode: string;
  typeName: string;
  typeCategory: string;
  defaultLevelId: number;
  defaultLevelName: string;
  description?: string;
  status: string;
}

export interface HazardTypeSaveParams {
  typeCode: string;
  typeName: string;
  typeCategory: string;
  defaultLevelId: number;
  description?: string;
}

export function listHazardTypes(keyword?: string) {
  const query = keyword ? `?keyword=${encodeURIComponent(keyword)}` : '';
  return request<HazardTypeVO[]>(`/api/dict/hazard-types${query}`);
}

export function listHazardTypePage(params: { keyword?: string; pageNum?: number; pageSize?: number }) {
  const query = new URLSearchParams();
  if (params.keyword) {
    query.set('keyword', params.keyword);
  }
  query.set('pageNum', String(params.pageNum || 1));
  query.set('pageSize', String(params.pageSize || 10));
  return request<PageResult<HazardTypeVO>>(`/api/dict/hazard-types/page?${query.toString()}`);
}

export function createHazardType(params: HazardTypeSaveParams) {
  return request<void>('/api/dict/hazard-types', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export function updateHazardType(id: number, params: HazardTypeSaveParams) {
  return request<void>(`/api/dict/hazard-types/${id}`, {
    method: 'PUT',
    body: JSON.stringify(params),
  });
}

export function deleteHazardType(id: number) {
  return request<void>(`/api/dict/hazard-types/${id}`, {
    method: 'DELETE',
  });
}
