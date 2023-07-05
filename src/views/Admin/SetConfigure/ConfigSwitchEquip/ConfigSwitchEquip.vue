<!--
  * 파일명 : ConfigSwitchEquip.vue
  * 파일 기능 : 구성관리 > 스위치 장비 정보
  * 작성자 : 이유준
  * 최종 작성일 : 2021-01-26
  * License By Shinsegae I&C
  * 2021-01-26 fix: sorting 추가 수정
 -->

<template>
  <div
    class="config-switch-equip"
    v-loading="loading || isGroupTree"
  >
    <section class="table-top-wrap">
      <total-count :total-count="totalResultCnt" />

      <div class="button-area -right">
        <div class="button-area">
          <button
            class="button"
            type="is-primary"
            @click="e => handleOpenSwitchEdit('CREATE')"
          >
            {{ $v('항목 추가') }}
          </button>
          <button
            class="button"
            :disabled="selectedRow===null"
            @click="e => handleOpenSwitchEdit('UPDATE')"
          >
            {{ $v('변경') }}
          </button>
          <button
            class="button"
            type="is-anti"
            @click="handleClickSwitchDelete(selectedRow)"
            :disabled="selectedRow === null"
          >
            {{ $v('삭제') }}
          </button>
          <!-- / comment 1015
            vue나 angular등의 탬플릿 언어에서 사용되는 eventListener 설정의 기본적인 함정이기도 한데요
            @click="applyUpdateItem()" = event => applyUpdateItem(event)
            @click="applyUpdateItem" = event => applyUpdateItem(event)
            @click="applyUpdateItem('안녕')" = event => applyUpdateItem('안녕')
            요런식으로, 특정 함수를 바인딩 할 경우, 기본 인자로 HTMLEvent 객체가 자동 삽입되어버리기도 해요
            그래서 핸들러 펑션에서 얘기치 못한 에러가 날 수도 있어서
            개인적으로는 아래처럼 자동 삽입되는 인자가 최대한 없어지도록 하는거를 선호하는 편이에요
            e => applyUpdateItem(selectedRow._data)
            e => applyUpdateItem()
          -->
        </div>
      </div>
    </section>

    <section class="table-area">
      <!-- tableData -->
      <cmp-grid
        class="switch-vdom-grid"
        :item-source="tableData"
        :columns="columns"
        @total-count="cnt => totalResultCnt = cnt"
        @selectedRow="handleSelectedRow"
        selectable
        :use-excel-download="true"
      >
        <template #masterUrl="props">
          <span class="test">
            {{ props.row.masterUrl }}
          </span>
        </template>
        <template #isManualManagement="props">
          <el-checkbox
            v-model="props.row.isManualManagement"
            :disabled="true"
          />
        </template>
        <template #isSync="props">
          <cmp-status-tag
            v-if="props.row.isSync !== null"
            :type="props.row.isSync ? 'is-success' : 'is-fail'"
          >
            <span>{{ props.row.isSync ? '성공' : '실패' }}</span>
          </cmp-status-tag>
        </template>
        <template #isConnect="props">
          <div style="text-align: center;">
            <span
              v-if="props.row.isConnect"
              class="state-icon success"
            />
            <span
              v-else
              class="state-icon error"
            />
          </div>
        </template>
        <template #lastSyncTime="props">
          {{ $options.filters.date(props.row.lastSyncTime, 'YYYY-MM-DD HH:MM') }}
        </template>
      </cmp-grid>
    </section>

    <!-- 모달 -->
    <!-- 항목 생성/수정 모달 -->
    <el-dialog
      :title="modalTitle"
      :visible.sync="modalStatus.isOpen"
      class="new-item-modal"
      width="680px"
      @close="modalStatus.isOpen = false"
    >
      <transition name="fade">
        <modal-switch-equip-edit
          v-if="modalStatus.isOpen"
          :modal-status="modalStatus"
          :selected-row="selectedRow"
          @cancel="modalStatus.isOpen=false"
          @confirm="handleConfirmSwitchEdit"
        />
      </transition>
    </el-dialog>
  </div>
</template>
<script>

import API, { CmpStatusTag } from '@sd-fe/cmp-core'
import { mapState } from 'vuex'
import ModalSwitchEquipEdit from './ModalSwitchEquipEdit.vue'

