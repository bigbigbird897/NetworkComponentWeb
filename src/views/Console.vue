<template>
  <div class="io-shell" :class="theme">
    <!-- 顶栏 -->
    <header class="io-topbar">
      <div class="brand">
        <span class="logo-dot"></span>
        <span class="brand-name">工业通信中台</span>
        <span class="brand-ver">v1.0 CONSOLE</span>
      </div>
      <div class="topbar-right">
        <span class="lbl">服务地址</span>
        <input class="base-input" v-model="baseUrl" placeholder="留空=同源代理，如 http://192.168.3.9:5000" />
        <button class="btn ghost" @click="applyBase">应用</button>
        <span class="dot" :class="connState"></span>
        <span class="conn-text">{{ connText }}</span>
        <button class="btn ghost" @click="toggleTheme">{{ theme === 'dark' ? '☀ 浅色' : '🌙 夜间' }}</button>
      </div>
    </header>

    <div class="io-body">
      <!-- 左侧导航 -->
      <aside class="io-nav">
        <div
          v-for="m in menus"
          :key="m.key"
          class="nav-item"
          :class="{ active: active === m.key }"
          @click="active = m.key"
        >
          <span class="nav-ico">{{ m.icon }}</span>{{ m.label }}
        </div>
      </aside>

      <!-- 内容区 -->
      <main class="io-main">
        <!-- 授权 -->
        <section v-if="active === 'license'" class="panel">
          <h2 class="panel-title">授权状态 / 机器码</h2>
          <div class="grid">
            <div class="card">
              <div class="card-h">本机机器码（发给软件商申请 license）</div>
              <div class="machine">{{ machineCode || '—' }}</div>
              <button class="btn" @click="loadMachineCode">刷新机器码</button>
            </div>
            <div class="card">
              <div class="card-h">授权状态</div>
              <pre class="pre"><code v-html="statusHtml"></code></pre>
              <button class="btn" @click="loadLicense">刷新状态</button>
            </div>
          </div>
        </section>

        <!-- Modbus -->
        <section v-if="active === 'tcp' || active === 'rtu'" class="panel">
          <h2 class="panel-title">{{ active === 'tcp' ? 'Modbus TCP' : 'Modbus RTU over TCP' }}</h2>
          <div class="toolbar">
            <label>设备</label>
            <select v-model="mb.device" class="sel">
              <option v-for="d in mb.devices" :key="d" :value="d">{{ d }}</option>
            </select>
            <button class="btn ghost" @click="loadModbusDevices">刷新设备</button>
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
              <div class="row"><label>线圈值(逗号分隔 true/false)</label><input v-model="mb.boolsCsv" placeholder="true,false,true" /></div>
              <div class="btns">
                <button class="btn warn" @click="mbWriteMultiReg">写多寄存器 10</button>
                <button class="btn warn" @click="mbWriteMultiCoil">写多线圈 0F</button>
              </div>
            </div>
            <div v-if="active === 'tcp'" class="card">
              <div class="card-h">原始报文（MBAP+PDU）</div>
              <div class="row"><label>HEX 字节(空格分隔)</label><input v-model="mb.hex" placeholder="00 01 00 00 00 06 01 03 00 00 00 01" /></div>
              <div class="btns"><button class="btn" @click="mbSendRaw">发送原始报文</button></div>
            </div>
          </div>
        </section>

        <!-- MQTT -->
        <section v-if="active === 'mqtt'" class="panel">
          <h2 class="panel-title">MQTT</h2>
          <div class="toolbar">
            <label>客户端</label>
            <select v-model="mq.clientId" class="sel">
              <option v-for="d in mq.devices" :key="d" :value="d">{{ d }}</option>
            </select>
            <button class="btn ghost" @click="loadMqttDevices">刷新客户端</button>
          </div>
          <div class="grid two">
            <div class="card">
              <div class="card-h">发布消息（向指定主题推送）</div>
              <div class="row"><label>发布主题</label><input v-model="mq.topic" placeholder="factory/zone/z" /></div>
              <div class="row"><label>消息内容</label><input v-model="mq.msg" /></div>
              <div class="btns"><button class="btn" @click="mqAction('publish')">发布消息</button></div>
            </div>
            <div class="card">
              <div class="card-h">托管订阅（订阅主题后，该主题消息进入下方「订阅主题消息」列表）</div>
              <div class="row"><label>订阅主题</label><input v-model="mq.subTopic" placeholder="factory/zone/z" /></div>
              <div class="btns">
                <button class="btn" @click="mqAction('sub')">订阅主题</button>
                <button class="btn ghost" @click="mqAction('unsub')">取消订阅</button>
              </div>
            </div>
          </div>
          <div class="card" style="margin-top:12px">
            <div class="card-h">发送并等待应答</div>
            <div class="grid two">
              <div>
                <div class="row"><label>发送主题</label><input v-model="mq.topicSend" /></div>
                <div class="row"><label>Payload</label><input v-model="mq.sendPayload" /></div>
              </div>
              <div>
                <div class="row"><label>应答主题</label><input v-model="mq.topicReply" /></div>
                <div class="row"><label>超时 ms</label><input type="number" v-model.number="mq.timeout" /></div>
              </div>
            </div>
            <div class="btns">
              <button class="btn" @click="mqWait">发送并等待</button>
              <span v-if="mq.lastWait" class="conn-text" :style="{marginLeft:'10px', color: mq.lastWait.isSuccess ? '#2e7d32' : '#c62828'}">
                最近结果：{{ mq.lastWait.isSuccess ? '✔ 已收到应答' : (mq.lastWait.isTimeout ? '✘ 等待超时' : '✘ 失败') }}
              </span>
            </div>
            <pre v-if="mq.lastWait" class="pre" style="max-height:140px;margin-top:8px">应答内容：{{ typeof mq.lastWait.responsePayload === 'string' ? mq.lastWait.responsePayload : JSON.stringify(mq.lastWait.responsePayload) }}</pre>
          </div>
          <div class="grid two" style="margin-top:12px">
            <div class="card">
              <div class="card-h">订阅主题消息（{{ mq.subTopic || '未设置主题' }}）— 订阅后轮询显示，收到即追加</div>
              <div class="btns" style="margin-bottom:8px">
                <button class="btn ghost sm" @click="mqStartPollSub">开始轮询</button>
                <button class="btn ghost sm" @click="mqStopPollSub">停止轮询</button>
                <button class="btn ghost sm" @click="mqRefreshSub">刷新</button>
                <button class="btn warn sm" @click="mq.subMessages = []">清空</button>
                <span class="conn-text" :style="{'margin-left':'6px'}">{{ mq.pollSub ? '● 轮询中' : '○ 已停止' }}</span>
              </div>
              <pre class="pre mq-msg" style="max-height:280px">{{ mqMsgText(mq.subMessages) }}</pre>
            </div>
            <div class="card">
              <div class="card-h">应答主题消息（{{ mq.topicReply || '未设置应答主题' }}）— 其他客户端发来的应答</div>
              <div class="btns" style="margin-bottom:8px">
                <button class="btn ghost sm" @click="mqStartPollReply">开始轮询</button>
                <button class="btn ghost sm" @click="mqStopPollReply">停止轮询</button>
                <button class="btn ghost sm" @click="mqRefreshReply">刷新</button>
                <button class="btn warn sm" @click="mq.replyMessages = []">清空</button>
                <span class="conn-text" :style="{'margin-left':'6px'}">{{ mq.pollReply ? '● 轮询中' : '○ 已停止' }}</span>
              </div>
              <pre class="pre mq-msg" style="max-height:280px">{{ mqMsgText(mq.replyMessages) }}</pre>
            </div>
          </div>
          <!-- MQTT 主题历史下拉（localStorage 持久化，点输入框即可选择历史主题） -->
          <datalist id="pubTopicList"><option v-for="t in mq.pubHist" :key="t" :value="t"></option></datalist>
          <datalist id="subTopicList"><option v-for="t in mq.subHist" :key="t" :value="t"></option></datalist>
          <datalist id="sendTopicList"><option v-for="t in mq.sendHist" :key="t" :value="t"></option></datalist>
          <datalist id="replyTopicList"><option v-for="t in mq.replyHist" :key="t" :value="t"></option></datalist>
        </section>

        <!-- OPC UA -->
        <section v-if="active === 'opc'" class="panel">
          <h2 class="panel-title">OPC UA</h2>
          <div class="toolbar">
            <label>设备</label>
            <select v-model="opc.device" class="sel">
              <option v-for="d in opc.devices" :key="d" :value="d">{{ d }}</option>
            </select>
            <button class="btn ghost" @click="loadOpcDevices">刷新设备</button>
            <button class="btn ghost" @click="opcTest">连接测试</button>
          </div>
          <div class="grid two">
            <div class="card">
              <div class="card-h">读节点</div>
              <div class="row"><label>NodeId</label><input v-model="opc.nodeId" placeholder="ns=1;s=Counter" /></div>
              <div class="btns"><button class="btn" @click="opcReadOne">读单个</button></div>
              <div class="row"><label>批量 NodeId(逗号分隔)</label><input v-model="opc.nodesCsv" placeholder="ns=1;s=A,ns=1;s=B" /></div>
              <div class="btns"><button class="btn" @click="opcReadMany">批量读</button></div>
            </div>
            <div class="card">
              <div class="card-h">写节点</div>
              <div class="row"><label>NodeId</label><input v-model="opc.writeNode" /></div>
              <div class="row"><label>值</label><input v-model="opc.writeValue" /></div>
              <div class="btns"><button class="btn warn" @click="opcWrite">写入</button></div>
            </div>
          </div>
        </section>

        <!-- Socket 客户端 -->
        <section v-if="active === 'sockc'" class="panel">
          <h2 class="panel-title">Socket 客户端（短连接 / 长连接）</h2>
          <div class="toolbar">
            <label>设备</label>
            <select v-model="sc.device" class="sel">
              <option v-for="d in sc.devices" :key="d" :value="d">{{ d }}</option>
            </select>
            <button class="btn ghost" @click="loadScDevices">刷新设备</button>
            <button class="btn ghost" @click="scTest">连通测试</button>
          </div>
          <div class="grid two">
            <div class="card">
              <div class="card-h">字符串收发（按配置编码，默认 GBK）</div>
              <div class="row"><label>消息</label><input v-model="sc.message" /></div>
              <div class="row"><label>超时 ms</label><input type="number" v-model.number="sc.timeout" /></div>
              <div class="btns">
                <button class="btn" @click="scSendString">发送并等待应答</button>
                <button class="btn ghost" @click="scSendOnlyString">仅发送字符串(不等待)</button>
              </div>
            </div>
            <div class="card">
              <div class="card-h">十六进制字节收发（Data 支持数组或 HEX 字符串）</div>
              <div class="row"><label>HEX(空格分隔)</label><input v-model="sc.hex" placeholder="01 03 00 00 00 02" /></div>
              <div class="btns">
                <button class="btn" @click="scSendBytes">发送字节并等待</button>
                <button class="btn ghost" @click="scSendOnlyBytes">仅发送HEX(不等待)</button>
              </div>
            </div>
            <div class="card">
              <div class="card-h">长连接管理（配置 UseLongConnection=true 自动生效；也可手动开关）</div>
              <div class="row"><label>状态</label><span class="conn-text">{{ sc.longInfo }}</span></div>
              <div class="btns">
                <button class="btn" @click="scOpenLong">打开长连接</button>
                <button class="btn warn" @click="scCloseLong">关闭长连接</button>
                <button class="btn ghost" @click="scLongStatus">刷新状态</button>
              </div>
            </div>
          </div>
        </section>

        <!-- Socket 服务端 -->
        <section v-if="active === 'socks'" class="panel">
          <h2 class="panel-title">Socket 服务端（监听端）</h2>
          <div class="toolbar">
            <label>服务端</label>
            <select v-model="ss.server" class="sel">
              <option v-for="d in ss.servers" :key="d" :value="d">{{ d }}</option>
            </select>
            <button class="btn ghost" @click="loadSsServers">刷新服务端</button>
            <button class="btn" @click="ssStart">启动监听</button>
            <button class="btn warn" @click="ssStop">停止监听</button>
          </div>
          <div class="grid two">
            <div class="card">
              <div class="card-h">在线客户端 / 最近消息</div>
              <div class="btns">
                <button class="btn ghost" @click="ssClients">刷新在线客户端</button>
                <button class="btn ghost" @click="ssRecent">刷新最近消息</button>
              </div>
            </div>
            <div class="card">
              <div class="card-h">下发数据</div>
              <div class="row"><label>客户端(IP:Port)</label><input v-model="ss.clientId" placeholder="192.168.x.x:port" /></div>
              <div class="row"><label>消息</label><input v-model="ss.message" /></div>
              <div class="btns">
                <button class="btn" @click="ssSendString">发指定客户端</button>
                <button class="btn" @click="ssBroadcastString">广播字符串</button>
              </div>
            </div>
          </div>
        </section>

        <!-- 记事本 -->
        <section v-if="active === 'notes'" class="panel">
          <h2 class="panel-title">记事本（文件保存在后端 notes 目录）</h2>
          <div class="toolbar">
            <input class="base-input" style="width:240px" v-model="notes.keyword" placeholder="按文件名搜索" @keyup.enter="loadNotes" />
            <button class="btn ghost" @click="loadNotes">搜索</button>
            <button class="btn" @click="newNote">新建</button>
          </div>
          <div class="grid two">
            <div class="card">
              <div class="card-h">文件列表（{{ noteList.length }}）</div>
              <table class="tbl">
                <thead><tr><th>文件名</th><th>修改时间</th><th>大小</th><th>操作</th></tr></thead>
                <tbody>
                  <tr v-for="n in noteList" :key="n.name" :class="{selrow: noteEdit.name===n.name}">
                    <td>{{ n.name }}</td>
                    <td>{{ n.modified }}</td>
                    <td>{{ n.size }} B</td>
                    <td>
                      <button class="btn ghost sm" @click="editNote(n)">编辑</button>
                      <button class="btn warn sm" @click="delNote(n)">删除</button>
                    </td>
                  </tr>
                  <tr v-if="!noteList.length"><td colspan="4" class="empty">暂无文件</td></tr>
                </tbody>
              </table>
            </div>
            <div class="card">
              <div class="card-h">{{ noteEdit.name ? '编辑：' + noteEdit.name : '新建记事本' }}</div>
              <div class="row"><label>文件名</label><input v-model="noteEdit.name" placeholder="例如 巡检记录.txt" :disabled="!!noteEdit.loaded" /></div>
              <textarea v-model="noteEdit.content" class="editor-ta" spellcheck="false"></textarea>
              <div class="btns">
                <button class="btn" @click="saveNote">保存</button>
                <button class="btn ghost" @click="noteEdit={name:'',content:'',loaded:false}">清空</button>
              </div>
            </div>
          </div>
        </section>

        <!-- 日志查看 -->
        <section v-if="active === 'logs'" class="panel">
          <h2 class="panel-title">日志查看（logs 目录，按天滚动）</h2>
          <div class="toolbar">
            <label>开始日期</label>
            <input type="date" v-model="logStart" class="sel" style="min-width:160px" />
            <label>结束日期</label>
            <input type="date" v-model="logEnd" class="sel" style="min-width:160px" />
            <button class="btn ghost" @click="loadLogs">查询</button>
            <button class="btn ghost" @click="logStart='';logEnd='';loadLogs">全部</button>
            <button class="btn warn" @click="deleteSelectedLogs">删除选中</button>
          </div>
          <div class="grid two">
            <div class="card">
              <div class="card-h">日志文件（{{ logList.length }}）— 点行前勾选，双击或点查看读内容</div>
              <table class="tbl">
                <thead><tr><th><input type="checkbox" @change="toggleAllLogs($event)" /></th><th>文件名</th><th>大小</th><th>修改时间</th><th>操作</th></tr></thead>
                <tbody>
                  <tr v-for="l in logList" :key="l.name">
                    <td><input type="checkbox" :value="l.name" v-model="logChecked" /></td>
                    <td>{{ l.name }}</td>
                    <td>{{ l.size }} B</td>
                    <td>{{ l.modified }}</td>
                    <td><button class="btn ghost sm" @click="viewLog(l)">查看</button></td>
                  </tr>
                  <tr v-if="!logList.length"><td colspan="5" class="empty">无日志文件</td></tr>
                </tbody>
              </table>
            </div>
            <div class="card">
              <div class="card-h">日志内容：{{ logView.name || '—' }}（返回 {{ logView.returnedLines }}/{{ logView.totalLines }} 行）</div>
              <pre class="pre" style="max-height:480px">{{ logView.content }}</pre>
            </div>
          </div>
        </section>

        <!-- 关于 -->
        <section v-if="active === 'about'" class="panel">
          <h2 class="panel-title">关于本产品</h2>
          <div class="card about-card">
            <h3 class="about-h3">工业通信中台</h3>
            <p class="about-p">一套整合常用工业通信协议、开箱即用的后端服务 + Web 控制台 + Windows 桌面壳。
              开发者只需调用统一的 HTTP 接口，即可完成设备读写，无需自己对接各协议栈。</p>

            <div class="grid two" style="margin-top:14px">
              <div>
                <div class="card-h">产品优势</div>
                <ul class="about-ul">
                  <li><b>协议齐全</b>：内置 Modbus TCP / Modbus RTU over TCP、MQTT、OPC UA、Socket 客户端与多服务端。</li>
                  <li><b>统一接口</b>：所有协议都走 RESTful HTTP，返回统一 JSON 结构，第三方软件（WPF / WinForms / 其它服务）极易对接。</li>
                  <li><b>跨平台部署</b>：后端为 .NET 自包含发布，可跑 Windows / Linux，无需客户机安装运行时。</li>
                  <li><b>桌面一体</b>：WPF 外壳内嵌 WebView2 控制台，自动拉起并守护后端，关闭后驻留托盘。</li>
                  <li><b>可观测</b>：按天滚动日志、Web 端直接查看/清理；配置在线修改后自动重启生效。</li>
                  <li><b>授权可控</b>：单机永久授权 + 试用期宽限，支持 API Key、访问白名单，避免被内网任意调用。</li>
                </ul>
              </div>
              <div>
                <div class="card-h">联系购买 / 咨询</div>
                <p class="about-p">如需购买授权、定制协议或现场技术支持，请通过邮箱联系：</p>
                <p class="about-mail">dfxsd@foxmail.com</p>
                <p class="about-p" style="margin-top:10px">可提供：试用 License、部署包、二次开发对接说明与现场调试支持。</p>
              </div>
            </div>
          </div>
        </section>

        <!-- 系统配置 -->
        <section v-if="active === 'config'" class="panel">
          <h2 class="panel-title">系统配置（appsettings.json）</h2>
          <div class="card">
            <div class="card-h">完整 JSON 内容（修改后点保存，后端会自动重启加载新配置）</div>
            <div class="cfg-wrap">
              <pre class="cfg-highlight" ref="cfgHi" aria-hidden="true"><code v-html="cfgHtml"></code></pre>
              <textarea v-model="cfg.text" class="cfg-editor" spellcheck="false" wrap="off" @scroll="syncCfgScroll"></textarea>
            </div>
            <div class="btns">
              <button class="btn ghost" @click="loadConfig">读取配置</button>
              <button class="btn ghost" @click="formatConfig">格式化</button>
              <button class="btn warn" :disabled="cfg.saving" @click="saveConfig">{{ cfg.saving ? '保存并重启中...' : '保存并重启后端' }}</button>
            </div>
          </div>
        </section>

        <!-- 结果 -->
        <section class="panel result-panel">
          <div class="panel-hrow">
            <h2 class="panel-title">调用结果</h2>
            <button class="btn ghost" @click="clearResult">清空</button>
          </div>
          <pre class="pre result"><code v-html="resultHtml"></code></pre>
        </section>
      </main>
    </div>
  </div>
