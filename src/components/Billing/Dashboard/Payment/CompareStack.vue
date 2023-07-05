<template>
  <div class="compare-stack">
    <div
      v-for="(item, itemIdx) in stackItems"
      :key="item.date"
      class="compare-stack-item"
      :style="{ '--stack-color': item.color }"
    >
      <div class="compare-stack-item__date">
        {{ item.date }}
      </div>
      <div class="compare-stack-item__bar">
        <div
          class="compare-stack-item__bar-item"
          :style="{ width: itemIdx === 0 ? `${startBarPercent}%` : `${endBarPercent}%` }"
        />
      </div>
      <div
        class="compare-stack-item__price"
        :style="{ '--stack-text-color': palette.text }"
      >
        <span v-if="$billBoard.boardType === 'aws'">
          $
        </span>
        {{ item.price | moneyFormat }}<span v-if="$billBoard.boardType !== 'aws'">원</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CompareStack',
  inject: ['$billBoard'],
  props: {
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
    },
    /**
     * 시작 금액
     * @type {import('Vue').PropType<number>}
     */
    startPrice: {
      type: Number,
      default: 0
    },
    /**
     * 종료 금액
     * @type {import('Vue').PropType<number>}
     */
    endPrice: {
      type: Number,
      default: 0
    }
  },
  computed: {
    stackItems () {
      return [
        {
          price: this.startPrice,
          date: this.startDate,
          color: this.palette.normal[0]
        },
        {
          price: this.endPrice,
          date: this.endDate,
          color: this.palette.normal[1]
        }
      ]
    }
  },
  mounted () {
    this.startBarPercent = 0
    this.endBarPercent = 0

    setTimeout(() => {
      requestAnimationFrame(() => {
        if (this.startPrice > this.endPrice) {
          this.startBarPercent = 100
          this.endBarPercent = Math.floor((this.endPrice / this.startPrice) * 100)
        } else if (this.endPrice > this.startPrice) {
          this.endBarPercent = 100
          this.startBarPercent = Math.floor((this.startPrice / this.endPrice) * 100)
        } else {
          // this.startBarPercent = 100
          // this.endBarPercent = 100
          // 둘다 0인 경우
          this.startBarPercent = 0
          this.endBarPercent = 0
        }
      })
    }, 250)
  },
  data: () => ({
    startBarPercent: 0,
    endBarPercent: 0
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

    & > * + * {
      margin-left: 5px;
    }

    &__date {
      min-width: 60px;
    }

    &__bar {
      flex-grow: 1;
      min-width: 140px;
      max-width: 100%;
      height: 30px;

      &-item {
        height: 100%;
        background-color: var(--stack-color);
        border-radius: 4px;
        transition: width 0.35s ease-out;
      }
    }

    &__price {
      flex-shrink: 1;
      white-space: pre;
      color: var(--stack-text-color);
    }
  }
}
</style>
