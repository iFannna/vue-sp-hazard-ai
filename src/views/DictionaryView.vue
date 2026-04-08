<template>
  <div class="grid-2">
    <div class="card">
      <div class="toolbar">
        <h3>隐患类型字典</h3>
        <div>
          <input class="search" placeholder="搜索编码 / 名称" />
          <button class="btn btn-primary">新增类型</button>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>编码</th>
            <th>名称</th>
            <th>类别</th>
            <th>默认等级</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in dictionaryItems" :key="item.code">
            <td>{{ item.code }}</td>
            <td>{{ item.name }}</td>
            <td>{{ item.category }}</td>
            <td>{{ item.level }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <h3>字典配置</h3>
      <div class="form-grid">
        <input class="input" placeholder="类型编码" />
        <input class="input" placeholder="类型名称" />
        <select class="select">
          <option>静态隐患</option>
          <option>动态隐患</option>
        </select>
        <select class="select">
          <option>重大隐患</option>
          <option>较大隐患</option>
          <option>一般隐患</option>
        </select>
      </div>
      <div style="margin-top: 14px">
        <textarea class="textarea" placeholder="说明：填写该隐患类型的业务解释、识别范围、注意事项"></textarea>
      </div>
      <div style="margin-top: 14px">
        <button class="btn btn-primary">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const dictionaryItems = [
  { code: 'NO_HELMET', name: '未戴安全帽', category: '静态隐患', level: '高' },
  { code: 'FIRE_EXIT_BLOCKED', name: '消防通道堵塞', category: '静态隐患', level: '高' },
  { code: 'FALL_RISK', name: '高处坠落风险', category: '动态隐患', level: '高' },
  { code: 'WORKER_FATIGUE', name: '人员疲劳作业', category: '动态隐患', level: '中' },
];
</script>
