<template>
  <div

    class="unregister-vsan-iscsi-list"
  >
    <section class="table-top-wrap">
      <total-count
        v-if="!editable"
        class="total-count-wrap"
        :total-count="totalResultCnt"
      >
        <search-component
          v-if="!editable"
          class="search-area"
          :placeholder="$v('별칭')"
          @search="val => {
            filteredAlias = val
            filtering()
          }"
        />
      </total-count>
      <div
        v-else
        class="flex-wrap basket-title-wrap"
      >
        <span class="sub-title">Storage (vSAN iSCSI)</span>
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
        class="unregister-resource-grid -vsan-iscsis"
        v-loading="gridData.length && !grid"
        :init-custom-action="flex => grid = flex"
        :custom-init-filter="filter => this.gridFilter = filter"
        :item-source="editable ? gridData : filteredGridData"
        :columns="columns"
        :init-auto-select-row="initAutoSelectRow"
        init-auto-select-row-key="vsanObjectUuid"
        :changing-page-reset="false"
        @checkedRowsData="setCheckedItems"
        @total-count="cnt => totalResultCnt = cnt"
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
          <span class="after-data">{{ row.isUrgent ? '긴급' : '일반' }}</span>
        </template>
        <!-- 분류 -->

        <template #networkCateInfo="{ row }">
          <span
            class="after-data"
            v-if="row.afterData && row.afterData.networkCateInfo"
          >{{ row.afterData.networkCateInfo.cateKey }}</span>
        </template>
        <!-- 네트워크 카테고리 -->

        <template #status="{ row }">
          <template v-if="row.status">
            <cmp-status-tag
              :type="{
                healthy: 'is-info'
              }[row.status] || 'is-undefined'"
              :line-style="true"
            >
              {{ {
                healthy: '정상'
              }[row.status] || '비정상' }}
            </cmp-status-tag>
          </template>
          <span v-else>-</span>
        </template>

        <template #lunList="{ row }">
          <el-tooltip
            effect="light"
            placement="top"
            :disabled="!row.lunCount"
          >
            총 <span>{{ row.lunCount || 0 }}개</span>
            <div
              v-if="row.lunList"
              slot="content"
            >
              <span
                v-for="lunItem in row.lunList"
                :key="lunItem.lunId"
              >
                ID: {{ lunItem.lunId }}
                ,&nbsp;{{ $v('용량') }}: {{ lunItem.lunSize | byte }}
              </span>
            </div>
          </el-tooltip>
        </template>
        <!-- LUN -->

        <template #authSpecAutoType="{ row }">
          {{ authTypes[row.authSpecAutoType] }}
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
    <!-- 자원 추가/변경 -->
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
          <vmware-iscsi-update-core-info-step
            :data.sync="afterCoreInfo"
            :user-info="user"
            :project-info="!isEmpty(afterCoreInfo) && afterCoreInfo.projectInfo ? afterCoreInfo.projectInfo : null"
            :title-width-px="200"
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
import { mapState, mapGetters } from 'vuex'
import { cloneDeep, isEmpty } from 'lodash'
import { VMwareIscsiUpdateCoreInfoStep } from '@sd-fe/cmp-core'
import { VSAN_ISCSI as requiredColumns } from '../UnregisterResourceRequiredColumns'

