<template>
  <main class="monitor">
    <div class="monitor-header">
      <h2 class="monitor-header-text">
        {{ title }}
        <!-- NX 모니터링 설정 -->
      </h2>
      <div v-if="!isEditing">
        <button
          class="button"
          type="is-primary"
          @click="isEditing = true"
          :disabled="isEditing"
        >
          {{ $t("common.BTN.modify") }}
        </button>
      </div>
      <div
        v-else
        style="display: flex"
      >
        <button
          class="button"
          type="is-anti"
          @click="resetInputFields"
          style="margin-right: 10px"
        >
          {{ $t("common.BTN.cancel") }}
        </button>
        <button
          class="button"
          type="is-primary"
          @click="save"
        >
          {{ $t("common.BTN.save") }}
        </button>
      </div>
    </div>

    <!-- ###monitoring-body -->
    <div
      class="monitor-body"
    >
      <section class="monitor-board">
        <h3
          v-if="dataLeftHeader"
          class="monitor-board-header"
        >
          {{ dataLeftHeader }}
        </h3>
        <ul
          v-if="dataLeft.length && dataLeft.length > 0"
          class="monitor-list"
        >
          <li
            class="monitor-item"
            v-for="item in dataLeft"
            :key="item.thresholdIdx"
          >
            <label class="monitor-item-label">{{ $t('admin.MONIT.THRESHOLD.VMW.VmwMonit'+item.thresholdIdx) }}</label>
            <div>
              <input
                type="number"
                :disabled="!isEditing"
                v-model.number="leftInputs[item.thresholdIdx].thresholdValue"
                :placeholder="$v('미정')"
              >
              <span class="unit-two">{{ item.unitInfoLabel }}</span>
            </div>
          </li>
        </ul>
      </section>
      <section class="divider" />
      <section
        class="monitor-board"
      >
        <h3
          v-if="dataRightHeader"
          class="monitor-board-header"
        >
          {{ dataRightHeader }}
        </h3>
        <ul
          v-if="dataRight.length && dataRight.length > 0"
          class="monitor-list"
        >
          <li
            class="monitor-item"
            v-for="item in dataRight"
            :key="item.thresholdIdx"
          >
            <label class="monitor-item-label">{{ `${item.groupInfoLabel} ${item.nameInfoLabel} ${capitalize(item.rollupTypeValue)}` }}</label>
            <div>
              <el-input
                type="number"
                :disabled="!isEditing"
                v-model="rightInputs[item.thresholdIdx].thresholdValue"
              >
                <span class="unit-two">{{ item.unitInfoLabel }}</span>
              </el-input>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </main>
</template>

<script>
import { cloneDeep } from 'lodash'
// import RegisterInput from '@/components/ConfigAws/RegisterInput.vue'
export default {
  components: {
    // 'register-input': RegisterInput
  },
  props: {
    title: {
      type: String,
      default: ''
    },
    dataLeftHeader: {
      type: String,
      default: ''
    },
    dataRightHeader: {
      type: String,
      default: ''
    },
    dataLeft: {
      type: [Array, Object],
      default: () => {
        return []
      }
    },
    dataRight: {
      type: [Array, Object],
      default: () => {
        return []
      }
    },
    data: {
      type: [Array, Object],
      default: () => {
        return {}
      }
    }
  },
  computed: {
    doesAllExistData: function () {
      if (this.dataLeft.length === 0 && this.dataRight.length === 0) return true
      else return false
    }
  },
  created () {

  },
  watch: {
    dataLeft: {
      deep: true,
      immediate: true,
      handler (val) {
        this.bindInputs(this.dataLeft, this.leftInputs)
        this.clonedDataLeft = cloneDeep(this.dataLeft)
      }
    },
    dataRight: {
      deep: true,
      immediate: true,
      handler (val) {
        this.bindInputs(this.dataRight, this.rightInputs)
        this.clonedDataRight = cloneDeep(this.dataRight)
      }
    }
  },

  methods: {
    capitalize (str) { return `${str.charAt(0).toUpperCase()}${str.slice(1)}` },
    resetInputFields () {
      this.$confirm(this.$t('common.CONFIRM.MON.004'), { dangerouslyUseHTMLString: true }).then(() => {
        this.bindInputs(this.clonedDataLeft, this.leftInputs)
        this.bindInputs(this.clonedDataRight, this.rightInputs)
        this.isEditing = false
      }).catch(() => { return false })
    },
    bindInputs (dataList, input) {
      for (const data in dataList) {
        const obj = cloneDeep(dataList[data])
        if (!obj.thresholdValue) { obj.thresholdValue = null }
        input[obj.thresholdIdx] = obj
      }
    },
    async save () {
      const { leftInputs, rightInputs } = this
      this.$confirm(this.$t('common.CONFIRM.MON.005'))
        .then(() => {
          this.isEditing = false
          this.$emit('save', leftInputs, rightInputs)
        }).catch(() => { return false })
    }
  },
  data () {
    return {
      isEditing: false,
      leftInputs: {},
      rightInputs: {},
      clonedDataLeft: [],
      clonedDataRight: []
    }
  }
}
</script>

<style lang="scss" scoped>
.divider {
  width: 1px;
}
.monitor {
  padding: 0 30px;
  .monitor-header {
    display: flex;
    justify-content: space-between;
    .monitor-header-text {
      width: 100%;
      text-indent:10px;
      padding-top: 10px;
      margin-bottom: 20px;
    }
  } // end of "Header"

  .monitor-body {
    width: 100%;
    display: flex;
    .monitor-board {
      width: 100%;

      .monitor-board-header {
        height: 42px;
        line-height: 42px;
        text-align: center;
        background: #2a2d44;
      }
    }
    .monitor-item {
      // border:1px solid red;
      display: flex;
      align-items: center;
      padding: 10px 0px;
      .monitor-item-label {
        width: 60%;
        text-indent: 40px;
        // color:red;
      }
      > div {
        justify-content: center;
        .unit-two {
          margin-left: 10px;
        }
      }
      input[type="text"],
      input[type="number"] {
        height: 32px;
        border-radius: 2px;
        text-indent: 10px;
        border: 1px solid #3d435e;
        &[disabled] {
          background: rgba(42, 45, 68, 0.6);
          border: 1px solid #3d435e;
          color: #727797;
        }
      }
      input:disabled {
        cursor:not-allowed;
      }
      span {
        justify-content: flex-end;
      }
    }
  }//  end of "Body"
}
</style>
