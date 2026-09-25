import * as api from '../api/console'
import hljs from 'highlight.js/lib/core'
import jsonLang from 'highlight.js/lib/languages/json'
import 'highlight.js/styles/github.css'
hljs.registerLanguage('json', jsonLang)

const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const highlightJson = (text) => {
  const t = String(text || '').trim()
  if (!t) return ''
  if (t[0] === '{' || t[0] === '[') {
    try { return hljs.highlight(t, { language: 'json' }).value } catch (e) {}
  }
  return escapeHtml(text)
}

const num = (s, d = 0) => { const n = Number(s); return isNaN(n) ? d : n }
const csvNums = (text) => String(text || '').split(',').map(s => num(s.trim())).filter(n => !isNaN(n))
const csvBools = (text) => String(text || '').split(',').map(s => s.trim().toLowerCase() === 'true')
const hexToBytes = (text) => String(text || '').trim().split(/[\s,]+/).filter(Boolean).map(h => parseInt(h, 16))

export default {
  data() { return { api, num, csvNums, csvBools, hexToBytes } },
  methods: {
    out(v) { this.$root.$emit('result', typeof v === 'string' ? v : JSON.stringify(v, null, 2)) },
    async run(fn, okHint) {
      try {
        const r = await fn()
        this.$root.$emit('conn', { state: 'on', text: '已连接' })
        this.out(r && r.msg ? `${okHint || ''}\n${JSON.stringify(r, null, 2)}` : (r && r.code === 200 ? (okHint + ' ✔') : '') + '\n' + JSON.stringify(r, null, 2))
        if (r && r.code === 200 && r.data && typeof r.data === 'object' && 'rawRequest' in r.data) {
          this.$root.$emit('mb-raw', { req: r.data.rawRequest || '', resp: r.data.rawResponse || '' })
        }
        return r
      } catch (e) {
        this.$root.$emit('conn', { state: 'off', text: '连接失败' })
        this.out('✘ 请求失败：' + e.message + '\n请确认后端地址与网络/授权。')
      }
    },
    hl(t) { return highlightJson(t) }
  }
}
