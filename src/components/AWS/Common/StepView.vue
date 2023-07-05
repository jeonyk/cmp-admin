<template>
  <div
    class="create-info"
    :class="{
      'is-edit': shared.isEdit,
      half:
        (steps.length === 3 && steps[1].active) ||
        (steps.length === 2 && steps[1].active),
      full:
        (steps.length === 3 && steps[2].active) ||
        (steps.length === 2 && steps[1].active),
      'all-expanded': isAllExpanded,
      'has-two-step': steps.length === 2
    }"
  >
    <create-info-step
      v-for="(step, index) in steps"
      v-bind="step"
      :key="index"
      :index="index + 1"
      @expand="expanded => $emit('expand', step, expanded)"
      @walk-step="$emit('walk-step', index)"
    >
      <slot :index="index" />
    </create-info-step>
    <div class="create-preview">
      <div class="create-preview-head">
        <h2>월 예상 비용</h2>
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
      <div
        v-if="!shared.isEdit"
        class="create-preview-price"
      >
        <span>$</span><strong>{{ guessPricePerMonth }}</strong>
      </div>
      <div
        v-else
        class="edit-preview-price"
      >
        <div class="flex-up-bottom">
          <div class="up">
            수정 전
          </div>
          <div class="bottom">
            $ <strong>{{ editBeforepricePerMonth }}</strong>
          </div>
        </div>
        <div class="divider-icon">
          <arrow-right />
        </div>
        <div class="flex-up-bottom">
          <div class="up">
            수정 후
          </div>
          <div class="bottom">
            $ <strong class="em">{{ editAfterpricePerMonth }}</strong>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import CreateInfoStep from '../EC2/CreateInfoStep.vue'
import ArrowRight from '@/components/Icons/ArrowRight.vue'
import { injectUtils } from './ResCreateUtil'

export default {
  name: 'StepView',
  props: {
    steps: {
      type: Array,
      required: true
    },
    guessPricePerMonth: {
      type: [Number, String],
      default: 0
    },
    editBeforepricePerMonth: {
      type: [Number, String],
      default: 0
    },
    editAfterpricePerMonth: {
      type: [Number, String],
      default: 0
    }
  },
  computed: {
    isAllExpanded () {
      return (
        this.steps.filter(step => step.expandable).length ===
        this.steps.filter(step => step.expandable && step.expanded).length
      )
    }
  },
  mixins: [injectUtils],
  components: { CreateInfoStep, ArrowRight }
}
</script>

<style lang="scss" scoped>
.create-info {
  background-color: #0A0C20;
  border-radius: 6px;
  padding: $gap-m $gap;
  position: sticky;
  top: 0;
  overflow: hidden;
  align-self: flex-start;

  &.has-two-step:not(.all-expanded) {
    &::after {
      height: calc(100% - 200px) !important;
    }
  }

  &.has-two-step.all-expanded {
    &::after {
      height: calc(100% - 200px) !important;
    }
  }

  &.half {
    &::after {
      background: linear-gradient(
        to bottom,
        $primary calc(100% - (50px + 20px)),
        #333 calc(50px + 20px)
      );
    }
  }

  &.full {
    &::after {
      background: $primary;
    }
  }

  &::after {
    content: "";
    position: absolute;
    margin: $gap-m $gap;
    width: 2px;
    height: calc(100% - 180px);
    height: 50%;
    background: #333;
    z-index: 0;
    top: 0;
    left: $gap * 2;
  }

  & > * + * {
    margin-top: $gap;
  }

  &.is-edit::after {
    height: calc(100% - 200px);
  }

  .change-wrap {
    margin-top: $gap-s;

    > * + * {
      border-top: 1px dashed #e0e0e0;
      padding-top: 15px;
    }

    > * {
      padding-bottom: 15px;
    }

    .title-tag {
      padding: 5px 10px;
      box-sizing: border-box;
      background-color: #f0f0f0;
      border-radius: 50px;
      color: #999;
      display: inline-block;
      font-size: 12px;
      margin-bottom: 15px;
    }

    &::v-deep .changed-title {
      color: $primary;
    }

    > .changed + .changed {
      border-top: 1px dashed #e0e0e0;
    }

    .changed {
      > .changed-inner + .changed-inner {
        margin-top: 15px;
      }
    }
  }
}

.create-preview {
  margin-top: $gap;

  &-head {
    > * {
      display: inline-block;
    }

    .mdi {
      margin-left: 5px;
      color: $primary;
    }
  }

  &-price {
    text-align: right;
    font-size: 15px;
    margin-top: $gap;
    display: flex;
    justify-content: flex-end;
    align-items: center;

    span {
      margin-top: 3px;
    }

    strong {
      color: $primary;
      font-size: 28px;
      font-weight: 700;
      margin-left: $gap-s;
    }
  }

  .edit-preview-price {
    margin-top: $gap;
    padding-top: $gap;
    border-top: 1px solid #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: nowrap;

    .divider-icon {
      align-self: flex-end;
      padding-bottom: 5px;
    }

    .flex-up-bottom {
      display: flex;
      flex-wrap: nowrap;
      height: 40px;

      .up {
        align-self: flex-start;
        font-size: 12px;
        color: #999;
        margin-right: $gap-s;
      }

      .bottom {
        align-self: flex-end;
        font-size: 15px;

        strong {
          font-size: 22px;
          font-weight: 500;
          margin-left: 5px;

          &.em {
            font-size: 26px;
            color: $primary;
          }
        }
      }
    }
  }
}
</style>
