<template>
  <section class="panel">
    <h2 class="panel-title">关于本产品</h2>
    <div class="card about-card">
      <h3 class="about-h3">工业通信中台</h3>
      <p class="about-p">一套整合常用工业通信协议、开箱即用的后端服务 + Web 控制台 + Windows 桌面壳。开发者只需调用统一的 HTTP 接口，即可完成设备读写，无需自己对接各协议栈。</p>
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
</template>
<script>
export default { name: 'AboutPage' }
</script>
