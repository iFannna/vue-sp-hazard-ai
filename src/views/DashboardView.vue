<template>
  <div class="grid-4">
    <div v-for="metric in metrics" :key="metric.label" class="card">
      <div class="metric-label">{{ metric.label }}</div>
      <div class="metric-value">{{ metric.value }}</div>
      <div class="metric-trend">{{ metric.trend }}</div>
    </div>
  </div>

  <div class="grid-3">
    <div class="card">
      <div class="toolbar">
        <h3>识别任务趋势</h3>
        <RouterLink v-slot="{ navigate }" to="/stats" custom>
          <el-button @click="navigate">查看分析</el-button>
        </RouterLink>
      </div>
      <div style="color: #6b7280">近 7 日任务量与复核量趋势</div>
      <div class="chart-bars">
        <div v-for="item in chartData" :key="item.label" class="col">
          <div class="v" :style="{ height: item.height, background: item.color }"></div>
          <div style="color: #6b7280">{{ item.label }}</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h3>隐患类型分布</h3>
      <div class="info-list">
        <div v-for="item in hazardDistribution" :key="item.label">
          <div class="info-row">
            <span>{{ item.label }}</span>
            <strong>{{ item.percent }}</strong>
          </div>
          <div class="progress">
            <div class="bar" :style="{ width: item.width, background: item.color }"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <h3>系统运行状态</h3>
      <div class="info-list">
        <div v-for="item in systemStatus" :key="item.label" class="info-row">
          <span>{{ item.label }}</span>
          <el-tag :type="item.tagType">{{ item.value }}</el-tag>
        </div>
      </div>
    </div>
  </div>

  <div class="grid-2">
    <div class="card">
      <div class="toolbar">
        <h3>快捷入口</h3>
        <div>
          <RouterLink v-slot="{ navigate }" to="/recognition" custom>
            <el-button type="primary" @click="navigate">进入识别</el-button>
          </RouterLink>
          <RouterLink v-slot="{ navigate }" to="/collection" custom>
            <el-button @click="navigate">采集管理</el-button>
          </RouterLink>
        </div>
      </div>
      <div class="kpi-row">
        <RouterLink v-for="entry in quickEntries" :key="entry.title" :to="entry.path" class="card quick-card">
          <strong>{{ entry.title }}</strong>
          <div style="color: #6b7280; margin-top: 8px">{{ entry.description }}</div>
        </RouterLink>
      </div>
    </div>

    <div class="card">
      <h3>最新任务动态</h3>
      <el-table :data="latestTasks">
        <el-table-column prop="code" label="任务编号" min-width="150" />
        <el-table-column prop="type" label="类型" min-width="120" />
        <el-table-column label="状态" width="110">
          <template #default="{ row: task }">
            <el-tag :type="task.tagType">{{ task.status }}</el-tag>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无任务动态" />
        </template>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { ElMessage } from 'element-plus';

import { getDashboardSummary, type DashboardSummaryVO } from '@/api/dashboard';

const summary = ref<DashboardSummaryVO>(createEmptySummary());

const metrics = computed(() => summary.value.metrics);

const chartData = computed(() => {
  const groups = summary.value.taskStatus;
  const maxCount = Math.max(...groups.map((item) => item.count), 1);
  return groups.map((item) => ({
    label: item.label,
    height: `${Math.max(Math.round((item.count / maxCount) * 180), 20)}px`,
    color: item.color,
  }));
});

const hazardDistribution = computed(() => summary.value.hazardDistribution);
const systemStatus = computed(() => summary.value.systemStatus);
const latestTasks = computed(() => summary.value.latestTasks);

onMounted(async () => {
  try {
    summary.value = await getDashboardSummary();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '首页数据加载失败');
  }
});

const quickEntries = [
  { title: '图片识别', description: '上传图片并查看结构化识别结果', path: '/recognition' },
  { title: '人工复核', description: '确认、驳回、修正 AI 结果', path: '/review' },
  { title: '数据集管理', description: '查看训练 / 验证 / 测试集分布', path: '/dataset' },
];

function createEmptySummary(): DashboardSummaryVO {
  return {
    metrics: [
      { label: '采集批次', value: '0', trend: '样本 0 条' },
      { label: '今日识别任务', value: '0', trend: '累计任务 0 条' },
      { label: '待人工复核', value: '0', trend: '总复核 0 条' },
      { label: '数据集样本', value: '0', trend: '隐患类型 0 类' },
    ],
    taskStatus: [],
    hazardDistribution: [],
    systemStatus: [
      { label: '后端服务', value: '运行中', tagType: 'warning' },
      { label: '模型服务', value: '服务可用', tagType: 'primary' },
      { label: 'MySQL 数据库', value: '连接中', tagType: 'warning' },
      { label: 'Redis 缓存', value: '按需启用', tagType: 'warning' },
      { label: '对象存储', value: '连接中', tagType: 'warning' },
      { label: '平台对接', value: '准备中', tagType: 'warning' },
    ],
    latestTasks: [],
  };
}
</script>
