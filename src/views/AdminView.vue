<template>
  <div class="card admin-main-card" v-loading="isLoading">
    <div class="toolbar">
      <h3>用户与角色</h3>
      <div class="toolbar-actions">
        <el-input
          v-model.trim="keyword"
          clearable
          placeholder="搜索用户名 / 手机号"
          style="width: 240px"
          @clear="searchUsers"
          @keyup.enter="searchUsers"
        />
        <el-button @click="searchUsers">搜索</el-button>
        <el-button @click="openRoleManagerDialog">角色管理</el-button>
        <el-button type="primary" @click="openCreateDialog">新建用户</el-button>
      </div>
    </div>

    <el-table :data="users">
      <el-table-column prop="username" label="用户名" min-width="130" />
      <el-table-column prop="phone" label="手机号" min-width="130" />
      <el-table-column label="角色" min-width="220">
        <template #default="{ row: user }">
          <div class="tag-list">
            <el-tag v-for="roleName in user.roleNames" :key="roleName" type="primary">{{ roleName }}</el-tag>
            <span v-if="user.roleNames.length === 0">-</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row: user }">
          <el-tag :type="user.status === 1 ? 'success' : 'info'">{{ user.statusText }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" min-width="170" />
      <el-table-column label="操作" width="320" fixed="right">
        <template #default="{ row: user }">
          <div class="table-actions">
            <el-button size="small" @click="openRoleDialog(user)">分配角色</el-button>
            <el-button size="small" @click="openPasswordDialog(user)">重置密码</el-button>
            <el-button size="small" @click="openPermissionDialog(user)">查看权限</el-button>
            <el-button size="small" :type="user.status === 1 ? 'warning' : 'success'" @click="toggleUserStatus(user)">
              {{ user.status === 1 ? '停用' : '启用' }}
            </el-button>
          </div>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="暂无用户数据" />
      </template>
    </el-table>

    <el-pagination
      v-model:current-page="pageNum"
      v-model:page-size="pageSize"
      layout="total, sizes, prev, pager, next"
      :page-sizes="[10, 20, 50]"
      :total="total"
      style="margin-top: 14px; justify-content: flex-end"
      @current-change="loadUsers"
      @size-change="handleSizeChange"
    />
  </div>

  <el-dialog v-model="createDialogVisible" title="新建用户" width="460px">
    <div class="form-grid" style="grid-template-columns: 1fr">
      <el-input v-model.trim="createForm.username" placeholder="用户名" />
      <el-input v-model.trim="createForm.phone" placeholder="手机号（可选）" />
      <el-input v-model="createForm.password" type="password" show-password placeholder="初始密码" />
      <el-select v-model="createForm.roleIds" multiple placeholder="角色" style="width: 100%">
        <el-option v-for="role in roles" :key="role.id" :label="role.roleName" :value="role.id" />
      </el-select>
    </div>
    <template #footer>
      <el-button @click="createDialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="isSaving" @click="submitCreateUser">保存</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="roleDialogVisible" title="分配角色" width="460px">
    <el-select v-model="editingRoleIds" multiple placeholder="角色" style="width: 100%">
      <el-option v-for="role in roles" :key="role.id" :label="role.roleName" :value="role.id" />
    </el-select>
    <template #footer>
      <el-button @click="roleDialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="isSaving" @click="submitUserRoles">保存</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="passwordDialogVisible" title="重置密码" width="420px">
    <el-input v-model="passwordForm.password" type="password" show-password placeholder="请输入新密码，至少 6 位" />
    <template #footer>
      <el-button @click="passwordDialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="isSaving" @click="submitResetPassword">确认</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="permissionDialogVisible" title="角色权限" width="720px">
    <div v-if="permissionGroups.length === 0">
      <el-empty description="当前用户暂无角色权限" />
    </div>
    <div v-else class="permission-groups">
      <div v-for="group in permissionGroups" :key="group.roleId" class="permission-group">
        <div class="permission-group__header">
          <el-tag type="primary">{{ group.roleName }}</el-tag>
          <span class="permission-group__desc">{{ group.roleCode }}</span>
        </div>
        <div class="tag-list">
          <el-tag
            v-for="permission in group.permissions"
            :key="`${group.roleId}-${permission.id}`"
            :type="permission.permType === 'MENU' ? 'success' : 'info'"
          >
            {{ permission.permName }}
          </el-tag>
          <span v-if="group.permissions.length === 0">暂无权限</span>
        </div>
      </div>
    </div>
  </el-dialog>

  <el-dialog v-model="roleManagerDialogVisible" title="角色管理" width="900px">
    <div class="role-manager">
      <div class="role-manager__header">
        <span>角色列表</span>
        <el-button type="primary" size="small" @click="openCreateRoleDialog">新建角色</el-button>
      </div>
      <el-table :data="roles" height="360">
        <el-table-column prop="roleName" label="角色名称" min-width="160" />
        <el-table-column prop="roleCode" label="角色编码" min-width="180" />
        <el-table-column prop="description" label="说明" min-width="220" show-overflow-tooltip />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row: role }">
            <div class="table-actions">
              <el-button size="small" @click="openRolePermissionDialog(role)">配置权限</el-button>
              <el-button size="small" @click="previewSingleRolePermissions(role)">查看权限</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </el-dialog>

  <el-dialog v-model="createRoleDialogVisible" title="新建角色" width="460px">
    <div class="form-grid" style="grid-template-columns: 1fr">
      <el-input v-model.trim="roleForm.roleName" placeholder="角色名称" />
      <el-input v-model.trim="roleForm.roleCode" placeholder="角色编码，例如 ROLE_CUSTOM" />
      <el-input v-model.trim="roleForm.description" type="textarea" :rows="3" placeholder="角色说明（可选）" />
    </div>
    <template #footer>
      <el-button @click="createRoleDialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="isSaving" @click="submitCreateRole">保存</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="rolePermissionDialogVisible" :title="rolePermissionDialogTitle" width="900px">
    <div class="permission-editor" v-loading="isPermissionLoading">
      <el-checkbox-group v-model="editingPermissionIds" class="permission-editor__group">
        <div v-for="group in permissionOptions" :key="group.key" class="permission-editor__section">
          <div class="permission-editor__title">{{ group.label }}</div>
          <div class="tag-list">
            <el-checkbox v-for="permission in group.permissions" :key="permission.id" :label="permission.id" border>
              {{ permission.permName }}
            </el-checkbox>
          </div>
        </div>
      </el-checkbox-group>
    </div>
    <template #footer>
      <el-button @click="rolePermissionDialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="isSaving" @click="submitRolePermissions">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

