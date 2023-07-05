<!--
  * 파일명 : UnregisterVmList.vue
  * 파일 기능 : VMware > 구성관리 > 미등록 자원 관리 > Compute(VM)
  * 작성자 : 김예담
  * License By Shinsegae I&C
 -->

<template>
  <div class="unregister-vmware-vm-list">
    <section class="table-top-wrap">
      <total-count
        v-if="!editable"
        class="total-count-wrap"
        :total-count="totalResultCnt"
      >
        <search-component
          v-if="!editable"
          class="search-area"
          :placeholder="$v('호스트 명')"
          @search="val => {
            filteredHostName = val
            filtering()
          }"
        />
      </total-count>
      <div
        v-else
        class="flex-wrap basket-title-wrap"
      >
        <span class="sub-title">Compute</span>
        <total-count :total-count="totalResultCnt" />
      </div>

      <button
        v-if="editable"
        class="button -common-button"
        :disabled="!checkedItems.length"
        @click="openUpdateModal(checkedItems)"
      >
        {{ $v('데이터 일괄 적용') }}
      </button>
    </section>

    <section class="table-area">
      <cmp-grid
        class="unregister-resource-grid -vm"
        v-loading="gridData.length && !grid"
        ref="serverGrid"
        :item-source="editable ? gridData : filteredData"
        :columns="columns"
        :column-data-map="columnDataMap"
        :init-auto-select-row="initAutoSelectRow"
        :init-custom-action="flex => grid = flex"
        :custom-init-filter="filter => this.gridFilter = filter"
        init-auto-select-row-key="vmUuid"
        :changing-page-reset="false"
        @total-count="cnt => totalResultCnt = cnt"
        @checkedRowsData="setCheckedItems"
        @changingPage="num=> activePageNum = num"
        @loaded-rows="onLoadedRows"
        :selectable="false"
        header-checkbox
        page-keeping
      >
        <template
          v-for="column in columns"
          :slot="column.binding"
          slot-scope="{ row }"
        >
          <div :key="column.binding">
            <span
              v-if="row.afterData && (row.afterData[column.binding] !== undefined)"
              class="after-data"
            >
              {{ column.isMeta
                ? (row.afterData[column.binding].viewData || '-')
                : (row.afterData[column.binding] || '-') }}
            </span>
            <span v-else>{{ row[column.binding] || '-' }}</span>
          </div>
        </template>

        <template #isUrgent="{ row }">
          <span class="after-data">{{ row.isUrgent ? $v('긴급') : $v('일반') }}</span>
        </template>
        <!-- 분류 -->

        <template #osName="{ row }">
          <div
            class="flex-wrap after-data"
            v-if="row.afterData && row.afterData.osName"
          >
            <set-os-icon :os-name="row.afterData.osName" />
            <span v-if="row.afterData.osBit">({{ row.afterData.osBit }})</span>
          </div>
          <span v-else>-</span>
        </template>

        <template #powerState="{ row }">
          <template v-if="row.powerState">
            <cmp-status-tag
              :type="{
                POWERED_ON: 'is-info',
                POWERED_OFF: 'is-undefined',
                FAIL: 'is-fail'
              }[row.powerState]"
              :line-style="row.powerState === 'FAIL' ? false : true"
              :style="{width: '60px'}"
            >
              {{ {
                POWERED_ON: 'ON',
                POWERED_OFF: 'OFF',
                FAIL: 'FAIL'
              }[row.powerState] }}
            </cmp-status-tag>
          </template>
          <span v-else>-</span>
        </template>

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

        <template #specInfo="{ row }">
          <p style="line-height: 1.6;">
            vCPU: {{ row.cpuCores || 0 }}Core,&ensp;
            RAM: {{ row.memorySizeGB || 0 }}GB,&ensp;
            Disk: {{ row.rootDiskSize || 0 }}GB
          </p>
          <div
            v-if="row.externalDiskList"
            class="external-disk-wrapper"
          >
            <span>Local Disk&nbsp;:
              <el-popover
                v-if="row.externalDiskList && row.externalDiskList.length"
                placement="top"
                width="200"
                trigger="hover"
                popper-class="-scroll"
              >
                <span slot="reference">
                  {{ row.externalDiskTotalCount }}EA
                  &nbsp;({{ row.externalDiskTotalSize }}GB)
                </span>
                <template>
                  <pre>{{ externalDiskListStr(row.externalDiskList) }}</pre></template>
              </el-popover>
              <span v-else>{{ row.externalDiskTotalSize }}&nbsp;GB ({{ row.externalDiskTotalCount }}EA)</span>
            </span>
          </div>
        </template>
        <!-- 기본사양 -->

        <template #networkList="{ row }">
          <el-tooltip
            v-if="row.afterData
              && row.afterData.networkList
              && row.afterData.networkList.length"
            placement="top"
            effect="light"
          >
            <template #content>
              <ul>
                <li
                  v-for="(net, netIdx) in row.afterData.networkList"
                  :key="netIdx"
                >
                  {{ net.deviceName || net.name }}&nbsp;
                  <span class="after-data">{{ net.cateKey ? `(${net.cateKey})` : '' }}</span>
                </li>
              </ul>
            </template>
            <span class="after-data">
              {{ row.networkList.length }}EA
            </span>
          </el-tooltip>
          <el-tooltip
            v-else-if="row.networkList && row.networkList.length"
            placement="top"
            effect="light"
          >
            <template #content>
              <ul>
                <li
                  v-for="(net, netIdx) in row.networkList"
                  :key="netIdx"
                >
                  {{ net.deviceName || net.name }}&nbsp;
                </li>
              </ul>
            </template>
            <span>
              {{ row.networkList.length }}EA
            </span>
          </el-tooltip>
          <span
            v-else
            class="empty-content"
          >-</span>
        </template>
        <!-- 네트워크 정보 (네트워크 조직) -->

        <template #installProgramList="{ row }">
          <el-tooltip
            v-if="row.afterData
              && row.afterData.installProgramList
              && row.afterData.installProgramList.length"
            placement="top"
            effect="light"
          >
            <template #content>
              <ul>
                <li
                  v-for="pkg in row.afterData.installProgramList"
                  :key="`install_${pkg.versionId}`"
                >
                  {{ pkg.softwareName }} {{ pkg.versionName }}
                </li>
              </ul>
            </template>
            <span class="after-data">
              {{ row.afterData.installProgramList.length }}EA
            </span>
          </el-tooltip>
          <el-tooltip
            v-else-if="row.installProgramList && row.installProgramList.length"
            placement="top"
            effect="light"
          >
            <template #content>
              <ul>
                <li
                  v-for="pkg in row.installProgramList"
                  :key="`install_${pkg.versionId}`"
                >
                  {{ pkg.softwareName }} {{ pkg.versionName }}
                </li>
              </ul>
            </template>
            <span>
              {{ row.installProgramList.length }}EA
            </span>
          </el-tooltip>
          <span v-else>-</span>
        </template>

        <template #licenseList="{ row }">
          <el-tooltip
            v-if="row.afterData
              && row.afterData.licenseList
              && row.afterData.licenseList.length"
            placement="top"
            effect="light"
          >
            <template #content>
              <span v-html="ArrayjoinWithHtml(row.afterData.licenseList, 'name')" />
            </template>
            <span class="after-data">
              {{ row.afterData.licenseList.length }}EA
            </span>
          </el-tooltip>
          <el-tooltip
            v-else-if="row.licenseList && row.licenseList.length"
            placement="top"
            effect="light"
          >
            <template #content>
              <span v-html="ArrayjoinWithHtml(row.licenseList, 'name')" />
            </template>
            <span>
              {{ row.licenseList.length }}EA
            </span>
          </el-tooltip>
          <span v-else>-</span>
        </template>

        <template #manageGroup="{ row }">
          <span
            v-if="row.afterData && row.afterData.manageGroupName"
            class="after-data"
          >
            {{ row.afterData.manageGroupName }}
          </span>
          <span v-else>-</span>
        </template>
        <!-- 운영그룹 -->

        <template #chargeDate="{ row }">
          <span
            v-if="row.afterData && row.afterData.chargeDate"
            class="after-data"
          >{{ row.afterData.chargeDate | date('YYYY.MM.DD') }}</span>
          <span v-else>{{ row.chargeDate | date('YYYY.MM.DD') }}</span>
        </template>
        <!-- 과금 시작일 -->

        <template #editing="{ row }">
          <div class="flex-wrap">
            <button
              class="button"
              type="is-icon"
              @click.stop="openUpdateModal([row])"
            >
              <i class="-edit-icon" />
            </button>
            <button
              class="button"
              type="is-icon"
              @click.stop="clickDelete(row)"
            >
              <i class="delete-icon" />
            </button>
          </div>
        </template>
      </cmp-grid>
    </section>

    <!-- 모달 -->
    <el-dialog
      v-loading="loading.isSettingInitData"
      :visible.sync="modal.editItem"
      :title="updatingItems.length > 1 ?
        $v('데이터 일괄 적용') :
        $v('미등록 자원 수정')"
      :before-close="beforeCloseModal"
      width="1100px"
      top="5vh"
      @close="modal.editItem = false"
    >
      <section class="change-common-form">
        <div class="change-common-form-contents">
          <p class="sub-title">
            {{ $v('자원 기본 정보') }}
          </p>
          <vmware-compute-core-info-step
            v-if="modal.editItem"
            :data.sync="afterCoreInfo"
            :user-info="user"
            :project-info="!isEmpty(afterCoreInfo) && afterCoreInfo.projectInfo ? afterCoreInfo.projectInfo : null"
            in-admin
            is-unregistered
            editing
            @change-loading="flag => loading.isSettingInitData = flag"
          >
            <template #unregisterNetwork="{ row }">
              <cmp-grid
                v-if="updatingItems.length === 1"
                :item-source="row.networkList"
                :columns="networkInfoColumns"
                :init-custom-action="flex => networkGrid = flex"
              >
                <template #cateKey="props">
                  <div class="network-cate-wrap">
                    <el-tag v-if="props.row.cateKey">
                      {{ props.row.cateKey }}
                    </el-tag>

                    <button
                      class="button"
                      :type="props.row.cateKey ? 'is-dark' : 'is-primary'"
                      size="is-mini"
                      @click="() => openNetworkCateModal(props.row)"
                    >
                      {{
                        props.row.cateKey
                          ? $v('변경')
                          : $v('선택')
                      }}
                    </button>
                  </div>
                </template>
              </cmp-grid>
              <p
                class="network-update-noti"
                v-else
              >
                {{ $v('네트워크는 자원 개별 업데이트로만 설정 가능합니다.') }}
              </p>
            </template>
          </vmware-compute-core-info-step>
        </div>
        <div
          class="change-common-form-contents"
          v-if="metaFormData.length"
        >
          <p class="sub-title">
            {{ $v('자원 운영 정보') }}
          </p>
          <meta-data-form
            :form-data.sync="metaFormData"
            in-admin
          />
        </div>
      </section>
      <section class="modal-footer modal-button-area">
        <button
          class="button"
          type="is-anti"
          @click="modal.editItem = false"
        >
          {{ $v('취소') }}
        </button>
        <button
          class="button"
          type="is-primary"
          @click="() => {
            updateResource()
          }"
        >
          {{ $v('적용') }}
        </button>
      </section>
    </el-dialog>

    <!-- 네트워크 카테고리 선택 모달 -->
    <network-category-tree-selection
      :visible="modal.networkCateModalView"
      :init-data="(updatingNetworkItem && updatingNetworkItem.cateIdx)
        ? [updatingNetworkItem]
        : undefined"
      :cate-limit="1"
      @close="modal.networkCateModalView = false"
      @save="changeNetworkCate"
    />
  </div>
