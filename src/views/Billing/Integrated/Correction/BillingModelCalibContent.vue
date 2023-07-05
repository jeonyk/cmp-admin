<!--
  * 파일명 : BillingModelCalibContent.vue
  * 파일 기능 : [빌링 > 서버별 보정 모델] 모든 리스트를 보여줍니다.
  * 작성자 : 이유준
  * 최종 작성일 : 2022-06-20
  * License By Shinsegae I&C
  * 2022-06-20 add: 서버보정 모델 마크업
 -->
<template>
  <div
    v-loading="loading.group"
    class="billing-model-calibration"
  >
    <section
      class="billing-model-calib-body"
      :class="{ batch: fromBatch }"
    >
      <!-- 좌측 패널 -->
      <billing-model-calib-company-select-board
        v-if="!fromBatch"
        :model-type="type"
        :route-title="routeTitle"
        :from-select-modal="fromSelectModal"
        class="body-panel -left"
        @click-create-calib-model="handleEmitClickCreateCalibModel"
        @change-selected-model="handleEmitChangeSelectedModel"
        @delete-model-group="model => $emit('delete-model-group', model)"
        :model-list="modelList"
      />

      <!-- 우측 패널 -->
      <dashboard-panel
        v-if="modelList.length !== 0"
        class="body-panel -right"
        :class="{ batch: fromBatch }"
        :title="routeTitle"
        :padding-top="0"
      >
        <template #header>
          <!-- <button
            v-if="!fromSelectModal"
            class="button"
          >
            {{ $t("common.BTN.excelDownload") }}
            <i class="download-icon" />
          </button> -->
          <excel-download
            force-center
            skip-first-row
            :wijmo-grid="contentGrid"
            :columns="gridColumns"
            :skip-columns="['option']"
            @set-now-exporting="onSetNowExporting"
            @first-row="setFirstRow"
          />
        </template>

        <template #empty>
          {{ $t('bill.selectCorrModel') }}
        </template>
        <billing-correction-summary
          v-if="modelDetailData"
          :select-model="modelDetailData"
        />
        <div
          v-if="type === 'server'"
          style="margin-top: 40px;"
        >
          <filtering-component :use-title="false">
            <div class="filter-between">
              <div class="filter-form">
                <span class="filter-name">{{ $v('관계사') }}</span>
                <searchable-select
                  v-model="filterOption.company"
                  :options="groupOptions"
                  unique-key="value"
                  :placeholder="$v('관계사 선택')"
                />
              </div>
              <div class="filter-items">
                <div
                  class="filter-form"
                  style="display: inline-block;"
                >
                  <el-select
                    v-model="filterOption.searchCate"
                    :placeholder="$v('검색 선택')"
                  >
                    <el-option
                      v-for="option in searchOptions"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </el-select>
                </div>
                <div
                  class="filter-form"
                  style="display: inline-block;"
                >
                  <search-component
                    v-model="filterOption.search"
                    :placeholder="$v('검색어 입력')"
                    @reset="refreshFilter"
                  />
                </div>
              </div>
            </div>
          </filtering-component>
          <!-- 보정 모델 그리드 -->
          <billing-model-calib-grid
            key="server"
            :grid-category="type"
            @initColumns="handleEmitInitColumns"
            :grid-data="filteredGridData"
            :code-map="codeMap"
            @init-grid="onInitGrid"
          />
        </div>
        <div
          v-else
          style="margin-top: 40px;"
        >
          <filtering-component :use-title="false">
            <div class="filter-between">
              <div class="filter-form">
                <span class="filter-name">{{ $v('관계사') }}</span>
                <searchable-select
                  v-model="filterOption.company"
                  :options="groupOptions"
                  unique-key="value"
                  :placeholder="$v('관계사 선택')"
                />
              </div>
              <div class="filter-items">
                <div
                  class="filter-form"
                  style="display: inline-block;"
                >
                  <el-select
                    v-model="filterOption.searchCate"
                    :placeholder="$v('검색 선택')"
                  >
                    <el-option
                      v-for="option in searchOptions"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </el-select>
                </div>
                <div
                  class="filter-form"
                  style="display: inline-block;"
                >
                  <search-component
                    v-model="filterOption.search"
                    :placeholder="$v('검색어 입력')"
                    @reset="refreshFilter"
                  />
                </div>
              </div>
            </div>
          </filtering-component>
          <!-- 보정 모델 그리드 -->
          <billing-model-calib-grid
            key="group"
            v-if="codeMap"
            :grid-category="type"
            @init-grid="onInitGrid"
            @initColumns="handleEmitInitColumns"
            :grid-data="filteredGridData"
            :code-map="codeMap"
          />
        </div>
      </dashboard-panel>
      <div
        v-else
        class="model-grid__is-empty"
        :class="{ batch: fromBatch }"
      >
        <span class="model-grid-text">{{ type === 'server' ? $v('서버별 보정 모델이 없습니다.') : $v('관계사별 보정 모델이 없습니다.') }}</span>
      </div>
    </section>
  </div>
