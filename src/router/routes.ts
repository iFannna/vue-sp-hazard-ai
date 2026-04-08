import type { RouteRecordRaw } from 'vue-router';

import AppLayout from '@/layouts/AppLayout.vue';
import CollectionView from '@/views/CollectionView.vue';
import DashboardView from '@/views/DashboardView.vue';
import DatasetView from '@/views/DatasetView.vue';
import DictionaryView from '@/views/DictionaryView.vue';
import LoginView from '@/views/LoginView.vue';
import RecognitionView from '@/views/RecognitionView.vue';
import ReviewView from '@/views/ReviewView.vue';
import StatsView from '@/views/StatsView.vue';

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: { name: 'dashboard' },
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: {
      title: '登录页',
    },
  },
  {
    path: '/',
    component: AppLayout,
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: DashboardView,
        meta: {
          title: '首页仪表盘',
          subtitle: '项目总览、系统状态与快捷入口',
        },
      },
      {
        path: 'recognition',
        name: 'recognition',
        component: RecognitionView,
        meta: {
          title: '图片识别',
          subtitle: '上传样本图片，调用 AI 模型返回结构化隐患结果',
        },
      },
      {
        path: 'review',
        name: 'review',
        component: ReviewView,
        meta: {
          title: '人工复核',
          subtitle: '对 AI 识别结果进行确认、驳回和修正',
        },
      },
      {
        path: 'collection',
        name: 'collection',
        component: CollectionView,
        meta: {
          title: '数据采集',
          subtitle: '批次管理、素材导入、清洗与标注前置管理',
        },
      },
      {
        path: 'dataset',
        name: 'dataset',
        component: DatasetView,
        meta: {
          title: '数据集管理',
          subtitle: '训练集 / 验证集 / 测试集版本化管理',
        },
      },
      {
        path: 'dictionary',
        name: 'dictionary',
        component: DictionaryView,
        meta: {
          title: '隐患字典',
          subtitle: '隐患类型、等级、规则配置的维护页面',
        },
      },
      {
        path: 'stats',
        name: 'stats',
        component: StatsView,
        meta: {
          title: '统计分析',
          subtitle: '识别效果、风险分布与业务运营指标',
        },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'dashboard' },
  },
];
