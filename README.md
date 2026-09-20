# 通枢工业通信中台 · 控制台

基于 **Vue 2.7 + Element UI** 的后端接口调试控制台，启动后直接调用 .NET 中间件（NetworkComponent）的全部 HTTP 接口。

## 环境要求
- Node.js >= 14（推荐 18 / 20）
- npm >= 8

## 启动开发环境

```bash
# 1. 安装依赖（首次运行执行一次）
npm install

# 2. 启动开发服务（自动打开浏览器，默认端口 8088）
npm run dev
```

启动后根路径 `/` 即为控制台；开发期 `/api` 已通过 `vue.config.js` 代理到 `http://localhost:5000`（.NET 中间件）。

## 生产构建

```bash
npm run build
```

构建产物输出到 `dist/` 目录。

## 项目结构

```
NetworkComponentWeb/
├── public/index.html          # HTML 模板
├── src/
│   ├── main.js                # 应用入口（注册 Element UI）
│   ├── App.vue                # 根组件：纯 <router-view>
│   ├── router/index.js        # 路由：根路径 / 直接加载控制台
│   ├── api/console.js         # 后端接口 fetch 封装（全部接口）
│   └── views/Console.vue      # 工业通信控制台主页面
└── vue.config.js              # devServer + /api 代理
```

## 控制台覆盖接口

左侧导航分栏：授权状态 / Modbus TCP / Modbus RTU / MQTT / OPC UA / Socket 客户端 / Socket 服务端；右侧实时显示 JSON 调用结果。

- 授权：`GetMachineCode` / `GetStatus`
- Modbus：03/04/01/02 读、06/05 写单、10/0F 写多、原始报文（TCP）、设备列表
- MQTT：发布/订阅/退订/发送并等待应答、客户端列表
- OPC UA：读单节点/批量读/写节点/连接测试、设备列表
- Socket 客户端：字符串/十六进制字节收发、仅发送、连通测试
- Socket 服务端：启动/停止监听、在线客户端、最近消息、下发/广播

简单类型参数走 query string，对象/数组走 JSON body，与后端 `[ApiController]` 绑定方式一致。

## 变更记录

| 日期 | 变更内容 |
|---|---|
| 2026-09-19 | 新增「工业通信控制台」：深色工业风，封装 NetworkComponent 全部 HTTP 接口。新增 `src/api/console.js` 与 `src/views/Console.vue`；`vue.config.js` 增加 `/api` → `http://localhost:5000` 代理。 |
| 2026-09-19 | 移除全部营销页与图片：删除 `Home/Admin` 视图、`components/*`、全局 `styles.css`、`utils/api.js`、`bus.js`；`App.vue` 精简为纯 `<router-view>`；路由根路径 `/` 直接加载控制台，项目启动即进入调用后端接口的页面。 |
| 2026-09-20 | 控制台改为双主题：默认浅色主题（配 WPF 白色窗口外框），顶栏新增「🌙 夜间 / ☀ 浅色」切换按钮；配色抽成 CSS 变量，根节点挂 `.dark` 类切到深色；选择持久化到 localStorage（键 `nc-theme`）。 |
| 2026-09-20 | 新增「系统配置」页：读取/编辑后端 appsettings.json（完整 JSON 编辑器），点「保存并重启后端」后由后端退出、WPF 自动重新拉起加载新配置。 |
| 2026-09-20 | 系统配置新增「格式化」按钮：一键把编辑器内 JSON 按 2 空格缩进美化，非法 JSON 时在结果区报错；读取配置与调用结果本就按缩进输出。保存成功后前端每 2 秒轮询 License/GetStatus，最多约 30 秒，后端重启完成后状态自动恢复为「已连接」。 |
| 2026-09-20 | 引入 highlight.js（`highlight.js@11`，仅注册 json 语言 + github 主题）：授权状态与调用结果中的 JSON 文本按语法高亮（键/字符串/数字/标点分色），非 JSON 纯文本自动降级为转义显示。 |
| 2026-09-20 | 系统配置编辑器也加上语法高亮：采用「高亮层垫底 + 透明 textarea 覆盖」方案（无需引入 CodeMirror），打字/滚动时高亮随内容实时更新，光标正常显示；配置含 `//` 注释时由 hljs 容错，失败则降级为转义纯文本。 |
| 2026-09-20 | 撤回全部 highlight.js 改动（编辑器高亮覆盖层 + 结果/授权框高亮），Console.vue 恢复为普通 textarea 与纯文本 `<pre>`；package.json 仍保留 highlight.js 依赖但不再引用。 |
