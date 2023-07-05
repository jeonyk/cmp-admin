<!--
  * 파일명 : BillingModelStandardList.vue
  * 파일 기능 : [빌링 > 모델 > 과금모델] AWS 리전별 과금모델 모든 리스트를 확인합니다. (2차)
  * 작성자 : 이유준
  * 최종 작성일 : 2022-04-21
  * License By Shinsegae I&C
  * 과금모델 AWS 분리
 -->

<template>
  <div
    class="billing-model-standard-list"
    v-loading="excelDownloadLoading"
  >
    <dashboard-panel
      class="billing-panel left"
      :title="$t('bill.MODEL.billingModelTableByregion')"
      :padding-top="14"
    >
      <template #headerPostfix>
        <span class="postfix">
          {{ $t('bill.MODEL.allCount',{count: regions.length}) }}
        </span>
      </template>
      <billing-model-region-list
        v-model="selectedRegionIdx"
        :regions="regions"
      />
    </dashboard-panel>
    <dashboard-panel
      class="billing-panel right"
      :padding-top="30"
    >
      <template #headerPostfix>
        <div
          class="aff-postfix"
        >
          <span class="aff-name">표준과금모델</span>
        </div>
        <span class="standard-info">
          {{ $t("bill.MODEL.digits") }} :
          {{ $t("bill.UNIT.THOUSANDS") }},
          {{ $t("bill.round") }}
        </span>
      </template>
      <template #header>
        <div class="header-button-area">
          <button
            class="button"
            @click="downloadExcel"
          >
            {{ $t("common.BTN.excelDownload") }}
            <i class="download-icon" />
          </button>
        </div>
      </template>
      <g-tab
        class="gtab"
        :data="tabData"
        ref="billingTabs"
        :padding-top="30"
        @click="clickTabHandler"
        v-loading="loading"
      >
        <billing-model-search
          v-model="search"
          @search="filterSearch"
          @reset="resetFilter"
        />
        <cmp-grid
          class="billing-model-price-grid"
          ref="billingGrid"
          :item-source="tableData"
          :columns="columns"
          :paging-size="10"
          :height="600"
          :init-custom-action="initGrid"
          @total-count="count => tableTotal = count"
          @changingPage="page => pageTemp = page - 1"
          selectable
          @selectedRow="seletedRowHandler"
        />

        <cmp-grid
          v-show="false"
          v-for="(dataArr, index) in excelGrid"
          :key="index"
          class="billing-model-price-grid"
          ref="billingTableForExcel"
          :item-source="dataArr"
          :columns="columns"
          :height="600"
        />
      </g-tab>
    </dashboard-panel>
    <el-dialog
      class="pricemodify-modal"
      :visible="isShowModifyModal"
      :title="$t('bill.MODEL.billingModelModify')"
      @close="isShowModifyModal=false"
    >
      <section class="pricemodify-modal-body">
        <cmp-grid
          v-if="!this.hasTypeNot"
          :item-source="[selectedRowData]"
          :selcectable="false"
          :columns="[{ header: '항목', binding: 'selectedTab', width: 100, sorting:false, keyPath: 'bill.service' },
                     { header: 'Instance Type', binding: 'type', width: '*', customHtml: true, sorting:false }]"
        />
        <section class="modify-price-container">
          <div class="input-box">
            <span class="input-box-label"> {{ $t('bill.pricePerHour') }}($)</span>
            <el-input
              v-model="selectedRowData.pricePerHour"
              type="number"
              @blur="blurHandler"
              class="input-box-textbox"
            />
          </div>
          <div class="input-box">
            <div class="input-box-label">
              {{ $t('bill.pricePerMonth') }}($)
            </div>
            <el-input
              :value="Math.ceil(selectedRowData.pricePerHour * 24 * 30)"
              disabled
              class="input-box-textbox"
            />
          </div>
        </section>
        <div class="button-area -center">
          <button
            class="button"
            type="is-anti"
            @click="isShowModifyModal = false"
          >
            <!-- 취소 -->
            {{ $t('common.BTN.cancel') }}
          </button>
          <button
            class="button"
            type="is-primary"
            @click="updatePrice"
          >
            <!-- 확인 -->
            {{ $t('common.BTN.confirm') }}
          </button>
        </div>
      </section>
    </el-dialog>
  </div>
</template>

<script>
import API, { DashboardPanel } from '@sd-fe/cmp-core'
import BillingModelRegionList from '@/views/Billing/AWS/BillingModel/BillingModelStandard/BillingModelRegionList.vue'
import BillingModelMixins from '@/components/Billing/BillingModel.mixins'

import {
  tabData
} from './BillingModelStandardListNew.column'

import BillingModelSearch from '@/components/Billing/Search/BillingModelSearch.vue'
import * as wjGridXlsx from '@grapecity/wijmo.grid.xlsx'