</template>

<script>
import {
  SetOSIcon,
  vmwareToolsStatus,
  VMwareComputeUpdateCoreInfoStep
} from '@sd-fe/cmp-core'
import { cloneDeep, isEmpty } from 'lodash'
import { mapState, mapGetters } from 'vuex'
import { VM as requiredColumns } from '../UnregisterResourceRequiredColumns'

export default {
  name: 'UnregisterVmwareVmList',
  components: {
    'set-os-icon': SetOSIcon,
    'vmware-compute-core-info-step': VMwareComputeUpdateCoreInfoStep
  },
  props: {
    data: {
      type: Array,
      default: () => []
    },
    editable: {
      type: Boolean,
      default: true
    },
    initAutoSelectRow: {
      type: Array,
      default: undefined
    }
  },
  computed: {
    ...mapState({
      user: state => state.auth.user,
      packageType: state => state.auth.packageType,
      vmMetadataForm: state => state.metadata.VMWARE.VM
    }),
    ...mapGetters({
      getIsProjectLoaded: 'project/getIsProjectLoaded',
      getProject: 'project/getProject'
    })
  },
  watch: {
    data: {
      immediate: true,
      async handler () {
        this.setColumns()
        await this.initListSetting(this.data)
      }
    }
  },
  async created () {
    this.filteredData = [...this.gridData]
  },
  methods: {
    isEmpty (val) { return isEmpty(val) },
    async initListSetting (data) {
      if (!data) {
        this.gridData = []
        return
      }

      const list = data.map(vm => {
        const {
          name, // 호스트 명
          hostname, // ESXi 명
          memorySize,
          diskList,
          vmPathName,
          toolsRunningStatus,
          vmUuid,
          networkAdapterList,
          networkList,
          createTime
        } = vm

        // **루트 디스크 => controllerKey = 1000이고 unitNumber = 0 인 디스크
        const rootDisk = diskList?.find(disk => disk.controllerKey === 1000 && disk.unitNumber === 0)
        const rootDiskSize = rootDisk
          ? rootDisk?.capacityB
            ? this.$options.filters.byteToGb(rootDisk.capacityB)
            : rootDisk?.size || 0
          : 0

        const allDisks = diskList
        const disks = allDisks?.filter(disk => !(disk.controllerKey === 1000 && disk.unitNumber === 0))
        // 루트 디스크를 포함하지 않은 디스크

        // VM Tools
        const {
          state: _vmToolsState,
          detail: _vmToolsStateDetail,
          isInstalled: _vmToolsIsInstalled,
          isRuninng: _vmToolsIsRunning
        } = vmwareToolsStatus(vm)

        const row = Object.assign({
          ...vm,
          createDate: this.$options.filters.dateSimple(createTime),

          hostname: name,
          esxiName: hostname,
          memorySizeGB: this.$options.filters.byteToGb(memorySize * 1024 * 1024),
          externalDiskList: disks,
          externalDiskTotalSize: disks?.length
            ? disks.reduce((a, b) => a + (b.size || b.diskSize), 0)
            : 0,
          externalDiskTotalCount: disks?.length || 0,
          rootDiskSize,
          networkList: networkList || cloneDeep(networkAdapterList),

          datastoreName: this.$options.filters.textBetween(vmPathName, '[', ']'), // datastore 이름: vmPathName의 '[', ']' 사이에 있는 이름
          vmTools: toolsRunningStatus,

          _vmToolsState,
          _vmToolsStateDetail,
          _vmToolsIsInstalled,
          _vmToolsIsRunning,

          service: 'VM',
          resourceIdx: vmUuid,
          resourceName: name,
          checked: this.checkedItemsId.includes(vmUuid),
          chargeDate: vm.createTime, // 과금 시작일 > 자원 생성일로 세팅 (임시)

          requiredColumnArr: [...requiredColumns, ...this.metaRequiredColumns] // 필수 column 정보 목록
        }, {})

        return row
      })

      this.gridData = [...list]
      this.filtering()
    },

    routeTo (to) {
      this.$router.push(to)
    },
    /**
     * 체크 된 항목 컨트롤
     */
    setCheckedItems (items) {
      this.checkedItems = [...items]
      this.checkedItemsId = items.map(item => item.vmUuid)

      this.$emit('checkedRowsData', this.checkedItems)

      // console.log('@체크된 친구들: ', this.checkedItems)
    },
    /**
     * 호스트명, VM 상태 필터링 이벤트
     */
    filtering () {
      if (this.editable) return

      if (
        !this.filteredHostName
      ) this.filteredData = this.gridData
      else {
        this.filteredData = this.gridData.filter(item => {
          let result = true

          if (this.filteredHostName) result = result && (item.hostname?.toLowerCase().includes(this.filteredHostName?.toLowerCase()))
          return result
        })
      }
    },

    gridRefresh (grid = this.grid) {
      if (!grid) return
      const cv = grid.collectionView
      if (!cv) return
      cv.refresh()
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
    settingItemMetaData (vm) {
      const form = this.vmMetadataForm
      const metaInfo = vm?.metaInfo ? JSON.parse(vm.metaInfo) : null

      this.metaFormData = metaInfo
        ? form?.map(meta => {
          const data = metaInfo[meta.key]
          return {
            ...meta,
            data: data || meta.data
          }
        })
        : cloneDeep(form || [])
    },
    /**
     * row 삭제 시, 발생 이벤트
     */
    clickDelete (row) {
      if (!this.editable) return false

      this.$emit('delete-row', row)
    },
    /**
    * 모달 닫기 전, 정말 취소하겠냐는 알람
    */
    beforeCloseModal (done) {
      this.$confirm(this.$v('내용을 저장하지 않고 취소하시겠습니까?'))
        .then(() => {
          done()
        }).catch(() => false)
    },
    openUpdateModal (data = this.checkedItems) {
      this.updatingItems = [...data]

      if (data.length === 1) {
        this.afterCoreInfo = {
          ...data[0],
          beforeData: cloneDeep(data[0])
        }
        this.settingItemMetaData(data[0])
      } else {
        this.afterCoreInfo = {}
        this.settingItemMetaData()
      }

      this.modal.editItem = true
    },
    /**
     * 그리드 컬럼 데이터 세팅
     */
    setColumns () {
      let result = cloneDeep(this.originColumns)
      if (this.editable) {
        const metaColumns = (this.vmMetadataForm || []).map(data => ({
          binding: data.key,
          header: data.title,
          required: data.required,
          customHtml: true,
          forCmp: true,
          isMeta: true
        }))

        result.splice(-1, 0, ...metaColumns)

        this.metaRequiredColumns = metaColumns.filter(col => col.required) // 메타데이터 중 필수인 컬럼 정보만 담기 (필수 값 validation 위함)
      } else result = result.filter(col => (col.binding !== 'editing') && !col.forCmp)

      this.columns = result
    },
    /**
     * 그리드에 정보 업데이트
     * 한 개 업데이트 시 -> 데이터를 수정할 수 있다.
     * 여러개 업데이트 시 -> 데이터를 추가만 할 수 있다. 없는 데이터(undefine, null, 빈배열 등등...)는 적용하지 않는다.
     */
    updateResource () {
      const isSingle = this.updatingItems.length === 1 // 한 개만 업데이트 중인지?

      const afterCoreData = this.afterCoreInfo
      const afterMetaData = this.getMetaInfo(this.metaFormData)
      console.log('after Meta ==> ', this.metaFormData)
      console.log('after Core ===> ', this.afterCoreInfo)

      const metaInfo = !isEmpty(this.metaInfo) ? JSON.stringify(this.metaInfo) : ''

      const updateVmsUuid = this.updatingItems.map(vm => vm.vmUuid)

      const allUpdatedData = []

      const modifyVm = () => {
        try {
          const {
            isUrgent,
            projectInfo,

            selectImage, // 이미지
            installProgramList, // 설치프로그램 목록
            licenseList, // S/W 라이선스 목록
            networkList, // 네트워크 카테고리 목록
            manageGroupIdx, // 운영그룹(idx)
            manageGroupName, // 운영그룹(이름)

            chargeDate, // 과금 시작일
            tagInfo
          } = afterCoreData

          for (let i = 0; i < this.gridData.length; i++) {
            let updatedData = null

            for (let j = 0; j < updateVmsUuid.length; j++) {
              const uuid = updateVmsUuid[j]

              if (uuid === this.gridData[i].vmUuid) {
                updatedData = {
                  ...this.gridData[i].afterData,
                  ...afterMetaData,

                  metaInfo,
                  metaKeyArr: this.metaKeyArr, // 메타 데이터 키 목록

                  isUrgent,

                  ...((isSingle || (!isSingle && projectInfo !== undefined)) && {
                    projectInfo,
                    companyIdx: projectInfo?.company?.groupIdx,
                    companyName: projectInfo?.company?.groupName,
                    groupIdx: projectInfo?.group?.groupIdx,
                    groupName: projectInfo?.group?.groupName,
                    projectId: projectInfo?.project?.projectIdx,
                    projectName: projectInfo?.project?.projectName
                  }),

                  ...((isSingle || (!isSingle && selectImage !== undefined)) && {
                    selectImage,
                    imageId: selectImage?.userImageIdx,
                    guestOsId: selectImage?.guestOsId,
                    osName: selectImage?.osName,
                    osType: selectImage?.osType,
                    osBit: selectImage?.osBit
                  }),

                  ...((isSingle || (!isSingle && installProgramList?.length)) && {
                    installProgramList,
                    installPrograms: installProgramList ? installProgramList.map(install => `${install.name} ${install.version}`) : null
                  }),

                  ...((isSingle || (!isSingle && licenseList?.length)) && { licenseList }),

                  ...((isSingle || (!isSingle && networkList?.length && networkList.some(net => net.cateIdx))) && { networkList }),

                  ...((isSingle || (!isSingle && manageGroupIdx !== undefined)) && {
                    manageGroupIdx, // 운영그룹(idx)
                    manageGroupName // 운영그룹(이름)
                  }),

                  ...((isSingle || (!isSingle && chargeDate !== undefined)) && { chargeDate }),
                  ...((isSingle || (!isSingle && tagInfo?.length)) && { tagInfo })
                }

                break
              }
            }

            if (updatedData) {
              this.gridData[i].afterData = updatedData
              this.gridData[i] = {
                ...this.gridData[i],
                ...updatedData
              }
              allUpdatedData.push(this.gridData[i])
            }
          }
        } catch (error) { console.error(error) }
      }

      const message = this.updatingItems.length > 1
        ? this.$v('변경된 항목을 일괄 적용하시겠습니까?')
        : this.$v('수정사항을 적용하시겠습니까?')
      this.$confirm(message).then(async () => {
        console.log('🏵️ 적용 데이터: ', { ...afterCoreData, ...afterMetaData })
        await modifyVm()
        this.modal.editItem = false
        this.gridRefresh()

        if (this.updatingItems.length === 1 && !this.updatingItems[0].checked) { // 단일 업데이트
          this.$emit('updateSingleRow', allUpdatedData[0])
        } else this.$emit('checkedRowsData', allUpdatedData)
      }).catch(() => false)
    },
    /**
     * 업데이트 할 메타 정보를 세팅합니다.
     * 한 개 업데이트 시 -> 데이터를 수정할 수 있다.
     * 여러개 업데이트 시 -> 데이터를 추가만 할 수 있다. 없는 데이터(undefine, null, 빈배열 등등...)는 적용하지 않는다.
     */
    getMetaInfo (metaArr) {
      const isSingle = this.updatingItems.length === 1 // 한 개만 업데이트 중인지?

      const rowMetaInfo = {}

      metaArr.forEach(item => {
        const { viewData, data } = item
        if (isSingle || (!isSingle && viewData)) {
          rowMetaInfo[item.key] = { viewData, data } // 그리드 상에 보여주는 데이터랑 실 데이터랑 함께 세팅. **
          this.metaInfo[item.key] = data
        }
        this.metaKeyArr.push(item.key)
      })
      return rowMetaInfo
    },
    /*
    * 배열 순회하며 <br/>로 묶어서 리턴
     * @param {Array} list 순회 할 배역
     */
    ArrayjoinWithHtml (list, key) {
      const startNum = 0 // 첫번째 요소도 함께 노출되면 0, 빼고 노출되면 1
      if (startNum && list.length <= 1) return

      let revealText = ''

      for (let i = startNum; i < list.length; i++) {
        const unit = () => {
          if (i === startNum) return ''
          if (startNum) return (i % 2 ? ',<br>' : ', ')
          else return (i % 2 ? ', ' : ',<br>')
        }
        revealText += (unit() + (key ? list[i][key] : list[i]))
      }
      return revealText
    },
    /**
     * 네트워크 카테고리 모달 창 띄우기 전에 데이터 세팅
     * 'name' 이라는 중복 키를 사용하고 있어 왜!
     */
    openNetworkCateModal (row) {
      const clonedRowData = { ...row }
      this.updatingNetworkItem = row
      this.updatingNetworkItem.networkName = clonedRowData?.name // 네트워크 이름...
      this.updatingNetworkItem.name = clonedRowData?.cateKey || ''

      this.modal.networkCateModalView = true
    },
    /**
     * 네트워크 정보 > 개별 네트워크 카테고리 변경 이벤트
     * 'name' 이라는 중복 키를 사용하고 있어서... name 원복 후 제거
     */
    changeNetworkCate (data) {
      if (!data?.length) return
      const { cateIdx, cateKey } = data[0]
      this.updatingNetworkItem.cateIdx = cateIdx
      this.updatingNetworkItem.cateKey = cateKey

      this.updatingNetworkItem.name = this.updatingNetworkItem.networkName
      delete this.updatingNetworkItem.networkName

      const index = this.updatingNetworkItem.index
      this.afterCoreInfo.networkList[index] = this.updatingNetworkItem

      this.gridRefresh(this.networkGrid)
      this.updatingNetworkItem = null
    },
    /**
    * disabled row 설정 -> 타 최고관리자의 장바구니에 담겨있는 자원일 경우
    */
    onLoadedRows (grid) {
      this.$nextTick(function () {
        for (let i = 0; i < grid.rows.length; i++) {
          const row = grid.rows[i]
          const item = row.dataItem
          if (item.isSelectable === false) {
            item.disable = true
            row.cssClass = 'is-disable-row'
          } else {
            item.disable = false
            row.cssClass = ''
          }
        }
      })
    }
  },
  data (root) {
    return {
      grid: null,
      activePageNum: 1,
      totalResultCnt: 0,
      loading: {
        isSettingInitData: false
      },

      filteredHostName: '', // 필터링 > 호스트명

      checkedItems: [], // 체크한 vms
      checkedItemsId: [], // 체크한 vms
      updatingItems: [], // 업데이트 중인 아이템
      modal: {
        editItem: false, // vm 변경 모달 active Handler
        networkCateModalView: false // 네트워크 카테고리 설정 모달
      },

      afterCoreInfo: {}, // 업데이트 후 vm정보 (기본)
      metaInfo: {}, // 업데이트 후 vm정보 (메타)
      metaKeyArr: [],
      metaRequiredColumns: [], // 메타 정보 중 필수 컬럼

      columns: [],
      originColumns: [
        { binding: 'companyName', header: root.$v('관계사'), customHtml: true, required: root.editable, forCmp: true },
        { binding: 'groupName', header: root.$v('조직'), customHtml: true, required: root.editable, forCmp: true },
        { binding: 'projectName', header: root.$v('프로젝트'), customHtml: true, required: root.editable, isOverflowTooltip: true, forCmp: true },
        { binding: 'isUrgent', header: root.$v('분류'), width: 100, customHtml: true, forCmp: true },
        { binding: 'createDate', header: root.$v('자원 생성일'), width: 150 },
        { binding: 'hostname', header: root.$v('VM(Host)명'), align: 'left' },
        // { binding: 'powerState', header: root.$v('상태'), width: 100, customHtml: true },
        { binding: 'esxiName', header: 'ESXi', width: '*', customHtml: true },
        { binding: 'datastoreName', header: '데이터스토어 명' },
        { binding: 'vmTools', header: 'VM Tools 상태', customHtml: true, align: 'center' },
        { header: root.$v('이미지 명') + '(OS Bit)', binding: 'osName', width: 90, customHtml: true, required: root.editable, forCmp: true },
        { header: '네트워크', binding: 'networkList', customHtml: true, required: root.editable, width: 100 },

        { binding: 'specInfo', header: root.$v('기본사양'), customHtml: true, filtable: false, width: 250 },
        { binding: 'installProgramList', header: root.$v('설치프로그램'), customHtml: true, width: 100, forCmp: true },
        { binding: 'licenseList', header: root.$v('S/W 라이선스'), customHtml: true, width: 100, forCmp: true },
        { binding: 'manageGroup', header: root.$v('운영그룹'), customHtml: true, required: root.editable, forCmp: true },
        { binding: 'chargeDate', header: root.$v('과금 시작일'), customHtml: true, required: root.editable, forCmp: true },
        { binding: 'editing', header: ' ', customHtml: true, width: 100, sorting: false }
      ],
      networkInfoColumns: [
        { header: root.$v('이름'), binding: 'name', filtable: false },
        // { header: root.$v('유닛 넘버'), binding: 'unitNumber', filtable: false, width: 80 },
        { header: 'VLAN ID', binding: 'vlanId', filtable: false, width: 150 },
        // { header: root.$v('분산 스위치 명'), binding: 'distributedSwitchName', filtable: false },
        { header: 'IPv4', binding: 'guestNic.ipV4', filtable: false },
        { header: root.$v('네트워크 카테고리'), binding: 'cateKey', filtable: false, customHtml: true, required: root.editable, width: 200 }
      ],
      gridData: [],
      filteredData: [],
      metaFormData: [],
      columnDataMap: {
        vmTools: [
          { value: 'guestToolsRunning', caption: '실행 중' },
          { value: 'guestToolsNotRunning', caption: '실행 중 아님' },
          { value: null, caption: '해당 없음' }
        ],
        powerState: [
          { value: 'POWERED_ON', caption: 'ON' },
          { value: 'POWERED_OFF', caption: 'OFF' }
        ]
      },

      networkGrid: null,
      updatingNetworkItem: null // 업데이트 중인 네트워크

    }
  }
}
</script>

<style lang="scss" scoped>
.unregister-vmware-vm-list {
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
}

.change-common-form {
  overflow-y: auto;
  max-height: 65vh;
  &-contents:nth-child(2) {
    margin-top: $gap * 2;
  }
}
.network-update-noti { color: $input-placeholder; text-align: center; line-height: 100px; }
.after-data { color: $sea-blue; }
</style>
