<!--
  * 파일명 : TaskStorage.vue
  * 파일 기능 : [Storage] 관련 그리드입니다. 관련 그리드 데이터를 외부에서 받아 수정/변경 할 수 있습니다.
  * 작성자 : 염창윤 외 2명
  * 최종 작성일 : 2021-02-16
  * License By Shinsegae I&C
  * 2021-02-16 업무 > 사전협의 : 1. 그리드 엑셀다운로드 불필요한 곳 삭제 2. VLAN ID 노출 관련 수정
 -->

<template>
  <div class="task-storage task-resource-grid">
    <section
      class="title-area flex-wrap"
      style="justify-content: space-between;"
    >
      <div class="process-top-area">
        <span class="sub-title">Storage</span>
        <view-cnt :count="tableData.length" />
      </div>
      <div
        class="button-area -right -task-button"
        v-if="editable && !allSuccess && chkWorkType()"
        data-html2canvas-ignore="true"
      >
        <button
          class="button"
          v-if="!isEditing"
          :disabled="allWorking(tableData) || isDeleteResource(tableData) || isAuto || autoUnEditable"
          @click="isEditing = true"
        >
          <!-- 변경 -->
          {{ $t('common.BTN.change') }}
        </button>
        <button
          class="button"
          type="is-primary"
          v-else
          @click="updateStorageData"
        >
          <!-- 저장 -->
          {{ $t('common.BTN.save') }}
        </button>
        <button
          class="button"
          v-if="isEditing"
          @click="cancelUpdate"
        >
          <!-- 취소 -->
          {{ $t('common.BTN.cancel') }}
        </button>
        <button
          v-if="field === 'todo'"
          class="button"
          type="is-primary"
          :disabled="!(checkedData.length > 0)"
          @click="executeWork"
        >
          <!-- 작업 실행 -->
          {{ $t('common.BTN.TASK.exec') }}
        </button>
      </div>
    </section>

    <cmp-grid
      :item-source="tableData"
      :columns="columns"
      class="task-resource-grid"
      :header-checkbox="useCheckbox"
      :use-excel-download="false"
      @checkedRowsData="checkedRows"
      :use-column-filter="false"
      :all-checkbox-disable="!editable || isEditing || isAuto"
    >
      <template
        v-for="column in columns"
        slot-scope="props"
        :slot="column.binding"
      >
        <section :key="column.binding">
          <template
            v-if="Object.keys(props.row).includes('workResult')
              && Object.keys(props.row.workResult).includes('dataStatus')
              && column.binding === 'workResult'"
          >
            <div class="cell-flex-wrap">
              <cmp-status-tag
                v-if="!props.row.workResult.dataStatus && props.row.meta.deleteDate && !props.row.meta.cancelDate"
                type="is-wait"
                :contents="$t('task.TODO.beDeleted')"
                :tooltip="true"
                :tooltip-cont="props.row.meta.deleteDate | dateSimple"
                tooltip-position="bottom"
              />
              <cmp-status-tag
                v-if="!props.row.workResult.dataStatus && props.row.meta.cancelDate"
                type="is-removed"
                :contents="$t('task.TODO.unDelete')"
                :tooltip="true"
                :tooltip-cont="props.row.meta.cancelDate | dateSimple"
                tooltip-position="bottom"
              />
              <cmp-status-tag
                type="is-wait"
                v-if="props.row.workResult.dataStatus === 'WAIT'"
                :contents="$t('task.TODO.waitWork')"
              />
              <cmp-status-tag
                v-else-if="props.row.workResult.dataStatus === 'PROCEED'"
                type="is-loading"
              >
                <i
                  class="el-icon-loading"
                  style="margin-right: 5px;"
                />
                <span>{{ $t('task.TODO.working') }}</span>
              </cmp-status-tag>
              <cmp-status-tag
                type="is-success"
                v-if="props.row.workResult.dataStatus === 'DONE'"
                :contents="$t('common.success')"
              />
              <cmp-status-tag
                v-else-if="props.row.workResult.dataStatus === 'ERROR'"
                type="is-fail"
                :contents="$t('common.fail')"
                :tooltip="true"
                :tooltip-cont="props.row.workResult.failMessage"
                tooltip-position="bottom"
              />
              <button
                v-if="props.row.workResult.dataStatus === 'ERROR' && field === 'todo' && editable"
                class="button"
                style="margin-left: 5px;"
                @click.stop="(e) => {
                  setResultSuccess(props.row.meta)
                }"
              >
                {{ $t('common.BTN.TASK.success') }}
              </button>
            </div>
          </template>
          <!-- /. 작업결과 -->
        </section>
      </template>

      <template #createTime="props">
        {{ props.row.createTime | date('YYYY.MM.DD HH:mm:ss') }}
      </template>

      <template #vmList="props">
        <span v-if="!isEditing">
          <button-popup
            :popup-data="countVmList(props.row.vmList)"
            trigger="hover"
          >
            {{ props.row.vmList.length }} EA
          </button-popup>
        </span>

        <div
          v-else
          class="cell-flex-wrap"
        >
          <button
            class="button"
            type="is-black"
            @click.stop="openVmListModal(props)"
          >
            <!-- 선택 -->
            {{ $t('common.BTN.select') }}
          </button>
        </div>
      </template>
      <!-- /. 연결 호스트 -->

      <template #diskList="props">
        <div class="cell-flex-wrap">
          <span
            class="disk"
            v-if="props.row.diskList.length"
          >{{ props.row.diskList | volumnGroupSize }} GB</span>

          <div v-if="isEditing">
            <button
              class="button"
              @click.stop="openVolumeDiskModal(props)"
            >
              {{ $t('common.BTN.select') }}
            </button>
          </div>

          <div v-else>
            <button-popup
              :popup-data="countDiskList(props.row.diskList)"
              trigger="hover"
            >
              {{ props.row.diskList.length }} EA
            </button-popup>
          </div>
        </div>
      </template>
      <!-- /. 크기(신청 용량) -->
    </cmp-grid>

    <!-- 모달 -->
    <!-- ExternalDisk 설정 모달 -->
    <external-disk-modal
      only-volume
      :active.sync="volumeDiskModal"
      :data="volumeDiskModalData"
      @save="setVolumeDisk"
      @close="e => {
        volumeDiskModal = false
        volumeDiskModalData = {}
      }"
    />

    <!-- 연결 호스트 설정 모달 -->
    <set-vm-list
      :active.sync="vmListModal"
      :data="vmListModalData"
      @save="setVmList"
      @close="e => {
        vmListModal = false
        vmListModalData = null
      }"
    />
  </div>
