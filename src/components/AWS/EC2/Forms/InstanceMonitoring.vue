<template>
  <span class="monitoring">
    <span class="monitoring-radio">
      <el-radio-group
        :value="monitoringActivated"
        @input="e => $emit('update:monitoringActivated', e)"
        class="monitoring-radio-group"
      >
        <el-radio-button :label="true">
          활성
        </el-radio-button>
        <el-radio-button :label="false">
          비활성
        </el-radio-button>
      </el-radio-group>
      <!-- <div
        v-else
        class="edit-monitoring"
      >
        <span class="title">수정 전</span>
        <span class="standalone-radio">
          {{ monitoringActivated ? '활성' : '비활성' }}
        </span>
        <span class="arrow-icon">
          <arrow-right-round />
        </span>
        <span class="title em">
          수정 후
        </span>
        <el-radio-group
          class="monitoring-radio-group short-ml"
          v-model="editMonitoringActivated"
        >
          <el-radio-button :label="true">
            활성
          </el-radio-button>
          <el-radio-button :label="false">
            비활성
          </el-radio-button>
        </el-radio-group>
      </div> -->
    </span>
    <div class="monitoring-detail">
      Cloudwatcher를 활성화하면 세부 모니터링이 가능하지만 추가비용이
      발생합니다.
    </div>
  </span>
</template>

<script>
// import ArrowRightRound from '@/components/Icons/ArrowRightRound.vue'

export default {
  // components: { ArrowRightRound },
  name: 'InstanceMonitoring',
  props: {
    monitoringActivated: {
      type: Boolean,
      default: false
    }
  },
  inject: ['shared'],
  created () {
    this.editMonitoringActivated = this.monitoringActivated
  },
  watch: {
    monitoringActivated (active) {
      if (!this.shared.isEdit) return

      if (this.monitoringActivated !== active) {
        const getActiveText = (isActive) => isActive ? '활성' : '비활성'
        const changes = [
          {
            id: 'ec2-edit-monitor-1',
            title: '변경',
            type: 'change',
            items: [
              { title: '변경 전', changeValue: '세부 모니터링 : ' + getActiveText(this.monitoringActivated) },
              { title: '변경 후', changeValue: '세부 모니터링 : ' + getActiveText(active) }
            ]
          }
        ]
        this.$emit('monitor-change', changes)
      } else {
        // 변경사항이 없어요
        this.$emit('monitor-change', [])
      }
    },
    'shared.active' (active) {
      if (active) {
        if (this.shared.isEdit) {
          this.$emit('update:monitoringActivated', !!this.shared.editData.orderData.monitoringState)
        }
      }
    }
  },
  data: () => ({
    editMonitoringActivated: false
  })
}
</script>

<style lang="scss" scoped>
.monitoring {
  &-radio {
    &-group {
      display: inline-block;
      background-color: #39394B;
      border-radius: 50px;
      margin-left: $gap-m;

      &.short-ml { margin-left: 15px; }

      &::v-deep {
        .el-radio-button {
          &__inner {
            background-color: #39394B;
            border: none !important;
            padding: 1px 10px !important;

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

          &:not(.is-active) {
            .el-radio-button__inner {
              background-color: #39394B;
              color: #666;
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

    .edit-monitoring {
      margin: $gap 0;

      .standalone-radio {
        padding: 7px;
        border-radius: 50px;
        background: #ffffff;
        box-shadow: 0px 3px 4px rgba(0, 0, 0, 0.1);
        /* font-weight: bold; */
        font-weight: 500;
        margin: 0 $gap;
      }

      .arrow-icon {
        margin: 0 $gap-s;
        padding: 5px 8px;
        border-radius: 9999px;
        background: #FFFFFF;
        border: 1px dashed #F3D3D3;
        box-sizing: border-box;
        box-shadow: 5px 5px 15px rgba(181, 105, 105, 0.15);
      }

      .title {
        font-weight: bold;
        color: #666;

        &.em {
          color: $main-blue;
          margin-left: $gap-s;
        }
      }
    }
  }

  &-detail {
    width: 100%;
    margin-top: 15px;
    color: $text-lighter-gray;
  }
}
</style>
