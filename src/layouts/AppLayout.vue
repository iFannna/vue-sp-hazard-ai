<template>
  <div class="app">
    <AppSidebar :groups="navigationGroups" />
    <main class="main">
      <AppHeader :title="pageMeta.title" :subtitle="pageMeta.subtitle" />
      <div class="content">
        <RouterView />
        <PageFooterNote />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterView, useRoute } from 'vue-router';

import PageFooterNote from '@/components/PageFooterNote.vue';
import AppHeader from '@/components/layout/AppHeader.vue';
import AppSidebar from '@/components/layout/AppSidebar.vue';
import { navigationGroups } from '@/config/navigation';
import type { AppRouteMeta } from '@/types/navigation';

const route = useRoute();

const pageMeta = computed<AppRouteMeta>(() => {
  const meta = route.meta as Partial<AppRouteMeta>;

  return {
    title: meta.title ?? '安全生产隐患 AI 平台',
    subtitle: meta.subtitle,
  };
});
</script>
