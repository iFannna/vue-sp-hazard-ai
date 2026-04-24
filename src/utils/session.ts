const USER_KEY = 'sp_hazard_user';
const ACCESS_TOKEN_KEY = 'sp_hazard_access_token';
const REFRESH_TOKEN_KEY = 'sp_hazard_refresh_token';

export interface UserSession {
  userId?: number;
  username: string;
  displayName: string;
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
  refreshExpiresIn?: number;
  roleCodes?: string[];
  permissionCodes?: string[];
}

export const routePermissions = [
  { name: 'dashboard', path: '/dashboard', permission: 'menu:dashboard' },
  { name: 'recognition', path: '/recognition', permission: 'menu:recognition' },
  { name: 'review', path: '/review', permission: 'menu:review' },
  { name: 'collection', path: '/collection', permission: 'menu:collection' },
  { name: 'dataset', path: '/dataset', permission: 'menu:dataset' },
  { name: 'dictionary', path: '/dictionary', permission: 'menu:dictionary' },
  { name: 'admin', path: '/admin', permission: 'menu:rbac' },
  { name: 'stats', path: '/stats', permission: 'menu:stats' },
];

export function getSession(): UserSession | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as UserSession;
  } catch {
    return null;
  }
}

export function setSession(session: UserSession) {
  localStorage.setItem(USER_KEY, JSON.stringify(session));
  if (session.accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  }
  if (session.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  }
}

export function getCurrentUser() {
  const session = getSession();
  return session?.displayName || session?.username || '';
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || getSession()?.accessToken || '';
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || getSession()?.refreshToken || '';
}

export function clearCurrentUser() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export const clearSession = clearCurrentUser;

export function isLoggedIn() {
  return Boolean(getRefreshToken());
}

export function hasPermission(permission?: string) {
  if (!permission) {
    return true;
  }
  const session = getSession();
  return Boolean(
    session?.roleCodes?.includes('ROLE_SUPER_ADMIN') ||
      session?.permissionCodes?.includes(permission),
  );
}

export function getDefaultRouteName() {
  return routePermissions.find((item) => hasPermission(item.permission))?.name || 'login';
}

export function getDefaultRoutePath() {
  return routePermissions.find((item) => hasPermission(item.permission))?.path || '/login';
}
