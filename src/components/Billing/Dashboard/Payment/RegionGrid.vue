<template>
  <div class="region-grid">
    <el-select
      v-if="$billBoard.boardType !== 'aws'"
      v-model="selectedRegion"
      class="region-grid-select"
      popper-class="region-grid-select-popper"
    >
      <el-option
        v-for="option in regionOptions"
        :key="option.value"
        :label="option.label"
        :value="option.value"
      />
    </el-select>
    <cmp-grid
      :use-column-filter="false"
      :columns="gridColumns"
      :item-source="gridData"
    >
      <template
        v-if="tabBoardType === 'monthly'"
        #value="{ row }"
      >
        <span v-if="$billBoard.boardType === 'aws'">$</span>
        {{ (row.value || 0) | moneyFormat }}<span v-if="$billBoard.boardType !== 'aws'">원</span>
      </template>
      <template
        v-if="tabBoardType === 'compare'"
        #[getDateByLocale($bill.startDate)]="{ row }"
      >
        <span v-if="$billBoard.boardType === 'aws'">$</span>
        {{ (row[getDateByLocale($bill.startDate)] || 0) | moneyFormat }}<span v-if="$billBoard.boardType !== 'aws'">원</span>
      </template>
      <template
        v-if="tabBoardType === 'compare'"
        #[getDateByLocale($bill.endDate)]="{ row }"
      >
        <span v-if="$billBoard.boardType === 'aws'">$</span>
        {{ (row[getDateByLocale($bill.endDate)] || 0) | moneyFormat }}<span v-if="$billBoard.boardType !== 'aws'">원</span>
      </template>
      <template
        v-if="tabBoardType === 'compare'"
        #compare="{ row }"
      >
        <div :class="[row.compare > 0 ? 'compare-blue' : row.compare === 0 ? 'compare-normal' : 'compare-red']">
          <i
            v-if="row.compare < 0"
            class="mdi mdi-arrow-down"
          />
          <i
            v-if="row.compare > 0"
            class="mdi mdi-arrow-up"
          />
          <span v-if="$billBoard.boardType === 'aws'">$</span>
          {{ (row.compare || 0) | abs | moneyFormat }}<span v-if="$billBoard.boardType !== 'aws'">원</span>
        </div>
      </template>
    </cmp-grid>
  </div>
</template>

<script>
import dayjs from 'dayjs'
import { flatten } from 'lodash'

