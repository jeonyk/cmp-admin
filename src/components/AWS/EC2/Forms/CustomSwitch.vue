<template>
  <div class="custom-switch">
    <el-radio-group
      v-model="activeSwitch"
      class="custom-switch-group"
    >
      <el-radio-button :label="true">
        {{ labels[0] }}
      </el-radio-button>
      <el-radio-button :label="false">
        {{ labels[1] }}
      </el-radio-button>
    </el-radio-group>
  </div>
</template>

<script>
export default {
  name: 'CustomSwitch',
  props: {
    defaultActive: {
      type: Boolean,
      default: true
    },
    labels: {
      type: Array,
      default: () => ['활성', '비활성']
    },
    subnet: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    activeSwitch (bool) {
      this.$emit('update:subnet', bool)
    }
  },
  created () {
    if (this.defaultActive) this.activeSwitch = true
    this.activeSwitch = this.subnet
  },
  data: () => ({
    activeSwitch: false
  })
}
</script>

<style lang="scss" scoped>
.custom-switch {
  &-group {
    display: inline-block;
    background-color: #39394B;
    border-radius: 50px;

    &::v-deep {
      .el-radio-button {
        &__inner {
          background-color: #eee;
          border: none !important;
          padding: 0.5px 10px !important;
          line-height: 27px;
          height: 27px;

          &:focus {
            outline: none;
          }
        }

        &:first-child {
          .el-radio-button__inner {
            border-radius: 50px 0 0 50px;
          }
        }

        &:last-child {
          .el-radio-button__inner {
            border-radius: 0 50px 50px 0;
          }
        }

        &.is-active {
          .el-radio-button__inner {
            background-color: $white;
            border-radius: 50px;
            color: #333 !important;
            box-shadow: 0px 3px 4px rgba(0, 0, 0, 0.1) !important;
          }
        }
      }
    }
  }
}
</style>
