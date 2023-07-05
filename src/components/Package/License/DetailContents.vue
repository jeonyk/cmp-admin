<template>
  <div class="license-detail-info">
    <div class="license-detail-info__contents">
      <register-contents
        type="input"
        :title="$t('license.TEXT.buyer')"
      >
        <span class="content">
          {{ manage.companyName }}
        </span>
      </register-contents>
      <register-contents
        type="input"
        :title="$t('license.TEXT.buyerCode')"
      >
        <span class="content">
          {{ manage.companyCode }}
        </span>
      </register-contents>
      <register-contents
        type="input"
        :title="$t('common.TERMS.version')"
      >
        <span class="content">
          {{ packageType }}
        </span>
      </register-contents>
      <register-contents
        type="input"
        :title="$t('license.TEXT.type')"
        style="height: 90px;"
      >
        <span class="content">
          {{ manage.type }}
          <span
            v-if="manage.type === '구독형'"
          >({{ manage.startDate }}~{{ manage.endDate }})</span>
          <div
            v-if="manage.type === '구독형'"
            class="emphasize"
          >
            <span v-if="!expired">
              *
              {{
                $t("license.PLACEHOLDER.expireSubscribe", {
                  day: distanceSubscribeDate
                })
              }}
            </span>
            <span v-else>
              * 구독이 만료되었습니다.
            </span>
          </div>
        </span>
      </register-contents>
      <register-contents
        type="input"
        :title="$t('license.TEXT.nodeCnt')"
      >
        <span class="content">
          {{ manage.nodeCnt }}
        </span>
      </register-contents>
      <register-contents
        type="input"
        :title="$t('admin.ROLE.contactSimple')"
        style="height: 90px;"
      >
        <div class="manager-info">
          <div class="manager-info-left">
            <div class="manager-info-left__name">
              {{ manage.admin }}
            </div>
            <div class="manager-info-left__contact">
              {{ manage.phone }}
            </div>
          </div>
          <div class="manager-info-right">
            <button
              class="button"
              type="is-primary"
              @click="clickCheckManagerInfo"
            >
              {{ $t("license.TEXT.checkManagerInfo") }}
            </button>
          </div>
        </div>
      </register-contents>
      <register-contents
        type="input"
        :title="$t('license.TEXT.purchaseDate')"
      >
        <span class="content">
          {{ manage.purchase }}
        </span>
      </register-contents>
      <register-contents
        type="input"
        :title="$t('common.REGCON.regDate')"
      >
        <span class="content">
          {{ manage.register }}
        </span>
      </register-contents>
      <register-contents
        type="input"
        :title="$t('common.PLACEHOLDER.remark')"
      >
        <span class="content">
          {{ manage.comment ? manage.comment.slice(0, 300) : "-" }}
        </span>
      </register-contents>
    </div>
    <div class="license-detail-info__bottom">
      <div class="license-detail-info__bottom-buttons">
        <button
          v-if="!external"
          class="button"
          type="is-default"
          @click="$router.push({ name: 'cmp-package-management-license' })"
        >
          {{ $t("common.BTN.list") }}
        </button>
        <el-upload
          v-if="external"
          v-loading="isLoadingUpload"
          action=""
          :auto-upload="false"
          :on-change="onChangeFile"
          accept="text/plain"
          :show-file-list="false"
          class="license-key-upload"
        >
          <button
            class="button"
            type="is-primary"
          >
            {{ $t('license.TEXT.uploadKey') }}
          </button>
        </el-upload>
        <button
          class="button"
          type="is-primary"
          @click="clickUpdatePackage"
        >
          {{ $t("common.BTN.modify") }}
        </button>
      </div>
    </div>
    <el-dialog
      :title="$t('license.TEXT.enterPw')"
      width="450px"
      :visible.sync="isActiveCheckPwModal"
      @closed="closedCheckPwModal"
    >
      <div class="check-password">
        <div
          class="info"
          v-html="rawHtml"
        />
        <el-input
          type="password"
          v-model="checkPassword"
          :placeholder="$t('license.TEXT.enterPw')"
          :disabled="isLoadingCheckPw"
          @keypress.enter.native="applyCheckPw"
        />
      </div>
      <section class="modal-button-area">
        <button
          class="button"
          type="is-anti"
          @click="closeCheckPwModal"
          :disabled="isLoadingCheckPw"
        >
          {{ $t("common.BTN.cancel") }}
        </button>
        <button
          class="button"
          type="is-primary"
          @click="applyCheckPw"
          v-loading="isLoadingCheckPw"
          :disabled="isLoadingCheckPw"
        >
          {{ $t("common.BTN.confirm") }}
        </button>
      </section>
    </el-dialog>
    <el-dialog
      :title="$t('license.TEXT.managerInfo')"
      width="450px"
      :visible.sync="isActiveManagerInfoModal"
    >
      <div class="manager-info-modal">
        <register-contents
          :title="$t('admin.ROLE.contactSimple')"
          type="input"
        >
          <el-input
            :value="
              external
                ? externalAdminInfo
                  ? externalAdminInfo.name
                  : ''
                : adminInfo
                  ? adminInfo.name
                  : ''
            "
            disabled
          />
        </register-contents>
        <register-contents
          :title="$t('license.TEXT.managerContact')"
          type="input"
        >
          <el-input
            :value="
              external
                ? externalAdminInfo
                  ? externalAdminInfo.phone
                  : ''
                : adminInfo
                  ? adminInfo.phone
                  : ''
            "
            disabled
          />
        </register-contents>
      </div>
      <section class="modal-button-area">
        <button
          class="button"
          type="is-anti"
          @click="
            e => {
              isActiveManagerInfoModal = false;
              if (external) externalAdminInfo = null;
            }
          "
        >
          {{ $t("common.BTN.close") }}
        </button>
      </section>
    </el-dialog>
    <update-package-mdoal
      :external="external"
      :external-admin-info="externalAdminInfo"
      :active.sync="isActiveUpdatePkgModal"
      :license-data="licenseData"
      :version-name="packageType"
      @close-refresh="closeAndRefresh"
      @close="closeUpdateModal"
    />
    <!-- @close="isActiveUpdatePkgModal = false" -->
  </div>