import {
  createRole,
  createUser,
  getRolePermissions,
  listPermissions,
  listRoles,
  listUsers,
  resetUserPassword,
  updateRolePermissions,
  updateUserRoles,
  updateUserStatus,
  type PermissionVO,
  type RoleVO,
  type UserVO,
} from '@/api/admin';

interface PermissionGroup {
  roleId: number;
  roleName: string;
  roleCode: string;
  permissions: PermissionVO[];
}

interface PermissionOptionGroup {
  key: string;
  label: string;
  permissions: PermissionVO[];
}

const isLoading = ref(false);
const isSaving = ref(false);
const isPermissionLoading = ref(false);
const keyword = ref('');
const pageNum = ref(1);
const pageSize = ref(10);
const total = ref(0);
const users = ref<UserVO[]>([]);
const roles = ref<RoleVO[]>([]);
const allPermissions = ref<PermissionVO[]>([]);
const createDialogVisible = ref(false);
const roleDialogVisible = ref(false);
const passwordDialogVisible = ref(false);
const permissionDialogVisible = ref(false);
const roleManagerDialogVisible = ref(false);
const createRoleDialogVisible = ref(false);
const rolePermissionDialogVisible = ref(false);
const editingUserId = ref<number>();
const editingRoleIds = ref<number[]>([]);
const editingRoleId = ref<number>();
const editingPermissionIds = ref<number[]>([]);
const permissionGroups = ref<PermissionGroup[]>([]);
const createForm = reactive({
  username: '',
  phone: '',
  password: '',
  roleIds: [] as number[],
});
const passwordForm = reactive({
  password: '',
});
const roleForm = reactive({
  roleName: '',
  roleCode: '',
  description: '',
});

