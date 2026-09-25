<template>
  <section class="panel">
    <h2 class="panel-title">授权状态 / 机器码</h2>
    <div class="grid">
      <div class="card">
        <div class="card-h">本机机器码（发给软件商申请 license）</div>
        <div class="machine">{{ machineCode || '—' }}</div>
        <button class="btn" @click="load">刷新机器码</button>
      </div>
      <div class="card">
        <div class="card-h">授权状态</div>
        <pre class="pre"><code v-html="hl(statusText)"></code></pre>
        <button class="btn" @click="load2">刷新状态</button>
      </div>
    </div>
  </section>
</template>
<script>
import mixin from '../mixins/api'
export default {
  name: 'LicensePage', mixins: [mixin],
  data() { return { machineCode: '', statusText: '' } },
  async created() { await this.load(); await this.load2() },
  methods: {
    async load() { const r = await this.run(this.api.getMachineCode); if (r && r.code === 200) this.machineCode = r.data },
    async load2() { const r = await this.run(this.api.getLicenseStatus); if (r && r.code === 200) this.statusText = JSON.stringify(r.data, null, 2) }
  }
}
</script>
