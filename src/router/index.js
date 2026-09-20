import Vue from 'vue'
import Router from 'vue-router'
import Console from '../views/Console.vue'

Vue.use(Router)

export default new Router({
  mode: 'hash',
  routes: [
    // 启动后直接进入工业通信控制台
    { path: '/', name: 'console', component: Console },
    { path: '*', redirect: '/' }
  ]
})
