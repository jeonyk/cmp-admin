<!-- S/W 라이선스 추가 모달 -->
<template>
  <el-dialog
    :visible="active"
    title="Init Script 등록"
    width="850px"
    top="50px"
    @close="$emit('close')"
    style="overflow-y: scroll;"
  >
    <div class="init-script-wrapper">
      <div class="script-area">
        <h5 class="title">
          Init Script
          <i class="-required">*</i>
        </h5>
        <textarea
          class="script-contents textarea tiny-scroll"
          :placeholder="$t('service.AMIImage.PLACEHOLDER.009')"
          v-model="scriptContent"
        />
      </div>
      <!-- /. Init Script 내용 -->

      <div class="reference-area">
        <h5 class="title">
          <!-- 비고 -->
          {{ $t('service.AMIImage.remark') }}
          <i class="-required">*</i>
        </h5>

        <textarea
          class="reference-contents textarea tiny-scroll"
          :placeholder="$t('service.AMIImage.PLACEHOLDER.010')"
          v-model="remarkContent"
        />
      </div>
      <!-- /. 비고 내용 -->
    </div>

    <section class="modal-button-area">
      <button
        class="button"
        type="is-anti"
        @click="$emit('close')"
      >
        <!-- 닫기 -->
        {{ $t('common.BTN.close') }}
      </button>
      <button
        class="button"
        type="is-primary"
        @click="save"
      >
        <!-- 저장 -->
        {{ $t('common.BTN.save') }}
      </button>
    </section>
    <!-- /. 닫기 / 저장 -->
  </el-dialog>
</template>

<script>
export default {
  name: 'InitScript',
  components: {
  },
  props: {
    active: {
      type: Boolean,
      required: true
    }
  },
  watch: {
    active (status) {
      if (!status) {
        setTimeout(() => {
          this.scriptContent = undefined
          this.remarkContent = undefined
        }, 50)
      }
    }
  },
  methods: {
    validator () {
      if (this.scriptContent === undefined || this.scriptContent === '') {
        // Init Script 를 입력해주세요.
        this.$alert(this.$t('service.AMIImage.ALERT.006'), { callback: () => false })
        return false
      }
      if (this.remarkContent === undefined || this.remarkContent === '') {
        // 비고를 입력해주세요.
        this.$alert(this.$t('service.AMIImage.ALERT.007'), { callback: () => false })
        return false
      }

      return true
    },
    save () {
      if (this.validator() === false) return

      // InitScript 를 <br> 등록하시겠습니까?
      return this.$confirm(this.$t('service.AMIImage.ALERT.012'), {
        dangerouslyUseHTMLString: true,
        confirmButtonText: this.$t('common.BTN.enroll'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        const content = {
          script: this.scriptContent,
          remark: this.remarkContent
        }

        this.$emit('save-script', content)
        this.$emit('close')
      }).catch(() => false)
    }
  },
  data () {
    return {
      scriptContent: undefined,
      remarkContent: undefined
    }
  }
}
</script>

<style lang="scss" scoped>
.init-script-wrapper {
  .title {
    font-weight: bold;
    font-size: 14px;
    height: 14px;
    margin-bottom: 15px;
    position: relative;

    .-required {
      color: $main-red;
      font-style: normal;
      position: absolute;
      margin-left: 5px;
      top: -2px;
    }
  }

  .textarea {
    border-radius: 5px;
    box-sizing: border-box;
    padding: 20px 25px;
    overflow-y: auto;
    font-size: 13px;
    color: $text-black;
    background-color: $white;
    display: block;
    width: 100%;
    line-height: 1.5;
    resize: none;
    transition: 0.3s background-color ease;

    &:focus { outline: none;}
  }

  .script-contents {
    height: 250px;
    margin-bottom: $gap-m;
  }
  .reference-contents {
    height: 100px;
  }
}
</style>
