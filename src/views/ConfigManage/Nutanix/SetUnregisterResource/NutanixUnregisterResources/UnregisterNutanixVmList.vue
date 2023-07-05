<!--
  * 파일명 : UnregisterNutanixVmList.vue
  * 파일 기능 : Nutanix > 구성관리 > 미등록 자원 관리 > Compute(VM)
  * 작성자 : 김예담
  * License By Shinsegae I&C
 -->

<template>
  <div class="unregister-nutanix-vm-list">
    <section class="table-top-wrap">
      <total-count
        v-if="!editable"
        class="total-count-wrap"
        :total-count="totalResultCnt"
      >
        <search-component
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
        class="unregister-resource-grid -compute"
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
        <!-- OS Version(Bits) -->

        <template #specInfo="{ row }">
          <p style="line-height: 1.6;">
            vCPU: {{ row.vcpu || 0 }}Core,&ensp;
            RAM: {{ row.memory || 0 }}GB,&ensp;
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

        <template #ips="{row}">
          <div v-if="row.ips && row.ips.length">
            <span
              v-if="row.ips.length > 1"
            >{{ row.ips[0] }} {{ $t('common.TERMS.other') }}
              <el-tooltip
                popper-class="panel-title-popper"
                effect="light"
              >
                <template #content>
                  <span v-html="ArrayjoinWithHtml(row.ips, '', 1)" />
                </template>
                <span>{{ row.ips.length - 1 }}</span>
              </el-tooltip>
            </span>

            <span v-else>{{ row.ips[0] }}</span>
          </div>
          <span
            class="after-data"
            v-else-if="row.afterData && row.afterData.networkIp"
          >{{
            row.afterData.networkIp.customIp.data
              ? row.afterData.networkIp.customIp.data
              : $v('자동 할당')
          }}</span>
          <span v-else>-</span>

          <small
            v-if="row.afterData && row.afterData.cateKey"
            style="white-space: nowrap;"
            class="after-data"
          >
            ({{ row.afterData.cateKey || '-' }})
          </small>
        </template>
        <!-- IP (네트워크 카테고리) -->

        <template #installProgramList="{ row }">
          <el-tooltip
            v-if="row.afterData
              && row.afterData.installProgramList
              && row.afterData.installProgramList.length"
            placement="top"
            effect="light"
          >
            <template #content>
              <span v-html="ArrayjoinWithHtml(row.afterData.installPrograms)" />
            </template>
            <span class="after-data">
              {{ row.afterData.installProgramList.length }}EA
            </span>
          </el-tooltip>
          <el-tooltip
            v-else-if="row.installProgramList && row.installProgramList.length"
            placement="bottom-end"
            popper-class="panel-title-popper"
            effect="light"
          >
            <template #content>
              <span v-html="ArrayjoinWithHtml(row.installPrograms)" />
            </template>
            <span> {{ row.installProgramList.length }}EA</span>
          </el-tooltip>
          <span v-else>0EA</span>
        </template>
        <!-- 설치 프로그램 -->

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
        <!-- S/W 라이선스 -->

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
    <!-- 자원 추가 -->
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
      <section
        class="change-common-form"
        v-if="modal.editItem"
      >
        <toggle-is-urgent-checkbox
          v-if="packageType !== 'PL'"
          v-model="afterCoreInfo.isUrgent"
          :action-name="$v('자원 등록')"
          style="margin-bottom: 20px;"
        />
        <div class="change-common-form-contents">
          <p class="sub-title">
            {{ $v('자원 기본 정보') }}
          </p>
          <nx-compute-core-info-step
            :data.sync="afterCoreInfo"
            :user-info="user"
            :project-info="!isEmpty(afterCoreInfo) && afterCoreInfo.projectInfo ? afterCoreInfo.projectInfo : null"
            in-admin
            is-unregistered
            editing
            @change-loading="flag => loading.isSettingInitData = flag"
          />
        </div>
        <div
          class="change-common-form-contents -meta"
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
          @click="updateResource()"
        >
          {{ $v('적용') }}
        </button>
      </section>
    </el-dialog>
  </div>
</template>

<script>
import {
  SetOSIcon,
  NXComputeUpdateCoreInfoStep,
  ToggleIsUrgentCheckbox
} from '@sd-fe/cmp-core'
import { uniq, cloneDeep, isEmpty } from 'lodash'
import { mapState, mapGetters } from 'vuex'
import { COMPUTE as requiredColumns } from '../UnregisterResourceRequiredColumns'