export default {
  name: 'BillingModelStandardList',
  mixins: [BillingModelMixins],
  components: {
    'dashboard-panel': DashboardPanel,
    BillingModelRegionList,
    BillingModelSearch
  },
  computed: {
    hasTypeNot: function () {
      return this.selectedTabObject.name === 'EFS' || this.selectedTabObject.name === 'NLB' || this.selectedTabObject.name === 'ALB'
    },
    columns: function () {
      const init = [
        { header: 'NO', binding: 'number', width: 100, sorting: false, keyPath: 'bill.number' },
        { header: 'Instance Type', binding: 'type', width: '*', customHtml: false },
        { header: '시간당 비용', binding: 'pricePerHour', width: 300, customHtml: true, sorting: false, keyPath: 'bill.pricePerHour' },
        { header: '월 비용', binding: 'pricePerMonth', width: 300, customHtml: true, sorting: false, keyPath: 'bill.pricePerMonth' }]

      if (this.hasTypeNot) {
        return this.fillterDeletedColInstanceType([...init])
      } else return init
    }
  },
  async created () {
    try {
      this.regions = (await API.aws.getRegionsByOrder()).data
      await this.initPriceTable()
    } catch (data) {
      throw data.err
    }
  },
  watch: {
    selectedRegionIdx (val) {
      this.tabData.forEach((el, index) => {
        this.tabData[index].isActive = false
      })
      this.tabData[0].isActive = true
      this.selectedTabObject = { name: 'EC2' }
      this.initPriceTable(val)
      this.search = ''
    },
    isShowModifyModal (val) {
      if (val === false) {
        if (!this.grid) return
        const cv = this.grid.collectionView
        cv.refresh()

        // this.selectedRowData = []
      }
    }
  },
  methods: {
    initGrid (grid) {
      console.log('@init', grid)
      this.grid = grid
    },
    async updatePrice () {
      try {
        const payload = {
          pricePerHour: this.selectedRowData.pricePerHour,
          pricePerMonth: Math.ceil(this.selectedRowData.pricePerHour * 24 * 30),
          type: this.selectedRowData.type,
          service: this.selectedRowData.selectedTab,
          regionName: this.regions[this.selectedRegionIdx].regionName
        }
        await API.aws.updatePricePerService(payload)
        this.getGridData(this.selectedTabObject)
      } catch (err) {
        throw err.data
      } finally {
        this.isShowModifyModal = false
      }
    },
    async initPriceTable (val) {
      try {
        const payload = {
          regionName: val ? this.regions[val].regionName : this.regions[0].regionName,
          service: this.initTab
        }
        this.tableData = await API.aws.getPricePerService(payload)
        this.tableData.forEach((el, index) => {
          el.number = index + 1
          el.pricePerHour = `${el.pricePerHour}$`
          el.pricePerMonth = `${el.pricePerMonth}$`
        })
        this.loading = false
        this.excelDownloadLoading = false
      } catch (error) {
        throw new Error(error)
      }
    },
    blurHandler () {
      const value = this.selectedRowData.pricePerHour
      if (value.length === 0) this.selectedRowData.pricePerHour = 0
    },
    seletedRowHandler (e) {
      console.log('@selectRow ', e)
      this.selectedRowData = {
        selectedTab: e._data.service,
        pricePerHour: Number(e._data.pricePerHour.replace('$', '')),
        pricePerMonth: Number(e._data.pricePerMonth.replace('$', '')),
        type: e._data.type
      }
      this.isShowModifyModal = true
    },

    clickTabHandler (e) {
      this.selectedTabObject = e
      this.search = ''
      this.getGridData(this.selectedTabObject)
    },
    // option을 통해서 excel을 위한 get메소드 호출인지 아닌지를 구분합니다.
    async getGridData (e, option) {
      this.loading = true
      try {
        const selectedRegion = this.regions[this.selectedRegionIdx]?.regionName
        const payload = {
          regionName: selectedRegion,
          service: e.name
        }

        const response = await API.aws.getPricePerService(payload)
        response.forEach((el, index) => {
          el.number = index + 1
          el.pricePerHour = `${el.pricePerHour}$`
          el.pricePerMonth = `${el.pricePerMonth}$`
        })
        // Excel 다운로드에서 호출한것이 아니라면

        if (!option) this.tableData = response
        else {
          this.excelGrid = { ...this.excelGrid, [e.type]: response }
        }
      } catch (error) {
        console.log(error)
      } finally {
        this.loading = false
      }
    },
    fillterDeletedColInstanceType (columns) {
      let active = false
      columns.forEach((el) => {
        if (el.binding === 'type') active = true
      })
      if (active) {
        columns.splice(1, 1)
      }
      return columns
    },
    async filterSearch () {
      await this.getGridData(this.selectedTabObject)
      console.log(this.search)
      try {
        if (this.search !== '') {
          this.tableData = this.tableData.filter((el) => {
            // if (this.search === el.type)
            const regexp = new RegExp(`${this.search}`)
            return regexp.test(el.type)
          })
          this.$forceUpdate()
        }
      } catch (err) {
        console.log(err)
      }
    },
    resetFilter () {
      this.search = ''
      this.getGridData(this.selectedTabObject)
      // this.initPriceTable(this.selectedRegionIdx)
    },
    async downloadExcel () {
      this.excelDownloadLoading = true
      try {
        this.excelGrid = {}
        let books = null
        // EXCEL 다운로드시에 해당리전의 모든 서비스를 호출해서 저장합니다.
        await this.tabData.forEach(async (el, index) => {
          await this.getGridData(el, true)
          this.search = ''
        })

        setTimeout(() => {
          const arr = Object.values(this.excelGrid)
          this.excelGrid = []
          this.excelGrid = arr

          this.$nextTick(() => {
            this.$refs.billingTableForExcel.forEach(async ({ id, grid }, index) => {
              const book = await wjGridXlsx.FlexGridXlsxConverter.saveAsync(grid, {
                includeColumnHeaders: true,
                includeRowHeaders: true,
                formatItem: args => {
                  const { row, xlsxCell } = args
                  const realRow = args.getRow(row)

                  xlsxCell.style.vAlign = 1

                  if (realRow.dataItem) {
                    xlsxCell.style.font.color = '#000'
                  }
                }
              })

              book.sheets[0].name = tabData(this)[index].name
              if (!books) {
                books = book
              } else {
                books.sheets.push(book.sheets[0])
                if (index === this.tabData.length - 1) { books.saveAsync(`${this.regions[this.selectedRegionIdx].displayName}-${this.$t('bill.MODEL.billingModelTable')}.xlsx`) }
              }
            })
          })
          this.excelDownloadLoading = false
        }, 1000)
      } catch (err) {
        console.log(err)
        this.excelDownloadLoading = false
      }
    }
  },
  data: root => ({
    noEditGrid: false,
    isInitGrid: false,
    loading: true,
    excelDownloadLoading: false,
    filterOption: 2,
    tabData: tabData(root),
    tableData: [],
    tableTotal: 0,
    pageTemp: 0,
    regions: [],
    initTab: 'EC2',
    selectedTabObject: { name: 'EC2' },
    selectedRegionIdx: 0,
    selectedRowData: [],
    isShowModifyModal: false,
    grid: null,
    excelGrid: {},
    excelGridForDownload: null,
    tabOrderDic: { ec2: 1, ebs: 2, efs: 3, nlb: 4 },
    search: ''
  })
}
</script>

