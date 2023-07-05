<!--
  * 파일명 : UnregisterNetworkSecurityList.vue
  * 파일 기능 : 자원 운용 > Network(L4, L7) 자원 정보 (readOnly) 데이터를 보여주기만 할 뿐, 조작 하진 않습니다.
  * 작성자 : 김예담
  * 최종 작성일 : 2021-10-21
  * License By Shinsegae I&C
 -->

<template>
  <div class="unregister-network-security-list">
    <section class="table-top-wrap">
      <total-count
        v-if="!editable"
        class="total-count-wrap"
        :total-count="totalResultCnt"
      >
        <search-component
          class="search-area"
          :placeholder="$v('정책 명')"
          @search="val => {
            filteredResourceName = val
            filtering()
          }"
        />
      </total-count>
      <div
        v-else
        class="flex-wrap basket-title-wrap"
      >
        <span class="sub-title">보안그룹</span>
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

    <div class="table-area">
      <!-- editable = true(등록 장바구니)에서는 임시 보안그룹 목록, editable = false(미등록 목록)에서는 미등록 방화벽 정책 목록 -->
      <cmp-grid
        class="unregister-resource-grid -security"
        v-loading="gridData.length && !grid"
        :item-source="editable ? gridData : filteredData"
        :columns="columns"
        :column-data-map="columnDataMap"
        :init-auto-select-row="initAutoSelectRow"
        :init-custom-action="flex => grid = flex"
        :changing-page-reset="false"
        :selectable="false"
        @total-count="cnt => totalResultCnt = cnt"
        @checkedRowsData="setCheckedItems"
        @loaded-rows="onLoadedRows"
        :init-auto-select-row-key="editable ? 'resourceIdx': 'policyIdx'"
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

        <template #securityGroupName="{ row }">
          <span
            v-if="row.securityGroupName"
            class="after-data"
          >{{ row.securityGroupName }}</span>
          <span
            v-else
            class="temp-data"
          >{{ row.tempSecurityGroupName }}</span>
        </template>
        <!-- 보안그룹 명 -->

        <template #createTime="props">
          {{ props.row.createTime | dateSimple }}
        </template>
        <!-- 생성일 -->

        <template #networkCateInfo="{ row }">
          <span
            class="after-data"
            v-if="row.afterData && row.afterData.networkCateInfo"
          >{{ row.afterData.networkCateInfo.cateKey }}</span>
        </template>
        <!-- 네트워크 카테고리 -->

        <template #policyList="{ row }">
          <el-popover
            v-if="row.policyList && row.policyList.length"
            placement="top"
            width="300"
            trigger="hover"
            popper-class="-scroll"
          >
            <span slot="reference">{{ row.policyList.length }}EA</span>
            <template>
              <cmp-grid
                class="popover-policy-grid"
                :item-source="row.policyList"
                :columns="policySimpleColumns"
              />
            </template>
          </el-popover>

          <span v-else>-</span>
        </template>
        <!-- 정책 -->

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
    </div>

    <!-- 모달 -->
    <!-- 자원 추가/변경 -->
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
        <div class="change-common-form-contents">
          <p class="sub-title">
            {{ $v('자원 기본 정보') }}
          </p>
          <unregister-network-security-update-simple-form
            :data.sync="afterCoreInfo"
            :user-info="user"
            :project-info="!isEmpty(afterCoreInfo) && afterCoreInfo.projectInfo ? afterCoreInfo.projectInfo : null"
            @change-loading="flag => loading.isSettingInitData = flag"
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
import { SECURITY as requiredColumns } from '../UnregisterResourceRequiredColumns'
import UnregisterNetworkSecurityUpdateSimpleForm from './UnregisterNetworkSecurityUpdateSimpleForm.vue'