export default {
  name: 'UnregisterNutanixVmList',
  components: {
    'set-os-icon': SetOSIcon,
    'nx-compute-core-info-step': NXComputeUpdateCoreInfoStep,
    ToggleIsUrgentCheckbox
  },
  props: {
    data: {
      type: Array,
      default: () => []
    },
    editable: {
      type: Boolean,
      default: false
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
      computeMetadataForm: state => state.metadata.NUTANIX.COMPUTE
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
          nicIps,
          computeName,
          vmName,
          numVcpus,
          vcpu,
          socket,
          memoryCapacityInBytes,
          memory,
          disks,
          rootDiskSize: originRootDiskSize,
          installProgramList,
          vmUuid,
          createTime
        } = vm

        // ip 정보
        let ips = []
        if (nicIps?.length) {
          const allIps = nicIps.map(ip => { return ip.ipAddress || ip.nicIp })
          ips = uniq(allIps)
        }

        const externalDisks = disks?.map(disk => ({
          ...disk,
          sizeGb: this.$options.filters.byteToGb(disk?.vmDiskSize || 0)
        }))
        // **루트 디스크 => SCSI 0
        const rootDisk = externalDisks?.find(disk => (disk.deviceIndex === 0 || disk.diskIndex === 0) && disk.deviceBus === 'SCSI')
        const rootDiskSize = rootDisk?.sizeGb || originRootDiskSize || 0

        const externalDiskList = externalDisks?.filter(disk =>
          !((disk.deviceIndex === 0 || disk.diskIndex === 0) && disk.deviceBus === 'SCSI') &&
        disk.deviceType !== 'CDROM' &&
        disk.deviceBus !== 'IDE')
        // 루트 디스크를 포함하지 않은 디스크

        const row = Object.assign({
          ...vm,
          ips,
          hostname: vmName || computeName,
          vcpu: numVcpus || (vcpu * (socket || 1)),
          memory: this.$options.filters.byteToGb(memoryCapacityInBytes) || memory, // Memory
          rootDiskSize,
          externalDiskList,

          externalDiskTotalSize: externalDiskList?.length
            ? externalDiskList.reduce((a, b) => a + b.sizeGb, 0)
            : 0,
          externalDiskTotalCount: externalDiskList?.length || 0,
          installPrograms: installProgramList ? installProgramList.map(install => `${install.softwareName} ${install.versionName}`) : null,

          service: 'COMPUTE',
          resourceIdx: vmUuid,
          resourceName: vmName || computeName,
          checked: this.checkedItemsId.includes(vmUuid),
          createDate: this.$options.filters.dateSimple(createTime),
          chargeDate: createTime, // 과금 시작일 > 자원 생성일로 세팅 (임시)

          requiredColumnArr: [...requiredColumns, ...this.metaRequiredColumns] // 필수 column 정보 목록
        }, {})

        return row
      })
      list.sort((a, b) => b.createTime - a.createTime)
      this.gridData = list
      if (!this.editable) this.filtering()
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
    },
    /**
     * 호스트 명 필터링 이벤트
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
    openUpdateModal (data = this.checkedItems) {
      this.updatingItems = [...data]

      if (data.length === 1) {
        this.afterCoreInfo = { ...data[0] }
        this.settingItemMetaData(data[0])
      } else {
        this.afterCoreInfo = {}
        this.settingItemMetaData()
      }

      this.modal.editItem = true
    },
    /**
     * 메타 정보 (자원 운영 정보) 세팅
     */
    settingItemMetaData (vm) {
      const form = this.computeMetadataForm
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
        result += (disk.diskName ? disk.diskName : `${disk.deviceBus}.${disk.deviceIndex}`) + ' , ' + (disk.sizeGb || 0) + ' GB \n'
      }
      return result
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
    /**
     * 그리드 컬럼 데이터 세팅
     */
    setColumns () {
      let result = cloneDeep(this.originColumns)
      if (this.editable) {
        const metaColumns = (this.computeMetadataForm || []).map(data => ({
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

      console.log('after Core ===> ', this.afterCoreInfo)
      console.log('after Meta ==> ', afterMetaData)

      const metaInfo = !isEmpty(this.metaInfo) ? JSON.stringify(this.metaInfo) : ''

      const updateItemsUuid = this.updatingItems.map(item => item.vmUuid)

      const allUpdatedData = []

      const modifyRow = () => {
        try {
          const {
            isUrgent,
            projectInfo,

            installProgramList, // 설치프로그램 목록
            licenseList, // S/W 라이선스 목록
            manageGroupIdx, // 운영그룹(idx)
            manageGroupName, // 운영그룹(이름)
            networkList, // 네트워크 카테고리
            selectImage, // 이미지
            networkIp,

            chargeDate, // 과금 시작일
            tagInfo
            // ...rest
          } = afterCoreData

          for (let i = 0; i < this.gridData.length; i++) {
            let updatedData = null

            for (let j = 0; j < updateItemsUuid.length; j++) {
              const uuid = updateItemsUuid[j]

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
                    projectIdx: projectInfo?.project?.projectIdx,
                    projectName: projectInfo?.project?.projectName
                  }),

                  ...((isSingle || (!isSingle && installProgramList?.length)) && {
                    installProgramList,
                    installPrograms: installProgramList ? installProgramList.map(install => `${install.softwareName} ${install.versionName}`) : null
                  }),

                  ...((isSingle || (!isSingle && licenseList?.length)) && { licenseList }),

                  ...((isSingle || (!isSingle && manageGroupIdx !== undefined)) && {
                    manageGroupIdx, // 운영그룹(idx)
                    manageGroupName // 운영그룹(이름)
                  }),

                  ...((isSingle || (!isSingle && networkList !== undefined)) && {
                    networkList,
                    cateIdx: networkList?.length ? networkList[0].cateIdx : undefined
                  }),

                  // 할당 IP 없을 때 필수
                  ...((isSingle || (!isSingle && networkIp !== undefined)) && {
                    networkIp
                  }),

                  ...((isSingle || (!isSingle && selectImage !== undefined)) && {
                    selectImage,
                    imageId: selectImage?.userImageIdx,
                    osName: selectImage?.osName,
                    osType: selectImage?.osType,
                    osBit: selectImage?.osBit,
                    osVersion: selectImage?.osVersion,
                    osSystem: selectImage?.osSystem
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
        // console.log('🔮적용 데이터: ', { ...afterCoreData, ...afterMetaData })
        await modifyRow()
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
     * @param {Number} startNum // 첫번째 요소도 함께 노출되면 0, 빼고 노출되면 1
     */
    ArrayjoinWithHtml (list, key, startNum = 0) {
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

      totalResultCnt: 0,
      loading: {
        isSettingInitData: false
      },

      filteredHostName: '', // 필터링 > 호스트명

      checkedItems: [], // 체크한 vms
      checkedItemsId: [], // 체크한 vms
      updatingItems: [], // 업데이트 중인 아이템

      modal: {
        editItem: false // vm 변경 모달 active Handler
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
        { binding: 'isUrgent', header: root.$v('긴급 처리 여부'), width: 100, customHtml: true, forCmp: true },

        { binding: 'createDate', header: root.$v('자원 생성일'), width: 150 },
        { binding: 'hostname', header: root.$v('VM(Host)명'), align: 'left' },
        { binding: 'ips', header: 'VM(Host)IP', width: '*', customHtml: true }, // 네트워크 카테고리 정보도 포함 필요
        { header: root.$v('이미지 명') + '(OS Bit)', binding: 'osName', width: 130, customHtml: true, required: root.editable, forCmp: true },
        { binding: 'specInfo', header: root.$v('기본사양'), customHtml: true, filtable: false },
        { binding: 'installProgramList', header: root.$v('설치프로그램'), customHtml: true, forCmp: true },
        { binding: 'licenseList', header: root.$v('S/W 라이선스'), customHtml: true, forCmp: true },
        { binding: 'manageGroup', header: root.$v('운영그룹'), customHtml: true, required: root.editable, forCmp: true },
        { binding: 'chargeDate', header: root.$v('과금 시작일'), required: root.editable, customHtml: true, forCmp: true },
        { binding: 'editing', header: ' ', customHtml: true, width: 100, sorting: false }
      ],
      gridData: [],
      filteredData: [],
      metaFormData: [],
      selectedProjectInfo: null,
      columnDataMap: {
        isUrgent: [
          { value: true, caption: '긴급' },
          { value: false, caption: '일반' }
        ]
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.unregister-nutanix-vm-list {
  .total-count-wrap {
    align-items: flex-start;
    flex-direction: column;
    .search-area { margin-top: $gap-s; }
  }
}

.change-common-form {
  overflow-y: auto;
  max-height: 65vh;
  &-contents.-meta {
    margin-top: $gap * 2;
  }
}
.after-data { color: $sea-blue; }
</style>
