<template>
  <div class="topbar">
    <div>
      <h1>{{ title }}</h1>
      <div v-if="subtitle" class="subtitle">{{ subtitle }}</div>
    </div>
    <div class="top-actions">
      <div class="user">管理员</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  subtitle?: string;
}>();
</script>
