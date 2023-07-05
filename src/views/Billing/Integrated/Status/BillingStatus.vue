<!--
  * 파일명 : BillingStatus.vue
  * 파일 기능 : [빌링 > 과금 현황] 청구 / 계리 데이터를 그리드에서 보여줍니다.
  * 작성자 : 김진범 외 4명
  * 최종 작성일 : 2021-01-15
  * License By Shinsegae I&C
  * 2021-01-15 이슈 처리
 -->

<template>
  <div
    class="billing-status"
    v-loading="isGetLoading"
  >
    <g-tab
      @click="changeTab"
      :data="tabData"
    >
      <template #claim>
        <filtering-component
          @reset-data="e => {
            claimDate = new Date(new Date().setMonth(new Date().getMonth()-1));
          }"
        >
          <section class="filter-form">
            <span class="filter-name">
              {{ $t('bill.billDate') }}
            </span>
            <div class="filter-date">
              <el-date-picker
                class="status-picker"
                v-model="claimDate"
                type="month"
                format="yyyy.MM"
                :clearable="false"
              />
            </div>
          </section>
        </filtering-component>
        <div class="header">
          <p class="-unit">
            {{ $t('bill.unit') }}
          </p>
        </div>
      </template>
      <!-- /. 청구 -->

      <template #profit>
        <filtering-component
          @reset-data="e => {
            selectGroup = null
            profitDate = new Date(new Date().setMonth(new Date().getMonth()-1))
          }"
        >
          <section class="filter-form">
            <span class="filter-name">{{ $t('common.TERMS.rel') }}</span>
            <div class="filter-options">
              <el-select
                class="dropdown-language"
                v-model="selectGroup"
                :placeholder="$t('common.TERMS.rel')"
              >
                <el-option
                  v-for="item in groupList"
                  :key="item.groupIdx"
                  :label="item.groupName"
                  :value="item.groupIdx"
                />
              </el-select>
            </div>
          </section>
          <section class="filter-form">
            <span class="filter-name">
              {{ $t('bill.billDate') }}
            </span>
            <div class="filter-date">
              <el-date-picker
                class="status-picker"
                v-model="profitDate"
                type="month"
                format="yyyy.MM"
                :clearable="false"
              />
            </div>
          </section>
        </filtering-component>

        <div class="header">
          <p class="-unit">
            {{ $t('bill.unit') }}
          </p>
        </div>
      </template>
    </g-tab>
    <!-- {{ billingTotalColumns }} -->
    <cmp-grid
      v-show="currentTab === 'profit'"
      :item-source="billingProfitData"
      :columns="billingTotalColumns.profit"
      :header-merge="networkHeaderMergeColumns.profit"
      :init-custom-action="init"
      paging-type="list"
    >
      <template
        v-for="column in billingTotalColumns.profit"
        :slot="column.binding"
        slot-scope="props"
      >
        <span
          v-if="column.binding === 'claimPrice'"
          :key="column.binding"
        >
          {{ props.row.claimPrice | locale }}
          ({{ props.row.claimPrice - props.row.beforePrice | localeSign }})
        </span>
        <span
          v-else
          :key="column.binding"
        >
          <span
            v-if="column.type === 'price'"
          >
            <span v-if="column.field.endsWith('_price')">
              {{ props.row[column.dataCenter].current.correctionPriceSum | locale }}
              ({{ props.row[column.dataCenter].current.correctionPriceSum - props.row[column.dataCenter].before.correctionPriceSum | localeSign }})
            </span>
          </span>
          <span v-else-if="column.type === 'percent'">
            {{ props.row[column.dataCenter].current.correctionPriceSum |percentAndRound(0,props.row.claimPrice) }}
          </span>
        </span>
      </template>
    </cmp-grid>
    <!-- 계리 탭 -->
    <cmp-grid
      v-show="currentTab !== 'profit'"
      :item-source="billingGridData"
      :columns="billingTotalColumns.claim"
      :header-merge="networkHeaderMergeColumns.claim"
      :init-custom-action="init"
      paging-type="list"
    >
      <template
        v-for="column in billingTotalColumns.claim"
        :slot="column.binding"
        slot-scope="props"
      >
        <span
          v-if="column.binding === 'claimPrice'"
          :key="column.binding"
        >
          {{ props.row.claimPrice | locale }}
          ({{ props.row.claimPrice - props.row.beforePrice | localeSign }})
        </span>
        <span
          v-else
          :key="column.binding"
        >
          <span
            v-if="column.type === 'price'"
          >
            <span
              v-if="column.field.endsWith('_price')"
            >
              {{ props.row[column.dataCenter].current.total | locale }}
              ({{ props.row[column.dataCenter].current.total - props.row[column.dataCenter].before.total | localeSign }})
            </span>
            <span
              v-else-if="column.field.endsWith('_price_a')"
            >
              {{ props.row[column.dataCenter].current.priceSum | locale }}
              ({{ props.row[column.dataCenter].current.priceSum - props.row[column.dataCenter].before.priceSum | localeSign }})
            </span>
            <span
              v-else
            >
              {{ props.row[column.dataCenter].current.distribute | locale }}
              ({{ processDistribute(props.row[column.dataCenter].before.distribute, props.row[column.dataCenter].current.distribute) | localeSign }})
            </span>
          </span>
          <span v-else-if="column.type === 'percent'">
            {{ props.row[column.dataCenter].current.total |percentAndRound(0,props.row.claimPrice) }}
          </span>
        </span>
      </template>
    </cmp-grid>
    <!-- 청구 탭 -->
  </div>