</template>

<script>
import UpdatePackageMdoal from '@/components/Package/License/Modal/UpdatePackage.vue'
import API from '@sd-fe/cmp-core'
import { mapGetters } from 'vuex'
import dayjs from 'dayjs'

export default {
  name: 'DetailContents',
  props: {
    licenseData: {
      type: Object,
      required: false,
      default: null
    },
    external: {
      type: Boolean,
      required: false,
      default: false
    },
    versions: {
      type: Array,
      required: false,
      default: () => []
    }
  },
  components: {
    UpdatePackageMdoal
  },
  computed: {
    ...mapGetters(['user']),
    manage () {
      if (this.external) return this.licenseData
      return this.licenseData?.licenseManage || {}
    },
    packageType () {
      return this.manage?.packageType.packageTypeName
    },
    distanceSubscribeDate () {
      const start = new Date(dayjs().format('YYYY-MM-DD')).getTime()
      const end = new Date(this.manage.endDate).getTime()

      return Math.floor((end - start) / 86400000)
    },
    expired () {
      if (this.licenseData.type === this.subscriptionMap.PURCHASES) return null

      const endDate = new Date(this.manage.endDate).getTime()
      const now = new Date().getTime()

      return now >= endDate
    }
  },
  watch: {
    /*
    isActiveCheckPwModal: {
      deep: true,
      immediate: true,
      handler (modalOpened) {
        if (modalOpened) {
          const run = this.applyCheckPw
          window.addEventListener('keyup', function () {
            if (event.keyCode === 13) { run() }
          }, { once: true })
        }
      }
    } */
  },
  methods: {
    async onChangeFile (file) {
      this.isLoadingUpload = true

      const form = new FormData()
      form.append('file', file.raw)

      try {
        await API.license.uploadLicenseKey(form)
        this.$alert('라이선스 키를 정상적으로 업로드 하였습니다.', {
          callback: () => {
            window.location.href = '/'
          }
        })
      } catch (error) {
        if (error.response && error.response.data.code) {
          switch (error.response.data.code) {
            case 'LIC011':
              return this.$alert('라이선스 복호화에 실패하였습니다.\n라이선스 키를 확인해주세요.', { dangerouslyUseHTMLString: true })
            case 'LIC013':
              return this.$alert('해당 라이선스가 만료되어 파일을 업로드 할 수 없습니다.')
            case 'LIC501':
              return this.$alert('파일을 읽는데 실패하였습니다.')
            case 'LIC502':
              return this.$alert('파일에서 데이터를 가져오는데 실패하였습니다.')
            case 'LIC503':
              return this.$alert('텍스트 파일이 아닙니다.\n업로드할 파일을 확인해주세요.', { dangerouslyUseHTMLString: true })
            case 'LIC505':
              return this.$alert('모듈을 복호화하는데 실패하였습니다.\n라이선스 파일을 확인해주세요.', { dangerouslyUseHTMLString: true })
            default:
              return this.$alert('파일 업로드에 실패하였습니다.')
          }
        } else {
          return this.$alert('파일 업로드에 실패하였습니다.')
        }
      } finally {
        this.isLoadingUpload = false
      }
    },
    closeUpdateModal () {
      this.isActiveUpdatePkgModal = false
      if (this.external) {
        this.externalAdminInfo = null
      }
    },
    closeAndRefresh () {
      this.isActiveUpdatePkgModal = false
      this.$emit('refresh')
    },
    // 비밀번호 확인 - 모달이 닫히고 트랜지션이 모두 끝난 뒤 실행
    closedCheckPwModal () {
      this.isCheckedExternalManager = false
      this.checkPassword = ''
    },
    clickUpdatePackage () {
      if (this.external) {
        this.isActiveCheckPwModal = true
        this.isCheckedExternalManager = true
      } else {
        this.isActiveUpdatePkgModal = true
      }
    },
    clickCheckManagerInfo () {
      this.isActiveCheckPwModal = true
    },
    closeCheckPwModal () {
      this.isActiveCheckPwModal = false
    },
    applyCheckPw () {
      // test code
      this.isLoadingCheckPw = true

      // 대외 영역
      if (this.external) {
        API.license.getManagerInfoByPw(
          this.licenseData.licenseIdx,
          {
            userId: this.user.userId,
            userPw: this.checkPassword
          },
          true
        )
          .then(result => {
            if (this.isCheckedExternalManager) {
              this.isActiveUpdatePkgModal = true
              this.externalAdminInfo = result.data
            } else {
              this.isActiveManagerInfoModal = true
              this.externalAdminInfo = result.data
            }
          })
          .catch(() => {
            // 비밀번호 틀렸거나 API 오류 여기서 처리
            this.$alert(this.$t('common.ALERT.ACCOUNT.006'))
          })
          .finally(() => {
            this.isLoadingCheckPw = false
            this.isCheckedExternalManager = false
            this.isActiveCheckPwModal = false
            this.checkPassword = ''
          })
      } else {
        // 중앙 영역
        API.license.getManagerInfoByPw(
          this.$route.params.id,
          {
            userId: this.user.userId,
            userPw: this.checkPassword
          },
          false
        )
          .then(result => {
            this.isActiveManagerInfoModal = true
            this.adminInfo = result.data
          })
          .catch(() => {
            this.$alert(this.$t('common.ALERT.ACCOUNT.006'))
          })
          .finally(() => {
            this.isActiveCheckPwModal = false
            this.isLoadingCheckPw = false
            this.checkPassword = ''
          })
      }
    }
  },
  data () {
    return {
      rawHtml: this.isCheckedExternalManager ? this.$t('license.PLACEHOLDER.reEnterPw') : this.$t('license.PLACEHOLDER.reEnterPwInfo'),
      externalAdminInfo: null, // 대외 - 담당자 정보
      adminInfo: null, // 중앙 - 담당자 정보
      isLoadingCheckPw: false,
      isActiveCheckPwModal: false, // 담당자 정보 확인 > 비밀번호 확인 모달
      isActiveUpdatePkgModal: false, // 수정 버튼 > 패키지 수정 모달
      isActiveManagerInfoModal: false, // 비밀번호 확인 모달 > 담당자 정보 모달
      isCheckedExternalManager: false, // 대외 영역에서 담당자 정보 확인시 비밀번호 입력부터 해야하는 거 체크
      checkPassword: '',
      subscriptionMap: {
        PURCHASES: '구매형',
        SUBSCRIBE: '구독형'
      },
      isLoadingUpload: false
    }
  }
}
</script>

