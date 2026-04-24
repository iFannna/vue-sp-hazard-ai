import { clearSession, getAccessToken, getRefreshToken, setSession, type UserSession } from '@/utils/session';

export interface ApiResult<T> {
  code: number;
  msg: string | null;
  data: T;
}

export interface PageResult<T> {
  total: number;
  rows: T[];
}

export async function request<T>(url: string, init?: RequestInit): Promise<T> {
  return doRequest<T>(url, init, true);
}

async function doRequest<T>(url: string, init?: RequestInit, canRefresh = true): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: buildHeaders(init),
  });

  if (!response.ok) {
    if (canRefresh && response.status === 401 && (await refreshAccessToken())) {
      return doRequest<T>(url, init, false);
    }
    throw new Error(`请求失败：${response.status}`);
  }

  const result = (await response.json()) as ApiResult<T>;
  if (result.code !== 1) {
    if (canRefresh && result.code === 401 && (await refreshAccessToken())) {
      return doRequest<T>(url, init, false);
    }
    throw new Error(result.msg || '请求失败');
  }

  return result.data;
}

function buildHeaders(init?: RequestInit) {
  const accessToken = getAccessToken();
  const headers = new Headers(init?.headers);
  if (!(init?.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return headers;
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearSessionAndRedirect();
    return false;
  }

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) {
      clearSessionAndRedirect();
      return false;
    }
    const result = (await response.json()) as ApiResult<UserSession>;
    if (result.code !== 1) {
      clearSessionAndRedirect();
      return false;
    }
    setSession(result.data);
    return true;
  } catch {
    clearSessionAndRedirect();
    return false;
  }
}

function clearSessionAndRedirect() {
  clearSession();
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}
