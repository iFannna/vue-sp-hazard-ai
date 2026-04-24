<template>
  <div class="topbar">
    <div>
      <h1>{{ title }}</h1>
      <div v-if="subtitle" class="subtitle">{{ subtitle }}</div>
    </div>
    <div class="top-actions">
      <div class="user">{{ currentUser || '未登录' }}</div>
      <el-button style="margin-right: 0" @click="handleLogout">退出</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { logout } from '@/api/auth';
import { clearCurrentUser, getCurrentUser } from '@/utils/session';

defineProps<{
  title: string;
  subtitle?: string;
}>();

const router = useRouter();
const currentUser = computed(() => getCurrentUser());

async function handleLogout() {
  try {
    await logout();
  } catch {
    // 前端退出以本地清理为准，后端失败不阻断用户退出。
  }
  clearCurrentUser();
  void router.push('/login');
}
</script>
