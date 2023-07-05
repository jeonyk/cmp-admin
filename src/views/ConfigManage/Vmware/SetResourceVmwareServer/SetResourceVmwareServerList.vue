<!--
  * 파일명 : SetResourceServerList.vue
  * 파일 기능 : VMware > 구성관리 > 자원 관리 > Compute 리스트 확인 기능, 필터링(관계사 / 조직 / 프로젝트) 기능
  * 작성자 : 김예담
  * License By Shinsegae I&C
 -->

<template>
  <div
    class="set-resource-server-list"
  >
    <resource-filter-component
      v-if="!isOnlyGrid"
      cloud-type="private"
      module-type="VMWARE"
      :use-common="false"
      :table-data="filteredData"
      @search="searchCompute"
      @reset="() => {
        filteredVmState = ''
        filteredEsxiName = ''
        filteredIsUrgent = ''
      }"
    >
      <section class="filter-form">
        <span class="filter-name">{{ $v('VM 상태') }}</span>
        <div class="filter-options">
          <el-select
            v-model="filteredVmState"
            :placeholder="$v('VM 상태')"
            :popper-append-to-body="false"
            @change="updateMainGrid()"
          >
            <el-option
              v-for="option in vmStateOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </div>
      </section>
      <section class="filter-form">
        <span class="filter-name">{{ $v('ESXi 명') }}</span>
        <el-select
          v-model="filteredEsxiName"
          :placeholder="$v('ESXi 선택')"
          :popper-append-to-body="false"
          @change="updateMainGrid()"
        >
          <el-option
            v-for="option in esxiOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </section>
      <section class="filter-form">
        <span class="filter-name">{{ $v('긴급 처리 여부') }}</span>
        <el-select
          v-model="filteredIsUrgent"
          :placeholder="$v('긴급 처리 여부')"
          :popper-append-to-body="false"
          @change="updateMainGrid()"
        >
          <el-option
            v-for="option in isUrgentOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </section>
    </resource-filter-component>

    <section
      class="table-top-wrap"
      v-if="!isOnlyGrid"
    >
      <total-count
        class="total-count-wrap"
        :total-count="totalResultCnt"
      >
        <div class="flex-wrap">
          <search-component
            class="search-area"
            :placeholder="$t('common.REGCON.hostName')"
            @search="val => {
              filteredHostName = val
              filtering()
            }"
          />
          <el-checkbox
            class="checkbox-testvm"
            style="margin-top: 15px;"
            v-model="testVmState"
            @change="filtering()"
          >
            {{ $v('TEST VM 보기') }}
          </el-checkbox>
          <el-checkbox
            style="margin-top: 15px;"
            v-model="filterCreateTypeRegisterChecked"
            @change="filtering()"
          >
            {{ $v('CMP 외부 생성 자원 보기') }}
          </el-checkbox>
        </div>
      </total-count>
      <section class="flex-wrap">
        <div
          class="button-area -right"
          v-if="checkedVms.length"
          v-loading="checkedVms ? checkedVms.map(v => v.vmStatus).includes('PROGRESS') : false"
          :element-loading-text="$t('common.PLACEHOLDER.workingVm')"
          element-loading-spinner="el-icon-loading"
          element-loading-background="rgba(0, 0, 0, 0.8)"
        >
          <el-tooltip
            :disabled="checkedVms.length
              ? (
                checkedVms[0].powerState !== 'POWERED_ON'
                && checkedVms[0].toolsStatus !== 'TOOLS_NOT_INSTALLED'
              )
              : true"
            placement="top"
            effect="light"
          >
            <template #content>
              <span v-if="checkedVms[0].vmStatus === 'POWERED_ON'">
                {{ $t('service.OVA.ALERT.002', { state: 'Export', reason: 'VM State ON'}) }}
              </span>
              <span v-if="checkedVms[0].toolsStatus === 'TOOLS_NOT_INSTALLED'">
                {{ $t('service.OVA.ALERT.002', { state: 'Export', reason: 'VM Tools 설치되지 않음'}) }}
              </span>
              <!-- <span v-else-if="!checkedVms[0].userInfo.imageId">
                {{ $t('service.OVA.ALERT.002', { state: 'Export', reason: $v('Update로 이미지 정보를 먼저 등록해주세요.') }) }}
              </span> -->
            </template>

            <div v-if="packageType !== 'PL'">
              <button
                class="button"
                :disabled="checkedVms.length > 1
                  || !!checkedVms[0].deleteDate
                  || ['POWERED_ON', 'PROGRESS'].includes(checkedVms[0].vmStatus)
                  || checkedVms[0].toolsStatus === 'TOOLS_NOT_INSTALLED'
                "
                @click="showModalOVA"
              >
                {{ $v('템플릿 추출') }}
              </button>
            </div>
          </el-tooltip>

          <!-- 게스트 운영체제 다시 시작 => 전원이 켜진 VM만 가능 -->
          <el-select
            class="power-state-select"
            v-model="powerState"
            :popper-append-to-body="false"
            popper-class="power-select-popper"
            @change="changePowerState(powerState)"
          >
            <el-option
              v-for="power in powerOptions"
              :key="power.value"
              :label="power.label"
              :value="power.value"
              :disabled="power.value === 'REBOOT_GUEST'
                && (checkedVms.length > 1
                  || checkedVms[0].powerState !== 'POWERED_ON'
                  || !checkedVms[0]._vmToolsIsInstalled
                  || !checkedVms[0]._vmToolsIsRunning)"
            />
          </el-select>

          <button
            class="button"
            type="is-primary"
            @click="clickChangeBtn(checkedVms[0])"
            :disabled="checkedVms.length > 1
              || checkedVms[0] && checkedVms[0].vmStatus=== 'PROGRESS'"
          >
            {{ $v('변경') }}
          </button>

          <button
            class="button"
            type="is-primary"
            @click="activeClone()"
            :disabled="
              checkedVms.length > 1 ||
                checkedVms[0] && checkedVms[0].vmStatus=== 'PROGRESS'
            "
          >
            {{ $v('복제') }}
          </button>

          <el-tooltip
            :disabled="!!checkedVms[0].hostInfo.vcenterUuid"
            placement="top"
            effect="light"
          >
            <template #content>
              <span v-if="!checkedVms[0].hostInfo.vcenterUuid">
                이관 불가능 자원입니다. (vCenter 정보가 없습니다.)
              </span>
            </template>
            <button
              class="button"
              type="is-primary"
              @click="modal.migrateVm = true"
              :disabled="checkedVms.length > 1
                || checkedVms[0] && (checkedVms[0].powerState === 'PROGRESS' || checkedVms[0].vcenterUuid)"
            >
              <!-- @click="e => {
              if (checkedVms[0].powerState !== 'POWERED_ON') return alert($t('common.ALERT.COMP.034')) // Migrate를 하기 위해서는<br>자원이 On되어있어야 합니다.
              else modal.migrateVm = true
            }" -->
              {{ $v('이관') }}
            </button>
          </el-tooltip>
        </div>
        <button
          class="button"
          type="is-primary"
          style="margin-left: 10px;"
          @click="e => {
            modal.controlVm = true
            updateVmData = null
          }"
        >
          {{ $v('자원 추가') }}
        </button>
      </section>
    </section>

    <section
      class="table-area"
      :element-loading-text="$v('데이터 로딩중\n잠시만 기다려 주십시오.')"
      v-loading="(!this.interval ? loading.isGetVmRequest : false) || (filteredData.length && !grid)"
    >
      <cmp-grid
        ref="serverGrid"
        class="route-detail-grid"
        :loading="!this.interval ? loading.isGetVmRequest : false"
        :item-source="filteredData"
        :columns="columns"
        :column-data-map="columnDataMap"
        :init-custom-action="flex => grid = flex"
        :custom-init-filter="filter => this.gridFilter = filter"
        :init-auto-select-row="checkedVms"
        init-auto-select-row-key="userVmIdx"
        :use-excel-download="!isOnlyGrid"
        :changing-page-reset="false"
        @selectedRow="selectRow(...arguments, columns)"
        @total-count="cnt => totalResultCnt = cnt"
        @checkedRowsData="params => {
          setCheckedItems(params)
          if(checkedVms.length) powerState = checkedVms[0].powerState
        }"
        @clickDisabledCheckbox="clickDisabled"
        @changingPage="num => {
          activePageNum = num
        }"
        selectable
        use-checkbox
        page-keeping
      >
        <template #createType="{ row }">
          <created-by-cmp-tag v-if="row.userInfo && row.userInfo.createType !== 'REGISTER'" />
          <span v-else />
        </template>

        <template #isUrgent="{ row }">
          {{ row.isUrgent ? '긴급' : '일반' }}
        </template>
        <!-- 분류 -->

        <template #osName="{ row }">
          <set-os-icon
            v-if="row.osName"
            :os-name="row.osName"
          />
          <span v-else>-</span>
        </template>

        <template #osType="{ row }">
          <set-os-icon
            v-if="row.osType"
            :os-name="row.osType"
          />
          <span v-else>-</span>
        </template>

        <template #vmStatus="{ row }">
          <template v-if="row.vmStatus">
            <cmp-status-tag
              :type="{
                PROGRESS: 'is-loading',
                POWERED_ON: 'is-info',
                POWERED_OFF: 'is-undefined',
                FAIL: 'is-fail'
              }[row.vmStatus]"
              :line-style="row.vmStatus === 'FAIL' ? false : true"
              :style="{width: row.vmStatus === 'PROGRESS' ? '75px' : '60px'}"
            >
              {{ {
                PROGRESS: 'Progress',
                POWERED_ON: 'ON',
                POWERED_OFF: 'OFF',
                FAIL: 'FAIL'
              }[row.vmStatus] }}
            </cmp-status-tag>
          </template>
          <span v-else>-</span>
        </template>

        <template #hostname="{ row }">
          <div
            class="hostname-name-wrap"
            v-if="row.hostname"
          >
            <span
              v-if="row.userInfo && (
                row.userInfo.createTime > new Date(Date.now() - ( 3600 * 1000 * 24))
              )"
              class="new-tag-wh"
            >N</span>
            <!-- NEW 태그 : 만들어진지 하루 지나면 사라짐 -->

            <span
              v-if="row.isCopy"
              class="new-tag-wh -copy"
            >C</span>
            <!-- COPY 태그 -->

            <span
              v-if="row.deleteDate"
              class="new-tag-wh -delete"
            >{{ setDeleteDateState(row.deleteDate) }}</span>
            <!-- 삭제 예정/중/실패 태그 -->

            <cmp-status-tag
              v-if="row.isSwTest"
              type="test"
              contents="TEST"
            />

            {{ row.hostname }}
          </div>
          <span v-else>-</span>
        </template>
        <!-- 호스트 명 -->

        <template #esxiName="{ row }">
          {{ row.esxiName ? row.esxiName : '-' }}
        </template>
        <!-- ESXi -->

        <template #vmTools="{ row }">
          <el-tooltip
            v-if="row._vmToolsState"
            :disabled="!row._vmToolsStateDetail"
            placement="top"
            effect="light"
          >
            <template #content>
              {{ row._vmToolsStateDetail }}
            </template>
            <span v-if="row._vmToolsState">
              {{ row._vmToolsState }}
            </span>
          </el-tooltip>

          <span v-else>-</span>
        </template>

        <template #cpuCores="{ row }">
          <span>{{ row.cpuCores }} Core</span>
        </template>

        <template #memory="{ row }">
          {{ row.memory|GB }}
        </template>

        <template #hypervisorCpuUsagePpmValue="{ row }">
          <span v-if="row.powerState !== 'POWERED_ON'">-</span>
          <progress-bar
            v-else
            height="20px"
            :custom-percentage="row.cpuUsage || 0"
            :notice-percent="60"
            :alert-percent="80"
          />
        </template>
        <!-- CPU 사용량 -->

        <template #memoryUsagePpmValue="{ row }">
          <span v-if="row.powerState !== 'POWERED_ON'">-</span>
          <progress-bar
            v-else
            height="20px"
            :custom-percentage="row.memeUsage || 0"
            :notice-percent="60"
            :alert-percent="80"
          />
        </template>
        <!-- 메모리 사용량 -->

        <template #rootDiskSize="{ row }">
          {{ row.rootDiskSize }}&nbsp;GB
        </template>

        <template #externalDiskTotalSize="{ row }">
          <el-popover
            v-if="row.externalDiskList && row.externalDiskList.length"
            placement="bottom"
            width="200"
            trigger="hover"
            popper-class="-scroll"
          >
            <span slot="reference"> {{ row.externalDiskTotalSize }}&nbsp;GB ({{ row.externalDiskTotalCount }}EA)</span>
            <template><pre>{{ externalDiskListStr(row.externalDiskList) }}</pre></template>
          </el-popover>
          <span v-else>{{ row.externalDiskTotalSize }}&nbsp;GB ({{ row.externalDiskTotalCount }}EA)</span>
        </template>
      </cmp-grid>
    </section>

    <!-- 모달 -->
    <!-- 자원 추가 -->
    <el-dialog
      v-if="!isOnlyGrid"
      :visible.sync="modal.controlVm"
      :title="updateVmData
        ? `${$v('자원 변경')}`
        : `${$v('자원 추가')}`"
      :before-close="beforeCloseModal"
      width="1420px"
      top="5vh"
      @close="modal.controlVm = false"
    >
      <VMwareComputeUpdateForm
        v-if="modal.controlVm"
        v-loading="loading.createVm || loading.updateVm"
        @close="modal.controlVm = false"
        @save="confirmUpdate"
        :data="updateVmData"
        :project-idx="updateVmData
          ? updateVmData.projectIdx
          : (selectedProjectInfo ? selectedProjectInfo.projectIdx : undefined)"
        :user-info="user"
        in-admin
      />
    </el-dialog>

    <!-- 자원 복사 -->
    <el-dialog
      v-if="!isOnlyGrid"
      v-loading="loading.cloneVm"
      :visible.sync="modal.cloneVm"
      :before-close="beforeCloseModal"
      :title="$t('common.TERMS.resourceClone')"
      width="1200px"
      top="5vh"
      @close="modal.cloneVm = false"
    >
      <clone-vmware-vm
        v-if="modal.cloneVm"
        :vm-data="checkedVms[0]"
        :is-ipam="cloneItemIsIpam"
        @save="confirmClone"
        @close="modal.cloneVm = false"
      />
    </el-dialog>

    <!-- 자원 이관 -->
    <el-dialog
      :visible.sync="modal.migrateVm"
      :title="$t('common.TERMS.resourceMigration')"
      :before-close="beforeCloseModal"
      width="1100px"
      top="5vh"
      @close="modal.migrateVm = false"
      v-loading="loading.migrateVm"
    >
      <migrate-vmware-vm
        v-if="modal.migrateVm"
        :vm-data="checkedVms[0]"
        @save="confirmMigrate"
        @close="modal.migrateVm = false"
      />
    </el-dialog>

    <!-- 템플릿 Export -->
    <template-export-modal
      :active="modal.ova"
      :vm-info="checkedVms.length ? checkedVms[0] : null"
      @close="modal.ova = false"
    />
  </div>
