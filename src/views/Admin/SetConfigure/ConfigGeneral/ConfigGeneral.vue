<!--
  * 파일명 : ConfigGeneral.vue
  * 파일 기능 : 환경설정 > 일반설정 자동화, 과금 시작일, 삭제 대기일 설정 및 초기화 기능
  * 작성자 : 정재은 외 2명
  * 최종 작성일 : 2021-01-15
  * License By Shinsegae I&C
  * 2021-01-15 Update: lodash 사용방식 변경
 -->

<template>
  <div
    class="config-general"
    v-loading="isLoading"
  >
    <ul class="set-list">
      <register-contents
        :title="$t('admin.PREF.setBillStart')"
        type="input"
      >
        <div class="flex-wrap">
          <el-input-number
            :min="1"
            :max="90"
            v-model="config.chargeDebounceDay"
            style="width: 80px;"
          />
          <span style="margin-left: 10px;">{{ $t('admin.PREF.afterDays') }}</span>
        </div>
      </register-contents>

      <register-contents
        :title="$t('admin.PREF.setWaitDelete')"
        type="input"
      >
        <div class="flex-wrap">
          <el-input-number
            :min="1"
            :max="90"
            v-model="config.deleteDebounceDay"
            style="width: 80px;"
          />
          <span style="margin-left: 10px;">{{ $t('admin.PREF.afterDays') }}</span>
        </div>
      </register-contents>
      <register-contents
        :title="$v('접근기록 관리')"
        type="input"
      >
        <div class="flex-wrap">
          <el-input-number
            :min="1"
            :max="10"
            v-model="config.accessRecordYear"
            style="width: 80px;"
          />
          <span style="margin-left: 10px;">{{ $v('년') }}</span>
        </div>
      </register-contents>
    </ul>

    <div class="big-button-area">
      <button
        class="button"
        type="is-anti"
        @click="reset"
      >
        {{ $t('common.BTN.reset') }}
      </button>
      <button
        class="button"
        type="is-primary"
        @click="confirm"
      >
        {{ $t('common.BTN.apply') }}
      </button>
    </div>
  </div>
</template>
<script>
import API from '@sd-fe/cmp-core'
import { mapGetters } from 'vuex'

export default {
  name: 'ConfigGeneral',
  components: {
  },
  computed: {
    ...mapGetters(['packageType'])
  },
  mounted () {
    this.getGeneralConfigs()
  },
  methods: {
    confirm () {
      this.$confirm(this.$t('common.CONFIRM.BASE.010'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        this.setGeneralOptions()
        this.$alert('적용되었습니다.')
      }).catch(() => {
        return false
      })
    },
    reset () {
      this.getGeneralConfigs()
    },
    async getGeneralConfigs () {
      try {
        const response = await API.work.getGeneralConfigs()

        for (const x in response) {
          this.config[x] = response[x]
        }

        this.isLoading = false
      } catch (error) {
        this.$alert('설정 정보를 불러올 수 없습니다.')
        console.error(error)
      } finally {
        this.isLoading = false
      }
    },
    async setGeneralOptions () {
      try {
        await API.work.setGeneralConfigs(this.config)
        this.$alert('설정 정보를 저장했습니다.').then(() => {
          this.getGeneralConfigs()
        })
      } catch (err) {
        this.$alert('설정 정보 저장을 실패했습니다')
        this.getGeneralConfigs()
      }
    }
  },
  data () {
    return {
      config: {},
      isLoading: false

    }
  }
}
</script>
<style lang="scss">
  .config-general {
    .set-list {
      margin: auto;
      width: 500px;
      border-top: 1px solid $border-color;
      border-bottom: 1px solid $dark-slate;
      .input-form {
        display: flex;
        align-items: center;
        position: relative;
        // width: 400px;
        &.-group {
          flex-direction: column;
          align-items: flex-start;
          > .sub-contents {
            display: flex;
            align-items: center;
            width: 100%;
            & + .sub-contents { margin-top: $gap;}
            > .sub-contents-title {
              margin-right: $gap-m;
              // min-width: 80px;
              font-weight: normal;
              font-size: 12px;
            }
            > .el-radio-group { display: flex;}
          }
        }
      }
    }
  }
</style>
