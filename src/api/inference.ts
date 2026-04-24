import { request } from './http';
import { wsService } from '@/utils/websocket';
import { getAccessToken } from '@/utils/session';

export interface InferenceTaskCreateParams {
  mediaId: number;
  bizId?: string;
  requestSource?: string;
  promptText?: string;
  modelVersionId?: number;
  detectMode?: string;
  confidenceThreshold?: number;
  reviewPolicy?: string;
}

export interface InferenceResultVO {
  id: number;
  resultNo: number;
  hazardTypeId: number;
  hazardTypeName: string;
  hazardLevelId: number;
  hazardLevelName: string;
  score: number;
  confidence: number;
  bboxJson: string;
  advice: string;
  rawResultJson: string;
}

export interface InferenceTaskVO {
  id: number;
  taskNo: string;
  bizId: string;
  mediaId: number;
  mediaNo: string;
  sourceId?: number;
  siteId?: number;
  requestSource?: string;
  modelVersionId?: number;
  fileUrl: string;
  status: string;
  statusText: string;
  progress: number;
  promptText?: string;
  requestedAt: string;
  finishedAt?: string;
  results: InferenceResultVO[];
}

export interface WebSocketTaskMessage {
  type: 'task_complete';
  taskNo: string;
  status: string;
  taskId: number;
  progress: number;
  message: string;
  timestamp: number;
}

export function connectInferenceWebSocket(taskNo: string): Promise<void> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    return Promise.reject(new Error('登录状态已失效'));
  }
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const wsUrl = `${protocol}://${window.location.host}/ws/inference/tasks/${encodeURIComponent(taskNo)}?accessToken=${encodeURIComponent(accessToken)}`;
  return wsService.connect(wsUrl);
}

export function disconnectInferenceWebSocket(clearHandlers = true) {
  wsService.disconnect(clearHandlers);
}

export function onTaskComplete(handler: (message: WebSocketTaskMessage) => void) {
  wsService.on('task_complete', handler);
}

export function offTaskComplete(handler: (message: WebSocketTaskMessage) => void) {
  wsService.off('task_complete', handler);
}

export function createInferenceTask(params: InferenceTaskCreateParams) {
  return request<InferenceTaskVO>('/api/v1/inference/tasks', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export function getInferenceTask(taskNo: string) {
  return request<InferenceTaskVO>(`/api/v1/inference/tasks/${taskNo}`);
}

export function getInferenceResults(taskNo: string) {
  return request<InferenceResultVO[]>(`/api/v1/inference/tasks/${taskNo}/results`);
}

export function getLatestInferenceTaskByMediaId(mediaId: number) {
  return request<InferenceTaskVO | null>(`/api/inference/media/${mediaId}/latest-task`);
}

export function listInferenceTasks(limit = 10) {
  return request<InferenceTaskVO[]>(`/api/inference/tasks?limit=${limit}`);
}
