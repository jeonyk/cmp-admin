<!--
  * 파일명 : BillingDashboard.vue
  * 파일 기능 : [빌링 > 대시보드] 컴포넌트입니다. 월별 / 비교 등의 데이터를 이용하여 차트를 입력합니다.
  * 작성자 : 김예담 외 4명
  * 최종 작성일 : 2021-01-04
  * License By Shinsegae I&C
  * 2021-01-04 fix: 자잘한 css 수정
 -->

<template>
  <div class="billing-dashboard">
    <filtering-component @reset-data="e => {selectGroup = null}">
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
    </filtering-component>

    <panel-board :title="$t('bill.monthlyBill')">
      <article class="board-conts">
        <div class="current-value flex-wrap -space-between">
          <el-radio-group
            class="radio-switch-group"
            v-model="monthlyBill.name"
            :style="{ width: $i18n.locale === 'en' ? '200px' : '130px' }"
          >
            <el-radio-button
              :label="$t('bill.monthly')"
              :style="{ width: $i18n.locale === 'en' ? '100px' : '65px' }"
            />
            <el-radio-button
              :label="$t('bill.compare')"
              :style="{ width: $i18n.locale === 'en' ? '100px' : '65px' }"
            />
          </el-radio-group>
          <div
            class="chart-options date-picker -top"
            style="width: 100px;"
            v-if="monthlyBill.name === $t('bill.monthly')"
          >
            <el-date-picker
              key="current-date-picker"
              v-model="monthlyBill.currentDate"
              type="month"
              size="mini"
              format="yyyy.MM"
              value-format="yyyy-MM"
              :clearable="false"
              placeholder="YYYY.MM"
            />
          </div>

          <div
            class="chart-options date-picker -top"
            v-if="monthlyBill.name === $t('bill.compare')"
          >
            <el-date-picker
              v-model="monthlyBill.startDate"
              type="month"
              size="mini"
              format="yyyy.MM"
              value-format="yyyy-MM"
              :clearable="false"
              placeholder="YYYY.MM"
              :picker-options="monthlyBill.startPickerOptions"
            />
            <span>&#38;</span>
            <el-date-picker
              v-model="monthlyBill.endDate"
              type="month"
              size="mini"
              format="yyyy.MM"
              value-format="yyyy-MM"
              :clearable="false"
              placeholder="YYYY.MM"
              :picker-options="monthlyBill.endPickerOptions"
            />
          </div>
        </div>

        <monthly-bill
          v-if="monthlyBill.startDate && monthlyBill.endDate && monthlyBill.currentDate && isLoadedDataCenter"
          :status="monthlyBill.name"
          :start-date="monthlyBill.startDate"
          :end-date="monthlyBill.endDate"
          :current-date="monthlyBill.currentDate"
          :owner-company-idx.sync="selectGroup"
          :data-center="dataCenter"
        />
      </article>
    </panel-board>
    <!-- /. 월별 청구금액 -->

    <panel-board :title="$t('bill.monthlyBillTrend')">
      <article class="board-conts">
        <div class="current-value flex-wrap -space-between">
          <el-radio-group
            class="radio-switch-group -month-status"
            v-model="monthlyStatus.name"
          >
            <el-radio-button :label="$t('main.DASHBOARD.all')" />
            <el-radio-button
              v-for="center in dataCenter"
              :key="center.cateKey"
              :label="center.cateKey"
            >
              <el-tooltip
                :disabled="center.cateKey.length < 5"
                effect="light"
              >
                <span>
                  {{ center.cateKey | splitCenterName }}
                </span>
                <div slot="content">
                  {{ center.cateKey }}
                </div>
              </el-tooltip>
            </el-radio-button>
            <!-- <el-radio-button label="송도" /> -->
          </el-radio-group>

          <div class="chart-options date-picker">
            <el-date-picker
              v-model="monthlyStatus.startDate"
              type="month"
              size="mini"
              format="yyyy.MM"
              :clearable="false"
              placeholder="Start M"
              :picker-options="monthlyStatus.startPickerOptions"
            />
            <span>~</span>
            <el-date-picker
              v-model="monthlyStatus.endDate"
              type="month"
              size="mini"
              format="yyyy.MM"
              :clearable="false"
              placeholder="End M"
              :picker-options="monthlyStatus.endPickerOptions"
            />
          </div>
        </div>

        <monthly-payment-status
          v-if="monthlyStatus.startDate && monthlyStatus.endDate && dataCenter.length"
          :status="monthlyStatus.name"
          :start-date="statusStartDate"
          :end-date="statusEndDate"
          :owner-company-idx.sync="selectGroup"
          :data-center="dataCenter"
        />
      </article>
    </panel-board>
    <!-- /. 월별 청구 추세 -->
  </div>
</template>

<script>
import API, { PanelBoard, FilteringComponent } from '@sd-fe/cmp-core'
import MonthlyBill from './MonthlyBill'
import MonthlyPaymentStatus from './MonthlyPaymentStatus'
import Dayjs from 'dayjs'

