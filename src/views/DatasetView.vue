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
        <h3>数据集版本</h3>
        <button class="btn btn-primary">创建新版本</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>版本号</th>
            <th>样本量</th>
            <th>状态</th>
            <th>创建时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="version in versions" :key="version.code">
            <td>{{ version.code }}</td>
            <td>{{ version.amount }}</td>
            <td><span class="tag" :class="version.statusClass">{{ version.status }}</span></td>
            <td>{{ version.createdAt }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <h3>数据集分布</h3>
      <div class="info-list">
        <div v-for="item in distribution" :key="item.label">
          <div class="info-row">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
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
  { label: '训练集', value: '8,920', trend: '占比 80%' },
  { label: '验证集', value: '1,112', trend: '占比 10%' },
  { label: '测试集', value: '1,114', trend: '占比 10%' },
  { label: '标注完成率', value: '87%', trend: '较昨日 +3%' },
];

const versions = [
  { code: 'V1.0.0', amount: '11,146', status: '已发布', statusClass: 'tag-low', createdAt: '2026-03-16 11:20' },
  { code: 'V0.9.2', amount: '9,820', status: '历史版本', statusClass: 'tag-blue', createdAt: '2026-03-12 18:00' },
];

const distribution = [
  { label: '训练集 Train', value: '80%', width: '80%', color: '#2563eb' },
  { label: '验证集 Val', value: '10%', width: '24%', color: '#f59e0b' },
  { label: '测试集 Test', value: '10%', width: '24%', color: '#10b981' },
];
</script>
