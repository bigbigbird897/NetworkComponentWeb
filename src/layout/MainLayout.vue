<template>
  <div class="io-shell" :class="theme">
    <header class="io-topbar">
      <div class="brand">
        <span class="logo-dot"></span>
        <span class="brand-name">工业通信中台</span>
        <span class="brand-ver">v1.0 CONSOLE</span>
      </div>
      <div class="topbar-right">
        <span class="lbl">服务地址</span>
        <input class="base-input" v-model="baseUrl" placeholder="留空=同源代理，如 http://192.168.3.9:5000" @change="applyBase" />
        <span class="dot" :class="connState"></span>
        <span class="conn-text">{{ connText }}</span>
        <button class="btn ghost" @click="toggleTheme">{{ theme === 'dark' ? '☀ 浅色' : '🌙 夜间' }}</button>
      </div>
    </header>
    <div class="io-body">
      <aside class="io-nav">
        <div v-for="m in menus" :key="m.path" class="nav-item" :class="{ active: $route.path === m.path }" @click="$router.push(m.path)">
          <span class="nav-ico">{{ m.icon }}</span>{{ m.label }}
        </div>
      </aside>
      <main class="io-main">
        <router-view></router-view>
        <section class="panel">
          <div class="panel-hrow">
            <h2 class="panel-title">调用结果</h2>
            <button class="btn ghost" @click="result = ''">清空</button>
          </div>
          <pre class="pre result"><code v-html="hl(result)"></code></pre>
        </section>
      </main>
    </div>
  </div>
</template>
<script>
import mixin from '../mixins/api'
import * as apiModule from '../api/console'
export default {
  name: 'MainLayout', mixins: [mixin],
  data() { return {
    baseUrl: apiModule.getBase(),
    connState: 'off', connText: '未连接',
    theme: localStorage.getItem('nc-theme') || 'light',
    result: '',
    menus: [
      { path: '/license', label: '授权状态', icon: '◈' },
      { path: '/modbus-tcp', label: 'Modbus TCP', icon: 'M' },
      { path: '/modbus-rtu', label: 'Modbus RTU', icon: 'R' },
      { path: '/mqtt', label: 'MQTT', icon: '⇄' },
      { path: '/opcua', label: 'OPC UA', icon: '◉' },
      { path: '/socket-client', label: 'Socket 客户端', icon: '⇦' },
      { path: '/socket-server', label: 'Socket 服务端', icon: '⇨' },
      { path: '/notes', label: '记事本', icon: '✎' },
      { path: '/logs', label: '日志查看', icon: '☰' },
      { path: '/about', label: '关于', icon: 'ℹ' },
      { path: '/config', label: '系统配置', icon: '⚙' }
    ]
  }},
  created() {
    this.applyBase()
    this.$root.$on('result', t => { this.result = t })
    this.$root.$on('conn', s => { this.connState = s.state; this.connText = s.text })
  },
  methods: {
    applyBase() { apiModule.setBase(this.baseUrl); this.connState = 'wait'; this.connText = '已应用' },
    toggleTheme() { this.theme = this.theme === 'dark' ? 'light' : 'dark'; localStorage.setItem('nc-theme', this.theme) }
  }
}
</script>
