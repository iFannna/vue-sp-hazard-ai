<template>
  <div class="card">
    <div class="toolbar">
      <h3>数据采集批次管理</h3>
      <div>
        <input class="search" placeholder="搜索批次号 / 来源 / 场景" />
        <button class="btn btn-primary">新建采集批次</button>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>批次号</th>
          <th>来源</th>
          <th>场景</th>
          <th>样本数量</th>
          <th>清洗状态</th>
          <th>标注状态</th>
          <th>创建时间</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="batch in batches" :key="batch.code">
          <td>{{ batch.code }}</td>
          <td>{{ batch.source }}</td>
          <td>{{ batch.scene }}</td>
          <td>{{ batch.amount }}</td>
          <td><span class="tag" :class="batch.cleanClass">{{ batch.cleanStatus }}</span></td>
          <td><span class="tag" :class="batch.labelClass">{{ batch.labelStatus }}</span></td>
          <td>{{ batch.createdAt }}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="grid-2">
    <div class="card">
      <h3>新建采集批次</h3>
      <div class="form-grid">
        <input class="input" placeholder="批次号自动生成" />
        <select class="select">
          <option>巡检照片</option>
          <option>监控摄像头</option>
        </select>
        <select class="select">
          <option>施工现场</option>
          <option>工业厂区</option>
        </select>
        <input class="input" placeholder="采集负责人" />
      </div>
      <div style="margin-top: 14px">
        <textarea class="textarea" placeholder="批次说明：例如，3月第1周施工现场 PPE 采样"></textarea>
      </div>
      <div style="margin-top: 14px">
        <button class="btn btn-primary">保存批次</button>
        <button class="btn btn-light">批量导入素材</button>
      </div>
    </div>

    <div class="card">
      <h3>采集规则提示</h3>
      <div class="info-list">
        <div v-for="rule in rules" :key="rule.label" class="info-row">
          <span>{{ rule.label }}</span>
          <strong>{{ rule.value }}</strong>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const batches = [
  {
    code: 'BATCH-20260316-01',
    source: '巡检照片',
    scene: '施工现场',
    amount: '1,280',
    cleanStatus: '已完成',
    cleanClass: 'tag-low',
    labelStatus: '进行中',
    labelClass: 'tag-medium',
    createdAt: '2026-03-16 09:30',
  },
  {
    code: 'BATCH-20260315-03',
    source: '监控摄像头',
    scene: '工业厂区',
    amount: '3,640',
    cleanStatus: '待清洗',
    cleanClass: 'tag-medium',
    labelStatus: '未开始',
    labelClass: 'tag-blue',
    createdAt: '2026-03-15 14:20',
  },
  {
    code: 'BATCH-20260314-02',
    source: '历史台账图片',
    scene: '仓储区域',
    amount: '920',
    cleanStatus: '已完成',
    cleanClass: 'tag-low',
    labelStatus: '已完成',
    labelClass: 'tag-low',
    createdAt: '2026-03-14 18:10',
  },
];

const rules = [
  { label: '图片清晰度', value: '建议 ≥ 1280 × 720' },
  { label: '采样角度', value: '覆盖远景 / 中景 / 近景' },
  { label: '重复过滤', value: '按 hash 自动去重' },
  { label: '场景标签', value: '采集时即打标签' },
];
</script>
