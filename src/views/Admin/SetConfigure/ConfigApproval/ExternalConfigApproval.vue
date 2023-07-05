<template>
  <div class="config-approval">
    <section class="set-list">
      <register-contents
        type="input"
        :title="$v('외부 결제 시스템 사용 여부')"
      >
        <template>
          <div class="input-form">
            <el-radio-group v-model="use">
              <el-radio
                :label="true"
                style="margin-right: 0px"
              >
                {{ $t("사용") }}
              </el-radio>
              <el-radio
                :label="false"
              >
                {{ $t("미사용") }}
              </el-radio>
            </el-radio-group>
          </div>
        </template>
      </register-contents>

      <!-- 외부 결재 시템 사용 여부 -->
      <register-contents
        v-if="use"
        type="input"
        :title="$v('외부 결제 시스템 타입')"
      >
        <template>
          <div class="">
            <div style="display: flex; align-items:center; margin-bottom:10px;">
              <label class="sub-contents-title">URL</label>
              <div>
                <el-input
                  :placeholder="$v('URL을 입력해주세요.')"
                  v-model="url"
                />
              </div>
            </div>
            <div style="display: flex; align-items:center;">
              <label class="sub-contents-title">IP</label>
              <div>
                <el-input
                  :placeholder="$v('IP를 입력해주세요.')"
                  v-model="ip"
                />
              </div>
            </div>
          </div>
        </template>
      </register-contents>
      <register-contents
        v-if="use"
        type="input"
        :title="$v('외부 결재 문서 발송')"
      >
        <template>
          <div class="input-form -group">
            <article class="sub-contents">
              <h6 class="sub-contents-title">
                {{ $v("사용자") }}
              </h6>
              <el-switch v-model="useSendClient" />
            </article>
            <article class="sub-contents">
              <h6 class="switch-label sub-contents-title">
                {{ $v("관리자") }}
              </h6>
              <el-switch v-model="useSendManage" />
            </article>
          </div>
        </template>
      </register-contents>
    </section>

    <section class="big-button-area">
      <button
        v-if="use"
        class="button"
        type="is-anti"
        @click="reset"
      >
        {{ $t("common.BTN.reset") }}
      </button>
      <button
        class="button"
        type="is-primary"
        @click="apply"
      >
        {{ $t("common.BTN.apply") }}
      </button>
    </section>
  </div>
</template>
<script>
import API from '@sd-fe/cmp-core'
export default {
  name: 'ConfigApproval',
  components: {},
  computed: {
  },
  created () {
    this.getExternalApprovals()
  },
  methods: {
    reset () {
      this.$confirm(this.$v('초기화 하시겠습니까?'))
        .then(() => {
          this.resetConfig()
        })
    },
    apply () {
      this.$confirm(this.$v('저장하시겠습니까?'))
        .then(() => {
          this.setExternalApprovals()
        })
        .catch(() => {

        })
    },
    isValidated (ip) {
      if (this.validateIp(ip) || this.validateUrl(ip)) return true
      return false
    },
    resetConfig () {
      this.getExternalApprovals()
    },
    async setExternalApprovals () {
      const payload = {
        use: this.use,
        useSendClient: this.useSendClient,
        useSendManage: this.useSendManage,
        url: this.url,
        ip: this.ip
      }

      try {
        await API.link.setExternalApprovals(payload)
        this.$alert(this.$v('저장을 성공했습니다.'))
        this.getExternalApprovals()
      } catch (err) {
        this.$alert(this.$v('저장을 실패했습니다.'))
      }
    },
    async getExternalApprovals () {
      try {
        const data = await API.link.getExternalApprovals()
        for (const x in data) {
          this[x] = data[x]
        }
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('에러가 발생했습니다.'))
      }
    }
  },
  data () {
    return {
      systemType: 'INSIDE',
      use: false,
      useSendClient: false,
      useSendManage: false,
      url: '',
      ip: '',
      isLoading: false
    }
  }
}
</script>
<style lang="scss" scoped>
.config-approval {
  &::v-deep {
    .contents-title {
      align-items:center !important;
    }
    .el-input {
      width:220px;
    }

    .el-input__inner {
      border-radius: 2px;
    }
  }
  .set-list {
    margin: auto;
    width: 550px;
    border-top: 1px solid $border-color;
    border-bottom: 1px solid $dark-slate;
    .input-form {
      display: flex;
      align-items: center;
      position: relative;
      width: 400px;
      > .el-radio-group {
        display: flex;
        align-items: center;
        > .el-radio {
          width: 100px;
        }
      }

      &.-group {
        flex-direction: column;
        align-items: flex-start;
        > .sub-contents {
          display: flex;
          align-items: center;
          width: 100%;
          & + .sub-contents {
            margin-top: $gap-s;
          }
        }
      }
    }
  }
}

.sub-contents-title {
  display: inline-block;
  margin-right: $gap;
  min-width: 80px;
  font-weight: normal;
  font-size: 12px;
}

.big-button-area {
  justify-content: center;
  margin-top: $gap;
}
</style>
