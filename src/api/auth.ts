import type { UserSession } from '@/utils/session';
import { request } from './http';

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginVO extends UserSession {}

export interface LoginOverviewVO {
  totalSamples: number;
  todayTasks: number;
  hazardTypes: number;
}

export function login(params: LoginParams) {
  return request<LoginVO>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export function getCurrentUserInfo() {
  return request<LoginVO>('/api/auth/me');
}

export function getLoginOverview() {
  return request<LoginOverviewVO>('/api/auth/login-overview');
}

export function logout() {
  return request<void>('/api/auth/logout', {
    method: 'POST',
  });
}