<style lang="scss" scoped>
.license-detail-info {
  flex: 0 0 500px;
  height: 730px;
  margin-right: $gap * 2;
  border-radius: 6px;
  border: 1px solid $purple-gray;
  padding: 30px 50px 30px 50px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  &__bottom {
    padding: $gap;
    padding-bottom: 0;
    border-top: 1px solid $purple-gray;

    &-buttons {
      text-align: center;

      & > * + * {
        margin-left: $gap-s;
      }
    }
  }

  & .check-password {
    padding: 0 $gap * 2;

    & .info {
      margin-bottom: $gap;
      text-align: center;
    }
  }

  & .manager-info-modal {
    padding-bottom: $gap-s;
    border-bottom: 1px solid $purple-gray;

    & .register-contents {
      height: 45px;
      align-items: center;

      &::v-deep .contents-title {
        width: 50px;
        min-width: 50px;
      }

      &::v-deep .contents {
        padding-right: 0;
      }
    }
  }

  & .register-contents {
    height: 45px;
    align-items: flex-start;

    & .content {
      color: $white !important;

      & .emphasize {
        color: $mp-red;
        margin-top: $gap-s;
      }
    }

    & .manager-info {
      display: flex;
      justify-content: space-between;

      /* &-left {
        &__contact {
          margin-top: $gap-s;
        }
      } */
    }

    &::v-deep .contents-title {
      color: $light-gray;
      width: 125px;
      min-width: 125px;
    }
  }

  .license-key-upload {
    display: inline-block;
  }
}
</style>
