import { createRouter, createWebHistory } from 'vue-router';

import { routes } from './routes';

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

router.afterEach((to) => {
  const title = typeof to.meta.title === 'string' ? to.meta.title : '安全生产隐患 AI 平台';
  document.title = `${title} - 安全生产隐患 AI 平台`;
});

export default router;
