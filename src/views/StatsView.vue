<template>
  <div class="grid-4">
    <div v-for="metric in metrics" :key="metric.label" class="card">
      <div class="metric-label">{{ metric.label }}</div>
      <div class="metric-value">{{ metric.value }}</div>
      <div class="metric-trend">{{ metric.trend }}</div>
    </div>
  </div>

  <div class="grid-2">
    <div class="card">
      <div class="toolbar">
        <h3>高频隐患排行</h3>
        <el-button @click="exportRanking">导出</el-button>
      </div>
      <el-table :data="ranking">
        <el-table-column prop="rank" label="排名" width="80" />
        <el-table-column prop="name" label="隐患类型" min-width="150" />
        <el-table-column prop="count" label="数量" width="90" />
        <el-table-column prop="percent" label="占比" width="90" />
        <template #empty>
          <el-empty description="暂无排行数据" />
        </template>
      </el-table>
    </div>

    <div class="card">
      <h3>区域风险分布</h3>
      <div class="info-list">
        <div v-for="item in areas" :key="item.label">
          <div class="info-row">
            <span>{{ item.label }}</span>
            <strong>{{ item.risk }}</strong>
          </div>
          <div class="progress">
            <div class="bar" :style="{ width: item.width, background: item.color }"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';

import { getStatsSummary, type StatsSummaryVO } from '@/api/stats';

const summary = ref<StatsSummaryVO>({
  metrics: [
    { label: '识别通过率', value: '0%', trend: '人工复核后统计' },
    { label: '误报率', value: '0%', trend: '已驳回复核占比' },
    { label: '待处理任务', value: '0', trend: '总任务 0 条' },
    { label: '已入库素材', value: '0', trend: '隐患类型 0 类' },
  ],
  ranking: [],
  regionRisks: [],
});

onMounted(async () => {
  try {
    summary.value = await getStatsSummary();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '统计数据加载失败');
  }
});

const metrics = computed(() => summary.value.metrics);
const ranking = computed(() => summary.value.ranking);
const areas = computed(() => summary.value.regionRisks);

function exportRanking() {
  const header = '排名,隐患类型,数量,占比';
  const rows = ranking.value.map((item) => [item.rank, item.name, item.count, item.percent].join(','));
  const blob = new Blob([`\uFEFF${[header, ...rows].join('\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'hazard-ranking.csv';
  link.click();
  URL.revokeObjectURL(url);
  ElMessage.success('高频隐患排行已导出');
}
</script>