</template>

<script>
import * as api from '../api/console'
import hljs from 'highlight.js/lib/core'
import jsonLang from 'highlight.js/lib/languages/json'
import 'highlight.js/styles/github.css'
hljs.registerLanguage('json', jsonLang)

// HTML 转义
const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
// 若是 JSON 文本则做语法高亮，否则只转义
const highlightJson = (text) => {
  const t = String(text || '').trim()
  if (!t) return ''
  if (t[0] === '{' || t[0] === '[') {
    try { return hljs.highlight(t, { language: 'json' }).value } catch (e) { /* 不是合法 JSON */ }
  }
  return escapeHtml(text)
}

const num = (s, d = 0) => { const n = Number(s); return isNaN(n) ? d : n }
const csvNums = (text) => String(text || '').split(',').map(s => num(s.trim())).filter(n => !isNaN(n))
const csvBools = (text) => String(text || '').split(',').map(s => s.trim().toLowerCase() === 'true')
const hexToBytes = (text) => String(text || '').trim().split(/[\s,]+/).filter(Boolean).map(h => parseInt(h, 16))

export default {
  name: 'Console',
  data() {
    return {
      baseUrl: api.getBase(),
      connState: 'off',
      connText: '未连接',
      active: 'license',
      theme: localStorage.getItem('nc-theme') || 'light',
      menus: [
        { key: 'license', label: '授权状态', icon: '◈' },
        { key: 'tcp', label: 'Modbus TCP', icon: 'M' },
        { key: 'rtu', label: 'Modbus RTU', icon: 'R' },
        { key: 'mqtt', label: 'MQTT', icon: '⇄' },
        { key: 'opc', label: 'OPC UA', icon: '◉' },
        { key: 'sockc', label: 'Socket 客户端', icon: '⇦' },
        { key: 'socks', label: 'Socket 服务端', icon: '⇨' },
        { key: 'notes', label: '记事本', icon: '✎' },
        { key: 'logs', label: '日志查看', icon: '☰' },
        { key: 'about', label: '关于', icon: 'ℹ' },
        { key: 'config', label: '系统配置', icon: '⚙' }
      ],
      machineCode: '',
      statusText: '',
      result: '',
      mb: { device: '', devices: [], start: 0, count: 6, addr: 0, value: '', regsCsv: '', boolsCsv: '', hex: '' },
      mq: { clientId: '', devices: [], topic: '', msg: '', subTopic: 'factory/zone/z', topicSend: '', topicReply: '', sendPayload: '', timeout: 3000, subMessages: [], replyMessages: [], pollSub: false, pollReply: false, pollSubTimer: null, pollReplyTimer: null, lastWait: null, pubHist: [], subHist: [], sendHist: [], replyHist: [] },
      opc: { device: '', devices: [], nodeId: '', nodesCsv: '', writeNode: '', writeValue: '' },
      sc: { device: '', devices: [], message: '', timeout: 1000, hex: '', longInfo: '未查询' },
      ss: { server: '', servers: [], clientId: '', message: '' },
      cfg: { text: '', saving: false },
      notes: { keyword: '' },
      noteList: [],
      noteEdit: { name: '', content: '', loaded: false },
      logStart: '',
      logEnd: '',
      logList: [],
      logChecked: [],
      logView: { name: '', content: '', totalLines: 0, returnedLines: 0 }
    }
  },
  async mounted() {
    this.applyBase()
    this.mqLoadHist()
    await this.loadMachineCode()
    await this.loadLicense()
  },
  // 组件销毁前停止 MQTT 轮询定时器，避免页面关闭后仍在请求后端
  beforeDestroy() {
    this.mqStopPollSub && this.mqStopPollSub()
    this.mqStopPollReply && this.mqStopPollReply()
  },
  computed: {
    resultHtml() { return highlightJson(this.result) },
    statusHtml() { return highlightJson(this.statusText) },
    cfgHtml() {
      // 配置可能含 // 注释，hljs json 容错；失败时退回转义显示
      const t = String(this.cfg.text || '')
      try { return hljs.highlight(t, { language: 'json' }).value } catch (e) { return escapeHtml(t) }
    }
  },
  methods: {
    applyBase() {
      api.setBase(this.baseUrl)
      this.connText = '已应用'
      this.connState = 'wait'
    },
    toggleTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark'
      localStorage.setItem('nc-theme', this.theme)
    },
    // 配置编辑器：把 textarea 滚动同步到背后的高亮层
    syncCfgScroll() {
      const ta = this.$el.querySelector('.cfg-editor')
      const hi = this.$refs.cfgHi
      if (ta && hi) { hi.scrollTop = ta.scrollTop; hi.scrollLeft = ta.scrollLeft }
    },
    out(v) {
      this.result = typeof v === 'string' ? v : JSON.stringify(v, null, 2)
    },
    async run(fn, okHint) {
      try {
        const r = await fn()
        this.connState = 'on'; this.connText = '已连接'
        this.out(r && r.msg ? `${okHint || ''}\n${JSON.stringify(r, null, 2)}` : (r && r.code === 200 ? (okHint + ' ✔') : '') + '\n' + JSON.stringify(r, null, 2))
        return r
      } catch (e) {
        this.connState = 'off'; this.connText = '连接失败'
        this.out('✘ 请求失败：' + e.message + '\n请确认后端地址与网络/授权。')
      }
    },

    // 授权
    async loadMachineCode() {
      const r = await this.run(api.getMachineCode)
      if (r && r.code === 200) this.machineCode = r.data
    },
    async loadLicense() {
      const r = await this.run(api.getLicenseStatus)
      if (r && r.code === 200) this.statusText = JSON.stringify(r.data, null, 2)
    },

    // Modbus
    mbApi() { return this.active === 'tcp' ? api.modbusTcp : api.modbusRtu },
    async loadModbusDevices() {
      const r = await this.run(this.mbApi().devices)
      if (r && r.code === 200) { this.mb.devices = r.data || []; if (!this.mb.device && this.mb.devices[0]) this.mb.device = this.mb.devices[0] }
    },
    async mbRead(kind) {
      const q = { deviceCode: this.mb.device, startAddr: this.mb.start, count: this.mb.count }
      await this.run(() => this.mbApi()[kind](q), kind)
    },
    async mbWriteSingleReg() {
      await this.run(() => this.mbApi().writeSingleRegister({ deviceCode: this.mb.device, addr: this.mb.addr, value: num(this.mb.value) }), '写单寄存器')
    },
    async mbWriteSingleCoil(on) {
      await this.run(() => this.mbApi().writeSingleCoil({ deviceCode: this.mb.device, addr: this.mb.addr, value: on }), '写线圈 ' + on)
    },
    async mbWriteMultiReg() {
      const values = csvNums(this.mb.regsCsv)
      await this.run(() => this.mbApi().writeMultiRegister({ deviceCode: this.mb.device, startAddr: this.mb.start, value: values }), '写多寄存器')
    },
    async mbWriteMultiCoil() {
      const values = csvBools(this.mb.boolsCsv)
      await this.run(() => this.mbApi().writeMultiCoil({ deviceCode: this.mb.device, startAddr: this.mb.start, values }), '写多线圈')
    },
    async mbSendRaw() {
      const bytes = hexToBytes(this.mb.hex)
      await this.run(() => api.modbusTcp.sendRaw({ deviceCode: this.mb.device, tcpPacketBytes: bytes }), '原始报文')
    },

    // MQTT 主题历史：从 localStorage 读取 / 写入（最多 20 条，去重，最新在前）
    mqLoadHist() {
      try {
        this.mq.pubHist = JSON.parse(localStorage.getItem('nc_mqtt_pub') || '[]')
        this.mq.subHist = JSON.parse(localStorage.getItem('nc_mqtt_sub') || '[]')
        this.mq.sendHist = JSON.parse(localStorage.getItem('nc_mqtt_send') || '[]')
        this.mq.replyHist = JSON.parse(localStorage.getItem('nc_mqtt_reply') || '[]')
      } catch (e) { /* 历史损坏则忽略 */ }
    },
    mqPushHist(kind, topic) {
      if (!topic) return
      const arr = this.mq[kind].filter(t => t !== topic)
      arr.unshift(topic)
      this.mq[kind] = arr.slice(0, 20)
      const keys = { pubHist: 'nc_mqtt_pub', subHist: 'nc_mqtt_sub', sendHist: 'nc_mqtt_send', replyHist: 'nc_mqtt_reply' }
      localStorage.setItem(keys[kind], JSON.stringify(this.mq[kind]))
    },
    // MQTT
    async loadMqttDevices() {
      const r = await this.run(api.mqtt.devices)
      if (r && r.code === 200) { this.mq.devices = r.data || []; if (!this.mq.clientId && this.mq.devices[0]) this.mq.clientId = this.mq.devices[0] }
    },
    async mqAction(kind) {
      // publish 用发布主题+消息；sub/unsub 用订阅主题（两者已拆为独立卡片）
      const q = kind === 'publish'
        ? { clientId: this.mq.clientId, topic: this.mq.topic, msg: this.mq.msg }
        : { clientId: this.mq.clientId, topic: this.mq.subTopic }
      const r = await this.run(() => api.mqtt[kind](q), kind)
      // 成功后记录主题到历史（输入框下拉选择）
      if (r && r.code === 200) {
        if (kind === 'publish' && this.mq.topic) this.mqPushHist('pubHist', this.mq.topic)
        if (kind === 'sub' && this.mq.subTopic) this.mqPushHist('subHist', this.mq.subTopic)
      }
      // 订阅成功后自动开始轮询；取消订阅后停止轮询并清空
      if (kind === 'sub' && r && r.code === 200) { await this.mqStartPollSub() }
      if (kind === 'unsub' && r && r.code === 200) { this.mqStopPollSub(); this.mq.subMessages = [] }
    },
    async mqWait() {
      const r = await this.run(() => api.mqtt.publishWait({ clientId: this.mq.clientId, topicSend: this.mq.topicSend, sendPayload: this.mq.sendPayload, topicReply: this.mq.topicReply, timeoutMs: this.mq.timeout }), '发送并等待')
      // 应答结果常驻卡片内；成功后记录发送/应答主题历史
      if (r && r.code === 200) {
        this.mq.lastWait = r.data || null
        if (this.mq.topicSend) this.mqPushHist('sendHist', this.mq.topicSend)
        if (this.mq.topicReply) this.mqPushHist('replyHist', this.mq.topicReply)
        if (this.mq.topicReply) { await this.mqStartPollReply() }
      }
    },
    // 订阅主题消息：轮询
    mqStartPollSub() {
      this.mqStopPollSub()
      this.mq.pollSub = true
      this.mqRefreshSub()
      this.mq.pollSubTimer = setInterval(() => this.mqRefreshSub(), 2000)
    },
    mqStopPollSub() {
      this.mq.pollSub = false
      if (this.mq.pollSubTimer) { clearInterval(this.mq.pollSubTimer); this.mq.pollSubTimer = null }
    },
    async mqRefreshSub() {
      if (!this.mq.subTopic) return
      try {
        const r = await api.mqtt.received({ clientId: this.mq.clientId, topic: this.mq.subTopic })
        if (r && r.code === 200) this.mq.subMessages = r.data || []
      } catch (e) { /* 后端未就绪时忽略 */ }
    },
    // 应答主题消息：轮询
    mqStartPollReply() {
      this.mqStopPollReply()
      this.mq.pollReply = true
      this.mqRefreshReply()
      this.mq.pollReplyTimer = setInterval(() => this.mqRefreshReply(), 2000)
    },
    mqStopPollReply() {
      this.mq.pollReply = false
      if (this.mq.pollReplyTimer) { clearInterval(this.mq.pollReplyTimer); this.mq.pollReplyTimer = null }
    },
    async mqRefreshReply() {
      if (!this.mq.topicReply) return
      try {
        const r = await api.mqtt.received({ clientId: this.mq.clientId, topic: this.mq.topicReply })
        if (r && r.code === 200) this.mq.replyMessages = r.data || []
      } catch (e) { /* 后端未就绪时忽略 */ }
    },
    // 把消息列表渲染成纯文本（时间 + payload）
    mqMsgText(list) {
      const arr = list || []
      if (!arr.length) return '（暂无消息，确认已订阅且其他客户端向该主题发布）'
      return arr.map(m => `[${m.receiveTime}] ${m.payload}`).join('\n')
    },

    // OPC UA
    async loadOpcDevices() {
      const r = await this.run(api.opcua.devices)
      if (r && r.code === 200) { this.opc.devices = r.data || []; if (!this.opc.device && this.opc.devices[0]) this.opc.device = this.opc.devices[0] }
    },
    async opcTest() { await this.run(() => api.opcua.test({ deviceCode: this.opc.device }), '连接测试') },
    async opcReadOne() { await this.run(() => api.opcua.readNode({ deviceCode: this.opc.device, nodeId: this.opc.nodeId }), '读单节点') },
    async opcReadMany() {
      const nodeIds = this.opc.nodesCsv.split(',').map(s => s.trim()).filter(Boolean)
      await this.run(() => api.opcua.readNodes({ deviceCode: this.opc.device, nodeIds }), '批量读')
    },
    async opcWrite() { await this.run(() => api.opcua.writeNode({ deviceCode: this.opc.device, nodeId: this.opc.writeNode, value: this.opc.writeValue }), '写节点') },

    // Socket 客户端
    async loadScDevices() {
      const r = await this.run(api.sockClient.devices)
      if (r && r.code === 200) { this.sc.devices = r.data || []; if (!this.sc.device && this.sc.devices[0]) this.sc.device = this.sc.devices[0] }
    },
    async scTest() { await this.run(() => api.sockClient.test({ deviceCode: this.sc.device }), '连通测试') },
    async scSendString() { await this.run(() => api.sockClient.sendString({ deviceCode: this.sc.device, message: this.sc.message, timeoutMs: this.sc.timeout }), '字符串收发') },
    async scSendOnlyString() { await this.run(() => api.sockClient.sendOnlyString({ deviceCode: this.sc.device, message: this.sc.message, timeoutMs: this.sc.timeout }), '仅发送字符串') },
    async scSendOnlyBytes() { await this.run(() => api.sockClient.sendOnly({ deviceCode: this.sc.device, data: this.sc.hex, timeoutMs: this.sc.timeout }), '仅发送HEX') },
    async scSendBytes() {
      const data = hexToBytes(this.sc.hex)
      await this.run(() => api.sockClient.sendBytes({ deviceCode: this.sc.device, data, timeoutMs: this.sc.timeout }), '字节收发')
    },
    // 长连接管理
    async scOpenLong() { await this.run(() => api.sockClient.openLong({ deviceCode: this.sc.device }), '打开长连接') },
    async scCloseLong() { await this.run(() => api.sockClient.closeLong({ deviceCode: this.sc.device }), '关闭长连接') },
    async scLongStatus() {
      const r = await this.run(() => api.sockClient.longStatus({ deviceCode: this.sc.device }), '长连接状态')
      if (r && r.code === 200) {
        const s = r.data || {}
        this.sc.longInfo = s.isOpen ? ('已连接 ' + (s.connectedSince || '') + ' 收发 ' + (s.bytesSent||0) + '/' + (s.bytesReceived||0) + 'B') : '未连接'
      }
    },

    // Socket 服务端
    async loadSsServers() {
      const r = await this.run(api.sockServer.servers)
      if (r && r.code === 200) { this.ss.servers = r.data || []; if (!this.ss.server && this.ss.servers[0]) this.ss.server = this.ss.servers[0] }
    },
    async ssStart() { await this.run(() => api.sockServer.start({ serverCode: this.ss.server }), '启动监听') },
    async ssStop() { await this.run(() => api.sockServer.stop({ serverCode: this.ss.server }), '停止监听') },
    async ssClients() { await this.run(() => api.sockServer.clients({ serverCode: this.ss.server }), '在线客户端') },
    async ssRecent() { await this.run(() => api.sockServer.recent({ serverCode: this.ss.server, take: 20 }), '最近消息') },
    async ssSendString() { await this.run(() => api.sockServer.sendStringTo({ serverCode: this.ss.server, clientId: this.ss.clientId, message: this.ss.message }), '发指定客户端') },
    async ssBroadcastString() { await this.run(() => api.sockServer.broadcastString({ serverCode: this.ss.server, message: this.ss.message }), '广播') },

    clearResult() { this.result = '' },

    // ---- 记事本 ----
    async loadNotes() {
      const r = await this.run(() => api.notes.list({ keyword: this.notes.keyword }), '记事本列表')
      if (r && r.code === 200) this.noteList = r.data || []
    },
    newNote() { this.noteEdit = { name: '', content: '', loaded: false } },
    async editNote(n) {
      const r = await this.run(() => api.notes.get({ name: n.name }), '读取记事本')
      if (r && r.code === 200) this.noteEdit = { name: r.data.name, content: r.data.content || '', loaded: true }
    },
    async saveNote() {
      if (!this.noteEdit.name) { this.out('✘ 请填写文件名'); return }
      await this.run(() => api.notes.save({ name: this.noteEdit.name, content: this.noteEdit.content }), '保存记事本')
      await this.loadNotes()
    },
    async delNote(n) {
      if (!confirm('确认删除 ' + n.name + ' ？')) return
      await this.run(() => api.notes.remove({ name: n.name }), '删除记事本')
      await this.loadNotes()
    },

    // ---- 日志 ----
    async loadLogs() {
      const r = await this.run(() => api.logs.list({ startDate: this.logStart, endDate: this.logEnd }), '日志列表')
      if (r && r.code === 200) { this.logList = r.data || []; this.logChecked = [] }
    },
    async viewLog(l) {
      const r = await this.run(() => api.logs.content({ name: l.name, maxLines: 1000 }), '读取日志')
      if (r && r.code === 200) this.logView = r.data || { name: l.name, content: '', totalLines: 0, returnedLines: 0 }
    },
    toggleAllLogs(e) {
      this.logChecked = e.target.checked ? this.logList.map(l => l.name) : []
    },
    async deleteSelectedLogs() {
      if (!this.logChecked.length) { this.out('✘ 未选择日志'); return }
      if (!confirm('确认删除选中的 ' + this.logChecked.length + ' 个日志？')) return
      const r = await this.run(() => api.logs.remove({ names: this.logChecked.slice() }), '删除日志')
      if (r && r.code === 200) await this.loadLogs()
    },

    // 系统配置
    async loadConfig() {
      const r = await this.run(api.config.get, '读取配置')
      if (r && r.code === 200 && r.data != null) {
        this.cfg.text = JSON.stringify(r.data, null, 2)
      }
    },
    // 把编辑器里的 JSON 重新解析并按 2 空格缩进美化
    formatConfig() {
      try {
        this.cfg.text = JSON.stringify(JSON.parse(this.cfg.text), null, 2)
        this.out('✔ JSON 已格式化。')
      } catch (e) {
        this.out('✘ 不是合法 JSON，无法格式化：' + e.message)
      }
    },
    async saveConfig() {
      let body
      try {
        body = JSON.parse(this.cfg.text)
      } catch (e) {
        this.out('✘ JSON 格式错误：' + e.message)
        return
      }
      this.cfg.saving = true
      try {
        const r = await api.config.save(body)
        this.out(r && r.msg ? (r.code === 200 ? '✔ ' : '✘ ') + r.msg : JSON.stringify(r, null, 2))
        if (r && r.code === 200) {
          // 后端已退出重启，开始轮询探测，恢复后自动变回“已连接”
          this.connState = 'off'; this.connText = '重启中...'
          this.pollBackend()
        }
      } catch (e) {
        this.out('请求被断开（后端正在重启属正常）：' + e.message)
        this.connState = 'off'; this.connText = '重启中...'
        this.pollBackend()
      } finally {
        this.cfg.saving = false
      }
    },
    // 轮询后端是否恢复（最多约 30 秒，每 2 秒一次）
    async pollBackend() {
      for (let i = 0; i < 15; i++) {
        await new Promise(res => setTimeout(res, 2000))
        try {
          const r = await api.getLicenseStatus()
          if (r && r.code === 200) {
            this.connState = 'on'; this.connText = '已连接'
            this.out('✔ 后端已重启完成，新配置已生效。')
            return
          }
        } catch (e) { /* 还没起来，继续等 */ }
      }
      this.connText = '未检测到后端，请检查'
    }
  }
}
</script>

