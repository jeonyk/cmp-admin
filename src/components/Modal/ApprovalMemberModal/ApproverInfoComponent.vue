<!--
  * 파일명 : ApproverInfoComponent.vue
  * 파일 기능 :
  * 작성자 : 김예담 외 2명
  * 최종 작성일 : 2021-02-22
  * License By Shinsegae I&C
  * 2021-02-22 fix: 조직도 - userPosition, userDuty 설정
 -->

<template>
  <div :class="['recent-user-component', { mini }]">
    <div
      :class="['approver-item', { '-selected' : newValue }]"
    >
      <div :class="['-item', { '-selected' : newValue } ]">
        <!-- <i class="mdi mdi-drag-vertical" /> -->
        <el-checkbox
          v-model="newValue"
          @change="toggleCheckbox"
          @click.native="e => { e.stopPropagation() }"
        />
        <div class="approver-info">
          <p>
            <b class="approver-name">{{ name }}</b>&ensp;
            <span class="approver-detail">{{ duty }}</span>
          </p>
          <p>
            <span class="approver-detail">{{ company }}&nbsp;|&nbsp;</span><span class="approver-detail">{{ group }}</span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ApproverInfoComponent',
  props: {
    name: {
      type: String,
      default: ''
    },
    company: {
      type: String,
      default: ''
    },
    group: {
      type: String,
      default: ''
    },
    duty: {
      type: String,
      default: ''
    },
    mini: { // 리스트를 얇은걸 사용할 경우...
      type: Boolean,
      default: false
    },
    isChecked: {
      type: Boolean,
      default: false
    },
    useCheckbox: {
      type: Boolean,
      default: true
    },
    condition: { // 조건이 true일 경우 체크박스가 불가능하도록 설정합니다
      type: Boolean,
      default: false
    },
    trueCondition: { // 조건이 true일 경우 체크박스는 true로 유지합니다.
      type: Boolean,
      default: false
    }
  },
  watch: {
    isChecked (value) {
      this.newValue = value
    }
  },
  updated () {
    if (this.trueCondition) this.newValue = true
    if (this.condition) this.newValue = false
  },
  methods: {
    toggleCheckbox () {
      this.$emit('change')
    }
  },
  data () {
    return {
      newValue: this.isChecked
    }
  }
}
</script>
<style lang="scss">
.recent-user-component {
  * {
    -webkit-box-sizing: border-box;
    -moz-box-sizing: border-box;
    -ms-box-sizing: border-box;
    box-sizing: border-box;
  }
  > .el-checkbox {
    display: flex;
    align-items: flex-start;
    > .el-checkbox__label {
      height: auto;
      .checkbox-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        > .user-name {
          margin-top: $gap-s;
          text-align: center;
          white-space: nowrap;
        }
      }
    }
  }

  .approver-item {
    position: relative;
    padding: 15px $gap;
    &::after {
      content: '';
      position: absolute;
      top: 100%;
      left: $gap;
      right: $gap;
      height: 1px;
      background-color: $border2A;
      z-index: 1;
    }
    // height: 60px;
    &.-selected {
      background-color: #222B5A;
    }

    .-item {
      display:flex;
      // height: 60px;
      align-items: center;
      transition: .5s ease;
      border: 1px solid transparent;
      // padding: 0 $gap;
      > .approver-info {
        margin-left: $gap;
        // height: 40px;
        > p {
          &:first-of-type {
            line-height: 19px;
          }
          &:last-of-type {
            margin-top: 9px;
            line-height: 12px;
          }
        }
        .approver-name {
          font-size: 14px;
          font-weight: normal;
          color: $color-lightgrey;
        }
        .approver-detail {
          font-size: 13px;
          line-height: 12px;
          color: $input-placeholder;
          white-space: nowrap;
        }
      }
      .mdi {
        color: #9596a0;
        display: inline-block;
        width: 10px;
        margin-right: $gap-s;
        &::before {
          width: 10px;
        }
      }

      &.-selected {
        // border: 1px dashed $purple-blue;
        // border-radius: 2px;
      }
    }
  }
}
</style>
