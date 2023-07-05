<template>
  <div class="compare-stack">
    <div
      v-for="(item, itemIdx) in convertStackItems"
      :key="item.date"
      class="compare-stack-item"
    >
      <div class="compare-stack-item__date">
        {{ item.date }}
      </div>
      <div
        class="compare-stack-item__bar"
        :class="availableTransition && 'transition'"
        :style="{ width: `calc(${(itemIdx === 0 ? startBarPercent : endBarPercent)}% / 1.7)` }"
      >
        <el-tooltip
          v-for="(bar, barIdx) in item.value"
          :key="bar.label"
          effect="light"
          placement="top"
          popper-class="shade-popper"
        >
          <div
            v-if="bar.percent > 0"
            class="compare-stack-item__bar-item"
            :style="{ width: `${bar.percent}%`, '--stack-color': palette.compare[barIdx] }"
          />
          <div slot="content">
            <div
              class="tooltip-title"
              style="text-align: left;"
            >
              <strong>{{ bar.label }}</strong>
              <div>
                <span v-if="$billBoard.boardType === 'aws'">
                  $
                </span>
                {{ bar.value | moneyFormat }}<span v-if="$billBoard.boardType !== 'aws'">원</span> ({{ bar.percent }}%)
              </div>
            </div>
          </div>
        </el-tooltip>
      </div>
      <div
        class="compare-stack-item__price"
        :style="{ '--stack-text-color': palette.text }"
      >
        <span v-if="$billBoard.boardType === 'aws'">
          $
        </span>
        {{ item.sum | moneyFormat }}<span v-if="$billBoard.boardType !== 'aws'">원</span>
      </div>
    </div>
    <div class="compare-stack-labels">
      <billing-chart-labels
        :items="allLabels"
        :palette="palette.compare"
      />
    </div>
  </div>
</template>

<script>
import { cloneDeep } from 'lodash'
import { BillingChartLabels } from '@sd-fe/cmp-core'

export default {
  name: 'CompareMultiStack',
  components: {
    BillingChartLabels
  },
  inject: ['$billBoard'],
  props: {
    /** @type {import('Vue').PropType<string | number | null>} */
    selectedRegion: {
      type: [String, Number],
      required: true
    },
    /** @type {import('Vue').PropType<string>} */
    startDate: {
      type: String,
      required: true
    },
    /** @type {import('Vue').PropType<string>} */
    endDate: {
      type: String,
      required: true
    },
    /**
     * 두 컬러 색상
     * @type {import('Vue').PropType<{ normal: string[]; compare: string[]; text: string }>}
     */
    palette: {
      type: Object,
      required: true
    }
  },
  watch: {
    stackItems: {
      deep: true,
      immediate: true,
      handler: 'calculateBarWidth'
    }
  },
  computed: {
    allLabels () {
      if (!this.convertStackItems.length) return []

      if (this.convertStackItems[0] || this.convertStackItems[1]) {
        return (this.convertStackItems[0] || this.convertStackItems[1]).value.map(service => ({ label: service.label }))
      } else {
        return []
      }
    },
    /**
     * 시작일 리전 데이터 조회
     * 종료일 리전 데이터 조회
     */
    stackItems () {
      if (!this.selectedRegion) return []

      const defaultData = (date) => ({
        date,
        region: this.selectedRegion,
        value: this.privateResourceLabel.map(label => ({ label, value: 0 }))
      })

      const regionBillData = this.$billBoard.billData.regions
      const startDateRegionData = regionBillData
        .filter(region => region.region === this.selectedRegion)
        .find(region => region.date === this.startDate)
      const endDateRegionData = regionBillData
        .filter(region => region.region === this.selectedRegion)
        .find(region => region.date === this.endDate)

      return [
        startDateRegionData || defaultData(this.startDate),
        endDateRegionData || defaultData(this.endDate)
      ]
    }
  },
  beforeDestroy () {
    this.availableTransition = false
  },
  methods: {
    /**
     * 컴포넌트 전체 입장에서 2개의 외부 바는 각각 4개의 내부 바를 가진다.
     * 외부 바 2개가 얼마 만큼의 width를 가질지, 내부의 바는 얼마 만큼의 width를 가져야 하는지
     * 계산한다.
     */
    calculateBarWidth () {
      if (!this.stackItems.every(Boolean)) return

      this.availableTransition = false

      this.startBarPercent = 0
      this.endBarPercent = 0

      const startDateRegion = cloneDeep(this.stackItems[0])
      const endDateRegion = cloneDeep(this.stackItems[1])

      let startSum = 0 // 시작일 리전 합계
      let endSum = 0 // 종료일 리전 합계

      if (startDateRegion) {
        startSum = startDateRegion.value.reduce((acc, cur) => acc + (cur.value || 0), 0)
      }

      if (endDateRegion) {
        endSum = endDateRegion.value.reduce((acc, cur) => acc + (cur.value || 0), 0)
      }

      // 포매팅된 퍼센트를 리턴한다.
      // 정수형태면 그대로 리턴하고, 소수 형태면 최대 2자리까지만 표현하도록 노출한다.
      const getPercent = (num) => Number.isInteger(num) ? num : Number((num || 0).toFixed(2))

      // 내부 바가 몇 %의 width를 가지는지 계산한다.
      startDateRegion.value = startDateRegion.value.map(
        service => ({ ...service, percent: getPercent((service.value / startSum) * 100) })
      )

      endDateRegion.value = endDateRegion.value.map(
        service => ({ ...service, percent: getPercent((service.value / endSum) * 100) })
      )

      // 총합
      this.$set(startDateRegion, 'sum', startSum)
      this.$set(endDateRegion, 'sum', endSum)

      this.convertStackItems = [startDateRegion, endDateRegion]

      setTimeout(() => {
        requestAnimationFrame(() => {
          this.availableTransition = true

          if (startSum > endSum) {
            this.startBarPercent = 100
            this.endBarPercent = Math.floor((endSum / startSum) * 100)
          } else if (endSum > startSum) {
            this.endBarPercent = 100
            this.startBarPercent = Math.floor((startSum / endSum) * 100)
          } else {
            // this.startBarPercent = 100
            // this.endBarPercent = 100
            // 둘다 0인 경우
            this.startBarPercent = 0
            this.endBarPercent = 0
          }
        })
      }, 250)
    }
  },
  data: () => ({
    privateResourceLabel: ['H/W', 'S/W', '회선', '소산'],
    startBarPercent: 0,
    endBarPercent: 0,
    convertStackItems: [],
    availableTransition: false
  })
}
</script>

<style lang="scss" scoped>
.compare-stack {
  & > * + * {
    margin-top: $gap-m;
  }

  &-item {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: space-between;

    & > * + * {
      margin-left: 5px;
    }

    &__date {
      flex: 0 0 20%;
    }

    &__bar {
      height: 30px;
      display: flex;
      flex-wrap: nowrap;

      &.transition {
        transition: width 0.35s ease-out;
      }

      & > :first-child {
        border-top-left-radius: 4px;
        border-bottom-left-radius: 4px;
      }

      & > :last-child {
        border-top-right-radius: 4px;
        border-bottom-right-radius: 4px;
      }

      &-item {
        height: 100%;
        background-color: var(--stack-color);
      }
    }

    &__price {
      flex: 0 1 20%;
      white-space: pre;
      padding-left: 5px;
      margin-left: auto;
      color: var(--stack-text-color);
    }
  }

  &-labels {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 15px;
  }
}
</style>
