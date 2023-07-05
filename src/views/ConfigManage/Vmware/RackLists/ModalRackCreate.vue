<!--
  * 파일명 : ModalRackCreate.vue
  * 파일 기능 : VMware 랙 생성 form
  * 작성자 : 이유준
  * 최종 작성일 : 2022-10-21
  * License By Shinsegae I&C
 -->

<template>
  <div class="network-equip-creator">
    <section class="modal-body">
      <register-contents
        :title="$t('common.MODAL.name')"
        required
      >
        <el-input
          :placeholder="$t('common.MODAL.name')"
          v-model="nameInput"
        />
      </register-contents>
      <!-- 이름 -->
    </section>

    <section class="modal-footer modal-button-area">
      <button
        class="button -modal-button"
        type="is-anti"
        @click="closeModal"
      >
        {{ $t('common.BTN.cancel') }}
      </button>
      <button
        class="button -modal-button "
        type="is-primary"
        @click="applySave"
      >
        {{ !data ? $t('common.BTN.add') : $t('common.BTN.apply') }}
      </button>
    </section>
  </div>
</template>

<script>
// import { cloneDeep } from 'lodash'

export default {
  props: {
    data: {
      type: Object,
      default: null
    },
    selectedBlock: {
      type: Object,
      default: null
    },
    ctgDatas: { // 네트워크 카테고리 전체 데이터
      type: Array,
      default: () => []
    },
    clusters: {
      type: Array,
      default: () => []
    },
    datacenterList: {
      type: Array,
      default: () => []
    },
    isEditRackModal: {
      type: Boolean,
      default: false
    }
  },
  created () {
    console.log(this.data)
  },
  computed: {
  },
  watch: {
    data: {
      immediate: true,
      handler (newVal) {
        if (newVal !== null) this.setInitData(newVal)
      }
    }
  },
  methods: {
    setInitData (data) {
      if (data.rackName) this.nameInput = data.rackName // 이름
      if (data.rackIdx) this.rackIdx = data.rackIdx // 이름
    },
    /**
     * 모달 정보 초기화
     */
    initData () {
      this.nameInput = ''
    },
    /**
     * 모달 닫기 이벤트
     */
    closeModal () {
      this.initData()
      this.$emit('close-modal')
    },
    /**
     * [추가, 수정]
     */
    applySave () {
      if (!this.validForm()) return

      // const message = this.$v('랙을 추가하시겠습니까?')
      let message
      if (this.data === null) message = this.$v('랙을 추가하시겠습니까?')
      else message = this.$v('랙을 수정하시겠습니까?')

      this.$confirm(message, '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel'),
        dangerouslyUseHTMLString: true
      }).then(() => {
        const payload = {
          isNew: this.data === null,
          rackIdx: this.rackIdx,
          rackName: this.nameInput
          // sequence: '99'
        }
        this.$emit('apply-save', payload)
      })
        .catch(() => false)
    },
    /**
     * 생성, 수정시 validation
     * @return validation 통과 유무
     */
    validForm () {
      const alert = (message, callback) => {
        this.$alert(message, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          callback: callback
        })
      }

      if (!this.nameInput) return alert(this.$t('common.ALERT.ORG.009'), () => false) // 이름을 입력해주세요.
      return true
    }
  },
  data () {
    return {
      nameInput: '', // 이름
      rackIdx: null // elementIdx
    }
  }
}
</script>

<style lang="scss" scoped>
.network-equip-creator {
  .datacenter-selector {
    width: 150px;
    margin-right: $gap-s;
  }

  .modal-body {
    border-top: 1px solid $border-color;
    height: 120px;
    .host-container {
      width:100%;
     .host-title {
      margin-top: $gap *2;
      margin-bottom: $gap/2;
      color: white;
      font-weight: 300;
     }
     .divider {
      width: 100%;
      height: 1px;
      margin: auto;
      background: #727797;
    }
    .host-container--draggable {
      display: grid;
      align-items: center;
      position: relative;
      grid-template-columns: 1fr 1fr;
      grid-gap: 2px;
      background: #1D2E4D;
      min-height: 80px;
      margin-top: 20px;
      margin-left: auto;
      margin-right:auto;
      padding: 8px;
      border-radius: 4px;
      &.host-grid-full {
        grid-template-columns: 1fr;
      }
      .host-card {
        .host-index {
          font-weight: 600;
        }

        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        height: 80px;
        font-style: normal;
        background: #365283;
        border: none;
        border-radius: 4px;
        &.no-data-card {
          box-sizing: border-box;
          background: none;
          border: 2px dashed #365283;

        }
        .host-selector {
          margin-left:20px;
          width: 80%;
          &:not(is-focus) {
            border:1px solid white;
          }
          &.no-data-selector {
            border: 1px solid #727797;
            color: #727797;
          }
        }
      }
    }
    }
  }
}
</style>
