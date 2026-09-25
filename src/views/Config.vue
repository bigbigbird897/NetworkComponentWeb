<template>
  <section class="panel">
    <h2 class="panel-title">系统配置（appsettings.json）</h2>
    <div class="card">
      <div class="card-h">完整 JSON 内容（修改后点保存，后端会自动重启加载新配置）</div>
      <div class="cfg-wrap">
        <pre class="cfg-highlight" ref="cfgHi" aria-hidden="true"><code v-html="cfgHtml"></code></pre>
        <textarea v-model="text" class="cfg-editor" spellcheck="false" wrap="off" @scroll="syncScroll"></textarea>
      </div>
      <div class="btns">
        <button class="btn ghost" @click="load">读取配置</button>
        <button class="btn ghost" @click="format">格式化</button>
        <button class="btn warn" :disabled="saving" @click="save">{{ saving ? '保存并重启中...' : '保存并重启后端' }}</button>
      </div>
    </div>
  </section>
</template>
<script>
import mixin from '../mixins/api'
import hljs from 'highlight.js/lib/core'
import jsonLang from 'highlight.js/lib/languages/json'
hljs.registerLanguage('json', jsonLang)
export default {
  name: 'ConfigPage', mixins: [mixin],
  data() { return { text: '', saving: false } },
  computed: {
    cfgHtml() { const t = String(this.text || ''); try { return hljs.highlight(t, { language: 'json' }).value } catch (e) { return this.hl(t) } }
  },
  async created() { await this.load() },
  methods: {
    syncScroll() { const ta = this.$el.querySelector('.cfg-editor'); const hi = this.$refs.cfgHi; if (ta && hi) { hi.scrollTop = ta.scrollTop; hi.scrollLeft = ta.scrollLeft } },
    async load() { const r = await this.run(this.api.config.get, '读取配置'); if (r && r.code === 200 && r.data != null) this.text = JSON.stringify(r.data, null, 2) },
    format() { try { this.text = JSON.stringify(JSON.parse(this.text), null, 2); this.out('✔ JSON 已格式化。') } catch (e) { this.out('✘ 不是合法 JSON：' + e.message) } },
    async save() {
      let body
      try { body = JSON.parse(this.text) } catch (e) { this.out('✘ JSON 格式错误：' + e.message); return }
      this.saving = true
      try {
        const r = await this.api.config.save(body)
        this.out(r && r.msg ? (r.code === 200 ? '✔ ' : '✘ ') + r.msg : JSON.stringify(r, null, 2))
        if (r && r.code === 200) { this.$root.$emit('conn', { state: 'off', text: '重启中...' }); this.pollBackend() }
      } catch (e) {
        this.out('请求被断开（后端正在重启属正常）：' + e.message)
        this.$root.$emit('conn', { state: 'off', text: '重启中...' })
        this.pollBackend()
      } finally { this.saving = false }
    },
    async pollBackend() {
      for (let i = 0; i < 15; i++) {
        await new Promise(res => setTimeout(res, 2000))
        try { const r = await this.api.getLicenseStatus(); if (r && r.code === 200) { this.$root.$emit('conn', { state: 'on', text: '已连接' }); this.out('✔ 后端已重启完成，新配置已生效。'); return } } catch (e) {}
      }
      this.out('未检测到后端，请检查')
    }
  }
}
</script>
