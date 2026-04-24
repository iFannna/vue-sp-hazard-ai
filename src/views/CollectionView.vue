<template>
  <div class="card" v-loading="isLoading">
    <div class="toolbar">
      <h3>数据采集批次管理</h3>
      <div>
        <el-input v-model.trim="keyword" clearable placeholder="搜索批次号 / 来源 / 场景" style="width: 240px" @clear="searchBatches" @keyup.enter="searchBatches" />
        <el-button @click="searchBatches">搜索</el-button>
        <el-button type="primary" @click="prepareCreateBatch">新建采集批次</el-button>
      </div>
    </div>
    <el-table :data="filteredBatches">
      <el-table-column prop="code" label="批次号" min-width="140" />
      <el-table-column prop="source" label="来源" min-width="110" />
      <el-table-column prop="scene" label="场景" min-width="130" />
      <el-table-column prop="amount" label="样本数量" width="100" />
      <el-table-column label="清洗状态" width="110">
        <template #default="{ row: batch }">
          <el-tag :type="batch.cleanType">{{ batch.cleanStatus }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="标注状态" width="110">
        <template #default="{ row: batch }">
          <el-tag :type="batch.labelType">{{ batch.labelStatus }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" min-width="170" />
      <el-table-column label="操作" width="260" fixed="right">
        <template #default="{ row: batch }">
          <div class="table-actions">
            <el-button size="small" :disabled="isImporting" @click="openImportPicker(batch.id)">导入素材</el-button>
            <el-button size="small" @click="markCleaned(batch.id)">完成清洗</el-button>
            <el-button size="small" @click="markLabeled(batch.id)">完成标注</el-button>
          </div>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="暂无匹配批次" />
      </template>
    </el-table>
    <el-pagination
      v-model:current-page="pageNum"
      v-model:page-size="pageSize"
      layout="total, sizes, prev, pager, next"
      :page-sizes="[10, 20, 50]"
      :total="total"
      style="margin-top: 14px; justify-content: flex-end"
      @current-change="loadBatches"
      @size-change="handleSizeChange"
    />
  </div>

  <div class="grid-2 collection-bottom-grid">
    <div class="card">
      <h3>新建采集批次</h3>
      <div class="form-grid">
        <el-input v-model.trim="batchForm.code" placeholder="批次号自动生成" />
        <el-select v-model="batchForm.sourceId" placeholder="素材来源" clearable style="width: 100%">
          <el-option v-for="item in sourceOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-select v-model="batchForm.siteId" placeholder="采集场景" clearable style="width: 100%">
          <el-option v-for="item in sceneOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-input v-model.trim="batchForm.owner" placeholder="采集负责人" />
      </div>
      <div style="margin-top: 14px">
        <el-input
          v-model.trim="batchForm.description"
          type="textarea"
          :rows="4"
          placeholder="批次说明：例如，3月第1周施工现场 PPE 采样"
        />
      </div>
      <div style="margin-top: 14px">
        <el-button type="primary" @click="createBatch">保存批次</el-button>
        <el-button :disabled="isImporting" @click="openImportPicker()">批量导入素材</el-button>
        <input ref="importInputRef" type="file" accept="image/*" multiple style="display: none" @change="handleImportFileChange" />
      </div>
      <div v-if="formMessage" style="margin-top: 12px; color: #15803d">{{ formMessage }}</div>
      <div v-if="importHint" style="margin-top: 12px; color: #1d4ed8">{{ importHint }}</div>
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
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';

import { createCollectBatch, listCollectBatchPage, updateCollectBatchStatus, type CollectBatchVO } from '@/api/collection';
import { uploadMedia } from '@/api/media';
import { getPlatformOptions, type OptionVO } from '@/api/platform';

const keyword = ref('');
const isLoading = ref(false);
const formMessage = ref('');
const importHint = ref('');
const importInputRef = ref<HTMLInputElement>();
const isImporting = ref(false);
const importingBatchId = ref<number>();
const pageNum = ref(1);
const pageSize = ref(10);
const total = ref(0);
const sourceOptions = ref<OptionVO[]>([]);
const sceneOptions = ref<OptionVO[]>([]);
const batchForm = reactive({
  code: '',
  sourceId: undefined as number | undefined,
  siteId: undefined as number | undefined,
  owner: '',
  description: '',
});

const batches = ref<CollectBatchVO[]>([]);

onMounted(async () => {
  await Promise.all([loadOptions(), loadBatches()]);
});

const filteredBatches = computed(() => {
  const rows = batches.value.map(toBatchRow);
  return rows;
});

function prepareCreateBatch() {
  batchForm.code = '';
  batchForm.owner = '';
  batchForm.description = '';
  formMessage.value = '请填写采集批次信息后保存';
  ElMessage.info(formMessage.value);
}

async function createBatch() {
  const batch = await createCollectBatch({
    batchNo: batchForm.code || undefined,
    batchName: sceneOptions.value.find((item) => item.value === batchForm.siteId)?.label || '默认采集批次',
    sourceId: batchForm.sourceId,
    siteId: batchForm.siteId,
    collector: batchForm.owner || undefined,
    remark: batchForm.description || undefined,
  });
  batchForm.code = '';
  batchForm.owner = '';
  batchForm.description = '';
  await loadBatches();
  formMessage.value = '采集批次已保存到后端';
  importHint.value = '';
  ElMessage.success(formMessage.value);
  return batch.id;
}

async function markCleaned(id: number) {
  await updateCollectBatchStatus(id, 'ANNOTATING');
  await loadBatches();
  formMessage.value = '批次已标记为清洗完成';
  ElMessage.success(formMessage.value);
}

async function markLabeled(id: number) {
  await updateCollectBatchStatus(id, 'DONE');
  await loadBatches();
  formMessage.value = '批次已标记为标注完成';
  ElMessage.success(formMessage.value);
}

async function openImportPicker(batchId?: number) {
  importingBatchId.value = batchId || await ensureTargetBatch();
  importInputRef.value?.click();
}

async function handleImportFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files || []);
  input.value = '';
  if (files.length === 0) {
    return;
  }

  const invalidFile = files.find((file) => !file.type.startsWith('image/'));
  if (invalidFile) {
    ElMessage.error('文件格式不支持');
    return;
  }
  const oversizedFile = files.find((file) => file.size > 20 * 1024 * 1024);
  if (oversizedFile) {
    ElMessage.error('单张图片不能超过 20MB');
    return;
  }

  const targetId = importingBatchId.value || await ensureTargetBatch();
  isImporting.value = true;
  importHint.value = `正在导入 ${files.length} 张素材...`;

  let successCount = 0;
  let failCount = 0;
  try {
    for (const file of files) {
      try {
        await uploadMedia({ file, batchId: targetId });
        successCount += 1;
      } catch {
        failCount += 1;
      }
    }

    if (successCount > 0) {
      await loadBatches();
    }
    formMessage.value = `已导入 ${successCount} 张素材`;
    importHint.value = failCount > 0 ? `${failCount} 张素材导入失败，请检查文件是否重复或格式是否正确` : '';
    if (failCount > 0) {
      ElMessage.warning(`${successCount} 张导入成功，${failCount} 张导入失败`);
    } else {
      ElMessage.success(formMessage.value);
    }
  } finally {
    isImporting.value = false;
  }
}

