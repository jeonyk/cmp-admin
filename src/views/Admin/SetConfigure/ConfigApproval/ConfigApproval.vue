<!--
  * 파일명 : ConfigApproval.vue
  * 파일 기능 : 환경설정 > 결재설정 결재 사용 여부/시스템/주문 연동 및 관리 및 초기화 기능
  * 작성자 : 김진범 외 2명
  * 최종 작성일 : 2020-12-14
  * License By Shinsegae I&C
  * 2020-12-14 방어로직 추가
 -->

<template>
  <div
    class="config-approval"
    v-loading="isLoading"
  >
    <section class="set-list">
      <register-contents
        type="input"
        :title="$t('admin.PREF.isUsePay')"
      >
        <template>
          <div class="input-form">
            <el-radio-group v-model="setting.useYn">
              <el-radio
                :label="true"
              >
                {{ $t('admin.PREF.usePay') }}
              </el-radio>
              <el-radio
                style="margin-left: 20px;"
                :label="false"
              >
                {{ $t('admin.PREF.unusedPay') }}
              </el-radio>
            </el-radio-group>
          </div>
        </template>
      </register-contents>
      <!-- 결재 사용 여부 -->
      <template v-if="setting.useYn === true">
        <register-contents
          type="input"
          :title="$t('admin.PREF.selectPaySystem')"
        >
          <template>
            <div class="input-form">
              <el-radio-group v-model="setting.systemType">
                <el-radio
                  label="INSIDE"
                >
                  {{ $t('admin.PREF.internalSystem') }}
                </el-radio>
                <el-radio
                  style="margin-left: 20px;"
                  label="EXTERNAL"
                >
                  {{ $t('admin.PREF.externalSystem') }}
                </el-radio>
              </el-radio-group>
            </div>
          </template>
        </register-contents>

        <!-- <register-contents
          type="input"
          title="외부 시스템 연동 정보"
          v-if="setting.systemType==='EXTERNAL'"
        >
          <template>
            <div class="input-form -group -link-info">
              <article
                class="sub-contents"
              >
                <h6 class="sub-contents-title">
                  API URL
                </h6>
                <el-input
                  v-model="setting.url"
                />
              </article>
              <article
                class="sub-contents"
              >
                <h6 class="sub-contents-title">
                  ID
                </h6>
                <el-input
                  v-model="setting.id"
                />
              </article>
              <article
                class="sub-contents"
              >
                <h6 class="sub-contents-title">
                  Password
                </h6>
                <el-input
                  v-model="setting.password"
                  show-password
                />
              </article>
              <div class="-buton-area">
                <button class="button">
                  테스트
                </button>
                <button
                  class="button"
                  type="is-primary"
                >
                  저장
                </button>
              </div>
            </div>
          </template>
        </register-contents> -->

        <register-contents
          type="input"
          :title="$t('admin.PREF.payOrderLink')"
        >
          <template>
            <div class="input-form -group">
              <article
                class="sub-contents"
              >
                <h6 class="sub-contents-title">
                  {{ $t('admin.PREF.new') }}
                </h6>
                <el-switch v-model="setting.isNew" />
              </article>
              <article
                class="sub-contents"
              >
                <h6 class="sub-contents-title">
                  {{ $t('admin.PREF.change') }}
                </h6>
                <el-switch v-model="setting.isUpdate" />
              </article>
              <article
                class="sub-contents"
              >
                <h6 class="sub-contents-title">
                  {{ $t('admin.PREF.delete') }}
                </h6>
                <el-switch v-model="setting.isDelete" />
              </article>
            </div>
          </template>
        </register-contents>
      </template>
    </section>

    <section class="big-button-area">
      <button
        class="button"
        type="is-anti"
        @click="init"
      >
        {{ $t('common.BTN.reset') }}
      </button>
      <button
        class="button"
        type="is-primary"
        @click="save"
      >
        {{ $t('common.BTN.apply') }}
      </button>
    </section>
  </div>
</template>
<script>
import API from '@sd-fe/cmp-core'

export default {
  name: 'ConfigApproval',
  components: {
  },
  async created () {
    // ❌
    // const d = await this.getSetting()
    // if (d) {
    //   this.setting = d
    // } else {
    //   this.initData()
    // }

    this.initData()
    this.initSetting = JSON.parse(JSON.stringify(this.setting))
  },
  methods: {
    initData () {
      this.setting = {
        useYn: false,
        systemType: 'INSIDE',
        isNew: false,
        isUpdate: false,
        isDelete: false
      }
    },
    init () {
      this.setting = JSON.parse(JSON.stringify(this.initSetting))
    },
    async save () {
      if (this.setting.useYn === false) {
        this.setting.systemType = 'INSIDE'
      }
      this.$confirm(this.$t('common.CONFIRM.BASE.018'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(async () => {
        await API.work.updateApprovalSetting(this.setting)
        this.initSetting = JSON.parse(JSON.stringify(this.setting))
        this.$alert(this.$t('common.ALERT.BASE.049'), '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          callback: () => { return false }
        })
      }).catch()
    },
    async getSetting () {
      try {
        this.isLoading = true
        const result = await API.work.getApprovalSetting()
        this.isLoading = false
        return result
      } catch (error) {
        this.isLoading = false
        console.error(error)
      }
    }
  },
  data () {
    return {
      isLoading: false,
      initSetting: {},
      setting: {},
      linkOrder: [
        { field: 'new', label: '신규', value: true },
        { field: 'update', label: '변경', value: true },
        { field: 'delete', label: '삭제', value: true }
      ],
      outSystemLinkInfo: [
        { field: 'api', label: 'API URL', value: '' },
        { field: 'id', label: 'ID', value: '' },
        { field: 'password', label: 'Password', value: '' }
      ]
    }
  }
}
</script>
<style lang="scss" scoped>
  .config-approval {
    .set-list {
      margin: auto;
      width: 500px;
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
          > .el-radio {width: 100px;}
        }

        &.-group {
          flex-direction: column;
          align-items: flex-start;
          > .sub-contents {
            display: flex;
            align-items: center;
            width: 100%;
            & + .sub-contents { margin-top: $gap-s;}
            > .sub-contents-title {
              margin-right: $gap;
              min-width: 80px;
              font-weight: normal;
              font-size: 12px;
            }
          }
        }
        &.-link-info {
          position: relative;
          padding: $gap $gap calc(#{$gap} * 2 + 32px) $gap;
          border: 1px solid $gray;
          .-buton-area {
            position: absolute;
            bottom: $gap;
            right: $gap;
          }
        }
      }
    }

    .big-button-area {
      justify-content: center;
      margin-top: $gap;
    }
  }
</style>
