import { request, type PageResult } from './http';

export interface RoleVO {
  id: number;
  roleName: string;
  roleCode: string;
  status: number;
  description?: string;
}

export interface PermissionVO {
  id: number;
  permName: string;
  permCode: string;
  permType?: string;
  method?: string;
  path?: string;
}

export interface UserVO {
  id: number;
  username: string;
  phone?: string;
  status: number;
  statusText: string;
  roleIds: number[];
  roleNames: string[];
  createTime: string;
  updateTime: string;
}

export interface UserCreateParams {
  username: string;
  phone?: string;
  password: string;
  roleIds: number[];
}

export interface RoleCreateParams {
  roleName: string;
  roleCode: string;
  description?: string;
}

export function listUsers(params: { keyword?: string; pageNum?: number; pageSize?: number }) {
  const query = new URLSearchParams();
  if (params.keyword) {
    query.set('keyword', params.keyword);
  }
  query.set('pageNum', String(params.pageNum || 1));
  query.set('pageSize', String(params.pageSize || 10));
  return request<PageResult<UserVO>>(`/api/admin/users?${query.toString()}`);
}

export function createUser(params: UserCreateParams) {
  return request<UserVO>('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export function updateUserStatus(id: number, status: number) {
  return request<void>(`/api/admin/users/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function resetUserPassword(id: number, password: string) {
  return request<void>(`/api/admin/users/${id}/password`, {
    method: 'PATCH',
    body: JSON.stringify({ password }),
  });
}

export function updateUserRoles(id: number, roleIds: number[]) {
  return request<void>(`/api/admin/users/${id}/roles`, {
    method: 'PUT',
    body: JSON.stringify({ roleIds }),
  });
}

export function listRoles() {
  return request<RoleVO[]>('/api/admin/roles');
}

export function createRole(params: RoleCreateParams) {
  return request<RoleVO>('/api/admin/roles', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export function listPermissions() {
  return request<PermissionVO[]>('/api/admin/permissions');
}

export function getRolePermissions(roleId: number) {
  return request<PermissionVO[]>(`/api/admin/roles/${roleId}/permissions`);
}

export function updateRolePermissions(roleId: number, permissionIds: number[]) {
  return request<void>(`/api/admin/roles/${roleId}/permissions`, {
    method: 'PUT',
    body: JSON.stringify({ permissionIds }),
  });
}
