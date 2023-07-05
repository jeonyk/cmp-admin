<!--
  * 파일명 : SetVmList.vue
  * 파일 기능 : Stroage > 연결 호스트 설정 모달
  * 작성자 : 이경환 외 2명
  * 최종 작성일 : 2021-02-23
  * License By Shinsegae I&C
  * 2021-02-23 fix: 사전협의 > Storage 추가 연결정보 validate 수정
 -->

<template>
  <!-- 연결 호스트 설정 -->
  <el-dialog
    :title="$t('common.MODAL.setConHost')"
    :visible.sync="isActive"
    :width="width"
    class="set-vmlist-modal"
    top="5vh"
    @close="close"
  >
    <section
      v-if="isActive"
      class="modal-body"
    >
      <article
        v-loading="loading"
        class="connection-contents"
      >
        <h5 class="modal-sub-title sub-title">
          <!-- 연결 호스트 -->
          {{ $t('common.MODAL.setCon') }}
        </h5>
        <div class="table-area">
          <cmp-grid
            :item-source="vms"
            :columns="vmColumns"
            selectable
            @selectedRow="setVmList"
            init-auto-select-row-key="chargeVmUuid"
            :init-auto-select-row="data.row"
          />
        </div>
      </article>

      <article
        v-if="selectConnectInfo && optionVms.length > 0"
        class="connection-contents -cluster"
      >
        <h5 class="modal-sub-title sub-title">
          <!-- 추가 연결 정보 -->
          {{ $t('common.MODAL.additionalSetCon') }}
        </h5>
        <div class="table-area">
          <cmp-grid
            v-if="selectConnectInfo && optionVms.length > 0"
            :item-source="optionVms"
            :columns="optionColumns"
            header-checkbox
            @checkedRowsData="setoptionVms"
            init-auto-select-row-key="userVmIdx"
            :init-auto-select-row="autoSaveOptionVms"
          />
        </div>
      </article>
      <!-- /. 클러스터 선택 -->
    </section>

    <section class="modal-footer big-button-area">
      <button
        class="button"
        type="is-anti"
        @click="close"
      >
        <!-- 취소 -->
        {{ $t('common.BTN.cancel') }}
      </button>
      <button
        class="button"
        type="is-primary"
        @click="confirm"
      >
        <!-- 확인 -->
        {{ $t('common.BTN.confirm') }}
      </button>
    </section>
  </el-dialog>
</template>

<script>
import API from '@sd-fe/cmp-core'

