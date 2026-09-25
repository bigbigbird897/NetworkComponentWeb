<template>
  <section class="panel">
    <h2 class="panel-title">{{ mode === 'tcp' ? 'Modbus TCP' : 'Modbus RTU over TCP' }}</h2>
    <div class="toolbar">
      <label>设备</label>
      <select v-model="mb.device" class="sel">
        <option v-for="d in mb.devices" :key="d" :value="d">{{ d }}</option>
      </select>
      <button class="btn ghost" @click="loadDevices">刷新设备</button>
    </div>
    <div class="grid two">
      <div class="card">
        <div class="card-h">读取</div>
        <div class="row"><label>起始地址</label><input type="number" v-model.number="mb.start" /></div>
        <div class="row"><label>数量</label><input type="number" v-model.number="mb.count" /></div>
        <div class="btns">
          <button class="btn" @click="mbRead('readRegister')">读保持寄存器 03</button>
          <button class="btn" @click="mbRead('readInputRegister')">读输入寄存器 04</button>
          <button class="btn" @click="mbRead('readCoil')">读线圈 01</button>
          <button class="btn" @click="mbRead('readDiscreteInput')">读离散输入 02</button>
        </div>
      </div>
      <div class="card">
        <div class="card-h">写入</div>
        <div class="row"><label>寄存器/线圈地址</label><input type="number" v-model.number="mb.addr" /></div>
        <div class="row"><label>单值 (HEX/十进制)</label><input v-model="mb.value" /></div>
        <div class="btns">
          <button class="btn warn" @click="mbWriteSingleReg">写单寄存器 06</button>
          <button class="btn warn" @click="mbWriteSingleCoil(true)">写线圈 ON 05</button>
          <button class="btn warn" @click="mbWriteSingleCoil(false)">写线圈 OFF 05</button>
        </div>
      </div>
      <div class="card">
        <div class="card-h">批量写</div>
        <div class="row"><label>寄存器值(逗号分隔)</label><input v-model="mb.regsCsv" placeholder="100,200,300" /></div>
        <div class="row"><label>起始地址</label><input type="number" v-model.number="mb.multiStart" /></div>
        <div class="row"><label>线圈值(逗号分隔 true/false)</label><input v-model="mb.boolsCsv" placeholder="true,false,true" /></div>
        <div class="btns">
          <button class="btn warn" @click="mbWriteMultiReg">写多寄存器 10</button>
          <button class="btn warn" @click="mbWriteMultiCoil">写多线圈 0F</button>
        </div>
      </div>
      <div v-if="mode === 'tcp'" class="card">
        <div class="card-h">原始报文（MBAP+PDU）</div>
        <div class="row"><label>HEX 字节(空格分隔)</label><input v-model="mb.hex" placeholder="00 01 00 00 00 06 01 03 00 00 00 01" /></div>
        <div class="btns"><button class="btn" @click="mbSendRaw">发送原始报文</button></div>
      </div>
      <div class="card">
        <div class="card-h">设备在线状态</div>
        <div class="dev-status">
          <div v-for="(on, code) in mb.deviceStatuses" :key="code" class="dev-item">
            <span class="dot" :class="on ? 'on' : 'off'"></span>
            <span class="dev-code">{{ code }}</span>
            <span class="dev-txt">{{ on ? '在线' : '离线' }}</span>
          </div>
          <div v-if="!Object.keys(mb.deviceStatuses).length" class="dev-empty">点击下方按钮检测</div>
        </div>
        <div class="btns"><button class="btn ghost" @click="mbCheckStatus">检测在线状态</button></div>
      </div>
      <div v-if="mode === 'rtu'" class="card">
        <div class="card-h">Modbus RTU CRC 16校验码计算器</div>
        <div class="crc-row">
          <input class="base-input crc-input" v-model="mb.crcInput" @input="onCrcInput" placeholder="输入命令（不含CRC）" />
          <div class="crc-result">{{ mb.crcDisplay || 'FF FF' }}</div>
          <button class="btn ghost" @click="copyCrc">复制</button>
        </div>
      </div>
      <div class="card">
        <div class="card-h">最近一次原始报文</div>
        <div class="row"><label>请求(hex)</label><code class="hex">{{ mb.lastReq || '—' }}</code></div>
        <div class="row"><label>响应(hex)</label><code class="hex">{{ mb.lastResp || '—' }}</code></div>
      </div>
    </div>
  </section>
