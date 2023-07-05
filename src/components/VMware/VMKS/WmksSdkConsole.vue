<template>
  <el-dialog
    :title="hostname || 'Web Console'"
    width="870px"
    :visible.sync="isActive"
    :before-close="beforeCloseModal"
  >
    <!-- @close="close()" -->
    <section
      class="wmks-sdk-console"
      v-loading="isConnect"
      :element-loading-text="$v('웹 콘솔 연결 중입니다.')"
    >
      <button
        v-if="wmksInfo"
        class="button -full-screen-btn is-icon"
        type="is-icon"
        @click="() => {
          if(wmksInfo) wmksInfo.enterFullScreen()
        }"
      >
        <i class="mdi mdi-fullscreen" />
      </button>

      <div id="wmksContainer" />
      <!-- <div
        id="msgBox"
        style="overflow: auto;"
      /> -->
    </section>
    <div class="modal-button-area">
      <button
        class="button"
        type="is-anti"
        @click="beforeCloseModal()"
      >
        {{ $v('닫기') }}
      </button>
    </div>
  </el-dialog>
</template>

<script>
import { loadScript, unloadScript } from 'vue-plugin-load-script'

export default {
  name: 'WmksSdkConsole',
  props: {
    hostname: {
      type: String,
      default: ''
    },
    active: {
      type: Boolean,
      default: false
    },
    ticket: {
      type: String,
      require: true,
      default: null
    },
    host: {
      type: String,
      require: true,
      default: null
    },
    port: {
      type: [String, Number],
      require: true,
      default: null
    }
  },
  async created () {
    await Promise.all([
      loadScript('https://code.jquery.com/jquery-1.8.3.min.js'),
      loadScript('https://code.jquery.com/ui/1.8.16/jquery-ui.min.js')
    ]).then(() => {
      this.$nextTick(async function () {
        await loadScript('/wmks.min.js')
        const WMKS = window.WMKS
        this.WMKS = WMKS

        this.createWMKS()
      })
    })
  },
  destroyed () {
    unloadScript('/wmks.min.js')
    unloadScript('https://code.jquery.com/jquery-1.8.3.min.js')
    unloadScript('https://code.jquery.com/ui/1.8.16/jquery-ui.min.js')
  },
  computed: {
    url () {
      if (this.host && this.port && this.ticket) return `wss://${this.host}:${this.port}/ticket/${this.ticket}`
      else return ''
    }
  },
  watch: {
    active: {
      immediate: true,
      handler (val) { this.isActive = val }
    },
    // url () {
    //   if (!window.wmks) this.createWMKS()
    // },
    wmksInfo () {
      if (this.wmksInfo) this.connect()
    }
  },
  methods: {
    createWMKS () {
      if (!this.WMKS) return
      try {
        this.wmksInfo = this.WMKS?.createWMKS('wmksContainer')

        if (this.wmksInfo) {
          console.log('createWMKS successfully!')
        }
      } catch (error) {
        this.$alert('웹 콘솔 조회에 일시적으로 문제가 발생했습니다.<br>다시 시도해주세요.', {
          dangerouslyUseHTMLString: true,
          callback: () => this.close()
        })
      }
    },
    connect (wmks = this.wmksInfo, url = this.url) {
      if (!url || !wmks) return
      try {
        this.isConnect = true
        wmks.connect(url)
      } catch (error) {
        this.$alert('웹 콘솔 조회에 문제가 발생했습니다.<br>관리자에게 문의해주세요.', {
          dangerouslyUseHTMLString: true,
          callback: () => this.close()
        })
      } finally {
        this.isConnect = false
      }
    },
    /**
    * 모달 닫기 전, 얼럿
    */
    beforeCloseModal (done) {
      this.$confirm(this.$v('Console 내 로그아웃을 하지 않으면 Session이 유지됩니다.<br>Console 창을 닫으시겠습니까?'), {
        dangerouslyUseHTMLString: true
      })
        .then(() => {
          this.close()
        }).catch(() => false)
    },
    close () {
      if (this.wmksInfo) {
        this.wmksInfo.disconnect()
        this.wmksInfo.destroy()
        this.wmksInfo = undefined
      }
      this.$emit('close')
    }
  },
  data: () => ({
    isActive: false,
    wmksInfo: null,
    WMKS: null,

    // 로딩
    isConnect: false
  })
}
</script>

<style lang="scss" scoped>
  .wmks-sdk-console {
    position: relative;
    width: 800px;
    min-height: 600px;
    background-color: rgba($color: #000, $alpha: 0.2);
    * { transition: all .2s; }
    .-full-screen-btn {
      position: absolute;
      bottom: 10px;
      right: 10px;
      z-index: 1;
      .mdi-fullscreen {
        &:before {
          font-size: 26px;
        }
      }
    }
  }

  #wmksContainer {
    > #mainCanvas {
      position: static;
      display: block;
    }
  }
</style>
