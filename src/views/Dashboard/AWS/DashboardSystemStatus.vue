<template>
  <div
    class="ststemp-status-wrapper"
    v-loading="loading"
  >
    <h3 class="section-title3">
      {{ $t('main.DASHBOARD.systemStatus') }}
      <!-- 시스템 현황 -->

      <small v-if="unregisteredCnt >= 0">
        {{ $t('service.PLACEHOLDER.unEnrollSrc') }}: {{ unregisteredCnt }} {{ $t('main.DASHBOARD.count') }}
        <!-- 미등록 자원: {{ unregisteredCnt }}건 -->
      </small>
    </h3>

    <section :class="['status-wrap', { '-plus-ver': packageType === 'PL' }]">
      <span
        v-if="packageType === 'PL'"
        class="not-allowed"
      >
        {{ $t('config.Alerts.noApplyForPlus') }}
        <!-- PLUS 버전에서는 제공되지 않는 기능입니다. -->
      </span>
      <!-- /. PLUS -->

      <article>
        <div class="status-infos">
          <h5>{{ $t('main.DASHBOARD.notice') }} <!-- 공지사항 --> </h5>

          <div class="contents">
            <strong>{{ setCount(data.notice) }}</strong>
            <span class="ea"> {{ $t('main.DASHBOARD.count') }} <!-- 건 --> </span>

            <span
              class="new-tag"
              v-if="data.notice > 0"
            >
              NEW
            </span>

            <i
              class="mdi mdi-chevron-right"
              @click="packageType !== 'PL' ? $router.push({ name: 'notice-list' }) : null"
            />
          </div>
        </div>
      </article>

      <article>
        <div class="status-infos">
          <!-- <h5>업무 사전 협의 건</h5> -->
          <h5>{{ $t('main.DASHBOARD.prior') }}</h5>

          <div class="contents">
            <strong>{{ setCount(data.task) }}</strong>
            <span class="ea"> {{ $t('main.DASHBOARD.count') }} <!-- 건 --> </span>

            <i
              class="mdi mdi-chevron-right"
              @click="$router.push({ name: 'task-conference' })"
            />
          </div>
        </div>
      </article>
    </section>
  </div>
</template>

<script>

import API from '@sd-fe/cmp-core'
import { mapState } from 'vuex'

export default {
  name: 'DashboardSystemStatus',
  props: {
    data: {
      type: Object,
      default: () => {},
      required: true
    }
  },
  computed: {
    ...mapState({
      packageType: state => state.auth.packageType
    })
  },
  async created () {
    this.unregisteredCnt = (this.packageType === 'PL') ? 0 : await this.getAllUnregistersSrc()
  },
  methods: {
    /**
     * 미등록 자원 조회
     */
    async getAllUnregistersSrc () {
      try {
        this.loading = true

        const vmLen = await this.getResult(API.compute.getUnregistersVms()) // Compute
        const svrServerLen = await this.getResult(API.network.getUnregistersVrserver()) // L4
        const csvrServerLen = await this.getResult(API.network.getUnregistersCsvrserver()) // L7
        const groupLen = await this.getResult(API.network.getUnregistersgroup()) // 보안그룹
        const volGroup = await this.getResult(API.compute.getUnregistersVolumeGroups()) // Volumn Group

        // console.log(vmLen, svrServerLen, csvrServerLen, groupLen, volGroup)
        return vmLen + svrServerLen + csvrServerLen + groupLen + volGroup
      } catch (error) {

      } finally {
        this.loading = false
      }
    },
    async getResult (api) {
      try {
        const resp = await api
        return resp.length
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message

        this.$alert(message, '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
        return 0
      }
    }
  },

  data () {
    return {
      loading: false,
      unregisteredCnt: 0,
      setCount (data) {
        if (data) return data > 999 ? '999 +' : data
        else return 0
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.status-wrap {
  display: grid;
  grid-template-columns: 520px 520px 520px;
  column-gap: $gap;
  position: relative;

  &.-plus-ver {
    &::after,
    .not-allowed {
      content: '';
      display: block;
      position: absolute;
      top: 0; left: 0;
      width: 1070px;
      height: 100%;
    }
    &::after { background-color: rgba(0, 0, 0, 0.7); }
    .not-allowed {
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1;
      font-weight: bold;
    }
  }

  .status-infos {
    height: 60px;
    background: $white;
    border-radius: 6px;
    padding: $gap;
    color: $primary;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;

    h5 {
      font-size: 13px;
      font-weight: normal;
    }

    .contents {
      display: flex;
      align-items: center;

      .ea {
        display: inline-block;
        line-height: 15px;
        margin-left: 5px;
        color: $text-black;
      }

      .new-tag {
        height: 15px;
        color: $white;
        padding: 0 5px;
        line-height: 15px;
        background: $primary;
        display: inline-block;
        border-radius: $radius-s;
        font-size: 9px;
        margin-left: $gap-s;
      }

      i {
        color: $text-black;
        display: inline-block;
        margin-left: $gap-s;
        cursor: pointer;
      }
    }
  }
}
</style>
