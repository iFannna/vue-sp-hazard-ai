import { createRouter, createWebHistory } from 'vue-router';

import { getDefaultRouteName, hasPermission, isLoggedIn } from '@/utils/session';
import { routes } from './routes';

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

router.beforeEach((to) => {
  if (to.name !== 'login' && !isLoggedIn()) {
    return { name: 'login' };
  }
  if (to.name === 'login' && isLoggedIn()) {
    return { name: getDefaultRouteName() };
  }

  const permission = typeof to.meta.permission === 'string' ? to.meta.permission : undefined;
  if (to.name !== 'login' && permission && !hasPermission(permission)) {
    const defaultRouteName = getDefaultRouteName();
    if (defaultRouteName !== 'login' && to.name !== defaultRouteName) {
      return { name: defaultRouteName };
    }
    return false;
  }
  return true;
});

router.afterEach((to) => {
  const title = typeof to.meta.title === 'string' ? to.meta.title : '安全生产隐患 AI 平台';
  document.title = `${title} - 安全生产隐患 AI 平台`;
});

export default router;
