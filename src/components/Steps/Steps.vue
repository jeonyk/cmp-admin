<template>
  <div
    class="task__bar"
    :class="[{'is-canceled' : isCanceled}]"
  >
    <!-- :type="isCanceled ? 'canceled' : cStep > idx ? 'done': ''" -->
    <step
      :key="step.step"
      v-for="(step) in data"
      :step-level="step.step"
      :is-pending="step.isPending"
      :is-colored="step.isColored"
      :is-canceled="isCanceled"
      :tooltip-content="step.tooltip"
      :canceled-items="step.step === 1 ? canceledItemsAtReview : step.step === 3 ? canceledItemsAtTodo : []"
      :role-name="roleName"
      :is-ready="isReady"
    />

    <div class="line">
      <div
        class="gauge"
        :class="[`gauge-${gauge}`]"
        :style="{ width: `${gauge}%` }"
      />
    </div>
  </div>
</template>

<script>
import Step from '@/components/Steps/Step.vue'
export default {
  components: {
    Step
  },
  props: {
    data: {
      type: Array,
      default: () => {}
    },
    step: {
      type: Number,
      default: 0
    },
    stepLabel: {
      type: String,
      default: 'preview'
    },
    isCanceled: {
      type: Boolean,
      default: false
    },
    gauge: {
      type: Number,
      default: 0
    },
    canceledItemsAtReview: {
      type: Array,
      default: () => []
    },
    canceledItemsAtTodo: {
      type: Array,
      default: () => []
    },
    roleName: {
      type: String,
      default: ''
    },
    isReady: {
      type: Boolean,
      default: true
    }
  },
  methods: {
    getCanceledItems (step, data) {
      if (step.accessible.includes('DONE')) {
        const successServices = Object.values(data)
          .filter(item => item.workItemState === 'SUCCESS')
          .map(item => item.service)

        return successServices || []
      }
      return []
    }
  },
  data () {
    return {
      stepData: {
        preview: 1,
        previewApproval: 2,
        todo: 3,
        todoApproval: 4,
        done: 5
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.task__bar {
  .line { background:#2A2D44; } // 빈 게이지
  .gauge { background: #3E57C9; }
  .icon { background: #2A2D44; }
  .icon.is-colored {  background: #3e57c9;} // 빈 아이콘

  &.is-canceled {
    .line { background:#8A2929; } // 취소된 빈 게이지
    .gauge { background: #FA5657; }
    .icon { background:#8A2929; } // 취소된 빈 아이콘
    .icon.is-colored { background: #FA5657;}
  }

  // .icon {
  //   background: #2A2D44;
  //   &.is-colored {
  //     background: #3e57c9;
  //   }
  // }

}
.task__bar {
  position: relative;
  display: flex;
  flex:1 1 auto;
  justify-content: space-between;
  align-items: center;
  border-radius: 20px;
  overflow: hidden;
  box-sizing: border-box;

}

.line {
  top:50%;
  left:50%;
  transform:translate(-50%, -50%);
  position: absolute;
  width:100%;
  height:4px;
}

.gauge {
  height:100%;
  // background: #3E57C9;

  &-25 {
    width:25%;
  }
   &-50 {
    width:50%;
  }
   &-75 {
    width:75%;
  }
   &-100 {
    width:100%;
  }
}

// .is-canceled {
//   .line {
//     background: #8A2929;
//   }
//   .gauge {
//     background:#FA5657;
//   }
//   .icon {
//     background:#FA5657;
//   }
// }
</style>
