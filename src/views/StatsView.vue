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
        <button class="btn btn-light">导出</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>排名</th>
            <th>隐患类型</th>
            <th>数量</th>
            <th>占比</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in ranking" :key="item.rank">
            <td>{{ item.rank }}</td>
            <td>{{ item.name }}</td>
            <td>{{ item.count }}</td>
            <td>{{ item.percent }}</td>
          </tr>
        </tbody>
      </table>
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
const metrics = [
  { label: '识别通过率', value: '93.4%', trend: '人工复核后统计' },
  { label: '误报率', value: '4.1%', trend: '近 7 日' },
  { label: '漏报率', value: '2.5%', trend: '持续优化中' },
  { label: '平均识别耗时', value: '1.82s', trend: '单图任务' },
];

const ranking = [
  { rank: '1', name: '未戴安全帽', count: '1,846', percent: '28%' },
  { rank: '2', name: '消防通道堵塞', count: '1,392', percent: '21%' },
  { rank: '3', name: '物料堆放混乱', count: '1,061', percent: '16%' },
];

const areas = [
  { label: '施工现场', risk: '高风险', width: '86%', color: '#ef4444' },
  { label: '工业厂区', risk: '中风险', width: '64%', color: '#f59e0b' },
  { label: '仓储区域', risk: '一般', width: '42%', color: '#10b981' },
];
</script>
