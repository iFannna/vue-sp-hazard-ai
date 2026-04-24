<template>
  <div class="card" v-loading="isLoading">
    <div class="toolbar">
      <h3>隐患类型字典</h3>
      <div>
        <el-input v-model.trim="keyword" clearable placeholder="搜索编码 / 名称" style="width: 220px" @clear="searchItems" @keyup.enter="searchItems" />
        <el-button @click="searchItems">搜索</el-button>
        <el-button type="primary" @click="prepareCreateItem">新增类型</el-button>
      </div>
    </div>
    <el-table :data="filteredItems">
      <el-table-column prop="code" label="编码" min-width="120" />
      <el-table-column prop="name" label="名称" min-width="140" />
      <el-table-column prop="category" label="类别" min-width="120" />
      <el-table-column prop="level" label="默认等级" min-width="120" />
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row: item }">
          <div class="table-actions">
            <el-button size="small" @click="editItem(item.id)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteItem(item.id)">删除</el-button>
          </div>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="暂无匹配隐患类型" />
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

  <el-dialog v-model="dialogVisible" :title="dialogTitle" width="560px">
    <div class="form-grid">
      <el-input v-model.trim="form.code" placeholder="类型编码" />
      <el-input v-model.trim="form.name" placeholder="类型名称" />
      <el-select v-model="form.category" placeholder="隐患类别" style="width: 100%">
        <el-option v-for="item in categoryOptions" :key="item" :label="item" :value="item" />
      </el-select>
      <el-select v-model="form.levelId" placeholder="默认等级" style="width: 100%">
        <el-option v-for="item in levelOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </div>
    <div style="margin-top: 14px">
      <el-input
        v-model.trim="form.description"
        type="textarea"
        :rows="4"
        placeholder="说明：填写该隐患类型的业务解释、识别范围、注意事项"
      />
    </div>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button @click="resetForm">重置</el-button>
      <el-button type="primary" @click="saveItem">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

import { createHazardType, deleteHazardType, listHazardTypePage, updateHazardType, type HazardTypeVO } from '@/api/dictionary';
import { getPlatformOptions, type OptionVO } from '@/api/platform';

const keyword = ref('');
const isLoading = ref(false);
const message = ref('');
const errorMessage = ref('');
const pageNum = ref(1);
const pageSize = ref(20);
const total = ref(0);
const dialogVisible = ref(false);
const categoryOptions = ['静态隐患', '动态隐患'];
const levelOptions = ref<OptionVO[]>([]);
const form = reactive({
  id: undefined as number | undefined,
  code: '',
  name: '',
  category: '静态隐患',
  levelId: undefined as number | undefined,
  description: '',
});

const dictionaryItems = ref<HazardTypeVO[]>([]);

onMounted(async () => {
  await Promise.all([loadOptions(), loadItems()]);
});

const filteredItems = computed(() => {
  const rows = dictionaryItems.value.map(toRow);
  return rows;
});

const dialogTitle = computed(() => (form.id ? '编辑类型' : '新增类型'));

async function saveItem() {
  message.value = '';
  errorMessage.value = '';
  if (!form.code || !form.name || !form.levelId) {
    errorMessage.value = '请填写类型编码和类型名称';
    ElMessage.warning(errorMessage.value);
    return;
  }

  form.code = form.code.toUpperCase();
  const params = {
    typeCode: form.code,
    typeName: form.name,
    typeCategory: form.category === '动态隐患' ? 'DYNAMIC' : 'STATIC',
    defaultLevelId: form.levelId,
    description: form.description || undefined,
  };
  if (form.id) {
    await updateHazardType(form.id, params);
    message.value = '隐患类型已更新到后端';
    ElMessage.success(message.value);
  } else {
    await createHazardType(params);
    message.value = '隐患类型已新增到后端';
    ElMessage.success(message.value);
  }

  await loadItems();
  resetForm(false);
  dialogVisible.value = false;
}

function editItem(id: number) {
  const item = dictionaryItems.value.find((value) => value.id === id);
  if (!item) {
    return;
  }
  form.id = item.id;
  form.code = item.typeCode;
  form.name = item.typeName;
  form.category = item.typeCategory === 'DYNAMIC' ? '动态隐患' : '静态隐患';
  form.levelId = item.defaultLevelId;
  form.description = item.description || '';
  message.value = '已载入字典配置，可修改后保存';
  errorMessage.value = '';
  dialogVisible.value = true;
  ElMessage.info(message.value);
}

function prepareCreateItem() {
  resetForm(false);
  message.value = '已进入新增类型模式，请填写配置后保存';
  dialogVisible.value = true;
  ElMessage.info(message.value);
}

async function deleteItem(id: number) {
  try {
    await ElMessageBox.confirm('删除后该隐患类型将不再出现在字典列表，确认删除？', '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    });
  } catch {
    return;
  }
  await deleteHazardType(id);
  await loadItems();
  message.value = '隐患类型已删除';
  errorMessage.value = '';
  if (form.id === id) {
    resetForm(false);
  }
  ElMessage.success(message.value);
}

function resetForm(showMessage = true) {
  form.id = undefined;
  form.code = '';
  form.name = '';
  form.category = '静态隐患';
  form.levelId = levelOptions.value[0]?.value;
  form.description = '';
  errorMessage.value = '';
  if (showMessage) {
    message.value = '字典配置已重置';
    ElMessage.info(message.value);
  }
}

async function loadItems() {
  isLoading.value = true;
  try {
    const page = await listHazardTypePage({
      keyword: keyword.value || undefined,
      pageNum: pageNum.value,
      pageSize: pageSize.value,
    });
    dictionaryItems.value = page.rows;
    total.value = page.total;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '隐患类型加载失败';
    ElMessage.error(errorMessage.value);
  } finally {
    isLoading.value = false;
  }
}

async function searchItems() {
  pageNum.value = 1;
  await loadItems();
}

async function handleSizeChange() {
  pageNum.value = 1;
  await loadItems();
}

async function loadOptions() {
  const options = await getPlatformOptions();
  levelOptions.value = options.hazardLevels;
  form.levelId = form.levelId ?? levelOptions.value[0]?.value;
}

function toRow(item: HazardTypeVO) {
  return {
    id: item.id,
    code: item.typeCode,
    name: item.typeName,
    category: item.typeCategory === 'DYNAMIC' ? '动态隐患' : '静态隐患',
    level: item.defaultLevelName || '-',
  };
}
</script>