async function ensureTargetBatch() {
  if (batchForm.code) {
    const matched = batches.value.find((item) => item.batchNo === batchForm.code);
    if (matched) {
      return matched.id;
    }
    return createBatch();
  }
  if (batches.value.length === 0) {
    return createBatch();
  }
  return batches.value[0].id;
}

async function loadBatches() {
  isLoading.value = true;
  try {
    const page = await listCollectBatchPage({
      keyword: keyword.value || undefined,
      pageNum: pageNum.value,
      pageSize: pageSize.value,
    });
    batches.value = page.rows;
    total.value = page.total;
  } catch (error) {
    formMessage.value = error instanceof Error ? error.message : '采集批次加载失败';
    ElMessage.error(formMessage.value);
  } finally {
    isLoading.value = false;
  }
}

async function searchBatches() {
  pageNum.value = 1;
  await loadBatches();
}

async function handleSizeChange() {
  pageNum.value = 1;
  await loadBatches();
}

async function loadOptions() {
  const options = await getPlatformOptions();
  sourceOptions.value = options.dataSources;
  sceneOptions.value = options.sites;
  batchForm.sourceId = batchForm.sourceId ?? sourceOptions.value[0]?.value;
  batchForm.siteId = batchForm.siteId ?? sceneOptions.value[0]?.value;
}

function toBatchRow(batch: CollectBatchVO) {
  return {
    id: batch.id,
    code: batch.batchNo,
    source: batch.sourceName || '-',
    scene: batch.siteName || batch.batchName,
    amount: (batch.totalCount || 0).toLocaleString(),
    cleanStatus: getCleanStatus(batch.status),
    cleanType: batch.status === 'DONE' || batch.status === 'ANNOTATING' ? 'success' : 'warning',
    labelStatus: batch.status === 'DONE' ? '已完成' : batch.status === 'ANNOTATING' ? '进行中' : '未开始',
    labelType: batch.status === 'DONE' ? 'success' : batch.status === 'ANNOTATING' ? 'warning' : 'primary',
    createdAt: new Date(batch.createdAt).toLocaleString(),
  };
}

function getCleanStatus(status: string) {
  if (status === 'DONE' || status === 'ANNOTATING') {
    return '已完成';
  }
  if (status === 'CLEANING') {
    return '清洗中';
  }
  return '待清洗';
}

const rules = [
  { label: '图片清晰度', value: '建议 ≥ 1280 × 720' },
  { label: '采样角度', value: '覆盖远景 / 中景 / 近景' },
  { label: '重复过滤', value: '按 hash 自动去重' },
  { label: '场景标签', value: '采集时即打标签' },
];
</script>

<style scoped>
.collection-bottom-grid {
  margin-top: 16px;
  align-items: stretch;
}

.collection-bottom-grid > .card {
  height: 100%;
}
</style>
