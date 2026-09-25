<template>
  <section class="panel">
    <h2 class="panel-title">Socket 客户端（短连接 / 长连接）</h2>
    <div class="toolbar">
      <label>设备</label>
      <select v-model="sc.device" class="sel">
        <option v-for="d in sc.devices" :key="d" :value="d">{{ d }}</option>
      </select>
      <button class="btn ghost" @click="load">刷新设备</button>
      <button class="btn ghost" @click="test">连通测试</button>
    </div>
    <div class="grid two">
      <div class="card" style="grid-column: 1 / -1">
        <div class="card-h">Socket 长连接状态</div>
        <div class="dev-status">
          <div v-for="(on, code) in status" :key="code" class="dev-item">
            <span class="dot" :class="on ? 'on' : 'off'"></span>
            <span class="dev-code">{{ code }}</span>
            <span class="dev-txt">{{ on ? '已连接' : '未连接' }}</span>
          </div>
          <div v-if="!Object.keys(status).length" class="dev-empty">点击下方按钮检测</div>
        </div>
        <div class="btns"><button class="btn ghost" @click="check">检测状态</button></div>
      </div>
      <div class="card">
        <div class="card-h">字符串收发（按配置编码，默认 GBK）</div>
        <div class="row"><label>消息</label><input v-model="sc.message" /></div>
        <div class="row"><label>超时 ms</label><input type="number" v-model.number="sc.timeout" /></div>
        <div class="btns">
          <button class="btn" @click="sendString">发送并等待应答</button>
          <button class="btn ghost" @click="sendOnlyString">仅发送字符串(不等待)</button>
        </div>
      </div>
      <div class="card">
        <div class="card-h">十六进制字节收发</div>
        <div class="row"><label>HEX(空格分隔)</label><input v-model="sc.hex" placeholder="01 03 00 00 00 02" /></div>
        <div class="btns">
          <button class="btn" @click="sendBytes">发送字节并等待</button>
          <button class="btn ghost" @click="sendOnlyBytes">仅发送HEX(不等待)</button>
        </div>
      </div>
      <div class="card">
        <div class="card-h">长连接管理</div>
        <div class="row"><label>状态</label><span class="conn-text">{{ sc.longInfo }}</span></div>
        <div class="btns">
          <button class="btn" @click="openLong">打开长连接</button>
          <button class="btn warn" @click="closeLong">关闭长连接</button>
          <button class="btn ghost" @click="longStatus">刷新状态</button>
        </div>
      </div>
    </div>
  </section>
</template>
<script>
import mixin from '../mixins/api'
export default {
  name: 'SocketClientPage', mixins: [mixin],
  data() { return { sc: { device:'',devices:[],message:'',timeout:1000,hex:'',longInfo:'未查询' }, status:{} } },
  created() { this.load() },
  methods: {
    async load() { const r = await this.run(this.api.sockClient.devices); if (r && r.code === 200) { this.sc.devices = r.data || []; if (!this.sc.device && this.sc.devices[0]) this.sc.device = this.sc.devices[0] } },
    async test() { await this.run(() => this.api.sockClient.test({ deviceCode: this.sc.device }), '连通测试') },
    async sendString() { await this.run(() => this.api.sockClient.sendString({ deviceCode: this.sc.device, message: this.sc.message, timeoutMs: this.sc.timeout }), '字符串收发') },
    async sendOnlyString() { await this.run(() => this.api.sockClient.sendOnlyString({ deviceCode: this.sc.device, message: this.sc.message, timeoutMs: this.sc.timeout }), '仅发送字符串') },
    async sendOnlyBytes() { await this.run(() => this.api.sockClient.sendOnly({ deviceCode: this.sc.device, data: this.sc.hex, timeoutMs: this.sc.timeout }), '仅发送HEX') },
    async sendBytes() { const data = this.hexToBytes(this.sc.hex); await this.run(() => this.api.sockClient.sendBytes({ deviceCode: this.sc.device, data, timeoutMs: this.sc.timeout }), '字节收发') },
    async openLong() { await this.run(() => this.api.sockClient.openLong({ deviceCode: this.sc.device }), '打开长连接') },
    async closeLong() { await this.run(() => this.api.sockClient.closeLong({ deviceCode: this.sc.device }), '关闭长连接') },
    async longStatus() { const r = await this.run(() => this.api.sockClient.longStatus({ deviceCode: this.sc.device }), '长连接状态'); if (r && r.code === 200) { const s = r.data || {}; this.sc.longInfo = s.isOpen ? ('已连接 ' + (s.connectedSince || '') + ' 收发 ' + (s.bytesSent||0) + '/' + (s.bytesReceived||0) + 'B') : '未连接' } },
    async check() { const r = await this.run(this.api.sockClient.deviceStatus, '检测状态'); if (r && r.code === 200) this.status = r.data || {} }
  }
}
</script>
