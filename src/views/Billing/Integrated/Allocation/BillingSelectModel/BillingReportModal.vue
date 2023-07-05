<!--
  * 파일명 : BillingReportModal.vue
  * 파일 기능 : 빌링 > 과금 배치 > 빌링 리포트 상세 모달
  * 작성자 : 김예담 외 1명
  * 최종 작성일 : 2021-02-08
  * License By Shinsegae I&C
  * 2021-02-08 Merge branch 'dev' of https://gitlab-s.growthsoft.co.kr/SSG/cmp-web-admin into publish/regist-resource-fix
 -->

<template>
  <el-dialog
    :title="title"
    :visible="active"
    :before-close="blockClose"
    @close="close"
    class="billing-report-modal"
    width="95%"
    v-loading="billingReportModalLoading"
  >
    <div
      class="modal-body"
      v-loading="loading"
      :element-loading-text="$t('common.ALERT.BASE.067')"
    >
      <g-tab
        ref="tabRef"
        :data="tabData"
        @click="selectTabItem"
      >
        <template #compute>
          <div class="tab-wrap">
            <filtering-component
              v-if="filteringOptions.length"
              ref="billingFilterComp"
              :data="filteringOptions"
              @selected="selectFilter"
              @reset-data="onResetFilter"
              :default-values="{
                format: 'cur',
                company: ''
              }"
            />
            <div class="table-top-wrap">
              <total-count
                v-if="tableTotal"
                :total-count="tableTotal"
              />
            </div>
            <div class="table-area">
              <cmp-grid
                :item-source="tableData"
                :columns="reportColumns"
                class="report-grid"
                :header-merge="headerMerge"
                :paging-size="8"
                use-excel-download
                @total-count="count => tableTotal = count"
                :init-custom-action="onInitCustomAction"
              >
                <template
                  v-for="column in columnData"
                  :slot="column.binding"
                  slot-scope="props"
                >
                  <div :key="column.binding">
                    <span>{{ props.row[column.binding] | moneyFormat }}</span>
                  </div>
                </template>
              </cmp-grid>
            </div>
          </div>
        </template>
        <template #nas>
          <!-- <div class="tab-wrap">
            <filtering-component
              v-if="filteringOptions.length"
              ref="billingFilterComp"
              :data="filteringOptions"
              @selected="selectFilter"
              @reset-data="onResetFilter"
              :default-values="{
                format: 'cur',
                company: ''
              }"
            />
            <div class="table-top-wrap">
              <total-count
                v-if="tableTotal"
                :total-count="tableTotal"
              />
            </div>
            <div class="table-area">
              <cmp-grid
                :item-source="tableData"
                :columns="reportColumns"
                class="report-grid"
                :header-merge="headerMerge"
                :paging-size="8"
                use-excel-download
                @total-count="count => tableTotal = count"
                :init-custom-action="onInitCustomAction"
              >
                <template
                  v-for="column in columnData"
                  :slot="column.binding"
                  slot-scope="props"
                >
                  <div :key="column.binding">
                    <span>{{ props.row[column.binding] | moneyFormat }}</span>
                  </div>
                </template>
              </cmp-grid>
            </div>
          </div> -->
        </template>
      </g-tab>
    </div>
    <section class="modal-footer big-button-area">
      <button
        :disabled="!fullLoaded"
        class="button"
        type="is-primary"
        @click="close"
      >
        {{ $t('common.BTN.confirm') }}
      </button>
    </section>
  </el-dialog>
</template>
<script>
import { FilteringComponent } from '@sd-fe/cmp-core'
import * as wjGrid from '@grapecity/wijmo.grid'
import { cloneDeep } from 'lodash'