</template>
<script>
import ViewCnt from '@/components/ViewCnt/ViewCnt'
import ButtonPopup from '@/components/ButtonPopup/ButtonPopup'
import ExternalDiskModal from '@/components/Modal/ExternalDiskModal/ExternalDiskModal'
import SetVmList from '@/components/Modal/SetVmList/SetVmList'

import API from '@/components/Apis'
import { cloneDeep } from 'lodash'
import TaskSetCommon from '../TaskSetCommon'

export default {
  name: 'TaskStorage',
  components: {
    'view-cnt': ViewCnt,
    'button-popup': ButtonPopup,
    'external-disk-modal': ExternalDiskModal,
    'set-vm-list': SetVmList
  },
  mixins: [TaskSetCommon],
  props: {
    isCreateTime: {
      type: Boolean,
      default: false
    },
    data: {
      type: Array,
      default: () => []
    },
    isAuto: { // 자동일 때 설정
      type: Boolean,
      default: false
    },
    editable: {
      type: Boolean,
      default: true
    },
    field: { // 'conference', 'todo', 'done'
      type: String,
      default: ''
    },
    useCheckbox: {
      type: Boolean,
      default: false
    },
    orderNo: {
      type: String,
      default: ''
    },
    allSuccess: {
      type: Boolean,
      default: false
    }
  },
  created () {
    // this.setColumns() // 아직 어떤게 필수값이 몰라서..
    this.columns = this.setColumns_V3(this.columns) // 아직 어떤게 필수값이 몰라서..
    this.tableData = cloneDeep(this.data)
    this.userInfo = this.$store.state?.auth?.user
    // console.log('@created: tableData:', this.tableData)

    // 삭제 자원은 > required = false 설정
    this.setUnrequiredColumns(this.tableData)
  },
  watch: {
    data (newVal) {
      this.isEditing = false
      this.tableData = cloneDeep(newVal)
    }
  },
  methods: {
    /**
     * Storage 데이터를 저장합니다.
     */
    updateStorageData () {
      return this.$confirm(this.$t('common.CONFIRM.BASE.026'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        this.$emit('update', this.tableData)
        this.isEditing = false
      }).catch(() => false)
    },

    // ===========================
    // ====== Volume Disk =======
    // ===========================

    openVolumeDiskModal (data) {
      this.volumeDiskModal = true
      this.volumeDiskModalData = data
    },
    setVolumeDisk (diskData) {
      this.tableData = this.tableData.map((item, idx) => {
        // tableData index와 선택된 row 인덱스 비교
        if (idx === diskData.id) {
          return { ...item, diskList: diskData.disk }
        } else return item
      })
    },

    // ===========================
    // ========= VmList ==========
    // ===========================

    openVmListModal (data) {
      this.vmListModal = true
      this.vmListModalData = data
    },
    setVmList (vmList) {
      this.tableData = this.tableData.map((item, idx) => {
        const { chargeVmUuid } = vmList
        // tableData index와 선택된 row 인덱스 비교
        if (idx === vmList.idx) {
          return { ...item, chargeVmUuid, vmList: vmList.data }
        } else return item
      })
    },

    // ========================
    // ========================
    // ===== 할일 기능 only =====
    // ========================
    // ========================

    /**
     * [할일] 에서 체크박스에 변화가 일어날 때 발생합니다.
     * @param {Array} rows 체크된 모든 rows
     */
    checkedRows (rows) {
      // console.log('%c ## storage', 'color: #2ECC71')
      // console.log(rows, '## checked')
      this.checkedData = rows
    },
    /**
     * 설명을 추가해주세요..
     * @param data
     */
    async setResultSuccess (data) {
      const payload = {
        orderDataIdx: data.orderDataIdx,
        userId: this.userInfo?.userId,
        userName: this.userInfo?.userName,
        userPosition: this.userInfo?.userPosition,
        groupIdx: this.userInfo?.userGroup,
        groupName: this.userInfo?.userGroupName
      }
      const response = await API.workMngTask.createRunTaskResultSuccess(payload)
      if (response) this.$emit('refresh-todo', this.orderNo)
    },
    /**
     * 워크 타입을 확인합니다.
     */
    chkWorkType () {
      if (this.tableData.length <= 0) return false
      if (this.field === 'conference') return true
      return this.tableData[0].meta.orderType === 'NEW' || this.tableData[0].meta.orderType === 'DELETE'
    },
    /**
     * 상태가 진행중인지 확인합니다.
     */
    checkIsRunning () {
      return this.checkedData.some(item => {
        return item.workResult?.dataStatus === 'PROCEED' || item.workResult?.dataStatus === 'WAIT'
      })
    },
    /**
     * [작업 실행]
     */
    executeWork () {
      const runTasksFunc = async () => {
        const reqData = this.checkedData.map(item => {
          const taskData = {
            orderDataIdx: item.meta.orderDataIdx,
            orderNo: item.meta.orderNo,
            orderType: item.meta.orderType,
            workType: item.meta.workType
          }
          return taskData
        })
        const payload = {
          orderNo: this.orderNo,
          userId: this.userInfo?.userId,
          userName: this.userInfo?.userName,
          userPosition: this.userInfo?.userPosition,
          groupIdx: this.userInfo?.userGroup,
          groupName: this.userInfo?.userGroupName,
          reqData: reqData
        }
        console.log('@@ payload : ', payload)
        const response = await API.workMngTask.runTasks(payload)
        if (response.status === 500) {
          const status = response.data.message.split(': ')[1].replace(' )', '')
          const message = { WAIT: this.$t('task.STATE.wait') }[status]
          // `작업 ${message}중인 자원이 있습니다.`
          return this.$alert(this.$t('common.ALERT.CONF.014', { message }))
        } else {
          this.$emit('run-interval')
          this.checkedData = []
          this.tableData = cloneDeep(this.data)
        }
      }

      if (!this.checkedData || this.checkedData?.length === 0) {
        return this.$alert(this.$t('common.ALERT.BASE.041'))
      }
      if (this.checkIsRunning()) {
        return this.$alert(this.$t('common.ALERT.CONF.006'))
      }

      const isTypeDelete = this.checkedData.find(data => data.meta.orderType === 'DELETE')
      const execMessage = isTypeDelete ? this.$t('common.CONFIRM.CONF.008') : this.$t('common.CONFIRM.CONF.003')

      this.$confirm(execMessage, '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel'),
        dangerouslyUseHTMLString: true
      }).then(async () => {
        runTasksFunc()
      }).catch(() => {
        return false
      })
    }
  },
  data () {
    return {
      tableData: [],
      isEditing: false,
      updateItem: null,
      checkedData: [],
      vmListModal: false,
      vmListModalData: null,
      volumeDiskModal: false,
      volumeDiskModalData: null,

      columns: [
        { header: 'VG Name', binding: 'storageName' },
        { header: this.$t('main.DASHBOARD.cluster'), binding: 'clusterName', keyPath: 'main.DASHBOARD.cluster' },
        { header: this.$t('common.MODAL.setCon'), binding: 'vmList', customHtml: true, keyPath: 'common.MODAL.setCon' },
        { header: this.$t('common.GRID.STORAGE.size'), binding: 'diskList', customHtml: true, keyPath: 'common.GRID.STORAGE.size' }
      ],
      countVmList: (lists) => lists.map(list => { return { label: list.computeName } }),
      countDiskList: (lists) => lists.map(list => { return { label: `${list.diskSize} GB` } })
    }
  }
}
</script>

<style lang="scss" scoped>
.cell-flex-wrap {
  .disk {
    display: block;
    margin-right: $gap-s;
    min-width: 60px;
  }
  > div {
    display: flex;
    align-items: center;
  }
}
</style>
