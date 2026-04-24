import { request } from './http';

export interface HealthVO {
  status: string;
  time: string;
}

export function getHealth() {
  return request<HealthVO>('/api/health');
}