const permissionOptions = computed<PermissionOptionGroup[]>(() => {
  const grouped = new Map<string, PermissionVO[]>();
  allPermissions.value.forEach((permission) => {
    const key = permission.permType || 'OTHER';
    const list = grouped.get(key) || [];
    list.push(permission);
    grouped.set(key, list);
  });
  const labels: Record<string, string> = {
    MENU: '菜单权限',
    API: '接口权限',
    BUTTON: '按钮权限',
    OTHER: '其他权限',
  };
  return Array.from(grouped.entries()).map(([key, permissions]) => ({
    key,
    label: labels[key] || key,
    permissions,
  }));
});

const rolePermissionDialogTitle = computed(() => {
  const role = roles.value.find((item) => item.id === editingRoleId.value);
  return role ? `配置权限 - ${role.roleName}` : '配置权限';
});

onMounted(async () => {
  await Promise.all([loadRoles(), loadPermissions(), loadUsers()]);
});

async function loadRoles() {
  roles.value = await listRoles();
}

async function loadPermissions() {
  allPermissions.value = await listPermissions();
}

async function loadUsers() {
  isLoading.value = true;
  try {
    const page = await listUsers({
      keyword: keyword.value || undefined,
      pageNum: pageNum.value,
      pageSize: pageSize.value,
    });
    users.value = page.rows.map((item) => ({
      ...item,
      roleIds: item.roleIds || [],
      roleNames: item.roleNames || [],
      createTime: new Date(item.createTime).toLocaleString(),
    }));
    total.value = page.total;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '用户列表加载失败');
  } finally {
    isLoading.value = false;
  }
}

async function searchUsers() {
  pageNum.value = 1;
  await loadUsers();
}

async function handleSizeChange() {
  pageNum.value = 1;
  await loadUsers();
}

function openCreateDialog() {
  createForm.username = '';
  createForm.phone = '';
  createForm.password = '';
  createForm.roleIds = [];
  createDialogVisible.value = true;
}

async function submitCreateUser() {
  if (!createForm.username || !createForm.password) {
    ElMessage.warning('请填写用户名和初始密码');
    return;
  }
  if (createForm.password.length < 6) {
    ElMessage.warning('初始密码长度不能少于 6 位');
    return;
  }
  isSaving.value = true;
  try {
    await createUser({
      username: createForm.username,
      phone: createForm.phone || undefined,
      password: createForm.password,
      roleIds: createForm.roleIds,
    });
    createDialogVisible.value = false;
    await loadUsers();
    ElMessage.success('用户已创建');
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '用户创建失败');
  } finally {
    isSaving.value = false;
  }
}

function openRoleDialog(user: UserVO) {
  editingUserId.value = user.id;
  editingRoleIds.value = [...user.roleIds];
  roleDialogVisible.value = true;
}

async function submitUserRoles() {
  if (!editingUserId.value) {
    return;
  }
  isSaving.value = true;
  try {
    await updateUserRoles(editingUserId.value, editingRoleIds.value);
    roleDialogVisible.value = false;
    await loadUsers();
    ElMessage.success('角色已更新');
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '角色更新失败');
  } finally {
    isSaving.value = false;
  }
}

function openPasswordDialog(user: UserVO) {
  editingUserId.value = user.id;
  passwordForm.password = '';
  passwordDialogVisible.value = true;
}

async function submitResetPassword() {
  if (!editingUserId.value) {
    return;
  }
  if (!passwordForm.password) {
    ElMessage.warning('请输入新密码');
    return;
  }
  if (passwordForm.password.length < 6) {
    ElMessage.warning('新密码长度不能少于 6 位');
    return;
  }
  isSaving.value = true;
  try {
    await resetUserPassword(editingUserId.value, passwordForm.password);
    passwordDialogVisible.value = false;
    ElMessage.success('密码已重置');
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '密码重置失败');
  } finally {
    isSaving.value = false;
  }
}

