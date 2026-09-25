<template>
  <section class="panel">
    <h2 class="panel-title">日志查看（logs 目录，按天滚动）</h2>
    <div class="toolbar">
      <label>开始日期</label>
      <input type="date" v-model="start" class="sel" style="min-width:160px" />
      <label>结束日期</label>
      <input type="date" v-model="end" class="sel" style="min-width:160px" />
      <button class="btn ghost" @click="load">查询</button>
      <button class="btn ghost" @click="start='';end='';load">全部</button>
      <button class="btn warn" @click="delSelected">删除选中</button>
    </div>
    <div class="grid two">
      <div class="card">
        <div class="card-h">日志文件（{{ list.length }}）— 点行前勾选，点查看读内容</div>
        <table class="tbl">
          <thead><tr><th><input type="checkbox" @change="toggleAll($event)" /></th><th>文件名</th><th>大小</th><th>修改时间</th><th>操作</th></tr></thead>
          <tbody>
            <tr v-for="l in list" :key="l.name">
              <td><input type="checkbox" :value="l.name" v-model="checked" /></td>
              <td>{{ l.name }}</td>
              <td>{{ l.size }} B</td>
              <td>{{ l.modified }}</td>
              <td><button class="btn ghost sm" @click="view(l)">查看</button></td>
            </tr>
            <tr v-if="!list.length"><td colspan="5" class="empty">无日志文件</td></tr>
          </tbody>
        </table>
      </div>
      <div class="card">
        <div class="card-h">日志内容：{{ view.name || '—' }}（返回 {{ view.returnedLines }}/{{ view.totalLines }} 行）</div>
        <pre class="pre" style="max-height:480px">{{ view.content }}</pre>
      </div>
    </div>
  </section>
</template>
<script>
import mixin from '../mixins/api'
export default {
  name: 'LogsPage', mixins: [mixin],
  data() { return { start:'', end:'', list:[], checked:[], view:{name:'',content:'',totalLines:0,returnedLines:0} } },
  methods: {
    async load() { const r = await this.run(() => this.api.logs.list({ startDate: this.start, endDate: this.end }), '列表'); if (r && r.code === 200) { this.list = r.data || []; this.checked = [] } },
    async view(l) { const r = await this.run(() => this.api.logs.content({ name: l.name, maxLines: 1000 }), '读取'); if (r && r.code === 200) this.view = r.data || { name: l.name, content:'', totalLines:0, returnedLines:0 } },
    toggleAll(e) { this.checked = e.target.checked ? this.list.map(l => l.name) : [] },
    async delSelected() { if (!this.checked.length) { this.out('✘ 未选择日志'); return } if (!confirm('确认删除选中的 ' + this.checked.length + ' 个日志？')) return; await this.run(() => this.api.logs.remove({ names: this.checked.slice() }), '删除'); this.load() }
  }
}
</script>
