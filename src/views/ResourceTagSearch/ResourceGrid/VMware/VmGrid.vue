
<template>
  <section class="table-area">
    <cmp-grid
      v-loading="!this.interval ? loading.isGetVmRequest : false"
      ref="serverGrid"
      class="route-detail-grid"
      :item-source="filteredData"
      :columns="columns"
      :column-data-map="columnDataMap"
      :init-custom-action="flex => this.grid = flex"
      :custom-init-filter="filter => this.gridFilter = filter"
      :init-auto-select-row="checkedVms"
      init-auto-select-row-key="userVmIdx"
      :changing-page-reset="false"
      @selectedRow="selectRow(...arguments, columns)"
      @total-count="cnt => totalResultCnt = cnt"
      @changingPage="num => {
        activePageNum = num
      }"
      selectable
      page-keeping
    >
      <template #osName="props">
        <set-os-icon
          v-if="props.row.osName"
          :os-name="props.row.osName"
        />
        <span v-else>-</span>
      </template>

      <template #powerState="props">
        <template v-if="props.row.powerState || props.row.vmStatus">
          <cmp-status-tag
            :type="props.row.vmStatus === 'START' ? 'is-loading' : {
              ON: 'is-info',
              OFF: 'is-undefined',
            }[props.row.powerState]"
            :line-style="true"
            :style="{width: props.row.vmStatus === 'START' ? '75px' : '60px'}"
          >
            {{ props.row.vmStatus === 'START' ? 'Progress' : props.row.powerState }}
          </cmp-status-tag>
        </template>
        <span v-else>-</span>
      </template>

      <template #hostname="props">
        <div
          class="hostname-name-wrap"
          v-if="props.row.hostname"
        >
          <span
            v-if="props.row.createTime > new Date(Date.now() - ( 3600 * 1000 * 24))"
            class="new-tag-wh"
          >N</span>
          <!-- NEW 태그 : 만들어진지 하루 지나면 사라짐 -->

          <span
            v-if="props.row.isCopy"
            class="new-tag-wh -copy"
          >C</span>
          <!-- COPY 태그 -->

          <span
            v-if="props.row.deleteDate"
            class="new-tag-wh -delete"
          >{{ setDeleteDateState(props.row.deleteDate) }}</span>
          <!-- 삭제 예정/중/실패 태그 -->

          <cmp-status-tag
            v-if="props.row.market"
            type="mp"
            contents="MP"
          />
          <cmp-status-tag
            v-else-if="props.row.era"
            type="mp"
            contents="DB"
          />
          <cmp-status-tag
            v-if="props.row.isSwTest"
            type="test"
            contents="TEST"
          />

          {{ props.row.hostname }}
        </div>
        <span v-else>-</span>
      </template>
      <!-- 호스트 명 -->

      <template #memory="props">
        {{ props.row.memory|GB }}
      </template>
      <template #vcpu="props">
        <span>{{ props.row.vcpu }} Core</span>
      </template>

      <template #hypervisorCpuUsagePpmValue="props">
        <span v-if="props.row.hypervisorCpuUsagePpmValue === null || props.row.powerState !== 'ON'">-</span>
        <progress-bar
          v-else
          height="20px"
          :total="1000000"
          :value="props.row.hypervisorCpuUsagePpm"
          :notice-percent="60"
          :alert-percent="80"
        />
      </template>
      <!-- CPU 사용량 -->

      <template #memoryUsagePpmValue="props">
        <span v-if="props.row.memoryUsagePpmValue === null || props.row.powerState !== 'ON'">-</span>
        <progress-bar
          v-else
          height="20px"
          :total="1000000"
          :value="props.row.memoryUsagePpm"
          :notice-percent="60"
          :alert-percent="80"
        />
      </template>
      <!-- 메모리 사용량 -->

      <template #externalDiskTotalSize="props">
        <el-popover
          v-if="props.row.externalDiskList.length"
          placement="bottom"
          width="200"
          trigger="hover"
          popper-class="-scroll"
        >
          <span slot="reference"> {{ props.row.externalDiskTotalSize |byte }} ({{ props.row.externalDiskTotalCount }}EA)</span>
          <template><pre>{{ props.row.externalDiskList |externalDiskInfo }}</pre></template>
          <!-- </div> -->
        </el-popover>
        <span v-else>{{ props.row.externalDiskTotalSize |byte }} ({{ props.row.externalDiskTotalCount }}EA)</span>
      </template>

      <template #ips="props">
        <div v-if="props.row.ips && props.row.ips.length">
          <span
            v-if="props.row.ips.length > 1"
          >{{ props.row.ips[0] }} {{ $t('common.TERMS.other') }}
            <el-tooltip
              placement="bottom-end"
              popper-class="panel-title-popper"
              effect="light"
            >
              <template #content>
                <span v-html="ipHtml(props.row.ips)" />
              </template>
              <a class="-link">{{ props.row.ips.length - 1 }}</a>
            </el-tooltip>
          </span>

          <span v-else>{{ props.row.ips[0] }}</span>
        </div>
        <span v-else>-</span>
        <small v-if="props.row.nics && props.row.nics.length">
          ({{ props.row.nics[0].cateKey || '-' }})
        </small>
      </template>
    </cmp-grid>
  </section>
