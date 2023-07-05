<template>
  <div class="workflow-process">
    <div
      class="side-flow"
      v-if="service"
    >
      <div
        v-for="({ label, key, disabled, title, contents }, idx) in processItems"
        :key="key"
        :class="['item', { '-active': process === key }, { '-empty': disabled }]"
        @click="disabled ? null : selectProcess({ label, key, title, contents })"
      >
        {{ label }}

        <i :class="(idx === processItems.length - 1) ? '-empty' : '-arrow'" />
      </div>
    </div>
    <!-- /. 리뷰 ~ 완료 -->

    <span
      v-else
      class="-empty"
    >
      {{ $v('서비스 정보를 선택해 주세요.') }}
    </span>
  </div>
</template>

<script>

export default {
  name: 'SetWorkFlowProcess',
  props: {
    service: { // 선택된 서비스 정보
      type: String,
      default: undefined
    },
    processItems: { // [프로세스] 목록
      type: Array,
      default: () => []
    }
  },
  watch: {
    service () {
      // [서비스] 정보가 변경되었을 때마다 0번째 선택
      this.selectProcess(this.processItems[0])
    },
    processItems (items, before) {
      // [프로세스] 목록이 변경된다면 현재 보고있는 프로세스의 인덱스로 설정
      const index = items.findIndex(item => item.key === this.process)
      this.selectProcess(items[index])
    }
  },
  methods: {
    /**
     * [프로세스] 선택 이벤트
     * @param {Object} item processItems 데아터
     */
    selectProcess (item) {
      this.process = item?.key
      this.$emit('curr-process', item)
    }
  },
  data: () => ({
    process: undefined // 선택한 [프로세스]
  })
}
</script>

<style lang="scss" scoped>
.workflow-process {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  .item {
    width: 200px;
    line-height: 50px;
    border-radius: 5px;
    border: 1px solid #2A2D44;
    background: #2A2D44;
    box-sizing: border-box;
    cursor: pointer;
    margin-bottom: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    box-sizing: border-box;

    &:last-child { margin: 0; }
    &.-empty {
      background: #212334;
      border: 1px dashed #404357;
      color: #404357;
      cursor: not-allowed;
    }

    &.-active {
      background: $primary;
      border: 1px solid $primary;
      color: $white;

      .-arrow {
        background-color: $primary;
        &::after,
        &::before {
          background-color: $primary;
        }
      }
    }

    .-arrow {
      position: absolute;
      bottom: -38px; left: 50%;
      width: 2px;
      height: 20px;
      background-color: #94959F;

      &.-long { height: 150px; }

      &::after,
      &::before {
        content: '';
        position: absolute;
        width: 2px; height: 10px;
        background-color: #94959F;
        top: calc(100% - 8px);
        transform: rotate(50deg);
      }
      &::before {
        left: calc(50% + 2px);
        transform: rotate(50deg);
      }
      &::after {
        left: calc(50% - 4px);
        transform: rotate(-50deg);
      }
    }

  }
  .-empty { color: $input-placeholder; }
}
</style>