</template>
<script>
import mixin from '../../mixins/api'
export default {
  name: 'ModbusPage', mixins: [mixin],
  props: { mode: { type: String, default: 'rtu' } },
  data() { return { mb: { device:'',devices:[],start:0,count:6,addr:0,value:'',regsCsv:'',boolsCsv:'',hex:'',deviceStatuses:{},crcInput:'',crcDisplay:'',multiStart:0,lastReq:'',lastResp:'' } } },
  created() {
    this.loadDevices()
    this.$root.$on('mb-raw', p => { this.mb.lastReq = p.req; this.mb.lastResp = p.resp })
  },
  methods: {
    mbApi() { return this.mode === 'tcp' ? this.api.modbusTcp : this.api.modbusRtu },
    async loadDevices() { const r = await this.run(this.mbApi().devices); if (r && r.code === 200) { this.mb.devices = r.data || []; if (!this.mb.device && this.mb.devices[0]) this.mb.device = this.mb.devices[0] } },
    async mbRead(kind) { const q = { deviceCode: this.mb.device, startAddr: this.mb.start, count: this.mb.count }; await this.run(() => this.mbApi()[kind](q), kind) },
    async mbWriteSingleReg() { await this.run(() => this.mbApi().writeSingleRegister({ deviceCode: this.mb.device, addr: this.mb.addr, value: this.num(this.mb.value) }), '写单寄存器') },
    async mbWriteSingleCoil(on) { await this.run(() => this.mbApi().writeSingleCoil({ deviceCode: this.mb.device, addr: this.mb.addr, value: on }), '写线圈 ' + on) },
    async mbWriteMultiReg() { const values = this.csvNums(this.mb.regsCsv); await this.run(() => this.mbApi().writeMultiRegister({ deviceCode: this.mb.device, startAddr: this.mb.multiStart, value: values }), '写多寄存器') },
    async mbWriteMultiCoil() { const values = this.csvBools(this.mb.boolsCsv); await this.run(() => this.mbApi().writeMultiCoil({ deviceCode: this.mb.device, startAddr: this.mb.start, values }), '写多线圈') },
    async mbSendRaw() { const bytes = this.hexToBytes(this.mb.hex); await this.run(() => this.api.modbusTcp.sendRaw({ deviceCode: this.mb.device, tcpPacketBytes: bytes }), '原始报文') },
    async mbCheckStatus() { const r = await this.run(this.mbApi().deviceStatus, '检测设备状态'); if (r && r.code === 200) this.mb.deviceStatuses = r.data || {} },
    onCrcInput() {
      const hex = (this.mb.crcInput || '').trim().replace(/[,，\s]+/g, ' ').trim()
      if (!hex) { this.mb.crcDisplay = ''; return }
      const bytes = hex.split(' ').filter(Boolean).map(h => parseInt(h, 16))
      if (bytes.some(b => isNaN(b))) { this.mb.crcDisplay = ''; return }
      let crc = 0xFFFF
      for (const b of bytes) { crc ^= b; for (let i = 0; i < 8; i++) crc = (crc & 1) ? ((crc >> 1) ^ 0xA001) : (crc >> 1) }
      this.mb.crcDisplay = (crc & 0xFF).toString(16).toUpperCase().padStart(2, '0') + ' ' + ((crc >> 8) & 0xFF).toString(16).toUpperCase().padStart(2, '0')
    },
    copyCrc() { if (navigator.clipboard) navigator.clipboard.writeText(this.mb.crcDisplay || 'FF FF') }
  }
}
</script>
