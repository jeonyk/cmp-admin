<template>
  <div
    v-loading="isLoadingScript || isLoadingScriptDetail"
    class="script-fetch"
  >
    <div class="script-fetch-grid">
      <div class="script-fetch-grid__macro">
        <macro-hint />
      </div>
      <cmp-grid
        :columns="scriptColumns"
        :item-source="scriptList"
        :selectable="!readOnly || (usePreview && isCurrentPreview)"
        @selectedRow="onSelectedRow"
      />
    </div>
    <div
      class="script-fetch-editor"
    >
      <cmp-code-editor
        :read-only="readOnly || (usePreview && isCurrentPreview)"
        :values="usePreview && isCurrentPreview ? replacedScriptCode : scriptCode"
        @input="onChangeScriptCode"
      />
      <template v-if="usePreview">
        <button
          v-if="!isCurrentPreview"
          class="button"
          type="is-primary"
          @click="onClickPreview"
        >
          {{ $v('매크로 적용 미리보기') }}
        </button>
        <button
          v-else
          class="button"
          type="is-black"
          @click="onClickCancelPreview"
        >
          {{ $v('미리보기 취소') }}
        </button>
      </template>
    </div>
  </div>
</template>

<script>
import API, { CMPCodeEditor } from '@sd-fe/cmp-core'
import MacroHint from '@/components/CloudInit/MacroHint.vue'

// const previewData = {
//   hostName: 'hostName',
//   ip: '1.1.1.1',
//   gateway: '1.1.1.1',
//   netmask: '1.1.1.1',
//   dns: '1.1.1.1',
//   prefix: '24'
// }

export default {
  name: 'CloudInitFetchList',
  components: {
    'cmp-code-editor': CMPCodeEditor,
    MacroHint
  },
  props: {
    contents: {
      type: String,
      default: ''
    },
    readOnly: {
      type: Boolean,
      default: false
    },
    usePreview: {
      type: Boolean,
      default: false
    },
    previewData: {
      type: Object,
      default: () => ({
        // hostName: 'hostName',
        // ip: '1.1.1.1',
        // gateway: '1.1.1.1',
        // netmask: '1.1.1.1',
        // dns: '1.1.1.1',
        // prefix: '24'
      })
    }
  },
  computed: {
    replacedScriptCode () {
      const previewKeyRegexMap = {
        hostName: /{\n*HOSTNAME\n*}/gmi,
        ip: /{\n*IP_ADDRESS\n*}/gmi,
        gateway: /{\n*GATEWAY\n*}/gmi,
        netmask: /{\n*NETMASK\n*}/gmi,
        dns: /{\n*DNS_IP\n*}/gmi,
        prefix: /{\n*PREFIX\n*}/gmi
      }

      let scriptCode = this.scriptCode.slice(0)

      Object.keys(this.previewData)
        .forEach(key => {
          const regex = previewKeyRegexMap[key]
          const value = this.previewData[key]
          if (regex) {
            scriptCode = scriptCode.replace(regex, value)
          }
        })

      return scriptCode
    }
  },
  created () {
    this.getScriptList()
    this.scriptCode = this.contents
  },
  watch: {
    scriptCode: {
      immediate: true,
      handler (code) {
        this.$emit('change', code, this.replacedScriptCode)
      }
    }
  },
  methods: {
    onChangeScriptCode (value) {
      if (this.usePreview && this.isCurrentPreview) {
        return
      }

      this.scriptCode = value
    },
    onClickPreview () {
      this.isCurrentPreview = true
    },
    onClickCancelPreview () {
      this.isCurrentPreview = false
    },
    onSelectedRow (row) {
      if (row && row.dataItem) {
        this.getScriptDetail(row.dataItem.userInitScriptIdx)
      }
    },
    async getScriptDetail (id) {
      if (this.scriptMap.get(id)) {
        const { initScript } = this.scriptMap.get(id)
        this.scriptCode = initScript
        return
      }

      this.isLoadingScriptDetail = true

      try {
        const { data } = await API.script.getScriptDetail(id)
        this.scriptMap.set(id, data)
        this.scriptCode = data.initScript
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('스크립트 조회에 실패하였습니다.'))
      } finally {
        this.isLoadingScriptDetail = false
      }
    },
    async getScriptList () {
      this.isLoadingScript = true

      try {
        const { data } = await API.script.getScriptList()
        this.scriptList = data
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('스크립트 조회에 실패하였습니다.'))
      } finally {
        this.isLoadingScript = false
      }
    }
  },
  data: (root) => ({
    scriptList: [],
    scriptMap: new Map(),
    scriptColumns: [
      { binding: 'initScriptName', header: 'Script 명' },
      { binding: 'description', header: '설명' }
    ],
    scriptCode: '',
    isLoadingScript: false,
    isLoadingScriptDetail: false,
    isCurrentPreview: false
  })
}
</script>

<style lang="scss" scoped>
.script-fetch {
  display: flex;
  flex-wrap: nowrap;

  &-grid {
    flex: 0 1 30%;
    margin-right: $gap-m;
  }

  &-editor {
    flex: 1;
    position: relative;

    button {
      position: absolute;
      top: 10px;
      right: 15px;
      z-index: 9999;
    }

    .cmp-code-editor {
      min-height: 500px;

      &::v-deep {
        .CodeMirror-scroll {
          max-height: 500px;
        }
      }
    }
  }
}
</style>
