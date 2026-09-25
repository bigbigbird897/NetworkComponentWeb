<template>
  <section class="panel">
    <h2 class="panel-title">OPC UA</h2>
    <div class="toolbar">
      <label>设备</label>
      <select v-model="opc.device" class="sel">
        <option v-for="d in opc.devices" :key="d" :value="d">{{ d }}</option>
      </select>
      <button class="btn ghost" @click="load">刷新设备</button>
      <button class="btn ghost" @click="test">连接测试</button>
    </div>
    <div class="grid two">
      <div class="card" style="grid-column: 1 / -1">
        <div class="card-h">OPC UA 设备连接状态</div>
        <div class="dev-status">
          <div v-for="(on, code) in status" :key="code" class="dev-item">
            <span class="dot" :class="on ? 'on' : 'off'"></span>
            <span class="dev-code">{{ code }}</span>
            <span class="dev-txt">{{ on ? '在线' : '离线' }}</span>
          </div>
          <div v-if="!Object.keys(status).length" class="dev-empty">点击下方按钮检测</div>
        </div>
        <div class="btns"><button class="btn ghost" @click="check">检测状态</button></div>
      </div>
      <div class="card">
        <div class="card-h">读节点</div>
        <div class="row"><label>NodeId</label><input v-model="opc.nodeId" placeholder="ns=1;s=Counter" /></div>
        <div class="btns"><button class="btn" @click="readOne">读单个</button></div>
        <div class="row"><label>批量 NodeId(逗号分隔)</label><input v-model="opc.nodesCsv" placeholder="ns=1;s=A,ns=1;s=B" /></div>
        <div class="btns"><button class="btn" @click="readMany">批量读</button></div>
      </div>
      <div class="card">
        <div class="card-h">写节点</div>
        <div class="row"><label>NodeId</label><input v-model="opc.writeNode" /></div>
        <div class="row"><label>值</label><input v-model="opc.writeValue" /></div>
        <div class="btns"><button class="btn warn" @click="write">写入</button></div>
      </div>
    </div>
  </section>
</template>
<script>
import mixin from '../mixins/api'
export default {
  name: 'OpcUaPage', mixins: [mixin],
  data() { return { opc: { device:'',devices:[],nodeId:'',nodesCsv:'',writeNode:'',writeValue:'' }, status:{} } },
  created() { this.load() },
  methods: {
    async load() { const r = await this.run(this.api.opcua.devices); if (r && r.code === 200) { this.opc.devices = r.data || []; if (!this.opc.device && this.opc.devices[0]) this.opc.device = this.opc.devices[0] } },
    async test() { await this.run(() => this.api.opcua.test({ deviceCode: this.opc.device }), '连接测试') },
    async readOne() { await this.run(() => this.api.opcua.readNode({ deviceCode: this.opc.device, nodeId: this.opc.nodeId }), '读单节点') },
    async readMany() { const ids = this.opc.nodesCsv.split(',').map(s => s.trim()).filter(Boolean); await this.run(() => this.api.opcua.readNodes({ deviceCode: this.opc.device, nodeIds: ids }), '批量读') },
    async write() { await this.run(() => this.api.opcua.writeNode({ deviceCode: this.opc.device, nodeId: this.opc.writeNode, value: this.opc.writeValue }), '写节点') },
    async check() { const r = await this.run(this.api.opcua.deviceStatus, '检测状态'); if (r && r.code === 200) this.status = r.data || {} }
  }
}
</script>
