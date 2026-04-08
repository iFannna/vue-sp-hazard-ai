<template>
  <div class="grid-2">
    <div class="card">
      <div class="toolbar">
        <h3>图片上传识别</h3>
        <div>
          <button class="btn btn-primary">开始识别</button>
          <button class="btn btn-light">重置</button>
        </div>
      </div>
      <div class="tabs">
        <div class="tab active">单图识别</div>
        <div class="tab">批量上传</div>
      </div>
      <div class="upload-box">
        <h4 style="margin: 12px 0 6px">拖拽图片到此处，或点击上传</h4>
        <div style="color: #6b7280">支持 JPG / PNG / JPEG，单张不超过 20MB</div>
        <div style="margin-top: 14px">
          <button class="btn btn-primary">选择图片</button>
          <button class="btn btn-light">使用示例图</button>
        </div>
      </div>
      <div class="preview">
        <div class="mock-image">
          <div class="box" style="left: 32px; top: 72px; width: 100px; height: 142px">
            <div class="box-label">未戴安全帽 97%</div>
          </div>
          <div
            class="box"
            style="left: 164px; top: 92px; width: 86px; height: 126px; border-color: #f59e0b; background: rgba(245, 158, 11, 0.08)"
          >
            <div class="box-label" style="background: #f59e0b">未穿反光背心 91%</div>
          </div>
        </div>
        <div>
          <div style="font-size: 18px; font-weight: 700; margin-bottom: 12px">识别参数</div>
          <div class="form-grid">
            <select class="select">
              <option>施工现场</option>
            </select>
            <select class="select">
              <option>巡检照片</option>
            </select>
            <input class="input" placeholder="批次号：BATCH-20260316-01" />
            <input class="input" placeholder="设备编号（可选）" />
          </div>
          <div style="margin-top: 14px">
            <textarea class="textarea" placeholder="补充说明：请识别图片中的人员 PPE、消防通道与临边防护隐患"></textarea>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <h3>识别结果摘要</h3>
      <div class="info-list">
        <div v-for="item in summary" :key="item.label" class="info-row">
          <span>{{ item.label }}</span>
          <strong v-if="item.strong">{{ item.value }}</strong>
          <span v-else class="tag" :class="item.tagClass">{{ item.value }}</span>
        </div>
      </div>
      <table style="margin-top: 12px">
        <thead>
          <tr>
            <th>隐患类型</th>
            <th>置信度</th>
            <th>建议</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in results" :key="item.type">
            <td>{{ item.type }}</td>
            <td>{{ item.confidence }}</td>
            <td>{{ item.advice }}</td>
          </tr>
        </tbody>
      </table>
      <div style="margin-top: 14px">
        <RouterLink class="btn btn-primary" to="/review">提交人工复核</RouterLink>
        <RouterLink class="btn btn-light" to="/dataset">加入数据集</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';

const summary = [
  { label: '任务编号', value: 'TASK-20260316-0001', strong: true },
  { label: '识别状态', value: '已完成', strong: false, tagClass: 'tag-low' },
  { label: '识别耗时', value: '1.82 s', strong: true },
  { label: '隐患数量', value: '2 项', strong: true },
  { label: '风险等级', value: '重大隐患', strong: false, tagClass: 'tag-high' },
];

const results = [
  { type: '未戴安全帽', confidence: '97%', advice: '立即整改并重新拍照核验' },
  { type: '未穿反光背心', confidence: '91%', advice: '补充佩戴后再作业' },
];
</script>