export default {
  name: 'BillingDashboard',
  components: {
    FilteringComponent,
    'panel-board': PanelBoard,
    'monthly-bill': MonthlyBill,
    'monthly-payment-status': MonthlyPaymentStatus
  },
  filters: {
    splitCenterName (value) {
      return value.length > 4 ? value.slice(0, 4) + '...' : value
    }
  },
  computed: {
    // 월별 청구 추세 시작
    statusStartDate () {
      return Dayjs(new Date(this.monthlyStatus.startDate)).format('YYYY-MM')
    },
    // 월별 청구 추세 종료
    statusEndDate () {
      return Dayjs(new Date(this.monthlyStatus.endDate)).format('YYYY-MM')
    }
  },
  watch: {
    '$i18n.locale' (changed) {
      // 언어가 바뀌면 Radio 값도 바꿉니다.
      const isMonthly = [this.$t('bill.monthly', 'ko'), this.$t('bill.monthly', 'en')].includes(this.monthlyBill.name)
      this.monthlyBill.name = isMonthly ? this.$t('bill.monthly') : this.$t('bill.compare')

      // 월별 청구 추세가 전체 타입일 경우
      if (['전체', 'All'].includes(this.monthlyStatus.name)) {
        this.monthlyStatus.name = this.$t('main.DASHBOARD.all', changed)
      }
    },
    'monthlyBill.startDate' (d) {
      this.setStartPickerOptions('monthlyBill')
    },
    'monthlyBill.endDate' (d) {
      this.setEndPickerOptions('monthlyBill')
    },
    'monthlyStatus.startDate' (d) {
      this.monthlyStatus.startDate = this.$options.filters.date(new Date(d), 'YYYY-MM-DD')
      this.setEndPickerOptions()
    },
    'monthlyStatus.endDate' (d) {
      this.monthlyStatus.endDate = this.$options.filters.date(new Date(d), 'YYYY-MM-DD')
      this.setStartPickerOptions()
    }

  },
  async created () {
    this.initDate()
    this.setPickerOptions()
    await this.getNetworkList()
    await this.getGroupList()
  },
  methods: {
    async getNetworkList () {
      try {
        this.isLoadedDataCenter = false
        this.dataCenter = await API.network.getNetworkCategory({ upperCategoryIdx: 0 })
      } catch (error) {
        console.error(error)
      } finally {
        this.isLoadedDataCenter = true
      }
    },
    setPickerOptions () {
      this.setStartPickerOptions()
      this.setStartPickerOptions('monthlyBill')
      this.setEndPickerOptions()
      this.setEndPickerOptions('monthlyBill')
    },
    /**
     * 월별 청구 추세/금액 시작일 date-picker 옵션
     */
    setStartPickerOptions (type = 'monthlyStatus') {
      this[type].startPickerOptions = {
        disabledDate: (date) => {
          return date > new Date(this[type].endDate)
        }
      }
    },
    /**
     * 월별 청구 추세/금액 종료일 date-picker 옵션
     */
    setEndPickerOptions (type = 'monthlyStatus') {
      this[type].endPickerOptions = {
        disabledDate: (date) => {
          return date < new Date(this[type].startDate)
        }
      }
    },
    initDate () {
      this.monthlyBill.startDate = Dayjs().subtract(2, 'month').format('YYYY-MM')
      this.monthlyBill.currentDate = Dayjs().subtract(1, 'month').format('YYYY-MM')
      this.monthlyBill.endDate = Dayjs().subtract(1, 'month').format('YYYY-MM')
      this.monthlyStatus.startDate = Dayjs().subtract(2, 'month').format('YYYY-MM')
      this.monthlyStatus.endDate = Dayjs().subtract(1, 'month').format('YYYY-MM')
    },
    async getGroupList () {
      const grouplist = await API.iam.getGroupList({ groupUpper: 0 })
      grouplist.unshift({ groupIdx: null, groupName: this.$t('main.DASHBOARD.all') })
      this.groupList = grouplist
    }
  },
  data () {
    return {
      isLoadedDataCenter: false,
      selectGroup: null,
      dataCenter: [],
      groupList: [],
      monthlyBill: { // 월별 청구금액
        name: this.$t('bill.monthly'),
        startDate: undefined,
        endDate: undefined,
        currentDate: undefined,
        startPickerOptions: null,
        endPickerOptions: null
      },
      monthlyStatus: { // 월별 청구 추세
        name: this.$t('main.DASHBOARD.all'),
        startDate: undefined,
        endDate: undefined,
        startPickerOptions: null,
        endPickerOptions: null
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.billing-dashboard {
  > div {
    &:first-child { margin: 0 }
    margin-top: 40px;
  }
  .current-value { margin-bottom: $gap; }
  .summary-condition {
    > div:first-child {
      margin-right: $gap;
    }
  }
}
</style>

<style lang="scss">
  .billing-dashboard {
    .chart-options {
      width: 140px;
      &.date-picker {
        width : 185px;
        border-bottom: 1px solid $gray;
        display: flex;
        align-items: center;
        > span {
          color: $light-gray;
        }
        > .el-input {
          width: 90px;
          .el-input__inner {
            padding: 0;
            padding-left: $gap-m;
            border: none;
          }
          &.no-icon {
            width: 70px;
            .el-input__prefix {
              display: none;
            }
            .el-input__inner {
              padding: 0;
              padding-left: $gap-s;
            }
          }
        }

        &.-top {
          width : 205px;
          > .el-input {
            width: 100px;
          }
          &.-single {
            width: 100px;
          }
        }
      }
      // ---
      .el-select {
        .el-input {
          .el-input__inner {
            border-radius: 0;
            border: none;
            border-bottom: 1px solid $input-stroke;
          }
        }
      }
    }
  }
</style>
