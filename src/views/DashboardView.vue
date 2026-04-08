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
        <RouterLink class="btn btn-light" to="/stats">查看分析</RouterLink>
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
          <span class="tag" :class="item.tagClass">{{ item.value }}</span>
        </div>
      </div>
    </div>
  </div>

  <div class="grid-2">
    <div class="card">
      <div class="toolbar">
        <h3>快捷入口</h3>
        <div>
          <RouterLink to="/recognition" class="btn btn-primary">进入识别</RouterLink>
          <RouterLink to="/collection" class="btn btn-light">采集管理</RouterLink>
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
      <table>
        <thead>
          <tr>
            <th>任务编号</th>
            <th>类型</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="task in tasks" :key="task.code">
            <td>{{ task.code }}</td>
            <td>{{ task.type }}</td>
            <td><span class="tag" :class="task.tagClass">{{ task.status }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';

const metrics = [
  { label: '累计采集样本', value: '12,846', trend: '较上周 +12.8%' },
  { label: '今日识别任务', value: '286', trend: '成功率 98.6%' },
  { label: '待人工复核', value: '37', trend: '高优先级 12 条' },
  { label: '隐患类型覆盖', value: '31', trend: '静态 20+ · 动态 10+' },
];

const chartData = [
  { label: '周一', height: '90px', color: '#93c5fd' },
  { label: '周二', height: '130px', color: '#60a5fa' },
  { label: '周三', height: '110px', color: '#93c5fd' },
  { label: '周四', height: '160px', color: '#3b82f6' },
  { label: '周五', height: '185px', color: '#2563eb' },
  { label: '周六', height: '145px', color: '#60a5fa' },
  { label: '周日', height: '170px', color: '#3b82f6' },
];

const hazardDistribution = [
  { label: '未戴安全帽', percent: '28%', width: '82%', color: '#2563eb' },
  { label: '消防通道堵塞', percent: '21%', width: '68%', color: '#f59e0b' },
  { label: '物料堆放混乱', percent: '16%', width: '54%', color: '#10b981' },
];

const systemStatus = [
  { label: '模型服务', value: '运行正常', tagClass: 'tag-low' },
  { label: 'MySQL 数据库', value: '连接正常', tagClass: 'tag-low' },
  { label: 'Redis 缓存', value: '命中率 92%', tagClass: 'tag-low' },
  { label: '对象存储', value: '剩余 1.8 TB', tagClass: 'tag-blue' },
  { label: '平台对接', value: '待联调', tagClass: 'tag-medium' },
];

const quickEntries = [
  { title: '图片识别', description: '上传图片并查看结构化识别结果', path: '/recognition' },
  { title: '人工复核', description: '确认、驳回、修正 AI 结果', path: '/review' },
  { title: '数据集管理', description: '查看训练 / 验证 / 测试集分布', path: '/dataset' },
];

const tasks = [
  { code: 'TASK-20260316-0001', type: '单图识别', status: '已完成', tagClass: 'tag-low' },
  { code: 'TASK-20260316-0002', type: '批量导入', status: '处理中', tagClass: 'tag-medium' },
  { code: 'TASK-20260316-0003', type: '人工复核', status: '已驳回', tagClass: 'tag-blue' },
];
</script>
