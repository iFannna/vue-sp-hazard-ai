<template>
  <div class="split">
    <div class="card" v-loading="isLoading">
      <div class="toolbar">
        <h3>待复核任务列表</h3>
        <div>
          <el-input v-model.trim="keyword" clearable placeholder="搜索任务编号 / 隐患类型" style="width: 220px" @clear="searchTasks" @keyup.enter="searchTasks" />
          <el-select v-model="statusFilter" placeholder="任务状态" clearable style="width: 140px">
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <el-button @click="searchTasks">搜索</el-button>
        </div>
      </div>
      <div class="kpi-row" style="margin-bottom: 14px">
        <div v-for="item in reviewStats" :key="item.label" class="card quick-card" style="box-shadow: none">
          <strong>{{ item.value }}</strong>
          <div style="color: #6b7280; margin-top: 8px">{{ item.label }}</div>
        </div>
      </div>
      <el-table :data="filteredTasks" :row-class-name="getTaskRowClassName" @row-click="(task) => selectTask(task.id)">
        <el-table-column prop="code" label="任务编号" min-width="150" />
        <el-table-column prop="type" label="隐患类型" min-width="140" />
        <el-table-column label="等级" width="100">
          <template #default="{ row: task }">
            <el-tag :type="task.levelType">{{ task.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row: task }">
            <el-tag :type="task.statusType">{{ task.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="time" label="时间" min-width="180" />
        <template #empty>
          <el-empty description="暂无匹配任务" />
        </template>
      </el-table>
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        layout="total, sizes, prev, pager, next"
        :page-sizes="[10, 20, 50]"
        :total="total"
        style="margin-top: 14px; justify-content: flex-end"
        @current-change="loadTasks"
        @size-change="handleSizeChange"
      />
    </div>

    <div class="card">
      <h3>复核详情</h3>
      <div v-if="selectedTask" class="info-list">
        <div v-for="item in details" :key="item.label" class="info-row">
          <span>{{ item.label }}</span>
          <div v-if="Array.isArray(item.values)" class="review-detail-tag-list">
            <el-tag v-for="value in item.values" :key="`${item.label}-${value.text}`" :type="value.tagType" class="review-detail-tag">
              {{ value.text }}
            </el-tag>
            <el-tag v-if="item.values.length === 0" type="info" class="review-detail-tag">-</el-tag>
          </div>
          <el-tag v-else :type="item.tagType" class="review-detail-tag">{{ item.value }}</el-tag>
        </div>
      </div>
      <div v-if="selectedTask?.fileUrl" class="review-preview">
        <div class="review-preview-head">
          <div class="review-preview-title">原始素材</div>
          <el-button size="small" @click="toggleAiResult">
            {{ showAiResult ? '隐藏AI识别结果' : '查看AI识别结果' }}
          </el-button>
        </div>
        <div ref="reviewPreviewStageRef" class="review-preview-canvas">
          <a :href="selectedTask.fileUrl" target="_blank" class="review-preview-image-wrap">
            <img ref="reviewPreviewImageRef" :src="selectedTask.fileUrl" alt="原始素材预览" @load="updateReviewPreviewMetrics" />
            <div
              v-for="aiBox in showAiResult ? aiBoxes : []"
              :key="aiBox.id"
              class="review-ai-box"
              :style="toReviewBoxStyle(aiBox)"
            >
              <div class="review-ai-label" :style="toReviewLabelStyle(aiBox)">
                {{ aiBox.label }}
              </div>
            </div>
          </a>
        </div>
      </div>
      <div style="margin-top: 14px" class="form-grid">
        <el-select v-model="decision" placeholder="复核结论" style="width: 100%">
          <el-option v-for="item in decisionOptions" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="finalHazardTypeId" placeholder="最终隐患类型" filterable style="width: 100%">
          <el-option v-for="item in hazardTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-select v-model="finalLevelId" placeholder="最终等级" style="width: 100%">
          <el-option v-for="item in levelOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>
      <div style="margin-top: 14px">
        <el-input
          v-model.trim="comment"
          type="textarea"
          :rows="4"
          placeholder="复核意见：例如，AI 识别准确，建议立即清理通道并复拍复核。"
        />
      </div>
      <div class="action-row" style="margin-top: 14px">
        <el-button :disabled="!selectedTask || !canClaimReview" @click="claimTask">领取任务</el-button>
        <el-button type="primary" :disabled="!selectedTask || !canSubmitReview" @click="submitReview">提交结果</el-button>
        <el-button type="danger" :disabled="!selectedTask || !canSubmitReview" @click="rejectReview">驳回结果</el-button>
      </div>
      <div v-if="!selectedTask" style="margin-top: 12px; color: #6b7280">请选择一条复核任务</div>
      <div v-if="message" style="margin-top: 12px; color: #15803d">{{ message }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { ElMessage } from 'element-plus';

import { listHazardTypes } from '@/api/dictionary';
import { claimReviewRecord, listReviewRecordPage, submitReviewDecision, type ReviewTaskVO } from '@/api/review';
import { getPlatformOptions, type OptionVO } from '@/api/platform';
import { getInferenceResults, type InferenceResultVO } from '@/api/inference';
import { hasPermission } from '@/utils/session';

const keyword = ref('');
const isLoading = ref(false);
const selectedId = ref<number>();
const statusFilter = ref('');
const decision = ref('确认隐患成立');
const finalHazardTypeId = ref<number>();
const finalLevelId = ref<number>();
const comment = ref('');
const message = ref('');
const showAiResult = ref(true);
const aiResultCache = ref<Record<number, InferenceResultVO[]>>({});
const reviewPreviewStageRef = ref<HTMLElement>();
const reviewPreviewImageRef = ref<HTMLImageElement>();
const reviewPreviewMetrics = ref({
  naturalWidth: 0,
  naturalHeight: 0,
  displayWidth: 0,
  displayHeight: 0,
  offsetLeft: 0,
  offsetTop: 0,
});
const pageNum = ref(1);
const pageSize = ref(10);
const total = ref(0);
const decisionOptions = ['确认隐患成立', '驳回', '修改后通过'];
const hazardTypeOptions = ref<OptionVO[]>([]);
const levelOptions = ref<OptionVO[]>([]);
const statusOptions = [
  { label: '待复核', value: 'PENDING' },
  { label: '复核中', value: 'PROCESSING' },
  { label: '已确认', value: 'CONFIRMED' },
  { label: '已驳回', value: 'REJECTED' },
];
const canClaimReview = computed(() => hasPermission('api:review:claim'));
const canSubmitReview = computed(() => hasPermission('api:review:decision'));

const tasks = ref<ReviewTaskVO[]>([]);

onMounted(async () => {
  await Promise.all([loadOptions(), loadHazardTypes(), loadTasks()]);
  window.addEventListener('resize', updateReviewPreviewMetrics);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateReviewPreviewMetrics);
});

const filteredTasks = computed(() => {
  return tasks.value.map(toTaskRow);
});

const selectedTask = computed(() => tasks.value.find((task) => task.id === selectedId.value));

const selectedAiResults = computed(() => {
  const task = selectedTask.value;
  if (!task) {
    return [];
  }
  const cachedResults = aiResultCache.value[task.id];
  if (cachedResults?.length) {
    return [...cachedResults].sort(compareRiskResult);
  }
  if (task.bboxJson) {
    return [{
      id: task.inferenceResultId || task.id,
      bboxJson: task.bboxJson,
      hazardTypeName: task.hazardTypeName,
      hazardLevelName: task.hazardLevelName,
      confidence: task.confidence,
      resultNo: 1,
      hazardTypeId: 0,
      hazardLevelId: 0,
      score: 0,
      advice: '',
      rawResultJson: '',
    }].sort(compareRiskResult);
  }
  return [];
});

const aiBoxes = computed(() =>
  selectedAiResults.value
    .map((result) => {
      const box = parseBbox(result.bboxJson);
      if (!box) {
        return null;
      }
      const confidence = result.confidence;
      return {
        id: result.id,
        ...box,
        color: getLevelColor(result.hazardLevelName),
        label: `${result.hazardTypeName || 'AI识别结果'}${confidence !== undefined && confidence !== null ? ` ${Math.round(Number(confidence) * 100)}%` : ''}`,
        zIndex: getRiskLayer(result.hazardLevelName, result.confidence),
        leftPx: 0,
        topPx: 0,
        widthPx: 0,
        heightPx: 0,
        labelStyle: {
          left: '0px',
          top: '-28px',
          maxWidth: '260px',
        },
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((first, second) => first.zIndex - second.zIndex || Number(first.id) - Number(second.id)),
);

const reviewStats = computed(() => [
  { label: '待复核', value: String(tasks.value.filter((task) => task.reviewStatus === 'PENDING').length) },
  { label: '复核中', value: String(tasks.value.filter((task) => task.reviewStatus === 'PROCESSING').length) },
  { label: '已完成', value: String(tasks.value.filter((task) => ['CONFIRMED', 'REJECTED', 'CORRECTED', 'PASSED'].includes(task.reviewStatus)).length) },
]);

const details = computed(() => [
  { label: '当前任务', value: selectedTask.value?.taskNo || '-', tagType: 'info' },
  {
    label: 'AI 识别结果',
    values: selectedAiResults.value.map((item) => ({
      text: item.hazardTypeName || '-',
      tagType: getLevelTag(item.hazardLevelName),
    })),
  },
  {
    label: 'AI 风险等级',
    values: selectedAiResults.value.map((item) => ({
      text: item.hazardLevelName || '-',
      tagType: getLevelTag(item.hazardLevelName),
    })),
  },
  {
    label: '置信度',
    values: selectedAiResults.value.map((item) => ({
      text: item.confidence !== undefined && item.confidence !== null ? `${Math.round(Number(item.confidence) * 100)}%` : '-',
      tagType: getConfidenceTag(item.confidence),
    })),
  },
]);

async function selectTask(id: number) {
  selectedId.value = id;
  const task = selectedTask.value;
  if (!task) {
    return;
  }
  finalHazardTypeId.value = task.finalHazardTypeId || hazardTypeOptions.value.find((item) => item.label === task.hazardTypeName)?.value;
  finalLevelId.value = task.finalLevelId || levelOptions.value[0]?.value;
  if (task.reviewStatus === 'REJECTED') {
    decision.value = '驳回';
  } else if (task.reviewStatus === 'CORRECTED') {
    decision.value = '修改后通过';
  } else {
    decision.value = '确认隐患成立';
  }
  comment.value = '';
  message.value = '';
  showAiResult.value = true;
  void nextTick(() => updateReviewPreviewMetrics());
  await ensureAiResults(task);
}

async function submitReview() {
  if (decision.value === '驳回') {
    await updateSelectedTask('REJECTED');
    return;
  }
  if (decision.value === '修改后通过') {
    await updateSelectedTask('CORRECTED');
    return;
  }
  await updateSelectedTask('CONFIRMED');
}

async function rejectReview() {
  decision.value = '驳回';
  await updateSelectedTask('REJECTED');
}

async function toggleAiResult() {
  if (!selectedTask.value) {
    return;
  }
  if (showAiResult.value) {
    showAiResult.value = false;
    return;
  }
  await ensureAiResults(selectedTask.value);
  if (aiBoxes.value.length === 0) {
    ElMessage.warning('暂无AI识别框坐标');
    return;
  }
  showAiResult.value = true;
}

async function ensureAiResults(task: ReviewTaskVO) {
  if (aiResultCache.value[task.id]?.length) {
    return;
  }
  try {
    aiResultCache.value = {
      ...aiResultCache.value,
      [task.id]: await getInferenceResults(task.taskNo),
    };
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : 'AI识别结果加载失败');
  }
}

async function claimTask() {
  const task = selectedTask.value;
  if (!task) {
    return;
  }
  await claimReviewRecord(task.id);
  await loadTasks();
  message.value = `${task.taskNo} 已领取`;
  ElMessage.success(message.value);
}

async function updateSelectedTask(status: string) {
  const task = selectedTask.value;
  if (!task || !finalLevelId.value) {
    return;
  }
  await submitReviewDecision(task.id, {
    reviewStatus: status,
    finalLevelId: finalLevelId.value,
    finalHazardTypeId: finalHazardTypeId.value,
    reviewComment: comment.value || undefined,
  });
  await loadTasks();
  message.value = `${task.taskNo} 复核结果已更新${comment.value ? `：${comment.value}` : ''}`;
  ElMessage.success(message.value);
}

async function loadTasks() {
  isLoading.value = true;
  try {
    const page = await listReviewRecordPage({
      keyword: keyword.value || undefined,
      status: statusFilter.value || undefined,
      pageNum: pageNum.value,
      pageSize: pageSize.value,
    });
    tasks.value = page.rows;
    total.value = page.total;
    selectedId.value = tasks.value.some((task) => task.id === selectedId.value) ? selectedId.value : tasks.value[0]?.id;
    if (selectedTask.value) {
      finalHazardTypeId.value = selectedTask.value.finalHazardTypeId || hazardTypeOptions.value.find((item) => item.label === selectedTask.value?.hazardTypeName)?.value;
      finalLevelId.value = selectedTask.value.finalLevelId || levelOptions.value[0]?.value;
      showAiResult.value = true;
      await ensureAiResults(selectedTask.value);
    }
  } catch (error) {
    message.value = error instanceof Error ? error.message : '复核任务加载失败';
    ElMessage.error(message.value);
  } finally {
    isLoading.value = false;
  }
}

async function searchTasks() {
  pageNum.value = 1;
  await loadTasks();
}

async function handleSizeChange() {
  pageNum.value = 1;
  await loadTasks();
}

async function loadOptions() {
  const options = await getPlatformOptions();
  levelOptions.value = options.hazardLevels;
  finalLevelId.value = finalLevelId.value ?? levelOptions.value[0]?.value;
}

async function loadHazardTypes() {
  const items = await listHazardTypes();
  hazardTypeOptions.value = items.map((item) => ({
    value: item.id,
    label: item.typeName,
  }));
  if (selectedTask.value) {
    finalHazardTypeId.value = selectedTask.value.finalHazardTypeId || hazardTypeOptions.value.find((item) => item.label === selectedTask.value?.hazardTypeName)?.value;
  }
}

function toTaskRow(task: ReviewTaskVO) {
  return {
    id: task.id,
    code: task.taskNo,
    type: task.hazardTypeName,
    level: task.hazardLevelName,
    levelType: getLevelTag(task.hazardLevelName),
    status: task.reviewStatusText || '未知状态',
    statusType: getStatusTag(task.reviewStatus),
    time: new Date(task.createdAt).toLocaleString(),
    fileUrl: task.fileUrl,
  };
}

function getTaskRowClassName({ row }: { row: { id: number } }) {
  return row.id === selectedId.value ? 'selected-review-row' : '';
}

function getStatusTag(status: string) {
  if (status === 'CONFIRMED' || status === 'CORRECTED' || status === 'PASSED') {
    return 'success';
  }
  if (status === 'REJECTED' || status === 'PROCESSING') {
    return 'primary';
  }
  return 'warning';
}

function getLevelTag(levelName?: string) {
  if (levelName?.includes('重大') || levelName === '高') {
    return 'danger';
  }
  if (levelName?.includes('一般') || levelName === '低') {
    return 'success';
  }
  return 'warning';
}

function getConfidenceTag(confidence?: number) {
  if (confidence === undefined || confidence === null) {
    return 'info';
  }
  if (Number(confidence) >= 0.9) {
    return 'success';
  }
  if (Number(confidence) >= 0.75) {
    return 'warning';
  }
  return 'danger';
}

function parseBbox(bboxJson?: string) {
  if (!bboxJson) {
    return null;
  }
  try {
    const value = JSON.parse(bboxJson) as { x?: number; y?: number; w?: number; h?: number };
    if ([value.x, value.y, value.w, value.h].some((item) => typeof item !== 'number')) {
      return null;
    }
    return {
      x: clampBoxValue(value.x),
      y: clampBoxValue(value.y),
      w: clampBoxValue(value.w),
      h: clampBoxValue(value.h),
    };
  } catch {
    return null;
  }
}

function clampBoxValue(value?: number) {
  if (value === undefined || Number.isNaN(value)) {
    return 0;
  }
  return Math.min(Math.max(value, 0), 100);
}

function updateReviewPreviewMetrics() {
  const imageElement = reviewPreviewImageRef.value;
  if (!imageElement) {
    return;
  }
  reviewPreviewMetrics.value = {
    naturalWidth: imageElement.naturalWidth || 0,
    naturalHeight: imageElement.naturalHeight || 0,
    displayWidth: imageElement.clientWidth || 0,
    displayHeight: imageElement.clientHeight || 0,
    offsetLeft: imageElement.offsetLeft || 0,
    offsetTop: imageElement.offsetTop || 0,
  };
  console.log('[bbox][review][metrics]', {
    naturalWidth: reviewPreviewMetrics.value.naturalWidth,
    naturalHeight: reviewPreviewMetrics.value.naturalHeight,
    displayWidth: reviewPreviewMetrics.value.displayWidth,
    displayHeight: reviewPreviewMetrics.value.displayHeight,
    offsetLeft: reviewPreviewMetrics.value.offsetLeft,
    offsetTop: reviewPreviewMetrics.value.offsetTop,
  });
}

function toReviewBoxStyle(box: {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  zIndex: number;
  leftPx: number;
  topPx: number;
  widthPx: number;
  heightPx: number;
  labelStyle: { left: string; top: string; maxWidth: string };
}) {
  const metrics = reviewPreviewMetrics.value;
  if (!metrics.naturalWidth || !metrics.naturalHeight) {
    return {
      display: 'none',
    };
  }
  const scaleX = metrics.displayWidth / 100;
  const scaleY = metrics.displayHeight / 100;
  const leftPx = box.x * scaleX;
  const topPx = box.y * scaleY;
  const widthPx = Math.max(Math.min(box.w * scaleX, metrics.displayWidth - leftPx), 0);
  const heightPx = Math.max(Math.min(box.h * scaleY, metrics.displayHeight - topPx), 0);
  box.leftPx = leftPx;
  box.topPx = topPx;
  box.widthPx = widthPx;
  box.heightPx = heightPx;
  layoutReviewLabels(aiBoxes.value, metrics.displayWidth, metrics.displayHeight);
  const style = {
    left: `${leftPx}px`,
    top: `${topPx}px`,
    width: `${widthPx}px`,
    height: `${heightPx}px`,
    borderColor: box.color,
    zIndex: String(box.zIndex),
  };
  console.log('[bbox][review][box]', {
    sourceBox: {
      x: box.x,
      y: box.y,
      w: box.w,
      h: box.h,
    },
    scaleX,
    scaleY,
    computedBox: style,
  });
  return style;
}

function toReviewLabelStyle(box: {
  color: string;
  labelStyle: { left: string; top: string; maxWidth: string };
}) {
  return {
    background: box.color,
    left: box.labelStyle.left,
    top: box.labelStyle.top,
    maxWidth: box.labelStyle.maxWidth,
  };
}

function getLevelColor(levelName?: string) {
  if (levelName?.includes('重大') || levelName === '高') {
    return '#ef4444';
  }
  if (levelName?.includes('一般') || levelName === '低') {
    return '#10b981';
  }
  return '#f59e0b';
}

function getRiskPriority(levelName?: string) {
  if (levelName?.includes('重大') || levelName === '高') {
    return 3;
  }
  if (levelName?.includes('一般') || levelName === '低') {
    return 1;
  }
  return 2;
}

function getRiskLayer(levelName?: string, confidence?: number | string) {
  return getRiskPriority(levelName) * 1000 + Math.round(Number(confidence || 0) * 100);
}

function compareRiskResult(
  first: { hazardLevelName?: string; confidence?: number | string },
  second: { hazardLevelName?: string; confidence?: number | string },
) {
  const levelDiff = getRiskPriority(second.hazardLevelName) - getRiskPriority(first.hazardLevelName);
  if (levelDiff !== 0) {
    return levelDiff;
  }
  return Number(second.confidence || 0) - Number(first.confidence || 0);
}

function layoutReviewLabels(
  boxes: Array<{
    leftPx: number;
    topPx: number;
    widthPx: number;
    heightPx: number;
    label: string;
    zIndex: number;
    labelStyle: { left: string; top: string; maxWidth: string };
  }>,
  stageWidth: number,
  stageHeight: number,
) {
  if (!stageWidth || !stageHeight) {
    return;
  }

  const placedLabels: Array<{ left: number; top: number; width: number; height: number }> = [];
  const orderedBoxes = [...boxes].sort((first, second) => second.zIndex - first.zIndex);

  orderedBoxes.forEach((box) => {
    const labelWidth = estimateReviewLabelWidth(box.label, 260);
    const labelHeight = 30;
    const gap = 8;
    const candidates = [
      { left: box.leftPx, top: box.topPx - labelHeight - gap },
      { left: box.leftPx + box.widthPx - labelWidth, top: box.topPx - labelHeight - gap },
      { left: box.leftPx + box.widthPx + gap, top: box.topPx },
      { left: box.leftPx, top: box.topPx + box.heightPx + gap },
      { left: box.leftPx + box.widthPx - labelWidth, top: box.topPx + box.heightPx + gap },
    ]
      .map((candidate) => ({
        left: clampReview(candidate.left, 8, Math.max(8, stageWidth - labelWidth - 8)),
        top: clampReview(candidate.top, 8, Math.max(8, stageHeight - labelHeight - 8)),
      }));

    const target =
      candidates.find((candidate) => !isReviewLabelOverlapping(candidate.left, candidate.top, labelWidth, labelHeight, placedLabels)) || candidates[0];

    placedLabels.push({
      left: target.left,
      top: target.top,
      width: labelWidth,
      height: labelHeight,
    });

    box.labelStyle = {
      left: `${target.left - box.leftPx}px`,
      top: `${target.top - box.topPx}px`,
      maxWidth: `${labelWidth}px`,
    };
  });
}

function estimateReviewLabelWidth(text: string, maxWidth: number) {
  const estimated = text.length * 12 + 24;
  return Math.min(maxWidth, Math.max(104, estimated));
}

function isReviewLabelOverlapping(
  left: number,
  top: number,
  width: number,
  height: number,
  placedLabels: Array<{ left: number; top: number; width: number; height: number }>,
) {
  return placedLabels.some((item) => left < item.left + item.width && left + width > item.left && top < item.top + item.height && top + height > item.top);
}

function clampReview(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
</script>

<style scoped>
:deep(.selected-review-row) {
  --el-table-tr-bg-color: #eff6ff;
  --el-table-row-hover-bg-color: #dbeafe;
}

:deep(.selected-review-row td:first-child) {
  box-shadow: inset 4px 0 0 #2563eb;
}

.review-detail-tag {
  max-width: 72%;
}

.review-detail-tag-list {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.review-detail-tag :deep(.el-tag__content) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.review-preview {
  margin-top: 14px;
}

.review-preview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.review-preview-title {
  color: #6b7280;
  font-size: 14px;
}

.review-preview-canvas {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #f8fafc;
}

.review-preview-image-wrap {
  position: relative;
  display: inline-block;
  max-width: 100%;
  line-height: 0;
}

.review-preview img {
  display: block;
  width: auto;
  max-width: 100%;
  max-height: 320px;
  height: auto;
}

.review-ai-box {
  position: absolute;
  border: 3px solid #ef4444;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.08);
  pointer-events: none;
}

.review-ai-label {
  position: absolute;
  top: -28px;
  left: 0;
  max-width: 260px;
  overflow: hidden;
  padding: 4px 8px;
  border-radius: 8px;
  color: #fff;
  font-size: 12px;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
