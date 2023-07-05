<template>
  <main class="monitor">
    <div class="monitor-header">
      <h2 class="monitor-header-text">
        {{ title }}
        <!--AWS 모니터링 그리드 설정 -->
      </h2>
    </div>
    <div class="monitor-header">
      <g-tab
        :data="tabData"
        @click="clickTabAction"
      >
        <template #set-monitoring />
        <template #set-monitoring-server />
      </g-tab>
    </div>

    <!-- ###monitoring-body -->
    <div
      class="monitor-body"
    >
      <section class="button-container">
        <div
          class="button-container-editing"
          v-if="!isEditing"
        >
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
          class="button-container-no-editing"
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
      </section>
      <section class="monitor-board-container">
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
              :key="item.key"
              v-show="item.value !== 'GLOABL'"
            >
              <label class="monitor-item-label">{{ item.label }}</label>
              <div>
                <input
                  type="number"
                  :disabled="!isEditing"
                  v-model.number="leftInputs[item.key]"
                >
                <span class="unit-two">{{ item.unit === '작업' || item.unit === '개수' ? item.unit = '개' : item.unit }}</span>
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
              :key="item.key"
            >
              <label class="monitor-item-label">{{ item.label }}</label>
              <div>
                <input
                  type="number"
                  :disabled="!isEditing"
                  v-model.number="rightInputs[item.key]"
                >
                <!-- <span class="unit-two">{{ item.unit }}</span> -->
                <span class="unit-two">{{ item.unit === '개수' ? item.unit = '개' : item.unit }}</span>
              </div>
            </li>
          </ul>
        </section>
      </section>
    </div>
  </main>
</template>

<script>
import { cloneDeep } from 'lodash'
import GTab from '@/components/common/g-tab/g-tab.vue'
// import RegisterInput from '@/components/ConfigAws/RegisterInput.vue'
export default {
  components: {
    GTab
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
    },
    isEditing (vale) {
      if (!vale) {
        this.bindInputs(this.clonedDataLeft, this.leftInputs)
        this.bindInputs(this.clonedDataRight, this.rightInputs)
      }
    }
  },

  methods: {
    resetInputFields () {
      this.$confirm(this.$t('common.CONFIRM.MON.004'), { dangerouslyUseHTMLString: true }).then(() => {
        this.bindInputs(this.clonedDataLeft, this.leftInputs)
        this.bindInputs(this.clonedDataRight, this.rightInputs)
        this.isEditing = false
      }).catch(() => { return false })
    },
    bindInputs (dataList, input) {
      for (const data in dataList) {
        const obj = dataList[data]
        input[obj.key] = obj.value
      }
    },
    async save () {
      const { leftInputs, rightInputs } = this
      const { instanceId, volumeId, ...filteredLeftInputs } = leftInputs // instanceId 제거 (api 수정)
      filteredLeftInputs.isGlobal = true // isGlobal 요소 추가 (api 수정)
      // console.log('leftInputs: ', filteredLeftInputs)
      // console.log('rightInputs: ', this.rightInputs)
      this.$confirm(this.$t('common.CONFIRM.MON.005'))
        .then(() => {
          this.isEditing = false
          this.$emit('save', filteredLeftInputs, rightInputs)
        }).catch(() => { return false })
    },
    clickTabAction (e) {
      console.log(e)
      this.isEditing = false
      // this.leftInputs = []
      // this.rightInputs = []
      this.$emit('tabClick', e)
    }
  },
  data () {
    return {
      isEditing: false,
      leftInputs: {},
      rightInputs: {},
      clonedDataLeft: [],
      clonedDataRight: [],
      tabData: [
        { name: 'EC2 모니터링 임계치', value: 'EC2', keyPath: 'admin.MONIT.setMonitorEc2Threshold' },
        { name: 'EBS 모니터링 임계치', value: 'EBS', keyPath: 'admin.MONIT.setMonitorEbsThreshold' }
      ]
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
  padding-right: 0px;
  .monitor-header {
    display: flex;
    justify-content: space-between;

    .monitor-header-text {
      width: 100%;
      text-indent:10px;
      padding-top: 10px;
      margin-bottom: 40px;
    }
  } // end of "Header"

  .monitor-body {
    width: 100%;
    display: flex;
    flex-direction: column;

    .button-container {
      display: flex;
      justify-content: right;
      margin-bottom: 20px;

      .button-container-editing, .button-container-no-editing {
        display: flex;
        button {
          transition: none !important;
        }
      }
    }
    .monitor-board-container {
        display: flex;
        width: 100%;
        .monitor-board {
          display: flex;
          width: 100%;

        .monitor-board-header {
          height: 42px;
          line-height: 42px;
          text-align: center;
          background: #2a2d44;
        }
      }
    }
    .monitor-list {
      display: flex;
      flex-direction: column;
      .monitor-item {
        // border:1px solid red;
        display: flex;
        align-items: center;
        padding: 10px 0px;
        .monitor-item-label {
          display: flex;
          width: 300px;
          text-indent: 40px;
          // color:red;
        }
        > div {
          display: flex;
          justify-content: center;
          align-items: center;

          .unit-two {
            margin-left: 10px;
            white-space: nowrap;
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
    }
  }//  end of "Body"
}
</style>
