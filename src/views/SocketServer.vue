<template>
  <section class="panel">
    <h2 class="panel-title">Socket 服务端（监听端）</h2>
    <div class="toolbar">
      <label>服务端</label>
      <select v-model="ss.server" class="sel">
        <option v-for="d in ss.servers" :key="d" :value="d">{{ d }}</option>
      </select>
      <button class="btn ghost" @click="load">刷新服务端</button>
      <button class="btn" @click="start">启动监听</button>
      <button class="btn warn" @click="stop">停止监听</button>
    </div>
    <div class="grid two">
      <div class="card" style="grid-column: 1 / -1">
        <div class="card-h">服务端运行状态</div>
        <div class="dev-status">
          <div v-for="s in socksStatus" :key="s.serverCode" class="dev-item">
            <span class="dot" :class="s.running ? 'on' : 'off'"></span>
            <span class="dev-code">{{ s.serverCode }}</span>
            <span class="dev-txt">{{ s.running ? '监听中' : '未启动' }} ({{ s.clientCount }} 客户端)</span>
          </div>
          <div v-if="!socksStatus.length" class="dev-empty">点击下方按钮检测</div>
        </div>
        <div class="btns"><button class="btn ghost" @click="check">检测状态</button></div>
      </div>
      <div class="card">
        <div class="card-h">在线客户端 / 最近消息</div>
        <div class="btns">
          <button class="btn ghost" @click="clients">刷新在线客户端</button>
          <button class="btn ghost" @click="recent">刷新最近消息</button>
        </div>
      </div>
      <div class="card">
        <div class="card-h">下发数据</div>
        <div class="row"><label>客户端(IP:Port)</label><input v-model="ss.clientId" placeholder="192.168.x.x:port" /></div>
        <div class="row"><label>消息</label><input v-model="ss.message" /></div>
        <div class="btns">
          <button class="btn" @click="sendString">发指定客户端</button>
          <button class="btn" @click="broadcast">广播字符串</button>
        </div>
      </div>
    </div>
  </section>
</template>
<script>
import mixin from '../mixins/api'
export default {
  name: 'SocketServerPage', mixins: [mixin],
  data() { return { ss: { server:'',servers:[],clientId:'',message:'' }, socksStatus:[] } },
  created() { this.load() },
  methods: {
    async load() { const r = await this.run(this.api.sockServer.servers); if (r && r.code === 200) { this.ss.servers = r.data || []; if (!this.ss.server && this.ss.servers[0]) this.ss.server = this.ss.servers[0] } },
    async start() { await this.run(() => this.api.sockServer.start({ serverCode: this.ss.server }), '启动监听') },
    async stop() { await this.run(() => this.api.sockServer.stop({ serverCode: this.ss.server }), '停止监听') },
    async clients() { await this.run(() => this.api.sockServer.clients({ serverCode: this.ss.server }), '在线客户端') },
    async recent() { await this.run(() => this.api.sockServer.recent({ serverCode: this.ss.server, take: 20 }), '最近消息') },
    async sendString() { await this.run(() => this.api.sockServer.sendStringTo({ serverCode: this.ss.server, clientId: this.ss.clientId, message: this.ss.message }), '发指定客户端') },
    async broadcast() { await this.run(() => this.api.sockServer.broadcastString({ serverCode: this.ss.server, message: this.ss.message }), '广播') },
    async check() { const r = await this.run(this.api.sockServer.serverStatus, '检测状态'); if (r && r.code === 200) this.socksStatus = r.data || [] }
  }
}
</script>
