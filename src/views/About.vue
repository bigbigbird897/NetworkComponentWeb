<template>
  <section class="panel">
    <h2 class="panel-title">关于本产品</h2>
    <div class="card about-card">
      <h3 class="about-h3">工业通信中台</h3>
      <p class="about-p">一套整合常用工业通信协议、开箱即用的应用。开发者只需调用统一的接口，即可完成设备读写，无需自己对接各协议栈。</p>
      <div class="grid two" style="margin-top:14px">
        <div>
          <div class="card-h">产品优势</div>
          <ul class="about-ul">
            <li><b>协议齐全</b>：内置 Modbus TCP / Modbus RTU over TCP、MQTT、OPC UA、Socket客户端与服务端。</li>
            <li><b>统一接口</b>：所有协议都走 RESTful HTTP，返回统一 JSON 结构，第三方软件（WPF / WinForms / 其它服务）极易对接。</li>
            <li><b>跨平台部署</b>：后端为 .NET 自包含发布，可跑 Windows / Linux，无需客户机安装运行时。</li>
            <li><b>可观测</b>：按天滚动日志；配置在线修改后自动重启生效。</li>
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
