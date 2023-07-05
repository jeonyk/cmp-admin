<!--
  * 파일명 : TaskCompute.vue
  * 파일 기능 : [Compute] 관련 그리드입니다. 관련 그리드 데이터를 외부에서 받아 수정/변경 할 수 있습니다.
  * 작성자 : 이경환 외 4명
  * 최종 작성일 : 2021-02-19
  * License By Shinsegae I&C
  * 2021-02-19 fix: 사전 협의 필수값 체크 추가, 디스크 자원 변경 버그 수정
 -->

<template>
  <div class="task-compute task-resource-grid">
    <section
      class="flex-wrap title-area"
      style="justify-content: space-between;"
    >
      <div class="process-top-area">
        <span class="sub-title">Compute</span>
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
          @click="updateComputeData"
          v-if="isEditing"
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
          class="button"
          type="is-primary"
          v-if="field === 'todo'"
          :disabled="isEditing || !checkedData.length"
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
      class="task-resource-grid overflow-visible-grid"
      :header-checkbox="useCheckbox"
      :use-excel-download="false"
      @checkedRowsData="checkedRows"
      :init-custom-action="initGrid"
      :custom-init-filter="initFilter"
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
              <!-- 수정 필요 abcdefghijklmn -->
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
                v-if="props.row.workResult.dataStatus === 'WAIT'"
                type="is-wait"
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
                v-if="props.row.workResult.dataStatus === 'DONE'"
                type="is-success"
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
                style="margin-left: 10px;"
                @click.stop="(e) => {
                  setResultSuccess(props.row.meta)
                }"
              >
                {{ $t('common.BTN.TASK.success') }}
              </button>
            </div>
          </template>
          <template
            v-else
          >
            <div
              class="cell-flex-wrap"
              v-if="orderType === 'DELETE'"
            >
              <span>{{ props.row.meta.deleteDate | dateSimple }}</span>
            </div>
          </template>
          <!-- /. 작업결과 -->
        </section>
      </template>

      <template #hostName="props">
        <div class="cell-flex-wrap">
          <cmp-status-tag
            v-if="props.row.marketplaceInfo"
            tooltip
            :tooltip-cont="props.row.marketplaceInfo"
            type="mp"
            :line-style="field === 'conference' ? true : false"
          />
          {{ props.row.hostName }}
        </div>
      </template>
      <!-- /.호스트명 -->

      <template #createTime="props">
        {{ props.row.createTime | date('YYYY.MM.DD HH:mm:ss') }}
      </template>
      <template #networkList="props">
        <div
          class="cell-flex-wrap"
          v-if="props.row.networkList"
        >
          <span v-if="!isEditing || blockEdit(props.row)">
            <span>{{ props.row.networkList[0].cateKey }}</span> <span v-if="props.row.networkList[0].vlanName">({{ props.row.networkList[0].vlanName }})</span>
          </span>

          <div
            v-else
            class="network-editing"
          >
            <div>
              <el-input
                v-model="props.row.networkList[0].cateKey"
                class="-input-box"
                @click.native="selectNetworkData(props)"
              />
              <span
                v-if="props.row.networkList[0].vlanName"
                class="vlan-name"
              >
                ({{ props.row.networkList[0].vlanName }})
              </span>
            </div>
          </div>
        </div>
      </template>
      <!-- /. 네트워크 -->

      <template #vcpu="props">
        <span v-if="!isEditing || blockEdit(props.row)">
          {{ props.row.vcpu }} Core
        </span>
        <div
          class="cell-flex-wrap"
          v-else
        >
          <el-input-number
            class="-input-box"
            v-model="props.row.vcpu"
            :min="0"
          />
          <span style="margin-left: 5px;">Core</span>
        </div>
      </template>
      <!-- /.vcpu -->

      <template #memory="props">
        <span v-if="!isEditing || blockEdit(props.row)">
          {{ props.row.memory }} GB
        </span>

        <div
          class="cell-flex-wrap"
          v-else
        >
          <el-input-number
            class="-input-box"
            v-model="props.row.memory"
            :min="0"
          />
          <span style="margin-left: 5px;">GB</span>
        </div>
      </template>
      <!-- /. memory -->

      <template #rootDiskSize="props">
        {{ props.row.rootDiskSize }} GB
      </template>
      <!-- /.rootDisk -->

      <template #externalDiskListSum="props">
        <div class="cell-flex-wrap">
          <span
            class="disk"
            v-if="props.row.displayExternalDiskList.length"
          >{{ props.row.displayExternalDiskList | volumnGroupSize }} GB</span>

          <span v-if="props.row.displayExternalDiskList && (!isEditing || blockEdit(props.row))">
            <button-popup
              :popup-data="countDiskList(props.row.displayExternalDiskList)"
              trigger="hover"
            >
              {{ props.row.displayExternalDiskList.length }} EA
            </button-popup>
          </span>

          <div v-else>
            <button
              class="button -select-cluster-button"
              @click.stop="openExternalDiskModal(props)"
            >
              {{ $t('common.BTN.select') }}
            </button>
          </div>
        </div>
      </template>
      <!-- /.externalDisk -->

      <template #installProgram="props">
        <div v-if="props.row.installProgramList">
          <button-popup
            :popup-data="installProgramLists(props.row.installProgramList)"
            :type="(field === 'conference' || field === 'approved') ? 'dark' : ''"
            trigger="hover"
          >
            {{ props.row.installProgramList.length }} EA
          </button-popup>
        </div>
      </template>
      <!-- 설치 프로그램 -->

      <template #clusterNode="props">
        <div class="cell-flex-wrap">
          <div
            :class="['cluster-node-name', { '-editable' : isEditing && !blockEdit(props.row) }]"
            @click.stop="(isEditing && !blockEdit(props.row) && (props.row.cluster || props.row.node)) ? selectClusterData(props) : null"
          >
            <p>{{ props.row.cluster ? props.row.cluster.name : props.row.cluster }}</p>
            <p>{{ props.row.node ? props.row.node.nodeName : props.row.node }}</p>
          </div>

          <button
            v-if="isEditing && !(props.row.cluster || props.row.node)"
            class="button -select-cluster-button"
            @click.stop="selectClusterData(props)"
          >
            <!-- 선택 -->
            {{ $t('common.BTN.select') }}
          </button>
        </div>
      </template>
      <!-- /. 클러스터/노드 -->
    </cmp-grid>

    <!-- 모달 -->
    <!-- ExternalDisk 설정 모달 -->
    <external-disk-modal
      :active.sync="externalDiskModal"
      :data="externalDiskModalData"
      @save="setExternalDisk"
      @close="e => {
        externalDiskModal = false
        externalDiskModalData = {}
      }"
    />

    <!-- 설치 프로그램 설정 모달 -->
    <install-program-modal
      :compare-data="updateItem ? updateItem.installProgram : []"
      :active.sync="installProgramModal"
      @close="installProgramModal = false"
    />

    <!-- 네트워크 설정 모달 -->
    <grid-modal
      :active.sync="networkGridModal"
      @close="() => {
        networkGridModal = false
        networkData = null
      }"
      :table-data="selectNetworkModalTableData"
      :column-data="selectNetworkModalColumnData"
      :init-auto-select-row="networkData"
      init-auto-select-row-key="ipRange"
      :selectable="true"
      width="70%"
      :title="'Network ' + $t('common.BTN.select')"
      @confirm="setItemNetwork"
    >
      <template #time="props">
        {{ props.row.time | date }}
      </template>
    </grid-modal>

    <!-- 네트워크 프로파일 설정 모달 -->
    <!-- Deprecated?? -->
    <grid-modal
      :active.sync="networkProfileModal"
      @close="networkProfileModal = false"
      :table-data="selectNetworkModalTableData"
      :column-data="selectNetworkModalColumnData"
      width="70%"
      :title="'Network Profile ' + $t('common.BTN.select')"
      :select-detail="true"
      :detail-column-data="selectNetworkProfileColumnData"
    >
      <template #time="props">
        {{ props.row.time | date }}
      </template>
    </grid-modal>

    <!-- 클러스터/노드 선택 모달 -->
    <set-cluster-node-modal
      :data="updateItem"
      :table-data="tableData"
      :active="setClusterNodeModal.open"
      :id="updateId"
      :type="setClusterNodeModal.type"
      :order-data="orderData"
      @confirm="setItemClusterNode"
      @close="setClusterNodeModal.open = false"
    />
  </div>