export default {
  name: 'UnregisterVsanIscsiList',
  components: {
    'vmware-iscsi-update-core-info-step': VMwareIscsiUpdateCoreInfoStep
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
      iscsiMetadataForm: state => state.metadata.VMWARE.VSAN_ISCSI
    }),
    ...mapGetters({
      getProject: 'project/getProject'
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
  methods: {
    isEmpty (val) { return isEmpty(val) },
    /**
     * 테이블에 뿌려지는 볼륨그룹 데이터 가공
     */
    async listInfoMapping (data) {
      if (!data) {
        this.gridData = []
        return
      }

      const list = data.map(iscsi => {
        const {
          authSpecAutoType,
          vsanHealth,
          vsanObjectUuid,
          createTime
        } = iscsi

        return {
          ...iscsi,
          createDate: this.$options.filters.dateSimple(createTime),

          authSpecAutoType: {
            NoAuth: 'NONE',
            CHAP_Mutual: 'MUTUAL_CHAP'
          }[authSpecAutoType] || authSpecAutoType,

          status: vsanHealth,

          service: 'VSAN_ISCSI',
          resourceIdx: iscsi.vsanObjectUuid,
          resourceName: iscsi.alias,
          chargeDate: iscsi.createTime, // 과금 시작일 > 자원 생성일로 세팅 (임시)

          checked: this.checkedItemsId.includes(vsanObjectUuid),

          requiredColumnArr: [...requiredColumns, ...this.metaRequiredColumns] // 필수 column 정보 목록
        }
      })
      this.gridData = list

      // this.gridData = [...list].sort((a, b) => b.createTime - a.createTime)

      if (!this.editable) this.filtering()
    },
    /**
     * 체크 된 항목 컨트롤
     */
    setCheckedItems (items) {
      this.checkedItems = [...items]
      this.checkedItemsId = items.map(item => item.vsanObjectUuid)

      this.$emit('checkedRowsData', this.checkedItems)
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
      const form = this.iscsiMetadataForm
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
     * 호스트명, VM 상태 필터링 이벤트
     */
    filtering () {
      if (!this.filteredAlias) this.filteredGridData = this.gridData
      else {
        this.filteredGridData = this.gridData.filter(item => {
          if (this.filteredAlias && item.alias?.toLowerCase().includes(this.filteredAlias?.toLowerCase())) { return item }
        })
      }
    },
    /**
     * row 삭제 시, 발생 이벤트
     */
    clickDelete (row) {
      if (!this.editable) return false

      this.$emit('delete-row', row)
    },
    /**
     * 그리드 컬럼 데이터 세팅
     */
    setColumns () {
      let result = cloneDeep(this.originColumns)
      if (this.editable) {
        const metaColumns = (this.iscsiMetadataForm || []).map(data => ({
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
    * 모달 닫기 전, 정말 취소하겠냐는 알람
    */
    beforeCloseModal (done) {
      this.$confirm(this.$v('내용을 저장하지 않고 취소하시겠습니까?'))
        .then(() => {
          done()
        }).catch(() => false)
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

      const updateItemsUuid = this.updatingItems.map(item => item.vsanObjectUuid)

      const allUpdatedData = []

      const modifyRow = () => {
        try {
          const {
            isUrgent,
            projectInfo,

            manageGroupIdx, // 운영그룹(idx)
            manageGroupName, // 운영그룹(이름)
            cluster, // 클러스터
            alias, // 별칭
            networkCateInfo, // 네트워크 카테고리 목록
            chargeDate, // 과금 시작일
            tagInfo
          } = afterCoreData

          for (let i = 0; i < this.gridData.length; i++) {
            let updatedData = null

            for (let j = 0; j < updateItemsUuid.length; j++) {
              const uuid = updateItemsUuid[j]

              if (uuid === this.gridData[i].vsanObjectUuid) {
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
                    projectIdx: projectInfo?.project?.projectIdx,
                    projectName: projectInfo?.project?.projectName
                  }),

                  ...((isSingle || (!isSingle && networkCateInfo !== undefined)) && {
                    networkCateInfo,
                    cateIdx: networkCateInfo?.cateIdx
                  }),

                  // 별칭
                  ...((isSingle || (!isSingle && alias)) && {
                    alias,
                    resourceName: alias
                  }),

                  // 클러스터
                  ...((isSingle || (!isSingle && cluster !== undefined)) && {
                    cluster,
                    connectName: cluster?.vcenterName,
                    connectIdx: cluster?.connectIdx,
                    clusterName: cluster?.clusterName,
                    clusterId: cluster?.clusterId
                  }),

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
    gridRefresh (grid = this.grid) {
      if (!grid) return
      const cv = grid?.collectionView
      if (cv) cv.refresh()
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

      cancelToken: null,
      totalResultCnt: 0,
      // isProgressVg: false, // 작업 중인 자원이 1개라도 있는지?
      checkedItems: [], // 체크 된 스토리지
      updatingItems: [], // 업데이트 중인 아이템
      checkedItemsId: [],

      afterCoreInfo: {}, // 업데이트 후 vm정보 (기본)
      metaInfo: {}, // 업데이트 후 vm정보 (메타)
      metaKeyArr: [],
      metaRequiredColumns: [], // 메타 정보 중 필수 컬럼

      modal: {
        editItem: false // 자원 변경 모달
      },

      loading: {
        detail: false,
        isGetHostRequest: false // 호스트 목록 조회
      },

      filteredAlias: '',

      gridData: [],
      filteredGridData: [],
      metaFormData: [],
      authTypes: {
        NONE: '없음',
        CHAP: 'CHAP',
        MUTUAL_CHAP: '상호 CHAP'
      },
      columns: [],
      originColumns: [
        { binding: 'companyName', header: root.$v('관계사'), customHtml: true, required: root.editable, forCmp: true },
        { binding: 'groupName', header: root.$v('조직'), customHtml: true, required: root.editable, forCmp: true },
        { binding: 'projectName', header: root.$v('프로젝트'), customHtml: true, required: root.editable, isOverflowTooltip: true, forCmp: true },
        { binding: 'isUrgent', header: root.$v('분류'), width: 80, customHtml: true, forCmp: true },
        { binding: 'createDate', header: root.$v('자원 생성일'), width: 150 },
        { binding: 'connectName', header: root.$v('vCenter 명'), customHtml: true, required: root.editable },
        { binding: 'clusterName', header: root.$v('클러스터 명'), customHtml: true, required: root.editable },
        { binding: 'iqn', header: 'IQN', align: 'left' },
        { binding: 'alias', header: root.$v('별칭'), align: 'left', customHtml: true, required: root.editable },
        { binding: 'status', header: root.$v('상태'), width: 80, customHtml: true },
        { binding: 'lunList', header: 'LUN', customHtml: true, width: 80 },
        { binding: 'networkInterface', header: root.$v('네트워크 장비') },
        { binding: 'networkCateInfo', header: root.$v('네트워크 카테고리'), customHtml: true, required: root.editable, forCmp: true },
        { binding: 'ioOwnerHost', header: root.$v('I/O 소유자 호스트') },
        { binding: 'port', header: root.$v('TCP 포트') },
        { binding: 'authSpecAutoType', header: root.$v('인증'), customHtml: true },
        { binding: 'manageGroup', header: root.$v('운영그룹'), customHtml: true, required: root.editable, forCmp: true },
        { binding: 'chargeDate', header: root.$v('과금 시작일'), customHtml: true, required: root.editable },
        { binding: 'editing', header: ' ', customHtml: true, width: 100, sorting: false }
      ],

      // 로딩
      isSettingInitData: false
    }
  }
}
</script>

<style lang="scss" scoped>
  .unregister-vsan-iscsi-list {
    .total-count-wrap {
      align-items: flex-start;
      flex-direction: column;
      .search-area { margin-top: $gap-s; }
    }
    .change-common-form {
      overflow-y: auto;
      max-height: 65vh;
      &-contents:last-child {
        margin-top: $gap * 2;
      }
    }
  }
  .after-data { color: $sea-blue; }
</style>
