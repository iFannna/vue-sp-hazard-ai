<template>
  <aside class="sidebar">
    <div class="logo">
      安全生产隐患 AI 平台
      <small>隐患识别与复核工作台</small>
    </div>
    <div v-for="group in groups" :key="group.title">
      <div class="nav-title">{{ group.title }}</div>
      <RouterLink
        v-for="item in group.items"
        :key="item.name"
        :to="item.path"
        class="nav-item"
        :class="{ active: route.name === item.name }"
      >
        {{ item.label }}
      </RouterLink>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router';

import type { NavGroup } from '@/types/navigation';

defineProps<{
  groups: NavGroup[];
}>();

const route = useRoute();
</script>
