const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  publicPath: './',
  transpileDependencies: true,
  productionSourceMap: false,
  devServer: {
    port: 8088,
    open: true,
    client: {
      overlay: false
    },
    host: '0.0.0.0', // 允许局域网其他机器访问你的开发服务
    proxy: {
      // 把前端 /api 转发到 .NET 中间件（Kestrel 监听 5000），避免浏览器跨域
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