<style scoped>
/* ===== 浅色主题（默认，配白色窗口外框）===== */
.io-shell {
  --bg: #f3f5f9;
  --topbar: #ffffff;
  --nav: #f7f9fc;
  --panel: #ffffff;
  --panel-2: #eef2f8;
  --line: #d9e0ea;
  --input: #ffffff;
  --text: #1f2a3a;
  --text-2: #5b6b80;
  --text-3: #8a99ad;
  --accent: #1565d8;
  --accent-soft: #e8f0fd;
  --mono: #0f7a4d;
  --pre-bg: #f7f9fc;
  --btn-ghost: #5b6b80;
}
/* ===== 夜间（深色）主题 ===== */
.io-shell.dark {
  --bg: #0b0f14;
  --topbar: linear-gradient(90deg, #10151c, #0e1319);
  --nav: #0e1319;
  --panel: #11161d;
  --panel-2: #0b0f14;
  --line: #1d2733;
  --input: #0b0f14;
  --text: #e6edf6;
  --text-2: #c9d4e3;
  --text-3: #7c8aa0;
  --accent: #22d3ee;
  --accent-soft: #111a22;
  --mono: #9fe8c0;
  --pre-bg: #0b0f14;
  --btn-ghost: #9fb0c6;
}

.io-shell { position: fixed; inset: 0; display: flex; flex-direction: column; background: var(--bg); color: var(--text-2); font-family: "Segoe UI", "Microsoft YaHei", sans-serif; transition: background .2s; }
.io-topbar { height: 56px; flex: 0 0 56px; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; background: var(--topbar); border-bottom: 1px solid var(--line); }
.brand { display: flex; align-items: center; gap: 10px; }
.logo-dot { width: 12px; height: 12px; border-radius: 2px; background: var(--accent); }
.dark .logo-dot { box-shadow: 0 0 10px var(--accent); }
.brand-name { font-size: 16px; font-weight: 600; color: var(--text); letter-spacing: 1px; }
.brand-ver { font-size: 11px; color: var(--text-3); border: 1px solid var(--line); padding: 2px 8px; border-radius: 10px; }
.topbar-right { display: flex; align-items: center; gap: 8px; }
.lbl { color: var(--text-3); font-size: 13px; }
.base-input { width: 320px; background: var(--input); border: 1px solid var(--line); color: var(--text); padding: 6px 10px; border-radius: 4px; font-size: 13px; }
.dot { width: 9px; height: 9px; border-radius: 50%; background: #f59e0b; }
.dot.on { background: #22c55e; }
.dark .dot.on { box-shadow: 0 0 8px #22c55e; }
.dot.off { background: #ef4444; }
.dot.wait { background: #f59e0b; }
.conn-text { font-size: 12px; color: var(--text-3); }

.io-body { flex: 1; display: flex; min-height: 0; }
.io-nav { width: 188px; flex: 0 0 188px; background: var(--nav); border-right: 1px solid var(--line); padding: 14px 0; }
.nav-item { padding: 11px 20px; cursor: pointer; color: var(--text-3); font-size: 14px; border-left: 3px solid transparent; }
.nav-item:hover { color: var(--text); background: var(--panel-2); }
.nav-item.active { color: var(--accent); background: var(--accent-soft); border-left-color: var(--accent); }
.nav-ico { display: inline-block; width: 20px; color: var(--text-3); }
.nav-item.active .nav-ico { color: var(--accent); }

.io-main { flex: 1; overflow: auto; padding: 18px 22px; }
.panel { margin-bottom: 16px; }
.panel-title { font-size: 15px; margin: 0 0 12px; color: var(--text); border-left: 3px solid var(--accent); padding-left: 10px; }
.panel-hrow { display: flex; align-items: center; justify-content: space-between; }
.grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.card { background: var(--panel); border: 1px solid var(--line); border-radius: 6px; padding: 14px; }
.card-h { font-size: 13px; color: var(--text-3); margin-bottom: 10px; letter-spacing: .5px; }
.row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.row label { width: 130px; font-size: 12px; color: var(--text-3); flex: 0 0 auto; }
.row input { flex: 1; background: var(--input); border: 1px solid var(--line); color: var(--text); padding: 6px 8px; border-radius: 4px; font-size: 13px; }
.toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.toolbar label { font-size: 13px; color: var(--text-3); }
.sel { background: var(--input); border: 1px solid var(--line); color: var(--text); padding: 6px 10px; border-radius: 4px; min-width: 200px; }
.btns { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.btn { background: var(--accent); border: none; color: #fff; padding: 7px 14px; border-radius: 4px; font-size: 13px; cursor: pointer; }
.btn:hover { filter: brightness(1.08); }
.btn.warn { background: #d97706; }
.btn.ghost { background: transparent; border: 1px solid var(--line); color: var(--btn-ghost); }
.btn.ghost:hover { border-color: var(--accent); color: var(--accent); }
.machine { font-family: Consolas, monospace; font-size: 20px; color: var(--accent); letter-spacing: 2px; margin: 8px 0 12px; }
.pre { background: var(--pre-bg); border: 1px solid var(--line); border-radius: 6px; padding: 12px; font-family: Consolas, monospace; font-size: 12.5px; color: var(--mono); white-space: pre-wrap; word-break: break-all; max-height: 240px; overflow: auto; margin: 0 0 10px; }
.result { color: var(--text-2); max-height: 360px; }
.pre code { background: transparent !important; padding: 0; margin: 0; display: block; font-family: inherit; font-size: inherit; }
/* 配置编辑器：高亮层垫底 + 透明 textarea 覆盖 */
.cfg-wrap { position: relative; min-height: 360px; }
.cfg-highlight, .cfg-editor {
  margin: 0; padding: 12px; border-radius: 6px;
  font-family: Consolas, monospace; font-size: 12.5px; line-height: 1.5;
  white-space: pre; word-wrap: normal; overflow: auto;
  font-variant-ligatures: none; letter-spacing: normal;
}
.cfg-highlight {
  position: absolute; inset: 0;
  background: var(--pre-bg); border: 1px solid var(--line); color: var(--text);
  pointer-events: none; z-index: 0;
}
.cfg-highlight code { background: transparent !important; padding: 0; display: block; font-family: inherit; font-size: inherit; }
.cfg-editor {
  position: relative; z-index: 1;
  width: 100%; min-height: 360px;
  background: transparent; color: transparent; caret-color: var(--text);
  border: 1px solid transparent; outline: none; resize: vertical;
}
@media (max-width: 1100px) { .grid { grid-template-columns: 1fr; } }
/* 记事本 / 日志 列表与编辑器 */
.tbl { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.tbl th, .tbl td { border-bottom: 1px solid var(--line); padding: 7px 8px; text-align: left; color: var(--text-2); }
.tbl th { color: var(--text-3); font-weight: 600; }
.tbl tr.selrow { background: var(--accent-soft); }
.tbl .empty { text-align: center; color: var(--text-3); padding: 16px; }
.btn.sm { padding: 3px 9px; font-size: 12px; margin-right: 4px; }
.editor-ta { width: 100%; min-height: 260px; background: var(--input); color: var(--text); border: 1px solid var(--line); border-radius: 4px; padding: 8px; font-family: Consolas, monospace; font-size: 12.5px; resize: vertical; margin: 8px 0; }
/* 关于页 */
.about-card h3 { margin: 0 0 10px; color: var(--text); font-size: 18px; }
.about-h3 { color: var(--text) !important; }
.about-p { color: var(--text-2); font-size: 13.5px; line-height: 1.7; margin: 4px 0; }
.about-ul { margin: 6px 0 0; padding-left: 18px; color: var(--text-2); font-size: 13.5px; line-height: 1.9; }
.about-mail { font-size: 20px; color: var(--accent); font-weight: 600; letter-spacing: 1px; margin: 8px 0; }
</style>
