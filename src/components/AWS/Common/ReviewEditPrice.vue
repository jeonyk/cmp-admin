<template>
  <div class="price">
    <div class="price-text">
      월 예상 비용
    </div>
    <div class="price-icon">
      <el-tooltip
        effect="light"
        popper-class="shade-popper"
      >
        <i class="mdi mdi-information-outline" />
        <div slot="content">
          월 예상 비용은 실제 청구되는<br>
          금액과 다를 수 있습니다.
        </div>
      </el-tooltip>
    </div>
    <div class="price-before">
      <div class="placeholder">
        수정 전
      </div>
      <span class="dollar">$</span> {{ before }}
    </div>
    <div class="price-director">
      <arrow-right />
    </div>
    <div class="price-after">
      <div class="placeholder">
        수정 후
      </div>
      <span class="dollar">$</span> {{ after }}
    </div>
  </div>
</template>

<script>
import ArrowRight from '@/components/Icons/ArrowRight.vue'
// 검토 스텝에서 월 예상 비용 수정 전과 수정 후 표현

export default {
  name: 'ReviewEditPrice',
  props: {
    before: {
      type: [String, Number],
      default: 0
    },
    after: {
      type: [String, Number],
      default: 0
    }
  },
  components: { ArrowRight }
}
</script>

<style lang="scss" scoped>
.price {
  display: flex;
  flex-wrap: nowrap;

  &-text {
    font-size: 20px;
    font-weight: bold;
    margin-right: 5px;
  }

  &-icon {
    color: $main-blue;
    margin-right: $gap;
  }

  &-before,
  &-after {
    position: relative;

    .placeholder {
      width: 50px;
      position: absolute;
      font-weight: initial;
      font-size: 12px;
      color: #999;
      top: -20px;
      left: 0;
    }

    .dollar {
      font-size: 15px;
      color: initial;
    }
  }

  &-before {
    font-size: 22px;
    font-weight: 500;
  }

  &-after {
    font-size: 26px;
    font-weight: bold;
    color: $main-blue;
  }

  &-director {
    margin: 0 $gap;
  }
}
</style>
