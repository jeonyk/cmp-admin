<!--
  * 파일명 : UnregisterNutanixShareList.vue
  * 파일 기능 : Nutanix > 구성관리 > 미등록 자원 관리 > Storage
  * 작성자 : 김예담
  * License By Shinsegae I&C
 -->

<template>
  <div class="unregister-nutanix-share-list">
    <section class="table-top-wrap">
      <total-count
        v-if="!editable"
        class="total-count-wrap"
        :total-count="totalResultCnt"
      >
        <search-component
          v-if="!editable"
          class="search-area"
          :placeholder="$v('Share 이름')"
          @search="val => {
            filteredShareName = val
            filtering()
          }"
        />
      </total-count>
      <div
        v-else
        class="flex-wrap basket-title-wrap"
      >
        <span class="sub-title">NAS (Files)</span>
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
        class="unregister-resource-grid -file-server"
        v-loading="gridData.length && !grid"
        :item-source="editable ? gridData : filteredData"
        :columns="columns"
        :column-data-map="columnDataMap"
        :init-auto-select-row="initAutoSelectRow"
        :init-custom-action="flex => grid = flex"
        :custom-init-filter="filter => this.gridFilter = filter"
        init-auto-select-row-key="shareUuid"
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

        <template #protocolType="{ row }">
          {{ row.protocolType === 'SMB' ? 'SMB' : 'NFS' }}
        </template>
        <!-- protocolType -->
        <template #shareConnection="{ row }">
          {{ row.shareConnection || 0 }}
        </template>
        <!-- shareConnection -->
        <template #shareUsedSpaceByte="props">
          <span>{{ props.row.shareUsedSpaceByte | onlyGB }}</span>
        </template>
        <!-- 현재 사용량 -->
        <template #maxSizeGiB="props">
          <span>{{ props.row.maxSizeGiB + ' GB' }}</span>
        </template>
        <!-- 최대 용량 -->

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
      v-loading="isSettingInitData"
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
        <div class="change-common-form-contents">
          <p class="sub-title">
            {{ $v('자원 기본 정보') }}
          </p>
          <nx-share-core-info-step
            :data.sync="afterCoreInfo"
            :user-info="user"
            :project-info="!isEmpty(afterCoreInfo) && afterCoreInfo.projectInfo ? afterCoreInfo.projectInfo : null"
            in-admin
            is-unregistered
            editing
            @change-loading="flag => isSettingInitData = flag"
          />
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
  joinExternalDiskList,
  NXShareUpdateCoreInfoStep
} from '@sd-fe/cmp-core'
import { cloneDeep, isEmpty } from 'lodash'
import { mapState } from 'vuex'
import { FILE_SERVER as requiredColumns } from '../UnregisterResourceRequiredColumns'