export default {
  name: 'RegionGrid',
  inject: ['$bill', '$billBoard'],
  props: {
    /**
     * 보드 타입 (월별, 비교)
     * @type {import('Vue').PropType<string>}
     */
    tabBoardType: {
      type: String,
      required: true,
      validator (value) {
        return ['monthly', 'compare'].includes(value)
      }
    }
  },
  filters: {
    abs (value) {
      return Math.abs(value) || 0
    }
  },
  computed: {
    regionOptions () {
      return !this.$billBoard.billData
        ? []
        // : this.$billBoard.billData.regions.map(region => ({ label: region.region, value: region.region }))
        : [...new Set(this.$billBoard.billData.regions.map(region => region.region))].map(region => ({ label: region, value: region }))
    },
    gridColumns () {
      return (this.$bill.activeTab === 'monthly'
        ? [
          { binding: 'label', header: '구분' },
          {
            binding: 'value',
            header: this.getDateByLocale(this.$bill.monthly),
            customHtml: true
          }
        ]
        : [
          { binding: 'label', header: '구분', width: '0.7*' },
          {
            binding: this.getDateByLocale(this.$bill.startDate),
            header: this.getDateByLocale(this.$bill.startDate),
            customHtml: true,
            width: '1.2*'
          },
          {
            binding: this.getDateByLocale(this.$bill.endDate),
            header: this.getDateByLocale(this.$bill.endDate),
            customHtml: true,
            width: '1.2*'
          },
          { binding: 'compare', header: '이전 대비', customHtml: true, width: '1.5*' }
        ]
      ).map(column => ({ ...column, allowResizing: false }))
    },
    /**
     * 그리드 데이터
     * 월별 탭인 경우, 같은 리전의 같은 날짜의 데이터를 리턴한다.
     * 비교 탭인 경우, 같은 리전의 시작일, 종료일 데이터를 불러와
     * 데이터의 키를 날짜 형태로 변환해서 리턴한다. { '9월': 20000 }
     */
    gridData () {
      // 데이터 구성이 다를 걸 대비해서 AWS와 나눔
      if (this.$billBoard.boardType !== 'aws') {
        const regionBillData = this.$billBoard.billData.regions.filter(
          region => region.region === this.selectedRegion
        )

        // 월별
        if (this.$bill.activeTab === 'monthly') {
          const findDateRegionBillData = regionBillData.find(
            region => region.date === dayjs(this.$bill.monthly).format('YYYY-MM')
          )
          return findDateRegionBillData
            ? findDateRegionBillData.value.map(val => ({
              label: val.label,
              value: val.value
            }))
            : []
        } else {
          if (!regionBillData.length) return []

          const startDate = dayjs(this.$bill.startDate).format('YYYY-MM')
          const endDate = dayjs(this.$bill.endDate).format('YYYY-MM')
          let services = []

          const findBillData = regionBillData.map(region => {
            const copy = { ...region }
            copy.value = copy.value.map(val => {
              services.push(val.label)
              return { ...val, date: region.date }
            })
            return copy
          })

          const values = flatten(findBillData.map(region => region.value))
          services = [...new Set(services)]

          return services
            .map(service => ({
              label: service,
              [this.getDateByLocale(startDate)]: (
                values.find(
                  value => value.date === startDate && value.label === service
                ) || {}
              ).value,
              [this.getDateByLocale(endDate)]: (
                values.find(
                  value => value.date === endDate && value.label === service
                ) || {}
              ).value,
              startDateName: this.getDateByLocale(startDate),
              endDateName: this.getDateByLocale(endDate)
            }))
            .map(data => ({
              ...data,
              compare: (data[data.endDateName] || 0) - (data[data.startDateName] || 0)
            }))
        }
      } else {
        if (this.$bill.activeTab === 'monthly') {
          // 필터링할 월을 format 형태로 할당한다.
          const targetDate = dayjs(this.$bill.monthly).format('YYYY-MM')
          // 모든 리전의 데이터
          const regionData = this.$billBoard.billData.regions
          // 리전 데이터 필터링
          const billDataByDate = regionData.filter(region => region.date === targetDate)
          // TOP 4 데이터 정렬
          billDataByDate.sort((a, b) => b.value - a.value)

          const topData = billDataByDate.slice(0, 4).map(region => ({ label: region.displayName, value: region.value }))
          const restData = billDataByDate.slice(4)
          // 나머지 데이터들 합
          const restSum = restData.reduce((acc, cur) => acc + cur.value, 0)

          // 나머지 데이터 노출
          topData.push({
            label: '기타',
            value: restSum
          })

          return topData.map(data => ({
            value: data.value,
            label: data.label
          }))
        } else {
          const startDate = dayjs(this.$bill.startDate).format('YYYY-MM')
          const endDate = dayjs(this.$bill.endDate).format('YYYY-MM')

          // 모든 리전의 데이터
          const regionData = this.$billBoard.billData.regions

          // 시작일 데이터
          const regionByStartData = regionData
            .filter(region => region.date === startDate)
            .map(region => ({ ...region, label: region.displayName, value: region.value }))
          // 종료일 데이터
          const regionByEndData = regionData
            .filter(region => region.date === endDate)
            .map(region => ({ ...region, label: region.displayName, value: region.value }))

          regionByEndData.sort((a, b) => b.value - a.value)

          // TOP 4 데이터
          const topEndData = regionByEndData.slice(0, 4).map(data => ({ ...data, label: data.displayName, value: data.value }))
          // 시작일 데이터는 종료일 데이터를 기준으로 찾음
          const topStartData = topEndData.map(endData => {
            const findRegion = regionByStartData.find(region => region.label === endData.label)
            if (findRegion) {
              return {
                label: findRegion.label,
                value: findRegion.value
              }
            } else {
              return {
                label: endData.label,
                value: 0
              }
            }
          })

          return topEndData.map(endData => {
            const findStart = topStartData.find(start => start.label === endData.label)
            const data = {
              label: endData.label,
              [this.getDateByLocale(startDate)]: findStart ? findStart.value : 0,
              [this.getDateByLocale(endDate)]: endData.value
            }
            data.compare = data[this.getDateByLocale(endDate)] - data[this.getDateByLocale(startDate)]
            return data
          })
        }
      }
    }
  },
  methods: {
    getDateByLocale (date) {
      return this.$i18n.locale === 'ko'
        ? dayjs(date).format('M월')
        : dayjs(date).format('MMM')
    }
  },
  watch: {
    selectedRegion (region) {
      this.$emit('update:selected-region', region)
    }
  },
  created () {
    if (this.$billBoard.boardType !== 'aws' && this.regionOptions.length) {
      this.selectedRegion = this.regionOptions[0].value
    }
  },
  data: () => ({
    selectedRegion: null
    // regionOptions: []
  })
}
</script>

<style lang="scss" scoped>
.region-grid {
  &-select {
    display: block;
    margin-left: auto;
    margin-bottom: $gap-s;
    max-width: 290px;
    background-color: #1F2341;

    &::v-deep {
      .el-input__inner,
      .el-input__inner:focus {
        height: 40px;
        line-height: 20px;
        border: none !important;
        background-color: #0A0C1F !important;
        color: $white !important;
      }

      .el-select__caret {
        height: 40px !important;
        color: $white !important;
      }
    }
  }

  &::v-deep {
    .cmp-grid-wrapper .empty-data {
      margin-top: 80px;
      justify-content: flex-start;
    }

    .cmp-grid-wrapper {
      .wj-header.wj-cell {
        background-color: #41466A;
      }
    }
  }

  .compare-blue {
    color: $primary;
  }

  .compare-red {
    color: $main-red;
  }

  .compare-blue,
  .compare-red {
     .mdi {
      display: inline-block;

      &::before {
        font-size: 16px;
      }
    }
  }
}
</style>

<style lang="scss">
.region-grid-select-popper {
  background-color: transparent !important;
  border: none !important;

  .el-select-dropdown__empty {
    border-top: 2px solid transparent !important;
    background-color: #101222 !important;
  }

  .el-select-dropdown__wrap {
    border-top: 2px solid transparent !important;

    .el-select-dropdown__list {
      background-color: #101222 !important;

      .el-select-dropdown__item {
        box-sizing: border-box !important;
        margin: 10px !important;
        padding: 4px 15px !important;
        height: auto !important;
        width: calc(100% - 20px) !important;
        border-radius: 10px !important;

        &.selected {
          background-color: #282D54 !important;
          color: $white !important;

          span { color: $white !important; }
        }

        &.hover:not(.selected) {
          background-color: darken(#282D54, 7%) !important;
          color: darken($white, 5%) !important;
        }
      }
    }
  }
}
</style>
