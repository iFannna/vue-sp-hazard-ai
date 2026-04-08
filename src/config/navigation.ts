import type { NavGroup } from '@/types/navigation';

export const navigationGroups: NavGroup[] = [
  {
    title: '门户',
    items: [
      { label: '首页仪表盘', name: 'dashboard', path: '/dashboard' },
      { label: '登录页', name: 'login', path: '/login' },
    ],
  },
  {
    title: '业务中心',
    items: [
      { label: '图片识别', name: 'recognition', path: '/recognition' },
      { label: '人工复核', name: 'review', path: '/review' },
      { label: '数据采集', name: 'collection', path: '/collection' },
      { label: '数据集管理', name: 'dataset', path: '/dataset' },
    ],
  },
  {
    title: '系统管理',
    items: [
      { label: '隐患字典', name: 'dictionary', path: '/dictionary' },
      { label: '统计分析', name: 'stats', path: '/stats' },
    ],
  },
];
