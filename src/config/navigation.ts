import type { NavGroup } from '@/types/navigation';

export const navigationGroups: NavGroup[] = [
  {
    title: '门户',
    items: [
      { label: '首页仪表盘', name: 'dashboard', path: '/dashboard', permission: 'menu:dashboard' },
    ],
  },
  {
    title: '业务中心',
    items: [
      { label: '图片识别', name: 'recognition', path: '/recognition', permission: 'menu:recognition' },
      { label: '人工复核', name: 'review', path: '/review', permission: 'menu:review' },
      { label: '数据采集', name: 'collection', path: '/collection', permission: 'menu:collection' },
      { label: '数据集管理', name: 'dataset', path: '/dataset', permission: 'menu:dataset' },
    ],
  },
  {
    title: '系统管理',
    items: [
      { label: '隐患字典', name: 'dictionary', path: '/dictionary', permission: 'menu:dictionary' },
      { label: '权限管理', name: 'admin', path: '/admin', permission: 'menu:rbac' },
      { label: '统计分析', name: 'stats', path: '/stats', permission: 'menu:stats' },
    ],
  },
];
