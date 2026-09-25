import Vue from 'vue'
import Router from 'vue-router'
import MainLayout from '../layout/MainLayout.vue'

Vue.use(Router)

export default new Router({
  mode: 'hash',
  routes: [
    { path: '/', component: MainLayout, redirect: '/license',
      children: [
        { path: 'license', component: () => import('../views/License.vue') },
        { path: 'modbus-tcp', component: () => import('../views/modbus/ModbusPage.vue'), props: { mode: 'tcp' } },
        { path: 'modbus-rtu', component: () => import('../views/modbus/ModbusPage.vue'), props: { mode: 'rtu' } },
        { path: 'mqtt', component: () => import('../views/Mqtt.vue') },
        { path: 'opcua', component: () => import('../views/OpcUa.vue') },
        { path: 'socket-client', component: () => import('../views/SocketClient.vue') },
        { path: 'socket-server', component: () => import('../views/SocketServer.vue') },
        { path: 'notes', component: () => import('../views/Notes.vue') },
        { path: 'logs', component: () => import('../views/Logs.vue') },
        { path: 'about', component: () => import('../views/About.vue') },
        { path: 'config', component: () => import('../views/Config.vue') }
      ]
    },
    { path: '*', redirect: '/license' }
  ]
})