</template>

<script>
import API, {
  SetOSIcon, ResourceFilterComponent, ProgressBar,
  joinExternalDiskList, vmwareToolsStatus,
  VMwareComputeUpdateForm
} from '@sd-fe/cmp-core'
import Dayjs from 'dayjs'
import { cloneDeep } from 'lodash'
import { mapState, mapGetters, mapActions } from 'vuex'
import { SortDescription } from '@grapecity/wijmo'

import CreateByCMPTag from '@/components/Tag/CreateByCMPTag'
import TemplateExportModal from './VMwareComponents/TemplateExportModal'
import CloneVmwareVm from './CloneVmwareVm/CloneVmwareVm'
import MigrateVmwareVm from './MigrateVmwareVm/MigrateVmwareVm'

import VMwareServerControlMixins from './VMwareServerControl.mixins.js'

export default {
  name: 'SetResourceServerList',
  mixins: [VMwareServerControlMixins],
  components: {
    'set-os-icon': SetOSIcon,
    'progress-bar': ProgressBar,
    'created-by-cmp-tag': CreateByCMPTag,
    TemplateExportModal,
    ResourceFilterComponent,
    CloneVmwareVm,
    MigrateVmwareVm,
    VMwareComputeUpdateForm
  },
  props: {
    isOnlyGrid: {
      type: Boolean,
      default: false
    },
    searchedTags: {
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
    }),
    ...mapGetters({
      getIsProjectLoaded: 'project/getIsProjectLoaded',
      getProject: 'project/getProject'
    })
  },
  watch: {
    searchedTags: {
      immediate: true,
      deep: true,
      handler (val) {
        this.filteredData = this.filterGridSearchedTags(val)
      }
    },
    activePageNum: {
      handler (num) {
        sessionStorage.setItem('configServerGridPage', num)
      }
    },
    'loading.convertVmPower': {
      handler (val) {
        if (val) {
          this.checkedVms.forEach(vm => {
            vm.vmStatus = 'PROGRESS'
          })
        }
      }
    }

  },
  async created () {
    await this.getProjectByCloudType() // 프로젝트 조회
    if (this.$route?.query) this.setQuery(this.$route.query)
    await this.init()

    if (this.$route?.query) this.setQuery(this.$route.query)
    else this.filteredData = [...this.tableData]
    if (this.isOnlyGrid) {
      this.initList = cloneDeep(this.filteredData)
      this.$emit('getGrid', true)
    } else {
      await this.getVmInterval()
    }
  },
  beforeDestroy () {
    this.clearGetVmInterval()
  },
  methods: {
    ...mapActions({
      getProjectByCloudType: 'project/getProjectByCloudType'
    }),
    filterGridSearchedTags (searchedTags) {
      let result = cloneDeep(this.initList)

      // 검색된 자원태그가 없을경우 빈 배열을 반환합니다.
      if (!searchedTags || searchedTags.length === 0) {
        return []
      }

      result = this.initList.filter((el) => {
        return searchedTags.some((tags) =>
          tags.serviceType === 'VM' && String(el.userVmIdx) === tags.resourceId
        )
      })
      // 자원태그 검색화면에서 사용하는 이벤트입니다.
      this.$emit('change', result.length || 0)
      return result
    },
    setQuery (query) {
      if (query?.esxiName) this.filteredEsxiName = query.esxiName
    },
    showModalOVA () {
      if (this.checkedVms.length > 1) return
      this.modal.ova = !this.modal.ova
    },
    async init () {
      await this.getVmList()
    },
    /**
     * vm 목록을 조회합니다.
     */
    async getVmList () {
      try {
        this.loading.isGetVmRequest = true
        const data = await API.vmware.vm.getVmwareVmList({
          isProgress: true,
          ...(this.selectedProjectIsnfo?.projectIdx && {
            projectIdx: this.selectedProjectInfo?.projectIdx
          })
        })

        const hostNameList = data.map(el => el.hostInfo?.name)

        // ESXi 필터 옵션
        this.esxiOptions = [{ value: '', label: this.$i18n.locale === 'en' ? 'All' : '전체' }]
        const esxiMap = [...new Set(hostNameList)]
          .filter(el => el)
          .map((el) => ({ value: el, label: el }))
        this.esxiOptions = [...this.esxiOptions, ...esxiMap]
        //        { value: 'POWERED_OFF', label: 'OFF' }
        await this.vmInfoSetting(data)
        if (!this.isOnlyGrid) this.getVmInterval()
      } catch (error) {
        console.error(error)
        this.tableData = []
        throw error
      } finally {
        this.loading.isGetVmRequest = false
      }
    },

    async vmInfoSetting (data) {
      if (!data) {
        this.tableData = []
        return
      }

      const allVmStatus = []

      const list = data.map(vm => {
        const {
          userInfo,
          hostInfo,
          name,
          hostname,
          memorySize,
          diskList,
          // scsiControllerList,
          powerState,
          vmPathName,
          toolsRunningStatus
        } = vm

        // 상태
        const vmStatus = ['RUNNING', 'READY'].includes(userInfo?.status)
          ? (userInfo?.status === 'FAIL' ? 'FAIL' : 'PROGRESS')
          : powerState
        allVmStatus.push(vmStatus)

        // 디스크
        // **루트 디스크 => controllerKey = 1000이고 unitNumber = 0 인 디스크
        const rootDisk = diskList?.find(disk => disk.controllerKey === 1000 && disk.unitNumber === 0)
        const rootDiskSize = rootDisk
          ? rootDisk?.capacityB
            ? this.$options.filters.byteToGb(rootDisk.capacityB)
            : rootDisk?.size || 0
          : 0

        const allDisks = joinExternalDiskList(diskList, userInfo.externalDiskList)
        // 루트 디스크를 포함하지 않은 디스크
        const disks = allDisks?.filter(disk => !(disk.controllerKey === 1000 && disk.unitNumber === 0))

        // VM Tools
        const {
          state: _vmToolsState,
          detail: _vmToolsStateDetail,
          isInstalled: _vmToolsIsInstalled,
          isRuninng: _vmToolsIsRunning
        } = vmwareToolsStatus(vm)

        // 프로젝트 정보
        const projectInfo = this.getProject(userInfo?.projectIdx)

        const row = Object.assign({
          ...vm,
          isUrgent: !!userInfo?.isUrgent,
          hostname: name || hostname,
          esxi: hostInfo,
          esxiName: hostInfo?.name || hostInfo?.userConnectDetailInfo?.name,
          userVmIdx: userInfo?.userVmIdx,
          memorySizeGB: this.$options.filters.MB(memorySize),
          externalDiskList: disks,
          externalDiskTotalSize: disks?.length
            ? disks.reduce((a, b) => a + b.size, 0)
            : 0,
          externalDiskTotalCount: disks?.length || 0,
          rootDiskSize,

          companyName: projectInfo?.companyName,
          companyIdx: projectInfo?.companyIdx,
          groupName: projectInfo?.groupName,
          groupIdx: projectInfo?.groupIdx,
          projectName: projectInfo?.projectName,
          projectIdx: projectInfo?.projectIdx,
          datastoreName: this.$options.filters.textBetween(vmPathName, '[', ']'), // datastore 이름: vmPathName의 '[', ']' 사이에 있는 이름
          vmTools: toolsRunningStatus,

          _vmToolsState,
          _vmToolsStateDetail,
          _vmToolsIsInstalled,
          _vmToolsIsRunning,

          osType: userInfo?.image?.osType,
          osName: userInfo?.image?.userImageName,
          osBit: userInfo?.image?.osBit,

          vmStatus,
          isCopy: userInfo?.createType === 'COPY' && userInfo?.isFirstPowerOn === false,
          checked: this.checkedVmsUserVmIdx.includes(userInfo?.userVmIdx),

          deleteDate: userInfo?.deleteDate,
          createTime: userInfo?.createTime
        }, {})

        return row
      })

      this.tableData = [...list].sort((a, b) => {
        const isNew = (item) => item.createTime > new Date(Date.now() - (3600 * 1000 * 24))

        if (isNew(a) < isNew(b)) return 1
        else if (isNew(a) > isNew(b)) return -1
        else return (b.createTime - a.createTime)
      })
      // this.isProgressVm = this.setIsProgressVm(allVmStatus) // vms 중 작업 진행 중인 친구들이 있는지 세팅
      await this.setCheckedItems(this.checkedVms)

      // this.columnDataMap.externalDiskTotalSize = Array.from(new Set(mappedExternals))
    },

    routeTo (to) {
      this.$router.push(to)
    },
    selectRow (row, columns) {
      this.routeTo({
        name: 'set-resource-server-detail-vmw',
        params: {
          userVmIdx: row.dataItem.userVmIdx
        }
      })
    },

    ipHtml (ipList) {
      if (ipList.length <= 1) return
      let ips = ''
      for (let i = 1; i < ipList.length; i++) {
        ips += ipList[i] + '<br>'
      }
      return ips
    },
    /**
     * 체크 된 항목 컨트롤
     */
    setCheckedItems (items) {
      this.checkedVms = [...items]

      // console.log('@체크된 친구들: ', this.checkedVms)

      this.checkedVmsUserVmIdx = items.map(item => item.userVmIdx)

      for (let i = 0; i < this.tableData.length; i++) {
        const row = this.tableData[i]

        row.checked = this.checkedVmsUserVmIdx.includes(row.userVmIdx)
        row.disable = this.checkedVms.length >= 1
          ? !!(row.powerState !== this.checkedVms[0].powerState || row.vmStatus === 'PROGRESS' || row.deleteDate || row.isUrgent) // vm 상태가 다르거나 Progress 상태거나 삭제 예정이거나 긴급 자원
          : !!(row.vmStatus === 'PROGRESS' || row.deleteDate || row.isUrgent) // Progress 상태거나 삭제 예정(deleteDate o) 이거나 긴급 자원
      }

      this.updateMainGrid()
    },
    /**
     * 그리드의 disable 체크박스 클릭 시, 발생 이벤트
     */
    clickDisabled (row) {
      if (row.deleteDate) return this.$alert(this.$v('삭제 예정 자원입니다.'), () => false)
      if (row.vmStatus === 'PROGRESS') return this.$alert(this.$v('작업 중인 자원입니다.'), () => false)
      if (row.isUrgent) return this.$alert('긴급 자원은 읽기만 가능합니다.', () => false)
      this.$alert(this.$v('같은 상태의 VM만<br>다중 선택이 가능합니다.'), {
        dangerouslyUseHTMLString: true,
        callback: () => false
      })
    },
    async searchCompute (payload) {
      this.selectedProjectInfo = payload
      await this.init()
    },
    /**
     * 호스트명, VM 상태 필터링 이벤트
     */
    filtering () {
      if (
        !this.filteredVmState &&
        !this.filteredHostName &&
        !this.selectedProjectInfo &&
        !this.filteredEsxiName &&
        this.filteredIsUrgent === '' &&
        !this.testVmState &&
        !this.filterCreateTypeRegisterChecked
      ) this.filteredData = this.tableData
      else {
        this.filteredData = this.tableData.filter(item => {
          let result = true
          if (this.selectedProjectInfo?.companyIdx) result = result && (item.companyIdx === this.selectedProjectInfo.companyIdx)

          if (this.selectedProjectInfo?.groupIdx) result = result && (item.groupIdx === this.selectedProjectInfo.groupIdx)

          if (this.selectedProjectInfo?.projectIdx) result = result && (item.projectIdx === this.selectedProjectInfo.projectIdx)

          if (this.filteredVmState) result = result && (item.powerState === this.filteredVmState)

          if (this.filteredHostName) result = result && (item.hostname?.toLowerCase().includes(this.filteredHostName?.toLowerCase()))

          if (this.filteredEsxiName) result = result && (item.hostInfo?.name?.toLowerCase().includes(this.filteredEsxiName?.toLowerCase()))

          if (typeof this.filteredIsUrgent === 'boolean') result = result && (item.isUrgent === this.filteredIsUrgent)

          // test VM 체크유무
          if (this.testVmState) result = result && (item.userInfo?.isSwTest === this.testVmState)

          // CMP 외부 생성 자원 보기 (미등록 -> 등록)
          if (this.filterCreateTypeRegisterChecked) result = result && (item.userInfo?.createType === 'REGISTER')

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
     * [변경] 발생 이벤트
     */
    async clickChangeBtn (data) {
      const userVmIdx = data?.userVmIdx
      if (!userVmIdx) return
      const detailData = await API.vmware.vm.getVmwareVmDetail(userVmIdx)
      this.updateVmData = await this.setDetailData(detailData)

      this.modal.controlVm = true

      try {
        this.loading.isGetVmRequest = true
      } catch (error) {
        console.error(error)
        this.$alert('vm 상세 조회에 문제가 발생했습니다.', () => false)
      } finally { this.loading.isGetVmRequest = false }
    },
    async setDetailData (vm) {
      if (!vm) return
      const {
        userInfo,
        diskList,
        scsiControllerList
      } = vm

      // const meta = userInfo?.metaInfo ? JSON.parse(userInfo.metaInfo) : null

      // External Disk
      // **루트 디스크 => controllerKey = 1000이고 unitNumber = 0 인 디스크
      const rootDisk = diskList?.find(disk => disk.controllerKey === 1000 && disk.unitNumber === 0)
      const rootDiskSize = rootDisk
        ? rootDisk?.capacityB
          ? this.$options.filters.byteToGb(rootDisk.capacityB)
          : rootDisk?.size || 0
        : 0

      // 루트 디스크를 포함하지 않은 디스크
      const allDisks = joinExternalDiskList(diskList, userInfo?.externalDiskList, scsiControllerList)
      const disks = allDisks?.filter(disk => !(disk.controllerKey === 1000 && disk.unitNumber === 0))

      const settingData = {
        ...vm,
        userVmIdx: userInfo?.userVmIdx,
        externalDiskList: disks,
        externalDiskTotalSize: disks?.length
          ? disks.reduce((a, b) => a + b.size, 0)
          : 0,
        externalDiskTotalCount: disks?.length || 0,
        rootDiskSize,
        projectIdx: userInfo.projectIdx,

        chargeDate: userInfo?.chargeDate,

        // metaInfo에 함께 보낸 데이터
        // 자원 명, 서비스 개시일, 자원 태그, 압무 명, 긴급 여부
        isUrgent: userInfo?.isUrgent
        // tags: meta?.tags
      }

      return settingData
    },
    /**
     * VM Migrate 데이터 가공 이벤트
     */
    async confirmMigrate ({ vmData, destNode }) {
      const requestData = {
        migrationDatastoreId: destNode?.datastoreList
          ? destNode.datastoreList[0].datastoreId
          : undefined,
        migrationHostUuid: destNode.hostUuid,
        reqUserId: this.user.userId,
        userVmIdx: vmData.userVmIdx,
        vmUuid: vmData.vmUuid,
        resourceName: vmData.resourceName
      }

      const { beforePrice, groupIdx, groupName, isUrgent, price, projectIdx } = vmData
      const payload = {
        beforePrice,
        groupIdx,
        groupName,
        isUrgent,
        price,
        projectIdx,
        requestData,
        service: 'VM',
        userId: this.user.userId,
        userName: this.user.userName
      }

      const result = await this.migrateVm(payload)
      if (result) this.setCheckedItems([])
    },
    /**
     * VM Clone 데이터 가공 이벤트
     * @param {Object} param { vmData: origin vm 정보, cloneVms: 클론 vm 정보 }
     */
    async confirmClone ({ vmData, cloneVms }) {
      this.$confirm(this.$v('자원을 복제하시겠습니까?')).then(async () => {
        // this.$alert(this.$t('common.ALERT.COMP.039'), { dangerouslyUseHTMLString: true }) // 입력하지 않은 데이터는<br>기존 자원 정보 데이터로 대체됩니다.
        const result = await this.cloneVm(vmData.userVmIdx, { vmData, cloneVms })
        if (result) {
          this.modal.cloneVm = false
          this.setCheckedItems([])
        }
      }).catch(() => false)
    },
    /**
     * VM 생성/수정 시, '저장'
     */
    confirmUpdate (savedData) {
      const isNew = !savedData.userVmIdx

      const { beforePrice, groupIdx, groupName, isUrgent, price, projectIdx, tagInfo, templateIdx, vmUuid } = savedData

      const isOVA = !!templateIdx

      const payload = {
        beforePrice,
        groupIdx,
        groupName,
        isUrgent,
        price,
        projectIdx,
        requestData: {
          ...savedData,
          ...(isNew ? {
            tagInfo: tagInfo || []

          } : {
            vmUuid
          })
        },
        service: isOVA ? 'VM_BY_TEMPLATE' : 'VM',
        userId: this.user.userId,
        userName: this.user.userName
      }

      let message
      isNew ? message = this.$v('자원을 생성하시겠습니까?') : message = this.$v('자원을 수정하시겠습니까?')
      this.$confirm(message).then(async () => {
        if (isNew) { // 생성
          console.log('vmw VM 생성.confirm:', payload)
          /* */
          const result = await this.createVmwareVm(payload)
          if (result) this.modal.controlVm = false
        } else { // 수정
          const result = await this.updateVmwareVm(payload)
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

      this.modal.cloneVm = true
    },
    gridRefresh (grid = this.grid) {
      if (!grid) return
      const cv = grid.collectionView
      if (!cv) return
      cv.refresh()
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
    externalDiskListStr (disks) {
      if (!disks?.length) return
      let result = ''

      for (let i = 0; i < disks.length; i++) {
        const disk = disks[i]
        if (disk.controllerKey === 1000 && disk.unitNumber === 0) continue
        result += (disk.diskName ? disk.diskName : `SCSI ${disk.busNumber}:${disk.unitNumber}`) + ' , ' + (disk.diskSize || disk.size) + ' GB \n'
      }
      return result
    },
    alert (message, callback) {
      this.$alert(message, '알림', {
        callback: callback,
        dangerouslyUseHTMLString: true
      })
    }
  },
  data (root) {
    return {
      grid: null,
      initList: [],
      activePageNum: 1,
      isProgressVm: false,
      totalResultCnt: 0,
      loading: {
        isGetVmRequest: false,
        createVm: false,
        convertVmPower: false
      },
      originGridState: null, // 인터벌 돌기 전, 그리드의 sorting/filtering 상태 저장

      filteredVmState: '', // 핉터링 > VM 상태
      filteredHostName: '', // 필터링 > 호스트명
      filteredEsxiName: '',
      filteredIsUrgent: '', // 필터링 > 분류
      testVmState: false, // 필터링 > test Vm 보기
      filterCreateTypeRegisterChecked: false, // 필터링 > CMP 외부 생성 자원 보기 (미등록 -> 등록)
      powerState: '', // 버튼 영역 > 파워 상태 선택

      checkedVms: [], // 체크한 vms
      checkedVmsUserVmIdx: [],
      modal: {
        testControlVm: false, // 테스트 용
        controlVm: false, // vm 생성/변경 모달 active Handler
        cloneVm: false, // vm 복제
        migrateVm: false, // vm 이관
        ova: false // OVA Export
      },
      updateVmData: null, // 업데이트 할 vm정보 (create일 때 null)
      cloneItemIsIpam: true, // 클론하는 vm이 IPAM 자원인지?

      // compute 데이터
      columns: [
        { binding: 'createType', header: ' ', width: 70, customHtml: true, filtable: false },
        { binding: 'projectName', header: '프로젝트 명', align: 'left', keyPath: 'common.GRID.projectName' },
        { binding: 'isUrgent', header: root.$v('긴급 처리 여부'), width: 100, customHtml: true },

        // { binding: 'itsmName', header: '업무명', width: '*', align: 'left', keyPath: 'common.REGCON.workName' },
        { binding: 'hostname', header: '호스트명', width: 150, align: 'left', customHtml: true, keyPath: 'common.REGCON.hostName' },
        { binding: 'vmStatus', header: '상태', width: 100, customHtml: true, keyPath: 'common.GRID.state' },
        { binding: 'esxiName', header: 'ESXi', width: '*', customHtml: true },
        { binding: 'vmTools', header: 'VM Tools 상태', customHtml: true, align: 'center' },
        { header: root.$v('이미지 이름'), binding: 'osName', width: 90, customHtml: true },
        { header: root.$v('OS 타입'), binding: 'osType', width: 80, customHtml: true },
        { header: 'OS Bit', binding: 'osBit', width: 60 },
        { binding: 'cpuCores', header: 'vCPU', width: 80, customHtml: true },
        { binding: 'hypervisorCpuUsagePpmValue', header: 'vCPU 사용량(%)', width: 150, customHtml: true, keyPath: 'common.GRID.DATABASE.usageCpu' },
        { binding: 'memorySizeGB', header: 'Memory', width: 80 },
        { binding: 'memoryUsagePpmValue', header: 'Memory 사용량(%)', width: 150, customHtml: true, keyPath: 'common.GRID.COMPUTE.usageMemory' },
        { binding: 'rootDiskSize', header: 'RootDisk', width: 80, customHtml: true },
        { binding: 'externalDiskTotalSize', header: 'Local Disk', width: 100, customHtml: true } // GB
      ],
      tableData: [],
      filteredData: [],
      selectedProjectInfo: null,
      columnDataMap: {
        externalDiskTotalSize: null,
        vmTools: [
          { value: 'guestToolsRunning', caption: '실행 중' },
          { value: 'guestToolsNotRunning', caption: '실행 중 아님' },
          { value: null, caption: '해당 없음' }
        ],
        vmStatus: [
          { value: 'POWERED_ON', caption: 'ON' },
          { value: 'POWERED_OFF', caption: 'OFF' }
        ]
      },

      // vm 상태 옵션
      vmStateOptions: [
        { value: '', label: this.$i18n.locale === 'en' ? 'All' : '전체' },
        { value: 'POWERED_ON', label: 'ON' },
        { value: 'POWERED_OFF', label: 'OFF' }
      ],
      esxiOptions: [
        { value: '', label: this.$i18n.locale === 'en' ? 'All' : '전체' }
      ],
      isUrgentOptions: [
        { value: '', label: root.$v('전체') },
        { value: false, label: root.$v('일반') },
        { value: true, label: root.$v('긴급') }
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
    .flex-wrap { gap: 30px; }
    .search-area { margin-top: $gap-s; }
  }

  // 카테고리 모달
  .el-popper.power-select-popper {
    padding-top: 5px;
    width: 160px;
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
    min-width: 50px;
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
  .table-area { min-height: 500px; }

  // 인터벌 + 페이지네이션 때 알 수 없는 스크롤바 생김 방지
  .route-detail-grid {
    .wj-content {
      & > div {
        div[wj-part=root] {
          overflow: hidden !important;
          .wj-cell > div { white-space: nowrap !important; }
        }
      }
    }
  }

  .power-state-select { // Power Off 영역
    width: 160px;
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