</template>
<script>
import API, { SetOSIcon, ProgressBar } from '@sd-fe/cmp-core'
import Dayjs from 'dayjs'
import { mapState } from 'vuex'
import { SortDescription } from '@grapecity/wijmo'

// import CloneVm from './CloneVm/CloneVm'
// import MigrateVm from './MigrateVm/MigrateVm'

import SetResourceServerMixins from '../SetResourceServer.mixins.js'

export default {
  name: 'SetResourceServerList',
  mixins: [SetResourceServerMixins],
  components: {
    'set-os-icon': SetOSIcon,
    'progress-bar': ProgressBar
  },
  props: {
    resourceGridData: {
      type: Array,
      default () {
        return []
      }
    }
  },
  computed: {
    ...mapState({
      user: state => state.auth.user,
      packageType: state => state.auth.packageType
    })
  },
  watch: {
    activePageNum: {
      handler (num) {
        sessionStorage.setItem('configServerGridPage', num)
      }
    }
  },
  async mounted () {
    this.filteredData = [...this.tableData]
  },
  methods: {
    async exportOVA () {
      if (!this.ovaName) return this.$alert(this.$t('service.OVA.ALERT.003')) // 템플릿 명을 입력해주세요.

      try {
        this.isLoadingExportOVA = true
        const reqObj = {
          userId: this.user.userId,
          userName: this.user.userName,
          userPosition: this.user.userPosition,
          groupIdx: this.user.userGroup,
          groupName: this.user.userGroupName,
          orderData: {
            name: this.ovaName
          }
        }
        const { data } = await API.work.exportOVA(this.checkedVms[0].vmUuid, reqObj)
        if (!data.isSuccess) throw data
        this.$alert(this.$t('service.OVA.ALERT.004')) // 성공적으로 VM 템플릿을 Export하였습니다.
        this.modal.ova = false
      } catch (error) {
        console.log(error)
        this.$alert(this.$t('service.OVA.ALERT.005')) // VM 템플릿 Export 실패하였습니다.
      } finally {
        this.isLoadingExportOVA = false
      }
    },
    showModalOVA () {
      if (this.checkedVms.length > 1) return
      this.modal.ova = !this.modal.ova
    },
    async init () {
      await this.getVmList()
      // this.$refs.grid.setAutoSelectRow(this.grid)
    },
    async getVmList (params = {}) {
      try {
        this.loading.isGetVmRequest = true
        if (this.selectedProjectInfo) params = this.selectedProjectInfo
        params.isProgress = true // vm 조회할 떄  isProgress=true 추가 요청 (21.09.10 진범차장님)
        const data = await API.compute.getVms(params)
        // console.log(data.filter(item => item.vmStatus === 'START'))

        await this.vmInfoSetting(data)
      } catch (error) {
        console.error(error)
        this.tableData = []
        throw error
      } finally {
        this.loading.isGetVmRequest = false
      }
    },

    routeTo (to) {
      this.$router.push(to)
    },
    selectRow (row, columns) {
      // console.log('선택 row: ', row.dataItem)
      this.routeTo({
        name: 'set-resource-server-detail-vmw',
        params: {
          userVmIdx: row.dataItem.userVmIdx,
          companyInfo: row.dataItem.companyInfo
        }
      })
      sessionStorage.setItem('configServerGridPage', this.activePageNum)
    },

    ipHtml (ipList) {
      if (ipList.length <= 1) return
      let ips = ''
      for (let i = 1; i < ipList.length; i++) {
        ips += ipList[i] + '<br>'
      }
      return ips
    },
    async searchCompute (payload) {
      this.selectedProjectInfo = payload
      this.isProgressVm = false
      await this.init()
    },
    /**
     * 체크 된 항목 컨트롤
     */
    setCheckedItems (items) {
      // 체크된 vm이 OVA Export 가능한 central에 속해있는지? 가능 여부 .exportableOVA에 담음
      this.checkedVms = items.map(vm => {
        let exportableOVA
        if (vm.isSupportOva !== undefined) {
          exportableOVA = vm.isSupportOva
        } else {
          let vmCentral

          for (let i = 0; i < this.nxCentrals.length; i++) {
            const vmCluster = this.nxCentrals[i]?.elements.find(el => el.elementIdx === vm.elementIdx)
            if (vmCluster) {
              vmCentral = this.nxCentrals[i]
              break
            }
          }
          exportableOVA = !!vmCentral?.isSupportOva
        }

        return {
          ...vm,
          exportableOVA
        }
      })

      // console.log('@체크된 친구들: ', this.checkedVms)

      this.checkedVmsUserVmIdx = items.map(item => item.userVmIdx)

      for (let i = 0; i < this.tableData.length; i++) {
        const row = this.tableData[i]

        row.checked = this.checkedVmsUserVmIdx.includes(row.userVmIdx)
        row.disable = this.checkedVms.length >= 1
          ? !!(row.powerState !== this.checkedVms[0].powerState || row.vmStatus === 'START' || row.deleteDate) // vm 상태가 다르거나 Progress 상태거나 삭제 예정
          : !!(row.vmStatus === 'START' || row.deleteDate) // Progress 상태거나 삭제 예정(deleteDate o)
      }

      this.updateMainGrid()
    },
    /**
     * 그리드의 disable 체크박스 클릭 시, 발생 이벤트
     */
    clickDisabled (row) {
      if (row.deleteDate) return this.$alert(this.$t('common.ALERT.COMP.041')) // '삭제 예정 자원입니다.'
      if (row.vmStatus === 'START') return this.$alert(this.$t('common.ALERT.COMP.042')) // '작업 중인 자원입니다.'
      this.$alert(this.$t('common.ALERT.COMP.025'), { dangerouslyUseHTMLString: true })// 같은 상태의 VM만<br>다중 선택이 가능합니다.
    },
    /**
     * 호스트명, VM 상태 필터링 이벤트
     */
    filtering () {
      if (!this.filteredVmState && !this.filteredHostName) this.filteredData = this.tableData
      else {
        this.filteredData = this.tableData.filter(item => {
          let result = true
          if (this.filteredVmState) result = result && (item.powerState === this.filteredVmState)
          if (this.filteredHostName) result = result && (item.hostname?.toLowerCase().includes(this.filteredHostName?.toLowerCase()))

          return result
        })
      }
    },
    /**
     * filteredData를 세팅합니다.
     * 세팅 전, 그리드의 sorting / filtering 상태를 기억했다가 filteredData 세팅 후 다시 설정해줍니다.
     */
    async updateMainGrid () {
      await this.onSaveGridState()
      await this.filtering()
      if (this.originGridState) await this.onRestoreGridState()
    },
    /**
     * powerState 전환 이벤트
     * @param {String} state 전환 할 상태
     */
    async changePowerState (state) {
      const result = await this.confirmConvertPower(this.checkedVms, state)
      if (result) {
        this.setCheckedItems([])
      } else this.powerState = this.checkedVms[0].powerState
    },
    /**
     * VM Migrate 데이터 가공 이벤트
     */
    async confirmMigrate (param) {
      const orderData = {
        userVmIdx: param.vmData.userVmIdx,
        vmUuid: param.vmData.vmUuid,
        computeName: param.vmData.computeName,
        hostUuid: param.destNode.nodeName,
        nodeName: param.destNode.nodeName,
        updateUserId: this.user.userId,
        updateUserName: this.user.userName
      }
      const payload = {
        userId: this.user.userId,
        userName: this.user.userName,
        userPosition: this.user.userPosition,
        groupIdx: param.vmData.groupIdx,
        groupName: param.vmData.groupName,
        orderData
      }
      const result = await this.migrateVm(payload)
      if (result) this.setCheckedItems([])
    },
    /**
     * VM Clone 데이터 가공 이벤트
     */
    async confirmClone (param) {
      const orderDataList = param.cloneVms.map(vm => {
        const returnVm = {
          subnetUuid: '',
          isConnected: true,
          name: vm.name,
          hostName: vm.hostName,
          vcpu: vm.vcpu,
          memory: vm.memory,
          networkList: vm.networkList,
          note: vm.note,
          projectIdx: vm.projectIdx,
          serviceCode: vm.serviceCode,
          numberVcpuPerSocket: ''
        }
        if (vm.loadbalance) returnVm.loadbalance = vm.loadbalance
        return returnVm
      })
      const payload = {
        userId: this.user.userId,
        userName: this.user.userName,
        userPosition: this.user.userPosition,
        groupIdx: param.vmData.groupIdx,
        groupName: param.vmData.groupName,
        orderDataList
      }
      const message = this.$t('common.CONFIRM.COMP.001') // 자원을 복제하시겠습니까?
      this.$confirm(message).then(async () => {
        this.$alert(this.$t('common.ALERT.COMP.039'), { dangerouslyUseHTMLString: true }) // 입력하지 않은 데이터는<br>기존 자원 정보 데이터로 대체됩니다.
        const result = await this.cloneVm(payload, param.vmData.userVmIdx)
        if (result) this.setCheckedItems([])
      }).catch(() => false)
    },
    /**
     * VM 생성/수정 시, '저장'
     */
    confirmUpdate (payload) {
      let message
      payload.orderData.userVmIdx ? message = this.$t('common.CONFIRM.PROJECT.022') : message = this.$t('common.CONFIRM.PROJECT.013') // '자원을 수정하시겠습니까?' : ' 자원을 생성하시겠습니까?'
      this.$confirm(message).then(async () => {
        if (!payload.orderData.userVmIdx) {
          const result = await this.createVm(payload)
          if (result) this.modal.controlVm = false
        } else {
          const result = await this.updateVm(payload)
          if (result) {
            this.modal.controlVm = false
            this.setCheckedItems([])
          }
        }
      }).catch(() => false)
    },

    /**
   * [클론] 발생 이벤트
   */
    async activeClone () {
      if (this.checkedVms.length !== 1) return

      const isIpam = await this.checkIsIpam(this.checkedVms[0])
      this.cloneItemIsIpam = isIpam

      if (!isIpam) {
        this.modal.cloneVm = true
      } else this.modal.cloneVm = true
    },
    gridRefresh (grid = this.grid) {
      if (!grid) return
      const cv = grid.collectionView
      if (!cv) return
      cv.refresh()
    },
    /**
     * 선택한 vm이 IPAM을 통해 만들어진 VM인지 체크합니다.
     * @return {Boolean} true: IPAM / false: Static한 IP
     */
    async checkIsIpam (vm) {
      const clusters = await this.getClusters()
      const clsSubnets = clusters.find(cls => cls.clusterUuid === vm.clusterUuid)?.subnets
      if (!clsSubnets) return true
      const subnet = vm.nics?.length ? clsSubnets.find(sb => sb.subnetUuid === vm.nics[0]?.subnetUuid) : null
      const isIpam = subnet ? !!subnet.subnetPools : false

      return isIpam
    },
    /**
     * 클러스터 데이터를 가져옵니다.
     */
    async getClusters () {
      try {
        this.loading.cluster = true
        const clusters = await API.compute.getClusters()
        return clusters
      } catch (error) {
        this.$alert(this.$t('common.ALERT.NUTA.009'), {
          confirmButtonText: this.$t('common.BTN.confirm')
        })
        throw error
      } finally {
        this.loading.cluster = false
      }
    },

    /**
     * interval 전 그리드 sorting/filtering 저장
     */
    onSaveGridState () {
      if (!this.grid?.collectionView || !this.gridFilter) return
      const state = {
        filterDefinition: this.gridFilter.filterDefinition,
        sortDescriptions: this.grid.collectionView.sortDescriptions.map((sortDesc) => {
          return {
            property: sortDesc.property,
            ascending: sortDesc.ascending
          }
        })
      }
      this.originGridState = JSON.stringify(state)
    },
    /**
     * 저장 되었던 그리드 sorting/filtering 복구
     */
    onRestoreGridState () {
      const json = this.originGridState
      if (!json) return
      const state = JSON.parse(json)
      this.gridFilter.filterDefinition = state.filterDefinition
      const view = this.grid.collectionView
      if (!view) return
      view.deferUpdate(() => {
        view.sortDescriptions.clear()
        for (let i = 0; i < state.sortDescriptions.length; i++) {
          const sortDesc = state.sortDescriptions[i]
          view.sortDescriptions.push(
            new SortDescription(sortDesc.property, sortDesc.ascending)
          )
        }
      })
    },
    /**
     * deleteDate 존재 데이터에 삭제 예정/중/실패 표기
     */
    setDeleteDateState (deleteDate) {
      const today = Dayjs().format('YYYY-MM-DD')
      const delDate = Dayjs(deleteDate).format('YYYY-MM-DD')
      const isBeforeDelDate = Dayjs(today).isBefore(delDate)
      if (isBeforeDelDate) return this.$t('task.TODO.beDeleted') // '삭제 예정' : 삭제 일 > 오늘
      else if (Dayjs(today).isSame(delDate)) return this.$t('common.TERMS.deleting') // '삭제 중' : 삭제 일 = 오늘
      else if (!isBeforeDelDate) return this.$t('common.ALERT.BASE.038')// '삭제 실패' : 삭제 일 < 오늘
    },
    alert (message, callback) {
      this.$alert(message, '알림', {
        callback: callback,
        dangerouslyUseHTMLString: true
      })
    }
  },
  data () {
    return {
      isLoadingExportOVA: false,
      ovaName: '', // OVA Name
      activePageNum: 1,
      isProgressVm: false,
      totalResultCnt: 0,
      loading: {
        isGetVmRequest: false,
        createVm: false,
        convertVmPower: false,
        cluster: false
      },
      originGridState: null, // 인터벌 돌기 전, 그리드의 sorting/filtering 상태 저장

      filteredVmState: '', // 핉터링 > VM 상태
      filteredHostName: '', // 필터링 > 호스트명
      powerState: '', // 버튼 영역 > 파워 상태 선택

      checkedVms: [], // 체크한 vms
      checkedVmsUserVmIdx: [],
      modal: {
        controlVm: false, // vm 생성/변경 모달 active Handler
        cloneVm: false, // vm 복제
        migrateVm: false, // vm 이관
        ova: false // OVA Export
      },
      updateVmData: null, // 업데이트 할 vm정보 (create일 때 null)
      cloneItemIsIpam: true, // 클론하는 vm이 IPAM 자원인지?

      // compute 데이터
      columns: [
        // { binding: 'vmStatus', header: 'PROGRESSING..', align: 'left', width: 100 },
        { binding: 'projectName', header: '프로젝트 명', align: 'left', keyPath: 'common.GRID.projectName' },
        { binding: 'itsmName', header: '업무명', width: '*', align: 'left', keyPath: 'common.REGCON.workName' },
        { binding: 'hostname', header: '호스트명', width: 200, align: 'left', customHtml: true, keyPath: 'common.REGCON.hostName' },
        { binding: 'powerState', header: '상태', width: 130, customHtml: true, keyPath: 'common.GRID.state' },
        { binding: 'ips', header: 'IP', width: '*', customHtml: true },
        { header: 'OS 타입', binding: 'osType', width: 90, keyPath: 'common.GRID.COMPUTE.osType' },
        { header: 'OS 명', binding: 'osName', width: 130, customHtml: true, keyPath: 'common.GRID.COMPUTE.osName' },
        { header: 'OS Bit', binding: 'osBit', width: 80 },
        { binding: 'vcpu', header: 'vCPU(Core)', width: 90, customHtml: true },
        { binding: 'hypervisorCpuUsagePpmValue', header: 'vCPU 사용량(%)', width: 150, customHtml: true, keyPath: 'common.GRID.DATABASE.usageCpu' },
        { binding: 'memory', header: 'Memory(GB)', width: 90, customHtml: true },
        { binding: 'memoryUsagePpmValue', header: 'Memory 사용량(%)', width: 150, customHtml: true, keyPath: 'common.GRID.COMPUTE.usageMemory' },
        { binding: 'rootDiskTd', header: 'RootDisk', width: 100 },
        { binding: 'externalDiskTotalSize', header: 'ExternalDisk', width: 100, customHtml: true }
      ],
      tableData: [],
      filteredData: [],
      selectedProjectInfo: null,
      columnDataMap: {
        externalDiskTotalSize: null
      },

      // vm 상태 옵션
      vmStateOptions: [
        { value: '', label: this.$i18n.locale === 'en' ? 'All' : '전체' },
        { value: 'ON', label: 'ON' },
        { value: 'OFF', label: 'OFF' }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
.set-resource-server-list {
  .hostname-name-wrap {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .total-count-wrap {
    align-items: flex-start;
    flex-direction: column;
    .search-area { margin-top: $gap-s; }
  }

  // 카테고리 모달
  .el-popper.power-select-popper {
    padding-top: 5px;
    width: 120px;
    border-radius: $radius-s;
    background-color: transparent;
    border: none;
    > .el-scrollbar {
      > .el-select-dropdown__wrap.el-scrollbar__wrap {
        padding: 0;
        .el-select-dropdown__list {
          padding: 5px 0;
          > .el-select-dropdown__item {
            padding: 0 $gap-s;
            text-align: left;
            font-size: 12px;
          }
        }
      }
    }
  }
}

.new-tag-wh {
  display: inline-block;
  padding: 0 3px;
  width: 16px;
  min-height: 16px;
  line-height: 14px;
  text-align: center;
  color: $white;
  font-weight: bold;
  background-color: $primary;
  border: 1px solid $primary;
  // border-radius: 11px;
  font-size: 11px;
  &.-copy {
    background-color: #3C7D4F;
    border-color: #3C7D4F;
  }
  &.-delete {
    padding: 0 2px;
    width: auto;
    font-weight: normal;
    // color: $main-sred;
    background-color: $input-placeholder;
    border-color: $input-placeholder;
  }
}
</style>

<style lang="scss">
.set-resource-server-list {
  .button-area {
    > div.el-loading-parent--relative {
      .el-loading-mask { z-index: 1; }
      .el-loading-spinner {
        position: relative;
        top: auto;
        margin-top: 0;
        .el-icon-loading {
          position: absolute;
          left: 260px;
          margin-top: 2px;
          transform: translateX(-50%);
        }
        .el-loading-text { margin-top: 7px; }
      }
    }
  }

  // 인터벌 + 페이지네이션 때 알 수 없는 스크롤바 생김 방지
  .route-detail-grid {
    .wj-content {
      & > div {
        div[wj-part=root] {
          overflow: hidden !important;
        }
      }
    }
  }

  .power-state-select { // Power Off 영역
    width: 120px;
    margin: 0 $gap-s;
    > .el-input {
      &.el-input--suffix {
        > .el-input__inner {
            &:focus {
            background-color: darken($primary, 5%);
            color: $white;
          }
        }
      }
      &.is-focus {
        > .el-input__inner {
          background-color: darken($primary, 5%);
          color: $white;
            &:focus {
            color: $white;
            background-color: darken($primary, 5%);
          }
        }
      }
      > .el-input__inner {
        padding: 5px 10px 5px 15px;
        min-width: 30px;
        background-color: $primary;
        border: 1px solid $primary;
        font-size: 12px;
        text-align: left;
        color: $white;
        &::placeholder {
          color: $white;
        }
      }
      > .el-input__suffix {
        display: flex;
        align-items: center;
        right: 0;
        color: $white;
      }
    }

    .el-input.is-disabled {
      > .el-input__inner {
        background-color: $main-gray;
        border-color: $main-gray;
        opacity: .5;
        color:$color-grey;
        &:hover {
          background-color: $main-gray;
          border-color: $main-gray;
        }
      }
    }
  }
}
</style>