<style lang="scss" scoped>
.billing-model-standard-list {
  display: flex;

  & .billing-panel {
    &:not(.down) {
      margin-right: $gap * 2;
    }

    &.left {
      min-width: 385px;
      flex: 1 1 25%;

      &.down {
        margin-top: $gap * 2;

        & .all-model-icons {
          font-size: 12px;
          color: $light-gray;
          cursor: pointer;
          transition: color 250ms ease;

          &:hover {
            color: $white;
          }

          & i[class^="el-icon-"] {
            margin: 2px 0 3px 4px;
            font-weight: bolder;
            color: $white;
          }
        }

        & .billing-filter {
          display: flex;
          justify-content: space-between;
          margin-bottom: $gap;
          margin-top: $gap-s;
          .is-billing-text {
            color: $light-gray;
            font-size: 12px;
          }
          .filter-radio-group {
            &::v-deep > .el-radio {
              &:not(:last-child) {
                margin-right: $gap !important;
              }
            }
          }
        }

        & .billing-model-list:not(:last-child) {
          margin-bottom: 8px;
        }
      }

      span.postfix {
        color: #bbb;
        font-size: 12px;
        font-weight: normal;
        padding-left: 5px;
        .icon {
          font-size: 16px;
          padding-left: 5px;
          vertical-align: text-bottom;
          color: $main-blue;
          transform: rotate(180deg);
        }
      }

      &::v-deep .panel-body {
        border-top: 1px solid $main-black;
      }
    }

    &.right {
      flex: 1 1 75%;

      .aff-postfix {
        > .el-icon {
          margin: 0 5px;
          color: $slate;
        }
        > .aff-name {
          font-weight: normal;
          font-size: 16px;
        }
      }

      & .standard-info {
        color: #bbb;
        font-size: 12px;
        font-weight: normal;
        padding-left: 15px;
      }

      & .header-button-area {
        & .download-icon {
          margin-left: $gap-s / 2;
          position: relative;
          top: 2px;
        }
      }

      &::v-deep .panel-body {
        border-color: transparent;
      }
    }
  }
}
.pricemodify-modal{
  .pricemodify-modal-body {
    .modify-price-container {
      display:inline-block;
      width: 100%;
       margin-top: 26px;
      align-items: center;
      text-align: center;
      .input-box {
        display:inline-flex;
        text-align: center;

        width: 300px;
        height: 40px;
        line-height: 40px;
        margin-bottom: 0px;
        .input-box-label {
          display: inline-flex;
          width: 160px;
        }
      }
    }
  }
  .button-area {
    margin-top: 26px;
  }
}
</style>

<style lang="scss">
.new-sw-tooltip-info {
  max-width: 120px;
}
  // 인터벌 + 페이지네이션 때 알 수 없는 스크롤바 생김 방지
.billing-model-price-grid{
  .wj-content {
    div[wj-part=root] {
      overflow: hidden !important;
    }
  }
}
</style>