export default {
  name: 'BillingReportModal',
  components: {
    FilteringComponent
  },
  props: {
    fullLoaded: {
      type: Boolean,
      default: false
    },
    active: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: '리포트 상세'
    },
    currentData: {
      type: Array,
      default: () => []
    },
    compareData: {
      type: Array,
      default: () => []
    },
    columnData: {
      type: Array,
      default: () => []
    },
    // width: {
    //   type: String,
    //   default: '50%'
    // },
    // selectable: {
    //   type: Boolean,
    //   default: false
    // },
    filteringOptions: {
      type: Array,
      default: () => []
    },
    selectDetail: { // 그리드 로우 선택시, 상세 페이지가 있는가?
      type: Boolean,
      default: false
    },
    detailColumnData: {
      type: Array,
      default: () => []
    },
    initAutoSelectRow: { // 이전에 선택된 row의 dataItem - 그리드 시작시 해당 row 의 data 를 기반으로 Array에서 해당하는 row를 찾습니다.
      type: [Object, Array],
      default: () => {}
    },
    initAutoSelectRowKey: { // 그리드 시작 시, 자동 선택되는 로우를 알기 위한 고유 key 값
      type: String,
      default: ''
    },
    headerMerge: {
      type: Object,
      default: () => {}
    },
    loading: {
      type: Boolean,
      default: false
    },
    rawBatchInfo: {
      type: Object,
      default: () => {}
    },
    isIncludeCorrection: {
      type: Boolean,
      required: false
    }
  },
  computed: {
    /**
     * 보정 내용을 삭제한 컬럼
     */
    reportColumns () {
      if (this.isIncludeCorrection) {
        return this.columnData
      } else {
        const originColumns = this.columnData.slice(0)

        // 보정 내용 삭제
        // 보정 전 비용, 서버 보정 비용, 관계사 보정 비용, 보정 후 비용
        for (let i = 0; i < 4; i++) originColumns.pop()

        originColumns.push({
          binding: 'beforeTotal',
          customHtml: true,
          field: 'beforeTotal',
          header: this.$t('bill.cost'),
          width: '*'
        })

        return originColumns
      }
    }
  },
  watch: {
    active (newVal) {
      if (!newVal) {
        if (this.$refs.billingFilterComp) {
          this.$refs.billingFilterComp.resetData()
        }
        if (this.$refs.tabRef) {
          this.$refs.tabRef.clickEvent({ field: 'compute' }, 0)
        }
      }
    },
    currentData (newVal) {
      this.tableData = newVal
    }
  },
  methods: {
    selectTabItem (tab, index) {
      this.activeTab = tab.field
    },
    setReportGridFooter () {
      if (this.reportGrid) {
        this.reportGrid.columnFooters.rows.clear()
        this.reportGrid.columnFooters.rows.push(new wjGrid.Row())
        this.reportGrid.columnFooters.rows.minSize = 40

        const columnObj = cloneDeep(this.reportColumns)
        const dataItem = {}

        if (columnObj && columnObj.length) {
          columnObj.forEach((column, columnIdx) => {
            if (columnIdx === 0) {
              dataItem[column.binding] = '금액 합계'
              return
            }
            if (column.noBill) {
              dataItem[column.binding] = '-'
            } else {
              const collection = this.reportGrid.itemsSource?.sourceCollection
              let sum = '-'

              if (collection) {
                if (!collection.length) sum = 0
                else {
                  if (this.filterData && this.filterData.format === 'pre') {
                    // 전 달 대비 증감 내역으로 필터가 설정된 경우
                    sum = collection.reduce((pre, next) => {
                      const parse = (str = '') => {
                        // 공백이 없는 경우
                        if (!str.includes(' ')) {
                          return [0, 0]
                        }
                        // 공백이 있는 경우 해당 월 과금/증감 과금 분리
                        let [origin, acc] = str.split(' ')
                        // 문자열을 숫자로 표현
                        const parseNumber = (priceStr = '') => {
                          if (priceStr.includes('+') || priceStr.includes('-')) {
                            const num = parseInt(priceStr.match(/[\d]*/gim).filter(t => t.length).join('').replace(/,/gim, ''))
                            return priceStr.includes('-') ? num * -1 : num
                          }
                          return parseInt(priceStr.replace(/(,|\(|\))/gim, ''))
                        }

                        origin = parseNumber(origin)
                        acc = parseNumber(acc)

                        return [origin, acc]
                      }
                      const parsedPre = parse(pre)
                      const parsedNext = parse(next[column.binding])
                      const mark = parsedPre[1] + parsedNext[1] >= 0 ? '+' : '-'
                      const toLocaleString = (num) => num.toLocaleString()
                      return `${toLocaleString(parsedPre[0] + parsedNext[0])} (${mark}${toLocaleString(parsedPre[1] + parsedNext[1])})`
                    }, '0 (0)')
                  } else {
                    // 단순 숫자 포맷으로 타입을 number로 쉽게 변환할 수 있는 경우
                    sum = collection.reduce((pre, next) => {
                      if (typeof next[column.binding] === 'string') {
                        return pre + (parseInt((next[column.binding]).replace(/,/gmi, '')) || 0)
                      }
                      return pre + next[column.binding]
                    }, 0)
                  }
                }
              }

              dataItem[column.binding] = sum
            }
          })
        }

        this.reportGrid.columnFooters.rows[0].dataItem = dataItem
      }
    },
    onChangeItemSource () {
      // if (this.reportGrid) {
      //   this.setReportGridFooter()
      // }
    },
    onInitCustomAction (grid) {
      this.reportGrid = grid
      this.reportGrid.itemsSourceChanged.addHandler((r, c) => {
        this.setReportGridFooter()
      })
      this.setReportGridFooter()
    },
    onResetFilter () {
      this.selectFilter({
        format: 'cur',
        company: ''
      })

      this.tableData = []

      setTimeout(() => {
        this.tableData = this.currentData
      }, 0)
    },
    blockClose (done) {
      if (!this.fullLoaded) return
      done()
      this.$emit('close')
    },
    selectFilter (filterData) {
      let targetTableData = filterData.format === 'pre'
        ? this.compareData
        : this.currentData

      if (filterData.company) {
        targetTableData =
          targetTableData.filter(table => table.companyName === filterData.company)
      }

      this.tableData = targetTableData
      this.filterData = filterData
    },
    close () {
      this.$emit('close')
    },
    confirm () {
      if (this.selectable) {
        if (!this.selectedRow) {
          this.$alert(this.$t('common.ALERT.BILL.012'), '알림', {
            confirmButtonText: this.$t('common.BTN.confirm'),
            type: 'error'
          })
          return false
        } else {
          this.$emit('confirm', this.selectedRow)
        }
      } else {
        this.$emit('confirm')
      }
      this.close()
    }
    // setSelectedRow (param) {
    //   if (this.selectDetail) {
    //     this.detailPage = true
    //     console.log(param.dataItem)
    //     if (param.dataItem.name) this.detail.title = param.dataItem.name
    //     if (param.dataItem.children) this.detail.tableData = [...param.dataItem.children]
    //   } else if (!this.selectDetail && this.selectable) {
    //     this.$emit('selectedRow', param)
    //     this.selectedRow = param
    //   }
    // },
    // setSelectedDetailRow (param) {
    //   if (this.selectDetail) {
    //     this.$emit('selectedRow', param)
    //     this.selectedRow = param
    //   }
    // }
  },
  data () {
    return {
      filterData: null,
      reportGrid: null,
      tableTotal: null,
      selectedRow: null,
      tableData: [],
      detailPage: false,
      detail: {
        title: '',
        tableData: ''
      },
      billingReportModalLoading: false,

      /** 3단계 추가 */
      tabData: [
        { field: 'compute', name: 'Compute' }
        // { field: 'nas', name: 'NAS' }
      ],
      activeTab: 'compute'
    }
  }
}
</script>
<style lang="scss">
  .billing-report-modal {
    margin-top: -70px;
    .table-area {
      overflow: hidden;
      max-width: 100%;
      .report-grid {
        .cmp-grid-inner {
          overflow: auto;
          max-width: 100%;
          min-height: 100px;
          #cmpGrid {
            width: 500%;
          }
        }
      }
    }
  }
</style>
