<template>
  <section class="sync-board">
    <header class="sync-board-title">
      <h3>{{ $v('동기화 내역') }}</h3>
      <div class="button-area">
        <span
          v-if="region"
          class="sync-board-time"
        >{{ $v('최근 리전 동기화 시간') }} :{{ convertTime(region.lastSyncTime) }}</span>
        <span
          v-if="instance"
          class="sync-board-time"
          style="margin-left:10px;"
        >{{ $v('최근 인스턴스 동기화 시간') }} :{{ convertTime(instance.lastSyncTime) }}</span>
        <button
          class="button"
          type="is-primary"
          @click="confirmSync"
          :disabled="isRegistered || isSynchronizing"
        >
          {{ $v('AWS 정보 동기화') }}
        </button>
      </div>
    </header>

    <div :class="['sync-board-body', { __synced: isSynchronized }]">
      <p v-if="!isSynchronized">
        {{ $v('AWS 정보를 동기화 해주세요') }}
      </p>
      <div
        v-else
        class="sync-board-content"
      >
        <div>
          <p v-loading="isRegionLoading">
            Region Zone {{ $v('동기화') }}<span v-if="!isRegionLoading"><span class="text-border" />{{ $v('성공') }}:{{ region.successCount }}{{ $v('건') }}, {{ $v('실패') }}: {{ region.failCount }}{{ $v('건') }}</span>
            <span>
              <!-- v-if="isLoading" -->
              <i
                v-if="isRegionLoading"
                class="el-icon-loading"
                style="margin-right: 5px; color: #f4a462"
              />
            </span>
          </p>
        </div>
        <span class="divider" />
        <div>
          <p v-loading="isInstanceLoading">
            Region  {{ $v('인스턴스 타입 동기화') }}<span v-if="!isInstanceLoading"><span class="text-border" />{{ $v('성공') }}:{{ instance.successCount }}{{ $v('건') }}, {{ $v('실패') }}: {{ instance.failCount }}{{ $v('건') }}</span>
            <span>
              <!-- v-if="isLoading" -->
              <i
                v-if="isInstanceLoading"
                class="el-icon-loading"
                style="margin-right: 5px; color: #f4a462"
              />
            </span>
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import API from '@sd-fe/cmp-core'
import Dayjs from 'dayjs'

export default {
  props: {
    isSynchronized: {
      type: Boolean,
      default: false
    },
    isLoading: {
      type: Boolean,
      default: false
    },
    isRegistered: {
      type: Boolean,
      default: false
    },
    time: {
      type: String,
      default: () => {}
    }
  },
  computed: {
    isSynchronizing () {
      if (this.isRegionLoading || this.isInstanceLoading) return true
      return false
    }
  },
  created () {
    this.getSyncedRegionHistory('ZONE_SYNC')
    this.getSyncedInstanceHistory('INSTANCE_TYPE_SYNC')
  },
  methods: {
    convertTime (timestamp) {
      timestamp = new Date(timestamp)
      return Dayjs(timestamp).format('YYYY.MM.DD HH:mm:ss')
    },
    confirmSync () {
      this.$confirm(
        this.$v('AWS 정보 동기화는<br> 최소 1분에서 최대 5분까지<br> 걸릴 수 있습니다'),
        {
          dangerouslyUseHTMLString: true
        }
      ).then(() => {
        this.$emit('sync')
        // 히스토리 API
        this.syncZones()
        this.syncInstances()
        // this.getSyncedRegionHistory('ZONE_SYNC')
        // this.getSyncedInstanceHistory('INSTANCE_TYPE_SYNC')
        // this.syncZones()
      })
    },
    async syncZones () {
      try {
        this.isRegionLoading = true
        const res = await API.aws.syncZones()
        this.isRegionLoading = false
        if (res.status === 200) {
          // 동기화 후 히스토리 출력
          this.getSyncedRegionHistory('ZONE_SYNC')
        }
        console.log('@syncZones :', res)
      } catch (error) {
        console.log(error)
      } finally {

      }
    },
    async syncInstances () {
      try {
        this.isInstanceLoading = true
        const res = await API.aws.syncInstanceType()
        this.isInstanceLoading = false
        if (res.status === 200) {
          this.getSyncedInstanceHistory('INSTANCE_TYPE_SYNC')
        }
        console.log('@syncZones :', res)
      } catch (error) {
        console.log(error)
      } finally {

      }
    },
    async getSyncedRegionHistory (syncType) {
      this.isRegionLoading = true
      const region = await API.aws.getSyncedRegionHistory(syncType)
      setTimeout(() => {
        this.isRegionLoading = false
        this.region = region.data
        console.log('@this.region :', this.region)
      }, 0)
    },
    async getSyncedInstanceHistory (syncType) {
      this.isInstanceLoading = true
      const instance = await API.aws.getSyncedInstanceHistory(syncType)
      setTimeout(() => {
        this.isInstanceLoading = false
        this.instance = instance.data
      }, 0)
    }
  },
  data () {
    return {
      region: {},
      instance: {},
      isRegionLoading: false,
      isInstanceLoading: false

    }
  }
}
</script>

<style lang="scss" scoped>
.sync-board {
  // margin-top:60px;
  // padding: 10px;
  .sync-board-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;

    .sync-board-time {
      color:#999;
    }

    .button-area {
      display: flex;
      gap: 10px;
      align-items: center;
    }
  }
  .sync-board-body {
    height: 60px;
    border: 1px solid #3d435e;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #fff;
    border-radius: 6px;
    background: #070A20;
    .text-border {
      width:165px;
      margin:0px 15px;
      display:inline-block;
      border: 1px dashed #727797;
    }
    &.__synced {
      border: 1px solid rgb(7, 10, 32);
      // border:none;
    }

    .sync-board-content {
      width: 100%;
      height: 100%;
      display: flex;
      div {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        p {
          text-align: center;
          width: 100%;
        }
      }
    } // End of sync-board-content
  } // End of sync-board-body
}

.divider {
  width: 1px;
  height: 14px;
  margin: auto;
  background: #727797;
}
</style>
