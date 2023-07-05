<template>
  <div class="resource-operation-steps">
    <el-steps
      class="operation-steps"
      :active="activeStep"
    >
      <el-step
        v-for="(step, idx) in steps"
        :key="step.value"
        :title="step.label"
        @click.native="e => clickStep(e, idx)"
        ref="stepRef"
      />
    </el-steps>

    <!-- <button
      class="button"
      type="is-primary"
      :disabled="activeStep === steps.length - 1"
      @click="skipStep"
    >
      SKIP
    </button> -->
  </div>
</template>

<script>
export default {
  name: 'ResourceOperationSteps',
  props: {
    active: {
      type: Number,
      default: 0 // 0부터 시작
    },
    data: {
      type: Array,
      default: null
    }
  },
  created () {
    this.activeStep = this.active
  },
  watch: {
    active (newVal) {
      this.activeStep = newVal
    },
    activeStep: {
      immediate: true,
      handler (newStep) {
        this.$emit('change', this.steps[newStep])
      }
    },
    data: {
      immediate: true,
      handler (newList) {
        this.steps = [...newList]
      }
    }
  },
  methods: {
    /**
     * [SKIP] 버튼 클릭 시, 이벤트 발생
     */
    skipStep () {
      if (this.activeStep + 1 >= this.steps.length) return

      this.activeStep += 1
    },
    clickStep (e, idx) {
      if (!this.$refs?.stepRef[idx] || !e.target) return

      const stepEl = this.$refs.stepRef[idx]?.$el
      if (!stepEl) return
      const dot = stepEl.querySelector('.el-step__icon')
      const title = stepEl.querySelector('.el-step__title')

      if (dot.contains(e.target) || title.contains(e.target)) {
        this.activeStep = idx
      }
    }
  },
  data () {
    return {
      activeStep: this.active || 0,
      steps: [
        { stepNo: 0, label: 'Vm', value: 'vm' },
        { stepNo: 1, label: 'Vsan_iscsi', value: 'vsn_iscsi' },
        { stepNo: 2, label: 'Network(L4/L7)', value: 'network' },
        { stepNo: 3, label: 'Security', value: 'security' }
        // { stepNo: 4, label: 'Database', value: 'database' }
      ]
    }
  }
}
</script>

<style lang="scss">
  .resource-operation-steps {
    display: flex;
    align-items: center;

    .el-steps.operation-steps {
      width: 100%;
      .el-step__head {
        .el-step__icon {
          box-sizing: content-box;
          cursor: pointer;
          margin: 11px 0 0 -7px;
          width: 8px;
          height: 8px;
          background-color: $light-gray;
          border: 2px solid $primary;
          color: transparent;
        }
        .el-step__line {
          height: 12px;
          background-color: $main-gray;
          border: none;
          transition: all .2s;
          &-inner { display: none; }
        }
        &.is-process {

        }
        &.is-wait {
          background-color: transparent;
          .el-step__line { background-color: $main-gray; }
          .el-step__icon { border-color: $main-gray; }
        }
        &.is-finish {
          > .el-step__line {
            background-color: $primary;
            box-shadow: 0 2px 20px 0 rgba(62, 88, 201, 0.6);
          }
        }
      }
      .el-step__title {
        display: inline-block;
        margin-top: 20px;
        font-weight: 500;
        font-size: 14px;
        transform: translateX(-50%);
        color: $white;
        line-height: 1;
        cursor: pointer;
        &.is-process {
          color: $primary;
        }
        &.is-wait {
          background-color: transparent;
          color: $main-gray;
        }
        &.is-finish {
          color: $primary;
        }
      }
    }
  }
</style>