</template>
<script>
import API, { DashboardPanel, FilteringComponent, ExcelDownload } from '@sd-fe/cmp-core'
import BillingCorrectionSummary from './BillingCorrectionSummary.vue'
import BillingModelCalibGrid from './BillingModelCalibGrid.vue'
import BillingModelCalibCompanySelectBoard from './Group/BillingModelCalibCompanySelectBoard.vue'
import Fuse from 'fuse.js'
import * as wjGrid from '@grapecity/wijmo.grid'
import * as wjcXlsx from '@grapecity/wijmo.xlsx'
import dayjs from 'dayjs'

export default {
  name: 'BillingModelCalibContent',
  props: {
    routeTitle: {
      type: String,
      default: '보정 모델'
    },
    modelList: { // 부모컴포넌트에서 서버 또는 관계사별 보정 모델의 리스트를 가져옵니다.
      type: Array,
      default () {
        return []
      }
    },
    type: {
      type: String,
      default: 'server'
    },
    fromSelectModal: {
      type: Boolean,
      default: false
    },
    fromBatch: {
      type: Boolean,
      default: false
    },
    batchSelectId: {
      type: Number,
      default: 0
    }
  },
  components: {
    BillingCorrectionSummary,
    BillingModelCalibCompanySelectBoard,
    BillingModelCalibGrid,
    DashboardPanel,
    FilteringComponent,
    ExcelDownload
  },
  async created () {
    await this.initData()

    if (this.fromBatch && this.batchSelectId) {
      this.getServerInfo(this.batchSelectId)
    }
  },
  computed: {
    selectedModelObj () {
      return this.modelList[this.selectedModelIdx]
    },
    selectedModelId () {
      return this.selectedModelObj.id
    },
    groupOptions () {
      return [].concat([{ label: this.$v('전체'), value: null }], this.groupList.map((el) => ({ label: el.label, value: el.groupIdx })))
    },
    searchOptions () {
      return [].concat([{ label: this.$v('전체'), value: null }], this.serachOptionByType[this.type])
    }
  },
  watch: {
    batchSelectId (id) {
      this.getServerInfo(id)
    }
  },
  methods: {
    setFirstRow (args) {
      if (!args) return

      const range = (min, max) => {
        const result = []

        for (let i = min; i <= max; i++) {
          result.push(i)
        }

        return result
      }

      args.xlsxCell.style.hAlign = wjcXlsx.HAlign.Center
      args.xlsxCell.style.vAlign = wjcXlsx.VAlign.Center
      args.xlsxCell.rowSpan = 1

      if (this.type === 'server') {
        if (range(0, 2).includes(args.col)) {
          args.xlsxCell.colSpan = 3
          args.xlsxCell.value = '보정 모델 생성일: ' + dayjs(this.modelDetailData.createDate).format('YYYY.MM.DD')
        } else if (range(3, 5).includes(args.col)) {
          args.xlsxCell.colSpan = 3
          args.xlsxCell.value = '마지막 수정일: ' + dayjs(this.modelDetailData.updateDate || this.modelDetailData.createDate).format('YYYY.MM.DD')
        } else {
          args.xlsxCell.colSpan = 3
          args.xlsxCell.value = '생성자: ' + `${this.modelDetailData.userName}(${this.$options.filters.maskingName(this.modelDetailData.userId)})` || '-'
        }
      } else {
        if (range(0, 1).includes(args.col)) {
          args.xlsxCell.colSpan = 2
          args.xlsxCell.value = '보정 모델 생성일: ' + dayjs(this.modelDetailData.createDate).format('YYYY.MM.DD')
        } else if (range(3, 4).includes(args.col)) {
          args.xlsxCell.colSpan = 2
          args.xlsxCell.value = '마지막 수정일: ' + dayjs(this.modelDetailData.updateDate || this.modelDetailData.createDate).format('YYYY.MM.DD')
        } else {
          args.xlsxCell.colSpan = 2
          args.xlsxCell.value = '생성자: ' + `${this.modelDetailData.userName}(${this.$options.filters.maskingName(this.modelDetailData.userId)})` || '-'
        }
      }
    },
    onSetNowExporting (progress) {
      if (!this.contentGrid) return

      if (progress) {
        this.contentGrid.columnHeaders.rows.push(new wjGrid.Row())
      } else {
        this.contentGrid.columnHeaders.rows.pop()
      }
    },
    onInitGrid (grid) {
      this.contentGrid = grid
    },
    applyFilter () {
      if (this.type === 'server') {
        this.filteredGridData = this.gridData
          .map((item) => this.mapToCode(item, 'serverInfo'))
          .filter(this.searchByFilter)
      } else {
        this.filteredGridData = this.gridData
          .map((item) => this.mapToCode(item, 'groupInfo'))
          .filter(this.searchByFilter)
      }
    },
    mapToCode (item, key) {
      const mc = (server) => ({ ...server, discountClass: (this.codeMap.get(server.discountClass) || {}).codeName })
      return { ...item, [key]: (item[key] || []).map(mc) }
    },
    /**
     * 보정 모델 > 상세 조회
     */
    async getServerInfo (modelId) {
      this.loading.group = true

      try {
        let apiData
        let infoKey

        if (this.type === 'server') {
          const { data } = await API.billing.getServerCorrModelByModelIdx(modelId)
          apiData = data
          infoKey = 'serverInfo'
        } else {
          const { data } = await API.billing.getGroupCorrModelByModelIdx(modelId)
          apiData = data
          infoKey = 'groupInfo'
        }

        // const data = await mock()
        this.modelDetailData = apiData
        this.gridData = apiData[infoKey]
        this.applyFilter()
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('상세 조회에 실패하였습니다.'))
      } finally {
        this.loading.group = false
      }
    },
    /**
     * 데이터 필터링
     */
    searchByFilter (item) {
      const filter = this.filterOption

      if (Object.values(filter).every(value => !value)) return true

      let flag = true

      if (filter.company) flag = item.companyIdx === filter.company
      if (filter.search && filter.searchCate) flag = String(item[filter.searchCate]).includes(filter.search)
      if (filter.search && !filter.searchCate) {
        const fuse = new Fuse([item], {
          keys: [
            'companyName',
            'projectName',
            'ipAddress',
            'hostName',
            'taskInfo'
          ]
        })

        const items = fuse.search(filter.search)
        flag = !!items.map(item => item.node).length
      }

      return flag
    },
    onChangeFilterGroup (group) {
      console.log(group)
    },
    onClickTab (tab) {
      this.selectedTabObj = tab
      this.applyFilter()
    },
    /**
     * 탭 초기 데이터 세팅
     */
    // initTab (categories) {
    //   if (!categories || !categories.length) {
    //     this.tabData = []
    //     return
    //   }

    //   this.tabData = categories.map(category => ({
    //     isActive: false,
    //     disable: false,
    //     field: category.cateKey,
    //     name: category.codeValue,
    //     category
    //   }))

    //   this.selectedTabObj = this.tabData[0]
    // },
    /**
     * 초기 데이터 세팅
     */
    initData () {
      this.loading.group = true

      return new Promise((resolve, reject) => {
        Promise.all(
          [
            // this.getNetworkCategory(),
            this.getGroupList(),
            this.getCodeList()
          ]
        )
          // .then(([categories, groups, codes]) => {
          .then(([groups, codes]) => {
            // this.initTab(categories)
            this.groupList = groups

            this.$watch(vm => vm.filterOption, (filterOption) => {
              this.applyFilter()
            }, { deep: true })

            this.codeMap = new Map()

            codes.forEach(code => {
              this.codeMap.set(code.codeVal, code)
            })

            resolve()
          })
          .catch(error => {
            console.log(error)
          })
          .finally(() => {
            this.loading.group = false
          })
      })
    },
    async getCodeList () {
      const codes = await API.config.getCodeList({ codeType: this.type === 'server' ? 'ADJUSTMENT_AMOUNT' : 'COMPANY_ADJUSTMENT_AMOUNT' })
      return codes
    },
    /**
     * 관계사 조회
     */
    async getGroupList () {
      const response = await API.iam.getGroupList({
        groupUpper: 0
      })
      if (!response) return
      const result = response.map(item => {
        return {
          ...item,
          label: item.groupName,
          companyCode: item.companyCode || null
        }
      })
      return [...result] // 전체 포함
    },
    /**
     * 네트워크 카테고리 조회
     */
    async getNetworkCategory () {
      const data = await API.network.getNetworkCategory({ upperCategoryIdx: 0 })
      return data
    },
    routeTo (to) {
      this.$router.push(to)
    },

    /** HandlerEmit */
    handleEmitClickCreateCalibModel (selected) {
      this.$emit('click-create-calib-model', selected)
    },

    handleEmitInitColumns (selected) {
      this.gridColumns = selected
    },

    handleEmitChangeSelectedModel (modelId, model) {
      this.selectedModel = model
      this.getServerInfo(modelId)
      this.$emit('change-selected-model', modelId, model)
    },
    refreshFilter () {
      this.filterOption = {
        company: null,
        searchCate: null,
        search: ''
      }
    }
  },
  data () {
    return {
      selectedModel: null,
      codeMap: new Map(),
      modelDetailData: null,
      serachOptionByType: {
        server: [
          {
            label: this.$v('관계사'),
            value: 'companyName'
          },
          {
            label: this.$v('프로젝트'),
            value: 'projectName'
          },
          {
            label: 'IP',
            value: 'ipAddress'
          },
          {
            label: this.$v('호스트명'),
            value: 'hostName'
          }
          // {
          //   label: this.$v('업무명'),
          //   value: 'taskInfo'
          // }
        ],
        company: [

        ]
      },
      tabData: [],
      gridData: [],
      gridColumns: [],
      selectedModelIdx: 0,
      selectedTabObj: {},
      filteredGridData: [],
      filterOption: {
        company: null,
        searchCate: null,
        search: ''
      },
      // 관계사 리스트
      groupList: [],
      // 로딩
      loading: {
        group: false
      },
      contentGrid: null
    }
  }
}
</script>
<style lang="scss" scoped>
.billing-model-calibration {
  .filter-between {
    width: 100%;
    display: flex;
    justify-content: space-between;
  }

  .billing-model-calib-body {
    overflow: hidden;

    .body-panel{
      &.-right {
        flex: 1;
        overflow: hidden;

        &.batch {
          margin-left: 0;
          padding-right: 40px;
        }

        .g-tabs-bar{
          .filter-bar {
            margin-bottom: 20px;
          }
        }
      }
    }
  }
}
</style>
<style lang="scss" scoped>
.billing-model-calibration {
  .billing-model-calib-body {
    display: flex;

    &.batch {
      display: block;
    }

      > .body-panel {
        &.-left {

        }
        &.-right {
          margin-left: 40px;
          /* min-width: calc(100% - 420px); */

          .g-tabs-bar {
            margin-top: 40px;
          }
        }
      }
  }

  .no-data {
    margin: $gap-s 0;
  }
  & span.postfix {
    color: #bbb;
    font-size: 12px;
    font-weight: normal;
    padding-left: 5px;

    & .icon {
      font-size: 16px;
      padding-left: 5px;
      vertical-align: text-bottom;
      color: $main-blue;
      transform: rotate(180deg);
    }
  }
}
.model-grid__is-empty {
  display: flex;
  margin-top: 73px;
  border-radius: 4px;
  border: 1px solid $purple-gray;
  height: 70vh;
  margin-left: $gap;
  min-width: calc(100% - 420px);
  justify-content: center;

  &.batch {
    min-width: 100%;
  }

  .model-grid-text {
    display: flex;
    align-self: center;
    color: $gray;
    font-size: 16px;
  }
}
</style>
