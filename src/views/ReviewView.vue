<template>
  <div class="split">
    <div class="card">
      <div class="toolbar">
        <h3>待复核任务列表</h3>
        <div><input class="search" placeholder="搜索任务编号 / 隐患类型" /></div>
      </div>
      <table>
        <thead>
          <tr>
            <th>任务编号</th>
            <th>隐患类型</th>
            <th>等级</th>
            <th>状态</th>
            <th>时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="task in tasks" :key="task.code">
            <td>{{ task.code }}</td>
            <td>{{ task.type }}</td>
            <td><span class="tag" :class="task.levelClass">{{ task.level }}</span></td>
            <td><span class="tag" :class="task.statusClass">{{ task.status }}</span></td>
            <td>{{ task.time }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <h3>复核详情</h3>
      <div class="info-list">
        <div v-for="item in details" :key="item.label" class="info-row">
          <span>{{ item.label }}</span>
          <strong v-if="item.strong">{{ item.value }}</strong>
          <span v-else class="tag" :class="item.tagClass">{{ item.value }}</span>
        </div>
      </div>
      <div style="margin-top: 14px" class="form-grid">
        <select class="select">
          <option>确认隐患成立</option>
          <option>驳回</option>
          <option>修改后通过</option>
        </select>
        <select class="select">
          <option>重大隐患</option>
          <option>较大隐患</option>
          <option>一般隐患</option>
        </select>
      </div>
      <div style="margin-top: 14px">
        <textarea class="textarea" placeholder="复核意见：例如，AI 识别准确，建议立即清理通道并复拍复核。"></textarea>
      </div>
      <div style="margin-top: 14px">
        <button class="btn btn-primary">提交结果</button>
        <button class="btn btn-danger">驳回结果</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const tasks = [
  {
    code: 'TASK-000128',
    type: '消防通道堵塞',
    level: '高',
    levelClass: 'tag-high',
    status: '待复核',
    statusClass: 'tag-medium',
    time: '2026-03-16 10:12',
  },
  {
    code: 'TASK-000127',
    type: '物料堆放混乱',
    level: '中',
    levelClass: 'tag-medium',
    status: '已驳回',
    statusClass: 'tag-blue',
    time: '2026-03-16 09:46',
  },
  {
    code: 'TASK-000126',
    type: '未戴安全帽',
    level: '高',
    levelClass: 'tag-high',
    status: '已确认',
    statusClass: 'tag-low',
    time: '2026-03-16 09:18',
  },
];

const details = [
  { label: '当前任务', value: 'TASK-000128', strong: true },
  { label: 'AI 识别结果', value: '消防通道堵塞', strong: true },
  { label: 'AI 风险等级', value: '重大隐患', strong: false, tagClass: 'tag-high' },
  { label: '置信度', value: '93%', strong: true },
];
</script>
