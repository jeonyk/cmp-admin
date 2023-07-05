<!--
  * 파일명 : ServerManager.vue
  * 파일 기능 :
  * 작성자 : 김예담
  * 최종 작성일 : 2021-02-18
  * License By Shinsegae I&C
  * 2021-02-18 fix: 자원 이관 form 내에 모달 position: fixed로 변경
 -->

<template>
  <section
    class="select-manager-section"
    v-if="isActive"
  >
    <div
      v-if="useHeader"
      class="-header"
    >
      <a @click="close">
        <close-icon
          class="close-button"
          icon-color="white"
          :width="16"
          :height="16"
        />
      </a>
      <h6 class="-title">
        {{ $t('admin.PREF.serverManager') }}
      </h6>
    </div>

    <div class="table-area">
      <cmp-grid
        :columns="columns"
        :item-source="gridData"
        :init-custom-action="initGrid"
        selectable
        @selectedRow="setSelectServer"
        :init-auto-select-row.sync="selectedObject"
        init-auto-select-row-key="roleIdx"
        :use-excel-download="false"
        :height="350"
        paging-type="list"
      >
        <template #company="props">
          <ul class="company-list">
            <li
              v-for="(comp, index) in props.row.company"
              :key="index"
            >
              {{ comp }}
            </li>
          </ul>
          <!-- <span v-if="props.row.company.length === 1">{{ props.row.company[0] }}</span>
          <el-tooltip
            placement="top"
            popper-class="-scroll"
            effect="light"
            v-else
          >
            <template #content>
              <ul class="more-info-list">
                <li
                  class="more-info-item"
                  v-for="(item, idx) in props.row.company"
                  :key="idx"
                >
                  {{ item }}
                </li>
              </ul>
            </template>

            <span v-if="props.row.company.length === 1">
              {{ props.row.company[0] }}
            </span>
            <span v-else-if="props.row.company.length > 1">
              {{ props.row.company[0] }} {{ $t('common.TERMS.other') }} {{ props.row.company.length - 1 }}
            </span>
            <span v-else />
          </el-tooltip> -->
        </template>
      </cmp-grid>
    </div>

    <div class="apply-wrap modal-button-area">
      <button
        class="button"
        type="is-primary"
        @click="save"
      >
        <!-- :disabled="!this.selectedServer" -->
        {{ $t('common.BTN.apply') }}
      </button>
    </div>
  </section>
</template>
<script>
import CloseIcon from '@/components/Icons/CloseIcon.vue'

export default {
  name: 'ServerManager',
  components: { CloseIcon },
  props: {
    useHeader: { // el-dialog를 사용할 때는 false로 설정해주세요
      type: Boolean,
      default: true
    },
    active: {
      type: Boolean,
      default: false
    },
    triggerBtn: { // 외부에 정의된 trigger 버튼 > 모달안에 모달을 띄울 경우 사용합니다...!!!
      // 부모 컴포넌트의 trigger 버튼에 ref="svManagerTrigger"라고 정의해주세요
      // 외부를 클릭하면 모달을 닫도록 해요!
      type: Object,
      default: undefined
    },
    data: {
      type: Array,
      default () {
        return []
      }
    },
    selectedObject: {
      type: Object,
      default: null
    }
  },
  created () {
    if (typeof window !== 'undefined') {
      document.addEventListener('keyup', this.keyPress)
    }
    if (this.triggerBtn?.svManagerTrigger) document.addEventListener('click', this.clickTarget)
    this.gridData = this.data
  },
  beforeDestroy () {
    if (typeof window !== 'undefined') {
      document.removeEventListener('keyup', this.keyPress)
      document.removeEventListener('click', this.clickTarget)
    }
  },
  watch: {
    active (newval) {
      this.isActive = newval

      if (newval) {
        if (this.selectedObject) {
          this.selectedServer = { ...this.selectedObject }
        }
      }
    },
    isActive (newval) {
      this.active = newval
    },
    selectedObject: {
      immediate: true,
      handler (newVal) {
        if (newVal) this.selectedServer = { ...newVal }
        else this.selectedServer = null
      }
    }
  },
  methods: {
    initGrid (grid) {
      this.grid = grid
    },
    gridRefresh (grid) {
      const cv = grid.collectionView
      cv.refresh()
    },
    setSelectServer (param) {
      if (param) this.selectedServer = param.dataItem
      else this.selectedServer = null
    },
    keyPress (e) {
      if (this.isActive && e.keyCode === 27) this.close()
    },
    close () {
      this.selectedServer = null
      this.gridRefresh(this.grid)
      this.$emit('close')
    },

    save () {
      if (!this.selectedServer) this.$alert(this.$t('common.ALERT.PROJECT.036'), '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
      else if (this.selectedServer.roleIdx === this.selectedObject?.roleIdx) this.close()
      else {
        this.$confirm(this.$t('common.CONFIRM.ROLE.003'), '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          cancelButtonText: this.$t('common.BTN.cancel')
        }).then(() => {
          this.$emit('save', this.selectedServer)
          this.close()
        }).catch(() => false)
      }
    },

    // clickTarget (e) {
    //   if (e.target !== this.triggerBtn.svManagerTrigger) {
    //     const body = document.querySelector('.select-manager-section')
    //     const elements = Array.from(body.querySelectorAll('*'))
    //     const validator = elements.some(element => element === e.target)

    //     const alert = document.querySelector('.el-message-box__wrapper')
    //     if (alert) {
    //       const alertInner = Array.from(alert.querySelectorAll('*'))
    //       const isAlert = alertInner.some(element => element === e.target) || e.target === alert
    //       if (isAlert) return false
    //     }
    //     if (!validator) {
    //       return this.close()
    //     }
    //   }
    // }

    /**
     * 영역 외부 클릭시 (alert창 제외) 모달 닫히게 합니다.
     */
    clickTarget (e) {
      if (e.target !== this.triggerBtn.svManagerTrigger) {
        const elements = Array.from(this.$el.querySelectorAll('*'))
        const validator = elements.some(element => element === e.target) || e.target === this.$el

        const alert = document.querySelector('.el-message-box__wrapper')
        if (alert) {
          const alertInner = Array.from(alert.querySelectorAll('*'))
          const isAlert = alertInner.some(element => element === e.target) || e.target === alert
          if (isAlert) return false
        }

        if (!validator) return this.close()
      }
    }
  },
  data () {
    return {
      isActive: this.active || false,

      selectedServer: null,
      columns: [
        // { binding: 'roleUpper', header: '업무 역할', width: 200, keyPath: 'admin.ROLE.jobRole' },
        { binding: 'roleName', header: '담당 역할', width: 200, keyPath: 'admin.ROLE.role' },
        { binding: 'company', header: '담당 관계사', width: '*', customHtml: true, keyPath: 'admin.ROLE.chargeAff', wordWrap: true }
      ],
      gridData: []
    }
  }
}
</script>
<style lang="scss" scoped>
.select-manager-section {
  position: relative;
  .-header {
    .close-button {
      position: absolute;
      top: $gap; right: $gap;
      cursor: pointer;
    }
    .-title {
      font-size: 16px;
      margin-bottom: $gap;
    }
  }
  .apply-wrap {
    position: absolute;
    bottom: $gap;
    width: calc(100% - 40px);
    text-align: center;
  }
  .company-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    > li {
      position: relative;
      display: inline-block;
      &:not(:last-child) {
        &::after {
          content: ', ';
          position: absolute;
          left: 102%;
          bottom: 0;
        }
      }
    }
  }

}
</style>
