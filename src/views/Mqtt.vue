<template>
  <section class="panel">
    <h2 class="panel-title">MQTT</h2>
    <div class="toolbar">
      <label>客户端</label>
      <select v-model="mq.clientId" class="sel">
        <option v-for="d in mq.devices" :key="d" :value="d">{{ d }}</option>
      </select>
      <button class="btn ghost" @click="load">刷新客户端</button>
    </div>
    <div class="grid two">
      <div class="card">
        <div class="card-h">MQTT Broker 连接状态</div>
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
        <div class="card-h">发布消息（向指定主题推送）</div>
        <div class="row"><label>发布主题</label><input v-model="mq.topic" list="pubTopicList" placeholder="nc/sendfromsoft/" /></div>
        <div class="row"><label>消息内容</label><input v-model="mq.msg" /></div>
        <div class="btns"><button class="btn" @click="act('publish')">发布消息</button></div>
      </div>
      <div class="card">
        <div class="card-h">托管订阅（订阅主题后，该主题消息进入下方「订阅主题消息」列表）</div>
        <div class="row"><label>订阅主题</label><input v-model="mq.subTopic" list="subTopicList" placeholder="nc/sendfrommqttx/" /></div>
        <div class="btns">
          <button class="btn" @click="act('sub')">订阅主题</button>
          <button class="btn ghost" @click="act('unsub')">取消订阅</button>
        </div>
      </div>
    </div>
    <div class="card" style="margin-top:12px">
      <div class="card-h">发送并等待应答</div>
      <div class="grid two">
        <div>
          <div class="row"><label>发送主题</label><input v-model="mq.topicSend" list="sendTopicList" placeholder="发送主题" /></div>
          <div class="row"><label>Payload</label><input v-model="mq.sendPayload" /></div>
        </div>
        <div>
          <div class="row"><label>应答主题</label><input v-model="mq.topicReply" list="replyTopicList" placeholder="应答主题" /></div>
          <div class="row"><label>超时 ms</label><input type="number" v-model.number="mq.timeout" /></div>
        </div>
      </div>
      <div class="btns">
        <button class="btn" @click="wait">发送并等待</button>
        <span v-if="mq.lastWait" class="conn-text" :style="{marginLeft:'10px', color: mq.lastWait.isSuccess ? '#2e7d32' : '#c62828'}">
          最近结果：{{ mq.lastWait.isSuccess ? '✔ 已收到应答' : (mq.lastWait.isTimeout ? '✘ 等待超时' : '✘ 失败') }}
        </span>
      </div>
      <pre v-if="mq.lastWait" class="pre" style="max-height:140px;margin-top:8px">应答内容：{{ typeof mq.lastWait.responsePayload === 'string' ? mq.lastWait.responsePayload : JSON.stringify(mq.lastWait.responsePayload) }}</pre>
    </div>
    <div class="grid two" style="margin-top:12px">
      <div class="card">
        <div class="card-h">订阅主题消息（{{ mq.subTopic || '未设置主题' }}）— 订阅后轮询显示</div>
        <div class="btns" style="margin-bottom:8px">
          <button class="btn ghost sm" @click="startSub">开始轮询</button>
          <button class="btn ghost sm" @click="stopSub">停止轮询</button>
          <button class="btn ghost sm" @click="refreshSub">刷新</button>
          <button class="btn warn sm" @click="mq.subMessages = []">清空</button>
          <span class="conn-text" :style="{'margin-left':'6px'}">{{ mq.pollSub ? '● 轮询中' : '○ 已停止' }}</span>
        </div>
        <pre class="pre" style="max-height:280px">{{ msgText(mq.subMessages) }}</pre>
      </div>
      <div class="card">
        <div class="card-h">应答主题消息（{{ mq.topicReply || '未设置应答主题' }}）— 其他客户端发来的应答</div>
        <div class="btns" style="margin-bottom:8px">
          <button class="btn ghost sm" @click="startReply">开始轮询</button>
          <button class="btn ghost sm" @click="stopReply">停止轮询</button>
          <button class="btn ghost sm" @click="refreshReply">刷新</button>
          <button class="btn warn sm" @click="mq.replyMessages = []">清空</button>
          <span class="conn-text" :style="{'margin-left':'6px'}">{{ mq.pollReply ? '● 轮询中' : '○ 已停止' }}</span>
        </div>
        <pre class="pre" style="max-height:280px">{{ msgText(mq.replyMessages) }}</pre>
      </div>
    </div>
    <datalist id="pubTopicList"><option v-for="t in mq.pubHist" :key="t" :value="t"></option></datalist>
    <datalist id="subTopicList"><option v-for="t in mq.subHist" :key="t" :value="t"></option></datalist>
    <datalist id="sendTopicList"><option v-for="t in mq.sendHist" :key="t" :value="t"></option></datalist>
    <datalist id="replyTopicList"><option v-for="t in mq.replyHist" :key="t" :value="t"></option></datalist>
  </section>