async function openPermissionDialog(user: UserVO) {
  permissionGroups.value = [];
  if (user.roleIds.length === 0) {
    permissionDialogVisible.value = true;
    return;
  }
  isLoading.value = true;
  try {
    permissionGroups.value = await buildPermissionGroups(user.roleIds, user.roleNames);
    permissionDialogVisible.value = true;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '角色权限加载失败');
  } finally {
    isLoading.value = false;
  }
}

function openRoleManagerDialog() {
  roleManagerDialogVisible.value = true;
}

function openCreateRoleDialog() {
  roleForm.roleName = '';
  roleForm.roleCode = '';
  roleForm.description = '';
  createRoleDialogVisible.value = true;
}

async function submitCreateRole() {
  if (!roleForm.roleName || !roleForm.roleCode) {
    ElMessage.warning('请填写角色名称和角色编码');
    return;
  }
  isSaving.value = true;
  try {
    await createRole({
      roleName: roleForm.roleName,
      roleCode: roleForm.roleCode,
      description: roleForm.description || undefined,
    });
    createRoleDialogVisible.value = false;
    await loadRoles();
    ElMessage.success('角色已创建');
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '角色创建失败');
  } finally {
    isSaving.value = false;
  }
}

async function openRolePermissionDialog(role: RoleVO) {
  editingRoleId.value = role.id;
  isPermissionLoading.value = true;
  try {
    const permissions = await getRolePermissions(role.id);
    editingPermissionIds.value = permissions.map((item) => item.id);
    rolePermissionDialogVisible.value = true;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '角色权限加载失败');
  } finally {
    isPermissionLoading.value = false;
  }
}

async function submitRolePermissions() {
  if (!editingRoleId.value) {
    return;
  }
  isSaving.value = true;
  try {
    await updateRolePermissions(editingRoleId.value, editingPermissionIds.value);
    rolePermissionDialogVisible.value = false;
    ElMessage.success('角色权限已更新');
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '角色权限更新失败');
  } finally {
    isSaving.value = false;
  }
}

async function previewSingleRolePermissions(role: RoleVO) {
  isLoading.value = true;
  try {
    permissionGroups.value = await buildPermissionGroups([role.id], [role.roleName]);
    permissionDialogVisible.value = true;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '角色权限加载失败');
  } finally {
    isLoading.value = false;
  }
}

async function buildPermissionGroups(roleIds: number[], roleNames: string[]) {
  const groups = await Promise.all(
    roleIds.map(async (roleId, index) => {
      const role = roles.value.find((item) => item.id === roleId);
      const permissions = await getRolePermissions(roleId);
      return {
        roleId,
        roleName: role?.roleName || roleNames[index] || `角色 ${roleId}`,
        roleCode: role?.roleCode || '',
        permissions,
      };
    }),
  );
  return groups;
}

async function toggleUserStatus(user: UserVO) {
  const nextStatus = user.status === 1 ? 0 : 1;
  try {
    await ElMessageBox.confirm(`确认${nextStatus === 1 ? '启用' : '停用'}用户 ${user.username} 吗？`, '状态确认', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    });
  } catch {
    return;
  }
  try {
    await updateUserStatus(user.id, nextStatus);
    await loadUsers();
    ElMessage.success('用户状态已更新');
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '用户状态更新失败');
  }
}
</script>

<style scoped>
.admin-main-card {
  min-height: calc(100vh - 120px);
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.role-manager {
  display: grid;
  gap: 12px;
}

.role-manager__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.permission-groups {
  display: grid;
  gap: 16px;
}

.permission-group {
  display: grid;
  gap: 10px;
}

.permission-group__header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.permission-group__desc {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.permission-editor {
  max-height: 520px;
  overflow: auto;
}

.permission-editor__group {
  display: grid;
  gap: 18px;
}

.permission-editor__section {
  display: grid;
  gap: 10px;
}

.permission-editor__title {
  font-weight: 600;
  color: var(--el-text-color-primary);
}
</style>
