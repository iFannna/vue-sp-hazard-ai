import { request, type PageResult } from './http';

export interface ReviewTaskVO {
  id: number;
  taskId: number;
  taskNo: string;
  inferenceResultId?: number;
  hazardTypeName: string;
  hazardLevelName: string;
  finalHazardTypeId?: number;
  finalLevelId?: number;
  reviewStatus: string;
  reviewStatusText?: string;
  reviewComment?: string;
  mediaNo?: string;
  fileUrl?: string;
  confidence?: number;
  bboxJson?: string;
  createdAt: string;
}

export interface ReviewCreateParams {
  taskId: number;
  inferenceResultId?: number;
}

export interface ReviewDecisionParams {
  reviewStatus: string;
  finalLevelId: number;
  finalHazardTypeId?: number;
  reviewComment?: string;
  reviewer?: string;
}

export function listReviewRecords(keyword?: string, status?: string) {
  const query = new URLSearchParams();
  if (keyword) {
    query.set('keyword', keyword);
  }
  if (status) {
    query.set('status', status);
  }
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return request<ReviewTaskVO[]>(`/api/review/records${suffix}`);
}

export function listReviewRecordPage(params: { keyword?: string; status?: string; pageNum?: number; pageSize?: number }) {
  const query = new URLSearchParams();
  if (params.keyword) {
    query.set('keyword', params.keyword);
  }
  if (params.status) {
    query.set('status', params.status);
  }
  query.set('pageNum', String(params.pageNum || 1));
  query.set('pageSize', String(params.pageSize || 10));
  return request<PageResult<ReviewTaskVO>>(`/api/review/records/page?${query.toString()}`);
}

export function createReviewRecord(params: ReviewCreateParams) {
  return request<void>('/api/review/records', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export function getReviewRecordByTaskId(taskId: number) {
  return request<ReviewTaskVO | null>(`/api/review/records/task/${taskId}`);
}

export function claimReviewRecord(id: number) {
  return request<void>(`/api/review/records/${id}/claim`, {
    method: 'PATCH',
    body: JSON.stringify({}),
  });
}

export function submitReviewDecision(id: number, params: ReviewDecisionParams) {
  return request<void>(`/api/review/records/${id}/decision`, {
    method: 'PUT',
    body: JSON.stringify(params),
  });
}
