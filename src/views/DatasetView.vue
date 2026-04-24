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
        <div>
          <el-button @click="syncUploadHistory">同步上传历史</el-button>
          <el-button type="primary" @click="createVersion">创建新版本</el-button>
        </div>
      </div>
      <el-table :data="versionRows">
        <el-table-column prop="code" label="版本号" min-width="130" />
        <el-table-column prop="amount" label="样本量" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row: version }">
            <el-tag :type="version.statusType">{{ version.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" min-width="170" />
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row: version }">
            <div class="table-actions">
              <el-button size="small" @click="publishVersion(version.id)">发布</el-button>
              <el-button size="small" @click="archiveVersion(version.id)">归档</el-button>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无数据集版本" />
        </template>
      </el-table>
      <div v-if="message" style="margin-top: 12px; color: #15803d">{{ message }}</div>
    </div>

    <div class="card" v-loading="isLoading">
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

  <div class="card">
    <div class="toolbar">
      <h3>样本列表</h3>
      <div>
        <el-input v-model.trim="keyword" clearable placeholder="搜索素材编号 / 文件名" style="width: 240px" @clear="searchItems" @keyup.enter="searchItems" />
        <el-button @click="searchItems">搜索</el-button>
      </div>
    </div>
    <el-table :data="filteredDatasetItems">
      <el-table-column prop="mediaNo" label="素材编号" min-width="140" />
      <el-table-column prop="fileName" label="文件名" min-width="180" show-overflow-tooltip />
      <el-table-column prop="createdAt" label="加入时间" min-width="170" />
      <el-table-column label="文件地址" width="100">
        <template #default="{ row: item }">
          <el-link :href="item.fileUrl" target="_blank" type="primary">查看文件</el-link>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="90" fixed="right">
        <template #default="{ row: item }">
          <div class="table-actions">
            <el-button size="small" type="danger" @click="removeDatasetItem(item.id)">移除</el-button>
          </div>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="暂无样本，可在图片识别页上传后加入数据集，或同步上传历史。" />
      </template>
    </el-table>
    <el-pagination
      v-model:current-page="pageNum"
      v-model:page-size="pageSize"
      layout="total, sizes, prev, pager, next"
      :page-sizes="[10, 20, 50]"
      :total="total"
      style="margin-top: 14px; justify-content: flex-end"
      @current-change="loadItems"
      @size-change="handleSizeChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

import {
  addDatasetItem,
  createDatasetVersion,
  listDatasetItemPage,
  listDatasetVersions,
  removeDatasetItemApi,
  updateDatasetVersionStatus,
  type DatasetItemVO,
  type DatasetVersionVO,
} from '@/api/dataset';
import { listMedia } from '@/api/media';

const versions = ref<DatasetVersionVO[]>([]);
const datasetItems = ref<DatasetItemVO[]>([]);

const isLoading = ref(false);
const message = ref('');
const keyword = ref('');
const pageNum = ref(1);
const pageSize = ref(10);
const total = ref(0);

onMounted(async () => {
  await loadPageData();
});

const latestVersion = computed(() => versions.value[0]);

const splitCounts = computed(() => {
  if (latestVersion.value) {
    return {
      train: latestVersion.value.trainCount || 0,
      val: latestVersion.value.valCount || 0,
      test: latestVersion.value.testCount || 0,
    };
  }
  const totalCount = total.value;
  return {
    train: Math.round(totalCount * 0.8),
    val: Math.round(totalCount * 0.1),
    test: totalCount - Math.round(totalCount * 0.8) - Math.round(totalCount * 0.1),
  };
});

const metrics = computed(() => [
  { label: '训练集', value: splitCounts.value.train.toLocaleString(), trend: latestVersion.value ? `当前版本：${latestVersion.value.versionCode}` : '占比 80%' },
  { label: '验证集', value: splitCounts.value.val.toLocaleString(), trend: latestVersion.value ? `当前版本：${latestVersion.value.versionCode}` : '占比 10%' },
  { label: '测试集', value: splitCounts.value.test.toLocaleString(), trend: latestVersion.value ? `当前版本：${latestVersion.value.versionCode}` : '占比 10%' },
  { label: '标注完成率', value: total.value > 0 ? '100%' : '0%', trend: '基于已加入样本统计' },
]);

const distribution = computed(() => [
  { label: '训练集 Train', value: `${splitCounts.value.train} 张`, width: calcDistributionWidth(splitCounts.value.train), color: '#2563eb' },
  { label: '验证集 Val', value: `${splitCounts.value.val} 张`, width: calcDistributionWidth(splitCounts.value.val), color: '#f59e0b' },
  { label: '测试集 Test', value: `${splitCounts.value.test} 张`, width: calcDistributionWidth(splitCounts.value.test), color: '#10b981' },
]);

const filteredDatasetItems = computed(() => {
  return datasetItems.value.map((item) => ({
      ...item,
      id: String(item.id),
      createdAt: new Date(item.createdAt).toLocaleString(),
    }));
});

const versionRows = computed(() =>
  versions.value.map((version) => ({
    id: version.id,
    code: version.versionCode,
    amount: version.sampleCount.toLocaleString(),
    status: version.statusText || getVersionStatus(version),
    statusType: getVersionStatusClass(version),
    createdAt: new Date(version.createdAt).toLocaleString(),
  })),
);

async function createVersion() {
  await createDatasetVersion();
  await loadVersions();
  message.value = '新版本已创建到后端';
  ElMessage.success(message.value);
}

async function removeDatasetItem(id: string) {
  try {
    await ElMessageBox.confirm('确认将该样本从当前数据集中移除？', '移除确认', {
      confirmButtonText: '移除',
      cancelButtonText: '取消',
      type: 'warning',
    });
  } catch {
    return;
  }
  await removeDatasetItemApi(Number(id));
  await loadItems();
  message.value = '样本已从当前数据集移除';
  ElMessage.success(message.value);
}

async function syncUploadHistory() {
  const uploadHistory = await listMedia(undefined, 200);
  const existingIds = new Set(datasetItems.value.map((item) => item.mediaId));
  const newItems = uploadHistory.filter((item) => !existingIds.has(item.id));

  if (newItems.length === 0) {
    message.value = '暂无可同步的新上传素材';
    ElMessage.info(message.value);
    return;
  }

  await Promise.all(newItems.map((item) => addDatasetItem({ mediaId: item.id })));
  await loadItems();
  message.value = `已同步 ${newItems.length} 个上传素材`;
  ElMessage.success(message.value);
}

async function publishVersion(id: number) {
  await updateDatasetVersionStatus(id, 'PUBLISHED');
  await loadVersions();
  message.value = '数据集版本已发布';
  ElMessage.success(message.value);
}

async function archiveVersion(id: number) {
  await updateDatasetVersionStatus(id, 'ARCHIVED');
  await loadVersions();
  message.value = '数据集版本已归档';
  ElMessage.success(message.value);
}

async function loadPageData() {
  isLoading.value = true;
  try {
    await Promise.all([loadVersions(), loadItems()]);
  } catch (error) {
    message.value = error instanceof Error ? error.message : '数据集加载失败';
    ElMessage.error(message.value);
  } finally {
    isLoading.value = false;
  }
}

async function loadVersions() {
  versions.value = await listDatasetVersions();
}

async function loadItems() {
  const page = await listDatasetItemPage({
    keyword: keyword.value || undefined,
    pageNum: pageNum.value,
    pageSize: pageSize.value,
  });
  datasetItems.value = page.rows;
  total.value = page.total;
}

async function searchItems() {
  pageNum.value = 1;
  await loadItems();
}

async function handleSizeChange() {
  pageNum.value = 1;
  await loadItems();
}

function getVersionStatus(version: DatasetVersionVO) {
  if (version.description === 'ARCHIVED') {
    return '历史版本';
  }
  return version.frozenFlag === 1 ? '已发布' : '草稿';
}

function getVersionStatusClass(version: DatasetVersionVO) {
  if (version.description === 'ARCHIVED') {
    return 'primary';
  }
  return version.frozenFlag === 1 ? 'success' : 'warning';
}

function calcDistributionWidth(count: number) {
  const sum = splitCounts.value.train + splitCounts.value.val + splitCounts.value.test;
  if (sum <= 0) {
    return '0%';
  }
  return `${Math.max((count / sum) * 100, count > 0 ? 8 : 0)}%`;
}
</script>
