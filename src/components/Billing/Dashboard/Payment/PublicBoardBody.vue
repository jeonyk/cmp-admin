<template>
  <article
    class="pbb"
    :class="{ [boardType]: true }"
    :style="{ '--main-color': mainColor }"
  >
    <section class="pbb-summary">
      <section class="pbb-title">
        {{ showExpectBillText() }} {{ $v('청구 금액') }}
      </section>
      <section class="pbb-summary-body">
        <div class="pbb-summary-body__total">
          <span class="pbb-summary-body__total-unit">$</span>
          {{ $billBoard.billData.totalPrice | moneyFormat }}
        </div>
        <div class="pbb-summary-body__compare">
          <span
            v-if="$bill.activeTab === 'monthly'"
            class="pbb-summary-body__compare-text"
          >
            {{ $v('전월대비') }}
          </span>
          <span
            v-else
            class="pbb-summary-body__compare-text"
          >
            {{ $v('이전대비') }}
          </span>
          <i
            v-if="$billBoard.billData.comparePrevMonth > 0"
            class="mdi mdi-arrow-up"
          />
          <i
            v-if="$billBoard.billData.comparePrevMonth < 0"
            class="mdi mdi-arrow-down"
          />
          <span class="pbb-summary-body__compare-unit">
            $
          </span>
          <span class="pbb-summary-body__compare-price">
            {{ $billBoard.billData.comparePrevMonth | abs | moneyFormat }}
          </span>
        </div>
        <div class="pbb-summary-body__price">
          <div class="pbb-summary-body__price-claim">
            <span class="pbb-summary-body__price-claim-text">
              {{ showExpectBillText() }} {{ $v('청구 금액') }}
            </span>
            <span class="pbb-summary-body__price-claim-unit">
              $
            </span>
            <span class="pbb-summary-body__price-claim-price">
              {{ $billBoard.billData.amountPrice | moneyFormat }}
            </span>
          </div>
          <!-- AWS는 보정이 없습니다 -->
          <!-- <div class="pbb-summary-body__price-corr">
            <span class="pbb-summary-body__price-corr-text">
              보정 금액
            </span>
            <span class="pbb-summary-body__price-corr-unit">
              $
            </span>
            <span class="pbb-summary-body__price-corr-price">
              {{ $billBoard.billData.correctionPrice | moneyFormat }}
            </span>
          </div> -->
        </div>
      </section>
    </section>
    <!-- 청구 금액 -->
    <section class="pbb-compare">
      <section
        class="pbb-title"
        :style="{ marginBottom: '60px' }"
      >
        {{ showExpectBillText() }} {{ $v('청구 금액 비교') }}
      </section>
      <section class="pbb-compare-body">
        <compare-stack
          :start-date="boardType === 'monthly' ? prevMonth : currentMonth"
          :end-date="boardType === 'monthly' ? currentMonth : prevMonth"
          :start-price="$billBoard.billData.prevMonthPrice"
          :end-price="$billBoard.billData.totalPrice"
          :palette="{
            normal: stackPalette,
            compare: comparePalette,
            text: compareStackTextColor
          }"
        />
      </section>
    </section>
    <!-- 청구 금액 비교 -->
    <section :class="boardType === 'compare' ? 'pbb-stack' : 'pbb-pie'">
      <section
        class="pbb-title"
        :style="{ marginBottom: '20px' }"
      >
        리전별 {{ showExpectBillText() }} 청구 금액
      </section>
      <section
        class="pbb-region"
      >
        <service-pie-chart
          :selected-region="selectedRegion"
        />
      </section>
    </section>
    <!-- 리전별 청구 금액 -->
    <section
      class="pbb-grid"
      :style="{ marginTop: '20px' }"
    >
      <region-grid
        :tab-board-type="boardType"
      />
    </section>
    <!-- 리전별 그리드 -->
  </article>
</template>

<script>
/**
 * @typedef {{ label: string; value: number }} StackBarData
 */
// import CompareMultiStack from './CompareMultiStack.vue'
import CompareStack from './CompareStack.vue'
import RegionGrid from './RegionGrid.vue'
import ServicePieChart from './ServicePieChart.vue'
import dayjs from 'dayjs'

