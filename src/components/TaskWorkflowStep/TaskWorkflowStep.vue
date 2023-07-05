<!--
  * 파일명 : TaskWorkflowStep.vue
  * 파일 기능 : 현재 진행 프로세스를 보여주는 스타일된 컴포넌트입니다. 외부에서 전체 워크플로우 프로세스 데이터를 받습니다.
  * 작성자 : 김예담 외 3명
  * 최종 작성일 : 2021-01-25
  * License By Shinsegae I&C
  * 2021-01-25 fix: blsm 조직도 초기 선택 세팅 (속한 조직), g-tree 스타일 수정, $disable 스타일 수정
 -->

<template>
  <ul class="task-workflow-step-list">
    <template
      v-for="(step, idx) in data"
    >
      <li
        v-if="step.isWriteRole"
        :key="idx + '_bullets'"
        :class="['step-item', {'-active': field === step.roleName}]"
        @click="clickEvent(step)"
      >
        <span class="step-name">{{ step.roleName }}</span>
        <span
          class="view-count"
          v-if="step.dataCount"
        >{{ step.dataCount }}</span>
      </li>
    </template>
  </ul>
</template>
<script>
export default {
  name: 'TaskWorkflowStep',
  props: {
    data: {
      type: Array,
      default: () => []
    },
    field: {
      type: String,
      default: ''
    },
    totalCountArr: {
      type: Array,
      default: () => []
    }
  },
  watch: {
    data (newVal) { return newVal },
    field (newVal) {
    }
  },
  created () {
  },
  methods: {
    setStep (step) {
      return step
    },
    clickEvent (step) {
      this.$emit('change', step)
    }
  },
  data () {
    return {
      steps: [
        { field: 'server', label: '서버' },
        { field: 'network', label: '네트워크' },
        { field: 'security', label: '보안' }
      ]
    }
  }
}
</script>
<style lang="scss" scoped>
  .task-workflow-step-list {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: $gap 0 50px;
    width: 100%;
    .step-item {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: $gap-s $gap;
      text-align: center;
      width: 120px;
      border-radius: $radius-m;
      transition: all .3s;
      color: $color-lightgrey;
      font-weight: normal;
      opacity: .4;
      cursor: pointer;
      &.-active {
        opacity: 1;
      }
      & + .step-item { margin-left: $gap;}
      &::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        width: 100%;
        height: 6px;
        border-radius: 3px;
        background-color: $white;
      }
      .step-name{
        font-size: 16px;
        color: #ddd;
      }

      .view-count {
        display: inline-block;
        font-size: 12px;
        margin-left: $gap-s;
        width: 20px;
        height: 20px;
        text-align: center;
        line-height: 20px;
        color: $white;
        border-radius: 50%;
        background-color: $main-red;
      }
    }
  }
</style>
