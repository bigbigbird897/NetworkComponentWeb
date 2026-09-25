<template>
  <section class="panel">
    <h2 class="panel-title">记事本（文件保存在后端 notes 目录）</h2>
    <div class="toolbar">
      <input class="base-input" style="width:240px" v-model="keyword" placeholder="按文件名搜索" @keyup.enter="load" />
      <button class="btn ghost" @click="load">搜索</button>
      <button class="btn" @click="newNote">新建</button>
    </div>
    <div class="grid two">
      <div class="card">
        <div class="card-h">文件列表（{{ list.length }}）</div>
        <table class="tbl">
          <thead><tr><th>文件名</th><th>修改时间</th><th>大小</th><th>操作</th></tr></thead>
          <tbody>
            <tr v-for="n in list" :key="n.name" :class="{selrow: edit.name===n.name}">
              <td>{{ n.name }}</td>
              <td>{{ n.modified }}</td>
              <td>{{ n.size }} B</td>
              <td>
                <button class="btn ghost sm" @click="editNote(n)">编辑</button>
                <button class="btn warn sm" @click="del(n)">删除</button>
              </td>
            </tr>
            <tr v-if="!list.length"><td colspan="4" class="empty">暂无文件</td></tr>
          </tbody>
        </table>
      </div>
      <div class="card">
        <div class="card-h">{{ edit.name ? '编辑：' + edit.name : '新建记事本' }}</div>
        <div class="row"><label>文件名</label><input v-model="edit.name" placeholder="例如 巡检记录.txt" :disabled="!!edit.loaded" /></div>
        <textarea v-model="edit.content" class="editor-ta" spellcheck="false"></textarea>
        <div class="btns">
          <button class="btn" @click="save">保存</button>
          <button class="btn ghost" @click="edit = {name:'',content:'',loaded:false}">清空</button>
        </div>
      </div>
    </div>
  </section>
</template>
<script>
import mixin from '../mixins/api'
export default {
  name: 'NotesPage', mixins: [mixin],
  data() { return { keyword:'', list:[], edit:{name:'',content:'',loaded:false} } },
  created() { this.load() },
  methods: {
    async load() { const r = await this.run(() => this.api.notes.list({ keyword: this.keyword }), '列表'); if (r && r.code === 200) this.list = r.data || [] },
    newNote() { this.edit = { name:'', content:'', loaded:false } },
    async editNote(n) { const r = await this.run(() => this.api.notes.get({ name: n.name }), '读取'); if (r && r.code === 200) this.edit = { name: r.data.name, content: r.data.content || '', loaded: true } },
    async save() { if (!this.edit.name) { this.out('✘ 请填写文件名'); return } await this.run(() => this.api.notes.save({ name: this.edit.name, content: this.edit.content }), '保存'); this.load() },
    async del(n) { if (!confirm('确认删除 ' + n.name + ' ？')) return; await this.run(() => this.api.notes.remove({ name: n.name }), '删除'); this.load() }
  }
}
</script>
