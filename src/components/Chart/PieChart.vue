<template>
  <div
    class="chart"
    :style="`width: ${widthWrap}px; height: ${heightWrap}px;`"
  >
    <header class="title">
      <h5 class="title__text">
        {{ title }}
      </h5>
      <el-select
        v-if="coreText > 0"
        class="select"
        v-model="date"
        @change="$emit('change', date)"
      >
        <el-option
          :value="1"
          label="1개월"
        />
        <el-option
          :value="3"
          label="3개월 "
        />
        <el-option
          :value="6"
          label="6개월"
        />
        <el-option
          :value="12"
          label="12개월"
        />
      </el-select>
    </header>
    <div
      v-if="coreText > 0"
      style="display: flex; gap: 15px; align-items: center;"
    >
      <div style="position:relative;">
        <cmp-pie-chart
          :width="width"
          :height="height"
          :items-source="itemSource"
          binding-name="title"
          binding="value"
          :palette="colors"
          :inner-radius="0.5"
          :tooltip-content="getTooltipContent"
          :label-content="labelContent"
          label-position="Center"
        />
        <div class="total-price">
          <div>{{ coreText }}</div>
          <div>{{ $v('전체주문') }}</div>
        </div>
      </div>
      <div class="label-wrapper">
        <chart-label
          v-for="item in itemSource"
          :key="item.color"
          :color="item.color"
          :label="item.title"
        />
      </div>
    </div>
    <div
      v-else
      style="display:flex; flex-direction:column; align-items:center; padding-top:30px;"
    >
      <div>
        <i
          class="mdi mdi-alert-circle-outline"
          type="is-info"
          size="is-medium"
        />
      </div>
      <div style="margin-top:10px;">
        {{ $v('데이터가 없습니다.') }}
      </div>
    </div>
  </div>
</template>

<script>
import ChartLabel from '@/views/Dashboard/Nutanix/ChartLabel.vue'
export default {
  components: {
    ChartLabel
  },
  props: {
    title: {
      type: String,
      default: ''
    },
    widthWrap: {
      type: Number,
      default: 460
    },
    heightWrap: {
      type: Number,
      default: 460
    },
    width: {
      type: Number,
      default: 230
    },
    height: {
      type: Number,
      default: 230
    },
    itemSource: {
      type: Array,
      default: () => {}
    },
    labelContent: {
      type: [Function, String, Number, Object, Array],
      default: undefined
    },
    coreText: {
      type: [Number, String],
      default: 0
    }
  },
  mounted () {
  },
  computed: {
    colors () {
      return this.itemSource.map((x) => x.color)
    }
  },
  methods: {
    getTooltipContent (ht) {
      if (ht.name === '결재함') {
        return ht.name + '<br>' + '대기: ' + (ht.item.my | 0) + ' ' + '승인: ' + (ht.item.accepted | 0) + ' ' + '반려: ' + (ht.item.rejected | 0)
      } else {
        return ht.name + '<br>' + '일반: ' + ht.item.general + ' ' + '긴급: ' + (ht.item.urgent | 0)
      }
    }
  },
  data () {
    return {
      date: '1개월'
    }
  }
}
</script>

<style lang="scss" scoped>
.cmp-pie-chart-wrap {
  &::before {
  }
}
.chart {
  border-radius: 6px;
  margin-right: 40px;
  padding: 30px;
  box-sizing: border-box;
  border: 2px solid #3d435e;
  &::v-deep {
    .chart-label {
      margin-left: 0px;

    }
  }
}

.title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  &__text {
    text-indent: 10px;
    font-size: 18px;
  }
}

.label-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  justify-content: space-between;
  padding: 0px;
  box-sizing: border-box;
}

.select {
  width: 100px;
  height: 32px;
  background: #000;
}

.total-price {
  position: absolute;
  width: 120px;
  height: 120px;
  top:50%;
  left:50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  box-shadow: 2.5px 4.3px 5px 0 rgba(102, 102, 102, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  font-weight: 700;
  div:first-child {
    font-size:26px;
  }
  div:last-child {
    font-size:14px;
  }
}
</style>
