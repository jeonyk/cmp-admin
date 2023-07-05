<template>
  <article class="alert-panel">
    <div class="-header">
      <strong>{{ title }}</strong>

      <div class="set-status">
        <strong class="on-option">
          <b
            v-if="critical"
            class="critical"
          />
          <b
            v-if="warning"
            class="warning"
          />
        </strong>

        <el-popover
          placement="bottom-end"
          effect="light"
          trigger="click"
          popper-class="alert-panel-status"
          ref="popper"
        >
          <p
            class="switches"
            slot="reference"
          >
            <span class="switch" />
            <span class="switch" />
          </p>

          <template>
            <p class="switch-status">
              Critical
              <el-switch v-model="critical" />
            </p>
            <p class="switch-status">
              Warning
              <el-switch v-model="warning" />
            </p>

            <i
              class="close"
              @click="close"
            >닫기</i>
          </template>
        </el-popover>
      </div>
    </div>

    <div>
      <slot />
    </div>
  </article>
</template>

<script>
export default {
  name: 'AlertPanel',
  props: {
    title: {
      type: String,
      default: undefined
    },
    isInitial: {
      type: Boolean,
      default: undefined
    }
  },
  watch: {
    critical (data) {
      return this.emitSevereity()
    },
    warning (data) {
      return this.emitSevereity()
    }
  },
  methods: {
    close () {
      return this.$refs.popper.doClose()
    },
    emitSevereity () {
      let severity

      // 처음 조건으로 호출되었다면? 이벤트를 발생시키지 않도록 합니다
      // (API 를 두번 쏘지 못하도록 차단)
      if (this.isInitial) return

      if (!this.critical && !this.warning) severity = 'INFO'
      if (this.critical && this.warning) return this.$emit('severity', ['CRITICAL', 'WARNING'])

      if (this.critical) severity = 'CRITICAL'
      if (this.warning) severity = 'WARNING'

      this.$emit('severity', [severity])
      return { severity }
    }
  },
  data () {
    return {
      critical: true,
      warning: true
    }
  }
}
</script>

<style lang="scss" scoped>
.alert-panel {
  height: 750px;
  background-color: #070A20;
  border-radius: 6px;
  box-shadow: 10px 10px 30px rgba(9, 8, 39, 0.5);

  .-header {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 30px 0 40px;
    border-bottom: 2px solid #1F1E32;

    strong { font-size: 16px; }

    .set-status {
      height: 26px;
      display: flex;
      .on-option {
        margin-right: $gap-s;
        display: flex;
        align-items: center;

        > b {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: block;
          margin-left: 5px;
        }

        .critical { background-color: $main-red; }
        .warning { background-color: $yellow; }
      }

      .switches {
        display: flex;
        flex-direction: column;
        cursor: pointer;
        .switch {
          width: 24px;
          height: 12px;
          display: block;
          border: 1px solid $input-placeholder;
          border-radius: 25px;
          position: relative;

          &::after {
            content: '';
            position: absolute;
            top: 3px;
            width: 6px;
            height: 6px;
            background: $input-placeholder;
            border-radius: 50%;
          }
          &::after { right: 3px; }

          &:first-child {
            margin-bottom: 2px;
            &::after { left: 3px; }
          }
        }
      }
    }
  }
}

.switch-status {
  font-size: 12px;
  font-weight: normal;
  width: 110px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: $gap;
  margin-bottom: 5px;
  &:nth-child(2) { margin-bottom: $gap-s; }
}

.close {
  display: block;
  font-style: normal;
  line-height: 15px;
  text-align: center;
  text-decoration: underline;
  cursor: pointer;
  color: $primary;
  font-size: 15px;
  font-weight: normal;
}

</style>

<style lang="scss">

.el-popover {
  &.el-popper[x-placement^=bottom].alert-panel-status {
    margin-top: 10px !important;
    border: none;
    padding: 15px 15px 10px 15px !important;
    border-radius: 5px;
    box-shadow: 10px 10px 40px rgba(0, 0, 0, 0.4);
    .el-switch {
      &.is-checked {
        .el-switch__core {
          border-color: $primary;
          &::before { color: $primary; }
          &::after { background-color: $primary; }
        }
      }
    }
  }
}
</style>