export default {
  name: 'SetVmList',
  props: {
    data: { // 선택된 row를 가져옵니다
      type: Object,
      default () {}
    },
    active: {
      type: Boolean,
      default: false
    },
    width: {
      type: String,
      default: '80%'
    }
  },
  watch: {
    active (newVal) {
      this.isActive = newVal
    },
    isActive (newVal) {
      this.active = newVal
      if (newVal) this.getVm()
    },
    selectConnectInfo (newVal) {
      // console.log('연결정보 row가 변경될때마다 실행')
      this.settingOptionVms()
    }
  },
  methods: {
    /**
     * [연결 정보] 그리드 데이터 입력
     */
    async getVm () {
      this.loading = true

      try {
        // [연결 정보] 데이터 바인딩
        const data = await API.compute.getVms({ projectIdx: this.data.row.projectId })

        this.vms = data.map(item => {
          item.chargeVmUuid = item.vmUuid
          return item
        })

        // [추가 연결정보] 자동 선택
        const vmList = this.data.row.vmList
        this.autoSaveOptionVms = [...vmList]
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.$alert(message, '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
      } finally {
        this.isGetVms = false
        this.loading = false
      }
    },
    /**
     * [연결 정보] 클릭, row 데이터 저장
     * @param { Object || null } row 선택한 row 정보 저장
     */
    setVmList (row) {
      if (row) this.selectConnectInfo = row.dataItem
      else {
        this.selectConnectInfo = row
        this.autoSaveOptionVms = []
      }

      this.selectedOptionVms = []
    },
    /**
     * [추가 연결정보] 데이터를 그리드에 입력합니다.
     */
    settingOptionVms () {
      try {
        this.optionVms = []
        if (!this.selectConnectInfo) return

        const selectConnectInfo = this.selectConnectInfo

        if (this.vms.length) {
          this.optionVms = this.vms.filter(vm => {
            return (
              vm.userVmIdx !== selectConnectInfo.userVmIdx &&
              vm.elementIdx === selectConnectInfo.elementIdx
            )
          })

          // [연결정보] 하나만 선택한경우, 다시 말해[추가 연결정보]가 없을경우,
          // [추가 연결정보] 체크박스 전체 해제
          if (!this.optionVms.length) this.setoptionVms([])
        }
      } catch (error) {
        console.error(error)
      }
    },
    /**
     * [추가 연결정보] 체크박스가 변경될때마다 일어나는 메서드입니다.
     * @param { Array } options 체크된 추가 연결정보 배열 데이터
     */
    setoptionVms (options) {
      this.selectedOptionVms = [...options]
    },
    /**
     * [확인] 버튼을 클릭했을때 외부 테이블에 데이터를 emit 합니다.
     */
    confirm () {
      // [연결 정보]를 선택하지 않았을 경우
      if (!this.selectConnectInfo) {
        return this.$alert(this.$t('common.ALERT.PROJECT.017'), '', { confirmButtonText: this.$t('common.BTN.confirm') })
      }

      // console.log(this.selectedOptionVms, '---- Hoxy 추가 연결정보가 선택되었나요?')

      // [추가 연결정보]가 있을 때 설정합니다.
      const conInfo = !this.selectedOptionVms.length ? [] : (
        this.selectedOptionVms.map(vms => {
          const { hostname, userVmIdx, isDeleted, elementIdx } = vms

          return {
            computeName: hostname,
            userVmIdx: userVmIdx,
            deleted: isDeleted,
            elementIdx: elementIdx
          }
        })
      )

      // [연결 정보] 데이터
      const { hostname, userVmIdx, isDeleted, elementIdx } = this.selectConnectInfo

      const connectionInfo = {
        computeName: hostname,
        userVmIdx: userVmIdx,
        deleted: isDeleted,
        elementIdx: elementIdx
      }

      // 할일 > storage 정보에 chargeVmUuid 가 필요하므로 전달해줍니다.
      const chargeVmUuid = this.selectConnectInfo.chargeVmUuid

      /**
       * @name conInfo
       * @type {Array} [연결정보, 추가 연결정보] 형태로 데이터를 전송함
       * 어차피 연결정보는 한개만 선택 가능해서 맨 앞에 놓으면 됩니다!
       */
      conInfo.unshift(connectionInfo)

      this.$emit('save', { data: [...conInfo], chargeVmUuid, idx: this.data.cell.index })
      this.close()
    },
    /**
     * [취소], [확인] 클릭시 닫기 실행
     */
    close (data) {
      this.gridRefresh()
      this.selectConnectInfo = null
      this.selectedOptionVms = []
      this.vms = []
      this.optionVms = []
      this.autoSaveOptionVms = []
      this.$emit('close')
    },
    gridRefresh (grid) {
      if (grid) {
        const cv = grid.collectionView
        if (cv) cv.refresh()
      }
    }
  },
  data () {
    return {
      isActive: this.active || false,
      loading: true,

      vms: [],
      optionVms: [],
      autoSaveOptionVms: [],
      vmColumns: [{ header: this.$v('호스트명'), binding: 'vmName' }],
      optionColumns: [{ header: this.$v('호스트명'), binding: 'vmName' }],

      selectConnectInfo: null,
      selectedOptionVms: []
    }
  }
}
</script>

<style lang="scss" scoped>
.modal-body {
  height: 65vh;
  overflow-y: auto;

  > article {
    &:first-child {
      margin-bottom: 40px;
    }
  }
}
</style>