</template>
<script>
import ViewCnt from '@/components/ViewCnt/ViewCnt'
import ButtonPopup from '@/components/ButtonPopup/ButtonPopup'
import API from '@/components/Apis'
import ExternalDiskModal from '@/components/Modal/ExternalDiskModal/ExternalDiskModal'
import InstallProgramModal from '@/components/Modal/InstallProgramModal/InstallProgramModal'
import GridModal from '@/components/Modal/GridModal/GridModal'
import TaskSourceModalCompute from '@/components/Modal/TaskSourceModal/TaskSourceModalCompute'
import TaskSetCommon from '../TaskSetCommon'
import { cloneDeep } from 'lodash'
import TaskDetailCommon from '../../TaskDetailCommon'

export default {
  name: 'TaskCompute',
  components: {
    'view-cnt': ViewCnt,
    'button-popup': ButtonPopup,

    'external-disk-modal': ExternalDiskModal,
    'install-program-modal': InstallProgramModal,
    'grid-modal': GridModal,
    'set-cluster-node-modal': TaskSourceModalCompute
  },
  mixins: [TaskSetCommon, TaskDetailCommon],
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
    field: {
      type: String, // 'conference', 'do', 'done', 'approved'
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
    orderType: { // 신규 new / 변경 change / 삭제 delete
      type: String,
      default: ''
    },
    orderData: {
      type: Object,
      default: undefined
    },
    allSuccess: {
      type: Boolean,
      default: false
    }
  },
  created () {
    this.columns = this.setColumns_V3(this.columns)

    // this.setColumns(['clusterNode'])
    // this.tableData = cloneDeep(this.data)
    this.tableData = this.setInitComputeData(this.data)
    this.orderTypeIsChange()
    this.userInfo = this.$store.state?.auth?.user

    // 삭제 자원은 > required = false 설정
    this.setUnrequiredColumns(this.tableData)
  },
  watch: {
    data (newVal) {
      this.isEditing = false
      // this.tableData = cloneDeep(newVal)
      this.tableData = this.setInitComputeData(newVal)
      this.orderTypeIsChange()
    }
  },
  methods: {
    setInitComputeData (tableData) {
      const cloneData = cloneDeep(tableData)

      const list = cloneData.map(row => {
        return {
          ...row,
          displayExternalDiskList: row.externalDiskList?.length ? row.externalDiskList.filter(disk => !(disk?.deviceIndex === 0 && disk?.deviceBus === 'SCSI')) : [] // UI 상에서 rootDisk 노출을 없애기 위함
        }
      })

      return list
    },
    /**
     * Compute 데이터를 저장합니다.
     */
    updateComputeData () {
      for (let i = 0; i < this.tableData.length; i++) {
        if (!this.tableData[i].vcpu) return this.$alert(this.$t('common.ALERT.COMP.008'))
        else if (!this.tableData[i].memory) return this.$alert(this.$t('common.ALERT.CONF.012'))
      }

      // 해당 내용으로 저장하시겠습니까?
      return this.$confirm(this.$t('common.CONFIRM.BASE.026'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        this.$emit('update', this.tableData)
        this.isEditing = false
      }).catch(() => false)
    },

    // ===========================
    // ====== ExternalDisk =======
    // ===========================

    /**
     * [ExternalDisk] 수정 모달 상태 설정
     * @param {(Object|null)} data row data
     */
    openExternalDiskModal (data) {
      this.externalDiskModal = true
      this.externalDiskModalData = data
    },
    /**
     * ExternalDisk 를 설정합니다.
     * @param {Object} diskData 선택한 Disk 데이터
     */
    setExternalDisk (diskData) {
      diskData.disk.forEach(dsk => { dsk.diskSizeBytes = this.$options.filters.gbToByte(dsk.diskSize) })

      this.tableData = this.tableData.map((item, idx) => {
        // tableData index와 선택된 row 인덱스 비교
        const displayExternalDiskList = diskData.disk?.filter(disk => !(disk?.deviceIndex === 0 && disk?.deviceBus === 'SCSI'))

        return idx === diskData.id ? {
          ...item,
          externalDiskList: diskData.disk,
          displayExternalDiskList,
          externalDiskListSum: this.$options.filters.volumnGroupSize(displayExternalDiskList)
        } : item
      })
    },

    // ===========================
    // ======== Network ==========
    // ===========================

    /**
     * [Network] 설정 모달에서 선택한 아이템을 테이블에 바인딩
     * @param {Object} selectedItem
     */
    setItemNetwork (networkData) {
      this.networkData = networkData
      const selectedNetwork = networkData.dataItem
      // this.updateItem.networkList = selectedNetwork

      this.tableData = this.tableData.map((item, idx) => {
        // tableData index와 선택된 row 인덱스 비교
        if (idx === this.updateId) {
          const itemNtwList = [...item.networkList]
          const networkList = itemNtwList.map(ntw => { return { ...ntw, ...selectedNetwork } })
          return { ...item, networkList }
        } else {
          return item
        }
      })

      this.updateId = undefined
    },
    /**
     * [Network] 모달을 핸들링합니다
     */
    async selectNetworkData (data) {
      this.updateItem = data.row
      this.updateId = data.cell.index
      this.networkGridModal = true
      this.networkData = data.row.networkList[0]

      return this.getNetworkManage({
        cateIdx: this.networkData.cateId,
        companyIdx: this.tableData[data.cell.index].companyId
      })
    },
    /**
     * Network 관련한 데이터
     */
    async getNetworkManage (payload) {
      const response = await API.network.getNetworkManage(payload)
      const networkGridData = [...response]
      this.selectNetworkModalTableData = networkGridData
    },

    // ===========================
    // ======= 클러스터/노드 ========
    // ===========================

    /**
     * [클러스터/노드] 설정 모달에서 선택한 아이템을 테이블에 바인딩
     * @param {Object} selectedItem {cluster: 선택한 클러스터, node: 선택한 노드}
     */
    setItemClusterNode (selectedItem) {
      const cloneSelItem = JSON.parse(JSON.stringify(selectedItem))
      this.tableData = this.tableData.map((item, idx) => {
        // tableData index와 선택된 row 인덱스 비교
        return idx === selectedItem.id ? { ...item, ...cloneSelItem } : item
      })
      this.updateId = undefined
    },
    /**
     * [클러스터 / 노드] 변경시 발생하는 이벤트를 입력합니다.
     * @param {Object} data 선택한 테이블 row
     */
    async selectClusterData (data) {
      this.setClusterNodeModal.type = 'both'
      this.updateItem = data.row
      this.updateId = data.cell.index // 클릭한 cell의 index 정보를 저장합니다
      this.setClusterNodeModal.open = true
    },

    /**
     * [변경] 건 일때, 기존에 선택되어있던 cluster/node 미리 설정해둠
     * */
    orderTypeIsChange (orderType = this.orderType) {
      const regex = /change/gi
      if (!orderType || !regex.test(orderType)) return

      this.tableData = this.tableData.map((data, idx) => {
        data.cluster = { name: data.clusterName, clusterUuid: data.clusterUuid }
        data.node = { hostUuid: data.nodeId, nodeName: data.nodeName }
        return data
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
      // console.log('%c ## compute', 'color: #B996FF')
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
      if (response) {
        this.$emit('refresh-todo', this.orderNo)
      }
    },
    /**
     * 워크 타입을 확인합니다.
     */
    chkWorkType () {
      if (this.tableData.length <= 0) return false
      if (this.field === 'conference') return true

      // let result = false
      // if (this.tableData[0].meta.orderType === 'DELETE') {
      //   const failList = this.tableData.filter(item => item.workResult?.isSuccess)
      //   if (failList.length > 0) result = true
      // }
      // return this.tableData[0].meta.orderType === 'NEW' || result
      if (this.tableData[0].meta.orderType === 'CHANGE') return false
      else return true
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
      // '선택한 자원에 대한 작업을 실행하시겠습니까?'
      this.$confirm(execMessage, '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel'),
        dangerouslyUseHTMLString: true
      }).then(async () => {
        const isToBeDeleted = this.checkedData.some((data) => {
          return data.meta.orderType === 'DELETE' && !data.workResult?.dataStatus && data.meta.deleteDate
        })
        if (isToBeDeleted) {
          // Compute 자원 삭제시에는, 해당 vm 이 다른 vm 에 영향을 미치는지 확인해야합니다.
          const allResp = await this.checkIsUsingVm(this.checkedData)
          const isUsing = await this.setUsingVmsToText(allResp)

          if (!isUsing) return
        }

        return runTasksFunc()
      }).catch(() => false)
    },
    /**
     * API 로 vm 이 사용되는지 체크한 후, 모든 결과를 반환합니다.
    */
    async checkIsUsingVm (checkedData = this.checkedData) {
      // compute 자원일 경우, 연결된 vm 이 있는지 모든 결재 플로우에서 확인합니다.
      const hostNames = checkedData.map(source => source.hostname)

      const allResp = [] // 전체 요청의 결과를 저장합니다
      for (let i = 0; i < hostNames.length; i++) {
        const hostName = hostNames[i]
        try {
          this.$parent.$parent.loading = true
          this.$parent.$parent.loadingText = this.$t('common.ALERT.APPROVAL.017') // 삭제 가능 여부를 확인중입니다. 다소 시간이 소요될 수 있습니다.
          // 결재 플로우 확인
          const response = await API.task.vmWorkingCheck(hostName)
          allResp.push(response)
        } catch (error) {
          console.error(error)
        } finally {
          this.$parent.$parent.loading = false
          this.$parent.$parent.loadingText = ''
        }
      }

      return allResp
    },
    /**
     * 필터 가공
     */
    initFilter (filter) {
      this.filter = filter
      filter.filterChanging.addHandler((s, e) => {
        let installPrograms = []
        // const map = (arr, key) => {
        //   const data = arr.map(item => { return item[key] })
        //   return data
        // }

        this.tableData.forEach(item => {
          if (item.installProgramList?.length) {
            // const pkgs = map(item.installProgramList, 'pkgName')
            // installPrograms.push(pkgs)
            installPrograms = item.installProgramList.map(pkg => `${pkg.softwareName} ${pkg.versionName}`)
          }
        })

        var installFilter = filter.getColumnFilter('installProgram')?.valueFilter
        installFilter.uniqueValues = Array.from(new Set(installPrograms))
        installFilter.sortValues = false
      })
    },
    initGrid (grid) {
      this.grid = grid
    }
  },
  data () {
    return {
      deleteDate: '2021-03-14',
      deleteDday: '',
      tableData: [],
      updateItem: null,
      isEditing: false,
      externalDisks: null,
      externalDiskModal: false,
      externalDiskModalData: null,
      installProgramModal: false,
      networkData: null,
      networkGridModal: false,
      networkProfileModal: false,
      updateId: null,
      setClusterNodeModal: {
        open: false,
        type: 'both'
      },
      // 서버 영역(Compute) 샘플 데이터 및 헤더

      columns: [
        { header: this.$t('common.GRID.hostName'), binding: 'hostname', width: 150, keyPath: 'common.GRID.hostName' },
        // { header: 'Hostname', binding: 'hostName', width: 150, customHtml: true },
        { header: this.$t('common.GRID.COMPUTE.osVersion'), binding: 'osName', keyPath: 'common.GRID.COMPUTE.osVersion' },
        // { header: 'IP', binding: 'ip', width: '*', customHtml: true },
        { header: 'Network', binding: 'networkList', customHtml: true },
        { header: 'VCPU', binding: 'vcpu', width: 160, customHtml: true, unit: 'Core' },
        { header: 'Memory', binding: 'memory', width: 160, customHtml: true, unit: 'GB' },
        { header: 'RootDiskSize', binding: 'rootDiskSize', customHtml: true, unit: 'GB' },
        { header: 'ExternalDisk', binding: 'externalDiskListSum', width: 170, customHtml: true },
        { header: this.$t('common.GRID.COMPUTE.install'), binding: 'installProgram', width: 130, customHtml: true, keyPath: 'common.GRID.COMPUTE.install' },
        { header: this.$t('common.GRID.COMPUTE.clusterNode'), binding: 'clusterNode', width: 130, customHtml: true, keyPath: 'common.GRID.COMPUTE.clusterNode' }
        // { header: '작업 결과', binding: 'workResult', width: '*', customHtml: true }
      ],

      // 네트워크 선택 모달 데이터
      // 네트워크 선택
      selectNetworkModalColumnData: [
        // { header: '조직', binding: 'org', width: 100 },
        // { header: '관계사', binding: 'relationComp', width: 100 },
        { header: 'VLAN ID', binding: 'vlanId' },
        { header: this.$t('common.GRID.NETWORK.vlanName'), binding: 'vlanName' },
        // { header: 'IP 대역', binding: 'ip', width: 100 },
        // { header: '용도', binding: 'desc', width: '*' },
        { header: 'IP', binding: 'ipRange' }
      ],
      selectNetworkModalTableData: [
        { name: 'samplename', time: 'timesapme' }
      ],
      installProgramLists: (lists) => {
        const pkgLists = lists.map(list => { return { label: `${list.softwareName} ${list.versionName}` } })
        return pkgLists
      },
      countDiskList: (lists) => lists.map(list => { return { label: `${list.diskSize} GB` } }),
      selectNetworkProfileColumnData: [],
      checkedData: [],
      // cateIdx: 11,
      companyIdx: 8
    }
  }
}
</script>

<style lang="scss" scoped>
.cluster-node-name {
  cursor: pointer;
  &.-editable {
    &:hover {
      text-decoration: underline;
      color: $main-blue;
    }
  }
}
.network-editing {
  div {
    display: flex;
    align-items: center;
    .network-id {
      min-width: 50px;
      display: block;
      margin-right: $gap-s;
    }
    .vlan-name {
      margin-left: 5px;
    }
  }
}
.-input-box {
  width: 120px;
}

.disk {
  display: block;
  margin-right: $gap-s;
  min-width: 60px;
}
</style>