</template>

<script>
import * as wjGrid from '@grapecity/wijmo.grid'
import GTab from '@/components/common/g-tab/g-tab'
import API from '@sd-fe/cmp-core'
import dayjs from 'dayjs'

export default {
  name: 'BillingStatus',
  components: {
    'g-tab': GTab
  },
  async created () {
    this.dataCenter = await API.network.getNetworkCategory({ upperCategoryIdx: 0 })
    this.initColumns()
    await this.getGroupList()
    await this.getClaimWithDate(this.claimDate)
  },
  watch: {
    currentTab (tab) {
      if (tab === 'claim') {
        this.getClaimWithDate(this.claimDate)
      } else {
        this.getProfitWithDate(this.profitDate, this.selectGroup)
      }
    },
    claimDate (newDate) {
      this.getClaimWithDate(newDate)
    },
    profitDate (newDate) {
      if (this.currentTab !== 'profit') return
      this.getProfitWithDate(newDate, this.selectGroup)
    },
    selectGroup (newVal) {
      if (this.currentTab !== 'profit') return
      this.getProfitWithDate(this.profitDate, newVal)
    }
  },
  methods: {
    /**
     * 계리 탭의 필터링 > 관계사 리스트를 가져옵니다.
     */
    async getGroupList () {
      const grouplist = await API.iam.getGroupList({ groupUpper: 0 })
      grouplist.unshift({ groupIdx: null, groupName: '전체' })
      // grouplist.splice(grouplist.findIndex(e => e.groupName === '공통'), 1)
      grouplist.filter(e => e.groupName === '공통')
      this.groupList = grouplist
      if (!this.selectGroup && this.groupList && this.groupList.length > 0) {
        this.selectGroup = this.groupList[0].groupIdx
      }
    },
    /**
     * 매개변수로 받은 달을 기준으로 직전 달을 반환합니다.
     * e.g) 매개변수 (2021-04) -> 2021-03 반환
     */
    getPreviousDate (date) {
      const toDate = new Date(date)
      toDate.setMonth(toDate.getMonth() - 1)
      return this.$options.filters.date(toDate, 'YYYY-MM')
    },
    /**
     * 전 달 공통배분 값과 현재 공통배분 값을 처리합니다.
     */
    processDistribute (before, current) {
      if (before && current) {
        // 전 달과 이번 달 공통 배분 값이 있음
        return current - before
      } else if (!before && current) {
        // 전 달은 없으나 이번 달 공통 배분 값이 있음
        return current
      } else if (before && !current) {
        // 전 달은 있으나 이번 달 공통 배분 값이 없음
        return -before
      } else {
        // 전 달도 없고 이번 달 공통 배분 값도 없음
        return 0
      }
    },
    changeTab (tab) {
      this.currentTab = tab.field
    },
    async getClaimWithDate (newDate) {
      try {
        this.isGetLoading = true
        const startDate = this.getPreviousDate(newDate)
        const endDate = this.$options.filters.date(newDate, 'YYYY-MM')
        const data = await API.billing.getOwnerCompanyBillingReportRange({ startDate: startDate, endDate: endDate })

        const currentMonthData = data.filter(bill => new Date(this.$options.filters.date(bill.date, 'YYYY-MM')).getTime() === new Date(endDate).getTime())
        // const currentMonthData = data.filter(bill => bill.billingDate === new Date(endDate).getTime())

        if (!currentMonthData.length) {
          // 이번 달 데이터가 없을 경우
          this.billingGridData = []
          return
        }

        this.setClaimTableData(data)
        this.init(this.claimGrid)
      } catch (err) {
        console.error(err)
      } finally {
        this.isGetLoading = false
      }
    },
    /**
     * 청구년월과 그룹 값으로 해당 그룹의 계리 정보를 가져옵니다.
     */
    async getProfitWithDate (newDate, newGroup) {
      try {
        this.isGetLoading = true

        const startDate = this.getPreviousDate(newDate)
        const endDate = this.$options.filters.date(newDate, 'YYYY-MM')
        const data = await API.billing.getGroupVms({ ownerCompanyIdx: newGroup, startDate: startDate, endDate: endDate })

        const currentMonthData = data.filter(bill => bill.billingDate === new Date(endDate).getTime())

        if (!currentMonthData.length) {
          // 이번 달 데이터가 없을 경우
          this.billingProfitData = []
          return
        }

        this.setProfitData(data)
        this.init(this.profitGrid)
      } catch (error) {
        console.error(error)
      } finally {
        this.isGetLoading = false
      }
    },
    /**
     * 최초 한번만 컬럼 생성합니다.
     * 기존에는 탭을 이동할 때마다 생성되어 불필요한 연산을 최소화 했습니다..
     */
    initColumns () {
      this.networkHeaderMergeColumns.claim.colSpan = []
      this.networkHeaderMergeColumns.profit.colSpan = []
      // 청구
      this.billingTotalColumns.claim.push(
        { header: this.$t('common.TERMS.rel'), binding: 'ownerCompany', align: 'left' }, // 관계사
        // 청구 금액(전월 대비)
        { header: this.$t('bill.chargeAmount'), binding: 'claimPrice', aggregate: 'Avg', customHtml: true }
      )
      let baseIdx = 2
      this.dataCenter.forEach(dc => {
        this.networkHeaderMergeColumns.claim.colSpan.push(
          { startIdx: baseIdx, endIdx: baseIdx + 3, header: dc.cateKey }
        )
        baseIdx += 4
        this.billingTotalColumns.claim.push(
          // 총 금액 (전월 대비)
          { header: this.$t('bill.amount'), binding: dc.cateKey + '_price', aggregate: 'Sum', dataCenter: dc.cateKey, type: 'price', customHtml: true },
          // 금액
          { header: this.$t('bill.amountWithoutCa'), binding: dc.cateKey + '_price_a', aggregate: 'Sum', dataCenter: dc.cateKey, type: 'price', customHtml: true },
          // 공통배분
          { header: this.$t('bill.commonAllo'), binding: dc.cateKey + '_price_common', aggregate: 'Sum', dataCenter: dc.cateKey, type: 'price', customHtml: true }
        )
        this.billingTotalColumns.claim.push({ header: '%', binding: dc.cateKey + '_percent', aggregate: 'Avg', dataCenter: dc.cateKey, type: 'percent', customHtml: true })
      })
      // 계리
      this.billingTotalColumns.profit.push(
        { header: this.$t('common.TERMS.group'), binding: 'groupName', align: 'left' }, // 조직
        // 청구 금액(전월 대비)
        { header: this.$t('bill.chargeAmount'), binding: 'claimPrice', aggregate: 'Avg', customHtml: true }
      )
      baseIdx = 2
      this.dataCenter.forEach(dc => {
        this.networkHeaderMergeColumns.profit.colSpan.push(
          { startIdx: baseIdx++, endIdx: baseIdx++, header: dc.cateKey }
        )
        this.billingTotalColumns.profit.push(
          // 총 금액 (전월 대비)
          { header: this.$t('bill.amount'), binding: dc.cateKey + '_price', aggregate: 'Sum', dataCenter: dc.cateKey, type: 'price', customHtml: true }
        )
        this.billingTotalColumns.profit.push({ header: '%', binding: dc.cateKey + '_percent', aggregate: 'Avg', dataCenter: dc.cateKey, type: 'percent', customHtml: true })
      })
    },
    initTotalData () {
      this.totalData = {
        ownerCompany: this.$t('bill.total'),
        groupName: this.$t('bill.total'),
        price: 0,
        beforePrice: 0,
        distribute: 0,
        beforeDist: 0
      }
    },
    setClaimTableData (billingDataList) {
      try {
        this.initTotalData()
        if (billingDataList) {
          const dataformat = 'YYYY-MM'
          const ownerCompanyMap = new Map()
          const claimDate = this.$options.filters.date(this.claimDate, dataformat)
          let billingDate = null
          let isBefore = false
          let obj = {}
          let dataCenterObj = {}
          billingDataList.forEach(b => {
            b.total = Math.round(b.total / 1000) || 0
            b.distribute = Math.round(b.distribute / 1000) || 0
            b.priceSum = Math.round(b.priceSum / 1000) || 0

            if (!this.totalData[b.dataCenter]) {
              this.totalData[b.dataCenter] = {}
            }

            isBefore = false
            obj = {}

            billingDate = this.$options.filters.date(b.date, dataformat)
            if (claimDate !== billingDate) isBefore = true
            if (ownerCompanyMap.has(b.ownerCompany)) {
              obj = ownerCompanyMap.get(b.ownerCompany)
            } else {
              obj.beforePrice = 0
              obj.claimPrice = 0
              obj.distribute = 0
              obj.priceSum = 0
              this.dataCenter.forEach(d => {
                obj[d.cateKey] = {
                  current: { total: 0 },
                  before: { total: 0 }
                }
              })
            }
            if (obj[b.dataCenter]) {
              dataCenterObj = obj[b.dataCenter]
            } else {
              return
            }

            if (isBefore) {
              dataCenterObj.before = b
              obj.beforePrice = obj.beforePrice ? obj.beforePrice + b.total : b.total
              obj.beforeDist = obj.beforeDist ? obj.beforeDist + b.distribute : b.distribute
              this.totalData.beforePrice += b.total
              this.totalData.beforeDist += b.distribute || 0

              const units = [
                ['beforePrice', 'total'],
                ['beforeDist', 'distribute']
              ]

              units.forEach(unit => {
                if (this.totalData[b.dataCenter][unit[0]]) {
                  this.totalData[b.dataCenter][unit[0]] += b[unit[1]]
                } else {
                  this.totalData[b.dataCenter][unit[0]] = b[unit[1]]
                }
              })
            } else {
              dataCenterObj.current = b
              obj.claimPrice = obj.claimPrice ? obj.claimPrice + b.total : b.total
              obj.distribute = obj.distribute || 0
              this.totalData.price += b.total
              this.totalData.distribute += b.distribute || 0

              const units = [
                ['price', 'total'],
                ['distribute', 'distribute'],
                ['priceSum', 'priceSum']
              ]

              units.forEach(unit => {
                if (this.totalData[b.dataCenter][unit[0]]) {
                  this.totalData[b.dataCenter][unit[0]] += b[unit[1]]
                } else {
                  this.totalData[b.dataCenter][unit[0]] = b[unit[1]]
                }
              })
            }
            this.dataCenter.forEach(center => {
              obj[center.cateKey + '_price'] = obj[center.cateKey].current.total || 0
              obj[center.cateKey + '_price_a'] = obj[center.cateKey].current.total - obj[center.cateKey].current.distribute || 0
              obj[center.cateKey + '_price_common'] = obj[center.cateKey].current.distribute || 0
              obj[center.cateKey + '_percent'] = this.$options.filters.percentAndRound(
                obj[center.cateKey].current.total, 0, obj.claimPrice
              )
            })
            obj[b.dataCenter] = dataCenterObj
            obj.ownerCompany = b.ownerCompany
            ownerCompanyMap.set(b.ownerCompany, obj)
          })
          this.billingGridData = Array.from(ownerCompanyMap.values())
        } else {
          this.billingGridData = []
        }
      } catch (error) {
        console.error(error)
        throw error.message
      }
    },
    setProfitData (billingDataList) {
      try {
        this.initTotalData()
        if (billingDataList) {
          let billingDate = null
          let isBefore = false
          let obj = {}
          const dataformat = 'YYYY-MM'
          const groupNameMap = new Map()
          const profitDate = this.$options.filters.date(this.profitDate, dataformat)
          let dataCenterObj = {}
          billingDataList.forEach(b => {
            if (b.correctionPriceSum) { b.correctionPriceSum = (b.correctionPriceSum / 1000) }
            if (!this.totalData[b.dataCenter]) { this.totalData[b.dataCenter] = {} }
            isBefore = false
            obj = {}
            billingDate = this.$options.filters.date(b.date, dataformat)
            if (profitDate !== billingDate) {
              isBefore = true
            }
            if (groupNameMap.has(b.groupName)) {
              obj = groupNameMap.get(b.groupName)
            } else {
              obj.beforePrice = 0
              obj.claimPrice = 0
              this.dataCenter.forEach(d => {
                obj[d.cateKey] = {
                  current: { correctionPriceSum: 0 }, before: { correctionPriceSum: 0 }
                }
              })
            }
            if (obj[b.dataCenter]) {
              dataCenterObj = obj[b.dataCenter]
            } else {
              return
            }
            if (isBefore) {
              dataCenterObj.before = b
              obj.beforePrice = obj.beforePrice ? obj.beforePrice + b.correctionPriceSum : b.correctionPriceSum
              this.totalData.beforePrice += b.correctionPriceSum

              if (this.totalData[b.dataCenter].beforePrice) {
                this.totalData[b.dataCenter].beforePrice += b.correctionPriceSum
              } else {
                this.totalData[b.dataCenter].beforePrice = b.correctionPriceSum
              }
            } else {
              dataCenterObj.current = b
              obj.claimPrice = obj.claimPrice ? obj.claimPrice + b.correctionPriceSum : b.correctionPriceSum
              this.totalData.price += b.correctionPriceSum
              if (this.totalData[b.dataCenter].price) {
                this.totalData[b.dataCenter].price += b.correctionPriceSum
              } else {
                this.totalData[b.dataCenter].price = b.correctionPriceSum
              }
            }
            this.dataCenter.forEach(center => {
              obj[center.cateKey + '_price'] = obj[center.cateKey].current.correctionPriceSum || 0
              obj[center.cateKey + '_percent'] = this.$options.filters.percentAndRound(
                obj[center.cateKey].current.correctionPriceSum, 0, obj.claimPrice
              )
            })
            obj[b.dataCenter] = dataCenterObj
            obj.groupName = b.groupName
            groupNameMap.set(b.groupName, obj)
          })
          this.billingProfitData = Array.from(groupNameMap.values())
        } else {
          this.billingProfitData = []
        }
      } catch (error) {
        console.error(error)
        throw error.message
      }
    },
    routeTo (to) {
      this.$router.push(to)
    },
    /**
     * 그리드 하단 합계 row에 들어갈 데이터를 만듭니다.
     */
    init (grid) {
      if (!grid) return

      if (this.currentTab === 'claim') this.claimGrid = grid
      else this.profitGrid = grid

      // 청구 금액 (모든 데이터 센터 합)
      this.totalData.claimPrice = this.$options.filters.locale(this.totalData.price) +
        '(' +
        this.$options.filters.localeSign(this.totalData.price - this.totalData.beforePrice) +
        ')'

      // 데이터 센터별 금액 합
      this.dataCenter.forEach(d => {
        if (!this.totalData[d.cateKey]) this.totalData[d.cateKey] = {}

        const target = this.totalData[d.cateKey]

        target.price = target.price || 0
        target.beforePrice = target.beforePrice || 0
        target.distribute = target.distribute || 0

        // 총 금액 합 (데이터 센터별)
        this.totalData[d.cateKey + '_price'] = this.$options.filters.locale(target.price) +
          '(' +
          this.$options.filters.localeSign(
            target.price - target.beforePrice
          ) +
          ')'

        // 총 금액 - 공통배분 금액 (데이터 센터별)
        this.totalData[d.cateKey + '_price_a'] = this.$options.filters.locale(target.price) +
          '(' +
          this.$options.filters.localeSign(
            target.price - target.beforePrice - target.distribute
          ) +
          ')'

        // 공통배분 금액 (데이터 센터별)
        this.totalData[d.cateKey + '_price_common'] = this.$options.filters.locale(target.distribute) +
          '(' +
          this.$options.filters.localeSign(
            this.processDistribute(target.beforeDist, target.distribute)
            // target.distribute - target.beforeDist
          ) +
          ')'

        // 퍼센트 (데이터 센터별)
        this.totalData[d.cateKey + '_percent'] = this.$options.filters.percentAndRound(
          target.price, 0, this.totalData.price
        )
      })

      grid.columnFooters.rows.splice(0, 1, new wjGrid.GroupRow())
      grid.columnFooters.rows[0].dataItem = this.totalData
      grid.columnFooters.rows[0].cssClassAll = 'align-right'
      grid.columnFooters.rows[0].cssClass = 'align-center'
      grid.columnFooters.rows.defaultSize = 42

      grid.columnHeaders.columns.map((col, idx) => {
        col.cssClass = idx ? 'align-right' : 'align-left'
        return col
      })
    }
  },
  data () {
    return {
      isGetLoading: false,
      groupList: [],
      selectGroup: null,
      totalData: { ownerCompany: this.$t('bill.total') },
      dataCenter: [],
      // grid: null,
      claimGrid: null,
      profitGrid: null,
      claimDate: dayjs().subtract(1, 'month'),
      profitDate: dayjs().subtract(1, 'month'),
      tabData: [
        { field: 'claim', name: '청구', isActive: true, keyPath: 'bill.claim' },
        { field: 'profit', name: '계리', keyPath: 'bill.act' }
      ],
      currentTab: 'claim',
      networkHeaderMergeColumns: {
        claim: {
          colSpan: null,
          rowSpan: ['ownerCompany', 'claimPrice']
        },
        profit: {
          colSpan: null,
          rowSpan: ['groupName', 'claimPrice']
        }
      },
      billingTotalColumns: {
        claim: [],
        profit: []
      },
      billingGridData: [],
      billingProfitData: []
    }
  }
}
</script>
<style lang="scss" scoped>
.billing-status {
  .header {
    margin-bottom: $gap;
    display: flex;
    // justify-content: space-between;
    justify-content: flex-end;
    align-items: center;
    .title {
      display: flex;
      height: 17px;
      h5 {
        font-size: 18px;
        font-weight: 500;
        line-height: 17px;
        letter-spacing: -0.9px;
        color: $white;
      }
    }
    .-unit {
      text-align: right;
      color: $input-placeholder;
      font-size: 12px;
    }
  }
}
</style>

<style lang="scss">
.billing-status {
  .status-picker {
    align-self: center;
    margin-left: $gap-s;
    &.el-date-editor {
      .el-input__inner {
        cursor: pointer;
        border: none;
      }
    }
  }
}

.align-left {
  text-align: left;
  padding: 0 $gap-m;
}
.align-right {
  text-align: right;
  padding: 0 $gap-m;
}

// -----
.wj-header {
  &.wj-cell {
    &.align-right {
      text-align: right;
      padding: 0 $gap-m;
      line-height: 40px;
    }
  }
}
.wj-cells {
  .wj-cell {
    &.align-left {
      justify-content: flex-start;
      padding: 0 $gap-m;
    }
    &.align-right {
      div { text-align: right }
      justify-content: flex-end;
      padding: 0 $gap-m;
    }
  }
}
</style>
