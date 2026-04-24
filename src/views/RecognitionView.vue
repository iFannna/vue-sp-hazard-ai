<template>
  <div class="grid-2 recognition-page-grid">
    <div class="card">
      <div class="toolbar">
        <h3>图片上传识别</h3>
      </div>
      <div class="tabs">
        <el-button :type="activeMode === 'single' ? 'primary' : 'default'" round @click="switchMode('single')">单图识别</el-button>
        <el-button :type="activeMode === 'batch' ? 'primary' : 'default'" round @click="switchMode('batch')">批量上传</el-button>
      </div>
      <div class="upload-box" @click="openFilePicker" @dragover.prevent @drop.prevent="handleDrop">
        <h4 style="margin: 12px 0 6px">拖拽图片到此处，或点击上传</h4>
        <div style="color: #6b7280">支持 JPG / PNG / JPEG，单张不超过 20MB</div>
        <div style="margin-top: 14px">
          <el-button type="primary" @click.stop="openFilePicker">选择图片</el-button>
          <el-button @click.stop="resetForm">清空选择</el-button>
        </div>
        <input ref="fileInputRef" type="file" accept="image/*" :multiple="activeMode === 'batch'" style="display: none" @change="handleFileChange" />
        <div class="upload-status-area">
          <div v-if="selectedFile" class="upload-status-text is-primary">
            已选择：{{ selectedFile.name }}，{{ formatFileSize(selectedFile.size) }}
          </div>
          <div v-else-if="activeMode === 'batch' && uploadFiles.length > 0" class="upload-status-text is-primary">
            已选择 {{ uploadFiles.length }} 张图片，待上传 {{ pendingCount }} 张
          </div>
          <div v-else-if="errorMessage" class="upload-status-text is-error">{{ errorMessage }}</div>
          <div v-else-if="successMessage" class="upload-status-text is-success">{{ successMessage }}</div>
        </div>
      </div>
      <div v-if="activeMode === 'batch' && uploadQueue.length > 0" class="card" style="margin-top: 14px; box-shadow: none">
        <h3>批量上传队列</h3>
        <el-table :data="uploadQueue" @row-click="selectQueueItem">
          <el-table-column prop="name" label="文件名" min-width="180" show-overflow-tooltip />
          <el-table-column label="大小" width="110">
            <template #default="{ row: item }">{{ formatFileSize(item.size) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row: item }">
              <el-tag :type="getQueueTag(item.status)">{{ item.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="说明" min-width="160">
            <template #default="{ row: item }">{{ item.message || '-' }}</template>
          </el-table-column>
        </el-table>
      </div>
      <div class="preview">
        <div ref="previewStageRef" class="mock-image">
          <el-image ref="previewImageRef" v-if="previewUrl" :src="previewUrl" alt="预览图片" fit="contain" class="preview-image" @load="updatePreviewMetrics">
            <template #error>
              <el-empty description="图片加载失败" />
            </template>
          </el-image>
          <div
            v-for="box in previewUrl ? resultBoxes : []"
            :key="box.id"
            class="box"
            :style="toPreviewBoxStyle(box)"
          >
            <el-tooltip :content="box.label" placement="top" :show-after="150">
              <div class="box-label" :style="toPreviewLabelStyle(box)">
                {{ box.label }}
              </div>
            </el-tooltip>
          </div>
          <el-empty v-if="!previewUrl" class="preview-placeholder" description="暂无图片预览">
            <span class="preview-placeholder-text">选择图片后将在这里展示原图与识别框</span>
          </el-empty>
        </div>
      </div>
      <div class="recognition-params">
        <div class="params-title">识别参数</div>
        <div class="params-grid">
          <el-select v-model="siteId" placeholder="施工现场" clearable style="width: 100%">
            <el-option v-for="item in siteOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <el-select v-model="sourceId" placeholder="巡检照片" clearable style="width: 100%">
            <el-option v-for="item in sourceOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <el-input v-model="batchNo" placeholder="批次号：BATCH-20260316-01" />
          <el-input v-model="deviceCode" placeholder="设备编号（可选）" />
          <el-select v-model="modelVersionId" placeholder="模型版本" clearable style="width: 100%">
            <el-option v-for="item in modelVersionOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <el-select v-model="detectMode" placeholder="识别模式" style="width: 100%">
            <el-option v-for="item in detectModeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <el-input-number
            v-model="confidenceThreshold"
            :min="0.1"
            :max="0.99"
            :step="0.05"
            :precision="2"
            controls-position="right"
            style="width: 100%"
          />
          <el-select v-model="reviewPolicy" placeholder="复核策略" style="width: 100%">
            <el-option v-for="item in reviewPolicyOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>
        <div class="params-textarea">
          <el-input
            v-model="promptText"
            type="textarea"
            :rows="4"
            placeholder="补充说明：请识别图片中的人员 PPE、消防通道与临边防护隐患"
          />
        </div>
        <div class="params-actions">
          <el-button type="primary" :disabled="isUploading || isRecognizing || !canStartRecognition" @click="handleUpload">
            {{ isRecognizing ? '识别中...' : isUploading ? '上传中...' : activeMode === 'single' ? '开始识别' : '批量识别' }}
          </el-button>
          <el-button :disabled="isUploading || isRecognizing" @click="resetForm">重置</el-button>
        </div>
      </div>
    </div>

    <div class="card">
      <h3>识别结果摘要</h3>
      <div class="info-list">
        <div v-for="item in summary" :key="item.label" class="info-row">
          <span>{{ item.label }}</span>
          <el-tag :type="item.tagType" class="summary-tag">{{ item.value }}</el-tag>
        </div>
      </div>
      <el-table :data="results" class="result-table" style="margin-top: 12px">
        <el-table-column label="隐患类型" min-width="140">
          <template #default="{ row: item }">
            <el-tag :type="item.levelTagType">{{ item.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="隐患等级" width="100">
          <template #default="{ row: item }">
            <el-tag :type="item.levelTagType">{{ item.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="confidence" label="置信度" width="90" />
        <el-table-column prop="advice" label="建议" min-width="180" show-overflow-tooltip />
        <template #empty>
          <el-empty description="上传成功后将在这里显示媒体入库信息和隐患明细。" />
        </template>
      </el-table>
      <div class="action-row" style="margin-top: 14px">
        <el-button type="primary" :loading="isReviewSubmitting" :disabled="!inferenceTask || isCurrentTaskSubmitted || !canSubmitReview" @click="submitReview">
          {{ isCurrentTaskSubmitted ? '已提交复核' : '提交人工复核' }}
        </el-button>
        <el-button :disabled="!uploadedMedia || !canAddDataset" @click="addToDataset">加入数据集</el-button>
        <el-button :disabled="!inferenceTask || isRecognizing" @click="queryInferenceResult">查询结果</el-button>
        <RouterLink v-slot="{ navigate }" to="/review" custom>
          <el-button @click="navigate">查看复核</el-button>
        </RouterLink>
      </div>
      <div v-if="actionMessage" style="margin-top: 12px; color: #15803d">{{ actionMessage }}</div>
      <div style="margin-top: 18px">
        <div class="toolbar">
          <h3>最近上传</h3>
          <el-tag type="primary">共 {{ uploadHistory.length }} 条</el-tag>
        </div>
        <el-table :data="latestUploadHistory" class="history-table" :row-class-name="getHistoryRowClass" @row-click="selectHistoryItem">
          <el-table-column prop="mediaNo" label="素材编号" min-width="130" />
          <el-table-column label="文件名" min-width="160" show-overflow-tooltip>
            <template #default="{ row: item }">
              <a :href="item.fileUrl" target="_blank" @click.stop>{{ item.fileName }}</a>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row: item }">
              <el-tag type="success">{{ item.status }}</el-tag>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty description="暂无上传历史" />
          </template>
        </el-table>
      </div>
    </div>
  </div>

  <div class="card" v-loading="isHistoryLoading">
    <div class="toolbar">
      <h3>上传历史</h3>
      <div>
        <el-input v-model.trim="historyKeyword" clearable placeholder="搜索素材编号 / 文件名" style="width: 240px" @clear="searchUploadHistory" @keyup.enter="searchUploadHistory" />
        <el-button @click="searchUploadHistory">搜索</el-button>
        <el-button :disabled="uploadHistory.length === 0" @click="clearHistory">清空历史</el-button>
      </div>
    </div>
    <el-table :data="filteredUploadHistory" class="history-table" :row-class-name="getHistoryRowClass" @row-click="selectHistoryItem">
      <el-table-column prop="mediaNo" label="素材编号" min-width="140" />
      <el-table-column label="文件名" min-width="180" show-overflow-tooltip>
        <template #default="{ row: item }">
          <a :href="item.fileUrl" target="_blank" @click.stop>{{ item.fileName }}</a>
        </template>
      </el-table-column>
      <el-table-column label="尺寸" width="120">
        <template #default="{ row: item }">{{ item.width }} × {{ item.height }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row: item }">
          <el-tag type="success">{{ item.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="uploadedAt" label="上传时间" min-width="180" />
      <el-table-column label="操作" width="260" fixed="right">
        <template #default="{ row: item }">
          <div class="table-actions">
            <el-button size="small" :disabled="!canSubmitReview" @click.stop="submitHistoryReview(item)">提交复核</el-button>
            <el-button size="small" :disabled="!canAddDataset" @click.stop="addHistoryToDataset(item)">加入数据集</el-button>
            <el-button size="small" type="danger" @click.stop="deleteHistoryItem(item.id)">删除</el-button>
          </div>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="暂无上传历史" />
      </template>
    </el-table>
    <el-pagination
      v-model:current-page="historyPageNum"
      v-model:page-size="historyPageSize"
      layout="total, sizes, prev, pager, next"
      :page-sizes="[10, 20, 50]"
      :total="historyTotal"
      style="margin-top: 14px; justify-content: flex-end"
      @current-change="loadUploadHistory"
      @size-change="handleHistorySizeChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';

import {
  createInferenceTask,
  getInferenceResults,
  getInferenceTask,
  getLatestInferenceTaskByMediaId,
  connectInferenceWebSocket,
  disconnectInferenceWebSocket,
  onTaskComplete,
  offTaskComplete,
  type InferenceResultVO,
  type InferenceTaskVO,
  type WebSocketTaskMessage,
} from '@/api/inference';
import { addDatasetItem } from '@/api/dataset';
import { uploadMedia, listMediaPage, deleteMedia, type MediaUploadVO } from '@/api/media';
import { getPlatformOptions, type OptionVO } from '@/api/platform';
import { createReviewRecord, getReviewRecordByTaskId, type ReviewTaskVO } from '@/api/review';
import { hasPermission } from '@/utils/session';

type UploadMode = 'single' | 'batch';
type QueueStatus = '待上传' | '上传中' | '识别中' | '已完成' | '失败';

interface UploadQueueItem {
  name: string;
  size: number;
  status: QueueStatus;
  message?: string;
  file: File;
  previewUrl: string;
}

interface UploadedMediaRecord extends MediaUploadVO {
  uploadedAt: string;
  status: string;
}

const fileInputRef = ref<HTMLInputElement>();
const previewStageRef = ref<HTMLElement>();
const previewImageRef = ref();
const selectedFile = ref<File>();
const activeMode = ref<UploadMode>('single');
const uploadFiles = ref<File[]>([]);
const uploadQueue = ref<UploadQueueItem[]>([]);
const previewUrl = ref('');
const uploadedMedia = ref<MediaUploadVO>();
const inferenceTask = ref<InferenceTaskVO>();
const inferenceResults = ref<InferenceResultVO[]>([]);
const uploadHistory = ref<UploadedMediaRecord[]>([]);
const isHistoryLoading = ref(false);
const isUploading = ref(false);
const isRecognizing = ref(false);
const isReviewSubmitting = ref(false);
const currentReviewRecord = ref<ReviewTaskVO | null>(null);
const errorMessage = ref('');
const successMessage = ref('');
const actionMessage = ref('');
const historyKeyword = ref('');
const historyPageNum = ref(1);
const historyPageSize = ref(10);
const historyTotal = ref(0);
const selectedHistoryId = ref<number>();
const currentWsTaskNo = ref('');
const sourceId = ref<number>();
const siteId = ref<number>();
const batchNo = ref('');
const deviceCode = ref('');
const modelVersionId = ref<number>();
const detectMode = ref('标准识别');
const confidenceThreshold = ref(0.75);
const reviewPolicy = ref('高风险自动复核');
const promptText = ref('');
const previewMetrics = ref({
  naturalWidth: 0,
  naturalHeight: 0,
  displayWidth: 0,
  displayHeight: 0,
  offsetLeft: 0,
  offsetTop: 0,
});
const pendingCount = computed(() => uploadQueue.value.filter((item) => item.status === '待上传').length);
const canStartRecognition = computed(() => uploadFiles.value.length > 0 || Boolean(uploadedMedia.value));
const canSubmitReview = computed(() => hasPermission('api:inference:review-request'));
const canAddDataset = computed(() => hasPermission('api:dataset-item:import-from-task'));
const latestUploadHistory = computed(() => uploadHistory.value.slice(0, 3));
const filteredUploadHistory = computed(() => {
  return uploadHistory.value;
});
const isCurrentTaskSubmitted = computed(() => Boolean(inferenceTask.value && currentReviewRecord.value?.taskId === inferenceTask.value.id));

const siteOptions = ref<OptionVO[]>([]);
const sourceOptions = ref<OptionVO[]>([]);
const modelVersionOptions = ref<OptionVO[]>([]);
const detectModeOptions = [
  { label: '快速识别', value: '快速识别' },
  { label: '标准识别', value: '标准识别' },
  { label: '严格识别', value: '严格识别' },
];
const reviewPolicyOptions = [
  { label: '高风险自动复核', value: '高风险自动复核' },
  { label: '全部提交复核', value: '全部提交复核' },
  { label: '仅本地展示', value: '仅本地展示' },
];

const handleWebSocketTaskComplete = async (message: WebSocketTaskMessage) => {
  if (inferenceTask.value && inferenceTask.value.taskNo === message.taskNo) {
    inferenceTask.value = await getInferenceTask(message.taskNo);
    inferenceResults.value = await getInferenceResults(message.taskNo);

    if (message.status === 'SUCCESS') {
      ElMessage.success('识别完成，结果已更新');
      isRecognizing.value = false;
    } else if (message.status === 'FAILED') {
      ElMessage.error('识别失败');
      isRecognizing.value = false;
    }
  }
};

async function syncInferenceWebSocket(taskNo?: string) {
  if (!taskNo) {
    currentWsTaskNo.value = '';
    disconnectInferenceWebSocket(false);
    return;
  }
  if (currentWsTaskNo.value === taskNo) {
    return;
  }
  await connectInferenceWebSocket(taskNo);
  currentWsTaskNo.value = taskNo;
}

onMounted(async () => {
  await Promise.all([loadOptions(), loadUploadHistory()]);
  onTaskComplete(handleWebSocketTaskComplete);
  window.addEventListener('resize', updatePreviewMetrics);
});

onUnmounted(() => {
  offTaskComplete(handleWebSocketTaskComplete);
  disconnectInferenceWebSocket();
  currentWsTaskNo.value = '';
  window.removeEventListener('resize', updatePreviewMetrics);
});

const summary = computed(() => [
  { label: '媒体编号', value: uploadedMedia.value?.mediaNo || '待上传', tagType: 'info' },
  { label: '上传状态', value: uploadedMedia.value ? '已入库' : '未上传', tagType: uploadedMedia.value ? 'success' : 'primary' },
  { label: '识别任务', value: inferenceTask.value?.taskNo || '待创建', tagType: 'info' },
  { label: '识别状态', value: inferenceTask.value?.statusText || '待识别', tagType: getInferenceTag(inferenceTask.value?.status) },
  { label: '文件类型', value: uploadedMedia.value?.fileType || '-', tagType: 'info' },
  { label: '图片尺寸', value: uploadedMedia.value ? `${uploadedMedia.value.width} × ${uploadedMedia.value.height}` : '-', tagType: 'info' },
  { label: '识别进度', value: `${inferenceTask.value?.progress || 0}%`, tagType: getInferenceTag(inferenceTask.value?.status) },
]);

const results = computed(() => {
  if (inferenceResults.value.length === 0) {
    return [];
  }

  return [...inferenceResults.value]
    .sort(compareRiskResult)
    .map((item) => ({
    type: item.hazardTypeName,
    level: item.hazardLevelName,
    levelTagType: getLevelTag(item.hazardLevelName),
    confidence: `${Math.round(Number(item.confidence) * 100)}%`,
    advice: item.advice,
  }));
});

const resultBoxes = computed(() => {
  const metrics = previewMetrics.value;
  const boxes = inferenceResults.value
    .map((item) => {
      const box = parseBbox(item.bboxJson);
      if (!box) {
        return null;
      }
      const color = getBoxColor(item.hazardLevelName);
      const scaleX = metrics.displayWidth > 0 ? metrics.displayWidth / 100 : 0;
      const scaleY = metrics.displayHeight > 0 ? metrics.displayHeight / 100 : 0;
      const leftPx = metrics.offsetLeft + box.x * scaleX;
      const topPx = metrics.offsetTop + box.y * scaleY;
      const widthPx = box.w * scaleX;
      const heightPx = box.h * scaleY;
      return {
        id: item.id,
        ...box,
        color,
        background: `${color}18`,
        label: `${item.hazardTypeName} ${Math.round(Number(item.confidence) * 100)}%`,
        leftPx,
        topPx,
        widthPx,
        heightPx,
        labelLevel: 0,
        zIndex: getRiskLayer(item.hazardLevelName, item.confidence),
        labelStyle: {
          left: '0px',
          top: '-26px',
          maxWidth: '148px',
        },
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((first, second) => first.topPx - second.topPx || first.leftPx - second.leftPx);

  layoutPreviewLabels(boxes, previewStageRef.value?.clientWidth || 0, previewStageRef.value?.clientHeight || 0);

  return boxes.sort((first, second) => first.zIndex - second.zIndex || Number(first.id) - Number(second.id));
});

function openFilePicker() {
  fileInputRef.value?.click();
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files || []);
  if (files.length > 0) {
    setSelectedFiles(files);
  }
}

function handleDrop(event: DragEvent) {
  const files = Array.from(event.dataTransfer?.files || []);
  if (files.length > 0) {
    setSelectedFiles(files);
  }
}

function setSelectedFiles(files: File[]) {
  errorMessage.value = '';
  successMessage.value = '';
  releaseQueuePreviewUrls();
  releaseLocalPreviewUrl();
  uploadedMedia.value = undefined;
  inferenceTask.value = undefined;
  inferenceResults.value = [];
  currentReviewRecord.value = null;
  currentWsTaskNo.value = '';
  disconnectInferenceWebSocket(false);
  selectedHistoryId.value = undefined;
  actionMessage.value = '';

  const invalidFile = files.find((file) => !file.type.startsWith('image/'));
  if (invalidFile) {
    errorMessage.value = '文件格式不支持';
    ElMessage.error(errorMessage.value);
    return;
  }
  const oversizedFile = files.find((file) => file.size > 20 * 1024 * 1024);
  if (oversizedFile) {
    errorMessage.value = '单张图片不能超过 20MB';
    ElMessage.error(errorMessage.value);
    return;
  }

  uploadFiles.value = activeMode.value === 'single' ? files.slice(0, 1) : files;
  uploadQueue.value = uploadFiles.value.map((file) => ({
    name: file.name,
    size: file.size,
    status: '待上传',
    file,
    previewUrl: URL.createObjectURL(file),
  }));
  const firstQueueItem = uploadQueue.value[0];
  selectedFile.value = firstQueueItem?.file;
  previewUrl.value = firstQueueItem?.previewUrl || '';
}

function selectQueueItem(item: UploadQueueItem) {
  if (!item.previewUrl) {
    return;
  }
  selectedFile.value = item.file;
  previewUrl.value = item.previewUrl;
  void nextTick(() => updatePreviewMetrics());
}

async function handleUpload() {
  if (uploadFiles.value.length === 0) {
    if (uploadedMedia.value) {
      isUploading.value = true;
      errorMessage.value = '';
      successMessage.value = '';
      try {
        const task = await runInference(uploadedMedia.value);
        if (task.status === 'SUCCESS') {
          successMessage.value = '历史素材识别完成';
          ElMessage.success(successMessage.value);
        } else {
          successMessage.value = '历史素材识别任务已创建，正在处理中';
          ElMessage.info(successMessage.value);
        }
      } catch (error) {
        errorMessage.value = error instanceof Error ? error.message : '素材识别失败';
        ElMessage.error(errorMessage.value);
      } finally {
        isUploading.value = false;
      }
      return;
    }
    errorMessage.value = '请先选择图片';
    ElMessage.warning(errorMessage.value);
    return;
  }

  isUploading.value = true;
  errorMessage.value = '';
  successMessage.value = '';
  try {
    if (activeMode.value === 'single') {
      uploadedMedia.value = await uploadOne(uploadFiles.value[0]);
      const task = await runInference(uploadedMedia.value);
      successMessage.value = task.status === 'SUCCESS' ? '图片上传并识别完成' : '图片上传成功，识别任务正在处理中';
    } else {
      const batchCompleted = await uploadBatch();
      successMessage.value = batchCompleted ? '批量上传并识别完成' : '批量上传成功，部分识别任务仍在处理中';
    }
    if (successMessage.value.includes('完成')) {
      ElMessage.success(successMessage.value);
    } else {
      ElMessage.info(successMessage.value);
    }
    actionMessage.value = '';
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '素材上传失败';
    ElMessage.error(errorMessage.value);
  } finally {
    isUploading.value = false;
  }
}

async function uploadOne(file: File) {
  const result = await uploadMedia({
    file,
    sourceId: sourceId.value,
    siteId: siteId.value,
    deviceCode: deviceCode.value.trim() || undefined,
  });
  historyPageNum.value = 1;
  await loadUploadHistory();
  return result;
}

async function uploadBatch() {
  let allCompleted = true;
  for (const file of uploadFiles.value) {
    const queueItem = uploadQueue.value.find((item) => item.name === file.name);
    if (queueItem) {
      queueItem.status = '上传中';
      queueItem.message = '';
    }
    try {
      const result = await uploadOne(file);
      uploadedMedia.value = result;
      if (queueItem) {
        queueItem.status = '识别中';
        queueItem.message = result.mediaNo;
      }
      const task = await runInference(result, false);
      if (queueItem) {
        queueItem.status = task.status === 'SUCCESS' ? '已完成' : '识别中';
        queueItem.message = task.taskNo;
      }
      if (task.status !== 'SUCCESS') {
        allCompleted = false;
      }
    } catch (error) {
      if (queueItem) {
        queueItem.status = '失败';
        queueItem.message = error instanceof Error ? error.message : '上传失败';
      }
    }
  }
  return allCompleted;
}

async function runInference(media: MediaUploadVO, showMessage = true) {
  isRecognizing.value = true;
  inferenceTask.value = undefined;
  inferenceResults.value = [];
  currentReviewRecord.value = null;
  try {
    const task = await createInferenceTask({
      mediaId: media.id,
      bizId: batchNo.value.trim() || undefined,
      requestSource: activeMode.value === 'batch' ? 'BATCH' : 'API',
      promptText: promptText.value.trim() || undefined,
      modelVersionId: modelVersionId.value,
      detectMode: detectMode.value,
      confidenceThreshold: confidenceThreshold.value,
      reviewPolicy: reviewPolicy.value,
    });
    inferenceTask.value = task;
    await syncInferenceWebSocket(task.taskNo);
    if (task.status === 'SUCCESS') {
      inferenceResults.value = task.results.length > 0 ? task.results : await getInferenceResults(task.taskNo);
    } else {
      if (showMessage) {
        ElMessage.info('识别任务已创建，正在处理中');
      }
      const latestTask = await waitForInferenceTask(task.taskNo);
      inferenceTask.value = latestTask;
      inferenceResults.value = latestTask.status === 'SUCCESS' ? await getInferenceResults(latestTask.taskNo) : latestTask.results;
    }
    if (showMessage) {
      ElMessage.success(inferenceTask.value.status === 'SUCCESS' ? '识别结果已生成' : '识别任务已创建，可稍后查询结果');
    }
    await syncReviewRecord(inferenceTask.value.id);
    return inferenceTask.value;
  } finally {
    isRecognizing.value = false;
  }
}

async function queryInferenceResult() {
  if (!inferenceTask.value) {
    return;
  }
  await syncInferenceWebSocket(inferenceTask.value.taskNo);
  const task = await getInferenceTask(inferenceTask.value.taskNo);
  inferenceTask.value = task;
  inferenceResults.value = await getInferenceResults(task.taskNo);
  await syncReviewRecord(task.id);
  ElMessage.success('识别结果已刷新');
}

async function waitForInferenceTask(taskNo: string) {
  let latestTask = await getInferenceTask(taskNo);
  for (let index = 0; index < 8 && latestTask.status === 'RUNNING'; index += 1) {
    await delay(1000);
    latestTask = await getInferenceTask(taskNo);
  }
  return latestTask;
}

function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function submitReview() {
  if (!inferenceTask.value) {
    return;
  }

  isReviewSubmitting.value = true;
  try {
    await createReviewRecord({
      taskId: inferenceTask.value.id,
      inferenceResultId: inferenceResults.value[0]?.id,
    });
    await syncReviewRecord(inferenceTask.value.id);
    actionMessage.value = '已提交到人工复核列表';
    ElMessage.success(actionMessage.value);
  } catch (error) {
    actionMessage.value = error instanceof Error ? error.message : '提交人工复核失败';
    ElMessage.error(actionMessage.value);
  } finally {
    isReviewSubmitting.value = false;
  }
}

async function addToDataset() {
  if (!uploadedMedia.value) {
    return;
  }

  await addDatasetItem({ mediaId: uploadedMedia.value.id });
  actionMessage.value = '已加入数据集样本列表';
  ElMessage.success(actionMessage.value);
}

async function submitHistoryReview(item: UploadedMediaRecord) {
  const task = await createInferenceTask({
    mediaId: item.id,
    requestSource: 'API',
    promptText: promptText.value.trim() || undefined,
    modelVersionId: modelVersionId.value,
    detectMode: detectMode.value,
    confidenceThreshold: confidenceThreshold.value,
    reviewPolicy: reviewPolicy.value,
  });
  const latestTask = task.status === 'SUCCESS' ? task : await waitForInferenceTask(task.taskNo);
  await createReviewRecord({
    taskId: latestTask.id,
    inferenceResultId: latestTask.results[0]?.id,
  });
  if (selectedHistoryId.value === item.id) {
    inferenceTask.value = latestTask;
    inferenceResults.value = latestTask.results.length > 0 ? latestTask.results : await getInferenceResults(latestTask.taskNo);
    await syncReviewRecord(latestTask.id);
  }
  actionMessage.value = `${item.mediaNo} 已提交到人工复核`;
  ElMessage.success(actionMessage.value);
}

async function selectHistoryItem(item: UploadedMediaRecord) {
  const currentHistoryId = item.id;
  selectedHistoryId.value = item.id;
  try {
    const task = await getLatestInferenceTaskByMediaId(item.id);
    if (selectedHistoryId.value !== currentHistoryId) {
      return;
    }
    if (task) {
      const results = task.results.length > 0 ? task.results : await getInferenceResults(task.taskNo);
      const reviewRecord = await getReviewRecordByTaskId(task.id);
      if (selectedHistoryId.value !== currentHistoryId) {
        return;
      }
      applyHistoryMedia(item);
      restoreTaskParams(task);
      inferenceTask.value = task;
      inferenceResults.value = results;
      currentReviewRecord.value = reviewRecord;
      await syncInferenceWebSocket(task.taskNo);
      ElMessage.success('已回显历史素材及识别结果');
    } else {
      applyHistoryMedia(item);
      resetInferenceParams();
      currentReviewRecord.value = null;
      await syncInferenceWebSocket();
      ElMessage.info('该素材暂无识别结果，已回显素材信息');
    }
  } catch (error) {
    if (selectedHistoryId.value !== currentHistoryId) {
      return;
    }
    ElMessage.error(error instanceof Error ? error.message : '识别结果回显失败');
  }
}

function getHistoryRowClass({ row }: { row: UploadedMediaRecord }) {
  return row.id === selectedHistoryId.value ? 'selected-history-row' : '';
}

function restoreMediaParams(item: UploadedMediaRecord) {
  sourceId.value = item.sourceId ?? sourceOptions.value[0]?.value;
  siteId.value = item.siteId ?? siteOptions.value[0]?.value;
  deviceCode.value = item.deviceCode || '';
}

function applyHistoryMedia(item: UploadedMediaRecord) {
  selectedFile.value = undefined;
  uploadFiles.value = [];
  uploadQueue.value = [];
  uploadedMedia.value = item;
  currentReviewRecord.value = null;
  errorMessage.value = '';
  successMessage.value = '';
  actionMessage.value = '';
  restoreMediaParams(item);
  releaseLocalPreviewUrl();
  previewUrl.value = item.fileUrl;
  void nextTick(() => updatePreviewMetrics());
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
}

function restoreTaskParams(task: InferenceTaskVO) {
  sourceId.value = task.sourceId ?? sourceId.value;
  siteId.value = task.siteId ?? siteId.value;
  batchNo.value = task.bizId || '';
  modelVersionId.value = task.modelVersionId;
  const params = parseStoredPrompt(task.promptText);
  promptText.value = params.promptText;
  detectMode.value = params.detectMode;
  confidenceThreshold.value = params.confidenceThreshold;
  reviewPolicy.value = params.reviewPolicy;
}

function resetInferenceParams() {
  batchNo.value = '';
  modelVersionId.value = undefined;
  detectMode.value = '标准识别';
  confidenceThreshold.value = 0.75;
  reviewPolicy.value = '高风险自动复核';
  promptText.value = '';
  inferenceTask.value = undefined;
  inferenceResults.value = [];
  currentReviewRecord.value = null;
}

function parseStoredPrompt(value?: string) {
  const params = {
    promptText: '',
    detectMode: '标准识别',
    confidenceThreshold: 0.75,
    reviewPolicy: '高风险自动复核',
  };
  if (!value) {
    return params;
  }

  const promptParts: string[] = [];
  value.split('；').forEach((part) => {
    const text = part.trim();
    if (!text) {
      return;
    }
    if (text.startsWith('识别模式：')) {
      params.detectMode = text.replace('识别模式：', '') || params.detectMode;
      return;
    }
    if (text.startsWith('置信度阈值：')) {
      const threshold = Number(text.replace('置信度阈值：', ''));
      params.confidenceThreshold = Number.isNaN(threshold) ? params.confidenceThreshold : threshold;
      return;
    }
    if (text.startsWith('复核策略：')) {
      params.reviewPolicy = text.replace('复核策略：', '') || params.reviewPolicy;
      return;
    }
    promptParts.push(text);
  });
  params.promptText = promptParts.join('；');
  return params;
}

async function addHistoryToDataset(item: UploadedMediaRecord) {
  await addDatasetItem({ mediaId: item.id });
  actionMessage.value = `${item.mediaNo} 已加入数据集`;
  ElMessage.success(actionMessage.value);
}

async function clearHistory() {
  try {
    await ElMessageBox.confirm('清空历史会删除当前列表中的媒体记录，确认继续？', '清空确认', {
      confirmButtonText: '清空',
      cancelButtonText: '取消',
      type: 'warning',
    });
  } catch {
    return;
  }
  await Promise.all(uploadHistory.value.map((item) => deleteMedia(item.id)));
  uploadHistory.value = [];
  clearSelectedHistory();
  actionMessage.value = '上传历史已清空';
  ElMessage.success(actionMessage.value);
}

async function deleteHistoryItem(id: number) {
  try {
    await ElMessageBox.confirm('确认删除这条媒体记录？', '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    });
  } catch {
    return;
  }
  await deleteMedia(id);
  if (selectedHistoryId.value === id) {
    clearSelectedHistory();
  }
  await loadUploadHistory();
  actionMessage.value = '上传历史已删除';
  ElMessage.success(actionMessage.value);
}

async function loadUploadHistory() {
  isHistoryLoading.value = true;
  try {
    const page = await listMediaPage({
      keyword: historyKeyword.value || undefined,
      pageNum: historyPageNum.value,
      pageSize: historyPageSize.value,
    });
    uploadHistory.value = page.rows.map((item) => ({
      ...item,
      uploadedAt: item.createdAt ? new Date(item.createdAt).toLocaleString() : '-',
      status: '已入库',
    }));
    historyTotal.value = page.total;
  } catch (error) {
    actionMessage.value = error instanceof Error ? error.message : '上传历史加载失败';
    ElMessage.error(actionMessage.value);
  } finally {
    isHistoryLoading.value = false;
  }
}

async function searchUploadHistory() {
  historyPageNum.value = 1;
  await loadUploadHistory();
}

async function handleHistorySizeChange() {
  historyPageNum.value = 1;
  await loadUploadHistory();
}

async function loadOptions() {
  const options = await getPlatformOptions();
  sourceOptions.value = options.dataSources;
  siteOptions.value = options.sites;
  modelVersionOptions.value = options.modelVersions;
  sourceId.value = sourceId.value ?? sourceOptions.value[0]?.value;
  siteId.value = siteId.value ?? siteOptions.value[0]?.value;
}

function switchMode(mode: UploadMode) {
  activeMode.value = mode;
  resetForm();
}

function resetForm() {
  releaseQueuePreviewUrls();
  selectedFile.value = undefined;
  uploadFiles.value = [];
  uploadQueue.value = [];
  uploadedMedia.value = undefined;
  inferenceTask.value = undefined;
  inferenceResults.value = [];
  currentReviewRecord.value = null;
  selectedHistoryId.value = undefined;
  errorMessage.value = '';
  successMessage.value = '';
  actionMessage.value = '';
  batchNo.value = '';
  deviceCode.value = '';
  modelVersionId.value = undefined;
  detectMode.value = '标准识别';
  confidenceThreshold.value = 0.75;
  reviewPolicy.value = '高风险自动复核';
  promptText.value = '';
  sourceId.value = sourceOptions.value[0]?.value;
  siteId.value = siteOptions.value[0]?.value;
  releaseLocalPreviewUrl();
  previewUrl.value = '';
  previewMetrics.value = {
    naturalWidth: 0,
    naturalHeight: 0,
    displayWidth: 0,
    displayHeight: 0,
    offsetLeft: 0,
    offsetTop: 0,
  };
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
}

function clearSelectedHistory() {
  selectedHistoryId.value = undefined;
  uploadedMedia.value = undefined;
  inferenceTask.value = undefined;
  inferenceResults.value = [];
  currentReviewRecord.value = null;
  releaseLocalPreviewUrl();
  previewUrl.value = '';
}

async function syncReviewRecord(taskId?: number) {
  if (!taskId) {
    currentReviewRecord.value = null;
    return;
  }
  currentReviewRecord.value = await getReviewRecordByTaskId(taskId);
}

function releaseLocalPreviewUrl() {
  if (previewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value);
  }
}

function releaseQueuePreviewUrls() {
  const previewUrls = new Set(
    uploadQueue.value
      .map((item) => item.previewUrl)
      .filter((item): item is string => item.startsWith('blob:')),
  );
  previewUrls.forEach((item) => URL.revokeObjectURL(item));
}

function updatePreviewMetrics() {
  const stage = previewStageRef.value;
  const imageElement = previewImageRef.value?.$el?.querySelector('img') as HTMLImageElement | null;
  if (!stage || !imageElement) {
    return;
  }
  const naturalWidth = imageElement.naturalWidth || 0;
  const naturalHeight = imageElement.naturalHeight || 0;
  const stageWidth = stage.clientWidth || 0;
  const stageHeight = stage.clientHeight || 0;
  if (!naturalWidth || !naturalHeight || !stageWidth || !stageHeight) {
    return;
  }
  const naturalRatio = naturalWidth / naturalHeight;
  const stageRatio = stageWidth / stageHeight;
  let displayWidth = 0;
  let displayHeight = 0;
  if (naturalRatio > stageRatio) {
    displayWidth = stageWidth;
    displayHeight = stageWidth / naturalRatio;
  } else {
    displayHeight = stageHeight;
    displayWidth = stageHeight * naturalRatio;
  }
  previewMetrics.value = {
    naturalWidth,
    naturalHeight,
    displayWidth,
    displayHeight,
    offsetLeft: (stageWidth - displayWidth) / 2,
    offsetTop: (stageHeight - displayHeight) / 2,
  };
  console.log('[bbox][recognition][metrics]', {
    naturalWidth: previewMetrics.value.naturalWidth,
    naturalHeight: previewMetrics.value.naturalHeight,
    displayWidth: previewMetrics.value.displayWidth,
    displayHeight: previewMetrics.value.displayHeight,
    offsetLeft: previewMetrics.value.offsetLeft,
    offsetTop: previewMetrics.value.offsetTop,
  });
}

function toPreviewBoxStyle(box: { x: number; y: number; w: number; h: number; color: string; background: string; zIndex: number }) {
  const metrics = previewMetrics.value;
  if (!metrics.naturalWidth || !metrics.naturalHeight) {
    return {
      display: 'none',
    };
  }
  const scaleX = metrics.displayWidth / 100;
  const scaleY = metrics.displayHeight / 100;
  const style = {
    left: `${metrics.offsetLeft + box.x * scaleX}px`,
    top: `${metrics.offsetTop + box.y * scaleY}px`,
    width: `${box.w * scaleX}px`,
    height: `${box.h * scaleY}px`,
    borderColor: box.color,
    background: box.background,
    zIndex: String(box.zIndex),
  };
  console.log('[bbox][recognition][box]', {
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

function toPreviewLabelStyle(box: {
  color: string;
  leftPx: number;
  labelLevel: number;
  labelStyle: { left: string; top: string; maxWidth: string };
}) {
  return {
    background: box.color,
    left: box.labelStyle.left,
    top: box.labelStyle.top,
    maxWidth: box.labelStyle.maxWidth,
  };
}

function getQueueTag(status: QueueStatus) {
  if (status === '已完成') {
    return 'success';
  }
  if (status === '上传中') {
    return 'primary';
  }
  if (status === '识别中') {
    return 'primary';
  }
  if (status === '失败') {
    return 'danger';
  }
  return 'warning';
}

function getInferenceTag(status?: string) {
  if (status === 'SUCCESS') {
    return 'success';
  }
  if (status === 'FAILED') {
    return 'danger';
  }
  if (status === 'RUNNING') {
    return 'primary';
  }
  return 'warning';
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

function getBoxColor(levelName?: string) {
  if (levelName?.includes('高') || levelName?.includes('重大')) {
    return '#ef4444';
  }
  if (levelName?.includes('低') || levelName?.includes('一般')) {
    return '#10b981';
  }
  return '#f59e0b';
}

function getLevelTag(levelName?: string) {
  if (levelName?.includes('高') || levelName?.includes('重大')) {
    return 'danger';
  }
  if (levelName?.includes('低') || levelName?.includes('一般')) {
    return 'success';
  }
  return 'warning';
}

function getRiskPriority(levelName?: string) {
  if (levelName?.includes('高') || levelName?.includes('重大')) {
    return 3;
  }
  if (levelName?.includes('低') || levelName?.includes('一般')) {
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

function layoutPreviewLabels(
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
    const labelWidth = estimateLabelWidth(box.label, 148);
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
        left: clamp(candidate.left, 8, Math.max(8, stageWidth - labelWidth - 8)),
        top: clamp(candidate.top, 8, Math.max(8, stageHeight - labelHeight - 8)),
      }));

    const target =
      candidates.find((candidate) => !isLabelOverlapping(candidate.left, candidate.top, labelWidth, labelHeight, placedLabels)) || candidates[0];

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

function estimateLabelWidth(text: string, maxWidth: number) {
  const estimated = text.length * 12 + 24;
  return Math.min(maxWidth, Math.max(88, estimated));
}

function isLabelOverlapping(
  left: number,
  top: number,
  width: number,
  height: number,
  placedLabels: Array<{ left: number; top: number; width: number; height: number }>,
) {
  return placedLabels.some((item) => left < item.left + item.width && left + width > item.left && top < item.top + item.height && top + height > item.top);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}
</script>

<style scoped>
.preview {
  display: block;
  margin-top: 18px;
}

.mock-image {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 420px;
  height: 420px;
  border: 0;
  border-radius: 12px;
  background: transparent;
}

.preview-image {
  display: block;
  width: 100%;
  height: 100%;
  background: var(--el-fill-color-blank);
}

.preview-image :deep(.el-image__inner) {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.preview-placeholder {
  width: 100%;
  padding: 34px 18px;
}

.preview-placeholder-text {
  display: block;
  margin-top: 2px;
  color: var(--el-text-color-placeholder);
  font-size: 13px;
  line-height: 1.6;
}

.upload-status-area {
  min-height: 32px;
  margin-top: 12px;
}

.upload-status-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.upload-status-text.is-primary {
  color: #1d4ed8;
}

.upload-status-text.is-error {
  color: #b91c1c;
}

.upload-status-text.is-success {
  color: #15803d;
}

.result-table {
  min-height: 188px;
}

.summary-tag {
  max-width: 72%;
}

.summary-tag :deep(.el-tag__content) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-table :deep(.el-table__body tr) {
  cursor: pointer;
}

.history-table :deep(.selected-history-row > .el-table__cell) {
  background: var(--el-color-primary-light-9);
}

.history-table :deep(.selected-history-row:hover > .el-table__cell) {
  background: var(--el-color-primary-light-8);
}

.recognition-params {
  margin-top: 20px;
  min-width: 0;
}

.params-title {
  margin-bottom: 16px;
  color: #0f172a;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
}

.params-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 20px;
}

.params-grid > * {
  min-width: 0;
}

.params-grid :deep(.el-select),
.params-grid :deep(.el-input),
.params-grid :deep(.el-input-number) {
  width: 100%;
  min-width: 0;
}

.params-textarea {
  margin-top: 16px;
}

.params-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
  flex-wrap: wrap;
}

@media (max-width: 1360px) {
  .recognition-page-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1100px) {
  .mock-image {
    min-height: 300px;
    height: 300px;
  }
}

@media (max-width: 640px) {
  .mock-image {
    min-height: 240px;
    height: 240px;
  }

  .params-grid {
    grid-template-columns: 1fr;
  }
}
</style>