export default {
  name: 'UnregisterNutanixShareList',
  components: {
    'nx-share-core-info-step': NXShareUpdateCoreInfoStep
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
      metadataForm: state => state.metadata.NUTANIX.FILE_SERVER
    })
  },
  watch: {
    data: {
      immediate: true,
      async handler () {
        this.setColumns()
        await this.listInfoMapping(this.data)
      }
    }
  },
  async created () {
    this.filteredData = [...this.gridData]
  },
  methods: {
    isEmpty (val) { return isEmpty(val) },
    async listInfoMapping (data) {
      if (!data) {
        this.gridData = []
        return
      }

      const list = data.map(nas => {
        const {
          shareUuid,
          shareName,
          createTime
        } = nas

        const row = Object.assign({
          ...nas,

          service: 'FILE_SERVER',
          resourceIdx: shareUuid,
          resourceName: shareName,
          checked: this.checkedItemsId.includes(shareUuid),
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
      this.checkedItemsId = items.map(item => item.shareUuid)

      this.$emit('checkedRowsData', this.checkedItems)
    },
    /**
     * 호스트명, VM 상태 필터링 이벤트
     */
    filtering () {
      if (this.editable) return

      if (
        !this.filteredShareName
      ) this.filteredData = this.gridData
      else {
        this.filteredData = this.gridData.filter(item => {
          let result = true

          if (this.filteredShareName) result = result && (item.hostname?.toLowerCase().includes(this.filteredShareName?.toLowerCase()))
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
    settingItemMetaData (vm) {
      const form = this.metadataForm
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
    async setDetailData (vm) {
      if (!vm) return
      const {
        userInfo,
        diskList,
        scsiControllerList,
        installProgramList
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

      // 설치프로그램 ['이름 버전', ...]
      const installPrograms = installProgramList.map(install => `${install.name} ${install.version}`)

      const settingData = {
        ...vm,
        externalDiskList: disks,
        externalDiskTotalSize: disks?.length
          ? disks.reduce((a, b) => a + b.size, 0)
          : 0,
        externalDiskTotalCount: disks?.length || 0,
        rootDiskSize,
        installPrograms,
        projectIdx: userInfo.projectIdx,

        chargeDate: userInfo?.chargeDate,

        // metaInfo에 함께 보낸 데이터
        // 자원 명, 서비스 개시일, 자원 태그, 압무 명, 긴급 여부
        isUrgent: userInfo?.isUrgent
        // tags: meta?.tags
      }

      return settingData
    },

    gridRefresh (grid = this.grid) {
      if (!grid) return
      const cv = grid.collectionView
      if (!cv) return
      cv.refresh()
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
        const metaColumns = (this.metadataForm || []).map(data => ({
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

      const updateItemsUuid = this.updatingItems.map(item => item.shareUuid)

      const allUpdatedData = []

      const modifyRow = () => {
        try {
          const {
            isUrgent,
            projectInfo,
            networkList,

            chargeDate,
            tagInfo
          } = afterCoreData

          for (let i = 0; i < this.gridData.length; i++) {
            let updatedData = null

            for (let j = 0; j < updateItemsUuid.length; j++) {
              const uuid = updateItemsUuid[j]

              if (uuid === this.gridData[i].shareUuid) {
                updatedData = {
                  ...this.gridData[i].afterData,
                  ...afterMetaData,

                  metaInfo,
                  metaKeyArr: this.metaKeyArr, // 메타 데이터 키 목록

                  isUrgent: !!isUrgent,

                  ...((isSingle || (!isSingle && networkList?.length)) && {
                    networkList,
                    cateKey: networkList?.length ? networkList[0].cateKey : undefined,
                    cateId: networkList?.length ? networkList[0].cateIdx : undefined
                  }),

                  ...((isSingle || (!isSingle && projectInfo !== undefined)) && {
                    projectInfo,
                    companyIdx: projectInfo?.company?.groupIdx,
                    companyName: projectInfo?.company?.groupName,
                    groupIdx: projectInfo?.group?.groupIdx,
                    groupName: projectInfo?.group?.groupName,
                    projectIdx: projectInfo?.project?.projectIdx,
                    projectName: projectInfo?.project?.projectName
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
        console.log('🔮적용 데이터: ', { ...afterCoreData, ...afterMetaData })
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
     */
    ArrayjoinWithHtml (list, key) {
      const startNum = 1 // 첫번째 요소도 함께 노출되면 0, 빼고 노출되면 1
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

      filteredShareName: '', // 필터링 > 호스트명

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
        { binding: 'companyName', header: root.$v('관계사'), customHtml: true, required: true, forCmp: true },
        { binding: 'groupName', header: root.$v('조직'), customHtml: true, required: true, forCmp: true },
        { binding: 'projectName', header: root.$v('프로젝트'), customHtml: true, required: true, isOverflowTooltip: true, forCmp: true },
        { binding: 'isUrgent', header: root.$v('분류'), width: 100, customHtml: true, forCmp: true },
        { binding: 'createDate', header: root.$v('자원 생성일'), width: 150 },
        { binding: 'shareName', header: root.$v('Share 이름'), align: 'left' },
        { binding: 'cateKey', header: root.$v('네트워크 카테고리'), customHtml: true, required: true, forCmp: true },
        { binding: 'fileServerName', header: root.$v('연결된 파일 서버'), customHtml: true },
        { binding: 'protocolType', header: root.$v('프로토콜 타입'), customHtml: true },
        { binding: 'mountPath', header: root.$v('마운트 경로'), customHtml: true },
        // { binding: 'shareConnection', header: root.$v('연결된 VM 개수'), customHtml: true },
        { binding: 'shareUsedSpaceByte', header: root.$v('현재 사용량'), customHtml: true },
        { binding: 'maxSizeGiB', header: root.$v('최대 용량'), customHtml: true },
        { binding: 'chargeDate', header: root.$v('과금 시작일'), customHtml: true, required: true, forCmp: true },
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
      },

      // 로딩
      isSettingInitData: false
    }
  }
}
</script>

<style lang="scss" scoped>
.unregister-nutanix-share-list {
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
.after-data { color: $sea-blue; }
</style>