export default {
  name: 'PublicBoardBody',
  components: {
    // CompareMultiStack,
    CompareStack,
    RegionGrid,
    ServicePieChart
  },
  filters: {
    abs (value) { return Math.abs(value) }
  },
  inject: ['$bill', '$billBoard'],
  props: {
    /**
     * 보드 타입 (월별, 비교)
     * @type {import('Vue').PropType<string>}
     */
    boardType: {
      type: String,
      required: true,
      validator (value) {
        return ['monthly', 'compare'].includes(value)
      }
    },
    /**
     * 이번 달 청구 금액
     * boardType === 'compare' 일 때는 시작일 청구 금액
     * @type {import('Vue').PropType<number>}
     */
    currentMonthPay: {
      type: Number,
      default: 0
    },
    /**
     * 이전 달 청구 금액
     * boardType === 'compare' 일 때는 종료일 청구 금액
     * @type {import('Vue').PropType<number>}
     */
    prevMonthPay: {
      type: Number,
      default: 0
    },
    /**
     * 이번 달 포매팅된 Date
     * boardType === 'compare' 일 때는 시작일
     * i.e.) 2023-01
     * @type {import('Vue').PropType<string>}
     */
    currentMonth: {
      type: String,
      default: ''
    },
    /**
     * 저번 달 포매팅된 Date
     * boardType === 'compare' 일 때는 종료일
     * i.e.) 2023-01
     * @type {import('Vue').PropType<string>}
     */
    prevMonth: {
      type: String,
      default: ''
    },
    /**
     * 비교형 Palette
     * @type {import('Vue').PropType<[string, string]>}
     */
    comparePalette: {
      type: Array,
      required: true
    },
    /**
     * 스택형 Palette
     * @type {import('Vue').PropType<[string, string, string, string]>}
     */
    stackPalette: {
      type: Array,
      required: true
    },
    /**
     * 메인 컬러
     * @type {import('Vue').PropType<string>}
     */
    mainColor: {
      type: String,
      default: ''
    },
    /**
     * 비교 바 텍스트 컬러
     * @type {import('Vue').PropType<string>}
     */
    compareStackTextColor: {
      type: String,
      default: ''
    }
  },
  computed: {
    /**
     * 필터링 하는 날짜에 현재 날짜가 껴있는 경우
     */
    isSetFilterCurrent () {
      const current = dayjs(new Date()).format('YYYY-MM')

      if (this.$bill.activeTab === 'monthly') {
        // 월별
        return current === dayjs(new Date(this.$bill.monthly)).format('YYYY-MM')
      } else {
        // 비교
        return current === this.$bill.formattedStartDate ||
            current === this.$bill.formattedEndDate
      }
    }
  },
  methods: {
    showExpectBillText () {
      return this.isSetFilterCurrent
        ? this.$v('예상')
        : ''
    }
  },
  data: () => ({
    selectedRegion: null
  })
}
</script>

<style lang="scss" scoped>
.pbb {
  align-items: flex-start;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  padding: 30px;

  &.monthly {
    .pbb-grid {
      flex: 0 0 30%;
    }
  }

  &.compare {
    .pbb-grid {
      flex: 1 0 25%;
    }
  }

  & > * {
    box-sizing: border-box;
    min-height: 250px;
  }

  &-title {
    font-size: 18px;
    margin-bottom: 40px;
  }

  &-summary {
    flex: 0 0 21%;

    &-body {
      &__total {
        color: var(--main-color);
        font-size: 40px;
        font-weight: bold;
        margin-bottom: $gap-s;

        &-unit {
          font-size: 15px;
          color: $white;
        }
      }

      &__compare {
        font-size: 15px;

        &-text {
          margin-right: $gap-s;
        }

        .mdi {
          display: inline-block;

          &.mdi-arrow-down {
            color: $main-red;
          }
          &.mdi-arrow-up {
            color: $primary;
          }

          &::before {
            font-size: 16px;
          }
        }
      }

      &__price {
        margin-top: 50px;
        font-size: 15px;
        line-height: 1.75;

        &-claim,
        &-corr {
          &-text {
            margin-right: $gap-s;
          }
        }
      }
    }
  }

  &-compare {
    flex: 0 0 27%;
    padding: 0 50px;
    border-left: 1px solid rgba(51, 57, 95, 1);
    border-right: 1px solid rgba(51, 57, 95, 1);
    position: relative;

    &::before,
    &::after {
      content: "";
      display: block;
      position: absolute;
      width: 1px;
      height: 100%;
      background-color: rgba(17, 19, 38, 1);
    }

    &::before {
      left: 0;
    }

    &::after {
      top: 0;
      right: -2px;
    }
  }

  &-stack,
  &-pie {
    padding: 0 20px 0 50px;
  }

  &-stack {
    flex: 0 0 15%;
  }

  &-pie {
    flex: 0 0 20%;
  }
}
</style>
