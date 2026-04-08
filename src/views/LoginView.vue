<template>
  <div class="login-wrap">
    <div class="login-card">
      <div class="login-brand">
        <h1 style="margin: 0; font-size: 34px; line-height: 1.35">安全生产隐患 AI 自动识别平台</h1>
        <div style="margin-top: 10px; opacity: 0.9">
          面向数据采集、图片识别、人工复核、统计分析的一体化业务平台
        </div>
        <div class="hero-box">
          <div style="font-size: 18px; font-weight: 700">项目亮点</div>
          <ul style="line-height: 1.9; padding-left: 18px; margin: 12px 0 0">
            <li>图文多模态隐患识别</li>
            <li>样本采集与数据集管理</li>
            <li>人工复核闭环</li>
            <li>可视化统计与平台对接</li>
          </ul>
        </div>
        <div class="stat-mini">
          <div>
            <strong style="font-size: 22px">12,846</strong><br />
            <span style="font-size: 12px; opacity: 0.85">累计样本</span>
          </div>
          <div>
            <strong style="font-size: 22px">286</strong><br />
            <span style="font-size: 12px; opacity: 0.85">今日任务</span>
          </div>
          <div>
            <strong style="font-size: 22px">31</strong><br />
            <span style="font-size: 12px; opacity: 0.85">隐患类型</span>
          </div>
        </div>
      </div>
      <div class="login-form">
        <div style="font-size: 28px; font-weight: 700">账号登录</div>
        <div style="color: #6b7280; margin-bottom: 18px">请输入用户名和密码进入系统</div>
        <div style="display: grid; gap: 14px">
          <input class="input" placeholder="用户名 / 工号" />
          <input class="input" type="password" placeholder="密码" />
          <button class="btn btn-primary" style="width: 100%">登录系统</button>
        </div>
      </div>
    </div>
  </div>
</template>
