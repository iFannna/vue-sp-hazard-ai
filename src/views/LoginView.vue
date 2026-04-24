<template>
  <div class="login-wrap">
    <div class="login-card">
      <div class="login-brand">
        <h1 class="login-title">安全生产隐患 AI 自动识别平台</h1>
        <div style="margin-top: 10px; opacity: 0.9">
          面向数据采集、图片识别、人工复核、统计分析的一体化业务平台
        </div>
        <div class="hero-box">
          <div style="font-size: 18px; font-weight: 700">项目亮点</div>
          <ul style="line-height: 1.9; padding-left: 18px; margin: 12px 0 0">
            <li>图像隐患自动识别</li>
            <li>样本采集与数据集管理</li>
            <li>人工复核闭环处理</li>
            <li>统计分析与平台对接</li>
          </ul>
        </div>
        <div class="stat-mini">
          <div>
            <strong style="font-size: 22px">{{ overview.totalSamples.toLocaleString() }}</strong><br />
            <span style="font-size: 12px; opacity: 0.85">累计样本</span>
          </div>
          <div>
            <strong style="font-size: 22px">{{ overview.todayTasks.toLocaleString() }}</strong><br />
            <span style="font-size: 12px; opacity: 0.85">今日任务</span>
          </div>
          <div>
            <strong style="font-size: 22px">{{ overview.hazardTypes.toLocaleString() }}</strong><br />
            <span style="font-size: 12px; opacity: 0.85">隐患类型</span>
          </div>
        </div>
      </div>
      <div class="login-form">
        <div style="font-size: 28px; font-weight: 700">账号登录</div>
        <div style="color: #6b7280; margin-bottom: 18px">请输入用户名和密码进入系统</div>
        <div style="display: grid; gap: 14px">
          <el-input v-model.trim="username" placeholder="用户名 / 工号" @keyup.enter="handleLogin" />
          <el-input v-model="password" type="password" placeholder="密码" show-password @keyup.enter="handleLogin" />
          <el-button type="primary" style="width: 100%" :loading="isSubmitting" @click="handleLogin">登录系统</el-button>
          <div v-if="errorMessage" style="color: #b91c1c">{{ errorMessage }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

import { getLoginOverview, login } from '@/api/auth';
import { getDefaultRoutePath, setSession } from '@/utils/session';

const router = useRouter();
const username = ref('');
const password = ref('');
const errorMessage = ref('');
const isSubmitting = ref(false);
const overview = reactive({
  totalSamples: 0,
  todayTasks: 0,
  hazardTypes: 0,
});

onMounted(async () => {
  try {
    const data = await getLoginOverview();
    overview.totalSamples = data.totalSamples || 0;
    overview.todayTasks = data.todayTasks || 0;
    overview.hazardTypes = data.hazardTypes || 0;
  } catch {
    overview.totalSamples = 0;
    overview.todayTasks = 0;
    overview.hazardTypes = 0;
  }
});

async function handleLogin() {
  if (!username.value || !password.value) {
    errorMessage.value = '请输入用户名和密码';
    ElMessage.warning(errorMessage.value);
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = '';
  try {
    const user = await login({
      username: username.value,
      password: password.value,
    });
    setSession(user);
    ElMessage.success('登录成功');
    void router.push(getDefaultRoutePath());
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '登录失败';
    ElMessage.error(errorMessage.value);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
.login-title {
  margin: 0;
  font-size: 34px;
  line-height: 1.35;
}

@media (max-width: 1280px) {
  .login-title {
    font-size: 30px;
  }
}
</style>
