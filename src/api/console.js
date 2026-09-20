// ============ 通枢工业通信中台 · 控制台 API 封装 ============
// 后端基址：留空 = 同源（开发期由 vue.config.js 代理到 http://localhost:5000）。
// 顶部“服务地址”可改成 http://192.168.x.x:5000 并持久化到 localStorage。

let BASE = localStorage.getItem('nc_api_base') || ''

export function setBase(b) {
  BASE = (b || '').replace(/\/+$/, '')
  localStorage.setItem('nc_api_base', BASE)
}
export function getBase() { return BASE }

async function request(method, path, { query, body } = {}) {
  let url = BASE + '/api' + path
  if (query) {
    const qs = []
    for (const k in query) {
      const v = query[k]
      if (v === undefined || v === null || v === '') continue
      if (Array.isArray(v)) v.forEach(item => qs.push(`${k}=${encodeURIComponent(item)}`))
      else qs.push(`${k}=${encodeURIComponent(v)}`)
    }
    if (qs.length) url += (url.includes('?') ? '&' : '?') + qs.join('&')
  }
  const opt = { method, headers: {} }
  if (body !== undefined) {
    opt.headers['Content-Type'] = 'application/json'
    opt.body = JSON.stringify(body)
  }
  const res = await fetch(url, opt)
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch (e) { data = text }
  return data
}

// ---- License ----
export const getMachineCode = () => request('GET', '/License/GetMachineCode')
export const getLicenseStatus = () => request('GET', '/License/GetStatus')

// ---- Modbus TCP ----
export const modbusTcp = {
  devices: () => request('GET', '/ModbusTcpOperation/GetAllDeviceCode'),
  readRegister: (q) => request('POST', '/ModbusTcpOperation/ReadRegister', { query: q }),
  writeSingleRegister: (q) => request('POST', '/ModbusTcpOperation/WriteSingleRegister', { query: q }),
  writeMultiRegister: (b) => request('POST', '/ModbusTcpOperation/WriteMultiRegister', { body: b }),
  readCoil: (q) => request('POST', '/ModbusTcpOperation/ReadCoil', { query: q }),
  readDiscreteInput: (q) => request('POST', '/ModbusTcpOperation/ReadDiscreteInput', { query: q }),
  readInputRegister: (q) => request('POST', '/ModbusTcpOperation/ReadInputRegister', { query: q }),
  writeSingleCoil: (q) => request('POST', '/ModbusTcpOperation/WriteSingleCoil', { query: q }),
  writeMultiCoil: (b) => request('POST', '/ModbusTcpOperation/WriteMultiCoil', { body: b }),
  sendRaw: (q) => request('POST', '/ModbusTcpOperation/SendRawPacket', { query: q })
}

// ---- Modbus RTU over TCP ----
export const modbusRtu = {
  devices: () => request('GET', '/ModbusRtuOverTcpOperation/GetAllDeviceCode'),
  readRegister: (q) => request('POST', '/ModbusRtuOverTcpOperation/ReadRegister', { query: q }),
  writeSingleRegister: (q) => request('POST', '/ModbusRtuOverTcpOperation/WriteSingleRegister', { query: q }),
  readCoil: (q) => request('POST', '/ModbusRtuOverTcpOperation/ReadCoil', { query: q }),
  readDiscreteInput: (q) => request('POST', '/ModbusRtuOverTcpOperation/ReadDiscreteInput', { query: q }),
  readInputRegister: (q) => request('POST', '/ModbusRtuOverTcpOperation/ReadInputRegister', { query: q }),
  writeSingleCoil: (q) => request('POST', '/ModbusRtuOverTcpOperation/WriteSingleCoil', { query: q }),
  writeMultiCoil: (b) => request('POST', '/ModbusRtuOverTcpOperation/WriteMultiCoil', { body: b })
}

// ---- MQTT ----
export const mqtt = {
  devices: () => request('GET', '/MqttOperation/GetAllDeviceCode'),
  publish: (q) => request('POST', '/MqttOperation/PublishMsg', { query: q }),
  sub: (q) => request('POST', '/MqttOperation/SubTopic', { query: q }),
  unsub: (q) => request('POST', '/MqttOperation/UnSubTopic', { query: q }),
  publishWait: (b) => request('POST', '/MqttOperation/PublishAndWaitReply', { body: b })
}

// ---- OPC UA ----
export const opcua = {
  devices: () => request('GET', '/OpcUaOperation/GetAllDeviceCode'),
  readNode: (q) => request('GET', '/OpcUaOperation/ReadNode', { query: q }),
  readNodes: (b) => request('POST', '/OpcUaOperation/ReadNodes', { body: b }),
  writeNode: (b) => request('POST', '/OpcUaOperation/WriteNode', { body: b }),
  test: (q) => request('GET', '/OpcUaOperation/TestConnection', { query: q })
}

// ---- Socket 客户端 ----
export const sockClient = {
  devices: () => request('GET', '/SocketClientOperation/GetAllDeviceCode'),
  sendBytes: (b) => request('POST', '/SocketClientOperation/SendAndReceiveBytes', { body: b }),
  sendString: (b) => request('POST', '/SocketClientOperation/SendAndReceiveString', { body: b }),
  sendOnly: (b) => request('POST', '/SocketClientOperation/SendOnly', { body: b }),
  test: (q) => request('GET', '/SocketClientOperation/TestConnection', { query: q })
}

// ---- 系统配置（appsettings.json）----
export const config = {
  get: () => request('GET', '/Config/Get'),
  save: (body) => request('POST', '/Config/Save', { body })
}

// ---- Socket 服务端 ----
export const sockServer = {
  servers: () => request('GET', '/SocketServerOperation/GetAllServerCode'),
  start: (q) => request('POST', '/SocketServerOperation/StartServer', { query: q }),
  stop: (q) => request('POST', '/SocketServerOperation/StopServer', { query: q }),
  sendTo: (b) => request('POST', '/SocketServerOperation/SendToClient', { body: b }),
  sendStringTo: (b) => request('POST', '/SocketServerOperation/SendStringToClient', { body: b }),
  broadcast: (b) => request('POST', '/SocketServerOperation/Broadcast', { body: b }),
  broadcastString: (b) => request('POST', '/SocketServerOperation/BroadcastString', { body: b }),
  clients: (q) => request('GET', '/SocketServerOperation/GetConnectedClients', { query: q }),
  recent: (q) => request('GET', '/SocketServerOperation/GetRecentMessages', { query: q })
}