export default {
  name: 'ConfigSwitchEquip',
  components: {
    CmpStatusTag,
    ModalSwitchEquipEdit
  },
  computed: {
    ...mapState({
      userInfo: state => state.auth.user
    })
  },
  watch: {
    'modalStatus.isOpen' (newVal) {
      if (newVal) this.setModalTitle()
    }
  },
  async mounted () {
    await this.initTable()
  },
  methods: {
    init (grid) {
      this.grid = grid
    },
    handleConfirmSwitchEdit () {
      this.initTable()
      this.modalStatus.isOpen = false
    },
    /** EVENT_HANDLER (모달 오픈) 항목추가 및 변경
    ** type: 'CREATE' or 'UPDATE'
    **/
    handleOpenSwitchEdit (type) {
      this.modalStatus.type = type
      this.modalStatus.isOpen = true
    },
    // EVENT_HANDLER (선택) 그리드 로우 선택
    handleSelectedRow (sRow) {
      console.log('🚀 ~ file: ConfigSwitchEquip.vue:154 ~ handleSelectedRow ~ sRow:', sRow)
      if (sRow?._data) { this.selectedRow = sRow._data } else this.selectedRow = null
    },
    async initTable () {
      this.tableData = await this.getEquipSwitchList()
    },
    async getEquipSwitchList () {
      this.loading = true
      try {
        const response = await API.network.getEquipSwitchList()
        return response
      } catch (error) {
        console.error(error)
        this.tableData = []
        this.$alert(error, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm')
        })
      } finally {
        this.loading = false
      }
    },
    // API_HANDLER  (DELETE) 네트워크 장비 삭제
    async deleteEquipNetwork (netIdx) {
      try {
        const payload = {
          userId: this.userInfo.userId,
          netIdx
        }
        await API.network.deleteEquipNetwork(payload)

        return true
      } catch (error) {
        this.$alert(this.$t('common.ALERT.BASE.015'), { dangerouslyUseHTMLString: true }) // 삭제에 실패하였습니다.<br>관리자 문의 부탁드립니다.
        console.error(error)
      }
    },
    /**
     * 생성/수정 모달 타이틀 설정
     */
    setModalTitle () {
      if (this.modalStatus.type === 'UPDATE') {
        this.modalTitle = this.$t('admin.PREF.changeItem')
      } else {
        this.modalTitle = this.$t('common.TERMS.itemAdd')
      }
    },
    /**
     * EVENT_HANDLER [삭제] 버튼을 눌렀을 때, 선택한 row 삭제 여부를 리턴합니다.
     * @return {Boolean} 삭제 성공 여부
     */
    async handleClickSwitchDelete (removeObj) {
      const isConfirmed = await this.$confirm(this.$t('common.CONFIRM.BASE.032'), '삭제', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => true).catch(() => false)
      if (isConfirmed) {
        const isDeleted = await this.deleteEquipNetwork(removeObj.netIdx)
        if (isDeleted) {
          this.initTable()
          this.$alert(this.$t('common.ALERT.BASE.017')) // 삭제되었습니다.
        }
      }
    }
  },
  data () {
    return {
      totalResultCnt: 0,
      loading: false,
      isGroupTree: false,
      selectedRow: null,
      modalTitle: '',
      modalStatus: {
        type: 'CREATE',
        isOpen: false
      },
      tableData: [],
      initData: null,
      lastSync: null,

      // 테이블 수정 정보
      // companyOptions: [],
      relationCompOptions: [],
      networkEquipOptions: [],

      // 테이블 정보
      columns: [
        { header: this.$v('스위치 장비명'), binding: 'netName', width: 250, align: 'left' },
        { header: this.$v('장비 타입'), binding: 'equipType', width: 250 },
        { header: this.$v('수기관리여부'), binding: 'isManualManagement', width: 150, customHtml: true },
        { header: 'MasterURL', binding: 'masterUrl', width: '*', customHtml: true },
        { header: this.$v('연결 상태'), binding: 'isConnect', width: 120, customHtml: true },
        { header: this.$v('동기화 상태'), binding: 'isSync', width: 100, customHtml: true },
        { header: this.$v('마지막 동기 시간'), binding: 'lastSyncTime', width: 250, dataType: 'Date', customHtml: true }
      ],
      MOCK_DATA: [{
        id: 'testUser1',
        netIdx: 2,
        password: 32,
        equipType: 'FORTGATE', // 연동설정에서도 쓰임
        netName: 'test-fw-equip',
        apiUrl1: 'http://localhost:8080/main/link-setting/nx/switch-equip',
        apiUrl2: 'http://localhost:8080/main/link-setting/nx/switch-equip',
        masterUrl: 'http://localhost:8080/main/link-setting/nx/switch-equip',
        intervalSec: 3,
        isManualManagement: true,
        comment: 'Switch 장비가 하드코딩되어 있습니다.',
        lastSyncTime: new Date().getTime() // this.$options.filters.date(job.lastEndTime)
      }
      ]
    }
  }
}
</script>
<style lang="scss">
  .config-switch-equip {
    .table-area {
      margin-top: $gap;
      // .switch-vdom-grid {
      //   .wj-cell {
      //     overflow: visible;
      //     padding: 0 $gap * 2;
      //     cursor: pointer;
      //   }
      // }
    }
  }
  .test {
    overflow: hidden;
    text-overflow: ellipsis;
  }
  //transition 효과
.fade-enter-active,
.fade-leave-active {
  transition: opacity;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
  transition-delay: 1s;
}
</style>