</template>
<script>
import mixin from '../mixins/api'
export default {
  name: 'MqttPage', mixins: [mixin],
  data() { return { mq: { clientId:'',devices:[],topic:'',msg:'',subTopic:'',topicSend:'',topicReply:'',sendPayload:'',timeout:3000,subMessages:[],replyMessages:[],pollSub:false,pollReply:false,subTimer:null,replyTimer:null,lastWait:null,pubHist:[],subHist:[],sendHist:[],replyHist:[] }, status:{} } },
  created() { this.loadHist(); this.load() },
  beforeDestroy() { this.stopSub(); this.stopReply() },
  methods: {
    loadHist() {
      try {
        this.mq.pubHist = JSON.parse(localStorage.getItem('nc_mqtt_pub') || '[]')
        this.mq.subHist = JSON.parse(localStorage.getItem('nc_mqtt_sub') || '[]')
        this.mq.sendHist = JSON.parse(localStorage.getItem('nc_mqtt_send') || '[]')
        this.mq.replyHist = JSON.parse(localStorage.getItem('nc_mqtt_reply') || '[]')
      } catch (e) {}
    },
    pushHist(kind, topic) {
      if (!topic) return
      const arr = this.mq[kind].filter(t => t !== topic); arr.unshift(topic); this.mq[kind] = arr.slice(0, 20)
      const keys = { pubHist:'nc_mqtt_pub', subHist:'nc_mqtt_sub', sendHist:'nc_mqtt_send', replyHist:'nc_mqtt_reply' }
      localStorage.setItem(keys[kind], JSON.stringify(this.mq[kind]))
    },
    async load() { const r = await this.run(this.api.mqtt.devices); if (r && r.code === 200) { this.mq.devices = r.data || []; if (!this.mq.clientId && this.mq.devices[0]) this.mq.clientId = this.mq.devices[0] } },
    async act(kind) {
      const q = kind === 'publish' ? { clientId: this.mq.clientId, topic: this.mq.topic, msg: this.mq.msg } : { clientId: this.mq.clientId, topic: this.mq.subTopic }
      const r = await this.run(() => this.api.mqtt[kind](q), kind)
      if (r && r.code === 200) {
        if (kind === 'publish' && this.mq.topic) this.pushHist('pubHist', this.mq.topic)
        if (kind === 'sub' && this.mq.subTopic) this.pushHist('subHist', this.mq.subTopic)
      }
      if (kind === 'sub' && r && r.code === 200) this.startSub()
      if (kind === 'unsub' && r && r.code === 200) { this.stopSub(); this.mq.subMessages = [] }
    },
    async wait() {
      const r = await this.run(() => this.api.mqtt.publishWait({ clientId: this.mq.clientId, topicSend: this.mq.topicSend, sendPayload: this.mq.sendPayload, topicReply: this.mq.topicReply, timeoutMs: this.mq.timeout }), '发送并等待')
      if (r && r.code === 200) {
        this.mq.lastWait = r.data || null
        if (this.mq.topicSend) this.pushHist('sendHist', this.mq.topicSend)
        if (this.mq.topicReply) this.pushHist('replyHist', this.mq.topicReply)
        if (this.mq.topicReply) this.startReply()
      }
    },
    startSub() { this.stopSub(); this.mq.pollSub = true; this.refreshSub(); this.mq.subTimer = setInterval(() => this.refreshSub(), 2000) },
    stopSub() { this.mq.pollSub = false; if (this.mq.subTimer) { clearInterval(this.mq.subTimer); this.mq.subTimer = null } },
    async refreshSub() { if (!this.mq.subTopic) return; try { const r = await this.api.mqtt.received({ clientId: this.mq.clientId, topic: this.mq.subTopic }); if (r && r.code === 200) this.mq.subMessages = r.data || [] } catch (e) {} },
    startReply() { this.stopReply(); this.mq.pollReply = true; this.refreshReply(); this.mq.replyTimer = setInterval(() => this.refreshReply(), 2000) },
    stopReply() { this.mq.pollReply = false; if (this.mq.replyTimer) { clearInterval(this.mq.replyTimer); this.mq.replyTimer = null } },
    async refreshReply() { if (!this.mq.topicReply) return; try { const r = await this.api.mqtt.received({ clientId: this.mq.clientId, topic: this.mq.topicReply }); if (r && r.code === 200) this.mq.replyMessages = r.data || [] } catch (e) {} },
    msgText(list) { const a = list || []; return a.length ? a.map(m => `[${m.receiveTime}] ${m.payload}`).join('\n') : '（暂无消息）' },
    async check() { const r = await this.run(this.api.mqtt.deviceStatus, '检测状态'); if (r && r.code === 200) this.status = r.data || {} }
  }
}
</script>
