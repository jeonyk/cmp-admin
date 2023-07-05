<template>
  <div
    :class="['alert-contents', { 'dark-mode': darkMode }]"
    @click="$emit('click')"
  >
    <i class="drag-icon" />

    <div class="contents">
      <p class="-left">
        <i :class="['status', data._severity ? `-${data._severity}` : '']" />
        <!-- debugging 용 -->
        <!-- {{ data.resolved }} -->
        <!-- <strong> 🍏 {{ data.alertId }}</strong> -->

        <strong>{{ data.alertTitle }}</strong>

        <span>{{ data.message }}</span>
      </p>

      <p class="-right">
        <span>
          <!-- 이름 -->
          {{ data._ackedUser }}
        </span>

        <!-- 변경된 날짜 -->
        <small>{{ setTime(data) }}</small>
      </p>
    </div>
  </div>
</template>

<script>

export default {
  name: 'AlertContents',
  props: {
    data: {
      type: Object,
      default: undefined
    },
    darkMode: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      setTime (item) {
        let date = item._alertTime // Alert 티켓
        if (item.acknowledged) date = item._ackTime // Acknowledge 티켓
        if (item.resolved) date = item._reslvTime // Resolve 티켓

        return date
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.alert-contents {
  border-radius: 6px;
  background-color: $white;
  height: 84px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  padding: $gap;
  padding-left: 35px;
  position: relative;
  box-sizing: border-box;
  cursor: pointer;

  .drag-icon {
    position: absolute;
    top: calc(50% -15px);
    left: 10px;
    width: 15px;
    height: 30px;
    display: block;
    cursor: grab;
    background: url('../../../../assets/images/draggable.svg') no-repeat center center;
  }

  .contents {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 45px;
    width: 100%;

    .-left {
      flex: 1 1 auto;
      position: relative;
      display: flex;
      justify-content: space-between;
      flex-direction: column;
      height: inherit;

      .status {
        position: absolute;
        display: block;
        width: 6px;
        height: 6px;
        border-radius: 50%;

        &.-critical { background-color: $main-red; }
        &.-warning { background-color: $yellow; }
      }
      strong {
        color: $primary;
        font-size: 14px;
        font-weight: normal;
        display: block;
        width: 150px;
        padding-left: $gap-s;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
      }
      span {
        display: block;
        width: 150px;
        height: 13px;
        font-size: 13px;
        color: $text-black;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
      }
    }
    .-right {
      flex: 0 0 120px;
      height: inherit;
      align-items: flex-end;
      text-align: right;
      justify-content: space-between;
      display: flex;
      flex-direction: column;
      font-size: 13px;

      span {
        color: $text-black;
        display: block;
        line-height: 2;
      }
      small {
        color: $text-lighter-gray;
        display: block;
        line-height: 2;
      }
    }
  }

  &.dark-mode {
    background-color: #2A2D44;

    .-left {
      strong { color: $title-color; }
      span { color: #9D9D9D; }
    }

    .-right {
      span, small { color: $input-placeholder; }
    }
  }
}
</style>