export default {
  name: 'UnregisterNetworkSecurityList',
  components: { UnregisterNetworkSecurityUpdateSimpleForm },
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
      securityMetaForm: state => state.metadata.NETWORK.SECURITY
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
        if (this.editable) await this.initSgGroupSetting(this.data)
        else {
          this.gridData = this.data
          this.filtering()
        }
      }
    }
  },
  async created () {
    this.filteredData = [...this.gridData]
  },
  methods: {
    isEmpty (val) { return isEmpty(val) },

    async initSgGroupSetting (data) {
      if (!data) {
        this.gridData = []
        return
      }

      const list = data.map(row => {
        const {
          resourceIdx,
          securityGroupName,
          tempSecurityGroupName,
          createTime
        } = row

        const item = Object.assign({
          ...row,
          service: 'SECURITY',
          resourceIdx,
          resourceName: securityGroupName || tempSecurityGroupName,
          checked: this.checkedItemsId.includes(resourceIdx),

          createTime: createTime ? this.$options.filters.date(createTime) : null,
          chargeDate: createTime, // 과금 시작일 > 자원 생성일로 세팅 (임시)

          requiredColumnArr: [...requiredColumns, ...this.metaRequiredColumns] // 필수 column 정보 목록
        }, {})

        return item
      })
      // list.sort((a, b) => b.createTime - a.createTime)
      this.gridData = list
    },
    /**
     * 체크 된 항목 컨트롤
     */
    setCheckedItems (items) {
      this.checkedItems = [...items]
      this.checkedItemsId = items.map(item => item.resourceIdx)

      this.$emit('checkedRowsData', this.checkedItems)
    },
    /**
     * 로드밸런스 명 필터링 이벤트
     */
    filtering () {
      if (this.editable) return

      if (
        !this.filteredResourceName
      ) this.filteredData = this.gridData
      else {
        this.filteredData = this.gridData.filter(item => {
          let result = true

          if (this.filteredResourceName) result = result && (item.resourceName?.toLowerCase().includes(this.filteredResourceName?.toLowerCase()))
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
      const metaForm = this.securityMetaForm
      const metaInfo = vm?.metaInfo ? JSON.parse(vm.metaInfo) : null

      this.metaFormData = metaInfo
        ? metaForm?.map(meta => {
          const data = metaInfo[meta.key]
          return {
            ...meta,
            data: data || meta.data
          }
        })
        : cloneDeep(metaForm || [])
    },
    /**
     * 그리드 컬럼 데이터 세팅
     * editable = true(등록 장바구니)에서는 임시 보안그룹 목록
     * editable = false(미등록 목록)에서는 미등록 방화벽 정책 목록
     */
    setColumns () {
      let result = cloneDeep(this.securityColumns)

      const metaForm = this.securityMetaForm

      if (this.editable) {
        const metaColumns = (metaForm || []).map(data => ({
          binding: data.key,
          header: data.title,
          required: data.required,
          customHtml: true,
          forCmp: true,
          isMeta: true
        }))

        result.splice(-1, 0, ...metaColumns)

        this.metaRequiredColumns = metaColumns.filter(col => col.required) // 메타데이터 중 필수인 컬럼 정보만 담기 (필수 값 validation 위함)
      } else result = [...this.policyColumns]

      this.columns = result
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

            securityGroupName,

            networkCateInfo, // 네트워크 카테고리
            comment, // 설명

            chargeDate, // 과금 시작일
            tagInfo
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

                  // 프로젝트 정보
                  ...((isSingle || (!isSingle && projectInfo !== undefined)) && {
                    projectInfo,
                    companyIdx: projectInfo?.company?.groupIdx,
                    companyName: projectInfo?.company?.groupName,
                    groupIdx: projectInfo?.group?.groupIdx,
                    groupName: projectInfo?.group?.groupName,
                    projectIdx: projectInfo?.project?.projectIdx,
                    projectName: projectInfo?.project?.projectName
                  }),

                  // 네트워크 카테고리
                  ...((isSingle || (!isSingle && networkCateInfo !== undefined)) && {
                    networkCateInfo,
                    ipCategoryIdx: networkCateInfo?.cateIdx,
                    cateKey: networkCateInfo?.cateKey
                  }),

                  // 설명
                  ...((isSingle || (!isSingle && !!comment)) && { comment }),

                  // 보안그룹 명
                  ...((isSingle || (!isSingle && !!securityGroupName)) && {
                    securityGroupName,
                    resourceName: securityGroupName
                  }),

                  // 과금시작일
                  ...((isSingle || (!isSingle && chargeDate !== undefined)) && { chargeDate }),

                  // 태그 정보
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
    },
    arrayJoinToString (arr) {
      if (arr.length <= 1) return
      let s = ''
      for (let i = 1; i < arr.length; i++) {
        s += arr[i] + '<br>'
      }
      return s
    }
  },
  data (root) {
    return {
      grid: null,

      totalResultCnt: 0,
      loading: {
        isSettingInitData: false
      },

      filteredResourceName: '', // 필터링 > 정책 명

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
      policySimpleColumns: [
        { header: root.$v('정책 명'), binding: 'policyName', filtable: false, width: 100 },
        { header: 'VDOM', binding: 'vdomId', filtable: false, width: 100 },
        { header: root.$v('출발지'), binding: 'srcAddress', filtable: false, width: 150 },
        { header: root.$v('목적지'), binding: 'dstAddress', filtable: false, width: 150 }
      ],
      policyColumns: [
        { header: root.$v('정책 명'), binding: 'policyName' },
        { header: 'VDOM', binding: 'vdomId' },
        { header: root.$v('출발지'), binding: 'srcAddress' },
        { header: root.$v('목적지'), binding: 'dstAddress' },
        { header: root.$v('설명'), binding: 'comment', width: 600 }
      ],
      securityColumns: [
        { binding: 'companyName', header: root.$v('관계사'), customHtml: true, required: root.editable, forCmp: true },
        { binding: 'groupName', header: root.$v('조직'), customHtml: true, required: root.editable, forCmp: true },
        { binding: 'projectName', header: root.$v('프로젝트'), customHtml: true, required: root.editable, isOverflowTooltip: true, forCmp: true },
        { binding: 'isUrgent', header: root.$v('분류'), width: 100, customHtml: true, forCmp: true },
        { header: root.$v('네트워크 카테고리'), binding: 'networkCateInfo', required: root.editable, customHtml: true },
        // { binding: 'createTime', header: root.$v('자원 생성일') },
        { header: root.$v('보안그룹 명'), binding: 'securityGroupName', customHtml: true },
        { header: root.$v('정책'), binding: 'policyList', customHtml: true },
        { header: root.$v('과금 시작일'), binding: 'chargeDate', required: root.editable, customHtml: true },
        // { header: root.$v('정책 만료일'), binding: 'endTime' },
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
  .unregister-network-switch-list {
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
  .temp-data { color: $input-placeholder; }

  // 정책 툴팁 내 그리드
  .popover-policy-grid::v-deep {
    .wj-cells {
      .wj-cell {
        border-bottom: 1px solid $section-stroke;
        color: $color-ticket;
      }
    }
  }
</style>
