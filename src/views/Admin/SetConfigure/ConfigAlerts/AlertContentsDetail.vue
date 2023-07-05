<template>
  <article class="detail-wrapper">
    <p class="standard-time">
      <span>Created Time {{ detail.data ? detail.data._createdTime : '-' }}</span>
      <span>Last Occurred {{ detail.data ? detail.data._lastOccuredTime : '-' }}</span>
    </p>
    <!-- /. 시간 -->

    <div class="detail-content">
      <register-contents
        v-for="(item) in contents"
        :key="item.key"
        :title="item.label"
        :class="{'-message': item.key === 'message'}"
      >
        {{ detail.data && detail.data[item.key] ? detail.data[item.key] : '-' }}
      </register-contents>
    </div>

    <div class="detail-model-button">
      <button
        class="button"
        size="is-large"
        type="is-anti"
        @click="$emit('close')"
      >
        <!-- 취소 -->
        {{ $t('common.BTN.cancel') }}
      </button>
      <button
        class="button"
        size="is-large"
        :disabled="disabledAcknowledged"
        @click="toAck"
      >
        <!-- 수행예정 -->
        {{ $t('config.Alerts.ackReserved') }}
      </button>
      <button
        class="button"
        size="is-large"
        type="is-primary"
        :disabled="disabledResolved"
        @click="toResv"
      >
        <!-- 처리완료 -->
        {{ $t('config.Alerts.resolved') }}
      </button>
    </div>
  </article>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'AlertContentsDetail',
  props: {
    detail: {
      type: Object,
      default: null
    }
  },
  watch: {
    detail: {
      immediate: true,
      deep: true,
      handler (detail) {
        this.blockCondition(detail)
      }
    }
  },
  computed: {
    ...mapState({
      user: state => state.auth.user
    })
  },
  methods: {
    setPayload (detail = this.detail) {
      const { originatingClusterUuid, alertId, userInfo } = detail.data
      return { clusterUuid: originatingClusterUuid, alertId, userInfo }
    },
    /**
     * [Alert > Acknowledge] 로 이동
     */
    toAck () {
      const payload = this.setPayload(this.detail)
      payload.userInfo = {
        clusterUuid: payload.clusterUuid,
        alertId: payload.alertId,
        acknowledgeUserId: this.user.userId,
        acknowledgeUserName: this.user.userName,
        resolveUserId: undefined,
        resolveUserName: undefined
      }

      // console.log(payload, '---ack')
      this.$emit('acknowledge', payload)
      this.$emit('close')
    },
    /**
     * [Acknowledge > Alert] 이동
     */
    toResv () {
      const payload = this.setPayload(this.detail)
      payload.userInfo = {
        ...payload.userInfo,
        resolveUserId: this.user.userId,
        resolveUserName: this.user.userName
      }

      // console.log(payload, '---resv')
      this.$emit('resolve', payload)
      this.$emit('close')
    },
    blockCondition (detail = this.detail) {
      // Alert - 기본
      this.disabledAcknowledged = false
      this.disabledResolved = false

      if (!detail.data) return
      const { acknowledged, resolved } = detail?.data

      if (acknowledged && !resolved) { // Acknowlodge
        this.disabledAcknowledged = true
        this.disabledResolved = false
      } else if (acknowledged && resolved) { // Resolve
        this.disabledAcknowledged = true
        this.disabledResolved = true
      }
    }
  },
  data () {
    return {
      contents: [
        { label: this.$t('config.Alerts.risk'), key: '_severity' }, // 위험도
        { label: this.$t('config.Alerts.occur'), key: '_entityTypes' }, // 발생 위치
        { label: this.$t('config.Alerts.ackUser'), key: '_ackedUser' }, // CMP 내 수행 예정자
        { label: this.$t('config.Alerts.resUser'), key: '_reslvedUser' }, // CMP 내 처리 완료자
        { label: 'Acknowledged By', key: 'acknowledgedByUsername' },
        { label: 'Resolved By', key: 'resolvedByUsername' },
        { label: 'Acknowledged Time', key: '_ackTime' },
        { label: 'Resolved Time', key: '_reslvTime' },
        { label: this.$t('common.PLACEHOLDER.remark'), key: 'message' } // 비고
      ],
      disabledAcknowledged: false,
      disabledResolved: false
    }
  }
}
</script>

<style lang="scss" scoped>
.detail-wrapper {
  font-weight: normal;

  .standard-time {
    color: $input-placeholder;
    font-size: 13px;
    display: flex;
    align-items: center;
    margin-bottom: 15px;

    > span {
      display: block;
      &:first-child { margin-right: 10px; }
    }
  }

  .detail-content {
    display: grid;
    grid-template-columns: repeat(2, 50%);
    grid-auto-flow: row;

    .-message {
      grid-row: 5 / 6;
      grid-column: 1 / 3;
      height: 150px;
      overflow-y: auto;
    }
  }

  .detail-model-button {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: $gap-m;

    > button {
      min-width: 130px;
      margin-right: $gap-s;
      &:last-child { margin: 0 }
    }
  }
}
</style>
